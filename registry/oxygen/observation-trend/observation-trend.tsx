"use client";

/**
 * ObservationTrend — a series of one measurement over time.
 *
 * Oxygen renders every value as a point in isolation, and that is the one
 * framing that hides deterioration. A potassium of 5.4 means something
 * different if the last three were 4.1, 4.6, 5.0. This is the component that
 * makes the difference visible.
 *
 * A chart is also the one surface where this library's founding rule is
 * genuinely hard. Status is never communicated by colour alone — but you cannot
 * put a text label on every point. Four decisions resolve that:
 *
 *   1. ABNORMALITY IS A SHAPE, not only a hue. Circle in range, triangle up for
 *      high, triangle down for low, square for critical, hollow diamond for
 *      uninterpreted. Direction survives monochrome printing and every common
 *      form of colour vision deficiency, which is the same argument the token
 *      file makes for separating high and low by hue rather than intensity.
 *
 *   2. ONLY WHAT CROSSES IS ANNOTATED. Labelling every point produces a wall of
 *      numbers nobody reads; labelling none makes the chart decorative. Critical
 *      points and the most recent point get a label. This is the visual form of
 *      the interruption budget in AlertBanner.
 *
 *   3. THE TABLE IS A PEER, NOT A FALLBACK. Every chart renders a real <table>
 *      carrying the same data. It is what a screen reader gets — the SVG is
 *      aria-hidden — and a control reveals it visually. A chart with no text
 *      equivalent is unusable to a portion of clinicians and fails the
 *      conformance claim in ACCESSIBILITY.md.
 *
 *   4. NO STATED RANGE, NO BAND. ReferenceRange already refuses to draw when no
 *      numeric bound was supplied; this inherits that. An invented normal band
 *      is a fabricated clinical claim, and it is more dangerous here than on a
 *      single value because a band reads as the definition of normal for the
 *      whole series.
 *
 * What it does NOT do: interpret. Every point's status comes from
 * Observation.interpretation via getInterpretation, or from the observation's
 * own reference range. This component never decides that a value is abnormal.
 */

import * as React from "react";
import {
  INTERPRETATION_LABEL,
  datePrecision,
  formatClinicalDate,
  getInterpretation,
  isCritical,
  quantityParts,
  type Interpretation,
  type Observation,
  type ObservationReferenceRange,
} from "@oxygenui-design/fhir";
import { AbsentValue } from "@/components/oxygen/absent-value";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Geometry — pure, exported so it can be tested without a DOM.        */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  observation: Observation;
  /** Milliseconds since epoch, from effectiveDateTime or issued. */
  at: number;
  value: number;
  /** Exactly as reported. Never re-rounded. */
  display: string;
  unit?: string;
  interpretation: Interpretation;
  /** True when the source stated only a year or a month. */
  impreciseDate: boolean;
}

/**
 * Why a series cannot honestly be drawn on one axis.
 *
 * Both of these render perfectly if you ignore them, which is what makes them
 * worth refusing over. A glucose series that mixes mg/dL and mmol/L plotted
 * against a single axis produces a sawtooth that looks like wild instability
 * and is actually a unit change — the numbers differ by a factor of 18. Two
 * different analytes on one axis is the same failure with a different cause.
 */
export interface TrendConflict {
  kind: "unit" | "code";
  values: string[];
}

export interface TrendSeries {
  points: TrendPoint[];
  /** Observations excluded, and why. Counted rather than silently dropped. */
  excluded: { noValue: number; noTime: number };
  unit?: string;
  /** Set when the series cannot share one axis. The drawing is withheld. */
  conflict?: TrendConflict;
  band?: [number, number];
  /** Y-axis extent actually drawn. */
  scale: [number, number];
}

/** Stable identity for an Observation.code, for detecting a mixed series. */
function codeKey(observation: Observation): string | undefined {
  const coding = observation.code?.coding?.[0];
  if (coding?.code) return `${coding.system ?? ""}|${coding.code}`;
  return observation.code?.text;
}

/**
 * Turn a bundle of observations into something drawable.
 *
 * Exclusions are counted rather than dropped. A trend built from six of nine
 * results that presents itself as the whole series is a worse artifact than no
 * chart at all — the reader has no way to know a gap is a gap.
 */
export function buildSeries(
  observations: Observation[],
  range: ObservationReferenceRange | "from-observations" | "none",
): TrendSeries {
  const points: TrendPoint[] = [];
  let noValue = 0;
  let noTime = 0;

  for (const observation of observations) {
    const parts = quantityParts(observation.valueQuantity);
    if (!parts) {
      noValue += 1;
      continue;
    }

    const raw = observation.effectiveDateTime ?? observation.issued;
    const at = raw ? Date.parse(raw) : Number.NaN;
    if (Number.isNaN(at)) {
      noTime += 1;
      continue;
    }

    const precision = datePrecision(raw);
    points.push({
      observation,
      at,
      value: observation.valueQuantity?.value as number,
      display: parts.value,
      unit: parts.unit,
      interpretation: getInterpretation(observation),
      impreciseDate: precision === "year" || precision === "month",
    });
  }

  points.sort((a, b) => a.at - b.at);

  // The band comes from a stated range or from nothing. `from-observations`
  // takes the first observation that actually carries numeric bounds rather
  // than assuming they all agree — and if none does, there is no band.
  let band: [number, number] | undefined;
  if (range !== "none") {
    const source =
      range === "from-observations"
        ? points.find((p) => {
            const r = p.observation.referenceRange?.[0];
            return typeof r?.low?.value === "number" || typeof r?.high?.value === "number";
          })?.observation.referenceRange?.[0]
        : range;

    const low = typeof source?.low?.value === "number" ? source.low.value : undefined;
    const high = typeof source?.high?.value === "number" ? source.high.value : undefined;
    // A one-sided range is drawable; a range with no numeric bound at all is not.
    if (low !== undefined || high !== undefined) {
      band = [low ?? Number.NEGATIVE_INFINITY, high ?? Number.POSITIVE_INFINITY];
    }
  }

  const values = points.map((p) => p.value);
  let min = values.length ? Math.min(...values) : 0;
  let max = values.length ? Math.max(...values) : 1;

  // The band has to be visible even when every result sits on one side of it,
  // or the chart shows a flat line with no context for whether it is a good one.
  if (band) {
    if (Number.isFinite(band[0])) min = Math.min(min, band[0]);
    if (Number.isFinite(band[1])) max = Math.max(max, band[1]);
  }

  const span = max - min || Math.abs(max) || 1;
  const pad = span * 0.12;

  // A series is drawable only if every point means the same thing measured the
  // same way. Picking the first unit and plotting the rest against it is the
  // silent version of this bug: mg/dL and mmol/L differ by a factor of 18, so
  // the chart renders a cliff where the real event was a unit change.
  const units = [...new Set(points.map((p) => p.unit).filter((u): u is string => Boolean(u)))];
  const codes = [
    ...new Set(points.map((p) => codeKey(p.observation)).filter((c): c is string => Boolean(c))),
  ];

  let conflict: TrendConflict | undefined;
  if (units.length > 1) conflict = { kind: "unit", values: units };
  else if (codes.length > 1) conflict = { kind: "code", values: codes };

  return {
    points,
    excluded: { noValue, noTime },
    unit: units.length === 1 ? units[0] : undefined,
    conflict,
    band,
    scale: [min - pad, max + pad],
  };
}

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

/**
 * Shape per interpretation. Three redundant encodings on a flagged point —
 * shape, colour, and size — because this is the mark a reader is scanning for.
 */
type MarkShape = "circle" | "triangle-up" | "triangle-down" | "square" | "diamond";

const SHAPE: Record<Interpretation, MarkShape> = {
  "critical-high": "square",
  "critical-low": "square",
  high: "triangle-up",
  low: "triangle-down",
  abnormal: "diamond",
  normal: "circle",
  unknown: "diamond",
};

const TONE_VAR: Record<Interpretation, string> = {
  "critical-high": "var(--ox-status-critical)",
  "critical-low": "var(--ox-status-critical)",
  high: "var(--ox-status-high)",
  low: "var(--ox-status-low)",
  abnormal: "var(--ox-status-high)",
  normal: "var(--ox-status-normal)",
  unknown: "var(--ox-status-unknown)",
};

/**
 * One mark, at a fixed pixel size.
 *
 * Its own SVG with matching width/height/viewBox, so it is never subject to the
 * stretch applied to the plot behind it. A square stays square at every
 * container width.
 */
function Mark({ shape, size, fill }: { shape: MarkShape; size: number; fill: string }) {
  const c = size / 2;
  const r = size / 2;

  const body = (() => {
    switch (shape) {
      case "square":
        return <rect x={0} y={0} width={size} height={size} fill={fill} />;
      case "triangle-up":
        return <polygon points={`${c},0 ${size},${size} 0,${size}`} fill={fill} />;
      case "triangle-down":
        return <polygon points={`${c},${size} ${size},0 0,0`} fill={fill} />;
      case "diamond":
        // Hollow: an uninterpreted point must not read as a filled, assessed one.
        return (
          <polygon
            points={`${c},0 ${size},${c} ${c},${size} 0,${c}`}
            fill="var(--ox-chart-surface)"
            stroke={fill}
            strokeWidth="1.5"
          />
        );
      default:
        return <circle cx={c} cy={c} r={r} fill={fill} />;
    }
  })();

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block overflow-visible"
    >
      {body}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface ObservationTrendProps {
  /** Observations sharing one code. Order does not matter; they are sorted. */
  observations: Observation[];
  /**
   * Required, never inferred from the browser. The reader's clock is not the
   * event's clock, and a trend read across a time-zone boundary silently
   * reorders itself.
   */
  timeZone: string;
  /** What the measurement is called. Falls back to the observation's own text. */
  label?: string;
  /**
   * Where the normal band comes from. `"none"` draws no band; an explicit range
   * overrides what the observations carry. There is no option that invents one.
   */
  range?: ObservationReferenceRange | "from-observations" | "none";
  /** How the data table is surfaced. It is always in the DOM for assistive tech. */
  table?: "toggle" | "always";
  height?: number;
  className?: string;
}

/**
 * The drawing is split across two layers, and the reason is the whole
 * accessibility argument for this component.
 *
 * A single stretched SVG cannot carry both. `preserveAspectRatio="none"` is
 * what makes a chart fill its container, and it distorts everything drawn in
 * it: measured in a 1038px container against a 600-unit viewBox, the circle
 * rendered as a 10.4 × 6 ellipse and the critical square as a 15.6 × 9
 * rectangle. Shape is what carries direction when colour cannot, so a distorted
 * mark is not a cosmetic problem — it is the signal being degraded.
 *
 * So:
 *
 *   SVG layer      band and polyline, stretched to fit. Stretching a horizontal
 *                  band and a trend line is not just harmless, it is the
 *                  correct responsive behaviour — the x axis is time.
 *
 *   Overlay layer  marks and labels, positioned with a percentage x and a pixel
 *                  y, at fixed pixel size. Never distorted at any width.
 *
 * The alternative — measuring the container with a ResizeObserver and drawing
 * 1:1 — was tried and rejected. It works, but it makes correctness depend on a
 * callback that does not fire for an element that is not being painted (a
 * background tab, a collapsed panel), and it renders one frame at the wrong
 * width under SSR. This layout is correct on the first server-rendered frame
 * and needs no JavaScript at all.
 */
const VIEW_W = 600;
const PAD_L = 8;
const PAD_R = 8;
const PAD_Y = 14;

export function ObservationTrend({
  observations,
  timeZone,
  label,
  range = "from-observations",
  table = "toggle",
  height = 132,
  className,
}: ObservationTrendProps) {
  const [tableOpen, setTableOpen] = React.useState(table === "always");
  const headingId = React.useId();

  const series = React.useMemo(() => buildSeries(observations, range), [observations, range]);
  const { points, excluded, band, scale, conflict } = series;

  const title = label ?? observations.find((o) => o.code?.text)?.code?.text ?? "Observation";

  // Destructured rather than length-checked: the ends of the series are used
  // for the scale and the summary, and narrowing them here means neither can
  // be reached without a guard.
  const first = points[0];
  const latest = points[points.length - 1];

  if (!first || !latest) {
    return (
      <div className={className}>
        <p className="text-[length:var(--ox-density-font)] font-semibold text-[var(--ox-text)]">
          {title}
        </p>
        <AbsentValue
          field={title}
          variant="block"
          detail={
            excluded.noValue + excluded.noTime > 0
              ? `${excluded.noValue + excluded.noTime} result(s) could not be plotted`
              : undefined
          }
        />
      </div>
    );
  }

  const plotH = height - PAD_Y * 2;
  const [lo, hi] = scale;
  const ySpan = hi - lo || 1;

  const t0 = first.at;
  const timeSpan = latest.at - t0;
  const plotW = VIEW_W - PAD_L - PAD_R;

  // A single point, or several sharing one timestamp, has no time extent. Left-
  // aligning it against a full-width axis reads as "measured at the start of
  // some period"; centring it says only "one reading", which is the truth.
  const x =
    timeSpan === 0
      ? () => PAD_L + plotW / 2
      : (at: number) => PAD_L + ((at - t0) / timeSpan) * plotW;
  const y = (v: number) => PAD_Y + (1 - (v - lo) / ySpan) * plotH;

  // Only what crosses. Critical points always; the most recent point always,
  // because "what is it now" is the question a trend is opened to answer.
  const criticals = points.filter((p) => isCritical(p.interpretation));
  const annotated = criticals.includes(latest) ? criticals : [...criticals, latest];

  const unit = series.unit;

  const summary = [
    `${points.length} result${points.length === 1 ? "" : "s"}`,
    `latest ${latest.display}${latest.unit ? ` ${latest.unit}` : ""}, ${INTERPRETATION_LABEL[latest.interpretation].toLowerCase()}`,
    criticals.length > 0 ? `${criticals.length} critical` : undefined,
    conflict
      ? conflict.kind === "unit"
        ? `not plotted: results use more than one unit (${conflict.values.join(", ")})`
        : `not plotted: results are for more than one code`
      : undefined,
    band || conflict ? undefined : "no reference range stated, so no normal band is shown",
    excluded.noValue > 0 ? `${excluded.noValue} with no value` : undefined,
    excluded.noTime > 0 ? `${excluded.noTime} with no usable time` : undefined,
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <figure className={cn("m-0 flex flex-col gap-1", className)}>
      <figcaption className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span
          id={headingId}
          className="text-[length:var(--ox-density-font)] font-semibold text-[var(--ox-text)]"
        >
          {title}
        </span>
        {unit && (
          <span className="text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
            {unit}
          </span>
        )}
        <span className="text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
          {summary}
        </span>
      </figcaption>

      {/* A series that cannot share one axis is not drawn at all. Refusing is
          the only honest option: a glucose series mixing mg/dL and mmol/L
          differs by a factor of 18, so a single axis renders a unit change as a
          cliff. The table below stays correct because it carries a unit per
          row, which is exactly why it is a peer and not a fallback. */}
      {conflict && (
        <p
          role="note"
          className="rounded-[var(--ox-radius)] border border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] px-[var(--ox-density-pad-x)] py-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]"
        >
          {conflict.kind === "unit"
            ? `Not plotted — these results use more than one unit (${conflict.values.join(", ")}). Plotting them on one axis would show a unit change as a change in the patient. The values are listed below.`
            : `Not plotted — these results are for more than one code, which cannot share an axis. The values are listed below.`}
        </p>
      )}

      {/* The drawing is decoration over the table. Assistive technology gets
          the table, which carries every value rather than a summary of them. */}
      {!conflict && (
        <div
          className="relative w-full rounded-[var(--ox-radius-sm)] bg-[var(--ox-chart-surface)]"
          style={{ height }}
        >
          {/* Stretchable layer: the band and the line. Both are meant to fill the
          width — the x axis is time, and a wider container should show the same
          trend over more pixels. */}
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${VIEW_W} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 block size-full"
          >
            {band && (
              <rect
                x={0}
                y={Number.isFinite(band[1]) ? y(band[1]) : 0}
                width={VIEW_W}
                height={Math.max(
                  1,
                  (Number.isFinite(band[0]) ? y(band[0]) : height) -
                    (Number.isFinite(band[1]) ? y(band[1]) : 0),
                )}
                fill="var(--ox-chart-band-bg)"
                stroke="var(--ox-chart-band-border)"
                strokeWidth="1"
                /* The band's border must not thin out as the plot stretches. */
                vectorEffect="non-scaling-stroke"
              />
            )}

            <polyline
              points={points.map((p) => `${x(p.at)},${y(p.value)}`).join(" ")}
              fill="none"
              stroke="var(--ox-chart-line)"
              strokeWidth="var(--ox-chart-line-width)"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Unstretchable layer: marks and labels. Positioned as a percentage of
          the width and a pixel offset down, so they land exactly where the
          stretched plot puts them while keeping their authored pixel size. */}
          {points.map((p, i) => (
            <span
              key={`mark-${p.at}-${i}`}
              aria-hidden="true"
              className="pointer-events-none absolute"
              style={{
                left: `${(x(p.at) / VIEW_W) * 100}%`,
                top: y(p.value),
                transform: "translate(-50%, -50%)",
              }}
            >
              <Mark
                shape={SHAPE[p.interpretation]}
                /* Out of range is larger as well as differently shaped and
               differently coloured. Three redundant encodings on the mark a
               reader is scanning for. */
                size={p.interpretation === "normal" ? 6 : 9}
                fill={TONE_VAR[p.interpretation]}
              />
            </span>
          ))}

          {annotated.map((p, i) => {
            const py = y(p.value);
            // Flip the label below the point when it would clip the top edge.
            const above = py > PAD_Y + 14;
            const leftPct = (x(p.at) / VIEW_W) * 100;
            return (
              <span
                key={`label-${i}`}
                aria-hidden="true"
                className="pointer-events-none absolute whitespace-nowrap font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-2xs)] font-semibold tabular-nums"
                style={{
                  left: `${leftPct}%`,
                  top: above ? py - 16 : py + 8,
                  // Nudge the end labels inward so neither clips the plot edge.
                  transform: `translateX(${leftPct > 92 ? "-100%" : leftPct < 8 ? "0%" : "-50%"})`,
                  color: TONE_VAR[p.interpretation],
                }}
              >
                {p.display}
              </span>
            );
          })}
        </div>
      )}

      {/* When the drawing was withheld there is nothing left to toggle — the
          table is the only representation, so it is shown outright. */}
      {table === "toggle" && !conflict && (
        <button
          type="button"
          onClick={() => setTableOpen((open) => !open)}
          aria-expanded={tableOpen}
          className="self-start rounded-[var(--ox-radius-sm)] text-[length:var(--ox-text-xs)] font-medium text-[var(--ox-accent)] underline underline-offset-2"
        >
          {tableOpen ? "Hide values" : "Show values"}
        </button>
      )}

      {/* Always rendered. `sr-only` hides it visually without removing it from
          the accessibility tree, which is the entire point — the table is the
          accessible peer of the chart, not a fallback for when it fails. */}
      <div className={tableOpen || conflict ? undefined : "sr-only"}>
        <table className="w-full border-collapse text-[length:var(--ox-text-xs)]">
          <caption className="text-start text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
            {title} — {summary}
          </caption>
          <thead>
            <tr className="border-b border-[var(--ox-border)] text-[var(--ox-text-muted)]">
              <th scope="col" className="py-1 text-start font-medium">
                Time
              </th>
              <th scope="col" className="py-1 text-end font-medium">
                Value
              </th>
              <th scope="col" className="py-1 text-start font-medium">
                Interpretation
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={`row-${p.at}-${i}`} className="border-b border-[var(--ox-border)]">
                <th scope="row" className="py-1 text-start font-normal">
                  {formatClinicalDate(
                    p.observation.effectiveDateTime ?? p.observation.issued,
                    timeZone,
                  )}
                  {p.impreciseDate && (
                    <span className="text-[var(--ox-text-subtle)]"> (date imprecise)</span>
                  )}
                </th>
                <td className="py-1 text-end font-[family-name:var(--ox-font-numeric)] tabular-nums">
                  {p.display}
                  {p.unit ? ` ${p.unit}` : ""}
                </td>
                <td className="py-1">{INTERPRETATION_LABEL[p.interpretation]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}

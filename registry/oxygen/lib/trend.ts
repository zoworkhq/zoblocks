/**
 * A sparkline is a claim that the points are comparable.
 *
 * Three things routinely break that claim, and no charting library checks any
 * of them:
 *
 *   the assay changed   a lab switching immunoassay platforms shifts every
 *                       ferritin by 20% with no clinical change at all
 *   the units changed   silently, in an interface feed
 *   there are two points  and a line between two points is not a trend, it is
 *                       a rhetorical device
 *
 * And a fourth thing, which is not about comparability at all: a falling line
 * is not automatically good news. A falling PHQ-9 is improvement; a falling
 * eGFR is not. Direction has no valence until somebody supplies one, so
 * `valence` is a required prop rather than an assumption baked into a colour.
 *
 * No React, no DOM, no charting library. The path is a string.
 */

/* ------------------------------------------------------------------ */
/* The series                                                          */
/* ------------------------------------------------------------------ */

export interface TrendPoint {
  /** ISO 8601. */
  at: string;
  value: number;
  /**
   * Anything that makes this point incomparable with the one before it.
   *
   * The lab's own words, not a code: "switched to Roche Elecsys", "reported in
   * pmol/L from here". It is rendered verbatim, because a reader deciding
   * whether a 20% shift is clinical needs to know what changed.
   */
  breaksComparability?: string;
  /** The unit this point was measured in, when it can vary within a series. */
  unit?: string;
}

/**
 * Which direction is bad.
 *
 * Required. There is no sensible default: half of clinical measures improve by
 * falling and half by rising, and a library that guesses gets one half wrong
 * silently and in colour.
 */
export type Valence = "higher-is-worse" | "higher-is-better" | "neutral";

export interface TrendSeries {
  /** Stable identity, for memoisation. */
  id: string;
  label: string;
  points: readonly TrendPoint[];
  unit?: string;
  valence: Valence;
  /**
   * The smallest change that is not noise.
   *
   * Reliable-change index, MCID, or a lab's analytic variation. Below it the
   * trend renders as flat — which is the actual clinical rule for a 2-point
   * PHQ-9 move, not a visual flourish.
   */
  significantChange?: number;
  /** Shaded behind the line when present. */
  referenceRange?: { low?: number; high?: number };
  /** Below this many comparable points there is no trend to draw. */
  minPoints?: number;
}

export const DEFAULT_MIN_POINTS = 3;

/* ------------------------------------------------------------------ */
/* Comparability                                                       */
/* ------------------------------------------------------------------ */

export interface Segment {
  points: readonly TrendPoint[];
  /** Why this segment starts. Undefined for the first. */
  breakReason?: string;
}

/**
 * The series split wherever comparability breaks.
 *
 * A unit change is detected as well as declared: an interface feed that starts
 * sending pmol/L without saying so is the case nobody catches by hand, and it
 * is indistinguishable from a real 3.6× rise unless something compares the
 * units point to point.
 */
export function segment(series: TrendSeries): Segment[] {
  const segments: Segment[] = [];
  let current: TrendPoint[] = [];
  let reason: string | undefined;
  let unit = series.points[0]?.unit ?? series.unit;

  for (const point of series.points) {
    const declared = point.breaksComparability;
    const unitChanged = point.unit !== undefined && point.unit !== unit;
    const why = declared ?? (unitChanged ? `unit changed to ${point.unit}` : undefined);

    if (why && current.length) {
      segments.push(reason ? { points: current, breakReason: reason } : { points: current });
      current = [];
      reason = why;
    } else if (why) {
      reason = why;
    }

    if (point.unit) unit = point.unit;
    current.push(point);
  }

  if (current.length) {
    segments.push(reason ? { points: current, breakReason: reason } : { points: current });
  }
  return segments;
}

/** The longest run of comparable points — the one a delta may be drawn from. */
export function comparableRun(series: TrendSeries): Segment | null {
  const segments = segment(series);
  if (!segments.length) return null;
  return segments.reduce((best, s) => (s.points.length > best.points.length ? s : best));
}

/* ------------------------------------------------------------------ */
/* Direction                                                           */
/* ------------------------------------------------------------------ */

export type Direction = "rising" | "falling" | "flat";

/**
 * Whether the reader should be pleased.
 *
 * `unknown` when the caller said `neutral`: weight, for instance, has no
 * valence without a clinical context the component does not have.
 */
export type Judgement = "better" | "worse" | "flat" | "unknown";

export interface TrendReading {
  direction: Direction;
  judgement: Judgement;
  /** Signed, in the series' units. */
  change: number;
  first: TrendPoint;
  last: TrendPoint;
  /** Points actually used — the longest comparable run, not the whole series. */
  used: number;
  /** True when the change is below the significance threshold. */
  withinNoise: boolean;
}

/**
 * The reading, or null when there is not enough comparable data to make one.
 *
 * Null rather than a flat line: an absent trend and a trend that did not move
 * are different facts, and drawing the second for the first is the specific
 * lie this component was built to refuse.
 */
export function readTrend(series: TrendSeries): TrendReading | null {
  const run = comparableRun(series);
  const minPoints = series.minPoints ?? DEFAULT_MIN_POINTS;
  if (!run || run.points.length < minPoints) return null;

  // Guarded by the length check above; narrowed rather than asserted so the
  // rule that catches a real off-by-one stays on.
  const first = run.points[0];
  const last = run.points[run.points.length - 1];
  if (!first || !last) return null;
  const change = Number((last.value - first.value).toFixed(6));

  const threshold = series.significantChange ?? 0;
  const withinNoise = Math.abs(change) < threshold;

  // Below the reliable-change threshold the series is flat, whatever the
  // arithmetic says. A 2-point PHQ-9 move is noise, and rendering it as a
  // direction invites somebody to act on it.
  const direction: Direction =
    withinNoise || change === 0 ? "flat" : change > 0 ? "rising" : "falling";

  let judgement: Judgement = "unknown";
  if (direction === "flat") judgement = "flat";
  else if (series.valence === "higher-is-worse")
    judgement = direction === "rising" ? "worse" : "better";
  else if (series.valence === "higher-is-better")
    judgement = direction === "rising" ? "better" : "worse";

  return { direction, judgement, change, first, last, used: run.points.length, withinNoise };
}

/** Why no trend could be drawn, in words a reader can act on. */
export function whyNoTrend(series: TrendSeries): string {
  const minPoints = series.minPoints ?? DEFAULT_MIN_POINTS;
  const run = comparableRun(series);
  const total = series.points.length;

  if (total === 0) return "No results.";
  if (total === 1) return "One result. A trend needs at least " + minPoints + ".";

  if (run && run.points.length < total) {
    const broken = segment(series).find((s) => s.breakReason);
    return broken?.breakReason
      ? `Not comparable: ${broken.breakReason}. Longest comparable run is ${run.points.length} of ${total}.`
      : `Only ${run.points.length} of ${total} results are comparable.`;
  }

  return `${total} result${total === 1 ? "" : "s"}. A trend needs at least ${minPoints}.`;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export interface PathGeometry {
  /** One `d` per comparable segment. Gaps are gaps, not dashes. */
  paths: string[];
  /** The reference band, in the same viewBox, when the range is in view. */
  band?: { y: number; height: number };
  width: number;
  height: number;
  /** The last point, for the terminus dot. */
  last?: { x: number; y: number };
}

/**
 * One `d` string per comparable segment.
 *
 * Segments are separate paths rather than one path with a dashed gap. A dashed
 * gap is a visual convention a reader has to already know; two lines that do
 * not join are unambiguous, and the reason is in the text beside them.
 *
 * Sixty points in one path element, no per-point DOM.
 */
export function geometry(series: TrendSeries, width = 64, height = 20, padding = 2): PathGeometry {
  const all = series.points;
  if (!all.length) return { paths: [], width, height };

  const values = all.map((p) => p.value);
  const times = all.map((p) => Date.parse(p.at));

  let min = Math.min(...values);
  let max = Math.max(...values);

  // A flat series would divide by zero and, more importantly, would render as
  // a line at the top of the box — which reads as a maximum.
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const span = t1 - t0 || 1;

  const inner = height - padding * 2;
  const x = (t: number) => ((t - t0) / span) * width;
  const y = (v: number) => padding + inner - ((v - min) / (max - min)) * inner;

  const paths = segment(series)
    .map((s) =>
      s.points
        .map(
          (p, index) =>
            `${index === 0 ? "M" : "L"}${x(Date.parse(p.at)).toFixed(2)} ${y(p.value).toFixed(2)}`,
        )
        .join(" "),
    )
    .filter((d) => d.includes("L") || d.length > 0);

  const out: PathGeometry = { paths, width, height };

  const lastPoint = all[all.length - 1];
  if (lastPoint) out.last = { x: x(Date.parse(lastPoint.at)), y: y(lastPoint.value) };

  const range = series.referenceRange;
  if (range && (range.low !== undefined || range.high !== undefined)) {
    const top = y(range.high ?? max);
    const bottom = y(range.low ?? min);
    out.band = { y: Math.min(top, bottom), height: Math.abs(bottom - top) };
  }

  return out;
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

const DIRECTION_WORD: Record<Direction, string> = {
  rising: "rising",
  falling: "falling",
  flat: "unchanged",
};

const JUDGEMENT_WORD: Record<Judgement, string> = {
  better: "improving",
  worse: "worsening",
  flat: "stable",
  unknown: "",
};

/**
 * The whole trend as one spoken statement.
 *
 * The direction and the judgement are both said, because they are different
 * facts: "falling, improving" for a PHQ-9 and "falling, worsening" for an
 * eGFR. A component that spoke only one of them would be unreadable for
 * exactly the readers who most need the text alternative.
 */
export function describeTrend(series: TrendSeries): string {
  const reading = readTrend(series);
  if (!reading) return `${series.label}: no trend. ${whyNoTrend(series)}`;

  const unit = series.unit ? ` ${series.unit}` : "";
  const parts = [
    `${series.label}: ${DIRECTION_WORD[reading.direction]}`,
    JUDGEMENT_WORD[reading.judgement],
    reading.withinNoise
      ? `changed ${Math.abs(reading.change)}${unit}, within the noise threshold of ${series.significantChange}${unit}`
      : `${reading.change > 0 ? "up" : reading.change < 0 ? "down" : "unchanged by"} ${Math.abs(reading.change)}${unit}`,
    `over ${reading.used} results`,
    `latest ${reading.last.value}${unit}`,
  ].filter(Boolean);

  const broken = segment(series).find((s) => s.breakReason);
  if (broken?.breakReason) parts.push(`series broken: ${broken.breakReason}`);

  return `${parts.join(", ")}.`;
}

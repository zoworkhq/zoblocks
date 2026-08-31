// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/trend-indicator/trend-indicator.tsx. Edit that file, not this one.
/**
 * TrendIndicator — a sparkline that refuses to draw a trend it cannot justify.
 *
 *     <TrendIndicator series={{ id, label, points, valence: "higher-is-worse" }} />
 *
 * Below three comparable points it draws no line and says why. Where an assay,
 * a method or a unit changed it breaks the series and states the reason —
 * a dashed gap is a convention a reader has to already know, and two lines
 * that do not join are unambiguous.
 *
 * `valence` is required. Half of clinical measures improve by falling and half
 * by rising: a falling PHQ-9 is improvement, a falling eGFR is not. A library
 * that guesses gets one half wrong silently, and in colour.
 *
 * One SVG path per segment, memoised on series identity. No chart library,
 * no per-point DOM, and it renders the same on a server.
 *
 * Styling lives in `styles/oxygen-trend.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  describeTrend,
  geometry,
  readTrend,
  segment,
  whyNoTrend,
  type TrendSeries,
} from "../../lib/trend";

export {
  DEFAULT_MIN_POINTS,
  comparableRun,
  describeTrend,
  geometry,
  readTrend,
  segment,
  whyNoTrend,
  type Direction,
  type Judgement,
  type PathGeometry,
  type Segment,
  type TrendPoint,
  type TrendReading,
  type TrendSeries,
  type Valence,
} from "../../lib/trend";

export interface TrendIndicatorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /**
   * The points, oldest first. A direction is drawn only when the units and the method match
   * across them.
   */
  series: TrendSeries;
  /** Caller's choice. Below 40px the line is dropped for the glyph and delta. */
  width?: number;
  /**
   * Drawing height in pixels. The sparkline scales to it; the labels do not, so very small
   * heights lose the axis rather than the numbers.
   */
  height?: number;
  /**
   * An element id holding the series as text.
   *
   * When absent the component emits its own visually-hidden table. A sparkline
   * with no text alternative is unreadable and unsearchable, and "decorative"
   * is not true of a line somebody is about to act on.
   */
  describedBy?: string;
  /**
   * Fired when a point is chosen. Supplying it makes the points interactive; without it the
   * trend is a picture.
   */
  onSelectPoint?: (index: number, series: TrendSeries) => void;
}

/** Below this the line is unreadable and the glyph is more honest. */
const MIN_LINE_WIDTH = 40;

function TrendIndicatorImpl({
  series,
  width = 64,
  height = 20,
  describedBy,
  onSelectPoint,
  className,
  ...rest
}: TrendIndicatorProps) {
  const reading = readTrend(series);
  const breaks = React.useMemo(() => segment(series).filter((s) => s.breakReason), [series]);
  const path = React.useMemo(() => geometry(series, width, height), [series, width, height]);

  const tableId = React.useId();
  const label = describeTrend(series);
  const drawLine = reading !== null && width >= MIN_LINE_WIDTH;

  return (
    <div
      {...rest}
      className={cn("ox-trend", className)}
      data-ox-trend=""
      data-ox-direction={reading?.direction ?? "none"}
      data-ox-judgement={reading?.judgement ?? "unknown"}
      data-ox-noise={reading?.withinNoise ? "" : undefined}
      role="figure"
      aria-label={label}
      aria-describedby={describedBy ?? tableId}
    >
      {drawLine ? (
        <svg
          className="ox-trend__chart"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          // The figure carries the name and the table carries the data. The
          // svg itself is neither, so it stays out of the tree entirely.
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="none"
        >
          {path.band ? (
            <rect
              className="ox-trend__band"
              x={0}
              y={path.band.y}
              width={width}
              height={path.band.height}
            />
          ) : null}
          {/*
            One path per comparable segment. Two lines that do not join say
            "these are not the same series" without a legend; a dashed gap
            says it only to someone who already knows the convention.
          */}
          {path.paths.map((d, index) => (
            <path key={index} className="ox-trend__line" d={d} fill="none" />
          ))}
          {path.last ? (
            <circle className="ox-trend__terminus" cx={path.last.x} cy={path.last.y} r={1.75} />
          ) : null}
        </svg>
      ) : null}

      {/*
        The glyph carries direction independently of the colour, and it is the
        only thing left below 40px — never an unreadable line.
      */}
      {reading ? (
        <span className="ox-trend__readout" aria-hidden="true">
          <span className="ox-trend__glyph" data-ox-direction={reading.direction} />
          <span className="ox-trend__delta">
            {reading.change > 0 ? "+" : ""}
            {reading.change}
            {series.unit ? <span className="ox-trend__unit">{series.unit}</span> : null}
          </span>
        </span>
      ) : (
        // Not a flat line. An absent trend and a trend that did not move are
        // different facts, and drawing the second for the first is the lie
        // this component exists to refuse.
        <span className="ox-trend__none" aria-hidden="true">
          {whyNoTrend(series)}
        </span>
      )}

      {breaks.length ? (
        <span className="ox-trend__break" aria-hidden="true">
          {breaks[0]?.breakReason}
        </span>
      ) : null}

      {/*
        The text alternative, emitted unless the host supplied one.
        A sparkline with no series behind it is unreadable to a screen reader
        and invisible to a page search, and neither is acceptable for a line
        somebody is about to act on.
      */}
      {describedBy ? null : (
        <table id={tableId} className="ox-trend__table">
          <caption>{series.label}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Value{series.unit ? ` (${series.unit})` : ""}</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {series.points.map((point, index) => (
              <tr key={`${point.at}-${index}`}>
                <th scope="row">{point.at}</th>
                <td>
                  {onSelectPoint ? (
                    <button type="button" onClick={() => onSelectPoint(index, series)}>
                      {point.value}
                    </button>
                  ) : (
                    point.value
                  )}
                </td>
                <td>{point.breaksComparability ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/**
 * Memoised on the series identity.
 *
 * A flowsheet renders one of these per row and re-renders on every filter
 * keystroke. Comparing the whole object would defeat that: hosts rebuild
 * series from a query response, so the reference changes even when nothing
 * did.
 */
export const TrendIndicator = React.memo(TrendIndicatorImpl, (a, b) => {
  return (
    a.series.id === b.series.id &&
    a.series.points === b.series.points &&
    a.series.valence === b.series.valence &&
    a.width === b.width &&
    a.height === b.height &&
    a.describedBy === b.describedBy &&
    a.onSelectPoint === b.onSelectPoint &&
    a.className === b.className
  );
});

TrendIndicator.displayName = "TrendIndicator";

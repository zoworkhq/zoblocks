"use client";

/**
 * ReferenceRange — positions a result against its own reference range.
 *
 * A badge tells you a potassium is high. It does not tell you whether it is
 * 5.2 or 6.8, and those are different afternoons. The bar answers "how far
 * out", which is the question a clinician actually has.
 *
 * The discipline here is refusing to draw:
 *
 *   - No numeric bound in the range? No bar. A text-only range ("see report")
 *     cannot be positioned, and a drawn scale would imply bounds nobody stated.
 *   - Value off the end of the scale? Clamped WITH an explicit off-scale
 *     marker, never silently pinned to the edge as though it were merely
 *     borderline.
 *   - One-sided range? Drawn, but the inferred end is marked as inferred.
 *
 * The bar is decorative. Everything it shows is also present as text, because
 * a positional graphic is unreadable to a screen reader and unreliable in
 * print, and this is a component people print.
 */

import * as React from "react";
import {
  formatReferenceRange,
  rangeGeometry,
  type Interpretation,
  type ObservationReferenceRange,
} from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

/**
 * Class names written out in full — a template literal built from the
 * interpretation produces no CSS and the marker loses its severity colour.
 */
const MARKER_CLASS: Record<Interpretation, string> = {
  "critical-high": "bg-[var(--ox-status-critical)]",
  "critical-low": "bg-[var(--ox-status-critical)]",
  high: "bg-[var(--ox-status-high)]",
  low: "bg-[var(--ox-status-low)]",
  abnormal: "bg-[var(--ox-status-high)]",
  normal: "bg-[var(--ox-status-normal)]",
  unknown: "bg-[var(--ox-status-unknown)]",
};

export interface ReferenceRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The measured value. */
  value?: number;
  /** The range this observation carries. Never a global constant for the analyte. */
  range?: ObservationReferenceRange;
  /** Drives the marker colour. Pass the interpretation already resolved. */
  interpretation?: Interpretation;
  /** Show the numeric bounds beside the bar. */
  showBounds?: boolean;
  /** Text shown when no range exists. This is the common case, not an error. */
  noRangeLabel?: string;
}

export function ReferenceRange({
  value,
  range,
  interpretation = "unknown",
  showBounds = true,
  noRangeLabel = "No reference range",
  className,
  ...props
}: ReferenceRangeProps) {
  const geometry = rangeGeometry(value, range);
  const bounds = formatReferenceRange(range);

  // Nothing honest to draw. Say so in words rather than rendering an empty
  // track, which reads as "in range".
  if (!geometry) {
    return (
      <span
        className={cn("text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]", className)}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        {bounds ?? noRangeLabel}
      </span>
    );
  }

  const [bandStart, bandEnd] = geometry.band;

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {/*
        The whole graphic is hidden from assistive technology. The value, the
        bounds, and the interpretation are all announced by the surrounding
        row; repeating them here as a nameless graphic adds noise, not access.
      */}
      <div
        aria-hidden="true"
        className="relative h-[5px] min-w-16 flex-1 rounded-full bg-[var(--ox-bg-muted)]"
      >
        <div
          className="absolute inset-y-0 rounded-full bg-[var(--ox-status-normal-border)]"
          style={{ left: `${bandStart * 100}%`, right: `${(1 - bandEnd) * 100}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full",
            "ring-2 ring-[var(--ox-surface)]",
            MARKER_CLASS[interpretation],
            // Off-scale gets a square marker as well as a position, so the
            // "this is beyond the chart" fact survives greyscale and print.
            geometry.offScale && "rounded-[1px]",
          )}
          style={{ left: `${geometry.position * 100}%` }}
        />
      </div>

      {showBounds && bounds && (
        <span className="whitespace-nowrap font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-xs)] tabular-nums text-[var(--ox-text-subtle)]">
          {bounds}
        </span>
      )}

      {/* Both caveats are text, because neither survives as a shape alone. */}
      {geometry.offScale && (
        <span className="whitespace-nowrap text-[length:var(--ox-text-xs)] font-medium text-[var(--ox-status-critical)]">
          off scale
        </span>
      )}
      {!geometry.offScale && geometry.oneSided && (
        <span className="whitespace-nowrap text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]">
          one-sided
        </span>
      )}
    </div>
  );
}

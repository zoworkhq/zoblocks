"use client";

/**
 * InfusionLoader — a capsule with a soft slug, named for the one device in a
 * hospital that displays a percentage and means it.
 *
 * The only loader in the set that can tell the truth about how much is left.
 * Pass `progress` and it becomes a real 0–100 measurement with
 * `role="progressbar"`; leave it off and the slug drifts end to end as an
 * honest "unknown".
 *
 * The two modes are deliberately different animations, not one animation with a
 * value bolted on. A determinate bar that also drifts is telling a reader that
 * a measurement is moving when it is not — and on an import, a batch upload, or
 * a records transfer, "moving" is the fact they are watching for.
 *
 * Use it only where progress is genuinely known. A fabricated percentage that
 * sits at 90% is worse than a loader that never claimed to know.
 */

import * as React from "react";
import {
  LOADER_VIEWBOX,
  LoaderFrame,
  clamp,
  cycleMs,
  resolveLoaderSize,
  type LoaderCommonProps,
} from "@/lib/oxygen-loader";

/**
 * Geometry of the capsule, in viewBox units.
 *
 * The slug never starts at zero width: 0% still has to look like a bar someone
 * is watching rather than an empty track that failed to render.
 */
const TRACK_X = 12;
const SLUG_MIN = 30;
const SLUG_MAX = 136;
/** Indeterminate slug width — wide enough to read as a body of fluid, not a dot. */
const DRIFT_WIDTH = 48;

/** Width of the determinate slug at a given percentage. */
export function slugWidth(percent: number): number {
  return SLUG_MIN + (clamp(percent, 0, 100) / 100) * (SLUG_MAX - SLUG_MIN);
}

export type InfusionLoaderProps = LoaderCommonProps;

export function InfusionLoader({ speed = 1, size, progress, ...props }: InfusionLoaderProps) {
  const px = resolveLoaderSize(size, "xl");
  const determinate = typeof progress === "number";
  const value = determinate ? clamp(progress, 0, 100) : undefined;

  return (
    <LoaderFrame
      {...props}
      progress={progress}
      variant="infusion"
      vars={{
        "--ox-loader-size": `${px}px`,
        "--ox-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--ox-loader-stroke": "2.4px",
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.infusion} focusable="false">
          <rect
            className="ox-loader__stroke ox-loader__track"
            x="4"
            y="4"
            width="152"
            height="40"
            rx="20"
          />
          <rect
            className="ox-loader__fill ox-loader__slug"
            x={TRACK_X}
            y="9"
            width={determinate ? slugWidth(value ?? 0) : DRIFT_WIDTH}
            height="30"
            rx="15"
            opacity="0.9"
          />
        </svg>
      }
    />
  );
}

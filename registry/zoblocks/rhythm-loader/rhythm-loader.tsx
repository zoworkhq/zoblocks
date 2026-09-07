"use client";

/**
 * RhythmLoader — one PQRST complex on a baseline, swept like a monitor.
 *
 * The quietest way to say "still here". No symbol, no scaling, nothing that
 * grows: a bright head with a dimmer tail travels the trace once per beat over
 * a faint static track, and the line itself never disappears.
 *
 * This is the right default for clinical density and for any workflow where a
 * beating heart would jar — resuscitation, cardiology, bereavement. It is also
 * the only cardiac loader that survives at 20px, so it is what PulseLoader
 * renders when it is asked to be small.
 *
 * The shape is a rhythm strip, the artifact a clinician actually reads, rather
 * than the zig-zag that decorative "ECG" graphics use: P wave, QRS complex,
 * T wave, in that order and in those proportions.
 */

import * as React from "react";
import {
  LOADER_ART,
  LOADER_VIEWBOX,
  LoaderFrame,
  beatMs,
  clamp,
  cycleMs,
  resolveLoaderSize,
  strokePx,
  type LoaderCommonProps,
} from "@/lib/zoblocks-loader";

export interface RhythmLoaderProps extends LoaderCommonProps {
  /** Beats per minute, 40–100. Clamped to a resting range. */
  bpm?: number;
}

export function RhythmLoader({ bpm, speed = 1, size, ...props }: RhythmLoaderProps) {
  const px = resolveLoaderSize(size, "lg");
  const beat = beatMs(bpm, speed);

  return (
    <LoaderFrame
      {...props}
      variant="rhythm"
      vars={{
        "--zb-loader-size": `${px}px`,
        "--zb-loader-beat": `${beat}ms`,
        "--zb-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--zb-loader-stroke": `${strokePx(px)}px`,
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.rhythm} focusable="false">
          <path className="zb-loader__stroke zb-loader__track" d={LOADER_ART.strip} />
          <path
            className="zb-loader__stroke zb-loader__tail"
            pathLength={100}
            d={LOADER_ART.strip}
          />
          <path
            className="zb-loader__stroke zb-loader__head"
            pathLength={100}
            d={LOADER_ART.strip}
          />
        </svg>
      }
    />
  );
}

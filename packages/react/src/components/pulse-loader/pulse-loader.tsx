"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/pulse-loader/pulse-loader.tsx. Edit that file, not this one.
/**
 * PulseLoader — an open heart with a rhythm line running through it.
 *
 * The library's signature wait. The heart draws itself once on mount and then
 * beats at a resting 60bpm while a monitor sweep crosses the line, one pass per
 * beat, over a faint static track.
 *
 * Three decisions worth stating, because each one is a defect if reversed:
 *
 *   1. The heart is open at both sides. The gap is what the rhythm line passes
 *      through; closing it turns a clinical mark into a valentine.
 *   2. It draws once, not once per loop. A shape that re-draws every few
 *      seconds puts a seam in the animation, and the eye catches a seam long
 *      before it catches a loop.
 *   3. Below 40px it renders the rhythm line alone. The heart's detail
 *      collapses at that size into a teal smudge, and a smudge is not a brand.
 *      RhythmLoader is what a small pulse actually looks like, so this returns
 *      it rather than a worse version of itself.
 *
 * A beating heart is not neutral in every workflow. In resuscitation, cardiac,
 * or bereavement contexts, reach for RhythmLoader or BreathLoader instead —
 * see the guidance on the component page.
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
} from "../../lib/loader";
import { RhythmLoader } from "../../components/rhythm-loader/rhythm-loader";

/** Below this the heart stops being legible and the rhythm line takes over. */
export const PULSE_MIN_SIZE_PX = 40;

export interface PulseLoaderProps extends LoaderCommonProps {
  /**
   * Beats per minute, 40–100. Clamped, because this is decoration on a
   * healthcare screen and a loader beating at 180 would be read as a number by
   * the only people qualified to read it.
   */
  bpm?: number;
}

export function PulseLoader({ bpm, speed = 1, size, ...props }: PulseLoaderProps) {
  const px = resolveLoaderSize(size, "xl");

  // Not a fallback — the correct rendering of this mark at this size.
  if (px < PULSE_MIN_SIZE_PX) {
    return <RhythmLoader bpm={bpm} speed={speed} size={px} {...props} />;
  }

  const beat = beatMs(bpm, speed);

  return (
    <LoaderFrame
      {...props}
      variant="pulse"
      vars={{
        "--zb-loader-size": `${px}px`,
        "--zb-loader-beat": `${beat}ms`,
        "--zb-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--zb-loader-stroke": `${strokePx(px)}px`,
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.pulse} focusable="false">
          <g className="zb-loader__beat">
            <path
              className="zb-loader__stroke zb-loader__draw"
              pathLength={100}
              d={LOADER_ART.heartTop}
            />
            <path
              className="zb-loader__stroke zb-loader__draw"
              pathLength={100}
              d={LOADER_ART.heartBottom}
            />
          </g>
          <path className="zb-loader__stroke zb-loader__track" d={LOADER_ART.heartLine} />
          <path
            className="zb-loader__stroke zb-loader__tail"
            pathLength={100}
            d={LOADER_ART.heartLine}
          />
          <path
            className="zb-loader__stroke zb-loader__head"
            pathLength={100}
            d={LOADER_ART.heartLine}
          />
        </svg>
      }
    />
  );
}

/**
 * The page-boot preset: the loader covering the viewport, labelled, at rest.
 *
 * Exists because the settings a full-page wait needs are not the defaults an
 * inline one needs, and every application otherwise rediscovers them.
 */
export function PageLoader({ mode = "page", size = "xl", ...props }: PulseLoaderProps) {
  return <PulseLoader mode={mode} size={size} {...props} />;
}

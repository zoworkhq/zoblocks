"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/breath-loader/breath-loader.tsx. Edit that file, not this one.
/**
 * BreathLoader — three rings expanding and fading from a soft core.
 *
 * Paced at roughly fifteen cycles a minute, which is a resting respiratory
 * rate. That is the whole idea: a spinner's tempo says "the system is working
 * hard", and breathing says "you can wait". On a patient-facing screen — a
 * results page, a portal login, a check-in kiosk — the second one is almost
 * always what the product means.
 *
 * It carries no clinical symbol at all, which makes it the safe default across
 * specialties: nothing here reads as cardiac, oncological, or obstetric to
 * someone who is about to receive news. The core is also a slot: pass
 * `children` and a customer's logo mark sits inside the rings.
 */

import * as React from "react";
import {
  LOADER_VIEWBOX,
  LoaderFrame,
  clamp,
  cycleMs,
  resolveLoaderSize,
  strokePx,
  type LoaderCommonProps,
} from "../../lib/loader";

export type BreathLoaderProps = LoaderCommonProps;

export function BreathLoader({ speed = 1, size, ...props }: BreathLoaderProps) {
  const px = resolveLoaderSize(size, "lg");

  return (
    <LoaderFrame
      {...props}
      variant="breath"
      vars={{
        "--ox-loader-size": `${px}px`,
        "--ox-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--ox-loader-stroke": `${strokePx(px)}px`,
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.breath} focusable="false">
          {/* Three rings on one cycle, a third apart, so the field never empties. */}
          <circle className="ox-loader__stroke ox-loader__ring" cx="60" cy="60" r="54" />
          <circle className="ox-loader__stroke ox-loader__ring" cx="60" cy="60" r="54" />
          <circle className="ox-loader__stroke ox-loader__ring" cx="60" cy="60" r="54" />
          <circle className="ox-loader__fill ox-loader__core" cx="60" cy="60" r="11" />
        </svg>
      }
    />
  );
}

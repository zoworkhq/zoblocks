"use client";

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
} from "@/lib/zoblocks-loader";

export interface BreathLoaderProps extends LoaderCommonProps {
  /**
   * A brand mark rendered in place of the core.
   *
   * Decorative: it sits inside the aria-hidden art, so a logo never becomes a
   * second announcement on a wait that already has a label.
   */
  children?: React.ReactNode;
}

export function BreathLoader({ speed = 1, size, children, ...props }: BreathLoaderProps) {
  const px = resolveLoaderSize(size, "lg");

  return (
    <LoaderFrame
      {...props}
      variant="breath"
      vars={{
        "--zb-loader-size": `${px}px`,
        "--zb-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--zb-loader-stroke": `${strokePx(px)}px`,
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.breath} focusable="false">
          {/* Three rings on one cycle, a third apart, so the field never empties. */}
          <circle className="zb-loader__stroke zb-loader__ring" cx="60" cy="60" r="54" />
          <circle className="zb-loader__stroke zb-loader__ring" cx="60" cy="60" r="54" />
          <circle className="zb-loader__stroke zb-loader__ring" cx="60" cy="60" r="54" />
          {/* The core is the slot: a supplied mark replaces it rather than
              sitting behind it. */}
          {children ? null : (
            <circle className="zb-loader__fill zb-loader__core" cx="60" cy="60" r="11" />
          )}
        </svg>
      }
      mark={children}
    />
  );
}

"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/helix-loader/helix-loader.tsx. Edit that file, not this one.
/**
 * HelixLoader — two strands of dots turning on a slow sine.
 *
 * For the parts of a healthcare product that are laboratory rather than
 * bedside: genomics, pathology, diagnostics, research tooling. It says
 * "analysis is running" the way the cardiac loaders say "a person is waiting".
 *
 * Depth is faked with scale and opacity rather than a 3D transform, so the two
 * strands read as passing in front of and behind each other while staying
 * compositor-cheap and rendering identically in every browser. The phase offset
 * per column is what turns eighteen independent dots into one rotation.
 *
 * The most specific of the five, and deliberately so: a scheduling product
 * should not reach for this, and a sequencing product should not settle for a
 * generic ring.
 */

import * as React from "react";
import {
  LOADER_VIEWBOX,
  LoaderFrame,
  clamp,
  cycleMs,
  resolveLoaderSize,
  type LoaderCommonProps,
  type LoaderVars,
} from "../../lib/loader";

/** Columns across the strand. Nine reads as a helix; fewer reads as dots. */
const COLUMNS = 9;

const DOTS = Array.from({ length: COLUMNS }, (_, index) => ({
  x: 12 + index * 17,
  /** Strand B trails strand A by half a turn — that is what crosses them. */
  phaseA: -(index / COLUMNS),
  phaseB: -(index / COLUMNS) - 0.5,
}));

export type HelixLoaderProps = LoaderCommonProps;

export function HelixLoader({ speed = 1, size, ...props }: HelixLoaderProps) {
  const px = resolveLoaderSize(size, "xl");

  return (
    <LoaderFrame
      {...props}
      variant="helix"
      vars={{
        "--zb-loader-size": `${px}px`,
        "--zb-loader-cycle": `${cycleMs(4000, clamp(speed, 0.5, 2))}ms`,
        "--zb-loader-stroke": "1.5px",
      }}
      art={
        <svg viewBox={LOADER_VIEWBOX.helix} focusable="false">
          <line className="zb-loader__stroke zb-loader__track" x1="8" y1="30" x2="152" y2="30" />
          {DOTS.map((dot) => (
            <circle
              key={`a-${dot.x}`}
              className="zb-loader__fill zb-loader__dot"
              style={{ "--zb-loader-phase": dot.phaseA } as LoaderVars}
              cx={dot.x}
              cy="30"
              r="4.2"
            />
          ))}
          {DOTS.map((dot) => (
            <circle
              key={`b-${dot.x}`}
              className="zb-loader__fill zb-loader__dot"
              style={{ "--zb-loader-phase": dot.phaseB } as LoaderVars}
              cx={dot.x}
              cy="30"
              r="4.2"
            />
          ))}
        </svg>
      }
    />
  );
}

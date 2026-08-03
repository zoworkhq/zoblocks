"use client";

/**
 * TelemetryTrace — the page's signature element.
 *
 * A waveform that reads as a patient monitor, wired to whichever state the
 * live demo is currently showing. Switch the demo to a critical result and the
 * trace changes rate, amplitude, and color to match.
 *
 * That wiring is the whole point. A decorative loop would contradict the
 * product's central claim — that severity is never ornament — on the very
 * page making the claim. Here the motion carries the same information the
 * components carry, in the same direction.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type TraceMode = "normal" | "critical" | "quiet";

interface TraceShape {
  /** Beats across the full width. Higher reads as a faster rate. */
  beats: number;
  /** R-wave height as a fraction of the band. */
  amplitude: number;
  /** Seconds for the highlight to travel the full width. */
  sweepDuration: number;
  color: string;
}

const SHAPES: Record<TraceMode, TraceShape> = {
  normal: { beats: 4, amplitude: 0.62, sweepDuration: 3.4, color: "var(--color-trace)" },
  critical: { beats: 7, amplitude: 0.94, sweepDuration: 1.5, color: "var(--color-critical-lum)" },
  quiet: { beats: 3, amplitude: 0.14, sweepDuration: 5.5, color: "var(--color-graphite-soft)" },
};

/**
 * One PQRST complex in normalized space: x across the beat (0–1), y as a
 * multiple of amplitude where positive is upward deflection.
 */
const BEAT: Array<[number, number]> = [
  [0, 0],
  [0.14, 0],
  [0.19, 0.13], // P
  [0.24, 0],
  [0.31, 0],
  [0.34, -0.11], // Q
  [0.38, 1], // R
  [0.42, -0.3], // S
  [0.47, 0],
  [0.58, 0.24], // T
  [0.7, 0],
  [1, 0],
];

function buildPath(width: number, height: number, shape: TraceShape): string {
  const baseline = height / 2;
  const beatWidth = width / shape.beats;
  const scale = (height / 2) * shape.amplitude;

  const points: string[] = [];
  for (let beat = 0; beat < shape.beats; beat += 1) {
    for (const [x, y] of BEAT) {
      // Skip the duplicated seam between consecutive beats.
      if (beat > 0 && x === 0) continue;
      const px = beat * beatWidth + x * beatWidth;
      const py = baseline - y * scale;
      points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
    }
  }

  return `M ${points.join(" L ")}`;
}

export function TelemetryTrace({
  mode = "normal",
  className,
  height = 56,
  label,
}: {
  mode?: TraceMode;
  className?: string;
  height?: number;
  /** Accessible description. Omit on purely ambient instances. */
  label?: string;
}) {
  const width = 1200;
  const shape = SHAPES[mode];
  const path = React.useMemo(() => buildPath(width, height, shape), [height, shape]);

  // Rough arc length — exact enough to size the dash pattern.
  const length = width * 1.35;
  const segment = length * 0.16;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("block w-full", className)}
      style={{ height }}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Resting trace — always fully drawn, so the waveform is legible even
          with motion disabled or JavaScript still loading. */}
      <path
        d={path}
        fill="none"
        stroke={shape.color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.22}
        style={{ transition: "stroke 500ms var(--ease-out-expo)" }}
      />

      {/* The sweep: a bright segment travelling along the same path. */}
      <path
        d={path}
        fill="none"
        stroke={shape.color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: `${segment} ${length}`,
          animation: `trace-travel ${shape.sweepDuration}s linear infinite`,
          filter: `drop-shadow(0 0 6px ${shape.color})`,
          transition: "stroke 500ms var(--ease-out-expo)",
        }}
      />

      <style>{`
        @keyframes trace-travel {
          from { stroke-dashoffset: ${segment}; }
          to   { stroke-dashoffset: -${length}; }
        }
        @media (prefers-reduced-motion: reduce) {
          svg path { animation: none !important; filter: none !important; }
        }
      `}</style>
    </svg>
  );
}

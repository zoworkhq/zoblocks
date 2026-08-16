/**
 * Rendering: path generation, width modulation, export, and biometrics.
 *
 * These are the parts a canvas implementation cannot test at all — you would
 * be comparing images with a tolerance, which hides exactly the regressions
 * worth catching. Because the output is SVG text, every assertion here is
 * exact.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_WIDTH,
  decimate,
  speeds,
  summariseBiometrics,
  toPathData,
  widths,
} from "../src/strokes";
import { toInk, toPathMarkup, toSVG } from "../src/export";
import type { Point, Stroke } from "../src/value";

const point = (x: number, y: number, t: number, pressure = 0.5): Point => ({ x, y, t, pressure });

/** A stroke sampled at a steady 60 Hz along a gentle arc. */
function arc(count = 12, speed = 5): Stroke {
  return {
    pointerType: "pen",
    points: Array.from({ length: count }, (_, i) =>
      point(i * speed, 40 + Math.sin(i / 2) * 18, i * 16),
    ),
  };
}

/* ------------------------------------------------------------------ */

describe("toPathData", () => {
  it("returns nothing for no points", () => {
    expect(toPathData([])).toBe("");
  });

  it("draws a single sample as a zero-length line", () => {
    // A dot needs geometry, or stroke-linecap="round" has nothing to cap and
    // the mark is invisible.
    expect(toPathData([point(10, 20, 0)])).toBe("M 10 20 l 0 0");
  });

  it("draws two samples as a straight line", () => {
    expect(toPathData([point(0, 0, 0), point(10, 10, 16)])).toBe("M 0 0 L 10 10");
  });

  it("uses quadratic segments through midpoints", () => {
    // Each segment needs only the current point as its control, which is what
    // lets the curve be extended one sample at a time as the pointer moves —
    // no lookahead, no re-fitting what is already drawn.
    const d = toPathData([point(0, 0, 0), point(10, 10, 16), point(20, 0, 32)]);
    expect(d).toBe("M 0 0 Q 10 10 15 5 L 20 0");
  });

  it("rounds to two decimals so output is stable across platforms", () => {
    const d = toPathData([
      point(1 / 3, 2 / 3, 0),
      point(10.987654, 20.123456, 16),
      point(30, 15, 32),
    ]);
    expect(d).not.toMatch(/\d\.\d{3,}/);
  });

  it("is deterministic", () => {
    const points = arc().points;
    expect(toPathData(points)).toBe(toPathData(points));
  });
});

describe("decimate", () => {
  it("passes short strokes through untouched", () => {
    const points = [point(0, 0, 0), point(1, 1, 16)];
    expect(decimate(points)).toEqual(points);
  });

  it("drops samples closer together than epsilon", () => {
    // Pointer events fire far faster than a hand moves; near-duplicates make
    // the curve fit wobble rather than smooth.
    const points = [point(0, 0, 0), point(0.2, 0, 8), point(0.4, 0, 16), point(40, 0, 24)];
    const thinned = decimate(points, 1.2);
    expect(thinned.length).toBeLessThan(points.length);
  });

  it("always keeps the first and last samples", () => {
    // The endpoints are where the pen touched down and lifted. Losing them
    // shortens the stroke visibly.
    const points = [point(0, 0, 0), point(0.1, 0, 8), point(0.2, 0, 16), point(50, 50, 24)];
    const thinned = decimate(points, 5);
    expect(thinned[0]).toEqual(points[0]);
    expect(thinned[thinned.length - 1]).toEqual(points[points.length - 1]);
  });

  it("keeps everything when every sample is far apart", () => {
    const points = [point(0, 0, 0), point(20, 0, 16), point(40, 0, 32), point(60, 0, 48)];
    expect(decimate(points, 1.2)).toHaveLength(4);
  });
});

describe("width modulation", () => {
  it("thins the line as the pen speeds up", () => {
    // A real pen lays down less ink when moved quickly. This is the single
    // cheapest thing that makes a digital signature look like ink.
    const slow = widths([point(0, 0, 0), point(2, 0, 100), point(4, 0, 200)]);
    const fast = widths([point(0, 0, 0), point(200, 0, 100), point(400, 0, 200)]);
    expect(average(fast)).toBeLessThan(average(slow));
  });

  it("thickens with pressure and thins without it", () => {
    const light = widths([point(0, 0, 0, 0.1), point(10, 0, 16, 0.1), point(20, 0, 32, 0.1)]);
    const heavy = widths([point(0, 0, 0, 1), point(10, 0, 16, 1), point(20, 0, 32, 1)]);
    expect(average(heavy)).toBeGreaterThan(average(light));
  });

  it("leaves the width unmodified at neutral pressure", () => {
    // 0.5 is what a device without a pressure sensor reports, so it has to
    // land exactly on the unmodified curve rather than near it.
    const [only] = widths([point(0, 0, 0, 0.5)], DEFAULT_WIDTH);
    expect(only).toBeCloseTo(DEFAULT_WIDTH.base * DEFAULT_WIDTH.maxFactor, 5);
  });

  it("stays inside the configured bounds", () => {
    const extreme = widths(
      [point(0, 0, 0, 1), point(5000, 0, 1, 1), point(10000, 0, 2, 1)],
      DEFAULT_WIDTH,
    );
    for (const w of extreme) {
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(DEFAULT_WIDTH.base * DEFAULT_WIDTH.maxFactor * 1.5);
    }
  });

  it("smooths across neighbours so the outline does not ripple", () => {
    // Per-sample width changes make the edge of the stroke look serrated.
    const jumpy = widths([
      point(0, 0, 0),
      point(1, 0, 16),
      point(100, 0, 32),
      point(101, 0, 48),
      point(200, 0, 64),
    ]);
    const deltas = jumpy.slice(1).map((w, i) => Math.abs(w - (jumpy[i] ?? 0)));
    expect(Math.max(...deltas)).toBeLessThan(DEFAULT_WIDTH.base);
  });

  it("handles a single point and an empty stroke", () => {
    expect(widths([])).toEqual([]);
    expect(widths([point(0, 0, 0)])).toHaveLength(1);
  });
});

describe("speeds", () => {
  it("is empty for no points and zero for one", () => {
    expect(speeds([])).toEqual([]);
    expect(speeds([point(0, 0, 0)])).toEqual([0]);
  });

  it("computes units per second", () => {
    // 10 units in 100 ms is 100 units/second.
    const v = speeds([point(0, 0, 0), point(10, 0, 100)]);
    expect(v[1]).toBeCloseTo(100, 5);
  });
});

describe("toSVG", () => {
  it("produces a well-formed, self-contained document", () => {
    const svg = toSVG([arc()]);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("viewBox=");
  });

  it("renders one path per segment when width varies", () => {
    // Variable width is drawn as a run of short constant-width segments rather
    // than a filled outline, because segments can be appended point by point —
    // the same function then serves both live drawing and final export.
    const stroke = arc(6);
    const svg = toSVG([stroke]);
    expect(countPaths(svg)).toBeGreaterThan(1);
  });

  it("renders one path per stroke when width is constant", () => {
    const svg = toSVG([arc(6)], { variableWidth: false });
    expect(countPaths(svg)).toBe(1);
    expect(svg).toContain('stroke-linejoin="round"');
  });

  it("renders a single-sample stroke as a visible dot", () => {
    const dot: Stroke = { pointerType: "touch", points: [point(50, 50, 0)] };
    const svg = toSVG([dot]);
    expect(countPaths(svg)).toBe(1);
    expect(svg).toContain("l 0 0");
  });

  it("skips strokes with no points instead of emitting empty paths", () => {
    const svg = toSVG([{ pointerType: "pen", points: [] }, arc(6)]);
    expect(svg).not.toContain('d=""');
  });

  it("keeps the surface size when trimming is off", () => {
    const svg = toSVG([arc()], { trim: false, surface: { width: 600, height: 200 } });
    expect(svg).toContain('viewBox="0 0 600 200"');
  });

  it("falls back to the ink extent when trimming is off and no surface is given", () => {
    const svg = toSVG([arc()], { trim: false });
    expect(svg).toMatch(/viewBox="0 0 [\d.]+ [\d.]+"/);
  });

  it("never produces a zero-sized viewBox", () => {
    // A dot has zero width and height. A zero-sized viewBox renders nothing at
    // all, which would silently lose a legitimate (if minimal) mark.
    const svg = toSVG([{ pointerType: "mouse", points: [point(10, 10, 0)] }]);
    const [, , w, h] = viewBox(svg);
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it("honours a custom ink colour", () => {
    expect(toSVG([arc(4)], { color: "#1d39c4" })).toContain('stroke="#1d39c4"');
  });

  it("escapes the colour, which is the only caller string reaching the markup", () => {
    const svg = toSVG([arc(4)], { color: '"><script>alert(1)</script>' });
    expect(svg).not.toContain("<script>");
  });
});

describe("toPathMarkup", () => {
  it("returns paths with no wrapping svg, for embedding", () => {
    const markup = toPathMarkup([arc(6)]);
    expect(markup).toContain("<path");
    expect(markup).not.toContain("<svg");
  });

  it("is empty for an empty model", () => {
    expect(toPathMarkup([])).toBe("");
  });
});

describe("toInk", () => {
  it("bundles strokes, svg and bounds", () => {
    const ink = toInk([arc()]);
    expect(ink.strokes).toHaveLength(1);
    expect(ink.svg).toContain("<svg");
    expect(ink.bounds.width).toBeGreaterThan(0);
  });

  it("copies the strokes rather than aliasing them", () => {
    // The value is stored and may outlive the pad. Sharing the array would let
    // a later `clear()` mutate a signature already committed to a record.
    const stroke = arc();
    const ink = toInk([stroke]);
    stroke.points.push(point(999, 999, 999));
    expect(ink.strokes[0]?.points).not.toHaveLength(stroke.points.length);
  });

  it("leaves png unset, because rasterising needs a canvas", () => {
    // The value is complete and useful without it; the browser package fills
    // it in. This is what keeps the engine server-safe.
    expect(toInk([arc()]).png).toBeUndefined();
  });
});

describe("biometrics", () => {
  it("summarises speed, pressure and pauses", () => {
    const strokes: Stroke[] = [
      { pointerType: "pen", points: [point(0, 0, 0, 0.4), point(10, 0, 100, 0.6)] },
      { pointerType: "pen", points: [point(20, 0, 400, 0.8), point(40, 0, 500, 0.2)] },
    ];
    const summary = summariseBiometrics(strokes);

    expect(summary.meanSpeed).toBeGreaterThan(0);
    expect(summary.peakSpeed).toBeGreaterThanOrEqual(summary.meanSpeed);
    expect(summary.meanPressure).toBeCloseTo(0.5, 1);
    // 400 ms with the pen off the surface between the two strokes.
    expect(summary.pauseMs).toEqual([300]);
  });

  it("reports no pauses for a single stroke", () => {
    expect(summariseBiometrics([arc()]).pauseMs).toEqual([]);
  });

  it("returns zeros rather than NaN for an empty model", () => {
    const summary = summariseBiometrics([]);
    expect(summary.meanSpeed).toBe(0);
    expect(summary.peakSpeed).toBe(0);
    expect(summary.meanPressure).toBe(0);
    expect(summary.pauseMs).toEqual([]);
  });

  it("survives a stroke with no points", () => {
    const summary = summariseBiometrics([
      { pointerType: "pen", points: [] },
      { pointerType: "pen", points: [point(0, 0, 100)] },
    ]);
    expect(Number.isFinite(summary.meanSpeed)).toBe(true);
  });

  it("is never called on its own — it must be asked for", () => {
    // A guard on the privacy default rather than on the maths: nothing in the
    // capture or export path invokes this, so stroke dynamics cannot leak into
    // a value unless an integrator opts in.
    const ink = toInk([arc()]);
    expect(ink).not.toHaveProperty("biometrics");
  });
});

/* ------------------------------------------------------------------ */

function average(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

function countPaths(svg: string): number {
  return (svg.match(/<path /g) ?? []).length;
}

function viewBox(svg: string): [number, number, number, number] {
  const match = /viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!match) throw new Error("no viewBox");
  return match.slice(1).map(Number) as [number, number, number, number];
}

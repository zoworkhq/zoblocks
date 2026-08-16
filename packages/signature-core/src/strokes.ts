/**
 * The stroke model and everything computed from it.
 *
 * The decision this file exists to enforce: **capture strokes, not pixels.**
 * Most signature pads draw straight onto a canvas and keep the bitmap. That
 * loses four things at once, and all four matter here:
 *
 *   - **Undo becomes approximate.** With only pixels you must either snapshot
 *     the whole canvas per stroke or repaint from a history you did not keep.
 *   - **Export is resolution-locked.** A 96 dpi bitmap prints as a smear, and
 *     a signature is a document that gets printed.
 *   - **Theme changes destroy it.** Ink captured as dark pixels is invisible in
 *     dark mode. Re-rendering from geometry is what lets the same signature
 *     draw correctly in light, dark, and forced-colors.
 *   - **Nothing can be compared.** Timing and pressure are the only forensic
 *     content a drawn signature has, and a flattened bitmap has thrown it away.
 *
 * Everything here is pure. No canvas, no DOM, no clock — which is what lets the
 * whole engine be tested by feeding it synthetic samples and diffing SVG text.
 */

import type { Bounds, Point, Stroke, BiometricSummary } from "./value";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const EMPTY_BOUNDS: Bounds = { x: 0, y: 0, width: 0, height: 0 };

/** The tightest box containing every point. */
export function inkBounds(strokes: readonly Stroke[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (minX === Infinity) return EMPTY_BOUNDS;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Summed point-to-point distance across every stroke. */
export function pathLength(strokes: readonly Stroke[]): number {
  let total = 0;
  for (const stroke of strokes) {
    let prev: Point | undefined;
    for (const point of stroke.points) {
      if (prev) total += Math.hypot(point.x - prev.x, point.y - prev.y);
      prev = point;
    }
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* The minimum-ink gate                                                */
/* ------------------------------------------------------------------ */

export interface InkThreshold {
  /** Total travelled distance, in capture units. */
  minPathLength: number;
  /** Diagonal of the ink bounding box. */
  minDiagonal: number;
  /** Points across all strokes. */
  minPoints: number;
}

/**
 * Defaults tuned against a 600×200 capture surface.
 *
 * The failure this prevents is specific and expensive: a stray tap on a tablet
 * produces a one-point "stroke", the Done button enables, and a dot commits as
 * a legal signature. Nothing downstream can tell that apart from a signature.
 *
 * Three measures rather than one, because each alone has a hole. Path length
 * alone passes a fast scribble in one spot; diagonal alone passes two dots at
 * opposite corners; point count alone passes a slow press that never moves.
 */
export const DEFAULT_INK_THRESHOLD: InkThreshold = {
  minPathLength: 40,
  minDiagonal: 20,
  minPoints: 8,
};

export interface InkVerdict {
  ok: boolean;
  pathLength: number;
  diagonal: number;
  points: number;
  /** Which measures failed. Empty when `ok`. */
  failed: Array<keyof InkThreshold>;
}

/** Whether there is enough ink to call this a signature. */
export function assessInk(
  strokes: readonly Stroke[],
  threshold: InkThreshold = DEFAULT_INK_THRESHOLD,
): InkVerdict {
  const bounds = inkBounds(strokes);
  const length = pathLength(strokes);
  const diagonal = Math.hypot(bounds.width, bounds.height);
  const points = strokes.reduce((n, s) => n + s.points.length, 0);

  const failed: Array<keyof InkThreshold> = [];
  if (length < threshold.minPathLength) failed.push("minPathLength");
  if (diagonal < threshold.minDiagonal) failed.push("minDiagonal");
  if (points < threshold.minPoints) failed.push("minPoints");

  return { ok: failed.length === 0, pathLength: length, diagonal, points, failed };
}

/* ------------------------------------------------------------------ */
/* Smoothing                                                           */
/* ------------------------------------------------------------------ */

/**
 * Drop samples closer together than `epsilon`.
 *
 * Pointer events fire far faster than a hand moves, and near-duplicate points
 * make the curve fit wobble rather than smooth. Applied before interpolation.
 */
export function decimate(points: readonly Point[], epsilon = 1.2): Point[] {
  if (points.length < 3) return [...points];

  const [first, ...rest] = points;
  const last = rest.pop();
  if (!first) return [];

  const out: Point[] = [first];
  for (const point of rest) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) >= epsilon) out.push(point);
  }
  if (last) out.push(last);
  return out;
}

/**
 * Instantaneous speed at each point, in units per second.
 *
 * Used both for variable stroke width and for the biometric summary. The first
 * point has no predecessor, so it inherits the second's speed rather than
 * reporting zero — a zero there would render the start of every stroke at
 * maximum width, which reads as a blot.
 */
export function speeds(points: readonly Point[]): number[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [0];

  const out: number[] = new Array<number>(points.length).fill(0);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (!a || !b) continue;
    // A zero delta would divide by zero. Coalesced pointer events genuinely
    // arrive with identical timestamps, so this is a real case, not a guard.
    const dt = Math.max(b.t - a.t, 1) / 1000;
    out[i] = Math.hypot(b.x - a.x, b.y - a.y) / dt;
  }
  out[0] = out[1] ?? 0;
  return out;
}

export interface WidthOptions {
  /** Width at rest, in capture units. */
  base: number;
  /** Narrowest the line may get, as a fraction of `base`. */
  minFactor: number;
  /** Widest the line may get, as a fraction of `base`. */
  maxFactor: number;
  /** Speed at which the line reaches `minFactor`, in units per second. */
  fastAt: number;
}

export const DEFAULT_WIDTH: WidthOptions = {
  base: 2.4,
  minFactor: 0.45,
  maxFactor: 1.35,
  fastAt: 900,
};

/**
 * Speed and pressure to stroke width.
 *
 * A real pen lays down less ink when moved quickly, and this is the single
 * cheapest thing that makes a digital signature look like ink rather than
 * wire. Pressure modulates it where the device reports it; devices that do not
 * report pressure send 0.5, which lands exactly on neutral.
 *
 * Smoothed across neighbours afterwards, because per-sample width changes make
 * the outline ripple.
 */
export function widths(points: readonly Point[], options: WidthOptions = DEFAULT_WIDTH): number[] {
  const v = speeds(points);
  const raw = points.map((p, i) => {
    const fast = Math.min((v[i] ?? 0) / options.fastAt, 1);
    // Fast → thin. Pressure above neutral thickens, below thins.
    const speedFactor = options.maxFactor - fast * (options.maxFactor - options.minFactor);
    const pressureFactor = 0.75 + p.pressure * 0.5;
    return options.base * speedFactor * pressureFactor;
  });

  // Three-tap mean. Cheap, and enough to stop the ripple.
  return raw.map((w, i) => {
    const a = raw[i - 1] ?? w;
    const b = raw[i + 1] ?? w;
    return (a + w + b) / 3;
  });
}

/* ------------------------------------------------------------------ */
/* Path generation                                                     */
/* ------------------------------------------------------------------ */

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A centreline path through the points, as SVG path data.
 *
 * Quadratic segments through midpoints — the standard approach for inking, and
 * the reason it is used here rather than a cubic fit: each segment needs only
 * the current point as its control, so the curve can be extended one sample at
 * a time as the pointer moves, with no lookahead and no re-fitting of what is
 * already drawn.
 *
 * Coordinates are rounded to two decimals. That is not cosmetic: it is what
 * makes the output byte-identical for identical input across platforms, which
 * is what the determinism test asserts and what makes visual regression on the
 * rendered result trustworthy.
 */
export function toPathData(points: readonly Point[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first) return "";

  if (points.length === 1 || !last) {
    // A single sample is a dot. Rendered as a zero-length line so that
    // stroke-linecap="round" gives it a visible, correctly-sized head.
    return `M ${round(first.x)} ${round(first.y)} l 0 0`;
  }

  let d = `M ${round(first.x)} ${round(first.y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    const next = points[i + 1];
    if (!point || !next) continue;
    const midX = (point.x + next.x) / 2;
    const midY = (point.y + next.y) / 2;
    d += ` Q ${round(point.x)} ${round(point.y)} ${round(midX)} ${round(midY)}`;
  }
  d += ` L ${round(last.x)} ${round(last.y)}`;
  return d;
}

/* ------------------------------------------------------------------ */
/* Biometrics                                                          */
/* ------------------------------------------------------------------ */

/**
 * Timing and pressure statistics.
 *
 * Computed on request only, and never included in a value unless the
 * integrator opted in. See the note on `CaptureContext.biometrics`: a written
 * signature is outside Illinois BIPA's and Texas CUBI's definitions of a
 * biometric identifier, but the dynamics behind it are not clearly outside
 * either, and defaulting to collection would be making that call on a
 * customer's behalf.
 */
export function summariseBiometrics(strokes: readonly Stroke[]): BiometricSummary {
  const all: number[] = [];
  let pressureSum = 0;
  let pressureCount = 0;
  const pauses: number[] = [];
  const tilts: number[] = [];

  strokes.forEach((stroke, index) => {
    for (const s of speeds(stroke.points)) all.push(s);
    for (const p of stroke.points) {
      pressureSum += p.pressure;
      pressureCount += 1;
      // Only points that carried a reading. Averaging in a zero for every
      // mouse sample would drag a real pen's mean towards upright.
      if (p.tiltX !== undefined) tilts.push(p.tiltX);
    }
    if (index > 0) {
      const prev = strokes[index - 1];
      const prevEnd = prev?.points[prev.points.length - 1];
      const start = stroke.points[0];
      if (prevEnd && start) pauses.push(Math.max(0, start.t - prevEnd.t));
    }
  });

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return {
    meanSpeed: round(mean(all)),
    peakSpeed: round(all.length ? Math.max(...all) : 0),
    meanPressure: round(pressureCount ? pressureSum / pressureCount : 0),
    pauseMs: pauses.map((p) => Math.round(p)),
    ...(tilts.length
      ? {
          meanTilt: round(mean(tilts)),
          tiltRange: round(Math.max(...tilts) - Math.min(...tilts)),
        }
      : {}),
  };
}

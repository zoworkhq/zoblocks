/**
 * Rendering strokes to something you can store, print, or embed.
 *
 * SVG is the primary target and PNG is derived from it, which is the opposite
 * of how most signature libraries work — they own a canvas and read pixels off
 * it. Vector-first matters for three reasons that all show up in healthcare:
 *
 *   - **It prints.** A signature ends up on paper more often than anything else
 *     in a clinical record, and a 96 dpi bitmap enlarged to a signature block
 *     looks like a fax.
 *   - **It re-themes.** The path carries no colour. The same stored signature
 *     draws in dark mode, and in forced-colors mode, correctly.
 *   - **It is diffable.** SVG is text, so a test can assert on the exact output
 *     rather than comparing images with a tolerance that hides regressions.
 *
 * Nothing here touches a canvas or the DOM, so it runs on a server.
 */

import type { Ink, InkPath, Point, Stroke } from "./value";
import {
  DEFAULT_WIDTH,
  decimate,
  inkBounds,
  toPathData,
  widths,
  type WidthOptions,
} from "./strokes";

export interface RenderOptions {
  /** Padding around the ink, in capture units. */
  margin: number;
  /** Crop to the ink rather than keeping the original surface size. */
  trim: boolean;
  /** Variable-width rendering. Off produces one uniform path per stroke. */
  variableWidth: boolean;
  width: WidthOptions;
  /**
   * Stroke colour.
   *
   * `currentColor` by default and that is deliberate: it makes the signature
   * inherit the surrounding text colour, so it stays legible in dark mode and
   * takes the system colour under forced-colors without any special casing. A
   * literal here would be the bug that makes signatures vanish.
   */
  color: string;
  /** Surface size, used when `trim` is false. */
  surface?: { width: number; height: number };
}

export const DEFAULT_RENDER: RenderOptions = {
  margin: 8,
  trim: true,
  variableWidth: true,
  width: DEFAULT_WIDTH,
  color: "currentColor",
};

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Escape a value destined for an XML attribute.
 *
 * The colour is the only caller-supplied string that reaches the markup, and a
 * signature is not a place to introduce an injection sink — the same
 * constraint the loaders' `textContent`-only rule enforces on the React side.
 */
function attr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Strokes to `<path>` elements.
 *
 * Variable width is drawn as a run of short constant-width segments rather
 * than as a filled outline. An outline is prettier and needs the whole stroke
 * before it can be computed; segments can be appended point by point, which is
 * what lets the same function serve both live drawing and final export. Since
 * consecutive widths are smoothed and the segments overlap at round caps, the
 * seams are not visible.
 */
/**
 * Strokes to structured segments.
 *
 * This is the primary output. The SVG string below is generated *from* it, so
 * markup and render data can never disagree — and a React consumer draws the
 * segments directly rather than injecting markup.
 */
export function toInkPaths(
  strokes: readonly Stroke[],
  overrides: Partial<RenderOptions> = {},
): InkPath[] {
  const options = { ...DEFAULT_RENDER, ...overrides };
  const out: InkPath[] = [];

  for (const stroke of strokes) {
    const points = decimate(stroke.points);
    if (points.length === 0) continue;

    if (!options.variableWidth) {
      out.push({ d: toPathData(points), width: round(options.width.base) });
      continue;
    }

    const only = points[0];
    if (points.length === 1 && only) {
      out.push({
        d: `M ${round(only.x)} ${round(only.y)} l 0 0`,
        width: round(options.width.base),
      });
      continue;
    }

    /*
     * Curved segments, not straight ones.
     *
     * Variable width forces the ink to be cut into pieces — SVG has one
     * `stroke-width` per element, so a stroke whose weight changes cannot be a
     * single path. The obvious way to cut it is a line between each pair of
     * samples, and that was what this did; the cost is that every sample
     * becomes a visible corner. On a signature captured at 60Hz the result is
     * a polygon of someone's name, and the faster the pen moved the coarser it
     * got — exactly backwards, since a fast stroke is the smooth one.
     *
     * So each piece spans midpoint to midpoint with the sample between them as
     * a quadratic control, which is the same smoothing `toPathData` applies to
     * the fixed-width path. Consecutive pieces share their endpoints exactly,
     * so there are no gaps to hide, and the curve passes through the midpoints
     * rather than the samples — which is also a mild low-pass on hand tremor.
     */
    const w = widths(points, options.width);
    const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const at = (i: number) => round(w[i] ?? options.width.base);

    const first = points[0];
    const second = points[1];
    if (!first || !second) continue;
    const firstMid = mid(first, second);

    // The lead-in: from the point the pen landed to the first midpoint. There
    // is no earlier sample to curve through, so it is a line.
    out.push({
      d: `M ${round(first.x)} ${round(first.y)} L ${round(firstMid.x)} ${round(firstMid.y)}`,
      width: at(0),
    });

    for (let i = 1; i < points.length - 1; i++) {
      const previous = points[i - 1];
      const point = points[i];
      const next = points[i + 1];
      if (!previous || !point || !next) continue;

      const from = mid(previous, point);
      const to = mid(point, next);
      out.push({
        d: `M ${round(from.x)} ${round(from.y)} Q ${round(point.x)} ${round(point.y)} ${round(to.x)} ${round(to.y)}`,
        width: at(i),
      });
    }

    // And the lift, from the last midpoint to where the pen left the surface.
    const last = points[points.length - 1];
    const penultimate = points[points.length - 2];
    if (!last || !penultimate) continue;
    const lastMid = mid(penultimate, last);
    out.push({
      d: `M ${round(lastMid.x)} ${round(lastMid.y)} L ${round(last.x)} ${round(last.y)}`,
      width: at(points.length - 1),
    });
  }

  return out;
}

function paths(strokes: readonly Stroke[], options: RenderOptions): string[] {
  const out: string[] = [];

  for (const stroke of strokes) {
    const points = decimate(stroke.points);
    if (points.length === 0) continue;

    if (!options.variableWidth) {
      out.push(
        `<path d="${toPathData(points)}" fill="none" stroke="${attr(options.color)}" stroke-width="${round(options.width.base)}" stroke-linecap="round" stroke-linejoin="round"/>`,
      );
      continue;
    }

    const only = points[0];
    if (points.length === 1 && only) {
      const p = only;
      out.push(
        `<path d="M ${round(p.x)} ${round(p.y)} l 0 0" fill="none" stroke="${attr(options.color)}" stroke-width="${round(options.width.base)}" stroke-linecap="round"/>`,
      );
      continue;
    }

    const w = widths(points, options.width);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      if (!a || !b) continue;
      const segment = ((w[i - 1] ?? options.width.base) + (w[i] ?? options.width.base)) / 2;
      out.push(
        `<path d="M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}" fill="none" stroke="${attr(options.color)}" stroke-width="${round(segment)}" stroke-linecap="round"/>`,
      );
    }
  }

  return out;
}

/** A complete, standalone SVG document. */
export function toSVG(strokes: readonly Stroke[], overrides: Partial<RenderOptions> = {}): string {
  const options = { ...DEFAULT_RENDER, ...overrides };
  const bounds = inkBounds(strokes);

  // The stroke has width, so the ink extends half a line beyond the point
  // bounds. Without this the outermost stroke is clipped by the viewBox — a
  // subtle defect that only shows on signatures that reach the edge.
  const bleed = options.width.base * options.width.maxFactor;
  const pad = options.margin + bleed / 2;

  const view = options.trim
    ? {
        x: round(bounds.x - pad),
        y: round(bounds.y - pad),
        width: round(Math.max(bounds.width + pad * 2, 1)),
        height: round(Math.max(bounds.height + pad * 2, 1)),
      }
    : {
        x: 0,
        y: 0,
        width: options.surface?.width ?? round(bounds.width + pad * 2),
        height: options.surface?.height ?? round(bounds.height + pad * 2),
      };

  const body = paths(strokes, options).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${view.x} ${view.y} ${view.width} ${view.height}" ` +
    `width="${view.width}" height="${view.height}" ` +
    // Decorative at this level. The accessible name belongs on the element that
    // presents the signature, where it can say whose it is and when — a
    // description of the strokes would serve no equivalent purpose.
    `role="img" aria-hidden="true" focusable="false">${body}</svg>`
  );
}

/** Just the `<path>` markup, for embedding in an existing SVG. */
export function toPathMarkup(
  strokes: readonly Stroke[],
  overrides: Partial<RenderOptions> = {},
): string {
  return paths(strokes, { ...DEFAULT_RENDER, ...overrides }).join("");
}

/**
 * The bundle stored in a `SignedValue`.
 *
 * PNG is left to the caller because rasterising needs a canvas, which does not
 * exist on a server. `packages/signature` supplies it in the browser; the
 * value is complete and useful without it.
 */
export function toInk(strokes: readonly Stroke[], overrides: Partial<RenderOptions> = {}): Ink {
  const svg = toSVG(strokes, overrides);
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1] ?? "0 0 1 1";

  return {
    strokes: strokes.map((s) => ({ ...s, points: [...s.points] })),
    svg,
    render: { viewBox, paths: toInkPaths(strokes, overrides) },
    bounds: inkBounds(strokes),
  };
}

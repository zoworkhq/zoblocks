"use client";

/**
 * SVG to PNG, in the browser.
 *
 * `signature-core` deliberately stops at vector: rasterising needs a canvas,
 * and the engine has to run on a server. This is the other half, and without it
 * there is a hole worth naming — `Signature.data` in the FHIR mapping is the
 * base64 PNG, so until this existed a drawn or typed signature produced a FHIR
 * `Signature` element with **no payload at all**. Only an uploaded image, which
 * arrives as a bitmap already, carried one.
 *
 * Two things about the conversion are easy to get wrong.
 *
 * **`currentColor` does not survive.** The stored SVG inherits its colour from
 * the page, which is exactly what makes one signature legible in light, dark
 * and forced-colors. A standalone raster has nothing to inherit from, so the
 * colour must be substituted before drawing — otherwise the PNG comes out
 * black-on-transparent by accident rather than by decision, and in some engines
 * comes out empty.
 *
 * **The archive copy is opaque.** The on-screen SVG is transparent so it sits
 * on any surface. A PNG going into a record is going to land in a PDF, an email
 * and a printout, and a transparent signature composited onto a dark viewer is
 * invisible. `background` defaults to white for that reason; pass `null` for a
 * transparent one deliberately.
 */

export interface RasteriseOptions {
  /** Target pixels per SVG unit. 3 ≈ 300 dpi against a 96 dpi baseline. */
  scale?: number;
  /** Ink colour baked into the raster. `currentColor` cannot be resolved here. */
  color?: string;
  /** Flattened behind the ink. `null` keeps the alpha channel. */
  background?: string | null;
  /** Longest edge in pixels, so a large capture cannot produce a huge PNG. */
  maxEdge?: number;
}

const DEFAULTS = {
  scale: 3,
  color: "#111111",
  background: "#ffffff",
  maxEdge: 2400,
} satisfies Required<RasteriseOptions>;

/** Read `width`/`height` off the serialised SVG, falling back to the viewBox. */
function dimensionsOf(svg: string): { width: number; height: number } {
  const attr = (name: string) => {
    const match = new RegExp(`${name}="([\\d.]+)"`).exec(svg);
    return match ? Number(match[1]) : undefined;
  };

  const width = attr("width");
  const height = attr("height");
  if (width && height) return { width, height };

  const view = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg);
  return { width: Number(view?.[1] ?? 1), height: Number(view?.[2] ?? 1) };
}

/**
 * A data URL for the SVG.
 *
 * `encodeURIComponent` rather than `btoa`: a typed signature can contain any
 * name, and `btoa` throws on a character above U+00FF. A signature component
 * that fails on a non-Latin name would be a poor thing to ship.
 */
function toDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function rasterise(svg: string, options: RasteriseOptions = {}): Promise<string> {
  const { scale, color, background, maxEdge } = { ...DEFAULTS, ...options };
  if (!svg.trim()) return "";

  // currentColor resolves against the DOM; a standalone raster has no DOM to
  // resolve against, so it is substituted before serialising.
  const painted = svg.replace(/currentColor/g, color);
  const { width, height } = dimensionsOf(painted);

  const longest = Math.max(width, height) * scale;
  const effective = longest > maxEdge ? maxEdge / Math.max(width, height) : scale;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * effective));
  canvas.height = Math.max(1, Math.round(height * effective));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const image = await loadImage(toDataUrl(painted));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The signature could not be rasterised"));
    image.src = src;
  });
}

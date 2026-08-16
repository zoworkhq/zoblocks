"use client";

/**
 * The two non-drawn capture methods.
 *
 * Both produce the same `Ink` shape a drawn signature does, so everything
 * downstream — the manifest, the FHIR mapping, print — treats all three
 * methods identically. A typed signature that could not be rendered in the
 * manifest would be a second-class path in practice regardless of what the
 * documentation claimed, and the whole accessibility argument rests on it not
 * being one.
 */

import type { Ink } from "@oxygenui-design/signature-core";

const FACES: Record<string, string> = {
  formal: "Georgia, 'Times New Roman', serif",
  script: "'Snell Roundhand', 'Apple Chancery', 'Segoe Script', 'Brush Script MT', cursive",
  plain: "inherit",
};

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A typed name as an `Ink`.
 *
 * SVG `<text>` rather than a rasterised bitmap, for the same reasons the drawn
 * path is vector: it prints at any size, and it carries no colour so it stays
 * legible in dark mode and under forced colors.
 *
 * The width estimate is deliberately crude. Measuring text properly needs a
 * DOM, and this function is called from a submit handler that also runs in
 * tests and could run on a server; an approximate viewBox with
 * `textLength`-free rendering is the honest trade, and the manifest scales it
 * to fit regardless.
 */
export function renderTypedSignature(name: string, style: string = "formal"): Ink {
  const text = name.trim();
  const face = FACES[style] ?? FACES.formal;
  const fontSize = 44;
  // ~0.55em average advance for a proportional face at this size. Wrong in the
  // third decimal, close enough for a viewBox nothing measures against.
  const width = Math.max(80, Math.round(text.length * fontSize * 0.55) + 32);
  const height = Math.round(fontSize * 1.6);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" role="img" aria-hidden="true" focusable="false">` +
    `<text x="16" y="${Math.round(height * 0.68)}" ` +
    `font-family="${escapeText(face ?? "serif")}" font-size="${fontSize}" ` +
    // currentColor, exactly as the drawn path does — this is what makes a
    // typed signature re-theme rather than being baked to one background.
    `fill="currentColor"${style === "formal" ? ' font-style="italic"' : ""}>` +
    `${escapeText(text)}</text></svg>`;

  return {
    // No strokes: a typed signature has no stroke model, and pretending
    // otherwise would put fabricated geometry into a legal record.
    strokes: [],
    svg,
    render: {
      viewBox: `0 0 ${width} ${height}`,
      paths: [],
      text: {
        value: text,
        x: 16,
        y: Math.round(height * 0.68),
        fontSize,
        fontFamily: face ?? "serif",
        ...(style === "formal" ? { italic: true } : {}),
      },
    },
    bounds: { x: 0, y: 0, width, height },
  };
}

/**
 * Read an uploaded image into a data URL.
 *
 * Re-encoding through a canvas is what strips EXIF — a phone photo of a signed
 * page carries GPS coordinates, and forwarding those into a clinical record
 * would be a disclosure nobody asked for. It also normalises orientation,
 * because the canvas draw applies the browser's decoded rotation.
 *
 * Nothing is transmitted. The file never leaves the browser.
 */
export async function readImageFile(
  file: Blob,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    // Cap the stored size. A 12-megapixel photo of a signature is 11.9
    // megapixels of desk.
    const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      // PNG, not JPEG: lossless, with an alpha channel, and no compression
      // artefacts on thin strokes.
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Not a readable image"));
    image.src = src;
  });
}

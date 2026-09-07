/**
 * Hex in, Figma's floats out, and back again without drift.
 *
 * Figma stores a colour as `{ r, g, b }` with each channel a float from 0 to 1.
 * ZoBlocks stores hex. The conversion is four lines and is exactly the kind of
 * thing that is quietly wrong at the edges: a naive `Math.round(c * 255)` on the
 * way back is correct, and `Math.floor` — which looks equivalent — loses the
 * top of the range and turns `#ffffff` into `#fefefe`.
 *
 * Nobody notices that until a brand is one value off inside a file somebody has
 * already built on, so the round trip is asserted over every ramp step rather
 * than spot-checked.
 */

export interface FigmaRgb {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#?([0-9a-f]{6})$/i;

/** `undefined` for anything that is not a six-digit hex — not a throw. */
export function hexToFigmaRgb(hex: string): FigmaRgb | undefined {
  const match = HEX.exec(hex.trim());
  if (!match?.[1]) return undefined;

  const n = Number.parseInt(match[1], 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

export function figmaRgbToHex({ r, g, b }: FigmaRgb): string {
  const channel = (value: number) => {
    // Clamped before rounding: Figma will hand back values fractionally outside
    // the range after its own arithmetic, and `(-0.0001 * 255).toString(16)`
    // is not a colour.
    const byte = Math.round(Math.min(1, Math.max(0, value)) * 255);
    return byte.toString(16).padStart(2, "0");
  };
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

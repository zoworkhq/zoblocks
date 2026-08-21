/**
 * Colour maths for the accessibility gate.
 *
 * Exported rather than private because the theme app needs the same
 * numbers the build uses: a customer editing a palette must be told the
 * measured ratio at the moment they pick a colour, and a second implementation
 * of WCAG relative luminance is a second set of answers.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Six-digit or three-digit hex only.
 *
 * An eight-digit value carries alpha, and a contrast ratio against an unknown
 * backdrop is not a number we can honestly compute — so it is reported rather
 * than guessed at. This is the check that would have caught the
 * fully-transparent overlay surface in the old hand-written file.
 */
export function parseHex(value: string): Rgb | undefined {
  const hex = value.trim().replace(/^#/, "");

  // Three-digit shorthand, expanded.
  const short = /^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(hex);
  if (short) {
    return {
      r: parseInt(`${short[1]}${short[1]}`, 16),
      g: parseInt(`${short[2]}${short[2]}`, 16),
      b: parseInt(`${short[3]}${short[3]}`, 16),
    };
  }

  const full = /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (full) {
    return {
      r: parseInt(full[1] as string, 16),
      g: parseInt(full[2] as string, 16),
      b: parseInt(full[3] as string, 16),
    };
  }

  return undefined;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG 2.x contrast ratio. Symmetric: order of arguments does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Hue in degrees. Used only to prove two statuses are not the same colour. */
export function hue({ r, g, b }: Rgb): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  return (h * 60 + 360) % 360;
}

/** Shortest angular distance between two hues, 0–180. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * The contrast ratio between two hex strings, or `undefined` if either is not
 * a ratio we can honestly compute.
 *
 * The convenience form the app reaches for; the build uses the `Rgb` pair
 * directly because it has already parsed both sides.
 */
export function contrastBetween(fg: string, bg: string): number | undefined {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return undefined;
  return contrastRatio(a, b);
}

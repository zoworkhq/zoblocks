/**
 * One colour in, eleven steps out.
 *
 * The console asks a customer for their brand colour, not for a ramp. Asking
 * for eleven values would be asking them to do the part that has a right
 * answer, and most of the failures the contrast gate catches come from a
 * hand-picked step rather than from the chosen colour.
 *
 * The generator works in HSL and holds hue and saturation while walking
 * lightness. That is deliberately simple and deliberately not perceptual: a
 * perceptual space (OKLCH) would give more even steps, and it would also mean
 * this module and the gate disagree about what a colour *is* — the gate
 * measures WCAG relative luminance from sRGB. Simple and consistent beats
 * elegant and divergent, and every generated step is measured afterwards
 * regardless.
 */

import { contrastRatio, parseHex, type Rgb } from "@oxygenui-design/tokens/validate";

/** The steps a brand ramp defines, matching the primitive palette's shape. */
export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type RampStep = (typeof RAMP_STEPS)[number];

/** The step a customer's chosen colour occupies. Everything else derives from it. */
export const ANCHOR_STEP: RampStep = 600;

/** Target lightness per step, 0–1. Anchored so 600 keeps the chosen colour. */
const LIGHTNESS: Record<RampStep, number> = {
  50: 0.97,
  100: 0.94,
  200: 0.86,
  300: 0.75,
  400: 0.63,
  500: 0.53,
  600: 0.45,
  700: 0.37,
  800: 0.3,
  900: 0.24,
  950: 0.15,
};

interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;

  return { h: (h * 60 + 360) % 360, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * The eleven steps.
 *
 * The chosen colour is returned unchanged at step 600 rather than being
 * regenerated from its own hue and lightness — a round trip through HSL loses
 * a digit or two, and a customer who typed their brand hex should find that
 * exact string in the output.
 */
export function generateRamp(seed: string): Record<RampStep, string> | undefined {
  const rgb = parseHex(seed);
  if (!rgb) return undefined;

  const { h, s } = rgbToHsl(rgb);
  const out = {} as Record<RampStep, string>;

  for (const step of RAMP_STEPS) {
    out[step] = step === ANCHOR_STEP ? seed.toLowerCase() : hslToHex({ h, s, l: LIGHTNESS[step] });
  }
  return out;
}

/**
 * The nearest shade of the same colour that clears a floor.
 *
 * The console's "apply nearest passing" action. Customers reliably accept a
 * shade they did not choose; they do not reliably accept a rejection, and a
 * rejection with no route out is how an accessibility gate becomes something a
 * team works around rather than with.
 *
 * Hue and saturation are held so the result is recognisably still their colour
 * — only lightness moves, and it moves in whichever direction reaches the floor
 * first.
 */
export function nearestPassing(colour: string, against: string, floor: number): string | undefined {
  const rgb = parseHex(colour);
  const bg = parseHex(against);
  if (!rgb || !bg) return undefined;

  if (contrastRatio(rgb, bg) >= floor) return colour.toLowerCase();

  const { h, s, l } = rgbToHsl(rgb);

  // Walk both ways in 1% steps and take whichever passes with the smaller move,
  // so a mid-tone on a mid-tone ground does not always resolve to black.
  for (let delta = 0.01; delta <= 1; delta += 0.01) {
    for (const candidate of [l - delta, l + delta]) {
      if (candidate < 0 || candidate > 1) continue;
      const hex = hslToHex({ h, s, l: candidate });
      const parsed = parseHex(hex);
      if (parsed && contrastRatio(parsed, bg) >= floor) return hex;
    }
  }
  return undefined;
}

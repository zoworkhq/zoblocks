/**
 * Colour-vision simulation, for reviewing a palette rather than diagnosing an
 * eye.
 *
 * The model is Viénot, Brettel & Mollon (1999): convert to LMS cone response,
 * project onto the plane the missing cone cannot distinguish, convert back.
 * It is the standard approach and it is what every credible simulator uses.
 *
 * **What this is not.** It simulates *dichromacy* — a cone absent — which is
 * roughly a quarter of colour-vision deficiency. The commoner forms are
 * anomalous trichromacy, where a cone is shifted rather than missing, and those
 * sit somewhere between this output and the original. So a palette that
 * survives here survives the harder case, and one that fails here fails for
 * somebody. It is a design review tool, not a clinical instrument, and the
 * console says so on the screen rather than only here.
 *
 * Why it is in this package rather than in the console: the 60° hue-separation
 * floor between `status.high` and `status.low` exists precisely so the
 * *direction* of an abnormal result survives this transform. A rule and the
 * demonstration of the rule belong together, and this one has tests.
 */

/** The three dichromacies, plus the monochrome case print and E-ink produce. */
export type VisionKind = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

export const VISION_KINDS: readonly VisionKind[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
];

/** How common each is, and which cone is involved. Shown beside the swatches. */
export const VISION_LABELS: Record<VisionKind, { label: string; note: string }> = {
  protanopia: { label: "Protanopia", note: "No long-wave (red) cone · ~1% of men" },
  deuteranopia: { label: "Deuteranopia", note: "No medium-wave (green) cone · ~1% of men" },
  tritanopia: { label: "Tritanopia", note: "No short-wave (blue) cone · ~1 in 10,000" },
  achromatopsia: { label: "Monochrome", note: "Greyscale — print, E-ink, forced colours" },
};

/* -------------------------------------------------------------------------- */

/**
 * sRGB transfer function, both ways.
 *
 * Applied rather than skipped, which is the difference between this and the
 * many implementations that run the cone matrices straight over 0–255 bytes.
 * Those are wrong by a visible amount in the mid-tones — exactly where a
 * palette's mid steps live.
 */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function toSrgb(linear: number): number {
  const c = linear <= 0.0031308 ? linear * 12.92 : 1.055 * linear ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/** Hunt–Pointer–Estévez, normalised to D65, over linear RGB. */
const RGB_TO_LMS = [
  [0.31399022, 0.63951294, 0.04649755],
  [0.15537241, 0.75789446, 0.08670142],
  [0.01775239, 0.10944209, 0.87256922],
] as const;

const LMS_TO_RGB = [
  [5.47221206, -4.6419601, 0.16963708],
  [-1.1252419, 2.29317094, -0.1678952],
  [0.02980165, -0.19318073, 1.16364789],
] as const;

/**
 * The dichromat projections.
 *
 * Each replaces the missing cone's response with the value implied by the other
 * two, which is exactly what "cannot distinguish along this axis" means.
 */
const PROJECTION: Record<Exclude<VisionKind, "achromatopsia">, readonly (readonly number[])[]> = {
  protanopia: [
    [0, 1.05118294, -0.05116099],
    [0, 1, 0],
    [0, 0, 1],
  ],
  deuteranopia: [
    [1, 0, 0],
    [0.9513092, 0, 0.04866992],
    [0, 0, 1],
  ],
  tritanopia: [
    [1, 0, 0],
    [0, 1, 0],
    [-0.86744736, 1.86727089, 0],
  ],
};

function apply(matrix: readonly (readonly number[])[], v: readonly number[]): number[] {
  return matrix.map((row) => row.reduce((sum, cell, i) => sum + cell * (v[i] as number), 0));
}

function parse(hex: string): [number, number, number] | undefined {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return undefined;
  const body = match[1].length === 3 ? [...match[1]].map((c) => c + c).join("") : match[1];
  return [
    parseInt(body.slice(0, 2), 16),
    parseInt(body.slice(2, 4), 16),
    parseInt(body.slice(4, 6), 16),
  ];
}

const format = (rgb: readonly number[]): string =>
  `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`;

/**
 * One colour, as it appears to someone with the named deficiency.
 *
 * Returns `undefined` for anything that is not a hex colour rather than
 * guessing — a simulator that silently passes a bad value through is a
 * simulator that shows a customer a reassuring swatch of the wrong thing.
 */
export function simulateVision(hex: string, kind: VisionKind): string | undefined {
  const rgb = parse(hex);
  if (!rgb) return undefined;

  const linear = rgb.map(toLinear);

  if (kind === "achromatopsia") {
    // Rec. 709 luma, on linear light. Averaging the three channels — which is
    // the common shortcut — makes yellows and blues of equal luminance look
    // different, which is the opposite of what this view is for.
    const y =
      0.2126 * (linear[0] as number) +
      0.7152 * (linear[1] as number) +
      0.0722 * (linear[2] as number);
    return format([toSrgb(y), toSrgb(y), toSrgb(y)]);
  }

  const lms = apply(RGB_TO_LMS, linear);
  const projected = apply(PROJECTION[kind], lms);
  return format(apply(LMS_TO_RGB, projected).map(toSrgb));
}

/**
 * Every simulation of one colour, keyed by kind.
 *
 * Convenience for a screen showing all four side by side, which is the only way
 * this is ever actually used.
 */
export function simulateAll(hex: string): Partial<Record<VisionKind, string>> {
  const out: Partial<Record<VisionKind, string>> = {};
  for (const kind of VISION_KINDS) {
    const simulated = simulateVision(hex, kind);
    if (simulated) out[kind] = simulated;
  }
  return out;
}

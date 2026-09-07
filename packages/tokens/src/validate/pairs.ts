/**
 * The pairs the accessibility gate enforces, and the floors they are held to.
 *
 * Kept in their own module because two consumers need them and neither should
 * own them: `checks` enforces the list, `resolve` publishes the measured
 * evidence for the conformance table. Two lists is how `flag.restricted` once
 * ended up measured, printed, and checked by nothing.
 */

import type { Theme } from "./model";

/** Status pairs whose contrast is load-bearing, checked in every theme. */
export const STATUS_PAIRS = [
  "critical",
  "high",
  "low",
  "normal",
  "unknown",
  // The two the nine clinical-status scales need. `restricted` backs the access
  // scale and `provisional` backs everything not yet final — preliminary
  // results, unverified data, AI drafts. Both are chip text on a chip ground,
  // so both are load-bearing at 4.5:1 exactly like the other five.
  "restricted",
  "provisional",
] as const;
export type StatusName = (typeof STATUS_PAIRS)[number];

/**
 * The minimum hue separation between `status.high` and `status.low`, in
 * degrees, so the *direction* of an abnormal result survives monochrome output
 * and the common forms of colour vision deficiency.
 */
export const HUE_SEPARATION_FLOOR = 60;

/**
 * AA body text. High-contrast targets AAA because that is the entire reason a
 * reader would select it — a "high-contrast" theme that only reaches AA is a
 * second default theme with a misleading name.
 */
export function floorFor(theme: Theme): number {
  return theme === "high-contrast" ? 7 : 4.5;
}

/**
 * Every foreground the system actually composes over a background.
 *
 * This list used to be four text pairs. Three real WCAG failures were shipping
 * outside it, because a pair that is not named here is not checked at all:
 *
 *   focus-ring on bg      2.50:1  — the focus indicator for the whole library
 *   text-on-accent/accent 3.81:1  — every primary button label
 *   border-strong on bg   1.48:1  — backs --zb-field-border
 *
 * The lesson is not "those three values were wrong". It is that a gate which
 * checks a hand-picked subset reports green while the system fails, and the
 * subset is the defect. Anything that carries meaning against a surface belongs
 * here.
 *
 * `kind` selects the floor. WCAG separates readable text (1.4.3, 4.5:1) from
 * user-interface components and graphical objects (1.4.11, 3:1) — a focus ring
 * and a field border are the second kind, and holding them to 4.5 would be
 * wrong in the other direction.
 */
export type ContrastPair = { fg: string; bg: string; kind: "text" | "ui" };

export const CONTRAST_PAIRS: ContrastPair[] = [
  // Readable text — SC 1.4.3.
  { fg: "text", bg: "bg", kind: "text" },
  { fg: "text", bg: "surface", kind: "text" },
  { fg: "text", bg: "bg-subtle", kind: "text" },
  { fg: "text", bg: "bg-muted", kind: "text" },
  { fg: "text-muted", bg: "bg", kind: "text" },
  { fg: "text-muted", bg: "surface", kind: "text" },
  { fg: "text-muted", bg: "bg-subtle", kind: "text" },
  { fg: "text-subtle", bg: "bg", kind: "text" },
  { fg: "text-subtle", bg: "surface", kind: "text" },
  // Label on a filled action. This is the pair that makes a primary button
  // readable, and it was the one nobody was checking.
  { fg: "text-on-accent", bg: "accent", kind: "text" },
  { fg: "text-on-accent", bg: "accent-hover", kind: "text" },
  // Label on a filled neutral — the Switch's off word on its off track. Absent
  // from this list, the off label pointed at `text-on-accent` and rendered
  // #071014 on #5d6c7e at 3.57:1 in dark, which is the failure the comment
  // above this list describes: a pair nobody named is a pair nobody checked.
  { fg: "text-on-fill", bg: "border-strong", kind: "text" },
  // Interface components and graphical objects — SC 1.4.11.
  { fg: "focus-ring", bg: "bg", kind: "ui" },
  { fg: "focus-ring", bg: "surface", kind: "ui" },
  { fg: "focus-ring", bg: "bg-subtle", kind: "ui" },
  { fg: "border-strong", bg: "bg", kind: "ui" },
  { fg: "border-strong", bg: "surface", kind: "ui" },
  { fg: "accent", bg: "bg", kind: "ui" },
  { fg: "accent", bg: "surface", kind: "ui" },
  // Deliberately absent: accent-border on accent-subtle. A border drawn on its
  // own tint reinforces a fill that already identifies the component; SC 1.4.11
  // governs information *required* to identify a control, and demanding 3:1
  // there would force a heavy rule around every soft callout in the system.
  // Borders are checked where they actually delimit something — against the page.
  // Clinical flags carry meaning and were measured but never gated.
  { fg: "flag.restricted", bg: "flag.restricted-bg", kind: "text" },
  { fg: "flag.provisional", bg: "bg", kind: "ui" },
  { fg: "flag.deceased", bg: "bg", kind: "ui" },
];

/** SC 1.4.3 for text, SC 1.4.11 for interface components; AAA in high contrast. */
export function floorForPair(theme: Theme, kind: ContrastPair["kind"]): number {
  if (theme === "high-contrast") return kind === "text" ? 7 : 4.5;
  return kind === "text" ? 4.5 : 3;
}

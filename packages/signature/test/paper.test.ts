/**
 * The signing surface is paper, and stays paper.
 *
 * This shipped broken: the pad took `background: var(--ant-color-bg-container)`
 * like everything else, which is right for a panel and wrong for this one. The
 * ink is `#141414` and `#1d39c4` — real colours, baked into the archived PNG,
 * because a signature gets printed and filed — so under a dark theme the pad
 * was a dark box you could draw black ink onto and see nothing at all. The
 * component looked finished and could not be used.
 *
 * Theming the ink instead is the tempting fix and the wrong one: the reader
 * would sign in white and the record would hold black, and a manifestation
 * that does not match what the signer saw is the thing 21 CFR 11.50 exists to
 * prevent. So the ground is fixed, the ink is fixed, and what is archived is
 * what was on screen.
 *
 * Read from the stylesheet rather than the DOM because jsdom applies no
 * stylesheet — the rule is the artefact under test.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CSS = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "styles.css"),
  "utf8",
);

/** The body of one rule, by selector. */
function block(selector: string): string {
  const at = CSS.indexOf(`${selector} {`);
  expect(at, `${selector} is not in the stylesheet`).toBeGreaterThan(-1);
  return CSS.slice(at, CSS.indexOf("\n}", at));
}

describe("the signing surface", () => {
  it("paints its own ground", () => {
    const surface = block(".ox-signature__surface");
    expect(surface).toMatch(/background:\s*var\(--ox-signature-paper\)/);
    expect(surface).toMatch(/--ox-signature-paper:\s*#ffffff/i);
  });

  it("does not take its ground from a theme token", () => {
    const surface = block(".ox-signature__surface");
    const background = surface.match(/\n\s*background:\s*([^;]+);/)?.[1] ?? "";
    // An `--ant-*` here is the original bug: it resolves dark under a dark
    // theme and the ink disappears.
    expect(background, "the pad's ground follows the theme again").not.toMatch(/--ant-/);
  });

  it("keeps the baseline, cue and placeholder legible on that ground", () => {
    // They used to be theme tokens, which meant near-white marks on white
    // paper the moment the surface stopped following the theme with them.
    for (const selector of [
      ".ox-signature__baseline",
      ".ox-signature__cue",
      ".ox-signature__placeholder",
    ]) {
      const rule = block(selector);
      const paint = rule.match(/(?:color|border-bottom):\s*([^;]+);/)?.[1] ?? "";
      expect(paint, `${selector} paints from a theme token`).toMatch(/--ox-signature-/);
    }
  });

  it("greys a disabled pad rather than theming it", () => {
    const disabled = block(".ox-signature--disabled .ox-signature__surface");
    expect(disabled).toMatch(/background:\s*#f5f5f5/i);
  });
});

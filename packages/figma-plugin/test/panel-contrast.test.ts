/**
 * The panel, measured by the thing the panel measures.
 *
 * An accessibility tool whose own interface fails is not an argument anybody
 * has to refute. This reads the real stylesheet rather than a copy of its
 * values, so a token darkened in a later edit fails here instead of shipping.
 *
 * It found something the first time it ran: `--rule-strong`, which is the
 * border of every control in the panel and therefore an SC 1.4.11 surface
 * rather than a decoration, was at 1.63:1 in light and 2.01:1 in dark.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastBetween } from "@zoblocks/tokens/validate";

const root = process.env.PLUGIN_ROOT ?? "";
const css = readFileSync(join(root, "src/ui/panel.css"), "utf8");

/**
 * The tokens from one `:root` block.
 *
 * Light is the bare `:root`; dark is the one inside the media query, layered
 * over light — which is exactly how the cascade resolves it, so a token the
 * dark block forgets to redefine is measured here with the value it will
 * actually have.
 */
function palette(): { light: Record<string, string>; dark: Record<string, string> } {
  const blocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1] ?? "");
  const read = (block: string) => {
    const out: Record<string, string> = {};
    for (const [, name, value] of block.matchAll(/(--[a-z-]+):\s*([^;]+);/g)) {
      if (value!.trim().startsWith("#")) out[name!] = value!.trim();
    }
    return out;
  };

  const light = read(blocks[0] ?? "");
  return { light, dark: { ...light, ...read(blocks[1] ?? "") } };
}

/** Foreground, background, and the floor the rule it plays imposes. */
const PAIRS: [string, string, string, number][] = [
  ["body text on the page", "--ink", "--paper", 4.5],
  ["body text on a control", "--ink", "--sunk", 4.5],
  ["muted text on the page", "--ink-soft", "--paper", 4.5],
  ["muted text on a control", "--ink-soft", "--sunk", 4.5],
  ["the failure count", "--fail", "--paper", 4.5],
  ["a finding on its wash", "--fail", "--fail-wash", 4.5],
  ["the passing count", "--pass", "--paper", 4.5],
  // Interface components — SC 1.4.11. The focus indicator and the boundary
  // that identifies a control are both governed by it.
  ["the focus ring on the page", "--focus", "--paper", 3],
  ["the focus ring on a control", "--focus", "--sunk", 3],
  ["a control border on the page", "--rule-strong", "--paper", 3],
  ["a control border on its fill", "--rule-strong", "--sunk", 3],
  // The pull and propose screens, which arrived after the first pass here.
  ["a primary button's label", "--paper", "--focus", 4.5],
  ["a secondary button's label", "--ink", "--sunk", 4.5],
  ["a preview's heading", "--ink", "--sunk", 4.5],
  ["a preview's body", "--ink-soft", "--sunk", 4.5],
  ["a restore notice on its wash", "--ink-soft", "--fail-wash", 4.5],
  ["an unselected tab", "--ink-soft", "--paper", 4.5],
  ["the selected tab's underline", "--focus", "--paper", 3],
];

describe("the panel's own palette", () => {
  const { light, dark } = palette();

  it("defines every token it uses", () => {
    for (const [, fg, bg] of PAIRS) {
      expect(light[fg], `${fg} in light`).toBeTruthy();
      expect(light[bg], `${bg} in light`).toBeTruthy();
      expect(dark[fg], `${fg} in dark`).toBeTruthy();
      expect(dark[bg], `${bg} in dark`).toBeTruthy();
    }
  });

  for (const [theme, tokens] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    for (const [what, fg, bg, floor] of PAIRS) {
      it(`clears ${floor}:1 for ${what}, in ${theme}`, () => {
        const ratio = contrastBetween(tokens[fg]!, tokens[bg]!);
        expect(ratio, `${tokens[fg]} on ${tokens[bg]}`).toBeGreaterThanOrEqual(floor);
      });
    }
  }

  it("gives the dark theme its own values rather than inverting nothing", () => {
    // A dark block that redefines only the two greys leaves the accents from
    // the light theme sitting on a dark ground, which is the classic way a
    // "dark mode" ends up illegible.
    for (const [, fg, bg] of PAIRS) {
      expect(dark[fg], `${fg} was never redefined for dark`).not.toBe(light[fg]);
      expect(dark[bg], `${bg} was never redefined for dark`).not.toBe(light[bg]);
    }
  });
});

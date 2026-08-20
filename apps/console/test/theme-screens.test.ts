/**
 * The table that says what screens a theme has, and what state each is in.
 *
 * Two things are worth testing here and they are not the same thing. The first
 * is that the table stays the single source — the rail and the theme page both
 * read it, and a screen that exists in one and not the other is the drift this
 * replaced. The second is the counting, which is the part that can be quietly
 * wrong: an override layer is keyed by theme, so anything that counts the outer
 * object instead of the inner ones reports 3 for a theme with forty overrides
 * and nobody notices, because 3 is a plausible number.
 */

import { describe, expect, it } from "vitest";
import { RAMP_STEPS, withTierDefaults, type ThemeTokensInput } from "@oxygenui-design/theme";
import { THEME_SCREENS, themeScreenHref, themeScreens } from "@/lib/theme-screens";
import type { ThemeFacts } from "@/lib/theme-screens";

/**
 * Fixtures go through `withTierDefaults`, because the page does.
 *
 * That is not ceremony. A stored theme document carries only the tiers somebody
 * has written to — the seeded one has `ref` and nothing else — while the
 * `ThemeTokens` type claims all three are present, because zod fills them on
 * *parse* and `findOne` does not parse. A fixture that hands over a fully
 * populated object tests a shape the database never produces, which is how the
 * first version of this file passed while the screen threw
 * "Cannot convert undefined or null to object" on the seeded theme.
 */
function facts(
  tokens: ThemeTokensInput,
  over: Partial<Omit<ThemeFacts, "tokens">> = {},
): ThemeFacts {
  return { tokens: withTierDefaults(tokens), fonts: 0, icons: 0, versions: 0, ...over };
}

/** Untouched: no brand, no overrides, no faces, never published. */
const EMPTY = facts({});

const statusOf = (path: string, f: ThemeFacts) =>
  THEME_SCREENS.find((screen) => screen.path === path)!.status(f);

describe("the theme screen table", () => {
  it("covers the theme-scoped screens and nothing else", () => {
    // Playground is not in here on purpose: it compares every theme rather than
    // operating on one, so it is not theme-scoped.
    expect(THEME_SCREENS.map((s) => s.path)).toEqual([
      "brand",
      "tokens",
      "typography",
      "components",
      "icons",
      "compare",
      "history",
      "transfer",
    ]);
  });

  it("splits into the two groups the rail renders, losing none", () => {
    const design = themeScreens("design");
    const tools = themeScreens("tools");
    expect(design.length + tools.length).toBe(THEME_SCREENS.length);
    expect(design.map((s) => s.path)).toEqual([
      "brand",
      "tokens",
      "typography",
      "components",
      "icons",
    ]);
  });

  it("builds an address under the theme it belongs to", () => {
    expect(themeScreenHref("northwind-clinical", "tokens")).toBe(
      "/themes/northwind-clinical/tokens",
    );
  });

  /** Every row must be renderable — a missing label or icon is a blank card. */
  it("gives every screen a label, an icon and a purpose", () => {
    for (const screen of THEME_SCREENS) {
      expect(screen.label, screen.path).toBeTruthy();
      expect(screen.Icon, screen.path).toBeTruthy();
      expect(screen.purpose, screen.path).toMatch(/\S/);
    }
  });
});

describe("what each screen says it holds", () => {
  it("counts overrides across every theme layer, not the layers themselves", () => {
    const f = facts({
      semantic: {
        light: { "color.accent": "#123456", "color.surface": "#ffffff" },
        dark: { "color.accent": "#654321" },
      },
    });

    // Three overrides across three layers — not "3 layers", and not "2".
    expect(statusOf("tokens", f)).toBe("3 overrides");
  });

  it("says singular when there is one of something", () => {
    const f = facts(
      { semantic: { light: { "color.accent": "#123456" } } },
      { fonts: 1, versions: 1 },
    );
    expect(statusOf("tokens", f)).toBe("1 override");
    expect(statusOf("typography", f)).toBe("1 face");
    expect(statusOf("history", f)).toBe("1 version");
  });

  /**
   * The untouched theme is the one a customer meets first, so every one of
   * these has to read as a state rather than as an absence of data.
   */
  it("says something true about a theme nobody has touched", () => {
    expect(statusOf("brand", EMPTY)).toBe("No brand colour yet");
    expect(statusOf("tokens", EMPTY)).toBe("Using the defaults");
    expect(statusOf("typography", EMPTY)).toBe("No faces uploaded");
    expect(statusOf("components", EMPTY)).toBe("All falling through");
    expect(statusOf("history", EMPTY)).toBe("Never published");
  });

  it("reports the brand against the real ramp length", () => {
    const brand = Object.fromEntries(RAMP_STEPS.map((step) => [String(step), "#1d63c9"]));
    const f = facts({ ref: { brand } });
    expect(statusOf("brand", f)).toBe(`${RAMP_STEPS.length} of ${RAMP_STEPS.length} steps set`);
  });

  /** Compare needs two versions to show anything, and should say so first. */
  it("tells you Compare is not usable yet instead of letting you find out", () => {
    expect(statusOf("compare", facts({}, { versions: 1 }))).toBe("Needs a second version");
    expect(statusOf("compare", facts({}, { versions: 4 }))).toBe("4 versions to compare");
  });

  /**
   * The exact shape the seeded theme has, and the one that crashed the screen:
   * `ref` written, `semantic` and `component` never created. This is a
   * regression test for a real failure, not a hypothetical.
   */
  it("survives a stored document that only ever had its brand written", () => {
    const stored = facts({ ref: { brand: { "600": "#1d63c9" } } });

    for (const screen of THEME_SCREENS) {
      expect(() => screen.status(stored), screen.path).not.toThrow();
    }
    expect(statusOf("tokens", stored)).toBe("Using the defaults");
    expect(statusOf("components", stored)).toBe("All falling through");
  });

  it("says nothing for a screen whose contents do not depend on the theme", () => {
    // Import/export offers the same five formats whatever the theme holds.
    expect(statusOf("transfer", EMPTY)).toBeUndefined();
  });
});

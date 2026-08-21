/**
 * A customer theme against the real gate.
 *
 * These load the shipped DTCG source and put the *package* validator over a
 * customer's palette, so the bar a customer is held to is demonstrably the bar
 * `northwind.json` is held to — not a second implementation that agrees today.
 */

import { describe, expect, it } from "vitest";
import { loadTokenSource } from "../../../scripts/gen/tokens/load";
import type { TokenSource } from "@oxygenui-design/tokens/validate";
import {
  VALIDATOR_VERSION,
  isServable,
  needsRevalidation,
  themeAsBrand,
  validateTheme,
} from "../src/index";
import { publishedTheme } from "./fixture";

const NOW = "2026-08-19T09:14:22.000Z";
let source: TokenSource;

async function tokens(): Promise<TokenSource> {
  source ??= await loadTokenSource();
  return source;
}

describe("themeAsBrand", () => {
  it("shapes a customer ramp the way the gate's brand path expects", () => {
    const brand = themeAsBrand("nw", { ref: { brand: { "600": "#1d63c9" } } });
    expect(brand.name).toBe("nw");
    expect(brand.primitive.get("ref.brand.600")?.value).toBe("#1d63c9");
    expect(brand.primitive.get("ref.brand.600")?.file).toBe("theme:nw");
  });
});

describe("validateTheme", () => {
  it("passes a palette that clears every floor", async () => {
    const result = validateTheme(
      await tokens(),
      "northwind-clinical",
      publishedTheme().tokens,
      NOW,
    );
    expect(result.problems.map((p) => p.message)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  /**
   * The failure a customer would otherwise ship: the base build is green, the
   * brand replaces the accent ramp, and the primary button label goes
   * unreadable.
   */
  it("fails a palette that makes the primary label unreadable", async () => {
    const result = validateTheme(
      await tokens(),
      "pale",
      { ref: { brand: { "600": "#cfeee6", "700": "#d6f2ea", "800": "#e0f5ef" } } },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.problems.map((p) => p.message).join("\n")).toContain("below the");
  });

  it("reports only this customer's problems, never a built-in brand's", async () => {
    const result = validateTheme(
      await tokens(),
      "pale",
      { ref: { brand: { "600": "#cfeee6" } } },
      NOW,
    );
    for (const problem of result.problems) {
      expect(problem.message).toContain('brand "pale"');
      expect(problem.message).not.toContain("northwind");
    }
  });

  it("refuses a step the base palette does not define", async () => {
    const result = validateTheme(
      await tokens(),
      "typo",
      { ref: { brand: { "650": "#1d63c9" } } },
      NOW,
    );
    expect(result.ok).toBe(false);
    expect(result.problems.map((p) => p.message).join("\n")).toContain(
      "which the base palette does not define",
    );
  });

  it("records what it checked, in every theme", async () => {
    const { record } = validateTheme(await tokens(), "nw", publishedTheme().tokens, NOW);
    expect(record.validatorVersion).toBe(VALIDATOR_VERSION);
    expect(record.themes).toEqual(["light", "dark", "high-contrast"]);
    expect(record.contrastPairs.checked).toBeGreaterThan(50);
    expect(record.contrastPairs.failed).toBe(0);
  });

  it("counts the failures it found", async () => {
    const { record, problems } = validateTheme(
      await tokens(),
      "pale",
      { ref: { brand: { "600": "#cfeee6" } } },
      NOW,
    );
    expect(record.contrastPairs.failed).toBe(problems.length);
  });
});

describe("the guard on serve", () => {
  it("serves a current, published, passing theme", () => {
    expect(isServable(publishedTheme())).toEqual({ ok: true });
  });

  it("refuses a draft", () => {
    expect(isServable(publishedTheme({ status: "draft" })).reason).toContain("not published");
  });

  it("refuses one with failing pairs, even if somehow marked published", () => {
    const theme = publishedTheme();
    theme.validation!.contrastPairs.failed = 1;
    expect(isServable(theme).reason).toContain("failing contrast pair");
  });

  /**
   * The reason `validatorVersion` is on the document. Tightening a rule must
   * not leave older themes live, and restoring an old version must re-check it
   * rather than trusting a verdict reached under different rules.
   */
  it("refuses one validated by an older validator", () => {
    const theme = publishedTheme();
    theme.validation!.validatorVersion = "0.9.0";
    expect(needsRevalidation(theme)).toBe(true);
    expect(isServable(theme).reason).toContain("re-validate before serving");
  });

  it("refuses one with no validation record at all", () => {
    const theme = publishedTheme();
    delete (theme as { validation?: unknown }).validation;
    expect(isServable(theme).reason).toBe("no validation record");
  });
});

/**
 * The two override tiers, and the refusal that makes them safe to open.
 *
 * A customer may move any token whose meaning is theirs to decide. They may not
 * move one that carries a clinical signal — and neither may a theme bridge, by
 * the same generated rule, so a colour cannot arrive through the framework door
 * that was refused at the app door.
 */
describe("semantic overrides", () => {
  const withSemantic = (light: Record<string, string>) => ({
    ref: {},
    semantic: { light, dark: {}, "high-contrast": {} },
    component: { light: {}, dark: {}, "high-contrast": {} },
  });

  it("accepts a token whose meaning is the customer's to decide", async () => {
    const result = validateTheme(await tokens(), "nw", withSemantic({ accent: "#0b5aa8" }), NOW);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  /**
   * The failure the whole tier turns on.
   *
   * Before semantic overrides existed, every problem a customer could cause was
   * reported against their brand, so `validateTheme` filtered on that prefix. An
   * override changes the *base* palette instead, and the gate reports those with
   * no prefix at all — so the first version of this let a customer make body
   * text unreadable and publish it, with the failure attributed to Oxygen and
   * shown to nobody.
   */
  it("fails an override that makes body text unreadable", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      // Near-white text on the light theme's near-white surface.
      withSemantic({ text: "#f2f4f7" }),
      NOW,
    );

    expect(result.ok).toBe(false);
    expect(result.problems.length).toBeGreaterThan(0);
    expect(result.record.contrastPairs.failed).toBe(result.problems.length);
  });

  it("checks the other themes too, not only the one that was edited", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      {
        ref: {},
        // Legible on paper, invisible on the dark theme's near-black ground.
        semantic: { light: {}, dark: { text: "#0b0f14" }, "high-contrast": {} },
        component: { light: {}, dark: {}, "high-contrast": {} },
      },
      NOW,
    );

    expect(result.ok).toBe(false);
  });

  it("ignores a key the palette does not define, rather than inventing a token", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      withSemantic({ "not-a-real-token": "#000000" }),
      NOW,
    );

    // Dropped by `sourceWithOverrides`, so it can never reach a stylesheet as a
    // property nothing reads.
    expect(result.ok).toBe(true);
  });
});

describe("component overrides", () => {
  const withComponent = (light: Record<string, string>) => ({
    ref: {},
    semantic: { light: {}, dark: {}, "high-contrast": {} },
    component: { light, dark: {}, "high-contrast": {} },
  });

  it("accepts a bridgeable colour token", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      // Accordion rather than badge: every badge colour is a status colour, so
      // the whole component is clinical and none of it is a legal example.
      withComponent({ "--ox-accordion-header-bg": "#0b5aa8" }),
      NOW,
    );
    expect(result.problems).toEqual([]);
  });

  it("refuses a property the manifest does not declare", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      withComponent({ "--ox-badge-critcal-bg": "#0b5aa8" }),
      NOW,
    );

    expect(result.ok).toBe(false);
    // The typo case: it would style nothing at all, silently, which is worse
    // than styling the wrong thing.
    expect(result.problems[0]?.message).toContain("not in the published token surface");
  });

  it("refuses a clinical component token", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      withComponent({ "--ox-badge-critical-bg": "#0b5aa8" }),
      NOW,
    );

    expect(result.ok).toBe(false);
    expect(result.problems[0]?.message).toContain("clinical status or an identity flag");
  });

  it("refuses a non-colour value for a token declared as a colour", async () => {
    const result = validateTheme(
      await tokens(),
      "nw",
      withComponent({ "--ox-accordion-header-bg": "3px" }),
      NOW,
    );

    expect(result.ok).toBe(false);
    expect(result.problems[0]?.message).toContain("declared as a colour");
  });
});

describe("themes stored before the override tiers existed", () => {
  /**
   * A published version is immutable, so `{ ref: … }` is a permanent shape
   * rather than a transitional one. It has to validate, not throw — and this is
   * the path the publish gate and the stylesheet route both run.
   */
  it("validate rather than throwing", async () => {
    const legacy = { ref: { brand: { "600": "#1d63c9" } } } as never;
    expect(() => validateTheme(source, "nw", legacy, NOW)).not.toThrow();
    expect(validateTheme(await tokens(), "nw", legacy, NOW).ok).toBe(true);
  });
});

/**
 * A passing fixture and a failing fixture for every check.
 *
 * A gate with nothing proving it fires is not a gate. Each block below breaks
 * exactly one rule so a failure identifies the rule, and each asserts the
 * *message* as well as the count — an accessibility error that does not say
 * which pair and by how much is an error a customer cannot act on.
 */

import { describe, expect, it } from "vitest";
import { validateTokens, type TokenProblem } from "../src/validate";
import { brand, map, text, validSource } from "./fixture";

const clean = (p: TokenProblem[]) => expect(text(p)).toBe("");

describe("the shipped-shape fixture", () => {
  it("passes every check", () => {
    clean(validateTokens(validSource()));
  });
});

describe("theme parity", () => {
  it("fails when a theme omits a semantic key", () => {
    const source = validSource();
    source.semantic.dark.delete("status.critical");
    source.semantic.dark.delete("status.critical-bg");

    const problems = validateTokens(source);
    expect(text(problems)).toContain('theme "dark" is missing semantic token "status.critical"');
  });

  it("fails when a theme invents a key the light theme does not define", () => {
    const source = validSource();
    source.semantic["high-contrast"].set("status.moderate", {
      path: "status.moderate",
      value: "#000000",
      file: "fixture",
    });

    expect(text(validateTokens(source))).toContain(
      'theme "high-contrast" defines "status.moderate", which the light theme does not',
    );
  });
});

describe("density parity", () => {
  it("fails when a profile omits a key the standard profile defines", () => {
    const source = validSource();
    source.density.clinical.delete("gap");

    expect(text(validateTokens(source))).toContain('density profile "clinical" is missing "gap"');
  });
});

describe("component tier", () => {
  it("fails when a component token reaches past the semantic tier to a primitive", () => {
    const source = validSource();
    source.component = map({ "badge.critical-fg": "{ref.brand.600}" });

    expect(text(validateTokens(source))).toContain(
      'component token "badge.critical-fg" references the primitive "ref.brand.600"',
    );
  });

  it("fails when a component token names a semantic that does not exist", () => {
    const source = validSource();
    source.component = map({ "badge.critical-fg": "{status.moderate}" });

    expect(text(validateTokens(source))).toContain(
      'references "status.moderate", which is not a semantic token',
    );
  });

  it("allows a reference to a density variable, which varies at runtime", () => {
    const source = validSource();
    source.component = map({ "badge.pad": "{density.gap}" });

    clean(validateTokens(source));
  });

  it("fails when a component token names a density key no profile defines", () => {
    const source = validSource();
    source.component = map({ "badge.pad": "{density.inset}" });

    expect(text(validateTokens(source))).toContain(
      'references "density.inset", but no density profile defines "inset"',
    );
  });
});

describe("status contrast", () => {
  it("fails a status foreground below its floor, naming the ratio", () => {
    const source = validSource();
    // #e46b6b on #fef2f2 is roughly 2.3:1 — clearly under 4.5.
    source.semantic.light.set("status.critical", {
      path: "status.critical",
      value: "#e46b6b",
      file: "fixture",
    });

    const message = text(validateTokens(source));
    expect(message).toContain('status.critical in theme "light"');
    expect(message).toMatch(/is \d+\.\d{2}:1 on its own background, below the 4\.5:1 floor/);
  });

  it("says plainly that critical does not get to be borderline", () => {
    const source = validSource();
    source.semantic.light.set("status.critical", {
      path: "status.critical",
      value: "#e46b6b",
      file: "fixture",
    });

    expect(text(validateTokens(source))).toContain("does not get to be borderline");
  });

  it("holds high contrast to 7:1 rather than 4.5:1", () => {
    const source = validSource();
    // ~5.9:1 — passes in light and dark, must fail in high-contrast.
    for (const theme of ["light", "dark", "high-contrast"] as const) {
      source.semantic[theme].set("status.critical", {
        path: "status.critical",
        value: "#b91c1c",
        file: "fixture",
      });
    }

    const message = text(validateTokens(source));
    expect(message).toContain('status.critical in theme "high-contrast"');
    expect(message).toContain("below the 7:1 floor");
    expect(message).not.toContain('status.critical in theme "light"');
  });

  it("refuses a status colour whose contrast cannot be computed", () => {
    const source = validSource();
    source.semantic.light.set("status.critical", {
      path: "status.critical",
      value: "#b91c1c80",
      file: "fixture",
    });

    expect(text(validateTokens(source))).toContain(
      "an unverifiable clinical colour is not shippable",
    );
  });

  /**
   * The rule that survives losing colour entirely. Two abnormal directions
   * rendered in one hue is a clinical signal deleted, not a palette preference.
   */
  it("fails when high and low are less than 60 degrees apart in hue", () => {
    const source = validSource();
    for (const theme of ["light", "dark", "high-contrast"] as const) {
      // Both reds. Each passes contrast on its own background; together they
      // make "above range" and "below range" the same colour.
      source.semantic[theme].set("status.low", {
        path: "status.low",
        value: "#a8341c",
        file: "fixture",
      });
      source.semantic[theme].set("status.low-bg", {
        path: "status.low-bg",
        value: "#fef2f2",
        file: "fixture",
      });
    }

    const message = text(validateTokens(source));
    expect(message).toMatch(/status\.high and status\.low in theme "light" are only \d+° apart/);
    expect(message).toContain("at least 60°");
  });
});

describe("text and interface contrast", () => {
  it("holds text to 4.5:1 and cites SC 1.4.3", () => {
    const source = validSource();
    source.semantic.light.set("text-muted", {
      path: "text-muted",
      value: "#9aa8b8",
      file: "fixture",
    });

    const message = text(validateTokens(source));
    expect(message).toContain("text-muted on bg");
    expect(message).toContain("below the 4.5:1 floor for SC 1.4.3 (text)");
  });

  /**
   * The distinction that a single blanket floor gets wrong in both directions:
   * a focus ring is an interface component (3:1), not body text (4.5:1).
   */
  it("holds an interface component to 3:1 and cites SC 1.4.11", () => {
    const source = validSource();
    // ~2.3:1 against white — under 3, so it fails as a UI component.
    source.semantic.light.set("focus-ring", {
      path: "focus-ring",
      value: "#7fc4b4",
      file: "fixture",
    });

    const message = text(validateTokens(source));
    expect(message).toContain("focus-ring on bg");
    expect(message).toContain("below the 3:1 floor for SC 1.4.11 (interface component)");
  });

  it("accepts a focus ring between 3:1 and 4.5:1, which body text would fail", () => {
    const source = validSource();
    // ~3.4:1 — legal for an interface component, illegal for text.
    source.semantic.light.set("focus-ring", {
      path: "focus-ring",
      value: "#3f9e88",
      file: "fixture",
    });

    expect(text(validateTokens(source))).not.toContain("focus-ring");
  });

  it("skips a pair it cannot compute rather than hard-failing", () => {
    // Several dark-theme surfaces are legitimately translucent.
    const source = validSource();
    source.semantic.dark.set("bg", { path: "bg", value: "#00000080", file: "fixture" });

    expect(text(validateTokens(source))).not.toContain('on bg in theme "dark"');
  });
});

describe("reference resolution", () => {
  it("fails when a semantic token points at nothing", () => {
    const source = validSource();
    source.semantic.light.set("accent", {
      path: "accent",
      value: "{ref.brand.999}",
      file: "fixture",
    });

    expect(text(validateTokens(source))).toContain(
      'token "accent" references "ref.brand.999", which does not exist',
    );
  });

  it("fails when a density token points at something that is not a primitive", () => {
    const source = validSource();
    source.density.standard.set("gap", { path: "gap", value: "{accent}", file: "fixture" });

    expect(text(validateTokens(source))).toContain(
      'density profile "standard": token "gap" references "accent", which is not a primitive',
    );
  });

  it("throws on a circular reference rather than recursing forever", () => {
    const source = validSource();
    source.primitive = map({
      "ref.brand.600": "{ref.brand.700}",
      "ref.brand.700": "{ref.brand.600}",
    });
    source.semantic.light.set("accent", {
      path: "accent",
      value: "{ref.brand.600}",
      file: "fixture",
    });

    expect(() => validateTokens(source)).toThrow(/circular token reference/);
  });
});

describe("brands", () => {
  it("accepts a brand that overrides existing primitives and still passes", () => {
    const source = validSource();
    source.brands = [brand("northwind", { "ref.brand.600": "#1d63c9" })];

    clean(validateTokens(source));
  });

  it("fails a brand that overrides a step the base palette does not define", () => {
    const source = validSource();
    source.brands = [brand("typo", { "ref.brand.650": "#1d63c9" })];

    expect(text(validateTokens(source))).toContain(
      'brand "typo" overrides "ref.brand.650", which the base palette does not define',
    );
  });

  /**
   * The failure a customer would otherwise ship: the base build is green, the
   * brand replaces the accent, and the primary button label goes unreadable.
   */
  it("re-runs the full contrast gate per brand and names the brand", () => {
    const source = validSource();
    source.semantic.light.set("accent", {
      path: "accent",
      value: "{ref.brand.600}",
      file: "fixture",
    });
    source.semantic.dark.set("accent", {
      path: "accent",
      value: "{ref.brand.600}",
      file: "fixture",
    });
    source.semantic["high-contrast"].set("accent", {
      path: "accent",
      value: "{ref.brand.600}",
      file: "fixture",
    });
    // A pale brand accent — white label on it is nowhere near 4.5:1.
    source.brands = [brand("pale", { "ref.brand.600": "#9fd8c8" })];

    const message = text(validateTokens(source));
    expect(message).toContain('brand "pale": text-on-accent on accent');
    expect(message).toContain("SC 1.4.3 (text)");
  });
});

/**
 * Reference resolution and the published evidence.
 *
 * `resolveFlat` is the one with history: the density block was once emitted
 * from raw values, so consumers of `tokens.json` received the literal string
 * `{ref.size.md}` instead of `1rem`. The last test here is that bug, pinned.
 */

import { describe, expect, it } from "vitest";
import {
  measureContrast,
  resolveFlat,
  resolveLiteral,
  resolveTheme,
  statusHues,
  themeLookup,
  brandedPrimitive,
} from "../src/validate";
import { brand, map, validSource } from "./fixture";

describe("resolveLiteral", () => {
  const lookup = (p: string) =>
    ({ "ref.brand.600": "#067662", accent: "{ref.brand.600}" })[p as string];

  it("returns a literal unchanged", () => {
    expect(resolveLiteral("#067662", lookup)).toBe("#067662");
  });

  it("follows a chain of references to the literal at the end", () => {
    expect(resolveLiteral("{accent}", lookup)).toBe("#067662");
  });

  it("returns undefined when the chain reaches nothing", () => {
    expect(resolveLiteral("{missing}", lookup)).toBeUndefined();
  });

  it("throws on a cycle rather than recursing forever, naming the path", () => {
    const circular = (p: string) => ({ a: "{b}", b: "{a}" })[p as string];
    expect(() => resolveLiteral("{a}", circular)).toThrow(/circular token reference: a → b → a/);
  });
});

describe("brandedPrimitive", () => {
  it("returns the base palette untouched when there is no brand", () => {
    const source = validSource();
    expect(brandedPrimitive(source, undefined)).toBe(source.primitive);
  });

  /**
   * Overlaying rather than replacing is what makes a brand a *partial* file: a
   * brand cannot delete a colour by not mentioning it.
   */
  it("overlays a partial brand onto the base rather than replacing it", () => {
    const source = validSource();
    const merged = brandedPrimitive(source, brand("nw", { "ref.brand.600": "#1d63c9" }));
    expect(merged.get("ref.brand.600")?.value).toBe("#1d63c9");
    expect(merged.get("ref.brand.700")?.value).toBe("#0a5d4f");
    expect(source.primitive.get("ref.brand.600")?.value).toBe("#067662");
  });
});

describe("themeLookup", () => {
  it("prefers semantic, then shared, then primitive", () => {
    const source = validSource();
    const lookup = themeLookup(source, "light");
    expect(lookup("accent")).toBe("#067662");
    expect(lookup("radius")).toBe("0.5rem");
    expect(lookup("ref.brand.700")).toBe("#0a5d4f");
    expect(lookup("nothing")).toBeUndefined();
  });
});

describe("statusHues", () => {
  it("reports a hue per status foreground", () => {
    const hues = statusHues(validSource(), "light");
    expect(Object.keys(hues).sort()).toEqual(["critical", "high", "low", "normal", "unknown"]);
    expect(hues.low).toBeGreaterThan(180);
  });

  it("omits a status whose value is not a computable colour", () => {
    const source = validSource();
    source.semantic.light.set("status.low", {
      path: "status.low",
      value: "#2563eb80",
      file: "f",
    });
    expect(statusHues(source, "light").low).toBeUndefined();
  });
});

describe("resolveTheme", () => {
  it("returns literals for shared and semantic tokens", () => {
    const flat = resolveTheme(validSource(), "light");
    expect(flat.get("accent")).toBe("#067662");
    expect(flat.get("radius")).toBe("0.5rem");
  });

  it("applies a brand's palette to the resolved values", () => {
    const source = validSource();
    source.semantic.light.set("accent", { path: "accent", value: "{ref.brand.600}", file: "f" });
    const flat = resolveTheme(source, "light", brand("nw", { "ref.brand.600": "#1d63c9" }));
    expect(flat.get("accent")).toBe("#1d63c9");
  });

  it("omits a token whose reference does not resolve", () => {
    const source = validSource();
    source.semantic.light.set("accent", { path: "accent", value: "{missing}", file: "f" });
    expect(resolveTheme(source, "light").has("accent")).toBe(false);
  });
});

describe("resolveFlat", () => {
  it("resolves a component token to the literal behind it", () => {
    const source = validSource();
    const flat = resolveFlat(source, source.component);
    expect(flat.get("badge.critical-fg")).toBe("#b91c1c");
  });

  /**
   * The pinned bug. A component token may reference density deliberately —
   * those vary per container and cannot be reduced to a literal at build time.
   * Publishing the raw `{density.gap}` alias made `tokens.json` unreadable to
   * every external tool; publishing the CSS variable is the honest answer.
   */
  it("publishes a density reference as a var(), never as a raw DTCG alias", () => {
    const source = validSource();
    const flat = resolveFlat(source, map({ "badge.pad": "{density.gap}" }));
    expect(flat.get("badge.pad")).toBe("var(--ox-density-gap)");
    expect(flat.get("badge.pad")).not.toContain("{");
  });
});

describe("measureContrast", () => {
  it("measures every theme", () => {
    const themes = new Set(measureContrast(validSource()).map((r) => r.theme));
    expect([...themes].sort()).toEqual(["dark", "high-contrast", "light"]);
  });

  it("publishes each pair with the floor its own rule imposes", () => {
    const readings = measureContrast(validSource());
    const light = readings.filter((r) => r.theme === "light");
    expect(light.find((r) => r.token === "focus-ring" && r.against === "bg")?.floor).toBe(3);
    expect(light.find((r) => r.token === "text" && r.against === "bg")?.floor).toBe(4.5);
    const hc = readings.filter((r) => r.theme === "high-contrast");
    expect(hc.find((r) => r.token === "text" && r.against === "bg")?.floor).toBe(7);
  });

  it("rounds to two decimals, which is what the table publishes", () => {
    for (const r of measureContrast(validSource())) {
      expect(r.ratio).toBe(Math.round(r.ratio * 100) / 100);
    }
  });

  it("every published reading clears its own floor", () => {
    for (const r of measureContrast(validSource())) {
      expect(r.ratio, `${r.token} on ${r.against} in ${r.theme}`).toBeGreaterThanOrEqual(r.floor);
    }
  });

  it("skips a pair it cannot compute rather than publishing a wrong number", () => {
    const source = validSource();
    source.semantic.light.set("bg", { path: "bg", value: "#ffffff80", file: "f" });
    const light = measureContrast(source).filter((r) => r.theme === "light");
    expect(light.some((r) => r.against === "bg")).toBe(false);
  });
});

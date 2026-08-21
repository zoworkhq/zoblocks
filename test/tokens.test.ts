/**
 * Tests for the token gate itself.
 *
 * The validator is the only thing standing between a palette edit and a
 * clinical colour nobody can read, and until now nothing proved it fires. That
 * is a worse gap than a failing token: a broken check reports green forever.
 *
 * Two halves:
 *   1. The maths — contrast, hex parsing, hue distance — against values with
 *      known answers, including the ones from the WCAG worked examples.
 *   2. The emitted output — every pair the gate claims to enforce is actually
 *      above its floor in every theme, read back from the generated artifacts
 *      rather than recomputed, so a broken *emit* is caught too.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOKEN_SURFACE } from "@oxygenui-design/tokens/surface";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));

/* ------------------------------------------------------------------ */
/* The maths, restated independently of the implementation             */
/* ------------------------------------------------------------------ */

/**
 * Deliberately a second implementation rather than an import. A test that
 * reuses the function under test proves only that it is self-consistent.
 */
function ratio(a: string, b: string): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const n = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
    return (
      0.2126 * channel(parseInt(n.slice(0, 2), 16)) +
      0.7152 * channel(parseInt(n.slice(2, 4), 16)) +
      0.0722 * channel(parseInt(n.slice(4, 6), 16))
    );
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

describe("contrast maths", () => {
  it("puts black on white at the theoretical maximum", () => {
    expect(ratio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("puts a colour against itself at 1:1", () => {
    expect(ratio("#059478", "#059478")).toBeCloseTo(1, 5);
  });

  it("is symmetric — order of arguments cannot change a ratio", () => {
    expect(ratio("#059478", "#ffffff")).toBeCloseTo(ratio("#ffffff", "#059478"), 10);
  });

  it("expands three-digit hex the same as six", () => {
    expect(ratio("#fff", "#000")).toBeCloseTo(ratio("#ffffff", "#000000"), 10);
  });

  it("agrees with the values this repository was corrected against", () => {
    // The three failures the widened gate was written to catch.
    expect(ratio("#10b995", "#ffffff")).toBeCloseTo(2.5, 1); // old focus ring
    expect(ratio("#ffffff", "#059478")).toBeCloseTo(3.81, 1); // old text-on-accent
    expect(ratio("#cbd5e1", "#ffffff")).toBeCloseTo(1.48, 1); // old border-strong
  });
});

/* ------------------------------------------------------------------ */
/* The emitted palette                                                 */
/* ------------------------------------------------------------------ */

type Reading = { theme: string; token: string; against: string; ratio: number; floor: number };

const contrast: Reading[] = read("packages/tokens/src/contrast.json");
const tokens = read("packages/tokens/src/tokens.json") as {
  themes: Record<string, Record<string, string>>;
  density: Record<string, Record<string, string>>;
  component: Record<string, string>;
};

describe("published contrast evidence", () => {
  it("covers all three themes", () => {
    expect(new Set(contrast.map((r) => r.theme))).toEqual(
      new Set(["light", "dark", "high-contrast"]),
    );
  });

  it("every published reading clears its own floor", () => {
    const failures = contrast
      .filter((r) => r.ratio < r.floor)
      .map((r) => `${r.theme}: ${r.token} on ${r.against} = ${r.ratio}:1 (floor ${r.floor})`);
    expect(failures).toEqual([]);
  });

  it("includes the pairs whose absence let three failures ship", () => {
    // Regression guard for the gate's shape, not its values. If someone
    // narrows the pair list again, this fails.
    const has = (token: string, against: string) =>
      contrast.some((r) => r.token === token && r.against === against);

    expect(has("focus-ring", "bg"), "focus indicator vs page").toBe(true);
    expect(has("text-on-accent", "accent"), "primary button label").toBe(true);
    expect(has("border-strong", "bg"), "field border vs page").toBe(true);
    expect(has("border-strong", "surface"), "field border vs card").toBe(true);
    expect(has("flag.restricted", "flag.restricted-bg"), "restricted flag").toBe(true);
  });

  it("holds interface components to 3:1 and text to 4.5:1", () => {
    const floorOf = (token: string, theme = "light") =>
      contrast.find((r) => r.theme === theme && r.token === token)?.floor;

    expect(floorOf("focus-ring")).toBe(3);
    expect(floorOf("border-strong")).toBe(3);
    expect(floorOf("text")).toBe(4.5);
    expect(floorOf("text-on-accent")).toBe(4.5);
  });

  it("holds the high-contrast theme to a stricter floor than the others", () => {
    const hcText = contrast.find((r) => r.theme === "high-contrast" && r.token === "text");
    const lightText = contrast.find((r) => r.theme === "light" && r.token === "text");
    expect(hcText?.floor).toBeGreaterThan(lightText?.floor ?? 0);
  });
});

describe("emitted token values", () => {
  it("keeps the three corrected values above their floors, computed fresh", () => {
    for (const theme of ["light", "dark"]) {
      const t = tokens.themes[theme];
      expect(t, `theme ${theme}`).toBeDefined();
      if (!t) continue;

      const bg = t["--ox-bg"] ?? "";
      const surface = t["--ox-surface"] ?? "";
      expect(ratio(t["--ox-focus-ring"] ?? "", bg), `${theme} focus-ring`).toBeGreaterThanOrEqual(
        3,
      );
      expect(
        ratio(t["--ox-text-on-accent"] ?? "", t["--ox-accent"] ?? ""),
        `${theme} text-on-accent`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        ratio(t["--ox-border-strong"] ?? "", bg),
        `${theme} border-strong on bg`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        ratio(t["--ox-border-strong"] ?? "", surface),
        `${theme} border-strong on surface`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves every value — no DTCG alias may leak into the output", () => {
    // `tokens.json` is documented as a flat map for external tooling. An
    // unresolved "{ref.size.md}" reaching a consumer is a silent corruption.
    //
    // `var(--ox-density-*)` is deliberately allowed: density varies per
    // container and genuinely cannot be reduced at build time, so a runtime
    // reference is the honest value. A raw DTCG alias never is.
    const leaked: string[] = [];
    const scan = (group: string, map: Record<string, string>) => {
      for (const [k, v] of Object.entries(map)) {
        if (typeof v === "string" && /\{[^}]+\}/.test(v)) leaked.push(`${group}.${k} = ${v}`);
      }
    };
    for (const [theme, map] of Object.entries(tokens.themes)) scan(`themes.${theme}`, map);
    for (const [profile, map] of Object.entries(tokens.density)) scan(`density.${profile}`, map);
    scan("component", tokens.component);

    expect(leaked).toEqual([]);
  });

  it("gives every theme the same key space", () => {
    const keys = Object.keys(tokens.themes.light ?? {}).sort();
    for (const theme of ["dark", "high-contrast"]) {
      expect(Object.keys(tokens.themes[theme] ?? {}).sort(), `theme ${theme}`).toEqual(keys);
    }
  });

  it("gives every density profile the same key space", () => {
    const keys = Object.keys(tokens.density.standard ?? {}).sort();
    for (const profile of ["patient", "clinical"]) {
      expect(Object.keys(tokens.density[profile] ?? {}).sort(), `density ${profile}`).toEqual(keys);
    }
  });

  it("never lets a component token reach a primitive", () => {
    const violations = Object.entries(tokens.component)
      .filter(([, v]) => typeof v === "string" && v.includes("--ox-ref-"))
      .map(([k]) => k);
    expect(violations).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* The generated catalog — the contract the docs site renders           */
/* ------------------------------------------------------------------ */

describe("generated prop documentation", () => {
  const catalog = readFileSync(path.join(ROOT, "apps/docs/src/lib/generated/catalog.ts"), "utf8");

  const propsOf = (component: string): string[] => {
    const start = catalog.indexOf(`"name": "${component}"`);
    if (start === -1) return [];
    const segment = catalog.slice(start, start + 80_000);
    const block = segment.match(/"props": \[([\s\S]*?)\n {4}\],/);
    const body = block?.[1];
    return body ? [...body.matchAll(/"name": "([^"]+)"/g)].map((m) => m[1] ?? "") : [];
  };

  /**
   * Regression guard for a defect that made every props table wrong.
   *
   * The extractor filtered to props declared in the component's own file, so a
   * shared interface was invisible: `pulse-loader` documented exactly one prop
   * while the component accepted twenty. A docs site that understates an API by
   * 95% is worse than one with no table, because a reader trusts it.
   */
  it("documents the shared interface, not just the component's own props", () => {
    const props = propsOf("pulse-loader");
    expect(props.length).toBeGreaterThanOrEqual(15);

    for (const required of ["label", "mode", "size", "delay", "progress", "motion", "bpm"]) {
      expect(props, `pulse-loader should document "${required}"`).toContain(required);
    }
  });

  it("documents every loader's full surface", () => {
    for (const component of ["rhythm-loader", "breath-loader", "helix-loader", "infusion-loader"]) {
      expect(propsOf(component).length, component).toBeGreaterThanOrEqual(15);
    }
  });

  it("still collapses the inherited HTML surface rather than listing it", () => {
    // The other half of the rule: ~280 React.HTMLAttributes members must NOT
    // appear as props. They are summarised in `extendsType`.
    const props = propsOf("pulse-loader");
    for (const html of ["onClick", "tabIndex", "dangerouslySetInnerHTML", "spellCheck"]) {
      expect(props, `"${html}" is the HTML surface, not the API`).not.toContain(html);
    }
    expect(props.length).toBeLessThan(40);
  });

  it("keeps bpm only on the cardiac loaders", () => {
    expect(propsOf("pulse-loader")).toContain("bpm");
    expect(propsOf("rhythm-loader")).toContain("bpm");
    expect(propsOf("breath-loader")).not.toContain("bpm");
    expect(propsOf("helix-loader")).not.toContain("bpm");
  });
});

/* ------------------------------------------------------------------ */
/* Brands — ADR 0005's headline claim                                  */
/* ------------------------------------------------------------------ */

describe("brand axis", () => {
  const css = readFileSync(path.join(ROOT, "packages/tokens/src/oxygen-tokens.css"), "utf8");
  const branded = tokens as typeof tokens & {
    brands?: Record<string, Record<string, Record<string, string>>>;
  };

  it("emits a scoped block per brand", () => {
    // "A new customer brand is a JSON file and a build" — the claim is only
    // true if the build actually produces something a page can switch on.
    expect(css).toContain('[data-ox-brand="northwind"]');
  });

  it("replaces primitives, so every semantic token downstream follows", () => {
    const base = tokens.themes.light?.["--ox-accent"];
    const brand = branded.brands?.northwind?.light?.["--ox-accent"];
    expect(brand).toBeDefined();
    expect(brand).not.toBe(base);
  });

  it("re-themes in dark as well as light, without a second brand file", () => {
    const light = branded.brands?.northwind?.light?.["--ox-accent"];
    const dark = branded.brands?.northwind?.dark?.["--ox-accent"];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(dark).not.toBe(light);
  });

  it("inherits every status colour", () => {
    // The one thing a clinical design system does not delegate: a brand may
    // not redefine what critical looks like.
    for (const theme of ["light", "dark", "high-contrast"]) {
      for (const status of ["critical", "high", "low", "normal", "unknown"]) {
        expect(
          branded.brands?.northwind?.[theme]?.[`--ox-status-${status}`],
          `${theme} status.${status} must be inherited`,
        ).toBe(tokens.themes[theme]?.[`--ox-status-${status}`]);
      }
    }
  });

  it("holds every brand to the same contrast floors as the base palette", () => {
    // The gate that makes branding safe: a customer palette that pushes the
    // focus ring or a label under its floor does not build.
    for (const [name, themes] of Object.entries(branded.brands ?? {})) {
      for (const [theme, map] of Object.entries(themes)) {
        const floor = theme === "high-contrast" ? 7 : 4.5;
        expect(
          ratio(map["--ox-text-on-accent"] ?? "", map["--ox-accent"] ?? ""),
          `${name}/${theme}: label on a primary action`,
        ).toBeGreaterThanOrEqual(floor);
        expect(
          ratio(map["--ox-focus-ring"] ?? "", map["--ox-bg"] ?? ""),
          `${name}/${theme}: focus indicator`,
        ).toBeGreaterThanOrEqual(theme === "high-contrast" ? 4.5 : 3);
      }
    }
  });

  it("gives a brand the same key space as the base theme", () => {
    for (const [name, themes] of Object.entries(branded.brands ?? {})) {
      for (const [theme, map] of Object.entries(themes)) {
        expect(Object.keys(map).sort(), `${name}/${theme}`).toEqual(
          Object.keys(tokens.themes[theme] ?? {}).sort(),
        );
      }
    }
  });

  it("places brand blocks after the base palette, so they win on source order", () => {
    expect(css.indexOf('[data-ox-brand="northwind"]')).toBeGreaterThan(css.indexOf(":root {"));
  });
});

describe("density-linked component tokens", () => {
  const css = readFileSync(path.join(ROOT, "packages/tokens/src/oxygen-tokens.css"), "utf8");

  /** The declarations inside one `[data-ox-density="…"]` block. */
  function densityBlock(profile: string): string {
    const start = css.indexOf(`[data-ox-density="${profile}"] {`);
    expect(start, `no block for density "${profile}"`).toBeGreaterThan(-1);
    return css.slice(start, css.indexOf("\n}", start));
  }

  /**
   * The bug this guards is silent and was shipped.
   *
   * `var()` inside a custom-property declaration is substituted against the
   * element the declaration applies to. `--ox-switch-target-min:
   * var(--ox-density-target)` written once on `:root` therefore captures the
   * root profile's value and inherits that literal — so a container marked
   * `data-ox-density="clinical"` moved `--ox-density-target` beneath it while
   * every switch inside kept the root profile's hit area.
   *
   * Nothing looked wrong. The component's own accessibility note claimed the
   * target followed density, and it did not.
   */
  const DENSITY_LINKED = [
    "--ox-switch-target-min",
    "--ox-switch-gap",
    "--ox-accordion-target",
    "--ox-accordion-pad-x",
    "--ox-accordion-pad-y",
  ];

  for (const profile of ["patient", "standard", "clinical"]) {
    it(`re-declares every density-linked component token under "${profile}"`, () => {
      const block = densityBlock(profile);
      for (const token of DENSITY_LINKED) {
        expect(
          block,
          `${token} is not re-declared in the "${profile}" block, so it will resolve against :root and ignore this profile`,
        ).toContain(`${token}:`);
      }
    });
  }

  it("keeps every density-linked component token pointing at a density var", () => {
    // If one of these ever resolves to a literal, the profile blocks stop
    // meaning anything and the freeze comes back by a different route.
    const block = densityBlock("clinical");
    for (const token of DENSITY_LINKED) {
      const line = block.split("\n").find((l) => l.trim().startsWith(`${token}:`));
      expect(line, `${token} missing`).toBeDefined();
      expect(line, `${token} should reference a --ox-density-* var`).toMatch(
        /var\(--ox-density-[a-z-]+\)/,
      );
    }
  });

  it("finds no density-linked component token left only on :root", () => {
    const root = css.slice(css.indexOf(":root {"), css.indexOf("\n}", css.indexOf(":root {")));
    const linked = [
      ...root.matchAll(/(--ox-(?!density)[a-z0-9-]+):\s*var\(--ox-density-[a-z-]+\)/g),
    ]
      .map((m) => m[1] as string)
      .filter((name) => !densityBlock("clinical").includes(`${name}:`));

    expect(
      linked,
      "these component tokens reference density but are declared only on :root, so they freeze at the root profile",
    ).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* The extraction, held to the output it replaced                      */
/* ------------------------------------------------------------------ */

/**
 * The gate moved out of `scripts/gen/tokens/validate.ts` and into
 * `@oxygenui-design/tokens/validate` so the theme app can run the same
 * rules the build runs. A refactor of the one module that decides whether a
 * clinical colour is readable deserves more than "the build still passed".
 *
 * These read the real DTCG source through the generator's loader and put the
 * *package's* validator over it, then compare against the committed evidence.
 * A drift in either direction fails here rather than in a palette review.
 */
describe("the extracted validator agrees with the shipped evidence", () => {
  it("reports no problem on the source that ships", async () => {
    const { loadTokenSource } = await import("../scripts/gen/tokens/load");
    const { validateTokens } = await import("@oxygenui-design/tokens/validate");

    const problems = validateTokens(await loadTokenSource());
    expect(problems.map((p) => p.message)).toEqual([]);
  });

  it("reproduces contrast.json exactly, reading and measuring independently", async () => {
    const { loadTokenSource } = await import("../scripts/gen/tokens/load");
    const { measureContrast } = await import("@oxygenui-design/tokens/validate");

    const measured = measureContrast(await loadTokenSource());
    const committed = read("packages/tokens/src/contrast.json");

    // Order included: the emitter writes readings in iteration order, so a
    // reordering is a diff in the published table and should be deliberate.
    expect(measured).toEqual(committed);
  });

  it("still holds every brand to the base palette's bar", async () => {
    const { loadTokenSource } = await import("../scripts/gen/tokens/load");
    const { validateTokens } = await import("@oxygenui-design/tokens/validate");

    const source = await loadTokenSource();
    expect(
      source.brands.length,
      "northwind is the fixture the brand gate runs against",
    ).toBeGreaterThan(0);

    // Push the brand's accent ramp somewhere unreadable and confirm the gate
    // notices — the failure a customer would otherwise ship, because the base
    // build was green.
    const brand = source.brands[0]!;
    for (const key of ["ref.brand.600", "ref.brand.700", "ref.brand.800"]) {
      brand.primitive.set(key, { path: key, value: "#cfeee6", file: "test" });
    }

    const messages = validateTokens(source).map((p) => p.message);
    expect(messages.some((m) => m.startsWith(`brand "${brand.name}":`))).toBe(true);
  });
});

/**
 * The surface manifest says what kind of value each token holds, and consumers
 * act on it: a bridge writing an antd theme, an editor rendering a colour
 * picker, a validator deciding what a customer may type into a field. A token
 * labelled `color` that actually holds a timing function is not a cosmetic
 * error — it is a swatch picker rendered on a cubic-bezier, which is exactly
 * what the app showed before this was fixed.
 *
 * Both defects behind those tests were ordering problems rather than missing
 * rules, and both reported green for as long as nobody looked:
 *
 *   - `kindOf` tested colour before shadow, and a shadow *contains* a colour.
 *   - A DTCG group `$type` is flattened onto every token beneath it, so
 *     `switch.ease` — an alias to a cubic-bezier — inherited `color` from the
 *     fifty-odd switch tokens that genuinely are colours.
 */
describe("every token is labelled with the kind of value it holds", () => {
  // The committed manifest, imported the way a consumer imports it — not a
  // recomputation, which would test this file's copy of the rules.
  const surface = TOKEN_SURFACE as readonly {
    name: string;
    kind: string;
    initial?: string;
  }[];

  it("covers the whole surface", () => {
    expect(surface.length).toBeGreaterThan(250);
  });

  it("never calls a shadow a colour", () => {
    const wrong = surface.filter(
      (t) => t.kind === "color" && /\d+px\s+[\d.-]+px/.test(t.initial ?? ""),
    );
    expect(wrong.map((t) => t.name)).toEqual([]);
  });

  it("never calls a timing function a colour", () => {
    const wrong = surface.filter(
      (t) => t.kind === "color" && /cubic-bezier|\b(ease|steps)\b/.test(t.initial ?? ""),
    );
    expect(wrong.map((t) => t.name)).toEqual([]);
  });

  it("never calls a duration a colour", () => {
    const wrong = surface.filter(
      (t) => t.kind === "color" && /^\s*[\d.]+m?s\s*$/.test(t.initial ?? ""),
    );
    expect(wrong.map((t) => t.name)).toEqual([]);
  });

  /**
   * The other direction, which is the one a narrowed rule would break: every
   * token the manifest *does* call a colour has to look like one, so a future
   * fix cannot make the tests above pass by labelling everything `dimension`.
   */
  it("only calls something a colour when it looks like one", () => {
    const wrong = surface.filter(
      (t) =>
        t.kind === "color" &&
        t.initial !== undefined &&
        !/#[0-9a-f]{3,8}\b|\b(rgb|hsl|oklch|color-mix)\(|\bvar\(|transparent|currentColor|none|inherit/i.test(
          t.initial,
        ),
    );
    expect(wrong.map((t) => `${t.name} = ${t.initial}`)).toEqual([]);
  });
});

/**
 * Token emitters. One DTCG source, five outputs.
 *
 *   packages/tokens/src/zoblocks-tokens.css   what the registry copies into a customer's project
 *   packages/tokens/src/tailwind.css        a Tailwind v4 @theme block
 *   packages/tokens/src/tokens.ts           typed constants, for JS that computes with a value
 *   packages/tokens/src/tokens.json         flat map, for Figma and other tooling
 *   packages/tokens/src/contrast.json       measured ratios, published as conformance evidence
 *
 * The CSS keeps `var()` chains rather than inlining literals. That is what
 * makes a brand a data file: replace the primitive block and every semantic
 * token downstream follows, with no component change and no rebuild of the
 * component tier.
 */

import path from "node:path";
import { ROOT, banner } from "../config";
import type { Emitter } from "../write";
import {
  DEFAULT_DENSITY,
  DENSITIES,
  THEMES,
  cssVar,
  toCssValue,
  type Theme,
  type TokenMap,
  type TokenSource,
} from "./load";
import { measureContrast, resolveFlat, resolveTheme } from "./validate";

export const tokenPaths = {
  css: path.join(ROOT, "packages", "tokens", "src", "zoblocks-tokens.css"),
  tailwind: path.join(ROOT, "packages", "tokens", "src", "tailwind.css"),
  ts: path.join(ROOT, "packages", "tokens", "src", "tokens.ts"),
  json: path.join(ROOT, "packages", "tokens", "src", "tokens.json"),
  contrast: path.join(ROOT, "packages", "tokens", "src", "contrast.json"),
} as const;

/**
 * Selectors a theme's value set is applied under.
 *
 * Light is in `:root` *and* named, so a subtree can be forced light inside a
 * dark page. Without the named selector the three themes are not symmetric —
 * two of them can be scoped and one can only be a default — and a light panel
 * inside a dark shell has no way to ask for the tokens it needs.
 */
const THEME_SELECTOR: Record<Theme, string | undefined> = {
  light: '.light,\n[data-theme="light"],\n[data-zb-theme="light"]',
  dark: '.dark,\n[data-theme="dark"],\n[data-zb-theme="dark"]',
  "high-contrast": '[data-zb-theme="high-contrast"]',
};

function section(title: string, note?: string): string {
  const rule = "-".repeat(Math.max(0, 68 - title.length));
  const lines = [`  /* ${title} ${rule}`];
  if (note) {
    for (const line of note.split("\n")) lines.push(`   * ${line}`.trimEnd());
  }
  lines.push("   */");
  return lines.join("\n");
}

function declarations(map: TokenMap, rename?: (path: string) => string): string[] {
  const out: string[] = [];
  for (const token of map.values()) {
    const name = rename ? rename(token.path) : cssVar(token.path);
    out.push(`  ${name}: ${toCssValue(token.value)};`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// zoblocks-tokens.css
// ---------------------------------------------------------------------------

function buildCss(source: TokenSource): string {
  const out: string[] = [];

  out.push(banner("/*"));
  out.push("");
  out.push("/**");
  out.push(" * ZoBlocks — design tokens");
  out.push(" *");
  out.push(" * Plain CSS custom properties, so the same file works in a Tailwind v4");
  out.push(" * project, a CSS-modules project, or plain CSS.");
  out.push(" *");
  out.push(" * Three tiers, with a strict reference rule:");
  out.push(" *");
  out.push(" *   --zb-ref-*        primitive   referenced by semantic tokens only");
  out.push(" *   --zb-status-*     semantic    referenced by components");
  out.push(" *   --zb-badge-*      component   referenced by one component; your override point");
  out.push(" *");
  out.push(" * Three axes: brand × theme (light, dark, high-contrast) × density");
  out.push(" * (patient, standard, clinical).");
  out.push(" *");
  out.push(" * Status is never communicated by colour alone. Every status token has a");
  out.push(" * matching icon and text label in the component layer. These colours are");
  out.push(" * reinforcement, not the signal.");
  out.push(" */");
  out.push("");

  // -- :root ---------------------------------------------------------------
  out.push(":root {");

  out.push(
    section(
      "Primitive — the reference palette",
      "Do not reference these from a component. A brand replaces this block\nwholesale; a component that reaches past the semantic tier to a colour\nhere silently ignores the brand. Enforced by @zoblocks/no-primitive-token.",
    ),
  );
  out.push(...declarations(source.primitive));
  out.push("");

  out.push(section("Semantic — typography, shape, motion", "Identical in every theme."));
  out.push(...declarations(source.shared));
  out.push("");

  out.push(
    section(
      "Semantic — light theme",
      "The key space every other theme must match. A theme missing a key here\nis a build error, not a fallback.",
    ),
  );
  out.push(...declarations(source.semantic.light));
  out.push("");

  out.push(
    section(
      `Density — default profile (${DEFAULT_DENSITY})`,
      "So a page that never sets data-zb-density is still usable rather than\nunstyled.",
    ),
  );
  out.push(...declarations(source.density[DEFAULT_DENSITY], (key) => `--zb-density-${key}`));
  out.push(...declarations(source.densityRoot));
  out.push("");

  out.push(
    section(
      "Component — the override surface",
      "Every one of these resolves to a semantic token. That makes them follow a\ntheme applied at the root, and — because a var() in a custom-property\ndeclaration is substituted where it is declared — *not* a theme applied to a\nsubtree, unless they are re-declared there too. They are, in each theme block\nbelow, the same way the density profiles handle it. Override any of them to\nrestyle a component without editing the source you were shipped.",
    ),
  );
  out.push(...declarations(source.component));

  out.push("}");
  out.push("");

  // ---- Brands -----------------------------------------------------------
  //
  // A brand replaces primitives only, so a single block per brand re-declares
  // the palette and every semantic token downstream follows automatically —
  // which is the whole point of the tier discipline. No component knows a brand
  // exists.
  //
  // Emitted after the base palette so a brand wins on source order at equal
  // specificity, and scoped to an attribute so it can be applied to <html> or
  // to any subtree — a portal previewing a customer's theme inside our own
  // admin, for instance.
  for (const brand of source.brands) {
    out.push(
      section(
        `Brand — ${brand.name}`,
        brand.description ?? "Customer palette. Overrides primitives only.",
      ),
    );
    out.push(`[data-zb-brand="${brand.name}"] {`);
    out.push(...declarations(brand.primitive));
    out.push("}");
    out.push("");
  }

  // -- density profiles ----------------------------------------------------
  out.push("/* Density profiles. Nestable — innermost wins. */");

  /**
   * Component tokens that track density have to be re-declared per profile.
   *
   * `var()` inside a custom-property *declaration* is substituted using the
   * referenced value as computed on the element the declaration applies to. So
   * `--zb-switch-target-min: var(--zb-density-target)` written once on `:root`
   * captures the root profile's 2.75rem and inherits that literal everywhere —
   * and `data-zb-density="clinical"` on a container changes
   * `--zb-density-target` beneath it while the component token stays frozen at
   * whatever the root said.
   *
   * That is not a cosmetic drift. `--zb-switch-target-min` is the hit area, and
   * the accessibility note for that component claims it follows the density
   * profile. It did not: every switch on every page presented the root
   * profile's target no matter what scope it sat in.
   *
   * Re-emitting them inside each profile makes the reference resolve against
   * that profile. The override surface is unchanged — these carry the same
   * specificity as the profile block a host would write, and an inline style
   * or a more specific selector still wins.
   */
  const densityLinked = [...source.component].filter(([, token]) =>
    /\{density\./.test(token.value),
  );

  for (const profile of DENSITIES) {
    out.push(`[data-zb-density="${profile}"] {`);
    out.push(...declarations(source.density[profile], (key) => `--zb-density-${key}`));
    if (densityLinked.length) {
      out.push("");
      out.push("  /* Component tokens that track density — see the note above. */");
      out.push(...declarations(new Map(densityLinked)));
    }
    out.push("}");
    out.push("");
  }

  // -- themes --------------------------------------------------------------
  /*
   * The same substitution rule that forced the density re-emit above, and it
   * was missed here because a theme is nearly always applied to <html> — where
   * `:root` and `.dark` are the *same element*, so the component tier resolves
   * against the dark values and everything looks correct.
   *
   * Apply a theme to a subtree instead and it silently stops working: the
   * component tokens were already substituted on the root against the light
   * semantic values, and a descendant inherits those computed literals. The
   * docs galleries are exactly that case — each demo stage carries its own
   * theme so three can be shown at once — and every date field in a dark or
   * high-contrast stage rendered on a white background, because
   * `--zb-field-bg` still held the root's `--zb-surface`.
   *
   * It is not only ours: a customer putting a dark sidebar or a preview panel
   * inside a light app hits it the same way, and the tier discipline is what
   * promises them it will work.
   */
  const themeLinked = [...source.component].filter(
    ([, token]) => /\{[^}]+\}/.test(token.value) && !/\{density\./.test(token.value),
  );

  for (const theme of THEMES) {
    const selector = THEME_SELECTOR[theme];
    if (!selector) continue;

    const note =
      theme === "dark"
        ? "Status colours are re-tuned rather than reused: the light values do not\n   hold contrast on a dark surface, and critical must stay unmistakable."
        : "Targets 7:1 rather than 4.5:1, and spends the contrast budget on text and\n   borders rather than on tinted surfaces — a pale wash behind dark text is\n   the first thing to disappear for the reader who selected this theme.";

    out.push(`/* ${theme}\n   ${note} */`);
    out.push(`${selector} {`);
    out.push(...declarations(source.semantic[theme]));
    if (themeLinked.length) {
      out.push("");
      out.push("  /* Component tokens that track the semantic tier — see the note above. */");
      out.push(...declarations(new Map(themeLinked)));
    }
    out.push("}");
    out.push("");
  }

  // -- media queries -------------------------------------------------------
  out.push("/* Reduced motion. Clinical surfaces must remain fully usable without it. */");
  out.push("@media (prefers-reduced-motion: reduce) {");
  out.push("  :root {");
  out.push("    --zb-duration-fast: 0ms;");
  out.push("    --zb-duration: 0ms;");
  out.push("    --zb-duration-slow: 0ms;");
  out.push("  }");
  out.push("}");
  out.push("");

  out.push("/* Forced colours (Windows High Contrast).");
  out.push("   Every custom colour is discarded here, which is exactly why a status");
  out.push("   label and icon are mandatory rather than decorative. */");
  out.push("@media (forced-colors: active) {");
  out.push("  :root {");
  out.push("    --zb-border: CanvasText;");
  out.push("    --zb-border-strong: CanvasText;");
  out.push("    --zb-focus-ring: Highlight;");
  out.push("  }");
  out.push("}");

  return out.join("\n");
}

// ---------------------------------------------------------------------------
// tailwind.css
// ---------------------------------------------------------------------------

/** Tailwind v4 namespaces. A token's `$type` decides which one it lands in. */
function tailwindNamespace(type: string | undefined): string | undefined {
  switch (type) {
    case "color":
      return "color";
    case "dimension":
      return "spacing";
    case "fontFamily":
      return "font";
    default:
      return undefined;
  }
}

function buildTailwind(source: TokenSource): string {
  const out: string[] = [];

  out.push(banner("/*"));
  out.push("");
  out.push("/**");
  out.push(" * Tailwind v4 theme block.");
  out.push(" *");
  out.push(" * Import after zoblocks-tokens.css to get `bg-zb-status-critical-bg`,");
  out.push(" * `text-zb-status-critical` and friends as real utilities rather than");
  out.push(" * arbitrary values. Every entry points at the custom property rather than a");
  out.push(" * literal, so theme and density switching still happens in CSS at runtime.");
  out.push(" */");
  out.push("");
  out.push("@theme {");

  const seen = new Set<string>();
  for (const map of [source.shared, source.semantic.light, source.component]) {
    for (const token of map.values()) {
      const namespace = tailwindNamespace(token.type);
      if (!namespace) continue;

      const flat = token.path.split(".").join("-");
      const name = `--${namespace}-zb-${flat}`;
      if (seen.has(name)) continue;
      seen.add(name);

      out.push(`  ${name}: var(${cssVar(token.path)});`);
    }
  }

  out.push("}");
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// tokens.ts and tokens.json
// ---------------------------------------------------------------------------

function buildTs(source: TokenSource): string {
  const out: string[] = [];

  out.push(banner("//"));
  out.push("");
  out.push("/**");
  out.push(" * Token values for JavaScript that has to compute with one rather than hand");
  out.push(" * it to the browser — chart geometry, canvas rendering, and anything that");
  out.push(" * needs to know what a colour actually is.");
  out.push(" *");
  out.push(" * Prefer `cssVar` in anything that renders. A literal read from `themeValues`");
  out.push(" * is a snapshot of one theme and will not follow a theme or brand change.");
  out.push(" */");
  out.push("");

  const names = [...source.shared.keys(), ...source.semantic.light.keys()].sort();

  out.push("/** Every semantic token name. */");
  out.push(`export const TOKEN_NAMES = [`);
  for (const name of names) out.push(`  ${JSON.stringify(name)},`);
  out.push("] as const;");
  out.push("");
  out.push("export type TokenName = (typeof TOKEN_NAMES)[number];");
  out.push("");
  out.push('/** `cssVar("status.critical")` → `"var(--zb-status-critical)"`. */');
  out.push("export function cssVar(name: TokenName): string {");
  out.push('  return `var(--zb-${name.split(".").join("-")})`;');
  out.push("}");
  out.push("");
  out.push("export const THEMES = [");
  for (const theme of THEMES) out.push(`  ${JSON.stringify(theme)},`);
  out.push("] as const;");
  out.push("");
  out.push("export type Theme = (typeof THEMES)[number];");
  out.push("");
  out.push("/** Resolved literals, per theme. */");
  out.push("export const themeValues: Record<Theme, Record<TokenName, string>> = {");
  for (const theme of THEMES) {
    const resolved = resolveTheme(source, theme);
    out.push(`  ${JSON.stringify(theme)}: {`);
    for (const name of names) {
      const value = resolved.get(name);
      if (value === undefined) continue;
      out.push(`    ${JSON.stringify(name)}: ${JSON.stringify(value)},`);
    }
    out.push("  },");
  }
  out.push("};");

  return out.join("\n");
}

function buildJson(source: TokenSource): string {
  const themes: Record<string, Record<string, string>> = {};
  for (const theme of THEMES) {
    themes[theme] = Object.fromEntries(
      [...resolveTheme(source, theme)].map(([name, value]) => [cssVar(name), value]),
    );
  }

  // Resolved, like the theme and component blocks above. This used to publish
  // `token.value` raw, so three density entries shipped the literal string
  // "{ref.size.md}" to anything consuming the file the header describes as a
  // flat map for external tooling. Reference resolution was checked; output
  // shape was not, which is why it survived.
  const density: Record<string, Record<string, string>> = {};
  for (const profile of DENSITIES) {
    density[profile] = Object.fromEntries(
      [...resolveFlat(source, source.density[profile])].map(([key, value]) => [
        `--zb-density-${key}`,
        value,
      ]),
    );
  }

  const component = Object.fromEntries(
    [...resolveFlat(source, source.component)].map(([name, value]) => [cssVar(name), value]),
  );

  // Brands are published as fully resolved theme maps rather than as their
  // overrides, because a consumer asking "what colour is --zb-accent for
  // Northwind in dark?" should not have to re-implement the resolver.
  const brands: Record<string, Record<string, Record<string, string>>> = {};
  for (const brand of source.brands) {
    const themed: Record<string, Record<string, string>> = {};
    for (const theme of THEMES) {
      themed[theme] = Object.fromEntries(
        [...resolveTheme(source, theme, brand)].map(([name, value]) => [cssVar(name), value]),
      );
    }
    brands[brand.name] = themed;
  }

  return JSON.stringify(
    { themes, density, component, ...(source.brands.length ? { brands } : {}) },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------

export async function emitTokens(source: TokenSource, emitter: Emitter): Promise<void> {
  await emitter.emit(tokenPaths.css, buildCss(source));
  await emitter.emit(tokenPaths.tailwind, buildTailwind(source));
  await emitter.emit(tokenPaths.ts, buildTs(source));
  await emitter.emit(tokenPaths.json, buildJson(source));
  await emitter.emit(tokenPaths.contrast, JSON.stringify(measureContrast(source), null, 2));
}

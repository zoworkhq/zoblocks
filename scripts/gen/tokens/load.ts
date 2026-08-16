/**
 * Reads the DTCG token source and flattens it into something the emitters and
 * validators can both walk.
 *
 * The W3C Design Token Community Group format nests tokens inside groups, and
 * distinguishes a group from a token by the presence of `$value`. Everything
 * here is that rule plus reference resolution.
 *
 * See content/decisions/0005-three-tier-token-pipeline.md.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../config";

export const TOKENS_DIR = path.join(ROOT, "packages", "tokens", "tokens");

/** The themes a build produces. `light` defines the key space the others must match. */
export const THEMES = ["light", "dark", "high-contrast"] as const;
export type Theme = (typeof THEMES)[number];

/** Density profiles. Order matters — it is the order they are emitted in. */
export const DENSITIES = ["patient", "standard", "clinical"] as const;
export type DensityName = (typeof DENSITIES)[number];

/** The profile `:root` carries, so a page with no `data-ox-density` is still usable. */
export const DEFAULT_DENSITY: DensityName = "standard";

export interface Token {
  /** Dot path in the source, e.g. `status.critical`. */
  path: string;
  /** Raw `$value`, which may be a `{reference}`. */
  value: string;
  type?: string;
  description?: string;
  /** Source file, for error messages that point somewhere useful. */
  file: string;
}

export type TokenMap = Map<string, Token>;

interface DtcgNode {
  $value?: unknown;
  $type?: string;
  $description?: string;
  [key: string]: unknown;
}

/**
 * Flattens a DTCG document.
 *
 * `$type` inherits down the group tree, which is what lets a group declare
 * `"$type": "color"` once instead of on all sixty of its children.
 */
function flatten(
  node: DtcgNode,
  prefix: string[],
  inheritedType: string | undefined,
  file: string,
  out: TokenMap,
): void {
  const type = typeof node.$type === "string" ? node.$type : inheritedType;

  if (node.$value !== undefined) {
    const dotted = prefix.join(".");
    if (out.has(dotted)) {
      throw new Error(`duplicate token "${dotted}" (${file})`);
    }
    out.set(dotted, {
      path: dotted,
      value: String(node.$value),
      type,
      description: typeof node.$description === "string" ? node.$description : undefined,
      file,
    });
    return;
  }

  for (const [key, child] of Object.entries(node)) {
    // $-prefixed keys are metadata, never tokens.
    if (key.startsWith("$")) continue;
    if (!child || typeof child !== "object") continue;
    flatten(child as DtcgNode, [...prefix, key], type, file, out);
  }
}

async function readDoc(relative: string): Promise<{ doc: DtcgNode; file: string }> {
  const file = path.join(TOKENS_DIR, relative);
  const raw = await readFile(file, "utf8");
  try {
    return { doc: JSON.parse(raw) as DtcgNode, file: relative };
  } catch (error) {
    throw new Error(`${relative} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

async function load(relative: string): Promise<TokenMap> {
  const { doc, file } = await readDoc(relative);
  const out: TokenMap = new Map();
  flatten(doc, [], undefined, file, out);
  return out;
}

/**
 * A customer palette, overriding primitives only.
 *
 * ADR 0005's headline claim is that a new brand is a JSON file and a build. The
 * tier discipline is what makes that true: components reference semantic tokens,
 * semantic tokens reference primitives, so replacing the palette reaches every
 * component without any component knowing a brand exists.
 *
 * Deliberately primitives only. Letting a brand override the semantic tier would
 * let it redefine what *critical* means, and that is the one thing a clinical
 * design system does not delegate.
 */
export interface Brand {
  /** Directory-derived id, used as the `[data-ox-brand]` value. */
  name: string;
  description?: string;
  /** Primitive overrides, keyed like the base primitive map (`ref.brand.600`). */
  primitive: TokenMap;
}

export interface TokenSource {
  /** Primitive tier. Paths are prefixed `ref.`. */
  primitive: TokenMap;
  /** Theme-independent semantic tokens — typography, shape, motion. */
  shared: TokenMap;
  /** Semantic tier, one map per theme. Same key space in every one. */
  semantic: Record<Theme, TokenMap>;
  /** Density profiles, keyed by profile then by token key. */
  density: Record<DensityName, TokenMap>;
  /** Density tokens that sit outside a profile, e.g. the target floor. */
  densityRoot: TokenMap;
  /** Component tier. Resolves to semantic tokens only. */
  component: TokenMap;
  /** Customer palettes. Empty is the normal case. */
  brands: Brand[];
}

/**
 * Reads every `brands/*.json`.
 *
 * Absent directory, or only the README, is the normal case and not an error —
 * most installs have no customer brand.
 */
async function loadBrands(): Promise<Brand[]> {
  const dir = path.join(TOKENS_DIR, "brands");
  if (!existsSync(dir)) return [];

  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();

  const brands: Brand[] = [];
  for (const file of files) {
    const name = file.replace(/\.json$/, "");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      throw new Error(
        `brands/${file}: name must be kebab-case — it becomes the [data-ox-brand] value and a CSS attribute selector`,
      );
    }
    const map = await load(path.join("brands", file));
    const doc = JSON.parse(await readFile(path.join(dir, file), "utf8")) as {
      $description?: string;
    };

    for (const key of map.keys()) {
      if (!key.startsWith("ref.")) {
        throw new Error(
          `brands/${file}: "${key}" is not a primitive. A brand overrides the palette (ref.*), never the semantic tier — that is what keeps "critical" meaning the same thing for every customer.`,
        );
      }
    }

    brands.push({ name, description: doc.$description, primitive: map });
  }
  return brands;
}

export async function loadTokenSource(): Promise<TokenSource> {
  const [primitive, shared, light, dark, highContrast, densityDoc, component] = await Promise.all([
    load("primitive.json"),
    load("semantic/shared.json"),
    load("semantic/light.json"),
    load("semantic/dark.json"),
    load("semantic/high-contrast.json"),
    load("density.json"),
    load("component.json"),
  ]);

  // Density arrives as one document holding all three profiles. Split it so the
  // parity check has three comparable key spaces rather than one flat list in
  // which a missing key looks like a different key.
  const density = {} as Record<DensityName, TokenMap>;
  for (const name of DENSITIES) density[name] = new Map();
  const densityRoot: TokenMap = new Map();

  for (const [dotted, token] of densityDoc) {
    const [head, ...rest] = dotted.split(".");
    if (head === "density" && rest.length >= 2) {
      const profile = rest[0] as DensityName;
      if (!DENSITIES.includes(profile)) {
        throw new Error(`density.json defines unknown profile "${profile}"`);
      }
      const key = rest.slice(1).join("-");
      density[profile].set(key, { ...token, path: key });
      continue;
    }
    densityRoot.set(dotted, token);
  }

  return {
    primitive,
    shared,
    semantic: { light, dark, "high-contrast": highContrast },
    density,
    densityRoot,
    component,
    brands: await loadBrands(),
  };
}

/** `status.critical` → `--ox-status-critical`. One rule for every tier. */
export function cssVar(dotted: string): string {
  return `--ox-${dotted.split(".").join("-")}`;
}

const REFERENCE = /^\{([^}]+)\}$/;

/** A `$value` that is exactly one `{reference}` and nothing else. */
export function referenceTarget(value: string): string | undefined {
  return REFERENCE.exec(value.trim())?.[1];
}

/**
 * Rewrites a `$value` for CSS emission.
 *
 * References become `var()` rather than the literal they resolve to, which is
 * what makes a brand able to replace the primitive palette without every
 * semantic token needing to be redeclared.
 *
 * `{density.pad-x}` is deliberately allowed even though no token has that path:
 * the density vars are runtime-varying by profile, so a component token that
 * wants "whatever the current density's padding is" has to reference the
 * variable rather than any one profile's value.
 */
export function toCssValue(value: string): string {
  return value.replace(/\{([^}]+)\}/g, (_, ref: string) => `var(${cssVar(ref)})`);
}

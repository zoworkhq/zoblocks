/**
 * The token model, and the pure helpers that operate on it.
 *
 * This file holds everything about the shape of a token source that does not
 * involve reading one. The split matters: the generator reads DTCG documents
 * off disk, but the theme console has to validate a palette a customer typed
 * into a browser, and both must be judged by exactly the same rules.
 *
 * Nothing here may import `node:*`. That constraint is the whole point of the
 * module — see content/decisions/0012-token-surface-is-a-contract.md.
 */

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

/**
 * A customer palette, overriding primitives only.
 *
 * Deliberately primitives only. Letting a brand override the semantic tier
 * would let it redefine what *critical* means, and that is the one thing a
 * clinical design system does not delegate.
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

import { fromDtcg } from "./dtcg";

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

/**
 * A DTCG document node. A group becomes a token the moment it has `$value`.
 */
export interface DtcgNode {
  $value?: unknown;
  $type?: string;
  $description?: string;
  [key: string]: unknown;
}

/**
 * Flattens a DTCG document into a `TokenMap`.
 *
 * `$type` inherits down the group tree, which is what lets a group declare
 * `"$type": "color"` once instead of on all sixty of its children.
 *
 * Pure: the caller supplies the already-parsed document and a label for it, so
 * this works identically over a file the generator read and over a payload the
 * console received.
 */
export function flattenDtcg(
  node: DtcgNode,
  file: string,
  out: TokenMap = new Map(),
  prefix: string[] = [],
  inheritedType?: string,
): TokenMap {
  const type = typeof node.$type === "string" ? node.$type : inheritedType;

  if (node.$value !== undefined) {
    const dotted = prefix.join(".");
    if (out.has(dotted)) {
      throw new Error(`duplicate token "${dotted}" (${file})`);
    }
    out.set(dotted, {
      path: dotted,
      /*
       * `fromDtcg`, not `String()`.
       *
       * The spec's structured values — `{ value: 120, unit: "ms" }`, a
       * cubic-bezier as four numbers, a shadow as named offsets — stringify to
       * "[object Object]" under `String()`. That parses, validates, and emits a
       * custom property whose value is meaningless, so the component renders
       * with no shadow rather than failing. Reading both shapes is what lets a
       * customer's Tokens Studio export be imported at all.
       */
      value: fromDtcg(node.$value),
      type,
      description: typeof node.$description === "string" ? node.$description : undefined,
      file,
    });
    return out;
  }

  for (const [key, child] of Object.entries(node)) {
    // $-prefixed keys are metadata, never tokens.
    if (key.startsWith("$")) continue;
    if (!child || typeof child !== "object") continue;
    flattenDtcg(child as DtcgNode, file, out, [...prefix, key], type);
  }
  return out;
}

/**
 * Reference resolution and the published contrast evidence.
 *
 * CSS emission keeps `var()` chains so a brand can replace the palette in one
 * place. This module is the other view of the same data: flat literals, for
 * anything that has to compute with a token value rather than hand it to the
 * browser — the contrast gate, chart geometry, the conformance table.
 */

import { contrastRatio, hue, parseHex } from "./color";
import { CONTRAST_PAIRS, floorFor, floorForPair, STATUS_PAIRS, type StatusName } from "./pairs";
import {
  THEMES,
  referenceTarget,
  toCssValue,
  type Brand,
  type Theme,
  type TokenMap,
  type TokenSource,
} from "./model";

/**
 * Resolves a token to a literal, following references through the primitive
 * tier. Emission uses `var()` chains instead; this exists so the contrast gate
 * has actual numbers to work with.
 */
export function resolveLiteral(
  value: string,
  lookup: (path: string) => string | undefined,
  seen: string[] = [],
): string | undefined {
  const target = referenceTarget(value);
  if (!target) return value;

  if (seen.includes(target)) {
    throw new Error(`circular token reference: ${[...seen, target].join(" → ")}`);
  }
  const next = lookup(target);
  if (next === undefined) return undefined;
  return resolveLiteral(next, lookup, [...seen, target]);
}

/**
 * A palette with a brand's overrides applied on top.
 *
 * Overlaying rather than replacing is what makes a brand a *partial* file: it
 * supplies the steps it cares about and inherits the rest, so a brand cannot
 * accidentally delete a colour by not mentioning it.
 */
export function brandedPrimitive(source: TokenSource, brand: Brand | undefined): TokenMap {
  if (!brand) return source.primitive;
  const merged = new Map(source.primitive);
  for (const [key, token] of brand.primitive) merged.set(key, token);
  return merged;
}

export function themeLookup(source: TokenSource, theme: Theme, brand?: Brand) {
  const primitive = brandedPrimitive(source, brand);
  return (path: string): string | undefined => {
    const semantic = source.semantic[theme].get(path);
    if (semantic) return semantic.value;
    const shared = source.shared.get(path);
    if (shared) return shared.value;
    const ref = primitive.get(path);
    if (ref) return ref.value;
    return undefined;
  };
}

/** The resolved hue of every status foreground in one theme. */
export function statusHues(
  source: TokenSource,
  theme: Theme,
  brand?: Brand,
): Partial<Record<StatusName, number>> {
  const lookup = themeLookup(source, theme, brand);
  const hues: Partial<Record<StatusName, number>> = {};
  for (const status of STATUS_PAIRS) {
    const raw = lookup(`status.${status}`);
    if (raw === undefined) continue;
    const literal = resolveLiteral(raw, lookup);
    const rgb = literal ? parseHex(literal) : undefined;
    if (rgb) hues[status] = hue(rgb);
  }
  return hues;
}

/**
 * Every semantic and shared token resolved to a literal, for one theme.
 */
export function resolveTheme(
  source: TokenSource,
  theme: Theme,
  brand?: Brand,
): Map<string, string> {
  const lookup = themeLookup(source, theme, brand);
  const out = new Map<string, string>();

  for (const map of [source.shared, source.semantic[theme]]) {
    for (const token of map.values()) {
      const literal = resolveLiteral(token.value, lookup);
      if (literal !== undefined) out.set(token.path, literal);
    }
  }

  return out;
}

/**
 * Density and component tiers resolved to literals.
 *
 * `resolveTheme` covers the theme tiers; this covers the two that are
 * theme-invariant, so that every block of `tokens.json` is literal. The file is
 * documented as a flat map for Figma and other tooling, and neither an alias
 * (`{ref.size.md}`) nor a CSS variable (`var(--ox-ref-size-md)`) is a value an
 * external tool can read.
 */
export function resolveFlat(source: TokenSource, map: TokenMap): Map<string, string> {
  const lookup = (path: string): string | undefined =>
    source.semantic.light.get(path)?.value ??
    source.shared.get(path)?.value ??
    source.primitive.get(path)?.value;

  const out = new Map<string, string>();
  for (const [key, token] of map) {
    const literal = resolveLiteral(token.value, lookup);
    // A component token may reference density deliberately — those vary per
    // container and cannot be reduced to a literal at build time. Publish them
    // as the CSS variable they resolve to at runtime, never as a raw
    // "{density.pad-x}" alias, which is meaningless to every consumer.
    out.set(key, literal ?? toCssValue(token.value));
  }
  return out;
}

/** Resolved contrast figures, published in the accessibility conformance table. */
export interface ContrastReading {
  theme: Theme;
  token: string;
  against: string;
  ratio: number;
  floor: number;
}

export function measureContrast(source: TokenSource): ContrastReading[] {
  const readings: ContrastReading[] = [];

  for (const theme of THEMES) {
    const lookup = themeLookup(source, theme);

    // Published evidence must be the same list the gate enforces. Two lists is
    // how `flag.restricted` ended up measured, printed, and checked by nothing.
    // Each pair carries the floor its own rule imposes. Publishing one blanket
    // floor made the evidence table disagree with the gate: a focus ring was
    // reported failing 4.5:1 while the gate correctly held it to 3:1.
    const pairs: { fg: string; bg: string; floor: number }[] = [
      ...STATUS_PAIRS.map((s) => ({
        fg: `status.${s}`,
        bg: `status.${s}-bg`,
        floor: floorFor(theme),
      })),
      ...CONTRAST_PAIRS.map((p) => ({
        fg: p.fg,
        bg: p.bg,
        floor: floorForPair(theme, p.kind),
      })),
    ];

    for (const { fg: fgKey, bg: bgKey, floor: pairFloor } of pairs) {
      const fgLiteral = resolveLiteral(lookup(fgKey) ?? "", lookup);
      const bgLiteral = resolveLiteral(lookup(bgKey) ?? "", lookup);
      const fg = fgLiteral ? parseHex(fgLiteral) : undefined;
      const bg = bgLiteral ? parseHex(bgLiteral) : undefined;
      if (!fg || !bg) continue;

      readings.push({
        theme,
        token: fgKey,
        against: bgKey,
        ratio: Math.round(contrastRatio(fg, bg) * 100) / 100,
        floor: pairFloor,
      });
    }
  }

  return readings;
}

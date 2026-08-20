/**
 * Token validation.
 *
 * Every check here exists because the failure it catches is silent. A theme
 * missing a status colour still renders. A component token pointing at a
 * primitive still renders. A critical badge at 4.4:1 still renders. In each
 * case the page looks fine and a clinical signal is degraded, which is exactly
 * the class of bug this library exists to prevent — so it fails the build
 * rather than waiting to be noticed.
 *
 * See content/decisions/0005-three-tier-token-pipeline.md.
 */

import { contrastRatio, hue, hueDistance, parseHex } from "./color";
import {
  CONTRAST_PAIRS,
  HUE_SEPARATION_FLOOR,
  STATUS_PAIRS,
  floorFor,
  floorForPair,
  type StatusName,
} from "./pairs";
import { resolveLiteral, themeLookup } from "./resolve";
import {
  DENSITIES,
  THEMES,
  referenceTarget,
  type Brand,
  type DensityName,
  type TokenMap,
  type TokenSource,
} from "./model";

export interface TokenProblem {
  message: string;
}

function checkThemeParity(source: TokenSource, problems: TokenProblem[]): void {
  const contract = [...source.semantic.light.keys()].sort();

  for (const theme of THEMES) {
    if (theme === "light") continue;
    const actual = new Set(source.semantic[theme].keys());

    for (const key of contract) {
      if (!actual.has(key)) {
        problems.push({
          message: `theme "${theme}" is missing semantic token "${key}". A theme that omits a key would silently inherit the light value — and on a status colour that means rendering the wrong clinical signal, not a cosmetic difference.`,
        });
      }
    }
    for (const key of actual) {
      if (!contract.includes(key)) {
        problems.push({
          message: `theme "${theme}" defines "${key}", which the light theme does not. Semantic keys are a contract; a theme may change values, never the key space.`,
        });
      }
    }
  }
}

function checkDensityParity(source: TokenSource, problems: TokenProblem[]): void {
  const contract = [...source.density.standard.keys()].sort();

  for (const profile of DENSITIES) {
    if (profile === "standard") continue;
    const actual = new Set(source.density[profile].keys());
    for (const key of contract) {
      if (!actual.has(key)) {
        problems.push({
          message: `density profile "${profile}" is missing "${key}". A profile that omits a key inherits whatever :root happens to hold, which makes the profile's spacing depend on load order.`,
        });
      }
    }
  }
}

/**
 * The tier rule, enforced rather than reviewed.
 *
 * A component token pointing at a primitive is the specific failure that makes
 * multi-brand theming quietly wrong: the brand overrides the semantic tier, the
 * component reaches past it, and the customer's critical colour renders as ours.
 */
function checkComponentTier(source: TokenSource, problems: TokenProblem[]): void {
  const semanticKeys = new Set([...source.semantic.light.keys(), ...source.shared.keys()]);

  for (const token of source.component.values()) {
    const refs = [...token.value.matchAll(/\{([^}]+)\}/g)]
      .map((m) => m[1])
      .filter((ref): ref is string => ref !== undefined);

    for (const ref of refs) {
      if (ref.startsWith("ref.")) {
        problems.push({
          message: `component token "${token.path}" references the primitive "${ref}". Component tokens resolve to semantic tokens so that a brand override reaches them. Add a semantic token if none fits.`,
        });
        continue;
      }
      // Density vars are runtime-varying by profile, so referencing the
      // variable rather than one profile's value is the correct thing to do.
      if (ref.startsWith("density.")) {
        const key = ref.slice("density.".length);
        if (!source.density.standard.has(key)) {
          problems.push({
            message: `component token "${token.path}" references "${ref}", but no density profile defines "${key}".`,
          });
        }
        continue;
      }
      if (!semanticKeys.has(ref)) {
        problems.push({
          message: `component token "${token.path}" references "${ref}", which is not a semantic token.`,
        });
      }
    }
  }
}

/**
 * Contrast, and the reason the status tier is effectively locked.
 *
 * A brand may replace the palette wholesale and may retune any semantic value —
 * but not into something a reader cannot read. A design system for clinical
 * software is allowed to have opinions its customers cannot override, and this
 * is the one that matters most.
 */
export function checkStatusContrast(
  source: TokenSource,
  problems: TokenProblem[],
  brand?: Brand,
): void {
  for (const theme of THEMES) {
    const lookup = themeLookup(source, theme, brand);
    const floor = floorFor(theme);
    const hues: Partial<Record<StatusName, number>> = {};

    for (const status of STATUS_PAIRS) {
      const fgRaw = lookup(`status.${status}`);
      const bgRaw = lookup(`status.${status}-bg`);
      if (fgRaw === undefined || bgRaw === undefined) continue; // parity check reports this

      const fgLiteral = resolveLiteral(fgRaw, lookup);
      const bgLiteral = resolveLiteral(bgRaw, lookup);
      const fg = fgLiteral ? parseHex(fgLiteral) : undefined;
      const bg = bgLiteral ? parseHex(bgLiteral) : undefined;

      if (!fg || !bg) {
        problems.push({
          message: `status.${status} in theme "${theme}" does not resolve to a six-digit hex pair (got ${fgLiteral ?? "?"} on ${bgLiteral ?? "?"}). Contrast cannot be verified, and an unverifiable clinical colour is not shippable.`,
        });
        continue;
      }

      const ratio = contrastRatio(fg, bg);
      if (ratio < floor) {
        problems.push({
          message: `status.${status} in theme "${theme}" is ${ratio.toFixed(2)}:1 on its own background, below the ${floor}:1 floor. ${
            status === "critical"
              ? "This is the single most consequential token in the library; it does not get to be borderline."
              : "A status badge that fails contrast is a status badge some readers cannot read."
          }`,
        });
      }
      hues[status] = hue(fg);
    }

    // high and low must be separated by hue, not only by intensity, so the
    // direction of an abnormal result survives monochrome printing and the
    // common forms of colour vision deficiency.
    const high = hues.high;
    const low = hues.low;
    if (high !== undefined && low !== undefined) {
      const separation = hueDistance(high, low);
      if (separation < HUE_SEPARATION_FLOOR) {
        problems.push({
          message: `status.high and status.low in theme "${theme}" are only ${separation.toFixed(0)}° apart in hue. They must differ by at least ${HUE_SEPARATION_FLOOR}° so the direction of an abnormal result survives monochrome output and colour vision deficiency.`,
        });
      }
    }
  }
}

export function checkTextContrast(
  source: TokenSource,
  problems: TokenProblem[],
  brand?: Brand,
): void {
  for (const theme of THEMES) {
    const lookup = themeLookup(source, theme, brand);

    for (const { fg: fgKey, bg: bgKey, kind } of CONTRAST_PAIRS) {
      const fgRaw = lookup(fgKey);
      const bgRaw = lookup(bgKey);
      // A pair naming a token this theme does not define is a parity problem,
      // reported by checkThemeParity. Silence here would hide it twice.
      if (fgRaw === undefined || bgRaw === undefined) continue;

      const fgLiteral = resolveLiteral(fgRaw, lookup);
      const bgLiteral = resolveLiteral(bgRaw, lookup);
      const fg = fgLiteral ? parseHex(fgLiteral) : undefined;
      const bg = bgLiteral ? parseHex(bgLiteral) : undefined;

      // Unlike the status check this does not hard-fail on an unparseable
      // value: several of these backgrounds are legitimately translucent in
      // dark themes, where a ratio against an unknown backdrop is not a number
      // we can honestly compute.
      if (!fg || !bg) continue;

      const floor = floorForPair(theme, kind);
      const ratio = contrastRatio(fg, bg);
      if (ratio < floor) {
        const rule = kind === "text" ? "SC 1.4.3 (text)" : "SC 1.4.11 (interface component)";
        problems.push({
          message: `${fgKey} on ${bgKey} in theme "${theme}" is ${ratio.toFixed(2)}:1, below the ${floor}:1 floor for ${rule}.`,
        });
      }
    }
  }
}

/** Every reference resolves, in every theme. An unresolved one emits `var(--ox-nothing)`. */
function checkReferencesResolve(source: TokenSource, problems: TokenProblem[]): void {
  for (const theme of THEMES) {
    const lookup = themeLookup(source, theme);

    for (const token of source.semantic[theme].values()) {
      const target = referenceTarget(token.value);
      if (target && lookup(target) === undefined) {
        problems.push({
          message: `theme "${theme}": token "${token.path}" references "${target}", which does not exist.`,
        });
      }
    }
  }

  for (const token of source.shared.values()) {
    const target = referenceTarget(token.value);
    if (target && !source.primitive.has(target) && !source.shared.has(target)) {
      problems.push({
        message: `shared token "${token.path}" references "${target}", which does not exist.`,
      });
    }
  }

  for (const [profile, map] of Object.entries(source.density) as [DensityName, TokenMap][]) {
    for (const token of map.values()) {
      const target = referenceTarget(token.value);
      if (target && !source.primitive.has(target)) {
        problems.push({
          message: `density profile "${profile}": token "${token.path}" references "${target}", which is not a primitive.`,
        });
      }
    }
  }
}

/**
 * Every brand is held to the base palette's bar.
 *
 * A brand overriding the palette can quietly push the focus ring or a status
 * colour under its contrast floor — and the customer would ship it, because the
 * base build was green. Each brand therefore re-runs the full contrast and hue
 * gate against its own resolved values, in every theme.
 *
 * Customers get their colours. They do not get an unreadable clinical display.
 */
function checkBrands(source: TokenSource, problems: TokenProblem[]): void {
  const baseKeys = new Set(source.primitive.keys());

  for (const brand of source.brands) {
    // A typo in a brand file must be a build failure, not a line the build
    // silently ignores while the customer wonders why nothing changed.
    for (const key of brand.primitive.keys()) {
      if (!baseKeys.has(key)) {
        problems.push({
          message: `brand "${brand.name}" overrides "${key}", which the base palette does not define. A brand may only replace steps that exist.`,
        });
      }
    }

    const brandProblems: TokenProblem[] = [];
    checkStatusContrast(source, brandProblems, brand);
    checkTextContrast(source, brandProblems, brand);

    for (const problem of brandProblems) {
      problems.push({ message: `brand "${brand.name}": ${problem.message}` });
    }
  }
}

/**
 * The whole gate.
 *
 * Order is deliberate: parity first, because a missing key makes every later
 * check report a second, more confusing symptom of the same cause.
 */
export function validateTokens(source: TokenSource): TokenProblem[] {
  const problems: TokenProblem[] = [];

  checkThemeParity(source, problems);
  checkDensityParity(source, problems);
  checkReferencesResolve(source, problems);
  checkComponentTier(source, problems);
  checkStatusContrast(source, problems);
  checkTextContrast(source, problems);
  checkBrands(source, problems);

  return problems;
}

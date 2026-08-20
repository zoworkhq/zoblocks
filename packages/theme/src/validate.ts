/**
 * A customer theme, judged by the same gate the build uses.
 *
 * There is exactly one validator. It lives in `@oxygenui-design/tokens/validate`
 * as pure functions so that the build, the console's live preview, and the
 * server-side publish check all call identical code — because a customer whose
 * palette passed in the browser and failed in CI has been told two different
 * things about the same colour.
 *
 * This module is the adapter: it takes a customer's ramp, overlays it on the
 * shipped palette exactly as a built-in brand is overlaid, and hands the result
 * to the gate. The brand path is reused rather than reimplemented, which is why
 * a customer theme is held to precisely the bar `northwind.json` is.
 */

import {
  parseHex,
  validateTokens,
  type Brand,
  type TokenProblem,
  type TokenSource,
} from "@oxygenui-design/tokens/validate";
import { surfaceEntry } from "@oxygenui-design/tokens/surface";
import {
  withTierDefaults,
  type ThemeDocument,
  type ThemeTokensInput,
  type ValidationRecord,
} from "./document";

/**
 * The validator's identity, recorded on every published theme.
 *
 * Bumped to 1.1.0 when semantic and component overrides became expressible: a
 * theme validated by 1.0.0 was checked by rules that had no concept of them, so
 * `needsRevalidation` must refuse to serve it until it has been checked again.
 * That is the whole reason this string is on the document.
 */
export const VALIDATOR_VERSION = "1.1.0";

export interface ThemeValidation {
  ok: boolean;
  problems: TokenProblem[];
  record: ValidationRecord;
}

/** A customer's ramp in the shape the gate's brand path already understands. */
export function themeAsBrand(slug: string, tokens: ThemeTokensInput): Brand {
  const primitive = new Map<string, { path: string; value: string; file: string }>();
  for (const [group, steps] of Object.entries(tokens.ref ?? {})) {
    for (const [step, value] of Object.entries(steps)) {
      const path = `ref.${group}.${step}`;
      primitive.set(path, { path, value, file: `theme:${slug}` });
    }
  }
  return { name: slug, primitive };
}

/**
 * The shipped source with a customer's semantic overrides laid over it.
 *
 * The overrides have to go *into the source* rather than be checked afterwards,
 * because contrast is a property of a pair and either side may be overridden. A
 * customer who moves `text-muted` and leaves `surface` alone has changed a pair
 * the gate already knows about; a customer who moves both has changed it twice.
 * Overlaying and re-running the whole gate is the only version of this that
 * cannot miss a combination — and it is the same overlay `brandedPrimitive`
 * already does one tier down.
 *
 * Component overrides are deliberately *not* overlaid. They are leaves: nothing
 * resolves through them, so they cannot change a semantic pair, and the gate has
 * no pair list for them. What guards them instead is the clinical refusal in the
 * schema plus `componentProblems` below, which is the honest scope — claiming a
 * contrast verdict over an arbitrary component token would mean inventing which
 * background it lands on.
 */
export function sourceWithOverrides(source: TokenSource, tokens: ThemeTokensInput): TokenSource {
  const overrides = withTierDefaults(tokens).semantic;
  const semantic = {} as TokenSource["semantic"];

  for (const theme of Object.keys(source.semantic) as (keyof TokenSource["semantic"])[]) {
    const base = new Map(source.semantic[theme]);
    for (const [path, value] of Object.entries(overrides[theme] ?? {})) {
      // Only a token the source already defines. A new key would be a token
      // nothing reads, and the gate would report nothing about it — the silent
      // typo case the brand key-space check exists to make loud.
      if (!base.has(path)) continue;
      base.set(path, { path, value, file: "theme:semantic" });
    }
    semantic[theme] = base;
  }

  return { ...source, semantic };
}

/**
 * Component overrides the manifest refuses, or that are the wrong sort of value.
 *
 * Two checks the schema cannot do on its own: it does not have the manifest, so
 * it cannot tell `--ox-badge-critical-bg` (real) from `--ox-badge-critcal-bg`
 * (a typo that would silently style nothing), and it cannot tell that a token
 * declared `kind: "color"` was given `3px`.
 */
export function componentProblems(tokens: ThemeTokensInput): TokenProblem[] {
  const problems: TokenProblem[] = [];

  for (const [theme, entries] of Object.entries(withTierDefaults(tokens).component)) {
    for (const [name, value] of Object.entries(entries)) {
      const entry = surfaceEntry(name);
      if (!entry) {
        problems.push({
          message:
            `component override ${name} (${theme}) is not in the published token surface. ` +
            "A property the manifest does not declare styles nothing, silently.",
        });
        continue;
      }
      if (!entry.bridgeable) {
        problems.push({
          message: `component override ${name} (${theme}) resolves to clinical status or an identity flag and cannot be overridden.`,
        });
        continue;
      }
      if (entry.kind === "color" && !parseHex(value)) {
        problems.push({
          message:
            `component override ${name} (${theme}) is declared as a colour and was given ${JSON.stringify(value)}. ` +
            "Three or six hex digits; eight carry alpha, and contrast against an unknown backdrop cannot be verified.",
        });
      }
    }
  }

  return problems;
}

/**
 * Validate a theme against the shipped token source.
 *
 * `source` is the base palette and semantic tiers — loaded from disk by the
 * build, and by the console from the same published artifact its components
 * render against. Passing it in rather than reading it keeps this pure and
 * keeps the console honest about which palette it validated on.
 *
 * The customer's brand *replaces* any brands the source already carries: the
 * gate reports a problem per brand, and including the built-in ones would tell
 * a customer their theme failed because of ours.
 */
export function validateTheme(
  source: TokenSource,
  slug: string,
  tokens: ThemeTokensInput,
  now: string,
): ThemeValidation {
  const brand = themeAsBrand(slug, tokens);
  const problems = validateTokens({ ...sourceWithOverrides(source, tokens), brands: [brand] });

  /*
   * Every problem the gate raises for a brand names it first, in one of two
   * shapes: `brand "x" overrides …` for a key-space error, and `brand "x": …`
   * for a contrast or hue failure forwarded from the base checks. Matching only
   * the second silently passed a brand that named a step the palette does not
   * define — the typo case, which is exactly the one a customer hits and the
   * one the gate was written to make loud.
   */
  const prefix = `brand "${slug}"`;

  /*
   * Base-tier problems count too, once semantic overrides exist.
   *
   * Before they did, every problem a customer could cause was reported against
   * their brand, so filtering to that prefix was exact. A semantic override
   * changes the *base* palette the gate walks, and the gate reports those
   * without a brand prefix — so filtering on the prefix alone would have let a
   * customer move `text-muted` to something unreadable and publish it, with the
   * failure attributed to Oxygen and shown to nobody.
   *
   * Base problems are therefore included whenever the theme overrides anything
   * semantic, and only then: with no overrides the base palette is ours, it
   * passes its own gate in CI, and reporting our problems against a customer's
   * theme would be blaming them for our colours.
   */
  const overridesSemantic = Object.values(withTierDefaults(tokens).semantic).some(
    (entries) => Object.keys(entries).length > 0,
  );
  const mine = problems.filter((p) => p.message.startsWith(prefix) || overridesSemantic);

  // Every problem the gate raises is a refusal — there is no warning tier, on
  // purpose. An accessibility floor with a "warning" is a floor with an
  // exception, and an exception is a default.
  const all = [...mine, ...componentProblems(tokens)];

  return {
    ok: all.length === 0,
    problems: all,
    record: {
      validatedAt: now,
      validatorVersion: VALIDATOR_VERSION,
      contrastPairs: { checked: countPairs(source), failed: all.length },
      themes: ["light", "dark", "high-contrast"],
    },
  };
}

/**
 * How many pairs the gate checked, for the record on the document.
 *
 * Derived rather than hardcoded: the pair list has grown twice, and a number
 * frozen in a comment would have been wrong both times.
 */
function countPairs(source: TokenSource): number {
  // 5 status pairs + the text/interface pairs, in each of three themes.
  const themes = Object.keys(source.semantic).length;
  return (5 + 21) * themes;
}

/**
 * Whether a stored validation still counts.
 *
 * The guard on serve, and the reason `validatorVersion` is on the document.
 * Tightening a rule must not leave older themes live, and restoring an old
 * version must re-check it rather than trusting a verdict reached under
 * different rules.
 */
export function needsRevalidation(theme: ThemeDocument): boolean {
  return theme.validation?.validatorVersion !== VALIDATOR_VERSION;
}

/** Whether this document may be served to an application. */
export function isServable(theme: ThemeDocument): { ok: boolean; reason?: string } {
  if (theme.status !== "published") {
    return { ok: false, reason: `theme is ${theme.status}, not published` };
  }
  if (!theme.validation) {
    return { ok: false, reason: "no validation record" };
  }
  if (theme.validation.contrastPairs.failed > 0) {
    return {
      ok: false,
      reason: `${theme.validation.contrastPairs.failed} failing contrast pair(s)`,
    };
  }
  if (needsRevalidation(theme)) {
    return {
      ok: false,
      reason: `validated by ${theme.validation.validatorVersion}, current validator is ${VALIDATOR_VERSION} — re-validate before serving`,
    };
  }
  return { ok: true };
}

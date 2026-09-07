/**
 * Reading Zoblocks's resolved tokens back out of the page.
 *
 * The bridges so far run one way: a host framework's theme in, Zoblocks's tokens
 * out. This is the other direction, and it is the one a customer actually asks
 * for — *"we configured our brand in your app; why do our own buttons still
 * look like Ant Design's default blue?"*
 *
 * Answering it means knowing what `--zb-accent` currently resolves to, and the
 * only authority on that is the browser: the value depends on which brand
 * stylesheet loaded, which `data-zb-theme` is set, and where in the tree you
 * ask. So this reads computed style rather than re-deriving it — a second
 * derivation would be a second answer, and it would be wrong exactly when a
 * customer had done something interesting.
 *
 * Nothing here runs on a server. `resolveZoblocksTokens` returns `{}` without a
 * DOM, and the React hook seeds from a caller-supplied fallback so the first
 * server render and the first client render agree.
 */

/** The semantic tokens an inverse bridge can meaningfully hand a framework. */
export const READABLE_TOKENS = [
  "--zb-accent",
  "--zb-accent-hover",
  "--zb-accent-subtle",
  "--zb-accent-border",
  "--zb-text",
  "--zb-text-muted",
  "--zb-text-subtle",
  "--zb-text-on-accent",
  "--zb-bg",
  "--zb-bg-subtle",
  "--zb-bg-muted",
  "--zb-surface",
  "--zb-surface-raised",
  "--zb-border",
  "--zb-focus-ring",
  "--zb-radius-sm",
  "--zb-radius",
  "--zb-radius-lg",
  "--zb-font-sans",
  "--zb-font-mono",
  "--zb-text-base",
  "--zb-duration",
  "--zb-ease",
] as const;

export type ReadableToken = (typeof READABLE_TOKENS)[number];
export type ZoblocksTokens = Partial<Record<ReadableToken, string>>;

/**
 * Resolve the tokens as they apply at `element`.
 *
 * Scoped to an element rather than the document because a brand can be applied
 * to a subtree — `<ZoblocksTheme brand="northwind">` writes onto a wrapper, and a
 * multi-tenant page has two of them. Reading from `documentElement` would give
 * one customer's brand to both.
 */
export function resolveZoblocksTokens(element?: Element | null): ZoblocksTokens {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return {};

  const target = element ?? document.documentElement;
  const style = getComputedStyle(target);
  const out: ZoblocksTokens = {};

  for (const token of READABLE_TOKENS) {
    const value = style.getPropertyValue(token).trim();
    // An undefined custom property reads as the empty string. Recording it
    // would tell the framework "this is blank" rather than "we do not know",
    // and a framework given a blank colour renders a blank colour.
    if (value) out[token] = value;
  }

  return out;
}

/** `0.5rem` → 8, for a framework that wants a number of pixels. */
export function toPx(value: string | undefined, rootFontSize = 16): number | undefined {
  if (!value) return undefined;
  const match = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
  if (!match?.[1]) return undefined;
  const n = Number(match[1]);
  if (Number.isNaN(n)) return undefined;
  return match[2] === "rem" || match[2] === "em" ? n * rootFontSize : n;
}

/** `180ms` → 180. Frameworks that state duration as a number want milliseconds. */
export function toMs(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(-?[\d.]+)(ms|s)?$/.exec(value.trim());
  if (!match?.[1]) return undefined;
  const n = Number(match[1]);
  if (Number.isNaN(n)) return undefined;
  return match[2] === "s" ? n * 1000 : n;
}

/**
 * The attributes that change what these tokens resolve to.
 *
 * Watched rather than polled: a theme toggle flips `data-zb-theme` and every
 * value below it changes at once, and a framework holding the previous set
 * would render half a theme until something else caused a re-render.
 */
export const THEME_ATTRIBUTES = ["data-zb-theme", "data-zb-brand", "data-zb-density", "class"];

/**
 * What the token editor renders, computed on the server.
 *
 * The editor is a client component and the token source is not serialisable —
 * it is a tree of `Map`s over the whole DTCG corpus, and shipping it to the
 * browser to answer "what colour is `text-muted` in dark" would send a few
 * hundred kilobytes to display eighty rows.
 *
 * So the server resolves every semantic token to a literal, in all three
 * themes, and sends *that*. The browser can then measure contrast as the
 * customer types — `contrastBetween` is pure arithmetic over two hex strings —
 * while the authoritative verdict stays where it has to be, on the server, in
 * the same `validateTheme` call the publish gate makes.
 */

import {
  CONTRAST_PAIRS,
  floorForPair,
  resolveTheme,
  type TokenSource,
} from "@zoblocks/tokens/validate";
import { CLINICAL_SEMANTIC, TOKEN_SURFACE, surfaceEntry } from "@zoblocks/tokens/surface";
import {
  THEME_NAMES,
  themeAsBrand,
  withTierDefaults,
  type ThemeTokensInput,
  type ThemeName,
} from "@zoblocks/theme";

/** A semantic token as one editable row. */
export interface EditorToken {
  /** `accent`, `text-muted`, `status.critical`. */
  path: string;
  /** `--zb-accent`. What lands in the stylesheet. */
  cssVar: string;
  /** The value in force right now — the customer's override, or ours. */
  resolved: string;
  /** The value with no override, so "revert" has something to revert to. */
  base: string;
  /** Set when this theme overrides it. */
  override?: string;
  /** Clinical tokens are shown and locked, never hidden. */
  locked: boolean;
  /** Only colours get a contrast reading; a duration has nothing to measure. */
  isColour: boolean;
}

/** One pair the gate checks that this token takes part in. */
export interface EditorPair {
  /** The token on the other side, already resolved. */
  againstPath: string;
  against: string;
  floor: number;
  /** "SC 1.4.3 (text)" or "SC 1.4.11 (interface component)". */
  criterion: string;
  /** True when this token is the foreground of the pair. */
  isForeground: boolean;
}

export interface EditorGroup {
  /** `accent`, `text`, `status`. */
  name: string;
  tokens: EditorToken[];
  locked: number;
}

export interface EditorModel {
  theme: ThemeName;
  groups: EditorGroup[];
  /** Keyed by token path. Only pairs where both sides are colours. */
  pairs: Record<string, EditorPair[]>;
  counts: { primitive: number; semantic: number; component: number };
  /**
   * Every semantic token resolved for this theme, keyed by custom property.
   *
   * The preview needs the *whole* set, not only the overridden ones. A theme
   * carries a brand ramp, and the app's own page resolves `--zb-accent`
   * from Zoblocks's palette rather than the customer's — so a preview that
   * applied only the overrides would show a customer their edits against our
   * colours.
   */
  resolved: Record<string, string>;
  /**
   * Component tokens that fall through to each semantic token.
   *
   * Load-bearing, and it took a rendered preview to notice. The component tier
   * is declared at `:root` — `--zb-switch-track-on-bg: var(--zb-accent)` — and
   * a `var()` resolves at the element that *declares* it. So setting
   * `--zb-accent` on a subtree changes `--zb-accent` there and leaves every
   * component token still holding the value it computed at the root. The
   * switch stays Zoblocks's teal while the swatch beside it goes red.
   *
   * Publishing is unaffected: `emitThemeCss` writes to `:root`, where the
   * component declarations are, so the chain resolves normally. This is
   * specifically the cost of scoping an override to a subtree, which is what a
   * live preview is.
   */
  dependents: Record<string, string[]>;
}

const CLINICAL = new Set(CLINICAL_SEMANTIC.map((name) => name.replace(/^--zb-/, "")));

/** `status.critical` → `--zb-status-critical`; `text-muted` → `--zb-text-muted`. */
function toCssVar(path: string): string {
  return `--zb-${path.replace(/\./g, "-")}`;
}

function isHex(value: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

/**
 * The group a token belongs to in the navigator.
 *
 * The segment before the first dot or dash, which is how the token names were
 * designed — `text`, `text-muted` and `text-on-accent` are one group because a
 * customer changing one is nearly always looking at the others.
 */
function groupOf(path: string): string {
  const [head] = path.split(/[.-]/);
  return head ?? path;
}

/**
 * Every semantic token, resolved, grouped, and annotated with the pairs it
 * takes part in.
 *
 * Built per theme rather than once: the semantic tier *is* the per-theme tier,
 * so `accent` in dark and `accent` in light are two different editable values
 * and conflating them is the bug the whole per-theme shape exists to avoid.
 */
export function buildEditorModel(
  source: TokenSource,
  slug: string,
  /**
   * The stored shape, not the parsed one — matching `validateTheme`, which
   * takes the same and for the same reason. Every caller hands this a document
   * straight out of `findOne`, whose tiers are only present if somebody wrote
   * to them; declaring `ThemeTokens` here asked five screens to promise a
   * completeness the database does not provide, while the first line of the
   * body normalised it anyway.
   */
  tokens: ThemeTokensInput,
  theme: ThemeName,
): EditorModel {
  const normalised = withTierDefaults(tokens);
  const brand = themeAsBrand(slug, normalised);
  const overrides = normalised.semantic[theme];

  // With the customer's ramp applied but *without* their semantic overrides —
  // this is what "revert" restores, and showing the already-overridden value as
  // the base would make revert a no-op that looks like a bug.
  const base = resolveTheme(source, theme, brand);

  const byGroup = new Map<string, EditorToken[]>();

  for (const [path, baseValue] of base) {
    const override = overrides[path];
    const token: EditorToken = {
      path,
      cssVar: toCssVar(path),
      resolved: override ?? baseValue,
      base: baseValue,
      ...(override ? { override } : {}),
      locked: CLINICAL.has(path.replace(/\./g, "-")),
      isColour: isHex(baseValue),
    };

    const group = groupOf(path);
    const list = byGroup.get(group);
    if (list) list.push(token);
    else byGroup.set(group, [token]);
  }

  const groups: EditorGroup[] = [...byGroup.entries()]
    .map(([name, list]) => ({
      name,
      tokens: list.sort((a, b) => a.path.localeCompare(b.path)),
      locked: list.filter((t) => t.locked).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  /*
   * The pairs, from the gate's own list.
   *
   * Both directions are recorded: a customer editing `surface` needs to know it
   * is the *background* of four text pairs, and a gate reading that only ever
   * names foregrounds would leave them wondering why their background broke
   * something.
   */
  const resolved = (path: string): string | undefined => overrides[path] ?? base.get(path);
  const pairs: Record<string, EditorPair[]> = {};
  const add = (path: string, pair: EditorPair) => (pairs[path] ??= []).push(pair);

  for (const pair of CONTRAST_PAIRS) {
    const fg = resolved(pair.fg);
    const bg = resolved(pair.bg);
    if (!fg || !bg || !isHex(fg) || !isHex(bg)) continue;

    const floor = floorForPair(theme, pair.kind);
    const criterion = pair.kind === "text" ? "SC 1.4.3 (text)" : "SC 1.4.11 (interface component)";

    add(pair.fg, { againstPath: pair.bg, against: bg, floor, criterion, isForeground: true });
    add(pair.bg, { againstPath: pair.fg, against: fg, floor, criterion, isForeground: false });
  }

  const resolvedTokens: Record<string, string> = {};
  for (const [path, value] of base) resolvedTokens[toCssVar(path)] = overrides[path] ?? value;

  /*
   * Every component token with a semantic parent — clinical ones included.
   *
   * The first version filtered to `bridgeable`, which confused two different
   * rules. "A customer may not *write* this" is about overrides; "a preview
   * must *render* this correctly" is about pixels. Excluding clinical tokens
   * here left the switch's unknown-state colour holding whatever it computed at
   * the app's own `:root` — so previewing a light theme on a dark app
   * page drew a dark-theme clinical colour on a light ground, which the axe
   * sweep reported as a contrast failure and a reader would have seen as one.
   *
   * Propagating them changes nothing a customer controls: `resolved` takes
   * clinical values from the base palette, and the schema refuses a clinical
   * override, so what is copied here is always Zoblocks's own value for the
   * theme being previewed.
   */
  const dependents: Record<string, string[]> = {};
  for (const entry of TOKEN_SURFACE) {
    if (!entry.semantic) continue;
    (dependents[entry.semantic] ??= []).push(entry.name);
  }

  return {
    theme,
    groups,
    pairs,
    resolved: resolvedTokens,
    dependents,
    // All three counted from the data rather than stated, because every one of
    // them has changed with each component added.
    counts: {
      primitive: source.primitive.size,
      semantic: base.size,
      component: TOKEN_SURFACE.length,
    },
  };
}

export { THEME_NAMES, type ThemeName };

/** Whether a component token may be overridden at all. */
export function componentIsEditable(name: string): boolean {
  return surfaceEntry(name)?.bridgeable === true;
}

/**
 * The component token surface — generated, so it cannot drift from the CSS.
 *
 * Every component reads its own `--ox-<component>-*` tokens and nothing else.
 * That set is the override point a customer brands against, and the set a
 * theme bridge writes when it translates a host framework's theme. Until now
 * it existed only as a convention spread across a token file and seven
 * stylesheets, which meant nobody could answer "what may I set?" without
 * reading all of them, and nothing noticed when a token was renamed.
 *
 * This emitter reads the declarations back out and publishes them as a typed
 * manifest. It is deliberately *descriptive*: it documents what is already
 * true rather than imposing a new shape.
 *
 * Two properties are load-bearing downstream:
 *
 *   `fallback`   — whether the declaration terminates in a literal. A token
 *                  without one renders as nothing when no token system is
 *                  present, which is the difference between a component that
 *                  degrades and one that disappears.
 *
 *   `bridgeable` — false for anything resolving to clinical status. A bridge
 *                  that maps a host's `colorError` onto `--ox-status-critical`
 *                  replaces a validated clinical signal with an arbitrary
 *                  brand colour. The flag is what lets that be a build failure
 *                  rather than a code review.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../config";
import { cssVar, referenceTarget, type TokenSource } from "../tokens/load";
import type { Emitter } from "../write";

export type TokenKind =
  "color" | "dimension" | "duration" | "easing" | "font" | "shadow" | "number";

export interface SurfaceEntry {
  /** The custom property, exactly as declared. */
  name: string;
  /** Group it belongs to — `tabs`, `avatar`, `badge`. */
  component: string;
  /** Where the declaration lives, for a reviewer following a diff. */
  source: string;
  kind: TokenKind;
  /** The `--ox-*` token this falls through to, when it has one. */
  semantic?: string;
  /** Host-framework variables already in the chain, in order. */
  frameworks: string[];
  /** True when the chain ends in a literal rather than another `var()`. */
  fallback: boolean;
  /**
   * False when this resolves to clinical status or an identity flag. A bridge
   * may not write these; a customer theme may not override them.
   */
  bridgeable: boolean;
}

/**
 * Stylesheets that declare component-tier tokens.
 *
 * `registry/oxygen/lib/*.css` is deliberately absent: it is the copy-source
 * twin of `packages/react/src/styles/*.css`, and `css-namespace` already holds
 * the two channels to each other. Listing both would double every entry and
 * make the manifest disagree with itself about where a token comes from.
 */
const STYLESHEETS = [
  "packages/react/src/styles.css",
  "packages/react/src/styles/accordion.css",
  "packages/react/src/styles/loader.css",
  "packages/react/src/styles/switch.css",
  "packages/react/src/styles/timeline.css",
  "packages/tabs/src/styles.css",
  "packages/identity/src/styles.css",
  "packages/copilot/src/styles.css",
];

/** Semantic tokens a bridge must never write, and a customer may never override. */
const CLINICAL = /^--ox-(status|flag)-/;
const CLINICAL_PATH = /^(status|flag)\./;

/**
 * DTCG type names onto ours.
 *
 * The spec's vocabulary and CSS's do not line up: `cubicBezier` is an easing
 * curve and `fontFamily` is a font stack. Passing `$type` straight through
 * produced a manifest whose own type declaration rejected it.
 */
const DTCG_KIND: Record<string, TokenKind> = {
  color: "color",
  dimension: "dimension",
  duration: "duration",
  cubicBezier: "easing",
  fontFamily: "font",
  shadow: "shadow",
  number: "number",
};

function kindOf(name: string, value: string): TokenKind {
  /*
   * Shadow before colour, and the order is the whole point.
   *
   * A shadow *contains* a colour — `0 1px 2px rgb(0 0 0 / .06)` — so a colour
   * test that runs first claims every shadow in the system. Three of the 282
   * tokens were typed `color` for exactly this reason, which a consumer reading
   * the surface manifest would have taken as a licence to put a hex in them.
   *
   * The general rule for this function: test the *composite* kinds before the
   * scalar kinds they are built out of.
   */
  if (/\d+px .*(rgb|#)|inset /.test(value)) return "shadow";
  if (/#[0-9a-f]{3,8}\b|\b(rgb|hsl|oklch|color-mix)\(/i.test(value)) return "color";
  if (/\b\d+ms\b|\b[\d.]+s\b/.test(value)) return "duration";
  if (/cubic-bezier|\b(ease|linear|steps)\b/.test(value)) return "easing";
  if (/-(font|family)$/.test(name) || /ui-sans-serif|system-ui|monospace/.test(value))
    return "font";
  if (/\b[\d.]+(rem|px|em|%|ch|vh|vw)\b|\b(max|min|clamp|calc)\(/.test(value)) return "dimension";
  if (/^-?[\d.]+$/.test(value.trim())) return "number";
  return "dimension";
}

/**
 * Walks a declaration's `var()` chain.
 *
 * `var(--a, var(--b, literal))` yields the ordered list `[--a, --b]` plus
 * whether anything is left at the end that is not another `var()`. A regex
 * rather than a CSS parser, deliberately: these declarations are generated and
 * reviewed, and a parser would be a runtime dependency for one file.
 */
function walkChain(value: string): { vars: string[]; fallback: boolean } {
  const vars = [...value.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)]
    .map((m) => m[1])
    .filter((v): v is string => Boolean(v));

  // Strip every `var(--name` opener and the punctuation that joins the chain.
  // Anything with content left is a literal terminator.
  const remainder = value.replace(/var\(\s*--[a-z0-9-]+/gi, "").replace(/[(),\s]/g, "");

  return { vars, fallback: remainder.length > 0 };
}

/**
 * The component a declaration belongs to, taken from the block it sits in.
 *
 * Deriving it from the token *name* looked simpler and was wrong in both
 * directions: `--ox-care-timeline-divider` split to `care`, and `--ox-av-size`
 * and `--ox-sw-bg` are the avatar and its swatches, which no amount of prefix
 * parsing reveals. The selector already knows — `.ox-avatar` declares the
 * first, `.ox-avatar__swatch` the second — so the selector is the key.
 */
function componentOfSelector(selector: string): string | undefined {
  const match = /\.ox-([a-z0-9-]+)/.exec(selector);
  if (!match?.[1]) return undefined;
  // `.ox-tabs__panel` and `.ox-avatar--20` are a part and a modifier of one
  // component, not components of their own.
  const [base] = match[1].split("__");
  return base?.replace(/--.*$/, "") || undefined;
}

const DECLARATION = /^\s*(--ox-[a-z0-9-]+)\s*:\s*([^;]+);/;

/**
 * Reads declarations together with the selector block they sit inside.
 *
 * A small state machine rather than a CSS parser: it tracks the block stack so
 * an `@media` or `@supports` wrapper does not become the selector, and it
 * carries a selector list broken across lines.
 */
function* declarations(css: string): Generator<{ selector: string; name: string; value: string }> {
  let selector = "";
  const stack: string[] = [];
  let pending = "";

  for (const rawLine of css.split("\n")) {
    const line = rawLine.replace(/\/\*.*?\*\//g, "").trim();
    if (!line) continue;

    const declaration = DECLARATION.exec(rawLine);
    if (declaration?.[1] && declaration[2]) {
      yield { selector, name: declaration[1], value: declaration[2].trim() };
      continue;
    }

    if (line.endsWith("{")) {
      const head = `${pending} ${line.slice(0, -1)}`.trim();
      pending = "";
      stack.push(selector);
      // An at-rule is a wrapper, not a selector — keep the one already in hand
      // so a token declared inside `@media (forced-colors)` still belongs to
      // the component whose block encloses it.
      if (!head.startsWith("@")) selector = head;
      continue;
    }
    if (line === "}") {
      selector = stack.pop() ?? "";
      continue;
    }
    // A selector list broken across lines: `.a,` then `.b {`.
    if (line.endsWith(",")) pending += ` ${line}`;
  }
}

export async function buildSurface(source: TokenSource): Promise<SurfaceEntry[]> {
  const entries = new Map<string, SurfaceEntry>();

  /*
   * Tier one: the DTCG component tier, authored in
   * `packages/tokens/tokens/component.json`. These already carry a group name
   * and are validated by the token gate — a component token there cannot
   * reference a primitive. This is the part of the surface the pipeline owns.
   */
  for (const token of source.component.values()) {
    const [component, ...rest] = token.path.split(".");
    if (!component || rest.length === 0) continue;

    const target = referenceTarget(token.value);
    const name = cssVar(token.path);

    /*
     * An alias takes its type from what it points at, not from its group.
     *
     * DTCG lets a group declare a `$type` that its tokens inherit, and the
     * `switch` group declares `color` because fifty-odd of its fifty-five
     * tokens are colours. `switch.ease` is `{ease}` — a cubic-bezier — and it
     * inherited `color` along with everything else, so the published surface
     * told consumers a timing function was a colour.
     *
     * Resolving through the reference fixes the class rather than that one
     * token: an alias is, by definition, the same kind of thing as its target,
     * and a group default was never evidence about it.
     */
    const referenced = target
      ? (source.shared.get(target) ?? source.semantic.light.get(target))
      : undefined;
    /*
     * The target's type wins over the token's own, and only for an alias.
     *
     * The other order looks safer and does nothing: a group `$type` is
     * flattened onto every token beneath it, so `token.type` is always set and
     * the reference would never be consulted. There is no way to tell an
     * inherited type from a declared one at this point, and for an alias the
     * distinction does not matter — the target is the better evidence either
     * way, because an alias is the same kind of thing as what it points at.
     */
    const declared = referenced?.type ?? token.type;

    entries.set(name, {
      name,
      component,
      source: "packages/tokens/tokens/component.json",
      kind: (declared ? DTCG_KIND[declared] : undefined) ?? kindOf(name, token.value),
      ...(target ? { semantic: cssVar(target) } : {}),
      frameworks: [],
      // A pipeline token resolves through the semantic tier, which every theme
      // is required to define in full — so the chain terminates by construction.
      fallback: true,
      bridgeable: !(target && CLINICAL_PATH.test(target)),
    });
  }

  /*
   * Tier two: tokens a component declares directly in its own stylesheet.
   * These carry the `var(--ox-*, var(--ant-*, literal))` chains, so this is
   * where `fallback` and `frameworks` come from.
   */
  for (const relative of STYLESHEETS) {
    const absolute = path.join(ROOT, relative);
    if (!existsSync(absolute)) continue;
    const css = await readFile(absolute, "utf8");

    for (const { selector, name, value } of declarations(css)) {
      const component = componentOfSelector(selector);
      if (!component) continue;

      // A token may be declared more than once — a base value and a variant
      // override. The first declaration is the surface; later ones are states.
      if (entries.has(name)) continue;

      const { vars, fallback } = walkChain(value);
      const semantic = vars.find((v) => v.startsWith("--ox-"));
      const frameworks = vars.filter((v) => !v.startsWith("--ox-"));

      entries.set(name, {
        name,
        component,
        source: relative,
        kind: kindOf(name, value),
        ...(semantic ? { semantic } : {}),
        frameworks,
        fallback,
        bridgeable: !(semantic && CLINICAL.test(semantic)) && !CLINICAL.test(name),
      });
    }
  }

  /*
   * `fallback` is about the *effective* chain, not the declaration.
   * `--ox-tabs-indicator: var(--ox-tabs-accent)` names no literal of its own,
   * but the token it points at terminates in one — so the indicator is safe on
   * a bare page. Resolving transitively is what stops the flag reporting ten
   * false alarms and being ignored.
   */
  for (const entry of entries.values()) {
    if (entry.fallback) continue;
    const seen = new Set<string>([entry.name]);
    let cursor = entry.semantic;
    while (cursor && !seen.has(cursor)) {
      seen.add(cursor);
      const next = entries.get(cursor);
      if (!next) break;
      if (next.fallback) {
        entry.fallback = true;
        break;
      }
      cursor = next.semantic;
    }
  }

  return [...entries.values()].sort(
    (a, b) => a.component.localeCompare(b.component) || a.name.localeCompare(b.name),
  );
}

/**
 * Component tokens whose `--ox-*` fallback names a token nothing defines.
 *
 * This is the silent failure the manifest exists to catch. A declaration
 * reading `var(--ox-fg-muted, var(--ant-color-text-secondary, #475569))` looks
 * correct and renders correctly — against antd's colour or the literal. What it
 * never does is follow an Oxygen brand, because `--ox-fg-muted` is not a token
 * the pipeline emits. The component silently opts out of the theming system it
 * appears to participate in, and no test notices because the pixels are fine.
 */
export function danglingReferences(
  entries: SurfaceEntry[],
  source: TokenSource,
): { token: string; missing: string; source: string }[] {
  const defined = new Set<string>();
  for (const map of [source.shared, source.semantic.light, source.primitive, source.component]) {
    for (const key of map.keys()) defined.add(cssVar(key));
  }
  for (const key of source.density.standard.keys()) defined.add(cssVar(`density.${key}`));
  for (const key of source.densityRoot.keys()) defined.add(cssVar(key));
  for (const entry of entries) defined.add(entry.name);

  return entries
    .filter((e) => e.semantic && !defined.has(e.semantic))
    .map((e) => ({ token: e.name, missing: e.semantic as string, source: e.source }));
}

/**
 * Component tokens whose chain does not reach a literal.
 *
 * A declaration reading `var(--ox-border)` and nothing else is correct in an
 * Oxygen application and renders as *nothing* on a page that has not loaded
 * the token stylesheet — the component does not degrade, its rails and borders
 * disappear. That is a weaker failure than a dangling reference and still a
 * real one.
 *
 * Seven existed when this check was introduced, all in the timeline family.
 * Each has since been given the light-theme literal it already resolved to, so
 * the list is empty and the rule is absolute. It stays as a mechanism rather
 * than being deleted: a token that genuinely cannot terminate can be listed
 * here with a reason, and `staleFallbackExemptions` then fails the build if
 * that reason stops being true.
 */
const KNOWN_WITHOUT_FALLBACK: ReadonlySet<string> = new Set([]);

export function missingFallbacks(entries: SurfaceEntry[]): {
  token: string;
  source: string;
  chainsTo?: string;
}[] {
  return entries
    .filter((e) => !e.fallback && !KNOWN_WITHOUT_FALLBACK.has(e.name))
    .map((e) => ({
      token: e.name,
      source: e.source,
      ...(e.semantic ? { chainsTo: e.semantic } : {}),
    }));
}

/** A listed token that now terminates should leave the list, or it protects nothing. */
export function staleFallbackExemptions(entries: SurfaceEntry[]): string[] {
  const byName = new Map(entries.map((e) => [e.name, e]));
  return [...KNOWN_WITHOUT_FALLBACK].filter((name) => byName.get(name)?.fallback === true).sort();
}

const BANNER = `// GENERATED FILE — DO NOT EDIT.
//
// Produced by \`pnpm gen\` from the component token tier and the component
// stylesheets. Edit those, then re-run. CI fails if this file is stale.
//
// See content/decisions/0012-token-surface-is-a-contract.md
`;

export async function emitSurface(
  entries: SurfaceEntry[],
  source: TokenSource,
  emitter: Emitter,
): Promise<void> {
  const byComponent = new Map<string, number>();
  for (const e of entries) byComponent.set(e.component, (byComponent.get(e.component) ?? 0) + 1);

  const summary = [...byComponent.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([c, n]) => ` *   ${c.padEnd(14)} ${String(n).padStart(3)}`)
    .join("\n");

  const notBridgeable = entries.filter((e) => !e.bridgeable);
  const noFallback = entries.filter((e) => !e.fallback);

  /*
   * The clinical rule, read from the semantic tier rather than from what the
   * component tier happens to consume.
   *
   * `NOT_BRIDGEABLE` lists *component* tokens, so a clinical semantic token no
   * component references yet is absent from it — `--ox-flag-provisional` was
   * exactly that. A consumer deriving the rule from that list therefore
   * misclassifies it, which is how the theme console came to describe an
   * identity flag as an ordinary gap in Ant Design's palette. Publishing the
   * rule as data is the fix; re-deriving it downstream is the bug.
   */
  const clinicalSemantic = [...source.semantic.light.keys()]
    .filter((key) => CLINICAL_PATH.test(key))
    .map((key) => cssVar(key))
    .sort();

  const body = `${BANNER}
/**
 * The component token surface — every custom property a consumer may set to
 * restyle a component, and every property a theme bridge may write.
 *
 * This is a public contract. Removing or renaming an entry is a breaking
 * change, because customers style against these names. The manifest is
 * committed so that change shows up as a reviewable diff.
 *
 * ${entries.length} tokens across ${byComponent.size} components:
 *
${summary}
 *
 * \`bridgeable: false\` (${notBridgeable.length} tokens) marks the ones resolving to clinical
 * status or an identity flag. A host framework's \`colorError\` is not our
 * \`status.critical\`: ours carries a validated contrast floor and a 60° hue
 * separation from \`status.low\`, so the direction of an abnormal result
 * survives colour-vision deficiency. A bridge writing one of these would
 * replace a clinical signal with a brand colour.
 *
 * \`fallback: false\` (${noFallback.length} tokens) marks declarations that do not terminate in a
 * literal. Those render as nothing when no token system is present.
 */

export type TokenKind =
  | "color"
  | "dimension"
  | "duration"
  | "easing"
  | "font"
  | "shadow"
  | "number";

export interface SurfaceEntry {
  /** The custom property, exactly as declared. */
  readonly name: string;
  /** Group it belongs to — \`tabs\`, \`avatar\`, \`badge\`. */
  readonly component: string;
  /** Where the declaration lives. */
  readonly source: string;
  readonly kind: TokenKind;
  /** The \`--ox-*\` token this falls through to, when it has one. */
  readonly semantic?: string;
  /** Host-framework variables already in the chain, in order. */
  readonly frameworks: readonly string[];
  /** True when the chain ends in a literal rather than another \`var()\`. */
  readonly fallback: boolean;
  /** False for clinical status and identity flags. A bridge may not write these. */
  readonly bridgeable: boolean;
}

export const TOKEN_SURFACE: readonly SurfaceEntry[] = ${JSON.stringify(entries, null, 2)};

/** Every component group with an override surface. */
export const SURFACE_COMPONENTS: readonly string[] = ${JSON.stringify(
    [...byComponent.keys()].sort(),
    null,
    2,
  )};

/** The tokens a theme bridge is permitted to write. */
export const BRIDGEABLE: readonly string[] = ${JSON.stringify(
    entries.filter((e) => e.bridgeable).map((e) => e.name),
    null,
    2,
  )};

/**
 * The tokens a theme bridge must never write, and a customer theme may never
 * override. Exported so a bridge's own test can assert it wrote none of them.
 */
export const NOT_BRIDGEABLE: readonly string[] = ${JSON.stringify(
    notBridgeable.map((e) => e.name),
    null,
    2,
  )};

/**
 * Semantic tokens carrying a clinical meaning — every \`status.*\` and
 * \`flag.*\`.
 *
 * The tier *above* \`NOT_BRIDGEABLE\`: those are the component tokens that fall
 * through to one of these. Both are generated from the same rule, and this one
 * is complete whether or not a component references the token yet — which is
 * the distinction a consumer cannot make from \`NOT_BRIDGEABLE\` alone.
 */
export const CLINICAL_SEMANTIC: readonly string[] = ${JSON.stringify(clinicalSemantic, null, 2)};

/** Lookup by custom-property name. */
export function surfaceEntry(name: string): SurfaceEntry | undefined {
  return TOKEN_SURFACE.find((e) => e.name === name);
}

/** Every token belonging to one component. */
export function surfaceFor(component: string): readonly SurfaceEntry[] {
  return TOKEN_SURFACE.filter((e) => e.component === component);
}
`;

  await emitter.emit(path.join(ROOT, "packages", "tokens", "src", "surface.ts"), body);
}

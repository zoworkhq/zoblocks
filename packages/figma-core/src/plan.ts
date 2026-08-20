/**
 * An Oxygen theme, as a plan a Figma plugin can apply.
 *
 * Plain data on both sides: this package never imports `figma.*`, so it can be
 * tested with vitest instead of inside a plugin sandbox — the same discipline
 * that made `bridge-core` work for two frameworks. The sandbox adapter reads
 * variables into `VariableSnapshot`, hands them here, and applies whatever comes
 * back. It contains no decisions worth testing.
 *
 * The one property that carries all the value is **aliasing**. Most token
 * integrations resolve everything to a literal and dump it in, producing a file
 * where changing the brand means editing three hundred variables by hand —
 * which is the problem the token system exists to solve, rebuilt inside Figma.
 * Oxygen already computes the reference chain to emit `var()` fallbacks in CSS;
 * emitting a Figma alias wherever that chain points at another token reproduces
 * the tiering in the design file, so a designer moves one swatch and watches
 * sixty tokens follow.
 */

import { cssVar } from "@oxygenui-design/tokens/validate";

import { hexToFigmaRgb, type FigmaRgb } from "./color";

/** The three Oxygen themes become the three modes of a collection. */
export type ThemeName = "light" | "dark" | "high-contrast";

export const THEMES: readonly ThemeName[] = ["light", "dark", "high-contrast"];

export type Tier = "brand" | "semantic" | "component";

/** Names chosen to be legible in Figma's own picker, not to match our paths. */
export const COLLECTION: Record<Tier, string> = {
  brand: "Oxygen / Brand",
  semantic: "Oxygen / Semantic",
  component: "Oxygen / Component",
};

/**
 * What a variable's value is in one mode.
 *
 * An alias names another Oxygen token rather than a Figma id, because ids do
 * not exist until the sandbox has created things. Resolving a name to an id is
 * the adapter's job and the only ordering constraint it has.
 */
export type PlannedValue =
  | { kind: "color"; hex: string; rgb: FigmaRgb }
  | { kind: "alias"; token: string }
  | { kind: "string"; value: string }
  | { kind: "number"; value: number };

export interface PlannedVariable {
  /** The Oxygen token name — `--ox-accent`. The durable identity. */
  token: string;
  /** What a designer sees. A label, never the key. */
  name: string;
  tier: Tier;
  collection: string;
  /** Keyed by mode. Brand has one mode; the other tiers have three. */
  values: Partial<Record<ThemeName | "default", PlannedValue>>;
  /**
   * Present when a customer may not change this, carrying the reason.
   *
   * Pushed so a designer can see it and refused on the way back, exactly as the
   * framework bridges treat the same tokens. A pull that silently accepted one
   * would be the bug this whole architecture exists to prevent.
   */
  locked?: string;
  /** Shown in Figma's own description field. */
  description?: string;
}

export interface VariablePlan {
  collections: { name: string; modes: string[] }[];
  variables: PlannedVariable[];
}

export interface PlanOptions {
  /**
   * Off by default, and the default is the recommendation.
   *
   * The component tier is large enough to make a designer's variable panel
   * unusable, and almost every entry in it is an alias to a semantic token they
   * already have. Teams building components *in* Figma want it; nobody else
   * does.
   */
  includeComponent?: boolean;
}

/** The resolved theme this package needs, as plain data. */
export interface ResolvedTheme {
  /** `{ "600": "#1d63c9", … }` — the eleven steps. */
  ramp: Record<string, string>;
  /** Per theme, keyed by Oxygen token name: `--ox-accent` → `#1851a5`. */
  semantic: Record<ThemeName, Record<string, string>>;
  /** Per theme, same shape. Only the tokens that carry a value. */
  component?: Record<ThemeName, Record<string, string>>;
  /**
   * Which semantic token each one resolves *through*, when it resolves through
   * a ramp step or another token. This is what becomes an alias.
   */
  references?: Record<string, string>;
  /** Token names a customer may not change, mapped to why. */
  locked?: Record<string, string>;
}

/**
 * Built through `cssVar` rather than written out, because the ramp tier is the
 * one tier a plan names directly and the naming rule belongs in one place. It
 * also keeps the `no-primitive-token` lint rule meaningful: that rule exists to
 * stop a *component* reaching past the semantic tier, and a literal here would
 * have to be excused with a disable comment that reads exactly like the mistake
 * the rule is looking for.
 */
const rampToken = (step: string) => cssVar(`ref.brand.${step}`);

/**
 * A human label from an Oxygen token name.
 *
 * `--ox-accent-hover` becomes `accent/hover`, because Figma groups variables on
 * the slash and a flat list of sixty is not navigable. The token name is still
 * the key; this only decides what the panel looks like.
 */
export function labelFor(token: string): string {
  return token.replace(/^--ox-/, "").replace(/-/g, "/");
}

export function toVariablePlan(theme: ResolvedTheme, options: PlanOptions = {}): VariablePlan {
  const variables: PlannedVariable[] = [];
  const references = theme.references ?? {};
  const locked = theme.locked ?? {};

  /*
   * Brand first, and in one mode.
   *
   * The ramp does not change between light and dark — it is the palette those
   * themes select *from*. Giving it three identical modes would triple the
   * surface and imply a choice that does not exist.
   */
  for (const [step, hex] of Object.entries(theme.ramp)) {
    const rgb = hexToFigmaRgb(hex);
    if (!rgb) continue;
    variables.push({
      token: rampToken(step),
      name: `brand/${step}`,
      tier: "brand",
      collection: COLLECTION.brand,
      values: { default: { kind: "color", hex, rgb } },
    });
  }

  const rampByHex = new Map(
    Object.entries(theme.ramp).map(([step, hex]) => [hex.toLowerCase(), rampToken(step)]),
  );

  const tierFor = (
    tier: Exclude<Tier, "brand">,
    perTheme: Record<ThemeName, Record<string, string>>,
  ) => {
    const names = new Set<string>();
    for (const mode of THEMES) for (const key of Object.keys(perTheme[mode] ?? {})) names.add(key);

    for (const token of [...names].sort()) {
      const values: PlannedVariable["values"] = {};

      for (const mode of THEMES) {
        const value = perTheme[mode]?.[token];
        if (value === undefined) continue;

        /*
         * An alias where the chain points at another token, a literal where it
         * does not.
         *
         * Two ways to know: the declared reference, and — for the brand tier —
         * the value being exactly a ramp step. The second is not a guess: a
         * semantic token whose resolved value *is* the 700 step is the 700 step,
         * and writing it as a literal would break the link the designer needs.
         */
        const target = references[token];
        if (target) {
          values[mode] = { kind: "alias", token: target };
          continue;
        }

        const step = rampByHex.get(value.toLowerCase());
        if (step && tier === "semantic") {
          values[mode] = { kind: "alias", token: step };
          continue;
        }

        const rgb = hexToFigmaRgb(value);
        values[mode] = rgb ? { kind: "color", hex: value, rgb } : { kind: "string", value };
      }

      if (Object.keys(values).length === 0) continue;

      const why = locked[token];
      variables.push({
        token,
        name: labelFor(token),
        tier,
        collection: COLLECTION[tier],
        values,
        ...(why ? { locked: why, description: why } : {}),
      });
    }
  };

  tierFor("semantic", theme.semantic);
  if (options.includeComponent && theme.component) tierFor("component", theme.component);

  const collections = [
    { name: COLLECTION.brand, modes: ["Default"] },
    { name: COLLECTION.semantic, modes: [...THEMES] },
    ...(options.includeComponent && theme.component
      ? [{ name: COLLECTION.component, modes: [...THEMES] }]
      : []),
  ];

  return { collections, variables };
}

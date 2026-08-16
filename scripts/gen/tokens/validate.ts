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

import {
  DENSITIES,
  THEMES,
  type DensityName,
  type Theme,
  type TokenMap,
  type TokenSource,
  referenceTarget,
  toCssValue,
  type Brand,
} from "./load";

export interface TokenProblem {
  message: string;
}

// ---------------------------------------------------------------------------
// Colour maths
// ---------------------------------------------------------------------------

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHex(value: string): Rgb | undefined {
  const hex = value.trim().replace(/^#/, "");

  // Three-digit shorthand, expanded.
  const short = /^([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(hex);
  if (short) {
    return {
      r: parseInt(`${short[1]}${short[1]}`, 16),
      g: parseInt(`${short[2]}${short[2]}`, 16),
      b: parseInt(`${short[3]}${short[3]}`, 16),
    };
  }

  // Six digits only. An eight-digit value carries alpha, and a contrast ratio
  // against an unknown backdrop is not a number we can honestly compute — so
  // it is reported rather than guessed at. This is the check that would have
  // caught the fully-transparent overlay surface in the hand-written file.
  const full = /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (full) {
    return {
      r: parseInt(full[1] as string, 16),
      g: parseInt(full[2] as string, 16),
      b: parseInt(full[3] as string, 16),
    };
  }

  return undefined;
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x relative luminance. */
function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Hue in degrees. Used only to prove two statuses are not the same colour. */
function hue({ r, g, b }: Rgb): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let h: number;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;

  return (h * 60 + 360) % 360;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// ---------------------------------------------------------------------------
// Reference resolution, for validation only
// ---------------------------------------------------------------------------

/**
 * Resolves a token to a literal, following references through the primitive
 * tier. Emission uses `var()` chains instead; this exists so the contrast gate
 * has actual numbers to work with.
 */
function resolveLiteral(
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
function brandedPrimitive(source: TokenSource, brand: Brand | undefined): TokenMap {
  if (!brand) return source.primitive;
  const merged = new Map(source.primitive);
  for (const [key, token] of brand.primitive) merged.set(key, token);
  return merged;
}

function themeLookup(source: TokenSource, theme: Theme, brand?: Brand) {
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

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/** Status pairs whose contrast is load-bearing, checked in every theme. */
const STATUS_PAIRS = ["critical", "high", "low", "normal", "unknown"] as const;

/**
 * AA body text. High-contrast targets AAA because that is the entire reason a
 * reader would select it — a "high-contrast" theme that only reaches AA is a
 * second default theme with a misleading name.
 */
function floorFor(theme: Theme): number {
  return theme === "high-contrast" ? 7 : 4.5;
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
function checkStatusContrast(source: TokenSource, problems: TokenProblem[], brand?: Brand): void {
  for (const theme of THEMES) {
    const lookup = themeLookup(source, theme, brand);
    const floor = floorFor(theme);
    const hues: Partial<Record<(typeof STATUS_PAIRS)[number], number>> = {};

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
      if (separation < 60) {
        problems.push({
          message: `status.high and status.low in theme "${theme}" are only ${separation.toFixed(0)}° apart in hue. They must differ by at least 60° so the direction of an abnormal result survives monochrome output and colour vision deficiency.`,
        });
      }
    }
  }
}

/**
 * Every foreground the system actually composes over a background.
 *
 * This list used to be four text pairs. Three real WCAG failures were shipping
 * outside it, because a pair that is not named here is not checked at all:
 *
 *   focus-ring on bg      2.50:1  — the focus indicator for the whole library
 *   text-on-accent/accent 3.81:1  — every primary button label
 *   border-strong on bg   1.48:1  — backs --ox-field-border
 *
 * The lesson is not "those three values were wrong". It is that a gate which
 * checks a hand-picked subset reports green while the system fails, and the
 * subset is the defect. Anything that carries meaning against a surface belongs
 * here.
 *
 * `kind` selects the floor. WCAG separates readable text (1.4.3, 4.5:1) from
 * user-interface components and graphical objects (1.4.11, 3:1) — a focus ring
 * and a field border are the second kind, and holding them to 4.5 would be
 * wrong in the other direction.
 */
type ContrastPair = { fg: string; bg: string; kind: "text" | "ui" };

const CONTRAST_PAIRS: ContrastPair[] = [
  // Readable text — SC 1.4.3.
  { fg: "text", bg: "bg", kind: "text" },
  { fg: "text", bg: "surface", kind: "text" },
  { fg: "text", bg: "bg-subtle", kind: "text" },
  { fg: "text", bg: "bg-muted", kind: "text" },
  { fg: "text-muted", bg: "bg", kind: "text" },
  { fg: "text-muted", bg: "surface", kind: "text" },
  { fg: "text-muted", bg: "bg-subtle", kind: "text" },
  { fg: "text-subtle", bg: "bg", kind: "text" },
  { fg: "text-subtle", bg: "surface", kind: "text" },
  // Label on a filled action. This is the pair that makes a primary button
  // readable, and it was the one nobody was checking.
  { fg: "text-on-accent", bg: "accent", kind: "text" },
  { fg: "text-on-accent", bg: "accent-hover", kind: "text" },
  // Interface components and graphical objects — SC 1.4.11.
  { fg: "focus-ring", bg: "bg", kind: "ui" },
  { fg: "focus-ring", bg: "surface", kind: "ui" },
  { fg: "focus-ring", bg: "bg-subtle", kind: "ui" },
  { fg: "border-strong", bg: "bg", kind: "ui" },
  { fg: "border-strong", bg: "surface", kind: "ui" },
  { fg: "accent", bg: "bg", kind: "ui" },
  { fg: "accent", bg: "surface", kind: "ui" },
  // Deliberately absent: accent-border on accent-subtle. A border drawn on its
  // own tint reinforces a fill that already identifies the component; SC 1.4.11
  // governs information *required* to identify a control, and demanding 3:1
  // there would force a heavy rule around every soft callout in the system.
  // Borders are checked where they actually delimit something — against the page.
  // Clinical flags carry meaning and were measured but never gated.
  { fg: "flag.restricted", bg: "flag.restricted-bg", kind: "text" },
  { fg: "flag.provisional", bg: "bg", kind: "ui" },
  { fg: "flag.deceased", bg: "bg", kind: "ui" },
];

/** SC 1.4.3 for text, SC 1.4.11 for interface components; AAA in high contrast. */
function floorForPair(theme: Theme, kind: ContrastPair["kind"]): number {
  if (theme === "high-contrast") return kind === "text" ? 7 : 4.5;
  return kind === "text" ? 4.5 : 3;
}

function checkTextContrast(source: TokenSource, problems: TokenProblem[], brand?: Brand): void {
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

/**
 * Every semantic and shared token resolved to a literal, for one theme.
 *
 * The CSS output deliberately keeps `var()` chains so a brand can replace the
 * palette in one place. This is the other view of the same data: flat literals
 * for JavaScript that has to compute with a token value rather than hand it to
 * the browser — chart geometry, canvas rendering, and the contrast table in the
 * accessibility docs.
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

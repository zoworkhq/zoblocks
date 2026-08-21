/**
 * The accessibility gate, reading a Figma file.
 *
 * Every number this produces comes from `@oxygenui-design/tokens/validate` —
 * the same module the build runs over the DTCG source, the same module the
 * app runs in the browser as a customer types, and the same module the
 * publish gate runs server-side before a theme ships. That is the entire point
 * of this file. A designer who is told 4.62:1 in Figma and 3.98:1 in the
 * app has been told two things about one colour, and will believe the one
 * that is more convenient.
 *
 * Nothing here touches `figma.*` or the DOM. It takes the plain snapshot the
 * sandbox reads and returns a plain report the panel renders.
 */

import type { VariableSnapshot } from "@oxygenui-design/figma-core";
import {
  CONTRAST_PAIRS,
  HUE_SEPARATION_FLOOR,
  STATUS_PAIRS,
  contrastBetween,
  cssVar,
  floorFor,
  floorForPair,
  hue,
  hueDistance,
  nearestPassing,
  parseHex,
  type Theme,
} from "@oxygenui-design/tokens/validate";

import { colourAt, hasStamps, stampedTokens } from "./snapshot";

/** The two WCAG rules this gate distinguishes, in the app's own words. */
const CRITERION = {
  text: "SC 1.4.3 (text)",
  ui: "SC 1.4.11 (interface component)",
} as const;

export type PairKindName = keyof typeof CRITERION;

export interface PairReading {
  /** What a designer sees in the variables panel. */
  fg: string;
  bg: string;
  /** The Oxygen token, when this pair came from the token list. */
  fgToken?: string;
  bgToken?: string;
  fgValue: string;
  bgValue: string;
  kind: PairKindName;
  criterion: string;
  /** Two decimal places, matching `measureContrast` and the conformance table. */
  ratio: number;
  floor: number;
  passes: boolean;
  /**
   * The nearest shade of the same colour that clears the floor.
   *
   * Offered, not applied. Phase 4 is where this plugin earns the right to write
   * to somebody's file, and it earns it by previewing every change first;
   * slipping an unpreviewed write into the phase whose whole claim is "reads
   * only" would spend that credibility for one button.
   */
  suggestion?: string;
}

/** A finding that is not a ratio. Hue separation is the only one so far. */
export interface GateFinding {
  message: string;
}

export type GateMode = "oxygen" | "palette";

export interface GateReport {
  mode: GateMode;
  collection: string;
  /** The Figma mode read, by its name in the file. */
  figmaMode: string;
  /** The Oxygen theme whose floors were applied. */
  theme: Theme;
  readings: PairReading[];
  findings: GateFinding[];
  /** Pairs the token list names that this collection does not carry. */
  missing: string[];
  /** Colour variables with no Oxygen stamp, by label. */
  unstamped: string[];
}

export interface GateOptions {
  collection: string;
  /** The Figma mode to read. */
  figmaMode: string;
  /**
   * Which theme's floors apply. High contrast raises the text floor to 7:1,
   * and a high-contrast theme measured at 4.5 is a second default theme with a
   * misleading name.
   */
  theme?: Theme;
  /** Palette mode: the variable every other colour is measured against. */
  ground?: string;
  /** Palette mode: which floor the designer is asking for. */
  kind?: PairKindName;
}

const round = (ratio: number) => Math.round(ratio * 100) / 100;

/**
 * Which reading this collection can support.
 *
 * A file carrying Oxygen stamps can be measured against the real pair list,
 * because we know which colour is text and which is the ground it sits on. A
 * file of somebody's own swatches cannot: pairing them by guesswork would
 * report failures nobody can act on, and worse, would report passes.
 */
export function gateModeFor(snapshot: VariableSnapshot, collection: string): GateMode {
  return hasStamps(snapshot, collection) ? "oxygen" : "palette";
}

export function runGate(snapshot: VariableSnapshot, options: GateOptions): GateReport {
  const mode = gateModeFor(snapshot, options.collection);
  return mode === "oxygen" ? oxygenGate(snapshot, options) : paletteGate(snapshot, options);
}

/**
 * The real pair list, over a file this plugin (or an Oxygen theme) put there.
 *
 * `CONTRAST_PAIRS` and `STATUS_PAIRS` are imported rather than restated. A
 * hand-picked subset is how `flag.restricted` was once measured, printed, and
 * checked by nothing — and a plugin with its own shorter list would recreate
 * exactly that failure, one product surface further from anyone who would
 * notice.
 */
function oxygenGate(snapshot: VariableSnapshot, options: GateOptions): GateReport {
  const theme = options.theme ?? themeFromModeName(options.figmaMode);
  const tokens = stampedTokens(snapshot, options.collection, options.figmaMode);
  const value = (path: string) => tokens.get(cssVar(path));

  const readings: PairReading[] = [];
  const missing: string[] = [];

  for (const pair of CONTRAST_PAIRS) {
    const fg = value(pair.fg);
    const bg = value(pair.bg);
    if (!fg || !bg) {
      missing.push(`${pair.fg} on ${pair.bg}`);
      continue;
    }
    readings.push(
      reading({
        fg: pair.fg,
        bg: pair.bg,
        fgToken: cssVar(pair.fg),
        bgToken: cssVar(pair.bg),
        fgValue: fg,
        bgValue: bg,
        kind: pair.kind,
        floor: floorForPair(theme, pair.kind),
      }),
    );
  }

  /*
   * Status pairs are held to the body-text floor, which is what
   * `checkStatusContrast` does. They are a separate list in the validator
   * because each status is measured on its own background rather than on the
   * page, and reproducing that here — rather than folding them into the list
   * above — is what keeps the two answers identical.
   */
  for (const status of STATUS_PAIRS) {
    const fg = value(`status.${status}`);
    const bg = value(`status.${status}-bg`);
    if (!fg || !bg) {
      missing.push(`status.${status} on its own background`);
      continue;
    }
    readings.push(
      reading({
        fg: `status.${status}`,
        bg: `status.${status}-bg`,
        fgToken: cssVar(`status.${status}`),
        bgToken: cssVar(`status.${status}-bg`),
        fgValue: fg,
        bgValue: bg,
        kind: "text",
        floor: floorFor(theme),
      }),
    );
  }

  return {
    mode: "oxygen",
    collection: options.collection,
    figmaMode: options.figmaMode,
    theme,
    readings,
    findings: hueFindings(value, theme),
    missing,
    unstamped: unstampedIn(snapshot, options.collection),
  };
}

/**
 * A file of ordinary swatches, measured against one ground the designer names.
 *
 * The ground is asked for rather than inferred. A gate that guesses which of
 * eleven colours is the page and which is the type will be wrong, and a wrong
 * pairing produces a confident number about a combination nobody will ever
 * render — which is worse than no number, because it is actionable and useless.
 */
function paletteGate(snapshot: VariableSnapshot, options: GateOptions): GateReport {
  const theme = options.theme ?? themeFromModeName(options.figmaMode);
  const kind = options.kind ?? "text";
  const floor = floorForPair(theme, kind);

  const colours = coloursIn(snapshot, options.collection, options.figmaMode);
  const ground = options.ground ?? darkestOrLightest(colours);
  const bgValue = ground ? colours.get(ground) : undefined;

  const readings: PairReading[] = [];
  if (ground && bgValue) {
    for (const [name, fgValue] of colours) {
      if (name === ground) continue;
      readings.push({ ...reading({ fg: name, bg: ground, fgValue, bgValue, kind, floor }) });
    }
  }

  return {
    mode: "palette",
    collection: options.collection,
    figmaMode: options.figmaMode,
    theme,
    readings,
    findings: [],
    missing: [],
    unstamped: [...colours.keys()],
  };
}

interface ReadingInput {
  fg: string;
  bg: string;
  fgToken?: string;
  bgToken?: string;
  fgValue: string;
  bgValue: string;
  kind: PairKindName;
  floor: number;
}

function reading(input: ReadingInput): PairReading {
  const measured = contrastBetween(input.fgValue, input.bgValue) ?? 0;
  const ratio = round(measured);

  /*
   * Compared at two decimal places, the number the designer is shown.
   *
   * Judging the raw float and printing the rounded one is how a row reads
   * "4.50:1, below the 4.5:1 floor" — technically true, and indistinguishable
   * from a bug to the person reading it.
   */
  const passes = ratio >= input.floor;

  const suggestion = passes ? undefined : nearestPassing(input.fgValue, input.bgValue, input.floor);

  return {
    fg: input.fg,
    bg: input.bg,
    ...(input.fgToken ? { fgToken: input.fgToken } : {}),
    ...(input.bgToken ? { bgToken: input.bgToken } : {}),
    fgValue: input.fgValue,
    bgValue: input.bgValue,
    kind: input.kind,
    criterion: CRITERION[input.kind],
    ratio,
    floor: input.floor,
    passes,
    ...(suggestion ? { suggestion } : {}),
  };
}

/**
 * Hue separation between `status.high` and `status.low`.
 *
 * Not a contrast reading, and it would be dishonest to render it as one: two
 * colours can both clear 4.5:1 against their own backgrounds and still be
 * indistinguishable to a reader with deuteranopia, which is the failure this
 * catches. It is reported as a finding, in the validator's own words.
 */
function hueFindings(value: (path: string) => string | undefined, theme: Theme): GateFinding[] {
  const high = value("status.high");
  const low = value("status.low");
  if (!high || !low) return [];

  const a = parseHex(high);
  const b = parseHex(low);
  if (!a || !b) return [];

  const separation = hueDistance(hue(a), hue(b));
  if (separation >= HUE_SEPARATION_FLOOR) return [];

  return [
    {
      message: `status.high and status.low in theme "${theme}" are only ${separation.toFixed(0)}° apart in hue. They must differ by at least ${HUE_SEPARATION_FLOOR}° so the direction of an abnormal result survives monochrome output and colour vision deficiency.`,
    },
  ];
}

function coloursIn(
  snapshot: VariableSnapshot,
  collection: string,
  figmaMode: string,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const variable of snapshot.variables) {
    if (variable.collection !== collection) continue;
    const hex = colourAt(variable, figmaMode);
    if (hex) out.set(variable.name, hex);
  }
  return out;
}

function unstampedIn(snapshot: VariableSnapshot, collection: string): string[] {
  return snapshot.variables
    .filter((v) => v.collection === collection && !v.token)
    .map((v) => v.name)
    .sort();
}

/**
 * The default ground, when the designer has not chosen one yet.
 *
 * Whichever extreme is furthest from the middle: a palette is usually type on
 * paper or type on ink, and starting from the colour most of the others will
 * actually sit on gives a first screen that is worth reading rather than a
 * prompt.
 */
function darkestOrLightest(colours: Map<string, string>): string | undefined {
  let pick: string | undefined;
  let best = -1;
  for (const [name, hex] of colours) {
    const rgb = parseHex(hex);
    if (!rgb) continue;
    const level = (rgb.r + rgb.g + rgb.b) / 3;
    const distance = Math.abs(level - 127.5);
    if (distance > best) {
      best = distance;
      pick = name;
    }
  }
  return pick;
}

/**
 * A Figma mode name read as an Oxygen theme.
 *
 * Modes this plugin creates are named for the themes, so the common case is
 * exact. Anything else falls back to light, because guessing high-contrast
 * would silently apply a 7:1 floor to a file that never asked for one and
 * report failures that are not failures.
 */
export function themeFromModeName(name: string): Theme {
  const lower = name.trim().toLowerCase();
  if (lower === "dark") return "dark";
  if (lower === "high-contrast" || lower === "high contrast") return "high-contrast";
  return "light";
}

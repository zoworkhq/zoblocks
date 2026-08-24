// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/palette.ts. Edit that file, not this one.
/**
 * A command palette for a place where search is a regulated act.
 *
 * Clinical navigation is a menu tree six levels deep, and the fastest people
 * in every organisation have memorised a set of shortcuts nobody documented. A
 * palette is the obvious answer and almost nobody ships one, for a reason that
 * is not obvious: typing a name into a global patient search is a privacy event
 * whether or not you open the chart. A palette that helpfully autocompletes
 * across the whole patient index has created a compliance problem at the speed
 * of thought.
 *
 * So three rules, and they are the component rather than decoration on it.
 *
 *   Patients outside your treatment relationships are counted, never named.
 *   "3 further matches — break-glass required" is the whole design: the reader
 *   learns the search was not empty without learning who.
 *
 *   Every patient search emits an audit event, including the ones that
 *   returned nothing. A search that found nobody is still a search that was
 *   made, and the ones that found nobody are the interesting ones.
 *
 *   Actions rank above records, because a verb is usually what was meant, and
 *   a clinically significant action never runs on the first Enter.
 *
 * No React, no DOM, no transport. Sources are the host's.
 */

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

export type ItemKind =
  /** A verb. "Start PHQ-9", "Open safety plan", "Document a no-show". */
  "action" | "patient" | "chart-resource" | "template" | "setting" | "help";

/**
 * The group heading for each kind.
 *
 * `ITEM_KIND_LABEL` rather than `KIND_LABEL`, because AllergyChip already owns
 * that name and the npm barrel is flat — two modules exporting one name is an
 * export that silently disappears from the package.
 */
export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  action: "Actions",
  patient: "Patients",
  "chart-resource": "In this chart",
  template: "Templates",
  setting: "Settings",
  help: "Help",
};

/**
 * Groups in the order they are shown.
 *
 * Actions first, and not because they are more important in general — because
 * a person who has opened a palette and started typing usually means to *do*
 * something, and a list that puts twelve document titles above "sign note"
 * has made the fast path the slow one.
 */
export const KIND_ORDER: readonly ItemKind[] = [
  "action",
  "chart-resource",
  "patient",
  "template",
  "setting",
  "help",
];

/** Why an item cannot be run right now. Shown, never hidden. */
export interface Unavailable {
  /** "Offline", "Requires prescriber role", "Encounter not selected". */
  reason: string;
}

export interface PaletteItem {
  id: string;
  kind: ItemKind;
  /** "Start PHQ-9". The thing that is matched and the thing that is read. */
  label: string;
  /** "Assessment · 9 items · 4 min" — enough to choose between two similar rows. */
  detail?: string;
  /**
   * Extra words that should match but are not shown. "phq", "depression
   * screen", "9".
   */
  keywords?: readonly string[];
  /**
   * An argument the verb still needs. "order lithium level → … today".
   *
   * Present means Tab accepts the item and keeps the palette open rather than
   * running it.
   */
  argument?: { label: string; placeholder?: string };
  /**
   * True for anything destructive or clinically significant.
   *
   * These never run on the first Enter. The confirmation happens inside the
   * palette, because a palette that hands off to a modal has lost the keyboard
   * user it was built for.
   */
  significant?: boolean;
  /** Set when the action exists but cannot run. Rendered disabled, with the reason. */
  unavailable?: Unavailable;
  /** How often this user has run it. Weighted, never decisive. */
  frequency?: number;
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/**
 * Subsequence match with a score, in about forty lines rather than a library.
 *
 * Returns `null` for no match. Higher is better. The scoring rewards, in
 * order: a prefix match on the whole label, a match at the start of any word,
 * and adjacency of the matched characters — which is what makes "sph" find
 * "Start PHQ-9" and not "Sign the physiotherapy note".
 */
export function score(term: string, text: string): number | null {
  const needle = term.toLowerCase().trim();
  const hay = text.toLowerCase();
  if (!needle) return 0;
  if (!hay) return null;

  let points = 0;
  let cursor = 0;
  let previous = -2;

  for (const char of needle) {
    if (char === " ") continue;
    const found = hay.indexOf(char, cursor);
    if (found < 0) return null;

    // A word boundary is worth more than a letter in the middle of one.
    const atWordStart = found === 0 || /[\s\-/(),.]/.test(hay[found - 1] ?? "");
    points += atWordStart ? 12 : 2;
    if (found === previous + 1) points += 6;

    previous = found;
    cursor = found + 1;
  }

  /*
   * A prefix is a bonus, not a different scale.
   *
   * It used to return `1000 - length`, which was worth more than the entire
   * gap between a verb and a document — so "PHQ-9 result, 12 Aug" outranked
   * "Start PHQ-9" for the term "phq", which is precisely the ordering this
   * component exists to prevent. Every bonus now lives inside the same range
   * so `KIND_WEIGHT` can still dominate.
   */
  if (hay.startsWith(needle)) points += 60;

  // Shorter labels win ties: "Sign note" over "Sign note and close encounter".
  return points - Math.floor(hay.length / 8);
}

/** The best score across the label and any keywords, or `null`. */
export function scoreItem(term: string, item: PaletteItem): number | null {
  const candidates = [item.label, ...(item.keywords ?? [])];
  let best: number | null = null;
  for (const candidate of candidates) {
    const value = score(term, candidate);
    if (value !== null && (best === null || value > best)) best = value;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Ranking                                                             */
/* ------------------------------------------------------------------ */

/**
 * Group weights, applied before frequency.
 *
 * The gap between an action and a record is deliberately larger than anything
 * frequency can close: a palette where a much-visited document outranks the
 * verb the user just typed has stopped being a command palette.
 */
export const KIND_WEIGHT: Record<ItemKind, number> = {
  action: 400,
  "chart-resource": 200,
  patient: 150,
  template: 100,
  setting: 50,
  help: 0,
};

export interface RankedItem {
  item: PaletteItem;
  score: number;
}

/**
 * Rank the candidates for a term.
 *
 * Unavailable items are ranked and kept rather than filtered out. An action
 * that has silently vanished because the tablet is offline teaches somebody
 * that the feature does not exist; an action shown disabled with "Offline"
 * teaches them to reconnect.
 */
export function rank(term: string, items: readonly PaletteItem[]): RankedItem[] {
  /*
   * An empty term is not a search.
   *
   * Matching everything would be defensible in an ordinary palette and is not
   * here: it would withhold — and therefore count — every patient the user
   * has no relationship with, before anybody has typed a letter. "4,812
   * further matches outside your patients" on an empty input is both useless
   * and a disclosure of the size of the index.
   */
  if (!term.trim()) return [];

  const ranked: RankedItem[] = [];

  for (const item of items) {
    const base = scoreItem(term, item);
    if (base === null) continue;

    const frequency = Math.min(40, (item.frequency ?? 0) * 4);
    // Unavailable items sort below their group rather than out of the list.
    const penalty = item.unavailable ? 500 : 0;
    ranked.push({ item, score: base + KIND_WEIGHT[item.kind] + frequency - penalty });
  }

  return ranked.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
}

/** Ranked results split into their groups, in `KIND_ORDER`, empties dropped. */
export function group(ranked: readonly RankedItem[]): Array<{
  kind: ItemKind;
  items: RankedItem[];
}> {
  return KIND_ORDER.map((kind) => ({
    kind,
    items: ranked.filter((entry) => entry.item.kind === kind),
  })).filter((entry) => entry.items.length > 0);
}

/* ------------------------------------------------------------------ */
/* Scope                                                               */
/* ------------------------------------------------------------------ */

export interface PatientScope {
  /** Patient ids this user has a treatment relationship with. */
  inScope: ReadonlySet<string>;
  /** Whether break-glass is even available to this user. */
  breakGlass?: boolean;
}

export interface ScopedResults {
  /** The ones that may be named. */
  visible: RankedItem[];
  /**
   * How many matched outside the relationship.
   *
   * A count and nothing else. Naming them is the privacy event, and it happens
   * at the speed of thought, before anybody has decided to open a chart.
   */
  withheld: number;
}

/**
 * Split patient matches into what may be shown and what may only be counted.
 *
 * Everything that is not a patient passes through untouched: scoping applies
 * to people, not to settings and help.
 */
export function applyScope(
  ranked: readonly RankedItem[],
  scope: PatientScope | undefined,
): ScopedResults {
  if (!scope) return { visible: [...ranked], withheld: 0 };

  const visible: RankedItem[] = [];
  let withheld = 0;

  for (const entry of ranked) {
    if (entry.item.kind !== "patient" || scope.inScope.has(entry.item.id)) {
      visible.push(entry);
    } else {
      withheld += 1;
    }
  }

  return { visible, withheld };
}

/** "3 further matches — break-glass required." */
export function describeWithheld(withheld: number, scope?: PatientScope): string | null {
  if (withheld <= 0) return null;
  const noun = withheld === 1 ? "further match" : "further matches";
  return scope?.breakGlass
    ? `${withheld} ${noun} outside your patients — break-glass required`
    : `${withheld} ${noun} outside your patients — not available to your role`;
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export interface SearchAudit {
  /** The term as typed. The thing a review actually needs. */
  term: string;
  /** How many were shown, and how many existed but were withheld. */
  shown: number;
  withheld: number;
  /** True when the term matched nobody at all. */
  empty: boolean;
}

/**
 * The audit record for a patient search.
 *
 * Emitted for every search that touched the patient index, including the ones
 * that returned nothing — a search that found nobody is still a search that was
 * made, and in a privacy review the empty ones are the interesting ones.
 *
 * Returns `null` when the term matched no patient source at all, which is not
 * the same as matching zero patients: a term that only hit settings never
 * reached the index and there is nothing to record.
 */
export function auditFor(
  term: string,
  results: ScopedResults,
  searchedPatients: boolean,
): SearchAudit | null {
  if (!searchedPatients) return null;

  const shown = results.visible.filter((entry) => entry.item.kind === "patient").length;
  return { term, shown, withheld: results.withheld, empty: shown + results.withheld === 0 };
}

/* ------------------------------------------------------------------ */
/* Running                                                             */
/* ------------------------------------------------------------------ */

export type RunOutcome =
  | { kind: "run" }
  /** Tab, not Enter: the verb still needs its object. */
  | { kind: "argument"; label: string }
  /** Enter once shows this; Enter again runs it. */
  | { kind: "confirm"; prompt: string }
  | { kind: "blocked"; reason: string };

/**
 * What pressing Enter on this item should do.
 *
 * `confirmed` is what the second Enter passes. Splitting it this way keeps the
 * rule in one place rather than in a component's keydown handler, where it
 * would be re-derived and eventually got wrong.
 */
export function outcomeFor(item: PaletteItem, confirmed = false): RunOutcome {
  if (item.unavailable) return { kind: "blocked", reason: item.unavailable.reason };
  if (item.argument) return { kind: "argument", label: item.argument.label };
  if (item.significant && !confirmed) {
    return { kind: "confirm", prompt: `${item.label} — press Enter again to confirm` };
  }
  return { kind: "run" };
}

/**
 * The count, for the debounced live announcement.
 *
 * One sentence rather than a running commentary: a palette that announces on
 * every keystroke is a palette a screen-reader user cannot type into.
 */
export function describeResults(results: ScopedResults, scope?: PatientScope): string {
  const shown = results.visible.length;
  const head = shown === 0 ? "No results" : shown === 1 ? "1 result" : `${shown} results`;
  const withheld = describeWithheld(results.withheld, scope);
  return withheld ? `${head}. ${withheld}.` : `${head}.`;
}

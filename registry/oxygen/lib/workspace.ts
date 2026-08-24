/**
 * A multi-chart workspace, and the reason one exists at all.
 *
 * Clinicians work several charts at once and the tooling pretends they do not.
 * The state of the art is a dropdown of names, or worse, eleven browser tabs
 * whose titles truncate to "Chart — Riverside…". Wrong-patient documentation
 * survives every amount of staff training because it is a design defect: two
 * charts that look identical, one keyboard shortcut, and an interruption.
 *
 * Three rules are load-bearing and all three are here rather than in the
 * component, because getting any of them wrong is a safety event and not a
 * styling bug.
 *
 *   A chart's accent is derived from its id, so it is the same hue in every
 *   session and on every machine. An accent handed out in arrival order means
 *   the chart that was blue this morning is amber this afternoon.
 *
 *   Coming back to a chart after long enough re-asserts identity. Fifteen
 *   minutes is the default because that is roughly the length of an
 *   interruption you do not remember having.
 *
 *   Closing is graded. A chart with nothing outstanding closes; one with an
 *   unsigned note asks; one with a draft order refuses, because a draft order
 *   that vanishes with its tab is an order somebody thinks they placed.
 *
 * No React, no DOM, no store.
 */

/* ------------------------------------------------------------------ */
/* Charts                                                              */
/* ------------------------------------------------------------------ */

/** What is outstanding on a chart, in the order it is worth interrupting for. */
export type WorkKind = "draft-order" | "unsigned-note" | "unacknowledged-result" | "pending-task";

export const WORK_LABEL: Record<WorkKind, string> = {
  "draft-order": "draft order",
  "unsigned-note": "unsigned note",
  "unacknowledged-result": "unacknowledged result",
  "pending-task": "pending task",
};

/**
 * Order of consequence, not of arrival.
 *
 * A draft order outranks an unsigned note because the failure mode is worse:
 * a note nobody signed is visibly incomplete, and an order somebody believes
 * they placed is invisibly absent.
 */
export const WORK_ORDER: readonly WorkKind[] = [
  "draft-order",
  "unsigned-note",
  "unacknowledged-result",
  "pending-task",
];

/**
 * The same four, in one word each, for the badge on a tab.
 *
 * A tab is roughly eleven characters wide before the name starts truncating,
 * and "unacknowledged result" spends all of it. The long form stays in the
 * accessible name and in the expanded panel, where there is room for it — a
 * badge that pushes the patient's name out of view has traded the identity for
 * the annotation.
 */
export const WORK_SHORT: Record<WorkKind, string> = {
  "draft-order": "order",
  "unsigned-note": "note",
  "unacknowledged-result": "result",
  "pending-task": "task",
};

export interface OutstandingWork {
  kind: WorkKind;
  /** ISO 8601. When it became outstanding. */
  since?: string;
  /** "Progress note", "Lithium level". */
  label?: string;
}

export interface OpenChart {
  /** Stable across sessions. The accent is derived from it. */
  id: string;
  /** "A. Okonkwo" — the name, never initials alone. */
  display: string;
  /** The identifier shown beside the name when two charts look alike. */
  identifier?: string;
  /** Why this chart is open: "Ward round", "Discharge summary", "Triage". */
  reason?: string;
  /** ISO 8601. Last time the clinician had this chart in front of them. */
  lastActiveAt?: string;
  pinned?: boolean;
  work?: readonly OutstandingWork[];
}

/* ------------------------------------------------------------------ */
/* Accent                                                              */
/* ------------------------------------------------------------------ */

/**
 * How many hues a chart can be given.
 *
 * Eight, and not more. Twelve hues is twelve near-neighbours nobody can tell
 * apart, which converts the accent from an identity into a decoration — and a
 * decoration that looks like an identity is worse than no accent at all.
 */
export const ACCENT_COUNT = 8;

/** FNV-1a, 32-bit. Small, stable, and not a hash anybody should trust for more. */
export function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * The chart's hue index, derived from its id.
 *
 * Deterministic on purpose. An accent assigned in arrival order means the
 * chart that was blue this morning is amber this afternoon, and a clinician
 * who has learned "Okonkwo is the green one" has learned something false.
 */
export function chartAccent(chartId: string): number {
  return fnv1a(chartId) % ACCENT_COUNT;
}

/**
 * Charts whose names are close enough to be mistaken for one another.
 *
 * Deliberately blunt and deliberately conservative: it compares the family
 * name's first letters and the whole string folded. A false positive costs a
 * visible identifier on a row; a false negative costs a note in the wrong
 * chart.
 */
export function similarPairs(charts: readonly OpenChart[]): Array<[string, string]> {
  const fold = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]/g, "");

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < charts.length; i += 1) {
    for (let j = i + 1; j < charts.length; j += 1) {
      const a = charts[i];
      const b = charts[j];
      if (!a || !b) continue;
      const fa = fold(a.display);
      const fb = fold(b.display);
      if (!fa || !fb) continue;
      if (fa === fb || fa.slice(0, 4) === fb.slice(0, 4)) pairs.push([a.id, b.id]);
    }
  }
  return pairs;
}

/**
 * Which charts must show their identifier because another looks like them.
 *
 * The identifier is added to *both* sides of a similar pair. Marking only the
 * newcomer would leave the reader comparing a row that has one against a row
 * that does not, which is a harder comparison than two that both do.
 */
export function needsIdentifier(charts: readonly OpenChart[]): Set<string> {
  const flagged = new Set<string>();
  for (const [a, b] of similarPairs(charts)) {
    flagged.add(a);
    flagged.add(b);
  }
  return flagged;
}

/* ------------------------------------------------------------------ */
/* Order                                                               */
/* ------------------------------------------------------------------ */

/**
 * Pinned first, then most recently active.
 *
 * Stable for charts with no `lastActiveAt`: they keep the order they arrived
 * in rather than being shuffled to the front, because a chart the clinician
 * has not touched should not move on its own.
 */
export function orderCharts(charts: readonly OpenChart[]): OpenChart[] {
  return charts
    .map((chart, index) => ({ chart, index }))
    .sort((a, b) => {
      if (Boolean(a.chart.pinned) !== Boolean(b.chart.pinned)) return a.chart.pinned ? -1 : 1;
      const at = a.chart.lastActiveAt ? Date.parse(a.chart.lastActiveAt) : Number.NaN;
      const bt = b.chart.lastActiveAt ? Date.parse(b.chart.lastActiveAt) : Number.NaN;
      const aHas = Number.isFinite(at);
      const bHas = Number.isFinite(bt);
      if (aHas && bHas && at !== bt) return bt - at;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.chart);
}

/**
 * Moving a chart by one place, which is what the keyboard equivalent of a
 * drag has to do (WCAG 2.5.7).
 *
 * Returns the list unchanged when the move would cross the pinned boundary —
 * reordering must not silently pin or unpin a chart, because pinned means
 * "I decided this stays" and a keystroke should not decide it for you.
 */
export function moveChart(
  charts: readonly OpenChart[],
  id: string,
  direction: -1 | 1,
): OpenChart[] {
  const from = charts.findIndex((chart) => chart.id === id);
  if (from < 0) return [...charts];

  const to = from + direction;
  const moving = charts[from];
  const target = charts[to];
  if (!moving || !target) return [...charts];
  if (Boolean(moving.pinned) !== Boolean(target.pinned)) return [...charts];

  const next = [...charts];
  next.splice(from, 1);
  next.splice(to, 0, moving);
  return next;
}

/* ------------------------------------------------------------------ */
/* Outstanding work                                                    */
/* ------------------------------------------------------------------ */

/** The most consequential outstanding item, or `null`. */
export function worstWork(chart: OpenChart): OutstandingWork | null {
  const work = chart.work ?? [];
  let worst: OutstandingWork | null = null;
  for (const item of work) {
    if (!worst || WORK_ORDER.indexOf(item.kind) < WORK_ORDER.indexOf(worst.kind)) worst = item;
  }
  return worst;
}

/**
 * "2 unsigned notes, oldest 3 days".
 *
 * A therapist's day is six to eight charts with a note owed on each, and how
 * long they have been owed is the number that decides whether the week ends on
 * time. A count alone does not carry that.
 */
export function describeWork(charts: readonly OpenChart[], now?: string): string | null {
  const unsigned = charts.flatMap((chart) =>
    (chart.work ?? []).filter((item) => item.kind === "unsigned-note"),
  );
  if (!unsigned.length) return null;

  const noun = unsigned.length === 1 ? "unsigned note" : "unsigned notes";
  if (!now) return `${unsigned.length} ${noun}`;

  const at = Date.parse(now);
  const ages = unsigned
    .map((item) => (item.since ? at - Date.parse(item.since) : Number.NaN))
    .filter((ms) => Number.isFinite(ms) && ms >= 0);
  if (!ages.length) return `${unsigned.length} ${noun}`;

  const oldest = Math.max(...ages);
  const days = Math.floor(oldest / 86_400_000);
  const hours = Math.floor(oldest / 3_600_000);
  const age = days >= 1 ? `${days} day${days === 1 ? "" : "s"}` : `${hours} h`;
  return `${unsigned.length} ${noun}, oldest ${age}`;
}

/* ------------------------------------------------------------------ */
/* Closing                                                             */
/* ------------------------------------------------------------------ */

export type CloseVerdict =
  | { kind: "close" }
  /** Losing the work is possible but must be chosen. */
  | { kind: "confirm"; reason: string }
  /** Not offered at all. The work has to be resolved first. */
  | { kind: "refuse"; reason: string };

/**
 * Whether this chart may be closed.
 *
 * Graded rather than binary. A draft order refuses, because an order that
 * disappears with its tab is an order somebody believes they placed — and
 * unlike an unsigned note, nothing downstream will show its absence. An
 * unsigned note asks. Everything else closes.
 */
export function canClose(chart: OpenChart): CloseVerdict {
  const work = chart.work ?? [];

  const order = work.find((item) => item.kind === "draft-order");
  if (order) {
    return {
      kind: "refuse",
      reason: order.label
        ? `${chart.display} has a draft order — ${order.label}. Sign it or discard it first.`
        : `${chart.display} has a draft order. Sign it or discard it first.`,
    };
  }

  const note = work.find((item) => item.kind === "unsigned-note");
  if (note) {
    return {
      kind: "confirm",
      reason: note.label
        ? `${chart.display} has an unsigned ${note.label.toLowerCase()}. Close and lose the draft?`
        : `${chart.display} has an unsigned note. Close and lose the draft?`,
    };
  }

  return { kind: "close" };
}

/* ------------------------------------------------------------------ */
/* Returning                                                           */
/* ------------------------------------------------------------------ */

/** How long away before returning to a chart re-asserts who it belongs to. */
export const REASSERT_AFTER_MS = 15 * 60_000;

/**
 * Whether coming back to this chart should confirm identity first.
 *
 * Fifteen minutes because that is roughly the length of an interruption you do
 * not remember having, which is the interruption that produces the wrong-chart
 * note. A chart with no recorded activity re-asserts too: not knowing how long
 * you were away is not the same as having just left.
 */
export function needsReassertion(
  chart: OpenChart,
  now: string,
  after: number = REASSERT_AFTER_MS,
): boolean {
  if (!chart.lastActiveAt) return true;
  const away = Date.parse(now) - Date.parse(chart.lastActiveAt);
  if (!Number.isFinite(away)) return true;
  return away >= after;
}

/** The chart, as one spoken statement, including what is owed on it. */
export function describeChart(
  chart: OpenChart,
  options: { showIdentifier?: boolean } = {},
): string {
  const parts: string[] = [chart.display];

  if (options.showIdentifier && chart.identifier) parts.push(chart.identifier);
  if (chart.pinned) parts.push("pinned");
  if (chart.reason) parts.push(chart.reason);

  const work = chart.work ?? [];
  if (work.length) {
    const counted = WORK_ORDER.filter((kind) => work.some((item) => item.kind === kind)).map(
      (kind) => {
        const n = work.filter((item) => item.kind === kind).length;
        return n === 1 ? WORK_LABEL[kind] : `${n} ${WORK_LABEL[kind]}s`;
      },
    );
    parts.push(counted.join(", "));
  }

  // Each clause is a sentence and starts like one. "Discharge summary.
  // unsigned note." is a statement no screen reader punctuates correctly.
  return `${parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(". ")}.`;
}

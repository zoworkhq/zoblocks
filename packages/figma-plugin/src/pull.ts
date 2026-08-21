/**
 * A published theme, as a set of changes somebody can look at before agreeing.
 *
 * Pure, and deliberately the whole of the pull decision: what the console sent
 * becomes a plan, the plan is compared against the file, and what comes out is
 * a preview. The sandbox's job is to apply a diff it did not compute.
 *
 * Preview-first is the property this exists to make possible, and it is not
 * politeness. A sync that writes on the button that says "sync" gives a
 * designer no moment at which the answer to "what is about to happen to my
 * file" is anything other than "run it and see".
 */

import {
  COLLECTION,
  THEMES,
  diffPlan,
  toVariablePlan,
  type PlanDiff,
  type PlannedVariable,
  type ResolvedTheme,
  type VariablePlan,
  type VariableSnapshot,
} from "@oxygenui-design/figma-core";

import { contrastBetween, generateRamp } from "@oxygenui-design/tokens/validate";

import type { ResolvedPayload } from "./console";

/** Plugin data on the collection, so a file knows what it is pinned to. */
export const PIN = { theme: "ox.theme", version: "ox.version" } as const;

export interface PullPreview {
  slug: string;
  name: string;
  version: number;
  status: "published" | "draft";
  plan: VariablePlan;
  diff: PlanDiff;
  /** What the file was pinned to before this pull, when it was pinned. */
  pinned?: { slug: string; version: number };
  /**
   * Clinical variables a designer has edited, which this pull restores.
   *
   * Called out separately from `update` because it is the one category where
   * the change is undoing somebody's deliberate work. Buried in a count of
   * forty it reads as churn; named, it is a rule being enforced in public.
   */
  restores: { name: string; reason: string }[];
}

export function toResolvedTheme(payload: ResolvedPayload): ResolvedTheme {
  return {
    ramp: payload.ramp,
    semantic: payload.semantic,
    ...(payload.locked ? { locked: payload.locked } : {}),
  };
}

export interface PullOptions {
  includeComponent?: boolean;
  /** From the collection's plugin data, when this file has been pulled before. */
  pinned?: { slug: string; version: number };
}

export function previewPull(
  payload: ResolvedPayload,
  snapshot: VariableSnapshot,
  options: PullOptions = {},
): PullPreview {
  const plan = toVariablePlan(toResolvedTheme(payload), {
    ...(options.includeComponent ? { includeComponent: true } : {}),
  });
  const diff = diffPlan(plan, snapshot);

  return {
    slug: payload.slug,
    name: payload.name,
    version: payload.version,
    status: payload.status,
    plan,
    diff,
    ...(options.pinned ? { pinned: options.pinned } : {}),
    restores: restoredClinical(diff, snapshot),
  };
}

/**
 * Which of the updates are clinical values being put back.
 *
 * Narrower than "a locked variable appears in `update`", and the narrowing is
 * the point. A clinical variable lands in `update` for three different reasons
 * and only one of them is somebody's edit being undone:
 *
 *   - **a mode the file does not have yet** — that is a creation wearing an
 *     update's clothes, and reporting it would tell a designer their work was
 *     overwritten on the first pull into a file with no dark mode;
 *   - **a renamed label** — the label is theirs, and restoring it is not
 *     restoring a clinical signal;
 *   - **a value in a mode the file holds, and it differs** — a customer cannot
 *     change a clinical value in the console, so this one came from an edit
 *     here. This is the only case worth saying out loud.
 *
 * Crying wolf on the other two is how a warning that matters gets skimmed.
 */
function restoredClinical(
  diff: PlanDiff,
  snapshot: VariableSnapshot,
): { name: string; reason: string }[] {
  const inFile = new Map<string, VariableSnapshot["variables"][number]>();
  for (const variable of snapshot.variables) {
    if (variable.token) inFile.set(variable.token, variable);
  }

  const out: { name: string; reason: string }[] = [];
  for (const { variable, because } of diff.update) {
    if (!variable.locked) continue;
    const found = inFile.get(variable.token);
    if (!found) continue;

    const edited = because.some((mode) => mode !== "name" && found.values[mode as never]);
    if (edited) out.push({ name: found.name, reason: variable.locked });
  }
  return out;
}

/**
 * The sentence the preview leads with.
 *
 * Built here rather than in the panel because the counts and the words have to
 * agree, and two places that each know half of that is how a preview comes to
 * say "no changes" above a list of four.
 */
export function summarise(diff: PlanDiff): string {
  if (diff.clean) return "Nothing to change. This file already matches.";

  const parts: string[] = [];
  if (diff.create.length) parts.push(`${diff.create.length} created`);
  if (diff.update.length) parts.push(`${diff.update.length} updated`);
  if (diff.orphan.length) parts.push(`${diff.orphan.length} no longer in this theme`);
  return `${parts.join(", ")}.`;
}

/**
 * Whether this pull is a version move, and which way.
 *
 * The panel says *this file is on v6; v7 is live* — which needs the pin, and
 * needs to distinguish going forward from going back. Pulling an older version
 * on purpose is legitimate; doing it by accident is the thing to warn about.
 */
export function versionMove(
  pinned: { slug: string; version: number } | undefined,
  next: { slug: string; version: number },
): "first" | "same" | "forward" | "back" | "different-theme" {
  if (!pinned) return "first";
  if (pinned.slug !== next.slug) return "different-theme";
  if (pinned.version === next.version) return "same";
  return next.version > pinned.version ? "forward" : "back";
}

/** Every collection the plan needs, whether or not the file has them yet. */
export function collectionsIn(plan: VariablePlan): string[] {
  const named = new Set(plan.variables.map((v) => v.collection));
  return Object.values(COLLECTION).filter((c) => named.has(c));
}

/** The modes a tier needs. Brand has one; the themed tiers have three. */
export function modesFor(collection: string): string[] {
  return collection === COLLECTION.brand ? ["Default"] : [...THEMES];
}

/** Ordered so an alias is never written before the variable it points at. */
export function applyOrder(variables: PlannedVariable[]): PlannedVariable[] {
  const rank = { brand: 0, semantic: 1, component: 2 } as const;
  return [...variables].sort((a, b) => rank[a.tier] - rank[b.tier]);
}

/**
 * What the accent would measure if the brand anchor moved.
 *
 * The pair a designer needs while choosing: the label colour on the step the
 * accent actually comes from. One pair, not the gate — the console measures
 * twenty-odd across three themes and is the only thing that can refuse.
 *
 * **Which step that is comes from the data, not from a constant here.** The
 * semantic tier defines `accent` as `{ref.brand.700}`, and the first version of
 * this measured the anchor itself. For `#0f766e` it reported 5.47:1 where the
 * console reported 2.98:1 — because `generateRamp` pins the seed at 600 and
 * derives the others at fixed lightnesses, so a seed darker than 600's nominal
 * lightness produces a *lighter* 700. Confidently wrong, in the one direction
 * that matters: it said pass where the gate says fail.
 *
 * So the step is recovered by finding which ramp entry the theme's current
 * accent equals — the same equality `toVariablePlan` uses to decide an alias.
 * If nothing matches, because a customer overrode `accent` to a literal, this
 * returns nothing rather than guessing. No number beats a wrong one.
 */
export function accentStep(payload: ResolvedPayload): string | undefined {
  const accent = payload.semantic.light["--ox-accent"]?.toLowerCase();
  if (!accent) return undefined;
  return Object.entries(payload.ramp).find(([, hex]) => hex.toLowerCase() === accent)?.[0];
}

export interface LocalReading {
  ratio: number;
  floor: number;
  against: string;
  passes: boolean;
}

export function readAnchorLocally(
  payload: ResolvedPayload,
  anchor: string,
): LocalReading | undefined {
  const step = accentStep(payload);
  const label = payload.semantic.light["--ox-text-on-accent"];
  if (!step || !label) return undefined;

  const ramp = generateRamp(anchor.trim());
  const candidate = ramp?.[Number(step) as keyof typeof ramp];
  if (!candidate) return undefined;

  const ratio = contrastBetween(label, candidate);
  if (ratio === undefined) return undefined;

  return { ratio, floor: 4.5, against: "text-on-accent", passes: ratio >= 4.5 };
}

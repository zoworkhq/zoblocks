/**
 * What a sync would actually change, before it changes it.
 *
 * Two properties are being protected here and both fail silently without a
 * diff. **Idempotence**: running a pull twice must write nothing the second
 * time, or every sync churns the file's version history and a designer loses
 * the ability to see what changed — which is the reason they opened history.
 * **Durable identity**: a designer will rename a variable, and matching on the
 * label would create a duplicate the first time somebody tidies a collection.
 *
 * So the key is the Zoblocks token name stamped in plugin data, and the label is
 * treated as something the designer owns.
 */

import { figmaRgbToHex } from "./color";
import type { PlannedValue, PlannedVariable, ThemeName, VariablePlan } from "./plan";

/** One variable as the sandbox found it. Plain data; no Figma types. */
export interface SnapshotVariable {
  /** From `getPluginData("ox.token")`. Absent for anything we did not create. */
  token?: string;
  name: string;
  collection: string;
  values: Partial<Record<ThemeName | "default", PlannedValue>>;
}

export interface VariableSnapshot {
  variables: SnapshotVariable[];
}

export interface PlanDiff {
  create: PlannedVariable[];
  update: { variable: PlannedVariable; because: string[] }[];
  /** Ours once, and no longer in this theme. Listed, never deleted silently. */
  orphan: SnapshotVariable[];
  /** True when applying this would write nothing at all. */
  clean: boolean;
}

/** Compared as hex rather than as floats: 0.1 + 0.2 is not a colour question. */
function same(a: PlannedValue | undefined, b: PlannedValue | undefined): boolean {
  if (!a || !b) return a === b;
  if (a.kind !== b.kind) return false;

  switch (a.kind) {
    case "color":
      return figmaRgbToHex(a.rgb) === figmaRgbToHex((b as typeof a).rgb);
    case "alias":
      return a.token === (b as typeof a).token;
    case "string":
      return a.value === (b as typeof a).value;
    case "number":
      return a.value === (b as typeof a).value;
  }
}

export function diffPlan(plan: VariablePlan, snapshot: VariableSnapshot): PlanDiff {
  const existing = new Map(
    snapshot.variables.filter((v) => v.token).map((v) => [v.token as string, v]),
  );

  const create: PlannedVariable[] = [];
  const update: PlanDiff["update"] = [];

  for (const planned of plan.variables) {
    const found = existing.get(planned.token);
    if (!found) {
      create.push(planned);
      continue;
    }

    const because: string[] = [];
    for (const [mode, value] of Object.entries(planned.values)) {
      if (!same(value, found.values[mode as ThemeName | "default"])) because.push(mode);
    }

    /*
     * A renamed variable is updated, not recreated.
     *
     * The label is the designer's; we restore it because the plan's name is the
     * one that keeps a collection navigable — but the *identity* came from
     * plugin data, so this is an update and there is exactly one variable
     * afterwards rather than two.
     */
    if (found.name !== planned.name) because.push("name");

    if (because.length > 0) update.push({ variable: planned, because });
  }

  const planned = new Set(plan.variables.map((v) => v.token));
  const orphan = snapshot.variables.filter((v) => v.token && !planned.has(v.token));

  return { create, update, orphan, clean: create.length === 0 && update.length === 0 };
}

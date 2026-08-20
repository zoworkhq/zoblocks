/**
 * What a sync would change, and the two properties that fail silently.
 *
 * **Idempotence**: a second pull of the same version must write nothing. Without
 * it every sync churns the file's version history, and the designer loses the
 * ability to see what actually changed — which is the thing they opened history
 * to find out. A sync that rewrites everything is indistinguishable from a
 * broken one until somebody checks.
 *
 * **Durable identity**: a designer will rename a variable. Matching on the
 * label creates a duplicate the first time somebody tidies a collection, and
 * then there are two `accent`s and no way to tell which one the file uses.
 */

import { describe, expect, it } from "vitest";
import { diffPlan, type VariableSnapshot } from "../src/diff";
import { toVariablePlan } from "../src/plan";
import { theme } from "./fixture";

/**
 * The file as it would be immediately after applying a plan.
 *
 * Structure-cloned, and not merely for test hygiene: a real snapshot reaches
 * this package across `postMessage` from the plugin sandbox, so it is cloned by
 * definition. Sharing the plan's own `values` objects made three tests below
 * pass for the wrong reason — mutating the "snapshot" also mutated the plan, so
 * the two agreed and `diffPlan` correctly reported no change to something that
 * had not changed.
 */
function snapshotOf(plan: ReturnType<typeof toVariablePlan>): VariableSnapshot {
  return structuredClone({
    variables: plan.variables.map((v) => ({
      token: v.token,
      name: v.name,
      collection: v.collection,
      values: v.values,
    })),
  });
}

describe("running it twice writes nothing the second time", () => {
  it("is clean against a file it just produced", () => {
    const plan = toVariablePlan(theme());
    const diff = diffPlan(plan, snapshotOf(plan));

    expect(diff.create).toEqual([]);
    expect(diff.update).toEqual([]);
    expect(diff.clean).toBe(true);
  });

  it("creates everything against an empty file", () => {
    const plan = toVariablePlan(theme());
    const diff = diffPlan(plan, { variables: [] });

    expect(diff.create).toHaveLength(plan.variables.length);
    expect(diff.clean).toBe(false);
  });

  /**
   * Compared as hex rather than as floats.
   *
   * The same colour arrives back from Figma with rounding applied, so a
   * float-equality check reports a difference on every single variable and the
   * sync is never idempotent — while looking, in the diff, entirely reasonable.
   */
  it("is not fooled by a channel that came back with rounding applied", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    const text = snapshot.variables.find((v) => v.token === "--ox-text")!;

    const value = text.values.light as {
      kind: "color";
      hex: string;
      rgb: { r: number; g: number; b: number };
    };
    text.values.light = {
      ...value,
      rgb: { r: value.rgb.r + 1e-9, g: value.rgb.g, b: value.rgb.b - 1e-9 },
    };

    expect(diffPlan(plan, snapshot).clean).toBe(true);
  });
});

describe("a renamed variable is updated, not duplicated", () => {
  it("matches on the stamped token rather than the label", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    snapshot.variables.find((v) => v.token === "--ox-accent")!.name = "brand blue (do not touch)";

    const diff = diffPlan(plan, snapshot);

    expect(diff.create.map((v) => v.token)).not.toContain("--ox-accent");
    expect(diff.update.find((u) => u.variable.token === "--ox-accent")?.because).toContain("name");
  });

  /**
   * A variable with no plugin data is somebody else's.
   *
   * Claiming one because its label happens to match would let this plugin
   * overwrite a designer's own variable named `accent`, which is a far worse
   * failure than creating a second one.
   */
  it("never claims a variable it did not create", () => {
    const plan = toVariablePlan(theme());
    const diff = diffPlan(plan, {
      variables: [{ name: "accent", collection: "Oxygen / Semantic", values: {} }],
    });

    expect(diff.orphan).toEqual([]);
    expect(diff.create.map((v) => v.token)).toContain("--ox-accent");
  });
});

describe("what is no longer in the theme", () => {
  /**
   * Listed, never deleted as a side effect.
   *
   * A variable that vanished from the theme may still be in use on a page
   * somebody has built. Removing it silently breaks that page and the diff is
   * the only place a person could have seen it coming.
   */
  it("reports ours-but-gone as an orphan rather than removing it", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    snapshot.variables.push({
      token: "--ox-accent-retired",
      name: "accent/retired",
      collection: "Oxygen / Semantic",
      values: {},
    });

    const diff = diffPlan(plan, snapshot);

    expect(diff.orphan.map((v) => v.token)).toEqual(["--ox-accent-retired"]);
    // Orphans are not writes, so a file holding one is still clean to sync.
    expect(diff.clean).toBe(true);
  });
});

describe("what counts as a change", () => {
  it("names the modes that differ, so a preview can say what moves", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    const text = snapshot.variables.find((v) => v.token === "--ox-text")!;
    text.values.dark = { kind: "color", hex: "#ffffff", rgb: { r: 1, g: 1, b: 1 } };

    const diff = diffPlan(plan, snapshot);
    expect(diff.update.find((u) => u.variable.token === "--ox-text")?.because).toEqual(["dark"]);
  });

  it("treats an alias pointing somewhere else as a change", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    const accent = snapshot.variables.find((v) => v.token === "--ox-accent")!;
    accent.values.light = { kind: "alias", token: "--ox-ref-brand-600" };

    expect(diffPlan(plan, snapshot).clean).toBe(false);
  });

  it("treats a literal where an alias belongs as a change", () => {
    const plan = toVariablePlan(theme());
    const snapshot = snapshotOf(plan);
    const accent = snapshot.variables.find((v) => v.token === "--ox-accent")!;
    // Same colour, severed link — which is exactly the degradation to catch.
    accent.values.light = {
      kind: "color",
      hex: "#1851a5",
      rgb: { r: 0.09411764705882353, g: 0.3176470588235294, b: 0.6470588235294118 },
    };

    expect(diffPlan(plan, snapshot).clean).toBe(false);
  });
});

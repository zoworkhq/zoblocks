/**
 * A theme as a variable plan.
 *
 * One property here carries the whole value of the integration and degrades
 * silently: **aliasing**. A plan that resolves every semantic token to a literal
 * hex produces a Figma file where changing the brand means editing three
 * hundred variables by hand — which is the problem the token system exists to
 * solve, rebuilt inside somebody's design file. It looks completely correct on
 * screen, which is why it is asserted rather than eyeballed.
 */

import { describe, expect, it } from "vitest";
import { COLLECTION, THEMES, labelFor, toVariablePlan } from "../src/plan";
import { CLINICAL, RAMP, theme } from "./fixture";

const find = (plan: ReturnType<typeof toVariablePlan>, token: string) =>
  plan.variables.find((v) => v.token === token);

describe("the shape of the file it would build", () => {
  it("puts the ramp in one mode, because a palette is not a theme", () => {
    const plan = toVariablePlan(theme());
    const brand = plan.collections.find((c) => c.name === COLLECTION.brand)!;

    // Three identical modes would triple the surface and imply a choice the
    // ramp does not have: it is what the themes select *from*.
    expect(brand.modes).toEqual(["Default"]);
    expect(plan.variables.filter((v) => v.tier === "brand")).toHaveLength(Object.keys(RAMP).length);
  });

  it("gives the semantic collection one mode per theme", () => {
    const plan = toVariablePlan(theme());
    const semantic = plan.collections.find((c) => c.name === COLLECTION.semantic)!;
    expect(semantic.modes).toEqual([...THEMES]);
  });

  /**
   * The component tier is off unless asked for.
   *
   * It is large enough to make a designer's variable panel unusable, and nearly
   * every entry is an alias to a semantic token they already have.
   */
  it("leaves the component tier out by default", () => {
    const withComponent = theme({
      component: { light: { "--zb-switch-track-on-bg": "#1851a5" }, dark: {}, "high-contrast": {} },
    });

    expect(toVariablePlan(withComponent).collections.map((c) => c.name)).not.toContain(
      COLLECTION.component,
    );
    expect(
      toVariablePlan(withComponent, { includeComponent: true }).collections.map((c) => c.name),
    ).toContain(COLLECTION.component);
  });

  it("groups labels on the slash so a panel of sixty is navigable", () => {
    expect(labelFor("--zb-accent-hover")).toBe("accent/hover");
    expect(labelFor("--zb-text")).toBe("text");
  });
});

describe("aliases, not flattened hex", () => {
  /**
   * The acceptance criterion the plan singles out, and the reason it does.
   *
   * `--zb-accent` resolves to exactly the ramp's 700 step. Written as a literal
   * it renders identically and severs the link, so moving the brand stops
   * moving the accent — and nothing about the file says so.
   */
  it("aliases a semantic token that resolves to a ramp step", () => {
    const plan = toVariablePlan(theme());
    const accent = find(plan, "--zb-accent")!;

    expect(accent.values.light).toEqual({ kind: "alias", token: "--zb-ref-brand-700" });
  });

  it("keeps a literal where the value is not a ramp step", () => {
    const plan = toVariablePlan(theme());
    expect(find(plan, "--zb-text")!.values.light).toMatchObject({ kind: "color", hex: "#16181d" });
  });

  it("follows a declared reference ahead of guessing from the value", () => {
    const plan = toVariablePlan(theme({ references: { "--zb-text": "--zb-ref-brand-950" } }));
    // The declaration wins: the chain is known, not inferred.
    expect(find(plan, "--zb-text")!.values.light).toEqual({
      kind: "alias",
      token: "--zb-ref-brand-950",
    });
  });

  it("aliases per mode, since a token can be a step in one theme and not another", () => {
    const plan = toVariablePlan(theme());
    const accent = find(plan, "--zb-accent")!;

    expect(accent.values.light).toMatchObject({ kind: "alias" });
    expect(accent.values.dark).toMatchObject({ kind: "alias", token: "--zb-ref-brand-400" });
  });
});

describe("clinical tokens arrive locked", () => {
  /**
   * Pushed so a designer can see them, refused on the way back — exactly as the
   * framework bridges treat the same tokens. Hiding them would make the refusal
   * invisible and the palette look incomplete.
   */
  it("carries the reason, in the words the app uses", () => {
    const plan = toVariablePlan(theme());
    const critical = find(plan, "--zb-status-critical")!;

    expect(critical.locked).toMatch(/hue separation/);
    // Figma shows a variable's description in its own panel, so the reason
    // travels with the variable rather than living in our UI.
    expect(critical.description).toBe(critical.locked);
  });

  it("still pushes them, in every theme", () => {
    const plan = toVariablePlan(theme());
    const critical = find(plan, "--zb-status-critical")!;
    for (const mode of THEMES) expect(critical.values[mode], mode).toBeDefined();
  });

  it("leaves everything else unlocked", () => {
    const plan = toVariablePlan(theme());
    const unlocked = plan.variables.filter((v) => !v.locked).map((v) => v.token);
    for (const token of CLINICAL.slice(0, 1)) expect(unlocked).not.toContain(token);
    expect(unlocked).toContain("--zb-accent");
  });
});

describe("what it refuses to invent", () => {
  it("skips a ramp entry that is not a colour rather than emitting nonsense", () => {
    const plan = toVariablePlan(theme({ ramp: { ...RAMP, "600": "not-a-colour" } }));
    expect(find(plan, "--zb-ref-brand-600")).toBeUndefined();
  });

  it("keeps a non-colour semantic value as a string, not a broken colour", () => {
    const plan = toVariablePlan(
      theme({
        semantic: {
          light: { "--zb-font-sans": "Instrument Sans, sans-serif" },
          dark: {},
          "high-contrast": {},
        },
      }),
    );
    expect(find(plan, "--zb-font-sans")!.values.light).toEqual({
      kind: "string",
      value: "Instrument Sans, sans-serif",
    });
  });

  it("omits a variable that has no value in any mode", () => {
    const plan = toVariablePlan(theme({ semantic: { light: {}, dark: {}, "high-contrast": {} } }));
    expect(plan.variables.filter((v) => v.tier === "semantic")).toHaveLength(0);
  });
});

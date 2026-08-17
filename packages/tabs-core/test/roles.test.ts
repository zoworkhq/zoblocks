/**
 * The semantic-mode mapping.
 *
 * These assertions look tautological until you remember what they encode: the
 * exact set of differences between four components that share one silhouette.
 * A change here is a change to what a screen reader says.
 */

import { describe, expect, it } from "vitest";
import { ariaOrientation, disabledProps, isSemanticMode, rolesFor } from "../src/index.js";

describe("rolesFor", () => {
  it('as="tabs" is a tablist of buttons that owns panels', () => {
    const spec = rolesFor("tabs");
    expect(spec).toMatchObject({
      listRole: "tablist",
      listElement: "div",
      triggerRole: "tab",
      triggerElement: "button",
      selectedAttr: "aria-selected",
      arrowKeys: true,
      roving: true,
      ownsPanels: true,
      formValue: false,
    });
  });

  it('as="nav" is a real <nav> of anchors with no arrow-key hijack', () => {
    const spec = rolesFor("nav");
    expect(spec).toMatchObject({
      listRole: null,
      listElement: "nav",
      triggerRole: null,
      triggerElement: "a",
      selectedAttr: "aria-current",
      selectedValue: "page",
      // The whole point: links keep the browser behaviour users already have.
      arrowKeys: false,
      roving: false,
      ownsPanels: false,
      gateable: false,
    });
  });

  it('as="radiogroup" is a form value, not a view', () => {
    const spec = rolesFor("radiogroup");
    expect(spec).toMatchObject({
      listRole: "radiogroup",
      triggerRole: "radio",
      selectedAttr: "aria-checked",
      arrowKeys: true,
      ownsPanels: false,
      formValue: true,
    });
  });

  it('as="steps" shares the tabs tree but is always gateable', () => {
    const steps = rolesFor("steps");
    expect(steps.listRole).toBe("tablist");
    expect(steps.triggerRole).toBe("tab");
    expect(steps.gateable).toBe(true);
  });

  it("only tabs and steps own panels", () => {
    expect(rolesFor("tabs").ownsPanels).toBe(true);
    expect(rolesFor("steps").ownsPanels).toBe(true);
    expect(rolesFor("nav").ownsPanels).toBe(false);
    expect(rolesFor("radiogroup").ownsPanels).toBe(false);
  });

  it("only radiogroup is a form value", () => {
    expect(rolesFor("radiogroup").formValue).toBe(true);
    for (const mode of ["tabs", "nav", "steps"] as const) {
      expect(rolesFor(mode).formValue).toBe(false);
    }
  });
});

describe("ariaOrientation", () => {
  // Setting aria-orientation without swapping the key axis is a lie to the
  // screen reader, so both come from the same place and this proves it.
  it("is emitted only where arrow keys exist", () => {
    expect(ariaOrientation("tabs", "vertical")).toBe("vertical");
    expect(ariaOrientation("radiogroup", "horizontal")).toBe("horizontal");
    expect(ariaOrientation("steps", "vertical")).toBe("vertical");
    expect(ariaOrientation("nav", "vertical")).toBeUndefined();
  });
});

describe("disabledProps", () => {
  it("emits nothing when the item is enabled", () => {
    expect(disabledProps(false)).toEqual({});
    expect(disabledProps(undefined)).toEqual({});
  });

  it("uses aria-disabled so the trigger stays focusable and discoverable", () => {
    expect(disabledProps(true)).toEqual({ "aria-disabled": true });
    // Never the `disabled` attribute — it removes the element from the
    // accessibility tree entirely.
    expect(disabledProps(true)).not.toHaveProperty("disabled");
  });

  it("wires the reason through aria-describedby when one is given", () => {
    expect(disabledProps(true, "reason-1")).toEqual({
      "aria-disabled": true,
      "aria-describedby": "reason-1",
    });
  });
});

/**
 * The guard in front of `rolesFor`.
 *
 * `rolesFor` indexes a record by the mode and returns `undefined` for anything
 * that is not one of the four. Inside the type system that cannot happen; at
 * the edges — a prop read from a URL, a config file, a JavaScript caller — it
 * happens routinely, and it used to reach `spec.ownsPanels` and throw from
 * inside the validator. This is the check that keeps that at the boundary.
 */
describe("isSemanticMode", () => {
  it.each(["tabs", "nav", "radiogroup", "steps"])("accepts %s", (mode) => {
    expect(isSemanticMode(mode)).toBe(true);
    // And the acceptance is worth something: every accepted value resolves.
    expect(rolesFor(mode as Parameters<typeof rolesFor>[0])).toBeDefined();
  });

  it.each([
    // The ARIA role, and by far the most likely wrong answer — the component is
    // a tablist, so "tablist" is what a caller reaches for.
    "tablist",
    "tab",
    "tabpanel",
    "menu",
    "list",
    "Tabs",
    "TABS",
    " tabs",
    "tabs ",
    "",
  ])("rejects %o", (mode) => {
    expect(isSemanticMode(mode)).toBe(false);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["a number", 0],
    ["an object", {}],
    ["an array", ["tabs"]],
    ["a boolean", true],
  ])("rejects %s", (_label, mode) => {
    expect(isSemanticMode(mode)).toBe(false);
  });

  /*
   * `Object.hasOwn`, not `in`: `"toString" in SPECS` is true through the
   * prototype chain, and a mode called "constructor" would otherwise resolve to
   * a function and fail somewhere much further downstream.
   */
  it.each(["toString", "constructor", "hasOwnProperty", "__proto__", "valueOf"])(
    "rejects %s, which the prototype chain would otherwise answer for",
    (mode) => {
      expect(isSemanticMode(mode)).toBe(false);
    },
  );
});

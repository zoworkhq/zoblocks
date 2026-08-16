/**
 * The semantic-mode mapping.
 *
 * These assertions look tautological until you remember what they encode: the
 * exact set of differences between four components that share one silhouette.
 * A change here is a change to what a screen reader says.
 */

import { describe, expect, it } from "vitest";
import { ariaOrientation, disabledProps, rolesFor } from "../src/index.js";

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

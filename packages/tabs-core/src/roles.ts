/**
 * The semantic mode → accessibility tree mapping.
 *
 * This is the whole point of the component. A `role="tablist"` wrapped around
 * anchors that change the URL is the most common tab defect in production: the
 * screen reader announces "tab, 2 of 5", the user presses ArrowRight expecting
 * to preview the next panel, the page navigates, and their focus is destroyed.
 * Every individual attribute is spelled correctly, so no automated checker
 * catches it.
 *
 * Keeping the mapping in one table — rather than scattered `mode === "nav"`
 * checks through the render — is what makes it reviewable.
 */

import type { Orientation, SemanticMode } from "./types.js";

export interface RoleSpec {
  /** Role for the container. `null` means "use a real <nav>, no role". */
  listRole: "tablist" | "radiogroup" | null;
  /** Element the container should render as. */
  listElement: "div" | "nav";
  triggerRole: "tab" | "radio" | null;
  triggerElement: "button" | "a";
  /** Attribute that carries selection. */
  selectedAttr: "aria-selected" | "aria-checked" | "aria-current";
  /** Value written to {@link selectedAttr} when selected. */
  selectedValue: "true" | "page";
  /** Whether arrow keys move selection within the group. */
  arrowKeys: boolean;
  /** Whether exactly one trigger is in the tab order (roving tabindex). */
  roving: boolean;
  /** Whether the component owns `role="tabpanel"` panels. */
  ownsPanels: boolean;
  /** Whether selection is a form value that belongs in a Form.Item. */
  formValue: boolean;
  /** Whether selection may be vetoed before it happens. */
  gateable: boolean;
}

const TABS: RoleSpec = {
  listRole: "tablist",
  listElement: "div",
  triggerRole: "tab",
  triggerElement: "button",
  selectedAttr: "aria-selected",
  selectedValue: "true",
  arrowKeys: true,
  roving: true,
  ownsPanels: true,
  formValue: false,
  gateable: true,
};

const SPECS: Record<SemanticMode, RoleSpec> = {
  tabs: TABS,

  // Steps are tabs whose order is meaningful and whose forward moves are
  // earned. The tree is identical; the gate is always on.
  steps: { ...TABS },

  nav: {
    listRole: null,
    listElement: "nav",
    triggerRole: null,
    triggerElement: "a",
    selectedAttr: "aria-current",
    selectedValue: "page",
    // Deliberately false. Hijacking arrows on a list of links breaks the
    // browser behaviour users already have, and there is no panel to preview.
    arrowKeys: false,
    roving: false,
    ownsPanels: false,
    formValue: false,
    // The router owns the guard, not the component.
    gateable: false,
  },

  radiogroup: {
    listRole: "radiogroup",
    listElement: "div",
    triggerRole: "radio",
    triggerElement: "button",
    selectedAttr: "aria-checked",
    selectedValue: "true",
    arrowKeys: true,
    roving: true,
    ownsPanels: false,
    formValue: true,
    gateable: true,
  },
};

export function rolesFor(mode: SemanticMode): RoleSpec {
  return SPECS[mode];
}

/**
 * `aria-orientation` is only meaningful where arrow keys exist, and setting it
 * without also swapping the key axis is a lie to the screen reader — the
 * single most common vertical-tabs bug. Both come from here so they cannot
 * drift apart.
 */
export function ariaOrientation(
  mode: SemanticMode,
  orientation: Orientation,
): Orientation | undefined {
  return rolesFor(mode).arrowKeys ? orientation : undefined;
}

/**
 * A trigger is never given the `disabled` attribute.
 *
 * `disabled` removes it from the accessibility tree and the tab order, so a
 * keyboard user cannot discover that the section exists. `aria-disabled` keeps
 * it focusable and announceable, which is the difference between "this record
 * has no behavioural health section" and "this record has one and you may not
 * open it".
 */
export function disabledProps(disabled: boolean | undefined, reasonId?: string) {
  if (!disabled) return {};
  return reasonId
    ? { "aria-disabled": true as const, "aria-describedby": reasonId }
    : { "aria-disabled": true as const };
}

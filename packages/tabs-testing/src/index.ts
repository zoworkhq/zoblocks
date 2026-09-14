/**
 * @zoblocks/tabs-testing — assertions that read the accessibility tree.
 *
 * These exist because the defects that matter in a tab strip are not visual.
 * A snapshot test passes happily on a `role="tablist"` full of anchors, on a
 * strip where every trigger is `tabindex="-1"`, and on an `aria-controls` that
 * points at nothing. Each of those is a control that looks finished and is
 * unusable, and each has a one-line assertion here.
 *
 *     import { expectTabsContract } from "@zoblocks/tabs-testing";
 *
 *     render(<Tabs as="tabs" … />);
 *     expectTabsContract(screen.getByRole("tablist"));
 *
 * Framework-agnostic: it takes DOM elements and throws `Error` on failure, so
 * it works under Vitest, Jest, Playwright or a bare script. It deliberately
 * does not depend on `@zoblocks/tabs` — the point is to be able to hold
 * *any* implementation to the contract, including one a customer wrote.
 */

const TAB_ROLES = new Set(["tab", "radio"]);

function fail(message: string): never {
  throw new Error(`[tabs-testing] ${message}`);
}

function triggersOf(list: Element): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>("[role='tab'], [role='radio']"));
}

function nameOf(element: Element): string {
  return (
    element.getAttribute("aria-label") ??
    element.textContent?.trim() ??
    element.getAttribute("id") ??
    "<unnamed>"
  );
}

/**
 * Exactly one trigger is in the tab order.
 *
 * Two stops means `Tab` walks the strip instead of leaving it. Zero means the
 * strip cannot be reached by keyboard at all — the more common failure, and
 * the one that survives every visual check.
 */
export function expectSingleTabStop(list: Element): void {
  const triggers = triggersOf(list);
  if (triggers.length === 0) fail("the list contains no tabs or radios.");

  const stops = triggers.filter((trigger) => trigger.getAttribute("tabindex") === "0");
  if (stops.length === 1) return;

  if (stops.length === 0) {
    fail(
      `no trigger has tabindex="0", so the group is unreachable by keyboard. Names: ${triggers
        .map(nameOf)
        .join(", ")}`,
    );
  }
  fail(
    `${stops.length} triggers have tabindex="0" (${stops
      .map(nameOf)
      .join(", ")}). Exactly one should, so Tab enters the group and then leaves it.`,
  );
}

/** The tab order stop is the selected trigger, not an arbitrary one. */
export function expectRovingOrder(list: Element): void {
  expectSingleTabStop(list);
  const triggers = triggersOf(list);
  const stop = triggers.find((trigger) => trigger.getAttribute("tabindex") === "0");
  const selected = triggers.find(
    (trigger) =>
      trigger.getAttribute("aria-selected") === "true" ||
      trigger.getAttribute("aria-checked") === "true",
  );
  if (!selected) return; // Nothing selected yet: the fallback stop is correct.
  if (stop !== selected) {
    fail(
      `the tab stop is "${nameOf(stop as Element)}" but the selected trigger is "${nameOf(
        selected,
      )}". Tab should land on the selected one.`,
    );
  }
}

/** Exactly one trigger is marked selected. */
export function expectSingleSelection(list: Element): void {
  const triggers = triggersOf(list);
  const selected = triggers.filter(
    (trigger) =>
      trigger.getAttribute("aria-selected") === "true" ||
      trigger.getAttribute("aria-checked") === "true",
  );
  if (selected.length !== 1) {
    fail(
      `${selected.length} triggers are marked selected; exactly one should be. Names: ${selected
        .map(nameOf)
        .join(", ")}`,
    );
  }
}

/**
 * Every `aria-controls` resolves, and the panel points back.
 *
 * A dangling `aria-controls` is invalid ARIA and silently untestable any other
 * way — the attribute is present and spelled correctly, it just references an
 * element that is not there.
 */
export function expectPanelWiring(container: ParentNode = document): void {
  const triggers = Array.from(container.querySelectorAll<HTMLElement>("[role='tab']"));
  for (const trigger of triggers) {
    const id = trigger.getAttribute("aria-controls");
    if (!id) continue;
    const panel = (container as Document).getElementById?.(id) ?? document.getElementById(id);
    if (!panel) {
      fail(
        `tab "${nameOf(trigger)}" has aria-controls="${id}", but no element with that id exists.`,
      );
    }
    if (panel.getAttribute("role") !== "tabpanel") {
      fail(`tab "${nameOf(trigger)}" controls #${id}, which is not a tabpanel.`);
    }
    const labelledBy = panel.getAttribute("aria-labelledby");
    if (labelledBy && trigger.id && labelledBy !== trigger.id) {
      fail(
        `panel #${id} is labelled by "${labelledBy}" but is controlled by "${trigger.id}". They should be the same tab.`,
      );
    }
  }
}

/**
 * No interactive element inside a trigger.
 *
 * A close button nested in a `role="tab"` is invalid ARIA; assistive
 * technology resolves it by flattening the tab or skipping the button, and
 * either way the user loses one of the two controls.
 */
export function expectNoNestedInteractive(list: Element): void {
  const selector =
    "a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1']),[role='button'],[role='link'],[role='menuitem'],[role='checkbox']";
  for (const trigger of triggersOf(list)) {
    const nested = Array.from(trigger.querySelectorAll(selector)).filter(
      (element) => element.getAttribute("aria-hidden") !== "true",
    );
    if (nested.length > 0) {
      fail(
        `trigger "${nameOf(trigger)}" contains ${nested.length} interactive element(s) — invalid inside a tab. The keyboard path for a closable tab is Delete on the tab itself.`,
      );
    }
  }
}

/**
 * A tablist owns only tabs.
 *
 * An add button or an overflow trigger inside the list fails
 * `aria-required-children` and, worse, corrupts the "n of m" position a screen
 * reader announces.
 */
export function expectOnlyTabsInList(list: Element): void {
  const role = list.getAttribute("role");
  if (role !== "tablist" && role !== "radiogroup") return;
  const expected = role === "tablist" ? "tab" : "radio";

  for (const child of Array.from(list.children)) {
    if (child.getAttribute("aria-hidden") === "true") continue;
    const childRole = child.getAttribute("role");
    if (childRole === expected) continue;
    if (childRole === "presentation" || childRole === "none") continue;
    // A bare decorative element with no role and no content is the indicator.
    if (!childRole && child.children.length === 0 && !child.textContent?.trim()) continue;
    fail(
      `a ${role} contains <${child.tagName.toLowerCase()}${
        childRole ? ` role="${childRole}"` : ""
      }>, which is not a ${expected}. Non-tab controls belong beside the list, not inside it.`,
    );
  }
}

/**
 * The text an id-reference attribute points at.
 *
 * `aria-labelledby` and `aria-describedby` take a space-separated list, so
 * `"title count"` is two ids, not one that never matches.
 */
function textOfIds(ids: string | null): string {
  if (!ids) return "";
  return ids
    .trim()
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ")
    .trim();
}

/** The list has an accessible name. */
export function expectNamedList(list: Element): void {
  const label = list.getAttribute("aria-label");
  if (label?.trim()) return;
  if (textOfIds(list.getAttribute("aria-labelledby"))) return;
  fail(
    'the list has no accessible name, so it is announced as "tab list" and nothing else. Give it aria-label.',
  );
}

/**
 * A disabled trigger says why, and stays discoverable.
 *
 * The `disabled` attribute removes it from the accessibility tree entirely, so
 * a keyboard user cannot learn the section exists — which in a clinical record
 * is a different fact from "restricted".
 */
export function expectDiscoverableDisabled(list: Element): void {
  for (const trigger of triggersOf(list)) {
    if (trigger.hasAttribute("disabled")) {
      fail(
        `trigger "${nameOf(trigger)}" uses the disabled attribute. Use aria-disabled, so it stays focusable and announceable.`,
      );
    }
    if (trigger.getAttribute("aria-disabled") !== "true") continue;
    if (!textOfIds(trigger.getAttribute("aria-describedby"))) {
      fail(
        `trigger "${nameOf(trigger)}" is aria-disabled with no reason. A control that refuses without saying why is indistinguishable from one that is broken.`,
      );
    }
  }
}

export interface TabsContractOptions {
  /** Skip the panel check for a strip that legitimately owns none. */
  panels?: boolean;
  /** Root to resolve ids against. Defaults to `document`. */
  container?: ParentNode;
}

/**
 * Every assertion above, in one call.
 *
 * This is the one to reach for. The individual exports exist for the cases
 * where a host knowingly deviates on one point and wants the other seven.
 */
export function expectTabsContract(list: Element, options: TabsContractOptions = {}): void {
  const { panels = true, container = document } = options;
  expectNamedList(list);
  expectOnlyTabsInList(list);
  expectSingleSelection(list);
  expectRovingOrder(list);
  expectNoNestedInteractive(list);
  expectDiscoverableDisabled(list);
  if (panels) expectPanelWiring(container);
}

/**
 * A quick description of a strip, for a failure message or a debug log.
 *
 * Prints what a screen reader would work from, not what the DOM looks like —
 * which is usually the fastest way to see that the two have diverged.
 */
export function describeTabs(list: Element): string {
  const triggers = triggersOf(list);
  const role = list.getAttribute("role") ?? list.tagName.toLowerCase();
  const lines = triggers.map((trigger, index) => {
    const selected =
      trigger.getAttribute("aria-selected") === "true" ||
      trigger.getAttribute("aria-checked") === "true";
    const disabled = trigger.getAttribute("aria-disabled") === "true";
    const stop = trigger.getAttribute("tabindex") === "0";
    return `  ${index + 1}. ${nameOf(trigger)}${selected ? " [selected]" : ""}${
      disabled ? " [disabled]" : ""
    }${stop ? " [tab stop]" : ""}`;
  });
  return `${role} "${list.getAttribute("aria-label") ?? ""}" — ${triggers.length} item(s)\n${lines.join("\n")}`;
}

export { TAB_ROLES };

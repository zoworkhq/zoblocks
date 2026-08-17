/**
 * The assertions, held to their own standard.
 *
 * Each one is tested twice: against a strip that satisfies the contract, and
 * against the specific malformed strip it exists to catch. The second half is
 * the point — an assertion that never fires is worse than no assertion,
 * because it reads as coverage.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  describeTabs,
  expectDiscoverableDisabled,
  expectNamedList,
  expectNoNestedInteractive,
  expectOnlyTabsInList,
  expectPanelWiring,
  expectRovingOrder,
  expectSingleSelection,
  expectSingleTabStop,
  expectTabsContract,
} from "../src/index.js";

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = "";
});

const GOOD = `
  <div>
    <div role="tablist" aria-label="Chart sections">
      <button role="tab" id="t1" aria-controls="p1" aria-selected="true" tabindex="0">Summary</button>
      <button role="tab" id="t2" aria-controls="p2" aria-selected="false" tabindex="-1">Labs</button>
    </div>
    <div role="tabpanel" id="p1" aria-labelledby="t1">Summary</div>
    <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>Labs</div>
  </div>`;

function goodList(): Element {
  mount(GOOD);
  return document.querySelector("[role='tablist']") as Element;
}

describe("expectSingleTabStop", () => {
  it("passes a correct strip", () => {
    expect(() => expectSingleTabStop(goodList())).not.toThrow();
  });

  it("catches a strip with no tab stop at all", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="-1">A</button>
        <button role="tab" aria-selected="false" tabindex="-1">B</button>
      </div>`);
    // The failure that survives every visual check: the strip renders
    // perfectly and cannot be reached by keyboard.
    expect(() => expectSingleTabStop(list)).toThrow(/unreachable by keyboard/);
  });

  it("catches two tab stops", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button role="tab" aria-selected="false" tabindex="0">B</button>
      </div>`);
    expect(() => expectSingleTabStop(list)).toThrow(/2 triggers have tabindex/);
  });

  it("catches an empty list", () => {
    const list = mount(`<div role="tablist" aria-label="Chart"></div>`);
    expect(() => expectSingleTabStop(list)).toThrow(/no tabs or radios/);
  });

  it("works for a radiogroup too", () => {
    const list = mount(`
      <div role="radiogroup" aria-label="Range">
        <button role="radio" aria-checked="true" tabindex="0">7d</button>
        <button role="radio" aria-checked="false" tabindex="-1">30d</button>
      </div>`);
    expect(() => expectSingleTabStop(list)).not.toThrow();
  });
});

describe("expectRovingOrder", () => {
  it("passes when the stop is the selected trigger", () => {
    expect(() => expectRovingOrder(goodList())).not.toThrow();
  });

  it("catches a stop parked on the wrong trigger", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="false" tabindex="0">A</button>
        <button role="tab" aria-selected="true" tabindex="-1">B</button>
      </div>`);
    // Tab would land on A and then arrow away from B — the selection and the
    // entry point disagreeing is disorienting in a way nothing else reveals.
    expect(() => expectRovingOrder(list)).toThrow(
      /tab stop is "A" but the selected trigger is "B"/,
    );
  });

  it("tolerates nothing selected yet", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="false" tabindex="0">A</button>
        <button role="tab" aria-selected="false" tabindex="-1">B</button>
      </div>`);
    expect(() => expectRovingOrder(list)).not.toThrow();
  });
});

describe("expectSingleSelection", () => {
  it("passes one selected trigger", () => {
    expect(() => expectSingleSelection(goodList())).not.toThrow();
  });

  it("catches two", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button role="tab" aria-selected="true" tabindex="-1">B</button>
      </div>`);
    expect(() => expectSingleSelection(list)).toThrow(/2 triggers are marked selected/);
  });

  it("catches none", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="false" tabindex="0">A</button>
      </div>`);
    expect(() => expectSingleSelection(list)).toThrow(/0 triggers are marked selected/);
  });
});

describe("expectPanelWiring", () => {
  it("passes a wired pair", () => {
    goodList();
    expect(() => expectPanelWiring()).not.toThrow();
  });

  it("catches a dangling aria-controls", () => {
    mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" id="t1" aria-controls="nowhere" aria-selected="true" tabindex="0">A</button>
      </div>`);
    // Present, spelled correctly, and pointing at nothing.
    expect(() => expectPanelWiring()).toThrow(/no element with that id exists/);
  });

  it("catches a target that is not a tabpanel", () => {
    mount(`
      <div>
        <div role="tablist" aria-label="Chart">
          <button role="tab" id="t1" aria-controls="p1" aria-selected="true" tabindex="0">A</button>
        </div>
        <div id="p1">not a panel</div>
      </div>`);
    expect(() => expectPanelWiring()).toThrow(/which is not a tabpanel/);
  });

  it("catches a panel labelled by a different tab", () => {
    mount(`
      <div>
        <div role="tablist" aria-label="Chart">
          <button role="tab" id="t1" aria-controls="p1" aria-selected="true" tabindex="0">A</button>
        </div>
        <div role="tabpanel" id="p1" aria-labelledby="somebody-else">A</div>
      </div>`);
    expect(() => expectPanelWiring()).toThrow(/should be the same tab/);
  });

  it("ignores a strip that owns no panels", () => {
    mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
      </div>`);
    expect(() => expectPanelWiring()).not.toThrow();
  });
});

describe("expectNoNestedInteractive", () => {
  it("passes a plain trigger", () => {
    expect(() => expectNoNestedInteractive(goodList())).not.toThrow();
  });

  it("catches a close button nested in a tab", () => {
    // A div with role="tab", which is what a hand-rolled tablist looks like —
    // and the only way the nesting survives parsing at all, since a <button>
    // inside a <button> is hoisted out by the HTML parser.
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <div role="tab" aria-selected="true" tabindex="0">
          Note A <button aria-label="Close">×</button>
        </div>
      </div>`);
    expect(() => expectNoNestedInteractive(list)).toThrow(/interactive element/);
  });

  it("catches role=button on a span, which is the same mistake in disguise", () => {
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <button role="tab" aria-selected="true" tabindex="0">
          Note A <span role="button" tabindex="-1">×</span>
        </button>
      </div>`);
    expect(() => expectNoNestedInteractive(list)).toThrow(/interactive element/);
  });

  it("allows an aria-hidden pointer affordance", () => {
    // The shipped pattern: visible to a mouse, absent from the tree, and the
    // keyboard path is Delete on the tab.
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <button role="tab" aria-selected="true" tabindex="0">
          Note A <span aria-hidden="true">×</span>
        </button>
      </div>`);
    expect(() => expectNoNestedInteractive(list)).not.toThrow();
  });
});

describe("expectOnlyTabsInList", () => {
  it("passes a clean tablist", () => {
    expect(() => expectOnlyTabsInList(goodList())).not.toThrow();
  });

  it("catches an add button inside the list", () => {
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button type="button" aria-label="New tab">+</button>
      </div>`);
    expect(() => expectOnlyTabsInList(list)).toThrow(/is not a tab/);
  });

  it("allows a decorative indicator element", () => {
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <span></span>
        <button role="tab" aria-selected="true" tabindex="0">A</button>
      </div>`);
    expect(() => expectOnlyTabsInList(list)).not.toThrow();
  });

  it("allows role=presentation", () => {
    const list = mount(`
      <div role="tablist" aria-label="Notes">
        <div role="presentation">Group</div>
        <button role="tab" aria-selected="true" tabindex="0">A</button>
      </div>`);
    expect(() => expectOnlyTabsInList(list)).not.toThrow();
  });

  it("says nothing about a nav, which has no such constraint", () => {
    const list = mount(`<nav aria-label="Settings"><a href="/a">A</a></nav>`);
    expect(() => expectOnlyTabsInList(list)).not.toThrow();
  });
});

describe("expectNamedList", () => {
  it("passes an aria-label", () => {
    expect(() => expectNamedList(goodList())).not.toThrow();
  });

  it("catches an unnamed list", () => {
    const list = mount(`<div role="tablist"><button role="tab" tabindex="0">A</button></div>`);
    expect(() => expectNamedList(list)).toThrow(/no accessible name/);
  });

  it("accepts aria-labelledby", () => {
    mount(`
      <div>
        <h2 id="h">Chart sections</h2>
        <div role="tablist" aria-labelledby="h"><button role="tab" tabindex="0">A</button></div>
      </div>`);
    const list = document.querySelector("[role='tablist']") as Element;
    expect(() => expectNamedList(list)).not.toThrow();
  });
});

describe("expectDiscoverableDisabled", () => {
  it("passes a disabled trigger that explains itself", () => {
    mount(`
      <div>
        <div role="tablist" aria-label="Chart">
          <button role="tab" aria-selected="true" tabindex="0">A</button>
          <button role="tab" aria-selected="false" tabindex="-1"
                  aria-disabled="true" aria-describedby="why">B</button>
        </div>
        <span id="why">Restricted — request access</span>
      </div>`);
    const list = document.querySelector("[role='tablist']") as Element;
    expect(() => expectDiscoverableDisabled(list)).not.toThrow();
  });

  it("catches the disabled attribute, which hides the tab entirely", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button role="tab" disabled>B</button>
      </div>`);
    expect(() => expectDiscoverableDisabled(list)).toThrow(/uses the disabled attribute/);
  });

  it("catches a refusal with no reason", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button role="tab" aria-disabled="true" tabindex="-1">B</button>
      </div>`);
    expect(() => expectDiscoverableDisabled(list)).toThrow(/no reason/);
  });
});

describe("expectTabsContract", () => {
  it("passes a correct strip", () => {
    expect(() => expectTabsContract(goodList())).not.toThrow();
  });

  it("can skip the panel check for a strip that owns none", () => {
    const list = mount(`
      <div role="radiogroup" aria-label="Range">
        <button role="radio" aria-checked="true" tabindex="0">7d</button>
      </div>`);
    expect(() => expectTabsContract(list, { panels: false })).not.toThrow();
  });

  it("reports the first violation it finds", () => {
    const list = mount(`
      <div role="tablist">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
      </div>`);
    expect(() => expectTabsContract(list)).toThrow(/no accessible name/);
  });
});

describe("describeTabs", () => {
  it("prints what a screen reader would work from", () => {
    const text = describeTabs(goodList());
    expect(text).toContain('tablist "Chart sections" — 2 item(s)');
    expect(text).toContain("Summary [selected] [tab stop]");
    expect(text).toContain("2. Labs");
  });

  it("marks a disabled trigger", () => {
    const list = mount(`
      <div role="tablist" aria-label="Chart">
        <button role="tab" aria-selected="true" tabindex="0">A</button>
        <button role="tab" aria-disabled="true" tabindex="-1">B</button>
      </div>`);
    expect(describeTabs(list)).toContain("B [disabled]");
  });
});

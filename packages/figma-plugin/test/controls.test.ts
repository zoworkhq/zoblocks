/**
 * The half a keyboard has to be able to operate.
 *
 * Everything here is a browser control with a real label, which is a decision
 * worth testing precisely because the alternative is so easy: a plugin panel is
 * 380 pixels wide and the temptation to build a compact segmented bar out of
 * divs is real. A `<select>` and a `<fieldset>` of radios come with focus,
 * arrow keys, announcement and the platform's own conventions already correct.
 */

import { beforeEach, describe, expect, it } from "vitest";

import { renderControls } from "../src/ui/controls";
import type { Choice } from "../src/ui/controls";
import type { CollectionSummary } from "../src/protocol";

const ZOBLOCKS: CollectionSummary = {
  id: "c1",
  name: "Zoblocks / Semantic",
  modes: ["light", "dark", "high-contrast"],
  stamped: 26,
  colours: 26,
};

const SWATCHES: CollectionSummary = {
  id: "c2",
  name: "Swatches",
  modes: ["Mode 1"],
  stamped: 0,
  colours: 3,
};

let root: HTMLElement;
let changes: Choice[];

beforeEach(() => {
  document.body.textContent = "";
  root = document.createElement("div");
  document.body.append(root);
  changes = [];
});

function draw(collections: CollectionSummary[], value: Choice, grounds: string[] = []) {
  renderControls(root, {
    collections,
    grounds,
    value,
    onChange: (choice) => changes.push(choice),
  });
}

const zoblocksChoice: Choice = { collection: ZOBLOCKS.name, mode: "light", kind: "text" };
const paletteChoice: Choice = { collection: SWATCHES.name, mode: "Mode 1", kind: "text" };

describe("the collection picker", () => {
  it("labels every control", () => {
    draw([ZOBLOCKS], zoblocksChoice);
    for (const select of root.querySelectorAll("select")) {
      const label = root.querySelector(`label[for="${select.id}"]`);
      expect(label, select.id).not.toBeNull();
      expect(label!.textContent).toBeTruthy();
    }
  });

  it("states the counts that decide which reading a collection can get", () => {
    draw([ZOBLOCKS, SWATCHES], zoblocksChoice);
    const options = [...root.querySelectorAll("#collection option")].map((o) => o.textContent);
    expect(options[0]).toContain("26 colours, 26 Zoblocks");
    expect(options[1]).toContain("3 colours, 0 Zoblocks");
  });

  it("offers the modes the chosen collection actually has", () => {
    draw([ZOBLOCKS, SWATCHES], zoblocksChoice);
    const modes = [...root.querySelectorAll("#mode option")].map((o) => o.textContent);
    expect(modes).toEqual(["light", "dark", "high-contrast"]);
  });

  it("reports a change as a whole choice, not a field", () => {
    draw([ZOBLOCKS, SWATCHES], zoblocksChoice);
    const select = root.querySelector<HTMLSelectElement>("#collection")!;
    select.value = SWATCHES.name;
    select.dispatchEvent(new Event("change"));
    expect(changes).toEqual([{ collection: SWATCHES.name, mode: "light", kind: "text" }]);
  });
});

describe("what a palette reading needs and a Zoblocks reading does not", () => {
  it("asks for a ground only when the pairs are unknown", () => {
    draw([ZOBLOCKS], zoblocksChoice);
    expect(root.querySelector("#ground")).toBeNull();
    expect(root.querySelector("fieldset.kinds")).toBeNull();

    draw([SWATCHES], paletteChoice, ["Paper", "Ink"]);
    expect(root.querySelector("#ground")).not.toBeNull();
  });

  it("asks which rule applies rather than choosing one", () => {
    draw([SWATCHES], paletteChoice, ["Paper", "Ink"]);
    const fieldset = root.querySelector("fieldset.kinds")!;
    expect(fieldset.querySelector("legend")!.textContent).toBeTruthy();

    const radios = [...fieldset.querySelectorAll<HTMLInputElement>("input[type=radio]")];
    expect(radios.map((r) => r.value)).toEqual(["text", "ui"]);
    // Text is preselected: it is the stricter of the two, so the error a
    // default can cause is in the safe direction.
    expect(radios[0]!.checked).toBe(true);
    expect(fieldset.textContent).toContain("4.5:1 — SC 1.4.3");
    expect(fieldset.textContent).toContain("3:1 — SC 1.4.11");
  });

  it("groups the radios so they are one control to a keyboard", () => {
    draw([SWATCHES], paletteChoice, ["Paper", "Ink"]);
    const names = new Set(
      [...root.querySelectorAll<HTMLInputElement>("input[type=radio]")].map((r) => r.name),
    );
    expect(names.size).toBe(1);
  });

  it("reports the chosen rule", () => {
    draw([SWATCHES], paletteChoice, ["Paper", "Ink"]);
    const ui = root.querySelector<HTMLInputElement>("input[value='ui']")!;
    ui.checked = true;
    ui.dispatchEvent(new Event("change"));
    expect(changes).toEqual([{ ...paletteChoice, kind: "ui" }]);
  });
});

describe("nothing to measure", () => {
  it("says the file has no collections rather than rendering an empty picker", () => {
    draw([], { collection: "", mode: "", kind: "text" });
    expect(root.querySelector("select")).toBeNull();
    expect(root.textContent).toContain("no local variable collections");
  });

  it("falls back to the first collection when the chosen one is gone", () => {
    draw([SWATCHES], zoblocksChoice, ["Paper"]);
    const select = root.querySelector<HTMLSelectElement>("#collection")!;
    expect(select.value).toBe(SWATCHES.name);
  });
});

describe("the ground picker with nothing to pick from", () => {
  it("renders empty rather than throwing when the report has not arrived", () => {
    // The first paint after choosing a palette collection: the panel knows the
    // collection has no Zoblocks stamps but has not been told its colour names
    // yet, so the list is briefly empty.
    draw([SWATCHES], paletteChoice, []);
    const ground = root.querySelector<HTMLSelectElement>("#ground")!;
    expect(ground.options).toHaveLength(0);
    expect(ground.value).toBe("");
  });

  it("keeps the ground the caller chose over the first in the list", () => {
    draw([SWATCHES], { ...paletteChoice, ground: "Ink" }, ["Paper", "Ink"]);
    expect(root.querySelector<HTMLSelectElement>("#ground")!.value).toBe("Ink");
  });

  it("reports the chosen ground", () => {
    draw([SWATCHES], paletteChoice, ["Paper", "Ink"]);
    const ground = root.querySelector<HTMLSelectElement>("#ground")!;
    ground.value = "Ink";
    ground.dispatchEvent(new Event("change"));
    expect(changes).toEqual([{ ...paletteChoice, ground: "Ink" }]);
  });

  it("reports a mode change", () => {
    draw([ZOBLOCKS], zoblocksChoice);
    const mode = root.querySelector<HTMLSelectElement>("#mode")!;
    mode.value = "dark";
    mode.dispatchEvent(new Event("change"));
    expect(changes).toEqual([{ ...zoblocksChoice, mode: "dark" }]);
  });
});

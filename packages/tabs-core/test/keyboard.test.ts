/**
 * The keyboard model.
 *
 * This is the file that would catch a regression in the behaviour a
 * screen-reader user actually experiences, so it is deliberately exhaustive
 * about the axes that interact: orientation × direction × wrapping ×
 * disabled-but-present.
 */

import { describe, expect, it } from "vitest";
import {
  focusAfterClose,
  isTypeaheadKey,
  keyToIntent,
  matchTypeahead,
  reorderIntent,
  rovingTabIndex,
  tabStopIndex,
  textOf,
  Typeahead,
  type TabItem,
} from "../src/index.js";

const items: TabItem[] = [
  { value: "summary", label: "Summary" },
  { value: "vitals", label: "Vitals" },
  { value: "labs", label: "Labs" },
  { value: "meds", label: "Medications" },
];

const horizontal = { orientation: "horizontal" } as const;
const vertical = { orientation: "vertical" } as const;

describe("keyToIntent — horizontal", () => {
  it("ArrowRight moves forward", () => {
    expect(keyToIntent("ArrowRight", items, 0, horizontal)).toEqual({ kind: "move", index: 1 });
  });

  it("ArrowLeft moves backward", () => {
    expect(keyToIntent("ArrowLeft", items, 2, horizontal)).toEqual({ kind: "move", index: 1 });
  });

  it("wraps at the end", () => {
    expect(keyToIntent("ArrowRight", items, 3, horizontal)).toEqual({ kind: "move", index: 0 });
  });

  it("wraps at the start", () => {
    expect(keyToIntent("ArrowLeft", items, 0, horizontal)).toEqual({ kind: "move", index: 3 });
  });

  it("does not wrap when loop is off", () => {
    expect(keyToIntent("ArrowRight", items, 3, { ...horizontal, loop: false })).toEqual({
      kind: "none",
    });
    expect(keyToIntent("ArrowLeft", items, 0, { ...horizontal, loop: false })).toEqual({
      kind: "none",
    });
  });

  it("ignores the vertical axis", () => {
    expect(keyToIntent("ArrowDown", items, 0, horizontal)).toEqual({ kind: "none" });
    expect(keyToIntent("ArrowUp", items, 1, horizontal)).toEqual({ kind: "none" });
  });
});

describe("keyToIntent — vertical", () => {
  it("uses ArrowDown/ArrowUp", () => {
    expect(keyToIntent("ArrowDown", items, 0, vertical)).toEqual({ kind: "move", index: 1 });
    expect(keyToIntent("ArrowUp", items, 1, vertical)).toEqual({ kind: "move", index: 0 });
  });

  it("ignores the inline axis, so a vertical rail does not answer to Left/Right", () => {
    expect(keyToIntent("ArrowRight", items, 0, vertical)).toEqual({ kind: "none" });
    expect(keyToIntent("ArrowLeft", items, 1, vertical)).toEqual({ kind: "none" });
  });

  it("does not swap for RTL — block direction does not flip with `direction`", () => {
    expect(keyToIntent("ArrowDown", items, 0, { ...vertical, rtl: true })).toEqual({
      kind: "move",
      index: 1,
    });
  });
});

describe("keyToIntent — RTL", () => {
  it("swaps the inline arrows so ArrowLeft advances", () => {
    expect(keyToIntent("ArrowLeft", items, 0, { ...horizontal, rtl: true })).toEqual({
      kind: "move",
      index: 1,
    });
    expect(keyToIntent("ArrowRight", items, 1, { ...horizontal, rtl: true })).toEqual({
      kind: "move",
      index: 0,
    });
  });
});

describe("keyToIntent — Home, End, activation and close", () => {
  it("Home goes to the first item", () => {
    expect(keyToIntent("Home", items, 3, horizontal)).toEqual({ kind: "move", index: 0 });
  });

  it("End goes to the last item", () => {
    expect(keyToIntent("End", items, 0, horizontal)).toEqual({ kind: "move", index: 3 });
  });

  it("Enter and Space activate", () => {
    expect(keyToIntent("Enter", items, 1, horizontal)).toEqual({ kind: "activate" });
    expect(keyToIntent(" ", items, 1, horizontal)).toEqual({ kind: "activate" });
    // Older engines report the legacy name.
    expect(keyToIntent("Spacebar", items, 1, horizontal)).toEqual({ kind: "activate" });
  });

  it("Delete and Backspace request a close", () => {
    expect(keyToIntent("Delete", items, 1, horizontal)).toEqual({ kind: "close" });
    expect(keyToIntent("Backspace", items, 1, horizontal)).toEqual({ kind: "close" });
  });

  it("returns none for an unrelated key", () => {
    expect(keyToIntent("F5", items, 1, horizontal)).toEqual({ kind: "none" });
  });

  it("returns none for an empty list", () => {
    expect(keyToIntent("ArrowRight", [], 0, horizontal)).toEqual({ kind: "none" });
    expect(keyToIntent("Home", [], 0, horizontal)).toEqual({ kind: "none" });
  });
});

describe("keyToIntent — disabled items stay reachable", () => {
  // The whole reason the component uses aria-disabled rather than the
  // `disabled` attribute: a keyboard user must be able to discover that a
  // restricted section exists.
  const withDisabled: TabItem[] = [
    { value: "a", label: "A" },
    { value: "b", label: "B", disabled: true, disabledReason: "Restricted" },
    { value: "c", label: "C" },
  ];

  it("arrows land on a disabled tab rather than skipping it", () => {
    expect(keyToIntent("ArrowRight", withDisabled, 0, horizontal)).toEqual({
      kind: "move",
      index: 1,
    });
  });

  it("End can land on a disabled last tab", () => {
    const trailing: TabItem[] = [
      { value: "a", label: "A" },
      { value: "b", label: "B", disabled: true, disabledReason: "Restricted" },
    ];
    expect(keyToIntent("End", trailing, 0, horizontal)).toEqual({ kind: "move", index: 1 });
  });
});

describe("typeahead", () => {
  it("buffers within the timeout and resets after it", () => {
    const buffer = new Typeahead(600);
    expect(buffer.push("l", 1000)).toBe("l");
    expect(buffer.push("a", 1200)).toBe("la");
    // Past the window: the buffer starts again rather than accumulating.
    expect(buffer.push("m", 3000)).toBe("m");
  });

  it("lowercases input so matching is case-insensitive", () => {
    const buffer = new Typeahead();
    expect(buffer.push("L", 0)).toBe("l");
  });

  it("can be reset explicitly", () => {
    const buffer = new Typeahead();
    buffer.push("l", 0);
    buffer.reset();
    expect(buffer.value).toBe("");
  });

  it("a single character searches from the next item, so repeats cycle", () => {
    const repeated: TabItem[] = [
      { value: "l1", label: "Labs" },
      { value: "l2", label: "Ledger" },
      { value: "l3", label: "Letters" },
    ];
    expect(matchTypeahead(repeated, "l", 0)).toBe(1);
    expect(matchTypeahead(repeated, "l", 1)).toBe(2);
    // Wraps back round rather than stopping at the end.
    expect(matchTypeahead(repeated, "l", 2)).toBe(0);
  });

  it("cycles when the same character repeats, per APG", () => {
    const repeated: TabItem[] = [
      { value: "l1", label: "Labs" },
      { value: "l2", label: "Ledger" },
      { value: "l3", label: "Letters" },
    ];
    // Fast repeats land inside the 600ms window, so the buffer really is
    // "ll" — searching for that literally matches nothing and strands the
    // user on the first L tab.
    expect(matchTypeahead(repeated, "ll", 1)).toBe(2);
    expect(matchTypeahead(repeated, "lll", 2)).toBe(0);
  });

  it("a multi-character buffer searches from the current item, so it refines", () => {
    const repeated: TabItem[] = [
      { value: "l1", label: "Labs" },
      { value: "l2", label: "Ledger" },
    ];
    expect(matchTypeahead(repeated, "la", 0)).toBe(0);
  });

  it("returns null when nothing matches, and for an empty buffer or list", () => {
    expect(matchTypeahead(items, "zzz", 0)).toBeNull();
    expect(matchTypeahead(items, "", 0)).toBeNull();
    expect(matchTypeahead([], "a", 0)).toBeNull();
  });

  it("matches on textLabel when the label is not a string", () => {
    const rich: TabItem[] = [{ value: "x", label: { type: "span" }, textLabel: "Imaging" }];
    expect(matchTypeahead(rich, "im", -1)).toBe(0);
  });

  it("falls back to the value when there is no label at all", () => {
    expect(textOf({ value: "raw" })).toBe("raw");
  });
});

describe("isTypeaheadKey", () => {
  it("accepts printable characters", () => {
    expect(isTypeaheadKey("a", false, false, false)).toBe(true);
    expect(isTypeaheadKey("7", false, false, false)).toBe(true);
  });

  it("rejects named keys", () => {
    expect(isTypeaheadKey("ArrowRight", false, false, false)).toBe(false);
    expect(isTypeaheadKey("Enter", false, false, false)).toBe(false);
  });

  it("rejects Space, which is an activation key in manual mode", () => {
    expect(isTypeaheadKey(" ", false, false, false)).toBe(false);
  });

  it("rejects anything with a modifier, so shortcuts are not swallowed", () => {
    expect(isTypeaheadKey("a", true, false, false)).toBe(false);
    expect(isTypeaheadKey("a", false, true, false)).toBe(false);
    expect(isTypeaheadKey("a", false, false, true)).toBe(false);
  });
});

describe("focusAfterClose — the rule APG omits", () => {
  const remaining: TabItem[] = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];

  it("focuses the tab that slid into the closed slot", () => {
    expect(focusAfterClose(0, remaining, false)).toEqual({ kind: "item", index: 0 });
  });

  it("falls back to the previous tab when the last one was closed", () => {
    expect(focusAfterClose(2, remaining, false)).toEqual({ kind: "item", index: 1 });
  });

  it("falls back to the add button when nothing is left", () => {
    expect(focusAfterClose(0, [], true)).toEqual({ kind: "add" });
  });

  it("falls back to the list — never to <body>", () => {
    expect(focusAfterClose(0, [], false)).toEqual({ kind: "list" });
  });
});

describe("roving tabindex", () => {
  it("puts exactly one trigger in the tab order", () => {
    const order = items.map((_, index) => rovingTabIndex(index, 2));
    expect(order).toEqual([-1, -1, 0, -1]);
    expect(order.filter((value) => value === 0)).toHaveLength(1);
  });

  it("falls back to the first item when nothing is selected, so the group is reachable", () => {
    expect(tabStopIndex(items, -1)).toBe(0);
  });

  it("returns -1 for an empty list", () => {
    expect(tabStopIndex([], -1)).toBe(-1);
  });

  it("uses the selected index when there is one", () => {
    expect(tabStopIndex(items, 2)).toBe(2);
  });

  it("ignores an out-of-range selection", () => {
    expect(tabStopIndex(items, 99)).toBe(0);
  });
});

describe("reorderIntent", () => {
  const mods = { ctrl: true, meta: false, shift: true };

  it("moves forward and backward with Ctrl+Shift+Arrow", () => {
    expect(reorderIntent("ArrowRight", mods, 1, 4, horizontal)).toEqual({ from: 1, to: 2 });
    expect(reorderIntent("ArrowLeft", mods, 1, 4, horizontal)).toEqual({ from: 1, to: 0 });
  });

  it("accepts Cmd+Shift on macOS", () => {
    expect(
      reorderIntent("ArrowRight", { ctrl: false, meta: true, shift: true }, 0, 4, horizontal),
    ).toEqual({ from: 0, to: 1 });
  });

  it("does nothing without the full modifier combination", () => {
    expect(
      reorderIntent("ArrowRight", { ctrl: true, meta: false, shift: false }, 1, 4, horizontal),
    ).toBeNull();
    expect(
      reorderIntent("ArrowRight", { ctrl: false, meta: false, shift: true }, 1, 4, horizontal),
    ).toBeNull();
  });

  it("does not wrap — a tab jumping end to start reads as a bug", () => {
    expect(reorderIntent("ArrowRight", mods, 3, 4, horizontal)).toBeNull();
    expect(reorderIntent("ArrowLeft", mods, 0, 4, horizontal)).toBeNull();
  });

  it("respects orientation and direction", () => {
    expect(reorderIntent("ArrowDown", mods, 0, 4, vertical)).toEqual({ from: 0, to: 1 });
    expect(reorderIntent("ArrowLeft", mods, 0, 4, { ...horizontal, rtl: true })).toEqual({
      from: 0,
      to: 1,
    });
  });

  it("ignores an out-of-range index", () => {
    expect(reorderIntent("ArrowRight", mods, -1, 4, horizontal)).toBeNull();
    expect(reorderIntent("ArrowRight", mods, 9, 4, horizontal)).toBeNull();
  });
});

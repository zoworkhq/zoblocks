/**
 * The slash menu's combobox keyboard model.
 *
 * The property under test throughout: **focus never leaves the input.** Arrow
 * keys move `aria-activedescendant`, not DOM focus. Getting this wrong is the
 * most common accessibility defect in command palettes, because moving focus
 * into the listbox breaks typeahead and strands anyone using a screen reader.
 */

import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  filterShortcuts,
  isShortcutQuery,
  shortcutQuery,
  useShortcutMenu,
  type ConsultShortcut,
} from "../src/shortcuts.js";

const shortcuts: ConsultShortcut[] = [
  { id: "prep", label: "Prep", question: "Prepare me for this encounter." },
  { id: "questions", label: "Questions", question: "What should I ask about?" },
  { id: "measures", label: "Measure trends", keyword: "trends", question: "Show measure trends." },
  {
    id: "prescribe",
    label: "Prescribing check",
    question: "Check prescribing.",
    roles: ["prescriber"],
  },
];

const key = (k: string) => {
  const event = { key: k, preventDefault: vi.fn() };
  return event as unknown as React.KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
};

describe("query helpers", () => {
  it.each([
    ["/", true],
    ["/prep", true],
    ["what is", false],
    ["", false],
    [" /prep", false],
  ])("isShortcutQuery(%j) is %s", (draft, expected) => {
    expect(isShortcutQuery(draft)).toBe(expected);
  });

  it("extracts and lowercases the query", () => {
    expect(shortcutQuery("/PrEp ")).toBe("prep");
    expect(shortcutQuery("not a shortcut")).toBe("");
  });
});

describe("filterShortcuts", () => {
  it("returns nothing when the draft is not a shortcut query", () => {
    expect(filterShortcuts(shortcuts, "what is the dose")).toEqual([]);
  });

  it("returns everything unrestricted on a bare slash", () => {
    expect(filterShortcuts(shortcuts, "/").map((s) => s.id)).toEqual([
      "prep",
      "questions",
      "measures",
    ]);
  });

  it("matches on the keyword rather than only the id", () => {
    expect(filterShortcuts(shortcuts, "/trends").map((s) => s.id)).toEqual(["measures"]);
  });

  it("matches on the label", () => {
    expect(filterShortcuts(shortcuts, "/measure").map((s) => s.id)).toEqual(["measures"]);
  });

  it("hides role-scoped shortcuts from other roles", () => {
    // A nurse and an attending should not see the same menu.
    expect(filterShortcuts(shortcuts, "/", "nurse").some((s) => s.id === "prescribe")).toBe(false);
    expect(filterShortcuts(shortcuts, "/", "prescriber").some((s) => s.id === "prescribe")).toBe(
      true,
    );
  });

  it("returns nothing when nothing matches", () => {
    expect(filterShortcuts(shortcuts, "/zzzz")).toEqual([]);
  });
});

describe("useShortcutMenu", () => {
  const setup = (draft = "/", onSelect = vi.fn(), onEscape = vi.fn()) => {
    const view = renderHook(
      (props: { draft: string }) =>
        useShortcutMenu({ shortcuts, draft: props.draft, onSelect, onEscape }),
      { initialProps: { draft } },
    );
    return { ...view, onSelect, onEscape };
  };

  it("is closed when the draft is not a shortcut query", () => {
    const { result } = setup("what is the dose");
    expect(result.current.open).toBe(false);
    expect(result.current.inputProps["aria-expanded"]).toBe(false);
  });

  it("opens with the first option active", () => {
    const { result } = setup();
    expect(result.current.open).toBe(true);
    expect(result.current.activeIndex).toBe(0);
    expect(result.current.inputProps["aria-activedescendant"]).toBe("consult-shortcuts-option-0");
  });

  it("carries the full combobox contract on the input", () => {
    const { result } = setup();
    expect(result.current.inputProps).toMatchObject({
      role: "combobox",
      "aria-expanded": true,
      "aria-autocomplete": "list",
      "aria-controls": "consult-shortcuts-list",
    });
    expect(result.current.listProps).toMatchObject({
      role: "listbox",
      id: "consult-shortcuts-list",
    });
  });

  it("moves the active option with ArrowDown, wrapping at the end", () => {
    const { result } = setup();
    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.activeIndex).toBe(1);
    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.activeIndex).toBe(2);
    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    expect(result.current.activeIndex).toBe(0);
  });

  it("moves with ArrowUp, wrapping at the start", () => {
    const { result } = setup();
    act(() => result.current.inputProps.onKeyDown(key("ArrowUp")));
    expect(result.current.activeIndex).toBe(2);
  });

  it("jumps to first and last with Home and End", () => {
    const { result } = setup();
    act(() => result.current.inputProps.onKeyDown(key("End")));
    expect(result.current.activeIndex).toBe(2);
    act(() => result.current.inputProps.onKeyDown(key("Home")));
    expect(result.current.activeIndex).toBe(0);
  });

  it("selects the active option on Enter", () => {
    const onSelect = vi.fn();
    const { result } = setup("/", onSelect);
    act(() => result.current.inputProps.onKeyDown(key("ArrowDown")));
    act(() => result.current.inputProps.onKeyDown(key("Enter")));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "questions" }));
  });

  it("prevents default on the keys it handles, so the field does not also act", () => {
    const { result } = setup();
    const event = key("ArrowDown");
    act(() => result.current.inputProps.onKeyDown(event));
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("closes on Escape and leaves the draft alone", () => {
    // The clinician may be writing a free-text question that starts with a
    // slash. Losing what they wrote would be worse than a stray menu.
    const { result } = setup();
    act(() => result.current.inputProps.onKeyDown(key("Escape")));
    expect(result.current.open).toBe(false);
  });

  it("calls onEscape when Escape is pressed with the menu already closed", () => {
    const onEscape = vi.fn();
    const { result } = setup("plain question", vi.fn(), onEscape);
    act(() => result.current.inputProps.onKeyDown(key("Escape")));
    expect(onEscape).toHaveBeenCalled();
  });

  it("reopens when the clinician types a fresh slash after dismissing", () => {
    const { result, rerender } = setup();
    act(() => result.current.inputProps.onKeyDown(key("Escape")));
    expect(result.current.open).toBe(false);

    rerender({ draft: "plain" });
    rerender({ draft: "/" });
    expect(result.current.open).toBe(true);
  });

  it("marks the active option selected and no other", () => {
    const { result } = setup();
    expect(result.current.optionProps(0)["aria-selected"]).toBe(true);
    expect(result.current.optionProps(1)["aria-selected"]).toBe(false);
  });

  it("selects on click", () => {
    const onSelect = vi.fn();
    const { result } = setup("/", onSelect);
    act(() => result.current.optionProps(2).onClick());
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "measures" }));
  });

  it("moves the active option on hover, matching pointer expectations", () => {
    const { result } = setup();
    act(() => result.current.optionProps(2).onMouseEnter());
    expect(result.current.activeIndex).toBe(2);
  });

  it("clamps the active index when the filtered list shrinks under it", () => {
    const { result, rerender } = setup();
    act(() => result.current.inputProps.onKeyDown(key("End")));
    expect(result.current.activeIndex).toBe(2);
    rerender({ draft: "/prep" });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.activeIndex).toBe(0);
  });

  it("does nothing on an unhandled key", () => {
    const { result } = setup();
    const event = key("a");
    act(() => result.current.inputProps.onKeyDown(event));
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.activeIndex).toBe(0);
  });
});

/**
 * The keyboard model, as pure functions over an item list.
 *
 * Implemented from the WAI-ARIA Authoring Practices tabs and radiogroup
 * patterns, plus the two things APG leaves to the implementer: typeahead, and
 * where focus lands after a close (see `focusAfterClose`).
 *
 * Everything is a pure function of (items, index, key) so the whole keyboard
 * map is testable without rendering anything.
 */

import type { Orientation, TabItem } from "./types.js";

export interface NavigationOptions {
  orientation: Orientation;
  /** Read from computed style at the call site, never assumed. */
  rtl?: boolean;
  /** APG says wrap; a stepper may prefer not to. */
  loop?: boolean;
}

export type NavigationIntent =
  { kind: "move"; index: number } | { kind: "activate" } | { kind: "close" } | { kind: "none" };

/**
 * Disabled triggers stay focusable (`aria-disabled`, never `disabled`), so
 * arrow keys must still land on them — otherwise a keyboard user can never
 * discover the tab exists, which is exactly what `aria-disabled` was chosen to
 * avoid. Only fully absent items are skipped.
 */
function isNavigable(item: TabItem | undefined): boolean {
  return item !== undefined;
}

/** First navigable index at or after `from`, walking by `step`. */
function seek(items: readonly TabItem[], from: number, step: number, loop: boolean): number | null {
  const n = items.length;
  if (n === 0) return null;
  let i = from;
  for (let hops = 0; hops < n; hops++) {
    i += step;
    if (i < 0 || i >= n) {
      if (!loop) return null;
      i = i < 0 ? n - 1 : 0;
    }
    if (isNavigable(items[i])) return i;
  }
  return null;
}

/**
 * Resolve a key press into an intent.
 *
 * The RTL swap is the only direction-aware code in the package: everything
 * else uses logical CSS properties or delta-based geometry. In a vertical
 * orientation there is no swap, because block direction does not flip with
 * `direction: rtl`.
 */
export function keyToIntent(
  key: string,
  items: readonly TabItem[],
  current: number,
  options: NavigationOptions,
): NavigationIntent {
  const { orientation, rtl = false, loop = true } = options;
  const vertical = orientation === "vertical";

  let forward = vertical ? "ArrowDown" : "ArrowRight";
  let backward = vertical ? "ArrowUp" : "ArrowLeft";
  if (!vertical && rtl) [forward, backward] = [backward, forward];

  if (key === forward) {
    const index = seek(items, current, 1, loop);
    return index === null ? { kind: "none" } : { kind: "move", index };
  }
  if (key === backward) {
    const index = seek(items, current, -1, loop);
    return index === null ? { kind: "none" } : { kind: "move", index };
  }
  if (key === "Home") {
    const index = seek(items, -1, 1, false);
    return index === null ? { kind: "none" } : { kind: "move", index };
  }
  if (key === "End") {
    const index = seek(items, items.length, -1, false);
    return index === null ? { kind: "none" } : { kind: "move", index };
  }
  if (key === "Enter" || key === " " || key === "Spacebar") return { kind: "activate" };
  if (key === "Delete" || key === "Backspace") return { kind: "close" };
  return { kind: "none" };
}

/**
 * Reordering, by keyboard.
 *
 * Drag-and-drop is the obvious affordance and it is unusable without a
 * pointer, so the keyboard path is the primary one here rather than an
 * afterthought: Ctrl/Cmd+Shift+Arrow moves the focused tab one place. The
 * modifier combination is deliberately three-key — Ctrl+Arrow alone is taken
 * by the OS on both platforms, and a bare Arrow is already navigation.
 */
export function reorderIntent(
  key: string,
  modifiers: { ctrl: boolean; meta: boolean; shift: boolean },
  current: number,
  length: number,
  options: NavigationOptions,
): { from: number; to: number } | null {
  if (!(modifiers.ctrl || modifiers.meta) || !modifiers.shift) return null;
  if (current < 0 || current >= length) return null;

  const vertical = options.orientation === "vertical";
  let forward = vertical ? "ArrowDown" : "ArrowRight";
  let backward = vertical ? "ArrowUp" : "ArrowLeft";
  if (!vertical && options.rtl) [forward, backward] = [backward, forward];

  // No wrapping: a tab that jumps from the end of the strip to the start reads
  // as a bug rather than a move.
  if (key === forward && current < length - 1) return { from: current, to: current + 1 };
  if (key === backward && current > 0) return { from: current, to: current - 1 };
  return null;
}

/** Text used for typeahead and for the overflow menu. */
export function textOf(item: TabItem): string {
  if (typeof item.textLabel === "string") return item.textLabel;
  if (typeof item.label === "string") return item.label;
  return item.value;
}

/**
 * Typeahead with the APG-conventional 600 ms buffer.
 *
 * The single-character case searches from the *next* item so repeatedly
 * pressing "l" cycles through every tab beginning with L, rather than
 * re-selecting the one already focused. A multi-character buffer searches from
 * the current item, so "la" refines rather than skips.
 */
export class Typeahead {
  private buffer = "";
  private last = 0;

  constructor(private readonly timeoutMs = 600) {}

  /** `now` is injected so tests do not depend on wall-clock timing. */
  push(char: string, now: number): string {
    if (now - this.last > this.timeoutMs) this.buffer = "";
    this.last = now;
    this.buffer += char.toLowerCase();
    return this.buffer;
  }

  reset(): void {
    this.buffer = "";
    this.last = 0;
  }

  get value(): string {
    return this.buffer;
  }
}

/** True for keys that should feed the typeahead buffer. */
export function isTypeaheadKey(key: string, ctrl: boolean, meta: boolean, alt: boolean): boolean {
  if (ctrl || meta || alt) return false;
  // Length 1 excludes every named key; the whitespace test excludes Space,
  // which is an activation key in manual mode and must not become a search.
  return key.length === 1 && key.trim().length > 0;
}

export function matchTypeahead(
  items: readonly TabItem[],
  buffer: string,
  current: number,
): number | null {
  if (!buffer) return null;
  const n = items.length;
  if (n === 0) return null;

  /*
   * APG: "if the same character is typed repeatedly, cycle through the items
   * starting with that character."
   *
   * Without this, pressing L three times searches for "lll", matches nothing,
   * and the user is stuck on the first L tab — which is precisely the case
   * where they are trying to reach the third one.
   */
  const repeated = buffer.length > 1 && buffer.split("").every((char) => char === buffer[0]);
  const search = repeated ? (buffer[0] as string) : buffer;

  const start = search.length === 1 ? current + 1 : current;
  for (let hops = 0; hops < n; hops++) {
    const index = (start + hops + n) % n;
    const item = items[index];
    if (item && textOf(item).toLowerCase().startsWith(search)) return index;
  }
  return null;
}

/**
 * Where focus goes after closing tab `closed`.
 *
 * Next, else previous, else the add button, else the list container. This is
 * the rule APG omits, and the reason closable tabs feel broken nearly
 * everywhere: the common implementation lets focus fall to `<body>`, which
 * drops a keyboard user back at the top of the document.
 *
 * `remaining` is the list *after* removal, so index `closed` is already the
 * old `closed + 1`.
 */
export type CloseFocusTarget = { kind: "item"; index: number } | { kind: "add" } | { kind: "list" };

export function focusAfterClose(
  closed: number,
  remaining: readonly TabItem[],
  hasAddButton: boolean,
): CloseFocusTarget {
  if (remaining.length > 0) {
    if (closed < remaining.length) return { kind: "item", index: closed };
    return { kind: "item", index: remaining.length - 1 };
  }
  return hasAddButton ? { kind: "add" } : { kind: "list" };
}

/**
 * Roving tabindex: exactly one trigger is in the tab order.
 *
 * `aria-activedescendant` is deliberately not used. It keeps DOM focus on the
 * container, and real DOM focus is what carries the focus ring under Windows
 * High Contrast — where a CSS-only focus style has already been erased by the
 * OS.
 */
export function rovingTabIndex(index: number, selectedIndex: number): 0 | -1 {
  return index === selectedIndex ? 0 : -1;
}

/**
 * The index that should hold `tabindex="0"`.
 *
 * Falls back to the first item when nothing is selected: a group where every
 * trigger is `-1` is unreachable by keyboard, which is a worse failure than
 * an arbitrary entry point.
 */
export function tabStopIndex(items: readonly TabItem[], selectedIndex: number): number {
  if (selectedIndex >= 0 && selectedIndex < items.length) return selectedIndex;
  return items.length > 0 ? 0 : -1;
}

import { render, type RenderResult } from "@testing-library/react";
import { expect, it } from "vitest";
import type { ReactElement } from "react";

/**
 * Invariants every Zoblocks component is held to, regardless of what it renders.
 *
 * These are the library's own stated rules, turned into assertions. They are
 * cheap, they apply everywhere, and each one corresponds to a failure that is
 * plausible in a healthcare UI and invisible in review:
 *
 *   - A raw `undefined` or `[object Object]` reaching the screen is a missing
 *     value rendering as though it were data.
 *   - An interactive control with no accessible name is unreachable to anyone
 *     using a screen reader, and the component's own docs claim otherwise.
 *   - A component that renders nothing at all when given absent data is
 *     indistinguishable from one that failed to render — which is the exact
 *     ambiguity "absence is a state" exists to prevent.
 *
 * Per-component behaviour is asserted in that component's own test file. This
 * is the floor, not the coverage.
 */

/** Strings that mean "a value was interpolated that should not have been". */
const LEAKED = ["undefined", "null", "NaN", "[object Object]", "Invalid Date"] as const;

export function expectNoLeakedValues(view: RenderResult): void {
  const text = view.container.textContent ?? "";
  for (const bad of LEAKED) {
    expect(
      text,
      `rendered output contains ${JSON.stringify(bad)} — a value reached the screen that should have been handled as absent`,
    ).not.toContain(bad);
  }
}

export function expectInteractivesAreNamed(view: RenderResult): void {
  const interactive = view.container.querySelectorAll<HTMLElement>(
    "button, a[href], input, select, textarea, [role='button'], [role='switch'], [role='checkbox']",
  );

  for (const el of interactive) {
    const name =
      el.getAttribute("aria-label") ??
      el.getAttribute("aria-labelledby") ??
      el.getAttribute("title") ??
      (el as HTMLInputElement).labels?.[0]?.textContent ??
      el.textContent ??
      "";

    expect(
      name.trim().length,
      `<${el.tagName.toLowerCase()}> has no accessible name — it cannot be reached or described by a screen reader`,
    ).toBeGreaterThan(0);
  }
}

/**
 * "Something" means something a person can perceive — rendered text, or an
 * accessible name on a control. An icon-only disclosure with an aria-label is
 * a legitimate design; an empty container is not.
 */
export function expectRendersSomething(view: RenderResult): void {
  const text = (view.container.textContent ?? "").trim();
  if (text.length > 0) return;

  const named = Array.from(
    view.container.querySelectorAll<HTMLElement>("[aria-label], [title], img[alt]"),
  ).some(
    (el) =>
      (
        el.getAttribute("aria-label") ??
        el.getAttribute("title") ??
        el.getAttribute("alt") ??
        ""
      ).trim().length > 0,
  );

  expect(
    named,
    "component rendered neither text nor an accessible name — indistinguishable from a render failure",
  ).toBe(true);
}

/**
 * Runs the whole floor against one rendering. Call it once per meaningful
 * state, not once per component: the states are where these failures hide.
 */
export function itMeetsTheContract(name: string, element: () => ReactElement): void {
  it(`${name}: meets the component contract`, () => {
    const view = render(element());
    expectRendersSomething(view);
    expectNoLeakedValues(view);
    expectInteractivesAreNamed(view);
  });
}

/**
 * Asserts a status is not conveyed by colour alone.
 *
 * jsdom applies no CSS, so the colour itself is unobservable here — that is
 * what the axe run against the built site covers. What this checks is the
 * thing colour would otherwise be carrying alone: that the meaning is also
 * present as words.
 */
export function expectStatedInWords(view: RenderResult, words: RegExp): void {
  expect(
    view.container.textContent ?? "",
    `expected the state to be stated in words matching ${words} — colour alone does not survive grayscale, forced-colors, or a printed chart`,
  ).toMatch(words);
}

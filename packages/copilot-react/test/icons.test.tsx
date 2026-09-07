/**
 * The icon set.
 *
 * These look like the kind of thing nobody tests, and the contract they carry
 * is exactly the kind that breaks silently. Every icon in this component sits
 * inside a control that already has an accessible name — the dock's shortcut
 * button, the message actions, the mode chips. An icon that announced itself
 * would double every one of those, so `aria-hidden` is not decoration here, it
 * is the thing that keeps a screen reader from reading "thumbs up button,
 * thumbs up".
 *
 * So the assertions are the contract, applied to all of them at once rather
 * than one bespoke test each: hidden from the tree, unreachable by tab, sized
 * in `em` so they scale with their label, and inheriting colour so a skin never
 * has to restate it.
 *
 * The glyphs are masked spans rather than inline SVG, so that a customer can
 * replace one from CSS. The contract above is unchanged by that and the
 * assertions deliberately do not name an element — the day a glyph goes back to
 * being an `<svg>`, or becomes something else again, these should still hold.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import * as icons from "../src/icons.js";
import { modeIcon } from "../src/icons.js";

/**
 * Every exported icon component, discovered rather than listed.
 *
 * The uppercase check matters: `modeIcon` also ends in "Icon" but is a factory
 * that returns a component, not a component itself. Rendering it produces
 * React's "Functions are not valid as a React child" — which is how this test
 * found the distinction in the first place.
 */
const ICONS = Object.entries(icons).filter(
  ([name, value]) => /^[A-Z].*Icon$/.test(name) && typeof value === "function",
) as [string, (props: Record<string, unknown>) => React.ReactElement][];

describe("the icon set", () => {
  it("exports a useful number of glyphs", () => {
    // A guard against the barrel silently losing its export, which is how the
    // docs page broke once already.
    expect(ICONS.length).toBeGreaterThanOrEqual(20);
  });

  const glyphOf = (container: HTMLElement) => container.firstElementChild;

  it.each(ICONS)("%s is hidden from assistive technology", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    expect(glyphOf(container)).toHaveAttribute("aria-hidden", "true");
  });

  it.each(ICONS)("%s is not reachable by tab", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    // No tabindex and not a natively focusable element: an icon inside a button
    // that could be focused separately would be a second stop for one control.
    expect(glyphOf(container)).not.toHaveAttribute("tabindex");
    expect(glyphOf(container)?.tagName).not.toBe("BUTTON");
  });

  /**
   * Size and colour now come from `icons.css` rather than from attributes, so
   * what this asserts is the hook that stylesheet needs: the class and the slot
   * it is keyed to. Without either, the mask has nothing to attach to and the
   * glyph is a blank square — which is also exactly how a customer override
   * goes missing.
   */
  it.each(ICONS)("%s carries the slot its mask is keyed to", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    const el = glyphOf(container);
    expect(el).toHaveClass("zb-icon");
    expect(el?.getAttribute("data-icon")).toMatch(/^[a-z0-9-]+$/);
  });

  it("passes props through, so a skin can add a class without a wrapper", () => {
    const { container } = render(<icons.SendIcon className="my-class" data-testid="send" />);
    const el = glyphOf(container);
    expect(el).toHaveClass("my-class");
    // And keeps its own, because dropping either would drop the glyph.
    expect(el).toHaveClass("zb-icon");
    expect(el).toHaveAttribute("data-icon", "send");
    expect(el).toHaveAttribute("data-testid", "send");
  });

  /*
   * That every glyph matches a slot in the theme package's registry is checked
   * at the repository root instead, in `test/icon-slots.test.ts`. A component
   * package must not depend on the theme package to find out what it draws —
   * that is the dependency pointing the wrong way — and a cross-package
   * invariant belongs where both sides are already in scope.
   */
});

describe("modeIcon", () => {
  it.each([
    ["prepare", "PrepareIcon"],
    ["between-visits", "PrepareIcon"],
    ["work-up", "WorkUpIcon"],
    ["formulate", "WorkUpIcon"],
    ["look-up", "LookUpIcon"],
  ])("maps %s to %s", (modeId, expected) => {
    expect(modeIcon(modeId)).toBe(icons[expected as keyof typeof icons]);
  });

  it("falls back rather than rendering nothing for a host's own mode", () => {
    // A customer's mode id is not in our switch, and a chip with no glyph beside
    // a chip that has one reads as a broken state rather than a custom one.
    const Glyph = modeIcon("our-own-triage-mode");
    expect(Glyph).toBe(icons.SparkIcon);
    const { container } = render(<Glyph />);
    expect(container.firstElementChild).toHaveAttribute("data-icon", "spark");
  });
});

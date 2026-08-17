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

  it.each(ICONS)("%s is hidden from assistive technology", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
  });

  it.each(ICONS)("%s scales with its label rather than a fixed pixel size", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "1em");
    expect(svg).toHaveAttribute("height", "1em");
  });

  it.each(ICONS)("%s inherits colour so a skin never restates it", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    const svg = container.querySelector("svg");
    expect(
      svg?.getAttribute("stroke") === "currentColor" ||
        svg?.getAttribute("fill") === "currentColor",
    ).toBe(true);
  });

  it.each(ICONS)("%s draws something", (_name, Glyph) => {
    const { container } = render(<Glyph />);
    expect(container.querySelector("svg")?.innerHTML.trim()).not.toBe("");
  });

  it("passes props through, so a skin can add a class without a wrapper", () => {
    const { container } = render(<icons.SendIcon className="my-class" data-testid="send" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("my-class");
    expect(svg).toHaveAttribute("data-testid", "send");
  });

  it("lets a caller override the stroke weight", () => {
    const { container } = render(<icons.SendIcon strokeWidth={3} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "3");
  });
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
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

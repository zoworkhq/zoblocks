import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReferenceRange } from "./reference-range";
import { itMeetsTheContract } from "../../../test/contract";

const NORMAL = { low: { value: 3.5, unit: "mmol/L" }, high: { value: 5.1, unit: "mmol/L" } };

describe("ReferenceRange", () => {
  itMeetsTheContract("in range", () => <ReferenceRange value={4.2} range={NORMAL} showBounds />);

  /**
   * "The bar is decorative. Everything it shows is also present as text" —
   * a positional graphic is unreadable to a screen reader and unreliable in
   * print, and this is a component people print.
   */
  it("states the bounds as text, not only as a drawn bar", () => {
    const view = render(<ReferenceRange value={4.2} range={NORMAL} showBounds />);
    expect(view.container.textContent).toContain("3.5");
    expect(view.container.textContent).toContain("5.1");
  });

  it("hides the bar from assistive technology since the text carries it", () => {
    const view = render(<ReferenceRange value={4.2} range={NORMAL} showBounds />);
    const decorative = view.container.querySelectorAll("[aria-hidden='true']");
    expect(decorative.length).toBeGreaterThan(0);
  });

  /**
   * "No numeric bound in the range? No bar." A drawn scale would imply bounds
   * nobody stated.
   */
  it("draws no scale for a text-only range", () => {
    const view = render(<ReferenceRange value={4.2} range={{ text: "See report" }} showBounds />);
    expect(view.container.textContent).toMatch(/see report/i);
    expect(view.container.textContent).not.toContain("NaN");
  });

  it("says so rather than drawing anything when there is no range at all", () => {
    const view = render(<ReferenceRange value={4.2} noRangeLabel="No reference range" />);
    expect(view.container.textContent).toMatch(/no reference range/i);
  });

  /**
   * "Value off the end of the scale? Clamped WITH an explicit off-scale
   * marker, never silently pinned to the edge as though it were merely
   * borderline." A potassium of 9.9 pinned at the edge reads like 5.2.
   */
  it("marks an off-scale value as off-scale", () => {
    const view = render(<ReferenceRange value={9.9} range={NORMAL} showBounds />);
    expect(view.container.textContent).toMatch(/off.?scale|beyond|outside the (scale|chart)/i);
  });

  it("does not mark an in-range value as off-scale", () => {
    const view = render(<ReferenceRange value={4.2} range={NORMAL} showBounds />);
    expect(view.container.textContent).not.toMatch(/off.?scale/i);
  });

  /** "One-sided range? Drawn, but the inferred end is marked as inferred." */
  it("marks the inferred end of a one-sided range", () => {
    const view = render(
      <ReferenceRange value={2.0} range={{ high: { value: 5.1, unit: "mmol/L" } }} showBounds />,
    );
    expect(view.container.textContent).toMatch(/inferred|not stated|no lower|one-?sided|≤|<=/i);
  });

  it("renders without a value, since a range is meaningful on its own", () => {
    const view = render(<ReferenceRange range={NORMAL} showBounds />);
    expect(view.container.textContent).not.toContain("undefined");
    expect(view.container.textContent).not.toContain("NaN");
  });

  it("survives a zero-width range without dividing by zero", () => {
    const view = render(
      <ReferenceRange
        value={5}
        range={{ low: { value: 5, unit: "x" }, high: { value: 5, unit: "x" } }}
        showBounds
      />,
    );
    expect(view.container.textContent).not.toContain("NaN");
    expect(view.container.innerHTML).not.toContain("NaN");
  });
});

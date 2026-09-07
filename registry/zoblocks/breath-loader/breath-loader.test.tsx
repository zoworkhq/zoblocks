import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BreathLoader } from "./breath-loader";
import { describeLoaderContract } from "../../../test/loader-suite";

describeLoaderContract({ name: "BreathLoader", variant: "breath", Loader: BreathLoader });

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-zb-loader]");

describe("BreathLoader", () => {
  it("renders three rings and one core", () => {
    // Three is the number that keeps the field from ever being empty: each
    // starts a third of a cycle after the last.
    const view = render(<BreathLoader label="Loading" />);
    expect(view.container.querySelectorAll(".zb-loader__ring")).toHaveLength(3);
    expect(view.container.querySelectorAll(".zb-loader__core")).toHaveLength(1);
  });

  it("keeps the rings as siblings so the CSS stagger applies", () => {
    // The delay is applied with :nth-of-type, so an extra wrapper element
    // around any ring would silently collapse all three onto one phase.
    const view = render(<BreathLoader label="Loading" />);
    const rings = [...view.container.querySelectorAll(".zb-loader__ring")];
    const parents = new Set(rings.map((ring) => ring.parentElement));
    expect(parents.size).toBe(1);
    expect(rings.every((ring) => ring.tagName.toLowerCase() === "circle")).toBe(true);
  });

  it("carries no clinical symbol at all", () => {
    // Its neutrality across specialties is the reason it exists: nothing here
    // should read as cardiac, oncological, or obstetric.
    const view = render(<BreathLoader label="Loading" />);
    expect(view.container.querySelectorAll("path")).toHaveLength(0);
    const shapes = [...view.container.querySelectorAll("svg > *")].map((el) =>
      el.tagName.toLowerCase(),
    );
    expect(new Set(shapes)).toEqual(new Set(["circle"]));
  });

  it("breathes at roughly fifteen a minute by default", () => {
    const view = render(<BreathLoader label="Loading" />);
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-cycle")).toBe("4000ms");
  });

  it.each([
    [0.5, "8000ms"],
    [0.7, "5714ms"],
    [1, "4000ms"],
    [2, "2000ms"],
  ])("scales the cycle by speed=%s", (speed, expected) => {
    const view = render(<BreathLoader label="Loading" speed={speed} />);
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-cycle")).toBe(expected);
  });

  it("clamps speed so nothing can be driven into a flicker", () => {
    // WCAG 2.3.1 allows up to three flashes a second; this stays far below,
    // and the clamp is what guarantees it regardless of the caller.
    const fast = render(<BreathLoader label="Loading" speed={40} />);
    expect(root(fast.container)?.style.getPropertyValue("--zb-loader-cycle")).toBe("2000ms");

    const slow = render(<BreathLoader label="Loading" speed={0.01} />);
    expect(root(slow.container)?.style.getPropertyValue("--zb-loader-cycle")).toBe("8000ms");
  });

  it("has no beat, because it is not a cardiac loader", () => {
    const view = render(<BreathLoader label="Loading" />);
    expect(view.container.querySelector(".zb-loader__beat")).toBeNull();
    expect(view.container.querySelector(".zb-loader__head")).toBeNull();
  });
});

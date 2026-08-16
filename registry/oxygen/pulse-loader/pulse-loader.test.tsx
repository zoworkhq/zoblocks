import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PULSE_MIN_SIZE_PX, PageLoader, PulseLoader } from "./pulse-loader";
import { LOADER_ART } from "../lib/loader";
import { describeLoaderContract } from "../../../test/loader-suite";

describeLoaderContract({ name: "PulseLoader", variant: "pulse", Loader: PulseLoader });

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-ox-loader]");
const beatOf = (container: HTMLElement) =>
  root(container)?.style.getPropertyValue("--ox-loader-beat");

describe("PulseLoader", () => {
  it("draws the heart open at both sides so the rhythm line can pass through", () => {
    // The gap is the whole idea. A closed heart is a valentine; an open one
    // with a trace through it is a clinical mark.
    const view = render(<PulseLoader label="Loading" />);
    const paths = [...view.container.querySelectorAll("path")].map((p) => p.getAttribute("d"));

    expect(paths).toContain(LOADER_ART.heartTop);
    expect(paths).toContain(LOADER_ART.heartBottom);
    // Two separate arcs rather than one closed outline is what leaves the gap.
    expect(LOADER_ART.heartTop.match(/^M/)).not.toBeNull();
    expect(LOADER_ART.heartTop).not.toMatch(/[Zz]\s*$/);
    expect(LOADER_ART.heartBottom).not.toMatch(/[Zz]\s*$/);
  });

  it("renders the rhythm line three times: a track, a tail, and a head", () => {
    // The static track is why the shape never vanishes between beats.
    const view = render(<PulseLoader label="Loading" />);
    const lines = [...view.container.querySelectorAll("path")].filter(
      (p) => p.getAttribute("d") === LOADER_ART.heartLine,
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toHaveClass("ox-loader__track");
    expect(lines[1]).toHaveClass("ox-loader__tail");
    expect(lines[2]).toHaveClass("ox-loader__head");
  });

  it("draws the heart once rather than once per loop", () => {
    // The reference redrew it every cycle, which put a visible seam in the
    // animation. Both heart paths animate; the line paths must not.
    const view = render(<PulseLoader label="Loading" />);
    const drawn = view.container.querySelectorAll(".ox-loader__draw");
    expect(drawn).toHaveLength(2);
    for (const path of drawn) {
      expect(path.getAttribute("d")).not.toBe(LOADER_ART.heartLine);
    }
  });

  it("normalises both heart paths so one draw duration covers both", () => {
    const view = render(<PulseLoader label="Loading" />);
    for (const path of view.container.querySelectorAll(".ox-loader__draw")) {
      expect(path).toHaveAttribute("pathLength", "100");
    }
  });

  it("beats at a resting sixty by default", () => {
    const view = render(<PulseLoader label="Loading" />);
    expect(beatOf(view.container)).toBe("1000ms");
  });

  it.each([
    [40, "1500ms"],
    [50, "1200ms"],
    [60, "1000ms"],
    [100, "600ms"],
  ])("converts %i bpm to a %s period", (bpm, expected) => {
    const view = render(<PulseLoader label="Loading" bpm={bpm} />);
    expect(beatOf(view.container)).toBe(expected);
  });

  it.each([
    [180, "600ms"],
    [10, "1500ms"],
    [0, "1500ms"],
    // NaN is a caller mistake, not a request for the slowest rate: it falls
    // back to the default the way an omitted value does.
    [Number.NaN, "1000ms"],
  ])("clamps %s bpm into the resting range", (bpm, expected) => {
    // A loader beating at 180 in a cardiology product would be read as a
    // number by the only people qualified to read it.
    const view = render(<PulseLoader label="Loading" bpm={bpm} />);
    expect(beatOf(view.container)).toBe(expected);
  });

  it("falls back to speed when no bpm is given", () => {
    const view = render(<PulseLoader label="Loading" speed={2} />);
    expect(beatOf(view.container)).toBe("500ms");
  });

  it("prefers an explicit bpm over speed", () => {
    const view = render(<PulseLoader label="Loading" bpm={60} speed={2} />);
    expect(beatOf(view.container)).toBe("1000ms");
  });

  /* ---------------------------------------------------------------- */
  /* The small-size swap                                               */
  /* ---------------------------------------------------------------- */

  it(`renders the rhythm line alone below ${PULSE_MIN_SIZE_PX}px`, () => {
    // Not a fallback — the correct rendering of this mark at this size.
    const view = render(<PulseLoader label="Loading" size={24} />);
    expect(root(view.container)).toHaveAttribute("data-ox-loader", "rhythm");

    const paths = [...view.container.querySelectorAll("path")].map((p) => p.getAttribute("d"));
    expect(paths).not.toContain(LOADER_ART.heartTop);
    expect(paths.every((d) => d === LOADER_ART.strip)).toBe(true);
  });

  it("keeps the heart at the threshold size", () => {
    const view = render(<PulseLoader label="Loading" size={PULSE_MIN_SIZE_PX} />);
    expect(root(view.container)).toHaveAttribute("data-ox-loader", "pulse");
  });

  it("swaps for the named small step too", () => {
    const view = render(<PulseLoader label="Loading" size="sm" />);
    expect(root(view.container)).toHaveAttribute("data-ox-loader", "rhythm");
  });

  it("carries the cadence and the label through the swap", () => {
    const view = render(<PulseLoader label="Loading results" size="sm" bpm={50} showLabel />);
    expect(beatOf(view.container)).toBe("1200ms");
    expect(view.container.textContent).toContain("Loading results");
  });

  it("thickens the stroke floor at small sizes so the line survives", () => {
    const small = render(<PulseLoader label="Loading" size={20} />);
    expect(root(small.container)?.style.getPropertyValue("--ox-loader-stroke")).toBe("2px");

    const large = render(<PulseLoader label="Loading" size={88} />);
    expect(root(large.container)?.style.getPropertyValue("--ox-loader-stroke")).toBe("2.4px");
  });

  /* ---------------------------------------------------------------- */
  /* PageLoader preset                                                 */
  /* ---------------------------------------------------------------- */

  describe("PageLoader", () => {
    it("covers the page and shows its label without being asked", () => {
      const view = render(<PageLoader label="Loading your records" />);
      const element = root(view.container);
      expect(element).toHaveClass("ox-loader--page");
      expect(view.container.querySelector(".ox-loader__label")?.textContent).toBe(
        "Loading your records",
      );
    });

    it("is still a pulse at the page size", () => {
      const view = render(<PageLoader label="Loading" />);
      expect(root(view.container)).toHaveAttribute("data-ox-loader", "pulse");
      expect(root(view.container)?.style.getPropertyValue("--ox-loader-size")).toBe("88px");
    });

    it("can be overridden like any other loader", () => {
      const view = render(<PageLoader label="Loading" mode="overlay" size="lg" />);
      expect(root(view.container)).toHaveClass("ox-loader--overlay");
      expect(root(view.container)?.style.getPropertyValue("--ox-loader-size")).toBe("56px");
    });
  });
});

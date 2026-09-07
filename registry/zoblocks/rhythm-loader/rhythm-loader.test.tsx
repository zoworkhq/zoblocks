import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RhythmLoader } from "./rhythm-loader";
import { LOADER_ART } from "../lib/loader";
import { describeLoaderContract } from "../../../test/loader-suite";

describeLoaderContract({ name: "RhythmLoader", variant: "rhythm", Loader: RhythmLoader });

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-zb-loader]");

describe("RhythmLoader", () => {
  it("draws one complex on a baseline, three times over", () => {
    const view = render(<RhythmLoader label="Loading" />);
    const paths = [...view.container.querySelectorAll("path")];

    expect(paths).toHaveLength(3);
    expect(paths.every((p) => p.getAttribute("d") === LOADER_ART.strip)).toBe(true);
    expect(paths[0]).toHaveClass("zb-loader__track");
    expect(paths[1]).toHaveClass("zb-loader__tail");
    expect(paths[2]).toHaveClass("zb-loader__head");
  });

  it("is a rhythm strip rather than a decorative zig-zag", () => {
    // P wave, then the QRS spike, then the T wave — the order and the
    // proportions a clinician actually reads. The QRS must be the tallest
    // excursion and must sit between the two rounded waves.
    const strip = LOADER_ART.strip;
    const points = [...strip.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((m) => ({
      x: Number(m[1]),
      y: Number(m[2]),
    }));

    const baseline = 36;
    expect(points.length).toBeGreaterThan(6);

    // SVG y grows downward, so the R wave is the minimum y.
    const peakY = Math.min(...points.map((p) => p.y));
    const troughY = Math.max(...points.map((p) => p.y));
    const peakX = points.filter((p) => p.y === peakY).map((p) => p.x)[0] ?? Number.NaN;
    const troughX = points.filter((p) => p.y === troughY).map((p) => p.x)[0] ?? Number.NaN;

    expect(baseline - peakY).toBeGreaterThan(20);
    // The S wave dips below the baseline immediately after it.
    expect(troughY).toBeGreaterThan(baseline);
    expect(troughX).toBeGreaterThan(peakX);
    // And the complex sits in the middle of the strip, not at either end.
    expect(peakX).toBeGreaterThan(40);
    expect(peakX).toBeLessThan(160);
  });

  it("never scales anything — the whole point of this loader", () => {
    // Pulse beats; this one only sweeps. A scaling element here would break
    // its use inline in a table row.
    const view = render(<RhythmLoader label="Loading" />);
    expect(view.container.querySelector(".zb-loader__beat")).toBeNull();
    expect(view.container.querySelector(".zb-loader__core")).toBeNull();
  });

  it("stays legible at the smallest inline size", () => {
    const view = render(<RhythmLoader label="Loading" size="sm" />);
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-size")).toBe("20px");
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-stroke")).toBe("2px");
    // Unlike Pulse, it does not swap away at small sizes; it is the small size.
    expect(root(view.container)).toHaveAttribute("data-zb-loader", "rhythm");
  });

  it("defaults to a medium step rather than a page-sized one", () => {
    const view = render(<RhythmLoader label="Loading" />);
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-size")).toBe("56px");
  });

  it.each([
    [52, "1154ms"],
    [60, "1000ms"],
    [100, "600ms"],
  ])("converts %i bpm to a %s period", (bpm, expected) => {
    const view = render(<RhythmLoader label="Loading" bpm={bpm} />);
    expect(root(view.container)?.style.getPropertyValue("--zb-loader-beat")).toBe(expected);
  });

  it("clamps bpm to the resting range like every cardiac loader", () => {
    const fast = render(<RhythmLoader label="Loading" bpm={220} />);
    expect(root(fast.container)?.style.getPropertyValue("--zb-loader-beat")).toBe("600ms");
  });
});

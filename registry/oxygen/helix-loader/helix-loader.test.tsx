import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HelixLoader } from "./helix-loader";
import { describeLoaderContract } from "../../../test/loader-suite";

describeLoaderContract({ name: "HelixLoader", variant: "helix", Loader: HelixLoader });

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-ox-loader]");

function dots(container: HTMLElement) {
  return [...container.querySelectorAll<SVGCircleElement>(".ox-loader__dot")];
}

describe("HelixLoader", () => {
  it("renders two strands of nine", () => {
    const view = render(<HelixLoader label="Loading" />);
    expect(dots(view.container)).toHaveLength(18);
  });

  it("offsets the second strand by half a turn, which is what crosses them", () => {
    const view = render(<HelixLoader label="Loading" />);
    const phases = dots(view.container).map((dot) =>
      Number(dot.style.getPropertyValue("--ox-loader-phase")),
    );
    const [strandA, strandB] = [phases.slice(0, 9), phases.slice(9)];

    strandA.forEach((phase, index) => {
      expect(strandB[index]).toBeCloseTo(phase - 0.5, 5);
    });
  });

  it("walks each column a ninth of a turn later than the last", () => {
    // A shared phase would render nine dots bobbing in unison rather than a
    // rotation.
    const view = render(<HelixLoader label="Loading" />);
    const strandA = dots(view.container)
      .slice(0, 9)
      .map((dot) => Number(dot.style.getPropertyValue("--ox-loader-phase")));

    strandA.slice(1).forEach((phase, index) => {
      expect(phase - Number(strandA[index])).toBeCloseTo(-1 / 9, 5);
    });
  });

  it("gives every dot a distinct phase", () => {
    const view = render(<HelixLoader label="Loading" />);
    const phases = dots(view.container).map((dot) =>
      dot.style.getPropertyValue("--ox-loader-phase"),
    );
    expect(new Set(phases).size).toBe(18);
  });

  it("spaces the columns evenly across the strand", () => {
    const view = render(<HelixLoader label="Loading" />);
    const xs = dots(view.container)
      .slice(0, 9)
      .map((dot) => Number(dot.getAttribute("cx")));

    xs.slice(1).forEach((x, index) => {
      expect(x - Number(xs[index])).toBe(17);
    });
  });

  it("pairs each strand-B dot with a strand-A dot at the same column", () => {
    const view = render(<HelixLoader label="Loading" />);
    const all = dots(view.container).map((dot) => dot.getAttribute("cx"));
    expect(all.slice(0, 9)).toEqual(all.slice(9));
  });

  it("uses no 3D transform, so it composites the same in every browser", () => {
    const view = render(<HelixLoader label="Loading" />);
    expect(view.container.innerHTML).not.toMatch(/rotate[XY3]|perspective|preserve-3d/);
  });

  it("draws a baseline the strands turn around", () => {
    const view = render(<HelixLoader label="Loading" />);
    const line = view.container.querySelector("line");
    expect(line).not.toBeNull();
    expect(line).toHaveClass("ox-loader__track");
  });

  it("uses a finer stroke than the cardiac loaders, since only the line is stroked", () => {
    const view = render(<HelixLoader label="Loading" />);
    expect(root(view.container)?.style.getPropertyValue("--ox-loader-stroke")).toBe("1.5px");
  });

  it("defaults to a wide step, because it is a landscape mark", () => {
    const view = render(<HelixLoader label="Loading" />);
    expect(root(view.container)?.style.getPropertyValue("--ox-loader-size")).toBe("88px");
  });
});

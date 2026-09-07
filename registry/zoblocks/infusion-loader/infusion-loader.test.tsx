import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InfusionLoader, slugWidth } from "./infusion-loader";
import { describeLoaderContract } from "../../../test/loader-suite";

describeLoaderContract({ name: "InfusionLoader", variant: "infusion", Loader: InfusionLoader });

const root = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-zb-loader]");
const slug = (container: HTMLElement) => container.querySelector(".zb-loader__slug");

describe("InfusionLoader", () => {
  /* ---------------------------------------------------------------- */
  /* Indeterminate — the honest unknown                                */
  /* ---------------------------------------------------------------- */

  describe("indeterminate", () => {
    it("stays a status region and claims no value", () => {
      const view = render(<InfusionLoader label="Preparing the export" />);
      const element = root(view.container);
      expect(element).toHaveAttribute("role", "status");
      expect(element).not.toHaveAttribute("aria-valuenow");
      expect(element).toHaveAttribute("data-zb-determinate", "false");
    });

    it("drifts at a fixed width rather than pretending to fill", () => {
      const view = render(<InfusionLoader label="Preparing the export" />);
      expect(slug(view.container)).toHaveAttribute("width", "48");
    });

    it("shows no percentage", () => {
      const view = render(<InfusionLoader label="Preparing the export" showLabel />);
      expect(view.container.textContent).not.toMatch(/\d+%/);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Determinate — a real measurement                                  */
  /* ---------------------------------------------------------------- */

  describe("determinate", () => {
    it("becomes a progressbar with a full ARIA value set", () => {
      const view = render(<InfusionLoader label="Importing records" progress={42} />);
      const element = root(view.container);

      expect(element).toHaveAttribute("role", "progressbar");
      expect(element).toHaveAttribute("aria-valuemin", "0");
      expect(element).toHaveAttribute("aria-valuemax", "100");
      expect(element).toHaveAttribute("aria-valuenow", "42");
      expect(element).toHaveAttribute("aria-valuetext", "42 percent");
      expect(element).toHaveAttribute("data-zb-determinate", "true");
    });

    it("stops being a live region, because a progressbar is not announced by content", () => {
      const view = render(<InfusionLoader label="Importing records" progress={42} />);
      expect(root(view.container)).not.toHaveAttribute("aria-live");
    });

    it("takes its accessible name from the label a sighted reader sees", () => {
      // Two sources of truth for the name is how a progressbar ends up
      // announcing something different from what is on screen.
      const view = render(<InfusionLoader label="Importing records" progress={42} showLabel />);
      const element = root(view.container);
      const labelId = element?.getAttribute("aria-labelledby");

      expect(labelId).toBeTruthy();
      const label = view.container.querySelector(`#${CSS.escape(labelId ?? "")}`);
      expect(label?.textContent).toBe("Importing records");
      expect(label).toHaveClass("zb-loader__label");
    });

    it("shows the percentage beside the label", () => {
      const view = render(<InfusionLoader label="Importing records" progress={42} showLabel />);
      expect(view.container.textContent).toContain("42%");
    });

    it.each([
      [0, 30],
      [25, 56.5],
      [42, 74.52],
      [50, 83],
      [100, 136],
    ])("fills to %i%% at width %s", (progress, expected) => {
      const view = render(<InfusionLoader label="Importing" progress={progress} />);
      expect(Number(slug(view.container)?.getAttribute("width"))).toBeCloseTo(expected, 2);
    });

    it("never renders an empty track at zero", () => {
      // 0% still has to look like a bar someone is watching rather than a
      // component that failed to render.
      const view = render(<InfusionLoader label="Importing" progress={0} />);
      expect(Number(slug(view.container)?.getAttribute("width"))).toBeGreaterThan(0);
    });

    it.each([
      [-40, 0],
      [140, 100],
      [Number.NaN, 0],
    ])("clamps a progress of %s to %i", (progress, expected) => {
      const view = render(<InfusionLoader label="Importing" progress={progress} />);
      expect(root(view.container)).toHaveAttribute("aria-valuenow", String(expected));
    });

    it("rounds fractional progress for the announcement but not for the fill", () => {
      const view = render(<InfusionLoader label="Importing" progress={42.6} />);
      expect(root(view.container)).toHaveAttribute("aria-valuenow", "43");
      expect(Number(slug(view.container)?.getAttribute("width"))).toBeCloseTo(slugWidth(42.6), 5);
    });

    it("is monotonic: more progress is never a narrower slug", () => {
      let previous = 0;
      for (let percent = 0; percent <= 100; percent += 5) {
        const width = slugWidth(percent);
        expect(width).toBeGreaterThanOrEqual(previous);
        previous = width;
      }
    });
  });

  it("draws a capsule track and exactly one slug", () => {
    const view = render(<InfusionLoader label="Importing" progress={50} />);
    const rects = view.container.querySelectorAll("rect");
    expect(rects).toHaveLength(2);
    expect(rects[0]).toHaveClass("zb-loader__track");
    expect(rects[1]).toHaveClass("zb-loader__slug");
  });

  it("keeps the slug inside the capsule at full", () => {
    const view = render(<InfusionLoader label="Importing" progress={100} />);
    const track = view.container.querySelector(".zb-loader__track");
    const bar = slug(view.container);

    const trackRight = Number(track?.getAttribute("x")) + Number(track?.getAttribute("width"));
    const slugRight = Number(bar?.getAttribute("x")) + Number(bar?.getAttribute("width"));
    expect(slugRight).toBeLessThanOrEqual(trackRight);
  });
});

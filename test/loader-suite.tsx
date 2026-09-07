/**
 * The behaviour every Zoblocks loader shares, as one reusable suite.
 *
 * Five loaders differ only in their art. Everything a reader hears, everything
 * a timing decision does, and every rule about motion is in the frame they all
 * render inside — so asserting it five times by hand would be five chances to
 * assert it slightly differently, and the one that drifted would be the one
 * nobody noticed.
 *
 * Per-loader behaviour (the beat, the swap, the determinate slug) lives in that
 * loader's own test file. This is the floor.
 */

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";
import { itMeetsTheContract } from "./contract";

export interface LoaderSuiteOptions {
  /** Display name used in the test titles. */
  name: string;
  /** The value of `data-zb-loader` this component sets. */
  variant: string;
  Loader: ComponentType<Record<string, unknown>>;
}

/** The root element the loader rendered, or null when it rendered nothing. */
function root(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>("[data-zb-loader]");
}

export function describeLoaderContract({ name, variant, Loader }: LoaderSuiteOptions): void {
  describe(`${name} — shared loader contract`, () => {
    itMeetsTheContract(name, () => <Loader label="Loading results" />);

    /* ---------------------------------------------------------------- */
    /* Identity and structure                                            */
    /* ---------------------------------------------------------------- */

    it("marks itself with its variant name", () => {
      const view = render(<Loader label="Loading results" />);
      expect(root(view.container)).toHaveAttribute("data-zb-loader", variant);
    });

    it("renders exactly one SVG, and hides it from assistive technology", () => {
      const view = render(<Loader label="Loading results" />);
      const svgs = view.container.querySelectorAll("svg");
      expect(svgs).toHaveLength(1);
      // The art sits inside an aria-hidden wrapper. A decorative mark that
      // announces itself is a second, meaningless label on every wait.
      expect(view.container.querySelector(".zb-loader__art")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("keeps the art out of the tab order", () => {
      const view = render(<Loader label="Loading results" />);
      // focusable="false" matters in IE-era SVG and in some AT; more
      // importantly nothing here should ever take focus.
      expect(view.container.querySelector("svg")).toHaveAttribute("focusable", "false");
      expect(view.container.querySelector("[tabindex]")).toBeNull();
    });

    /* ---------------------------------------------------------------- */
    /* What a reader hears                                               */
    /* ---------------------------------------------------------------- */

    it("announces the wait politely by default", () => {
      const view = render(<Loader label="Loading results" />);
      const element = root(view.container);
      expect(element).toHaveAttribute("role", "status");
      expect(element).toHaveAttribute("aria-live", "polite");
    });

    it("keeps the label in the DOM even when it is not shown", () => {
      // An empty live region announces nothing at all, so a hidden label is
      // still a rendered label.
      const view = render(<Loader label="Loading your results" showLabel={false} />);
      expect(view.container.textContent).toContain("Loading your results");
      expect(view.container.querySelector(".zb-loader__sr")).not.toBeNull();
    });

    it("shows the label as text when asked", () => {
      render(<Loader label="Loading your results" showLabel />);
      expect(screen.getByText("Loading your results")).toHaveClass("zb-loader__label");
    });

    it("shows the label by default in page and overlay modes", () => {
      const view = render(<Loader label="Loading your results" mode="page" />);
      expect(view.container.querySelector(".zb-loader__label")).not.toBeNull();
    });

    it("can be silenced for a region that is already live", () => {
      const view = render(<Loader label="Loading results" announce="off" />);
      expect(root(view.container)).not.toHaveAttribute("aria-live");
    });

    it("can escalate to assertive", () => {
      const view = render(<Loader label="Loading results" announce="assertive" />);
      expect(root(view.container)).toHaveAttribute("aria-live", "assertive");
    });

    it("renders a hint only alongside a visible label", () => {
      const shown = render(<Loader label="Loading" showLabel hint="This can take a moment." />);
      expect(shown.container.textContent).toContain("This can take a moment.");

      const hidden = render(<Loader label="Loading" showLabel={false} hint="Hidden hint." />);
      expect(hidden.container.textContent).not.toContain("Hidden hint.");
    });

    /* ---------------------------------------------------------------- */
    /* Placement                                                         */
    /* ---------------------------------------------------------------- */

    it.each([
      ["inline", "zb-loader--inline"],
      ["overlay", "zb-loader--overlay"],
      ["page", "zb-loader--page"],
    ])("places itself for mode=%s", (mode, expected) => {
      const view = render(<Loader label="Loading" mode={mode} />);
      expect(root(view.container)).toHaveClass(expected);
    });

    it("draws a scrim behind overlay and page, and never inline", () => {
      const overlay = render(<Loader label="Loading" mode="overlay" />);
      expect(root(overlay.container)).toHaveAttribute("data-zb-scrim", "true");

      const off = render(<Loader label="Loading" mode="overlay" scrim={false} />);
      expect(root(off.container)).toHaveAttribute("data-zb-scrim", "false");

      const inline = render(<Loader label="Loading" mode="inline" />);
      expect(root(inline.container)).not.toHaveAttribute("data-zb-scrim");
    });

    it("merges a caller's className instead of replacing its own", () => {
      const view = render(<Loader label="Loading" className="my-8" />);
      const element = root(view.container);
      expect(element).toHaveClass("zb-loader");
      expect(element).toHaveClass("my-8");
    });

    it("passes unknown props through to the root element", () => {
      const view = render(<Loader label="Loading" id="boot" data-testid="passthrough" />);
      expect(view.container.querySelector("#boot")).not.toBeNull();
      expect(screen.getByTestId("passthrough")).toBeInTheDocument();
    });

    /* ---------------------------------------------------------------- */
    /* Motion                                                            */
    /* ---------------------------------------------------------------- */

    it.each(["auto", "reduced", "full"])("records motion=%s for CSS to act on", (motion) => {
      const view = render(<Loader label="Loading" motion={motion} />);
      expect(root(view.container)).toHaveAttribute("data-zb-motion", motion);
    });

    /* ---------------------------------------------------------------- */
    /* Colour discipline                                                 */
    /* ---------------------------------------------------------------- */

    it("uses no hard-coded colour anywhere in its markup", () => {
      // Every colour must resolve through a semantic token so a brand override
      // reaches it, and so forced-colors mode can discard it safely.
      const view = render(<Loader label="Loading" mode="page" showLabel hint="hint" />);
      const markup = view.container.innerHTML;
      expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(markup).not.toMatch(/\brgba?\(/);
      expect(markup).not.toMatch(/\bhsla?\(/);
      expect(markup).not.toMatch(/--zb-ref-/);
    });

    it("sizes itself through a custom property rather than a hard-coded width", () => {
      const view = render(<Loader label="Loading" size={64} />);
      expect(root(view.container)?.style.getPropertyValue("--zb-loader-size")).toBe("64px");
    });

    it.each([
      ["sm", "20px"],
      ["md", "32px"],
      ["lg", "56px"],
      ["xl", "88px"],
    ])("resolves the %s size step to %s", (size, expected) => {
      const view = render(<Loader label="Loading" size={size} />);
      expect(root(view.container)?.style.getPropertyValue("--zb-loader-size")).toBe(expected);
    });

    it("clamps an absurd size rather than rendering it", () => {
      const view = render(<Loader label="Loading" size={9000} />);
      expect(root(view.container)?.style.getPropertyValue("--zb-loader-size")).toBe("480px");
    });

    /* ---------------------------------------------------------------- */
    /* Timing                                                            */
    /* ---------------------------------------------------------------- */

    describe("timing", () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());

      it("stays off screen until the delay elapses", () => {
        const view = render(<Loader label="Loading" delay={200} />);
        expect(root(view.container)).toBeNull();

        act(() => void vi.advanceTimersByTime(199));
        expect(root(view.container)).toBeNull();

        act(() => void vi.advanceTimersByTime(1));
        expect(root(view.container)).not.toBeNull();
      });

      it("never appears at all when the wait resolves inside the delay", () => {
        // The whole point of `delay`: a 120ms fetch must not flash a loader.
        const view = render(<Loader label="Loading" delay={200} open />);
        act(() => void vi.advanceTimersByTime(120));
        view.rerender(<Loader label="Loading" delay={200} open={false} />);
        act(() => void vi.advanceTimersByTime(500));
        expect(root(view.container)).toBeNull();
      });

      it("stays for its minimum duration once it has appeared", () => {
        const view = render(<Loader label="Loading" minDuration={400} open />);
        expect(root(view.container)).not.toBeNull();

        act(() => void vi.advanceTimersByTime(100));
        view.rerender(<Loader label="Loading" minDuration={400} open={false} />);
        // Closed after 100ms of a 400ms floor: still on screen.
        expect(root(view.container)).not.toBeNull();

        act(() => void vi.advanceTimersByTime(300));
        expect(root(view.container)).toBeNull();
      });

      it("leaves immediately once the minimum has already passed", () => {
        const view = render(<Loader label="Loading" minDuration={400} open />);
        act(() => void vi.advanceTimersByTime(500));
        view.rerender(<Loader label="Loading" minDuration={400} open={false} />);
        act(() => void vi.advanceTimersByTime(0));
        expect(root(view.container)).toBeNull();
      });

      it("admits a stall, in words, and says what is still possible", () => {
        const view = render(<Loader label="Loading" showLabel slowAfter={8000} />);
        expect(view.container.textContent).not.toContain("Still loading");

        act(() => void vi.advanceTimersByTime(8000));
        expect(view.container.textContent).toContain("Still loading");
        expect(view.container.textContent).toContain("go back");
      });

      it("reports the stall to the application exactly once", () => {
        const onSlow = vi.fn();
        render(<Loader label="Loading" slowAfter={1000} onSlow={onSlow} />);

        act(() => void vi.advanceTimersByTime(1000));
        expect(onSlow).toHaveBeenCalledTimes(1);

        act(() => void vi.advanceTimersByTime(5000));
        expect(onSlow).toHaveBeenCalledTimes(1);
      });

      it("does not restart the stall timer when onSlow is a fresh closure", () => {
        // The common shape is `onSlow={() => track()}`, a new function every
        // render. If that restarted the timer, the callback would never fire.
        const onSlow = vi.fn();
        const view = render(<Loader label="Loading" slowAfter={1000} onSlow={() => onSlow()} />);

        act(() => void vi.advanceTimersByTime(600));
        view.rerender(<Loader label="Loading" slowAfter={1000} onSlow={() => onSlow()} />);
        act(() => void vi.advanceTimersByTime(400));

        expect(onSlow).toHaveBeenCalledTimes(1);
      });

      it("never claims a stall when slowAfter is disabled", () => {
        const onSlow = vi.fn();
        const view = render(
          <Loader label="Loading" showLabel slowAfter={0} onSlow={onSlow} hint="Working." />,
        );
        act(() => void vi.advanceTimersByTime(60_000));
        expect(onSlow).not.toHaveBeenCalled();
        expect(view.container.textContent).toContain("Working.");
      });

      it("clears the stall when the wait is reopened", () => {
        const view = render(<Loader label="Loading" showLabel slowAfter={1000} open />);
        act(() => void vi.advanceTimersByTime(1000));
        expect(view.container.textContent).toContain("Still loading");

        view.rerender(<Loader label="Loading" showLabel slowAfter={1000} open={false} />);
        act(() => void vi.advanceTimersByTime(1000));
        view.rerender(<Loader label="Loading" showLabel slowAfter={1000} open />);
        expect(view.container.textContent).not.toContain("Still loading");
      });

      it("lets the application replace the stall wording", () => {
        const view = render(
          <Loader
            label="Loading"
            showLabel
            slowAfter={100}
            slowHint="The records service is slow right now. Your work is saved."
          />,
        );
        act(() => void vi.advanceTimersByTime(100));
        expect(view.container.textContent).toContain("Your work is saved.");
      });

      it("renders actions for someone who has waited too long", () => {
        const view = render(
          <Loader label="Loading" showLabel actions={<button type="button">Go back</button>} />,
        );
        expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
        expect(view.container.querySelector(".zb-loader__actions")).not.toBeNull();
      });
    });
  });
}

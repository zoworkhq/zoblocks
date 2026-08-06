import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ClinicalSkeleton, ProgressiveSection } from "./clinical-skeleton";

describe("ClinicalSkeleton", () => {
  /**
   * "A skeleton shaped like a lab result invites the reader to fill in the
   * blank." Placeholders are layout, never a number.
   */
  it("renders no digits that could be mistaken for a value", () => {
    const view = render(<ClinicalSkeleton rows={3} />);
    expect(view.container.textContent ?? "").not.toMatch(/\d/);
  });

  it("hides itself from assistive technology or names itself as loading", () => {
    const view = render(<ClinicalSkeleton rows={2} />);
    const root = view.container.firstElementChild;
    const hidden = root?.getAttribute("aria-hidden") === "true";
    const busy = view.container.querySelector("[aria-busy='true'],[role='status']");
    expect(hidden || busy !== null).toBe(true);
  });

  it("renders the number of rows it was asked for", () => {
    const two = render(<ClinicalSkeleton rows={2} />).container.querySelectorAll("*").length;
    const six = render(<ClinicalSkeleton rows={6} />).container.querySelectorAll("*").length;
    expect(six).toBeGreaterThan(two);
  });
});

describe("ProgressiveSection", () => {
  /**
   * The dangerous outcome is a screen that renders five sections and silently
   * omits the sixth: five of eight medications displayed as though they were
   * all of them. "failed" and "stale" must be visible facts.
   */
  it("states that a failed section failed rather than rendering empty", () => {
    const view = render(
      <ProgressiveSection state="failed" label="Medications" failureDetail="Pharmacy timed out" />,
    );
    const text = view.container.textContent ?? "";
    expect(text).toMatch(/could not|failed|unavailable|error/i);
    expect(text).toContain("Medications");
  });

  it("does not render a failed section as though it were empty", () => {
    const failed = render(<ProgressiveSection state="failed" label="Medications" />).container
      .textContent;
    const loaded = render(
      <ProgressiveSection state="loaded" label="Medications">
        <p>Nothing recorded</p>
      </ProgressiveSection>,
    ).container.textContent;
    expect(failed).not.toEqual(loaded);
  });

  /** Stale data is data — but the reader must know it may have moved on. */
  it("marks a stale section as stale while still showing its content", () => {
    const view = render(
      <ProgressiveSection state="stale" label="Vitals" cachedAtLabel="Cached 08:40">
        <p>HR 72</p>
      </ProgressiveSection>,
    );
    const text = view.container.textContent ?? "";
    expect(text).toContain("HR 72");
    expect(text).toMatch(/stale|cached|08:40|not current/i);
  });

  it("shows the skeleton, not the children, while loading", () => {
    const view = render(
      <ProgressiveSection state="loading" label="Vitals">
        <p>HR 72</p>
      </ProgressiveSection>,
    );
    expect(view.container.textContent).not.toContain("HR 72");
  });

  it("shows the children once loaded", () => {
    const view = render(
      <ProgressiveSection state="loaded" label="Vitals">
        <p>HR 72</p>
      </ProgressiveSection>,
    );
    expect(view.container.textContent).toContain("HR 72");
  });

  it("offers a retry on failure", async () => {
    const onRetry = vi.fn();
    render(<ProgressiveSection state="failed" label="Medications" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("never renders nothing at all, in any state", () => {
    for (const state of ["loading", "loaded", "failed", "stale"] as const) {
      const view = render(<ProgressiveSection state={state} label="Vitals" />);
      expect(
        (view.container.textContent ?? "").trim().length + view.container.innerHTML.length,
      ).toBeGreaterThan(0);
    }
  });
});

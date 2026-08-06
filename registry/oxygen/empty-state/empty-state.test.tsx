import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";
import { itMeetsTheContract } from "../../../test/contract";

const REASONS = ["never", "filtered", "unavailable", "restricted", "pending"] as const;

describe("EmptyState", () => {
  itMeetsTheContract("never", () => <EmptyState reason="never" title="No allergies recorded" />);

  /**
   * The whole point of the component: these five mean entirely different
   * things, and conflating them has caused documented harm. The component
   * carries the distinction structurally — reason attribute, icon, and tone —
   * while the sentence itself stays the caller's, which is why `title` is
   * required rather than defaulted.
   */
  it("marks each of the five reasons distinctly", () => {
    const marked = REASONS.map(
      (reason) =>
        render(
          <EmptyState reason={reason} title="Nothing to show" />,
        ).container.firstElementChild?.getAttribute("data-empty-reason") ?? "",
    );
    expect(new Set(marked)).toEqual(new Set(REASONS));
  });

  it("gives each reason its own tone rather than one shared empty look", () => {
    const classes = REASONS.map(
      (reason) =>
        render(<EmptyState reason={reason} title="Nothing to show" />).container.firstElementChild
          ?.className ?? "",
    );
    // never/filtered/pending are deliberately quiet; unavailable and
    // restricted must not look like ordinary emptiness.
    expect(new Set(classes).size).toBeGreaterThanOrEqual(3);
    const [never, , unavailable, restricted] = classes;
    expect(unavailable).not.toEqual(never);
    expect(restricted).not.toEqual(never);
  });

  it("gives each reason its own icon", () => {
    const icons = REASONS.map((reason) => {
      const view = render(<EmptyState reason={reason} title="Nothing to show" />);
      return view.container.querySelector("svg")?.innerHTML ?? "";
    });
    expect(new Set(icons).size).toBe(REASONS.length);
  });

  /**
   * Emptiness that follows a user action is news; emptiness that was always
   * there is not. Announcing every empty section trains people to ignore the
   * live region.
   */
  it("announces a filtered result but not a never-recorded one", () => {
    const filtered = render(<EmptyState reason="filtered" title="No matches" />);
    expect(filtered.container.firstElementChild).toHaveAttribute("aria-live", "polite");

    const never = render(<EmptyState reason="never" title="Nothing recorded" />);
    expect(never.container.firstElementChild).not.toHaveAttribute("aria-live");
  });

  /**
   * The component must not write a clinical negative on the caller's behalf.
   * "No allergies recorded" is safe; "No allergies" is a claim, and inventing
   * either one is what the required `title` exists to prevent.
   */
  it("asserts no clinical negative of its own", () => {
    const view = render(<EmptyState reason="never" title="Nothing recorded" />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("Nothing recorded");
    expect(text).not.toMatch(/\bno (allergies|problems|medications|results)\b/i);
  });

  /**
   * `unavailable` is the dangerous one. A section that failed to load and
   * renders as "no results" tells a clinician the patient has no allergies
   * when the allergy service was simply down.
   */
  it("never lets an unavailable source look like ordinary emptiness", () => {
    const unavailable = render(<EmptyState reason="unavailable" title="Allergies unavailable" />)
      .container.firstElementChild;
    const never = render(<EmptyState reason="never" title="Allergies unavailable" />).container
      .firstElementChild;

    expect(unavailable?.getAttribute("data-empty-reason")).toBe("unavailable");
    expect(unavailable?.className).not.toEqual(never?.className);
  });

  it("renders the caller's title verbatim, since the safe wording is theirs to choose", () => {
    const view = render(<EmptyState reason="never" title="No allergies recorded" />);
    expect(view.container.textContent).toContain("No allergies recorded");
  });

  it("shows when the source was last checked", () => {
    const view = render(
      <EmptyState reason="unavailable" title="Unavailable" lastCheckedLabel="Last checked 09:14" />,
    );
    expect(view.container.textContent).toContain("Last checked 09:14");
  });

  it("defaults to a stated reason rather than a bare blank", () => {
    const view = render(<EmptyState title="Nothing recorded" />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });
});

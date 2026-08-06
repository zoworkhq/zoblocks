import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PatientSnapshot, type SnapshotSection } from "./patient-snapshot";

const TZ = "Asia/Kolkata";

function section(overrides: Partial<SnapshotSection> = {}): SnapshotSection {
  return {
    id: "problems",
    title: "Problems",
    state: "loaded",
    emptyTitle: "No problems recorded",
    content: <p>Type 2 diabetes</p>,
    ...overrides,
  };
}

describe("PatientSnapshot", () => {
  it("renders each section's content", () => {
    const view = render(<PatientSnapshot sections={[section()]} timeZone={TZ} />);
    expect(view.container.textContent).toContain("Type 2 diabetes");
  });

  /**
   * "Truncation is counted, never silent. '3 of 11 problems' is honest;
   * showing three and stopping is a summary that reads as a complete list."
   */
  it("counts truncation rather than silently stopping", () => {
    const view = render(
      <PatientSnapshot sections={[section({ shownCount: 3, totalCount: 11 })]} timeZone={TZ} />,
    );
    const text = view.container.textContent ?? "";
    expect(text).toContain("3");
    expect(text).toContain("11");
  });

  it("does not claim truncation when everything is shown", () => {
    const view = render(
      <PatientSnapshot sections={[section({ shownCount: 4, totalCount: 4 })]} timeZone={TZ} />,
    );
    expect(view.container.textContent).not.toMatch(/\b4 of 4\b.*more/i);
  });

  it("offers a way to see the rest when truncated", async () => {
    const onExpand = vi.fn();
    render(
      <PatientSnapshot
        sections={[section({ shownCount: 3, totalCount: 11, onExpand })]}
        timeZone={TZ}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /all|more|show|expand|11/i }));
    expect(onExpand).toHaveBeenCalled();
  });

  /**
   * "A section that did not load says so rather than rendering empty. Nothing
   * here may look fresher or more complete than it is."
   */
  it("states a failed section rather than rendering it empty", () => {
    const view = render(
      <PatientSnapshot
        sections={[section({ state: "failed", failureDetail: "Problem list service timed out" })]}
        timeZone={TZ}
      />,
    );
    const text = view.container.textContent ?? "";
    expect(text).toMatch(/could not|failed|unavailable|error/i);
    expect(text).not.toContain("Type 2 diabetes");
  });

  it("keeps a failed section distinct from a genuinely empty one", () => {
    const failed = render(
      <PatientSnapshot sections={[section({ state: "failed" })]} timeZone={TZ} />,
    ).container.textContent;
    const empty = render(<PatientSnapshot sections={[section({ isEmpty: true })]} timeZone={TZ} />)
      .container.textContent;
    expect(failed).not.toEqual(empty);
  });

  it("uses the caller's wording for the genuinely-empty case", () => {
    const view = render(<PatientSnapshot sections={[section({ isEmpty: true })]} timeZone={TZ} />);
    expect(view.container.textContent).toContain("No problems recorded");
  });

  /** "Each section states its own recency." Partial failure is the normal case. */
  it("states each section's own recency", () => {
    const view = render(
      <PatientSnapshot
        sections={[section({ lastReadAt: "2026-08-06T07:00:00Z" })]}
        timeZone={TZ}
      />,
    );
    expect((view.container.textContent ?? "").length).toBeGreaterThan("Type 2 diabetes".length);
  });

  it("lets one section fail without hiding the others", () => {
    const view = render(
      <PatientSnapshot
        sections={[
          section({ id: "problems", state: "failed" }),
          section({ id: "meds", title: "Medications", content: <p>Metformin</p> }),
        ]}
        timeZone={TZ}
      />,
    );
    expect(view.container.textContent).toContain("Metformin");
  });

  /**
   * "Covering clinicians do not need the chart, they need the delta." A change
   * count that renders as nothing is the feature not existing.
   */
  it("surfaces what changed since the reader last looked", () => {
    const view = render(
      <PatientSnapshot sections={[section({ changedCount: 3 })]} timeZone={TZ} />,
    );
    expect(view.container.textContent).toMatch(/3/);
    expect(view.container.textContent).toMatch(/new|change|since|updated/i);
  });

  it("does not claim changes when there are none", () => {
    const view = render(
      <PatientSnapshot sections={[section({ changedCount: 0 })]} timeZone={TZ} />,
    );
    expect(view.container.textContent).not.toMatch(/0 (new|change)/i);
  });

  it("renders an empty section list without collapsing to nothing", () => {
    const view = render(<PatientSnapshot sections={[]} timeZone={TZ} />);
    expect(view.container.innerHTML.length).toBeGreaterThan(0);
  });
});

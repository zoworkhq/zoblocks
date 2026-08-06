import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { coverages } from "@oxygenui-design/fixtures";
import { CoverageCard } from "./coverage-card";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");

describe("CoverageCard", () => {
  itMeetsTheContract("active", () => <CoverageCard coverage={coverages.active} asOf={AS_OF} />);

  /**
   * `status: "active"` is not sufficient. A record can carry an active status
   * while its period has already ended, and acting on lapsed coverage produces
   * a denied claim and a surprise bill for the patient.
   */
  it("treats a lapsed period as lapsed even when the status says active", () => {
    expect(coverages.lapsed.status).toBe("active");
    const view = render(<CoverageCard coverage={coverages.lapsed} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/lapsed|expired|ended|not active|no longer/i);
  });

  it("does not present a lapsed coverage the same as an active one", () => {
    const active = render(<CoverageCard coverage={coverages.active} asOf={AS_OF} />).container
      .textContent;
    const lapsed = render(<CoverageCard coverage={coverages.lapsed} asOf={AS_OF} />).container
      .textContent;
    expect(active).not.toEqual(lapsed);
  });

  it("marks a coverage that has not started yet as future", () => {
    const view = render(<CoverageCard coverage={coverages.future} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/not yet|future|begins|starts|from/i);
  });

  /** These screens are read at shared desks and over shoulders. */
  it("masks the member identifier when asked", () => {
    const plain = render(<CoverageCard coverage={coverages.active} asOf={AS_OF} />).container
      .textContent;
    const masked = render(<CoverageCard coverage={coverages.active} asOf={AS_OF} maskIdentifiers />)
      .container.textContent;

    expect(masked).not.toEqual(plain);
    const memberId = coverages.active.subscriberId;
    if (memberId) expect(masked).not.toContain(memberId);
  });

  it("still identifies the coverage when masked, so it stays usable", () => {
    const view = render(<CoverageCard coverage={coverages.active} asOf={AS_OF} maskIdentifiers />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("renders a missing coverage as absent rather than blank", () => {
    const view = render(<CoverageCard coverage={undefined} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text.trim().length).toBeGreaterThan(0);
  });

  it("renders a loading state without claiming coverage is absent", () => {
    const view = render(<CoverageCard coverage={undefined} loading asOf={AS_OF} />);
    expect(view.container.textContent).not.toContain("undefined");
  });
});

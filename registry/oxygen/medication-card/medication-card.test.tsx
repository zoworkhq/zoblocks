import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { medications } from "@oxygenui-design/fixtures";
import { MedicationCard, MedicationList } from "./medication-card";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");

describe("MedicationCard", () => {
  itMeetsTheContract("active", () => <MedicationCard request={medications.active} asOf={AS_OF} />);

  /**
   * "Expired" is derived, not stored: FHIR has no expired status, so a request
   * still `active` past its dispense validity period must be surfaced as
   * expired rather than presented as current.
   */
  it("derives expiry from the validity period rather than trusting the status", () => {
    expect(medications.expired.status).toBe("active");
    const view = render(<MedicationCard request={medications.expired} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/expired|no longer valid|lapsed|out of date/i);
  });

  it("does not present an expired order as current", () => {
    const active = render(<MedicationCard request={medications.active} asOf={AS_OF} />).container
      .textContent;
    const expired = render(<MedicationCard request={medications.expired} asOf={AS_OF} />).container
      .textContent;
    expect(active).not.toEqual(expired);
  });

  /**
   * A paused drug and a drug that ran out of refills lead to opposite next
   * actions. Collapsing them into one greyed-out treatment loses that.
   */
  it("keeps on-hold, stopped, and expired distinct from one another", () => {
    const text = (r: (typeof medications)["active"]) =>
      render(<MedicationCard request={r} asOf={AS_OF} />).container.textContent;

    const onHold = text(medications.onHold);
    const stopped = text(medications.stopped);
    const expired = text(medications.expired);

    expect(new Set([onHold, stopped, expired]).size).toBe(3);
  });

  it("states each non-active status in words", () => {
    expect(
      render(<MedicationCard request={medications.onHold} asOf={AS_OF} />).container.textContent,
    ).toMatch(/hold|paused|suspended/i);
    expect(
      render(<MedicationCard request={medications.stopped} asOf={AS_OF} />).container.textContent,
    ).toMatch(/stopped|discontinued|cancelled/i);
  });

  it("says so when no dosage instruction was recorded", () => {
    const view = render(<MedicationCard request={medications.noDosage} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text).toMatch(/not recorded|no dosage|not specified|not stated|unknown/i);
  });

  it("renders a missing request as absent rather than blank", () => {
    const view = render(<MedicationCard request={undefined} asOf={AS_OF} />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
    expect(view.container.textContent).not.toContain("undefined");
  });
});

describe("MedicationList", () => {
  it("renders every order it is given", () => {
    const view = render(<MedicationList requests={medications.list} asOf={AS_OF} />);
    expect(view.container.textContent).not.toContain("undefined");
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("renders an empty list as an empty state rather than nothing", () => {
    const view = render(<MedicationList requests={[]} asOf={AS_OF} />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });
});

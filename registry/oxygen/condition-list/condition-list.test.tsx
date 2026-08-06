import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { conditions } from "@oxygenui-design/fixtures";
import { ConditionList } from "./condition-list";
import { itMeetsTheContract } from "../../../test/contract";

describe("ConditionList", () => {
  itMeetsTheContract("list", () => <ConditionList conditions={conditions.list} />);

  /**
   * FHIR permits `onsetString` ("in childhood") alongside `onsetDateTime`.
   * Coercing a vague onset into a false precise date is a common and quietly
   * damaging bug — the invented date then gets copied into a note as fact.
   */
  it("renders a vague onset as recorded, without inventing a date", () => {
    const view = render(<ConditionList conditions={[conditions.vagueOnset]} />);
    const onset = conditions.vagueOnset.onsetString;
    expect(onset).toBeTruthy();
    expect(view.container.textContent).toContain(onset);
    expect(view.container.textContent).not.toContain("Invalid Date");
  });

  it("marks a provisional diagnosis as provisional", () => {
    const view = render(<ConditionList conditions={[conditions.provisional]} />);
    expect(view.container.textContent).toMatch(/provisional|working|unconfirmed/i);
  });

  it("keeps provisional distinct from confirmed", () => {
    const provisional = render(<ConditionList conditions={[conditions.provisional]} />).container
      .textContent;
    const confirmed = render(<ConditionList conditions={[conditions.active]} />).container
      .textContent;
    expect(provisional).not.toEqual(confirmed);
  });

  /** A problem list is not a log — the reader must see at a glance what is current. */
  it("separates resolved entries from active ones", () => {
    const view = render(<ConditionList conditions={conditions.list} separateInactive />);
    expect(view.container.textContent).toMatch(/resolved|inactive|past/i);
  });

  it("names an empty problem list rather than rendering nothing", () => {
    const view = render(<ConditionList conditions={[]} />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("treats an undefined list as unrecorded", () => {
    const view = render(<ConditionList conditions={undefined} />);
    expect(view.container.textContent).not.toContain("undefined");
  });

  it("renders a loading state that is not an empty state", () => {
    const view = render(<ConditionList conditions={undefined} loading />);
    expect(view.container.textContent).not.toContain("undefined");
  });
});

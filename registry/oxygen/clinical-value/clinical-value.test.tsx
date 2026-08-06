import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClinicalValue } from "./clinical-value";
import { itMeetsTheContract, expectStatedInWords } from "../../../test/contract";

describe("ClinicalValue", () => {
  itMeetsTheContract("quantity", () => (
    <ClinicalValue quantity={{ value: 4.2, unit: "mmol/L" }} field="Potassium" />
  ));

  it("renders the value with its unit", () => {
    const view = render(<ClinicalValue quantity={{ value: 4.2, unit: "mmol/L" }} />);
    expect(view.container.textContent).toContain("4.2");
    expect(view.container.textContent).toContain("mmol/L");
  });

  /**
   * A comparator is not decoration. "<0.01" and "0.01" are different results,
   * and dropping the comparator turns an undetectable level into a measured
   * one. This is the single highest-consequence assertion in the file.
   */
  it.each([
    ["<", 0.01],
    [">", 90],
    ["<=", 5],
    [">=", 120],
  ] as const)("preserves the %s comparator", (comparator, value) => {
    const view = render(<ClinicalValue quantity={{ value, unit: "mmol/L", comparator }} />);
    const text = view.container.textContent ?? "";
    expect(text).toMatch(new RegExp(`[<>≤≥]`));
    expect(text).toContain(String(value));
  });

  it("never renders a comparator value as though it were exact", () => {
    const bounded = render(
      <ClinicalValue quantity={{ value: 0.01, unit: "ng/mL", comparator: "<" }} />,
    ).container.textContent;
    const exact = render(<ClinicalValue quantity={{ value: 0.01, unit: "ng/mL" }} />).container
      .textContent;
    expect(bounded).not.toEqual(exact);
  });

  it("renders an absent value as absent rather than blank", () => {
    const view = render(<ClinicalValue absentReason={{ coding: [{ code: "not-performed" }] }} />);
    expectStatedInWords(view, /not performed/i);
  });

  it("falls back to absence when given neither quantity nor text", () => {
    const view = render(<ClinicalValue field="Potassium" />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
    expect(view.container.textContent).not.toContain("undefined");
  });

  it("renders a text value when the result is not numeric", () => {
    const view = render(<ClinicalValue text="No growth at 48 hours" />);
    expect(view.container.textContent).toContain("No growth at 48 hours");
  });

  it("keeps a zero value visible instead of treating it as missing", () => {
    const view = render(<ClinicalValue quantity={{ value: 0, unit: "mL" }} />);
    expect(view.container.textContent).toContain("0");
  });

  /**
   * Rule 1 of the component's contract: precision is never changed. A lab that
   * reported 5.125 meant 5.125; re-rounding for display discards information
   * the source deliberately included.
   */
  it.each([5.125, 0.5, 120, 0.001, 98.6])("renders %s without re-rounding it", (value) => {
    const view = render(<ClinicalValue quantity={{ value, unit: "mmol/L" }} />);
    const digits = (view.container.textContent ?? "").match(/[\d.]+/)?.[0];
    expect(digits).toBe(String(value));
  });

  /**
   * `tone` is emphasis, not severity — the component's own words. Severity is
   * stated by StatusBadge and the row. If tone ever starts injecting severity
   * text, the value could contradict the interpretation printed beside it.
   */
  it("treats tone as emphasis only and does not assert a severity in words", () => {
    const toned = render(
      <ClinicalValue quantity={{ value: 6.8, unit: "mmol/L" }} tone="critical" />,
    ).container.textContent;
    const plain = render(<ClinicalValue quantity={{ value: 6.8, unit: "mmol/L" }} />).container
      .textContent;
    expect(toned).toEqual(plain);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DoseInput } from "./dose-input";
import { itMeetsTheContract } from "../../../test/contract";

const UNITS = ["mg", "mL", "units"];

function renderDose(props: Partial<React.ComponentProps<typeof DoseInput>> = {}) {
  const onChange = vi.fn();
  const view = render(
    <DoseInput label="Dose" value="" onChange={onChange} units={UNITS} unit="mg" {...props} />,
  );
  return { ...view, onChange };
}

describe("DoseInput", () => {
  itMeetsTheContract("empty", () => (
    <DoseInput label="Dose" value="" onChange={() => {}} units={UNITS} unit="mg" />
  ));

  /**
   * ISMP rule: "1.0 mg" read past the decimal point is 10 mg. The trailing
   * zero must be flagged — and flagged, not silently rewritten, because a
   * silent rewrite of a dose is its own hazard.
   */
  it("flags a trailing zero rather than silently rewriting it", () => {
    const { container, onChange } = renderDose({ value: "1.0" });
    expect(container.textContent).toMatch(/trailing zero|1 mg|misread/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  /**
   * ISMP rule: ".5 mg" read past the decimal point is 5 mg. A leading zero is
   * required.
   */
  it("flags a missing leading zero rather than silently rewriting it", () => {
    const { container, onChange } = renderDose({ value: ".5" });
    expect(container.textContent).toMatch(/leading zero|0\.5|misread/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("accepts a correctly formatted dose without complaint", () => {
    const { container } = renderDose({ value: "0.5" });
    expect(container.textContent).not.toMatch(/leading zero|trailing zero/i);
  });

  /**
   * Plausibility and abnormality are different. A soft warning states its
   * reason and does not block; conflating the two is how prescribers learn to
   * click through both.
   */
  it("warns without blocking on an implausible but possible dose", () => {
    const { container } = renderDose({ value: "400", plausibleMax: 100, absoluteMax: 1000 });
    expect(container.textContent).toMatch(/unusual|check|plausib|higher than|confirm/i);
    const input = screen.getByLabelText(/dose/i);
    expect(input).not.toBeDisabled();
    expect(input).toHaveValue("400");
  });

  it("blocks and states the limit above the absolute maximum", () => {
    const { container } = renderDose({ value: "5000", plausibleMax: 100, absoluteMax: 1000 });
    expect(container.textContent).toMatch(/1000|maximum/i);
  });

  it("keeps the soft warning and the hard block visibly different", () => {
    const soft = renderDose({ value: "400", plausibleMax: 100, absoluteMax: 1000 }).container
      .textContent;
    const hard = renderDose({ value: "5000", plausibleMax: 100, absoluteMax: 1000 }).container
      .textContent;
    expect(soft).not.toEqual(hard);
  });

  /**
   * A calculator that returns a bare number invites use with a stale weight,
   * so the arithmetic stays on screen.
   */
  it("shows the weight and the per-kg rate alongside a calculated dose", () => {
    const { container } = renderDose({ value: "50", dosePerKg: 2.5, weightKg: 20 });
    expect(container.textContent).toContain("2.5");
    expect(container.textContent).toContain("20");
  });

  it("labels the input so it is reachable by name", () => {
    renderDose({ value: "5" });
    expect(screen.getByLabelText(/dose/i)).toBeInTheDocument();
  });

  /**
   * Deliberately a text input, not `type="number"`. A number spinner puts a
   * dose one scroll-wheel notch from a different dose, and silently discards
   * input the browser considers malformed — including the ISMP patterns this
   * component exists to flag.
   */
  it("is not a number spinner", () => {
    renderDose({ value: "1.0" });
    expect(screen.getByLabelText(/dose/i)).toHaveAttribute("type", "text");
  });

  it("offers only the units it was given", () => {
    renderDose({ value: "5" });
    const options = Array.from(screen.getByLabelText(/unit/i).querySelectorAll("option")).map(
      (o) => o.textContent,
    );
    for (const option of options) {
      expect(UNITS).toContain(option);
    }
  });

  it("does not render a value as though it were zero when empty", () => {
    const { container } = renderDose({ value: "" });
    expect(container.textContent).not.toMatch(/\bNaN\b/);
  });
});

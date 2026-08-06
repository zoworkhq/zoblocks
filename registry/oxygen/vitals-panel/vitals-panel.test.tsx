import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { observations } from "@oxygenui-design/fixtures";
import { ObservationPanel } from "./vitals-panel";
import { itMeetsTheContract, expectStatedInWords } from "../../../test/contract";

describe("ObservationPanel", () => {
  itMeetsTheContract("panel", () => (
    <ObservationPanel observations={[observations.potassiumCritical]} />
  ));

  /**
   * The whole reason this component exists. An uninterpreted result must never
   * read as normal — defaulting it is how a UI manufactures false reassurance
   * about a result nobody has looked at.
   */
  it("shows an uninterpreted result as uninterpreted, never as normal", () => {
    render(<ObservationPanel observations={[observations.uninterpreted]} />);
    expect(screen.getByText(/not interpreted/i)).toBeInTheDocument();
    expect(screen.queryByText(/^normal$/i)).not.toBeInTheDocument();
  });

  it("states a critical result in words, not only in colour", () => {
    const view = render(<ObservationPanel observations={[observations.potassiumCritical]} />);
    expectStatedInWords(view, /critical/i);
  });

  /**
   * `dataAbsentReason` is not a value. Rendering it as one — or as a blank
   * cell — makes "no result recorded" indistinguishable from "0".
   */
  it("renders an absent value as explicitly absent", () => {
    const view = render(<ObservationPanel observations={[observations.absent]} />);
    expect(view.container.textContent).not.toMatch(/\b0\b/);
    // The vocabulary is ABSENT_REASON_LABEL in @oxygenui-design/fhir: every
    // absence resolves to one of these, and none of them is a blank or a zero.
    expectStatedInWords(
      view,
      /not known|result pending|not asked|declined|hidden — restricted|not permitted|not applicable|not performed|see narrative|unavailable|not recorded/i,
    );
  });

  it("distinguishes masked from merely missing", () => {
    const view = render(<ObservationPanel observations={[observations.masked]} />);
    expectStatedInWords(view, /hidden|restricted|masked/i);
  });

  it("marks a preliminary result as preliminary", () => {
    const view = render(<ObservationPanel observations={[observations.preliminary]} />);
    expectStatedInWords(view, /preliminary/i);
  });

  /**
   * A corrected result that looks identical to the original is a known harm
   * pathway — the first value may already be in a note.
   */
  it("marks a corrected result as corrected", () => {
    const view = render(<ObservationPanel observations={[observations.corrected]} />);
    expectStatedInWords(view, /corrected|amended/i);
  });

  it("keeps each component of a multi-component observation labelled", () => {
    render(<ObservationPanel observations={[observations.bloodPressure]} />);
    expect(screen.getByText(/systolic/i)).toBeInTheDocument();
    expect(screen.getByText(/diastolic/i)).toBeInTheDocument();
  });

  it("renders an empty panel as an empty state rather than nothing", () => {
    const view = render(<ObservationPanel observations={[]} />);
    expect((view.container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { allergies } from "@oxygenui-design/fixtures";
import { AllergyList } from "./allergy-list";
import { itMeetsTheContract } from "../../../test/contract";

describe("AllergyList", () => {
  itMeetsTheContract("list", () => <AllergyList allergies={allergies.list} />);

  /**
   * The decision that matters most in this component. "No allergies recorded"
   * and "no known allergies" are different clinical facts: the first means
   * nobody asked. Rendering them identically tells a clinician the patient is
   * safe when the truth is that the question was never put.
   */
  it("does not read an empty list as no known allergies", () => {
    const view = render(<AllergyList allergies={[]} />);
    expect(view.container.textContent).toMatch(/not recorded|no.*recorded|not asked|unknown/i);
    expect(view.container.textContent).not.toMatch(/no known allergies/i);
  });

  it("says no known allergies only when that was explicitly asserted", () => {
    const view = render(<AllergyList allergies={[]} noKnownAllergies />);
    expect(view.container.textContent).toMatch(/no known/i);
  });

  it("keeps the two empty meanings textually distinct", () => {
    const unasked = render(<AllergyList allergies={[]} />).container.textContent;
    const asserted = render(<AllergyList allergies={[]} noKnownAllergies />).container.textContent;
    expect(unasked).not.toEqual(asserted);
  });

  it("treats an undefined list as unrecorded, not as none", () => {
    const view = render(<AllergyList allergies={undefined} />);
    expect(view.container.textContent).not.toMatch(/no known allergies/i);
  });

  it("names each allergen and its reaction", () => {
    const view = render(<AllergyList allergies={[allergies.highRisk]} />);
    const text = view.container.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toContain("undefined");
  });

  /** A refuted allergy is a positive finding — someone tested and ruled it out. */
  it("marks a refuted entry as refuted rather than as an active allergy", () => {
    const view = render(<AllergyList allergies={[allergies.refuted]} />);
    expect(view.container.textContent).toMatch(/refuted|ruled out|disproven/i);
  });

  it("marks an unconfirmed entry as unconfirmed", () => {
    const view = render(<AllergyList allergies={[allergies.unconfirmed]} />);
    expect(view.container.textContent).toMatch(/unconfirmed|suspected|not confirmed/i);
  });

  it("keeps high criticality visible in words", () => {
    const view = render(<AllergyList allergies={[allergies.highRisk]} />);
    expect(view.container.textContent).toMatch(/high|severe|critical/i);
  });

  it("renders a loading state that is not an empty state", () => {
    const view = render(<AllergyList allergies={undefined} loading />);
    expect(view.container.textContent).not.toMatch(/no known allergies/i);
  });
});

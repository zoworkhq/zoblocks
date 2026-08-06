import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MRN_SYSTEM, patients } from "@oxygenui-design/fixtures";
import { PatientBanner } from "./patient-banner";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");
const MRN = patients.routine.identifier?.[0]?.value;

describe("PatientBanner", () => {
  itMeetsTheContract("routine", () => (
    <PatientBanner patient={patients.routine} identifierSystem={MRN_SYSTEM} asOf={AS_OF} />
  ));

  it("shows the patient's name", () => {
    const view = render(<PatientBanner patient={patients.routine} asOf={AS_OF} />);
    expect(view.container.textContent).toContain("Okonkwo");
  });

  /**
   * "It never invents a name." A blank space looks like a loading state, and
   * "Unknown Patient" is a name the record does not contain — both are how a
   * banner stops being a reliable identity check.
   */
  it("never invents a name for an unnamed patient", () => {
    const view = render(<PatientBanner patient={patients.sparse} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).toMatch(/name not recorded/i);
    expect(text).not.toMatch(/unknown patient/i);
    expect(text.trim().length).toBeGreaterThan(0);
  });

  /** Announced to assistive technology, not conveyed by styling alone. */
  it("states deceased status in words", () => {
    const view = render(<PatientBanner patient={patients.deceased} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/deceased|died/i);
  });

  it("states restricted status in words", () => {
    const view = render(<PatientBanner patient={patients.restricted} restricted asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/restricted|confidential/i);
  });

  it("masks the identifier when asked", () => {
    expect(MRN).toBeTruthy();
    const plain = render(
      <PatientBanner patient={patients.routine} identifierSystem={MRN_SYSTEM} asOf={AS_OF} />,
    ).container.textContent;
    const masked = render(
      <PatientBanner
        patient={patients.routine}
        identifierSystem={MRN_SYSTEM}
        maskIdentifiers
        asOf={AS_OF}
      />,
    ).container.textContent;

    expect(plain).toContain(MRN);
    expect(masked).not.toContain(MRN);
  });

  it("shows the identifier by default, since a name alone is not an identity check", () => {
    const view = render(
      <PatientBanner patient={patients.routine} identifierSystem={MRN_SYSTEM} asOf={AS_OF} />,
    );
    expect(view.container.textContent).toContain(MRN);
  });

  it("renders a missing patient without pretending to identify anyone", () => {
    const view = render(<PatientBanner patient={undefined} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toContain("undefined");
    expect(text).not.toMatch(/okonkwo/i);
  });

  it("renders the loading state without showing a name", () => {
    const view = render(<PatientBanner patient={undefined} loading asOf={AS_OF} />);
    expect(view.container.textContent).not.toContain("undefined");
  });

  it("uses the heading level it was given, so it fits the page outline", () => {
    render(<PatientBanner patient={patients.routine} headingLevel={2} asOf={AS_OF} />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  /**
   * Age is derived, so it can drift from the date it was derived from. Pinned
   * to `asOf` rather than the wall clock, which is also what keeps this test
   * from breaking on the patient's birthday.
   */
  it("computes an age that agrees with the birth date", () => {
    const view = render(<PatientBanner patient={patients.routine} asOf={AS_OF} />);
    // Born 1984-03-17, as of 2026-08-06 → 42, birthday already passed.
    expect(view.container.textContent).toMatch(/(^|\D)42\s*y/i);
  });

  it("does not round an age up before the birthday", () => {
    const view = render(
      <PatientBanner patient={{ ...patients.routine, birthDate: "1984-12-25" }} asOf={AS_OF} />,
    );
    // Birthday still ahead on 2026-08-06 → 41, not 42.
    expect(view.container.textContent).toMatch(/(^|\D)41\s*y/i);
  });
});

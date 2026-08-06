import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MRN_SYSTEM, patients } from "@oxygenui-design/fixtures";
import { IdentityToken } from "./identity-token";
import { itMeetsTheContract } from "../../../test/contract";

const AS_OF = new Date("2026-08-06T09:00:00Z");
const withPhoto = {
  ...patients.routine,
  photo: [{ url: "https://example.org/photo.jpg", contentType: "image/jpeg" }],
};

describe("IdentityToken", () => {
  itMeetsTheContract("routine", () => <IdentityToken patient={patients.routine} asOf={AS_OF} />);

  /**
   * "A photo renders only when consent is explicitly stated. Consent is not
   * assumed from the presence of a photo." The resource carrying an image is
   * not the same fact as permission to display it on a shared screen.
   */
  it("does not render a photo without explicit consent", () => {
    const view = render(<IdentityToken patient={withPhoto} asOf={AS_OF} />);
    expect(view.container.querySelector("img")).toBeNull();
  });

  it("renders the photo once consent is stated", () => {
    const view = render(<IdentityToken patient={withPhoto} photoConsent asOf={AS_OF} />);
    expect(view.container.querySelector("img")).not.toBeNull();
  });

  it("falls back to initials rather than to a blank avatar", () => {
    const view = render(<IdentityToken patient={patients.routine} asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/AO/);
  });

  /** An avatar is not a classifier — nothing here infers anything demographic. */
  it("derives initials from the name alone", () => {
    const a = render(
      <IdentityToken patient={{ ...patients.routine, gender: "male" }} asOf={AS_OF} />,
    ).container.textContent;
    const b = render(
      <IdentityToken patient={{ ...patients.routine, gender: "female" }} asOf={AS_OF} />,
    ).container.textContent;
    expect(a).toEqual(b);
  });

  /**
   * "A name alone does not distinguish two people called J. Patel." The
   * secondary identifier is shown by default for exactly that reason.
   */
  it("shows a secondary identifier by default", () => {
    const view = render(
      <IdentityToken
        patient={patients.routine}
        identifierSystem={MRN_SYSTEM}
        showDetail
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).toContain(patients.routine.identifier?.[0]?.value);
  });

  it("masks the identifier when asked", () => {
    const mrn = patients.routine.identifier?.[0]?.value;
    const view = render(
      <IdentityToken
        patient={patients.routine}
        identifierSystem={MRN_SYSTEM}
        showDetail
        maskIdentifiers
        asOf={AS_OF}
      />,
    );
    expect(view.container.textContent).not.toContain(mrn);
  });

  /** Rendered as text, not as an icon a reader has to already know. */
  it("states deceased in words", () => {
    const view = render(<IdentityToken patient={patients.deceased} showDetail asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/deceased|died/i);
  });

  it("flags a name-alike so a near-match is not mistaken for the patient", () => {
    const view = render(<IdentityToken patient={patients.routine} nameAlike asOf={AS_OF} />);
    expect(view.container.textContent).toMatch(/similar|alike|another patient|same name/i);
  });

  it("renders an unnamed patient without inventing a name", () => {
    const view = render(<IdentityToken patient={patients.sparse} asOf={AS_OF} />);
    const text = view.container.textContent ?? "";
    expect(text).not.toMatch(/unknown patient/i);
    expect(text).not.toContain("undefined");
  });

  it("renders a missing patient without identifying anyone", () => {
    const view = render(<IdentityToken patient={undefined} asOf={AS_OF} />);
    expect(view.container.textContent).not.toContain("undefined");
  });
});

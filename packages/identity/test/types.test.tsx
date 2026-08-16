import { describe, expect, it } from "vitest";
import { PatientBanner } from "../src/PatientBanner.js";
import { IdentityProvider } from "../src/IdentityProvider.js";
import * as F from "./fixtures.js";

/**
 * Type-level assertions.
 *
 * Everything here is checked by `tsc`, not by the runtime — a `@ts-expect-error`
 * that stops being an error fails the build. The `expect(true)` calls exist so
 * the file reads as a test suite; the real assertions are the comments above
 * them, and `pnpm typecheck` is what runs them.
 *
 * These are the invariants that would otherwise be review comments, and review
 * comments do not scale to 500 components.
 */
describe("two identifiers before an action — NPSG.01.01.01 as a type", () => {
  it("accepts one identifier for navigation", () => {
    const ok = (
      <PatientBanner patient={F.amaraA} context="navigation" identifiers={[{ kind: "mrn" }]} />
    );
    expect(ok).toBeTruthy();
  });

  it("accepts no identifiers at all for navigation", () => {
    const ok = <PatientBanner patient={F.amaraA} context="navigation" />;
    expect(ok).toBeTruthy();
  });

  it("accepts two identifiers for an action", () => {
    const ok = (
      <PatientBanner
        patient={F.withNhs}
        context="action"
        identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
      />
    );
    expect(ok).toBeTruthy();
  });

  it("rejects one identifier for an action", () => {
    const bad = (
      // @ts-expect-error — `context="action"` requires at least two identifiers.
      <PatientBanner patient={F.amaraA} context="action" identifiers={[{ kind: "mrn" }]} />
    );
    expect(bad).toBeTruthy();
  });

  it("rejects an action with no identifiers", () => {
    // @ts-expect-error — `identifiers` is required when the context is an action.
    const bad = <PatientBanner patient={F.amaraA} context="action" />;
    expect(bad).toBeTruthy();
  });

  it("rejects one identifier for a verification", () => {
    const bad = (
      // @ts-expect-error — verification is an action context.
      <PatientBanner patient={F.amaraA} context="verification" identifiers={[{ kind: "mrn" }]} />
    );
    expect(bad).toBeTruthy();
  });
});

describe("Patient.gender is not renderable", () => {
  it("accepts the four alternatives", () => {
    const ok = (
      <PatientBanner
        patient={F.withSpcu}
        context="navigation"
        fields={["name", "spcu", "gender-identity", "recorded-sex-or-gender"]}
      />
    );
    expect(ok).toBeTruthy();
  });

  it("rejects a request for administrative gender", () => {
    const bad = (
      <PatientBanner
        patient={F.withSpcu}
        context="navigation"
        // @ts-expect-error — administrative gender is not a renderable field.
        // Use "recorded-sex-or-gender", which renders it labelled as what it is.
        fields={["name", "gender"]}
      />
    );
    expect(bad).toBeTruthy();
  });
});

describe("identity is atomic", () => {
  it("accepts a patient, a loading flag, or an error — never a mixture", () => {
    expect(<PatientBanner patient={F.amaraA} context="navigation" />).toBeTruthy();
    expect(<PatientBanner loading context="navigation" />).toBeTruthy();
    expect(<PatientBanner error={new Error("x")} context="navigation" />).toBeTruthy();
  });

  it("rejects a patient alongside a loading flag", () => {
    const bad = (
      // @ts-expect-error — there is no shape that is both loaded and loading.
      <PatientBanner patient={F.amaraA} loading context="navigation" />
    );
    expect(bad).toBeTruthy();
  });

  it("rejects a banner with no source at all", () => {
    // @ts-expect-error — a banner must be given a patient, a loading flag, or an error.
    const bad = <PatientBanner context="navigation" />;
    expect(bad).toBeTruthy();
  });
});

describe("the legal name costs a sentence", () => {
  it("accepts the display default with no reason", () => {
    expect(<IdentityProvider>{null}</IdentityProvider>).toBeTruthy();
    expect(<IdentityProvider nameContext="display">{null}</IdentityProvider>).toBeTruthy();
  });

  it("accepts the legal name with a stated reason", () => {
    const ok = (
      <IdentityProvider nameContext="legal" legalNameReason="wristband">
        {null}
      </IdentityProvider>
    );
    expect(ok).toBeTruthy();
  });

  it("rejects the legal name with no reason", () => {
    const bad = (
      // @ts-expect-error — `nameContext="legal"` requires a `legalNameReason`.
      <IdentityProvider nameContext="legal">{null}</IdentityProvider>
    );
    expect(bad).toBeTruthy();
  });

  it("rejects a reason with no legal context, so the pair cannot drift", () => {
    const bad = (
      // @ts-expect-error — a reason without `nameContext="legal"` means nothing.
      <IdentityProvider legalNameReason="billing">{null}</IdentityProvider>
    );
    expect(bad).toBeTruthy();
  });
});

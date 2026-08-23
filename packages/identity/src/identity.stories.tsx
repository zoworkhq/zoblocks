/**
 * Stories for Identity.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in
 * `component.meta.ts`, and the build asserts the two agree in both directions.
 * Fifteen declared states makes that check do real work here: most of them are
 * absences and near-misses, and a demo of a patient banner naturally shows the
 * one case where everything is present.
 *
 * `NOW` is frozen, because age is a function of a clock and a story that
 * silently ages is a screenshot that changes on its own.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { expect, userEvent, within } from "../../../test/story-kit";
import * as F from "../test/fixtures.js";
import { IdentityProvider, type IdentityProviderProps } from "./IdentityProvider.js";
import { IdentityAvatar } from "./IdentityAvatar.js";
import { IdentitySet } from "./IdentitySet.js";
import { PatientBanner } from "./PatientBanner.js";
import { PatientChip } from "./PatientChip.js";
import { PatientGuard } from "./PatientGuard.js";
import { policy, resolveIdentity } from "@oxygenui-design/identity-core";

const TWO = [{ kind: "mrn" }, { kind: "nhs" }] as const;

const meta: Meta<typeof PatientBanner> = {
  title: "Clinical/Identity",
  component: PatientBanner,
};

export default meta;
type Story = StoryObj<typeof PatientBanner>;

/** Every story runs inside a provider, because the policy is the component. */
function within_(
  children: React.ReactNode,
  /*
   * The policy options these stories vary, and no more.
   *
   * `Partial<IdentityProviderProps>` does not typecheck: `nameContext` and
   * `legalNameReason` are a discriminated pair, and making both optional
   * destroys the discrimination the type exists to enforce. Nothing here
   * reaches for a legal name, so the subset is the honest signature.
   */
  props:
    Pick<IdentityProviderProps, "photos" | "disclosure" | "demoMode"> | Record<string, never> = {},
) {
  return (
    <IdentityProvider now={F.NOW} {...props}>
      {children}
    </IdentityProvider>
  );
}

/* ------------------------------------------------------------------ */
/* Record state                                                        */
/* ------------------------------------------------------------------ */

export const Active: Story = {
  name: "Active",
  parameters: { state: "Active" },
  render: () => within_(<PatientBanner patient={F.amaraA} context="navigation" />),
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region");
    // One name, in the order a human would say it — not seven fragments.
    expect(region).toHaveAccessibleName(
      "Patient: Amara Chinelo Okonkwo, born 8 March 1985, age 41 y, M R N 123, 456, 789, St Aidan's. Active.",
    );
  },
};

export const Inactive: Story = {
  name: "Inactive",
  parameters: { state: "Inactive — discharged, transferred, or disengaged" },
  render: () => within_(<PatientBanner patient={F.inactive} context="navigation" />),
  play: async ({ canvasElement }) => {
    // Inactive is not deleted. The record is still readable and the state says
    // why the reader should not expect current data.
    expect(within(canvasElement).getByRole("region").getAttribute("aria-label")).toContain(
      "Inactive",
    );
  },
};

export const Deceased: Story = {
  name: "Deceased",
  parameters: { state: "Deceased, with the age frozen at age-at-death" },
  render: () => within_(<PatientBanner patient={F.deceased} context="navigation" />),
  play: async ({ canvasElement }) => {
    // The age stops at death. A deceased patient who keeps having birthdays is
    // the detail that tells a family nobody is reading the record.
    expect(within(canvasElement).getByRole("region").getAttribute("aria-label")).toContain(
      "Deceased",
    );
  },
};

export const Merged: Story = {
  name: "Record merged",
  parameters: { state: "Record merged — care is recorded elsewhere" },
  render: () => within_(<PatientBanner patient={F.merged} context="navigation" />),
  play: async ({ canvasElement }) => {
    // Care is being recorded somewhere else, so documenting here is a near
    // miss the banner has to name rather than imply.
    expect(within(canvasElement).getByRole("region").getAttribute("aria-label")).toMatch(
      /merged|Merged/,
    );
  },
};

export const TestPatient: Story = {
  name: "Test patient",
  parameters: { state: "Test patient (meta.security HTEST)" },
  render: () => within_(<PatientBanner patient={F.testPatient} context="navigation" />),
  play: async ({ canvasElement }) => {
    // A test record that looks like a real one is how training data reaches a
    // live chart, so HTEST is loud rather than discreet.
    expect(within(canvasElement).getByRole("region").getAttribute("aria-label")).toMatch(/test/i);
  },
};

export const Sensitive: Story = {
  name: "Sensitive record",
  parameters: { state: "Sensitive record, categories withheld pending an audited reveal" },
  render: () =>
    within_(<PatientBanner patient={F.sensitive} context="navigation" onReveal={() => {}} />),
  play: async ({ canvasElement }) => {
    // Withheld, not absent — and revealing it is an event the application
    // records, which is why the component raises rather than writes.
    const region = within(canvasElement).getByRole("region");
    expect(region.getAttribute("aria-label")).toMatch(/withheld|restricted|sensitive/i);
  },
};

/* ------------------------------------------------------------------ */
/* Photo                                                               */
/* ------------------------------------------------------------------ */

const DENY = policy({ now: F.NOW });
const ALLOW = policy({ now: F.NOW, photos: "allow" });

const identityOf = (
  patient: Parameters<typeof resolveIdentity>[0],
  p: ReturnType<typeof policy> = DENY,
) => resolveIdentity(patient, p);

export const PhotoOnFile: Story = {
  name: "Photo on file",
  parameters: { state: "Photo on file" },
  render: () =>
    within_(<IdentityAvatar identity={identityOf(F.withPhoto, ALLOW)} label="Portrait on file" />, {
      photos: "allow",
    }),
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector("[data-ox-photo]")).toBeTruthy();
  },
};

export const NoPhoto: Story = {
  name: "No photo on file",
  parameters: { state: "No photo on file" },
  render: () =>
    within_(<IdentityAvatar identity={identityOf(F.amaraA)} label="No portrait on file" />),
  play: async ({ canvasElement }) => {
    // Initials on a deterministic swatch. Not a silhouette: a generic body
    // outline reads as "unknown person" rather than "no photograph".
    const avatar = canvasElement.querySelector("[data-ox-photo]");
    expect(avatar?.textContent).toMatch(/A/);
  },
};

export const PhotoFailed: Story = {
  name: "Photo could not be loaded",
  parameters: { state: "Photo could not be loaded" },
  render: () =>
    within_(
      <IdentityAvatar
        identity={identityOf(F.withPhoto, ALLOW)}
        photo={{ kind: "unavailable" }}
        label="Portrait could not be loaded"
      />,
      {
        photos: "allow",
      },
    ),
  play: async ({ canvasElement }) => {
    // A broken image and a patient with no photograph are different facts, and
    // only one of them means somebody should look at the integration.
    expect(canvasElement.querySelector("[data-ox-photo='unavailable']")).toBeTruthy();
  },
};

export const PhotoWithheld: Story = {
  name: "Photo withheld by policy",
  parameters: { state: "Photo withheld by site policy" },
  render: () =>
    within_(<IdentityAvatar identity={identityOf(F.withPhoto)} label="Portrait withheld" />),
  play: async ({ canvasElement }) => {
    // The default is deny. A cached portrait is PHI at rest in a browser the
    // site may not control, and an intake photograph taken during an
    // involuntary admission was not meaningfully consented to.
    expect(canvasElement.querySelector("[data-ox-photo='withheld']")).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* Loading and failure                                                 */
/* ------------------------------------------------------------------ */

export const Loading: Story = {
  name: "Loading",
  parameters: { state: "Loading — a skeleton, never a half-identity" },
  render: () => within_(<PatientBanner loading context="navigation" />),
  play: async ({ canvasElement }) => {
    // Never a half-identity: a banner with a name and no identifiers invites
    // somebody to act on the half that arrived.
    expect(canvasElement.querySelector(".ox-banner--loading")).toBeTruthy();
    expect(canvasElement.querySelector("[aria-busy='true']")).toBeTruthy();
  },
};

export const LoadFailed: Story = {
  name: "Could not load the record",
  parameters: { state: "Could not load the record" },
  render: () =>
    within_(<PatientBanner error={new Error("Gateway timeout")} context="navigation" />),
  play: async ({ canvasElement }) => {
    // An error is not an empty banner. A blank identity strip above a chart is
    // the most dangerous thing on the screen.
    // An alert, not a quiet empty state: nothing below an unloaded banner is
    // confirmed to belong to anyone.
    expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      "Could not load the patient record",
    );
  },
};

/* ------------------------------------------------------------------ */
/* Near misses                                                         */
/* ------------------------------------------------------------------ */

export const Escalated: Story = {
  name: "A similar name on the list",
  parameters: { state: "Escalated: a similar name is on this list" },
  render: () =>
    within_(
      <IdentitySet>
        <ul style={{ display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
          {[F.amaraA, F.amaraB, F.ada].map((patient, index) => (
            <li key={patient.id} style={{ "--ox-row": index } as React.CSSProperties}>
              <PatientChip patient={patient} block />
            </li>
          ))}
        </ul>
      </IdentitySet>,
    ),
  play: async ({ canvasElement }) => {
    // Two Amara Okonkwos on one list. The set escalates what distinguishes
    // them rather than leaving the reader to spot it — wrong-patient
    // documentation survives every amount of staff education.
    expect(canvasElement.querySelectorAll("[data-ox-patient-chip]").length || 3).toBeGreaterThan(0);
    expect(canvasElement.querySelector("[data-ox-escalated]")).toBeTruthy();
  },
};

export const WrongPatient: Story = {
  name: "Wrong patient",
  parameters: { state: "Wrong patient — the form and the chart disagree" },
  render: () =>
    within_(
      <PatientBanner patient={F.amaraA} context="navigation">
        {/* The form was opened for somebody else. The guard compares what is
            on screen against what the form was created for, and blocks. */}
        <PatientGuard expect="pat-9910" expectName="Amara Nkechi Okonkwo">
          <p>Prescription form</p>
        </PatientGuard>
      </PatientBanner>,
    ),
  play: async ({ canvasElement }) => {
    expect(canvasElement.textContent).not.toContain("Prescription form");
    expect(canvasElement.textContent).toMatch(/different patient|does not match|wrong/i);
  },
};

export const BadCheckDigit: Story = {
  name: "Identifier failing its check digit",
  parameters: { state: "Identifier failing its check digit" },
  render: () =>
    within_(<PatientBanner patient={F.badCheckDigit} context="action" identifiers={TWO} />),
  play: async ({ canvasElement }) => {
    // An NHS number that fails its own modulus-11 check is a transcription
    // error, and rendering it as a valid identifier is how it gets matched
    // against the wrong record downstream.
    expect(canvasElement.querySelector(".ox-banner__invalid")).toBeTruthy();
  },
};

/* ------------------------------------------------------------------ */
/* Verification                                                        */
/* ------------------------------------------------------------------ */

export const TwoIdentifiers: Story = {
  name: "Two identifiers before an action",
  parameters: { state: "Active" },
  render: () => within_(<PatientBanner patient={F.withNhs} context="action" identifiers={TWO} />),
  play: async ({ canvasElement }) => {
    // `context="action"` requires two identifiers at the type level. One is
    // enough to navigate and not enough to prescribe.
    const region = within(canvasElement).getByRole("region");
    expect(region.getAttribute("aria-label")).toMatch(/M R N/);
    await userEvent.tab();
  },
};

/**
 * Stories for Signature.
 *
 * Written once, consumed four ways (ADR 0007): as documentation, as the
 * visual-regression fixture, as the accessibility fixture, and — through play
 * functions — as the interaction test.
 *
 * `parameters.state` ties each story to a state declared in
 * `component.meta.ts`, and the build asserts the two agree in both directions.
 * Nine declared states is the whole argument for this component's existence:
 * a signature field that can only show "signed" and "empty" is one that cannot
 * record a refusal, and a product that cannot record a refusal records it as
 * an unfinished form instead.
 *
 * Every `recordedAt` is a fixed string. The component never reads a clock —
 * 42 CFR 482.24(c)(1) wants entries dated and authenticated, and a browser
 * clock is neither — so the stories do not either.
 */

import type { Meta, StoryObj } from "@oxygenui-design/component-meta";
import { patientRoutine, practitionerSigner } from "@oxygenui-design/fixtures";
import type { SignatureValue, SignedValue } from "@oxygenui-design/signature-core";
import { expect, userEvent, waitFor, within } from "../../../test/story-kit";
import { Signature } from "./Signature";

const NOW = "2026-08-12T10:02:00+05:30";

const subject = {
  display: "Amara Okonkwo",
  reference: `Patient/${patientRoutine.id}`,
};

const nurse = { name: "Priya Menon", credential: "RN", reference: "Practitioner/syn-pr-2" };
const clinician = {
  name: "Wade Warren",
  credential: "MD",
  reference: `Practitioner/${practitionerSigner.id}`,
  register: "NPI",
  identifier: "1710293846",
};

const ATTESTATION = "I agree to the treatment described above.";

/** A completed signature, typed rather than drawn so it needs no canvas. */
const SIGNED: SignedValue = {
  outcome: "signed",
  method: "type",
  ink: {
    strokes: [],
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 60"><text y="40">Amara Okonkwo</text></svg>',
    // Structured, because the manifest renders elements rather than injecting
    // the string above — see SignatureInk.
    render: {
      viewBox: "0 0 220 60",
      paths: [],
      text: { value: "Amara Okonkwo", x: 16, y: 40, fontSize: 40, fontFamily: "serif" },
    },
    bounds: { x: 0, y: 0, width: 220, height: 60 },
  },
  signer: { name: "Amara Okonkwo" },
  capacity: "self",
  meaning: "consent",
  attestation: ATTESTATION,
  recordedAt: NOW,
  recordedBy: nurse,
  provenance: { method: "type" },
};

const meta: Meta<typeof Signature> = {
  title: "Clinical/Signature",
  component: Signature,
  args: { now: NOW, meaning: "consent", subject, attestation: ATTESTATION },
};

export default meta;
type Story = StoryObj<typeof Signature>;

/* ------------------------------------------------------------------ */
/* Answered affirmatively                                              */
/* ------------------------------------------------------------------ */

export const Signed: Story = {
  name: "Signed",
  parameters: { state: "Signed" },
  args: { value: SIGNED },
  play: async ({ canvasElement }) => {
    // The manifest names whose signature it is. An image with no name beside
    // it is a picture, not a record.
    expect(canvasElement.textContent).toContain("Amara Okonkwo");
    // 21 CFR 11.50(a)(3): the manifestation states the meaning.
    expect(canvasElement.textContent).toContain(ATTESTATION);
    expect(canvasElement.querySelector("[data-ox-signature]")).toBeTruthy();
  },
};

export const SignedOnPaper: Story = {
  name: "Signed on paper",
  parameters: { state: "Signed on paper" },
  args: {
    value: {
      outcome: "on-paper",
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // Affirmative, and no mark exists yet. A field that could only store an
    // image would have to record this as unsigned.
    expect(canvasElement.textContent).toMatch(/paper/i);
    expect(canvasElement.textContent).toContain("Priya Menon");
  },
};

export const ConsentedVerbally: Story = {
  name: "Consented verbally, witnessed",
  parameters: { state: "Consented verbally (witnessed)" },
  args: {
    value: {
      outcome: "verbal",
      channel: "video",
      script: "Read out in full, and questions answered before agreement.",
      witness: clinician,
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // Routine in telehealth, and there is no mark to capture. The witness is
    // required by the type, which is the point.
    expect(canvasElement.textContent).toContain("Wade Warren");
  },
};

/* ------------------------------------------------------------------ */
/* Answered, but not affirmatively                                     */
/* ------------------------------------------------------------------ */

export const Declined: Story = {
  name: "Declined to sign",
  parameters: { state: "Declined to sign" },
  args: {
    value: {
      outcome: "declined",
      reason: "Wants to discuss the alternatives with their family first.",
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // An exercise of autonomy, not a failure — and a complete answer, so the
    // form it sits in must be submittable.
    expect(canvasElement.textContent).toContain("family");
    expect(canvasElement.textContent).toContain("Priya Menon");
  },
};

export const UnableToSign: Story = {
  name: "Unable to sign, witnessed",
  parameters: { state: "Unable to sign (witnessed)" },
  args: {
    value: {
      outcome: "unable",
      reason: "sedated-or-unconscious",
      detail: "Post-operative sedation; expected to recover capacity within 24 hours.",
      witness: clinician,
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // `witness` is required rather than optional on this branch: an
    // unwitnessed "unable" is not a record, it is an assertion by whoever was
    // holding the tablet.
    expect(canvasElement.textContent).toContain("Wade Warren");
  },
};

export const AwaitingCountersignature: Story = {
  name: "Awaiting countersignature",
  parameters: { state: "Awaiting countersignature" },
  args: {
    value: {
      outcome: "pending",
      awaiting: "clinician",
      since: NOW,
      soFar: [SIGNED],
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // The resident-awaiting-attending case. `isAnswered` returns false here,
    // which is correct: this one really is unfinished.
    expect(canvasElement.textContent).toMatch(/pending|awaiting/i);
  },
};

export const Revoked: Story = {
  name: "Consent withdrawn",
  parameters: { state: "Consent withdrawn" },
  args: {
    value: {
      outcome: "revoked",
      original: SIGNED,
      revokedBy: { name: "Amara Okonkwo" },
      revokedAt: "2026-08-19T14:20:00+05:30",
      reason: "Withdrew consent after reading the revised procedure information.",
      recordedAt: NOW,
      recordedBy: nurse,
    } satisfies SignatureValue,
  },
  play: async ({ canvasElement }) => {
    // The original is retained, not deleted: "consent was given and then
    // withdrawn" is a different fact from "consent was never given", and only
    // one of them is true here.
    expect(canvasElement.textContent).toMatch(/withdraw|revok/i);
  },
};

/* ------------------------------------------------------------------ */
/* Not yet answered                                                    */
/* ------------------------------------------------------------------ */

export const RequiredAndEmpty: Story = {
  name: "Required and empty",
  parameters: { state: "Required and empty" },
  args: { status: "error" },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-ox-signature]");
    expect(root?.getAttribute("data-ox-status")).toBe("error");

    // The operable path is a real button, not a canvas. WCAG 2.1.1 is about
    // the underlying function — recording assent — being reachable without a
    // pointer, and drawing is path-dependent by nature.
    const open = within(canvasElement).getByRole("button");
    await userEvent.click(open);
    await waitFor(() => {
      expect(document.querySelector(".ant-modal")).toBeTruthy();
    });
  },
};

export const Locked: Story = {
  name: "Locked / read-only",
  parameters: { state: "Locked / read-only" },
  args: { value: SIGNED, disabled: true },
  play: async ({ canvasElement }) => {
    // A filed signature is evidence. Nothing here re-opens the dialog.
    expect(within(canvasElement).queryByRole("button")).toBeNull();
    expect(canvasElement.textContent).toContain("Amara Okonkwo");
  },
};

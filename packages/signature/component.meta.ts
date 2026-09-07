import { defineComponentMeta } from "@zoblocks/component-meta";

/**
 * Signature is the first `package` component.
 *
 * It wraps Ant Design, and a component that copied antd's Modal, Tabs and Form
 * into someone's repository would not be "source you own" — it would be a fork
 * of a framework. So it ships on npm with antd as a peer dependency, which is
 * why this metadata lives beside the package rather than in `registry/zoblocks`.
 */
export default defineComponentMeta({
  name: "signature",
  title: "Signature",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",
  frameworks: {
    antd: {
      policy: "wrapping",
      inherits: [
        "Modal's focus trap and restore — a capture surface that loses focus on open is unusable by keyboard, and rebuilding it badly would undermine the component whose whole argument is accessibility.",
        "Form.Item's control contract, so `signatureRequired()` composes with the host's own validation rather than sitting beside it.",
        "Upload's file handling, including drag targets and the accept filter.",
      ],
      bridge: false,
    },
  },

  distribution: "package",
  packageName: "@zoblocks/signature",

  summary:
    "Signature capture that records the times nobody signed — declined, unable, verbal, on paper — not just the times they did.",

  tagline: "Signature capture that records the times nobody signed.",
  description:
    "Draw, type or upload a signature inside an Ant Design form, and record the outcomes a signature pad has no answer for. The value is a discriminated union over seven outcomes rather than a base64 string, so a refusal is a fact the record can hold.",
  rationale:
    "Almost every signature component solves one problem: get ink from a pointer onto a canvas and hand back a PNG. That is about fifteen percent of what a healthcare product needs. The rest is everything the PNG does not say — who signed, in what capacity, what they were agreeing to, and, most often of all, what to record when nobody signed at all. A patient who refused and a form nobody opened are different facts with different consequences, and a component whose only states are empty and signed makes the difference unrecordable. That is the same argument AbsentValue makes one tier down, at a much higher stake.",

  categories: ["Clinical", "Data Entry"],
  fhir: [
    {
      name: "Provenance",
      url: "https://hl7.org/fhir/R4/provenance.html",
    },
    {
      name: "Consent",
      url: "https://hl7.org/fhir/R4/consent.html",
    },
  ],

  states: [
    "Signed",
    "Declined to sign",
    "Unable to sign (witnessed)",
    "Consented verbally (witnessed)",
    "Signed on paper",
    "Awaiting countersignature",
    "Consent withdrawn",
    "Required and empty",
    "Locked / read-only",
  ],

  a11y: [
    {
      label: "Operable without a pointer",
      detail:
        "Drawing is a path-dependent input technique, and WCAG 2.1.1 (Level A) requires the underlying function — recording assent — to be operable by keyboard. The typed path is that mechanism, not a fallback, and a test signs the form using only tab and keyboard events. Removing it is a lint error.",
    },
    {
      label: "The canvas is not the control",
      detail:
        "A canvas has no implicit ARIA role, and role=img on a live capture surface would assert a non-interactive graphic. The widget is a labelled group with real DOM controls; the surface is aria-hidden and the operable path is native HTML.",
    },
    {
      label: "State is announced, because nothing else reports it",
      detail:
        "SVG and canvas changes are invisible to assistive technology. A polite live region announces capture and clearing, counting finished strokes only so it does not speak while someone is mid-signature.",
    },
    {
      label: "A finished signature is named by whose it is",
      detail:
        "The equivalent purpose of a signature image under SC 1.1.1 is whose it is and that it was given — never a description of the strokes. Alt text reads 'Signature of Josh Randall, signed 16 August 2026'.",
    },
    {
      label: "Legible under forced colors",
      detail:
        "The ink is currentColor on real SVG elements rather than a script-painted canvas bitmap, so it is recoloured with everything else instead of vanishing against a forced background.",
    },
    {
      label: "An unsigned document does not look signed",
      detail:
        "SignatureBlock renders declined, unable, verbal, on-paper, pending and revoked as a bordered notice with the words 'Not signed', never as a rule with a name beneath it. A reader skimming a letter must not come away believing an attestation exists; status is carried in text rather than by colour, so it survives monochrome print and forced colors.",
    },
    {
      label: "Targets meet the 24px floor",
      detail:
        "SC 2.5.8 exempts the canvas — a spatially-selected area counts as one target — so it is entirely a toolbar concern. Undo, redo and clear are all at least 24 by 24.",
    },
  ],

  guidance: {
    use: [
      "Consent forms, treatment authorisations, and anywhere a refusal must be recordable rather than left blank.",
      "Clinician attestation and countersignature, where the record must say who is accountable and in what capacity.",
      "Signing on behalf of someone — a parent for a minor, a proxy for an incapacitated adult — which the capacity field captures explicitly.",
      "Inside an Ant Design form: it satisfies the custom-control contract, so `Form.Item` wiring and validation status work with no adapter.",
      "SignatureBlock at the foot of a discharge summary, referral letter or policy approval, where the reader needs the signer's role and register — not the full audit record — to decide whether to act on it.",
    ],
    avoid: [
      "Controlled-substance prescribing. DEA EPCS is a separate and far stricter regime — identity proofing, two-factor, a certified application — and this does not satisfy it.",
      "Anywhere you need cryptographic non-repudiation from the component alone. A PNG of a mark carries no integrity guarantee; pair it with a detached JWS.",
      "As an identity check. It records the identity the host asserts and cannot verify it; 21 CFR 11.200's two-component rule lives in your auth layer.",
      "Storing a signature as a theme asset. A signature is credential data attached to a person, not brand data attached to an organisation, and a theme versions, publishes, rolls back and is served from a public URL — none of which a signature should do.",
      'Draw-only configurations. `methods={["draw"]}` is a WCAG Level A failure that renders perfectly and passes every other test.',
    ],
  },

  limitations: [
    "Ant Design is a peer dependency. This is the only Zoblocks component that is not distributed as copy-as-source, because copying antd's Modal and Form into a consumer's repository would be a fork rather than a component.",
    "Signature.data is a graphical signature only — an image of a mark. Deployments needing non-repudiation add a second Signature entry carrying a JWS.",
    "The timestamp is a required prop, not read from the clock. A browser clock is not evidence, and 42 CFR 482.24(c)(1) wants entries dated by whoever is accountable.",
    "Stroke biometrics are captured into the model but never emitted unless explicitly opted in, because whether stroke dynamics are a 'writing sample' is unsettled under BIPA and CUBI.",
    "Interpreter attestation, adopt-and-apply, and saved signatures are designed but not built.",
  ],

  related: ["clinical-note", "safety-plan", "identity"],

  usage: `import { Form } from "antd";
import { Signature, signatureRequired } from "@zoblocks/signature";
import "@zoblocks/signature/styles.css";

// signatureRequired() accepts a decline as an answer. A rule demanding
// outcome === "signed" would make refusal impossible to submit.
<Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
  <Signature
    now={serverTime}
    meaning="consent"
    attestation="I have read the information about this procedure, I have had the chance to ask questions, and I agree to go ahead."
    subject={{ display: "Randall, Josh", reference: "Patient/4471902" }}
    recordedBy={{ name: "A. Okafor", credential: "RN" }}
    outcomes={["declined", "unable", "verbal", "on-paper"]}
  />
</Form.Item>;`,

  technicalName: "Signature",
  aliases: ["signature pad", "consent signature", "e-signature", "sign and file", "attestation"],
  tags: ["form-control", "data-entry", "keyboard-first", "print-safe", "themeable"],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Consent, attestation and clinical sign-off. The value is a discriminated union over seven outcomes rather than string | null, because a patient who refused to sign and a form nobody opened are different facts with different consequences — and only one of them is a reason to stop.",
    workflows: ["intake", "documentation", "treatment-planning"],
    phi: {
      handles: true,
      notes:
        "Captures a signature image, the signer's name and role, and a server-supplied timestamp — all PHI. The stroke buffer never leaves the browser except in the emitted Bundle, and `now` is a required prop rather than a Date.now() call so the recorded time is the server's and is testable.",
    },
    auditable: true,
    permissions: ["provenance.write", "consent.write"],
    terminology: ["FHIR", "SNOMED CT"],
  },

  uxGuidelines: {
    do: [
      "Pass a server-supplied `now`. A signature timestamped by the client's clock is not evidence.",
      "State the attestation above the pad, in the words the signer is agreeing to.",
      "Offer decline as a first-class outcome, not a cancel button.",
      "Record a witness when the outcome is `unable` — it is a compile error without one.",
    ],
    dont: [
      'Do not treat an empty pad as "not signed yet". It is indistinguishable from a refusal unless the outcome says which.',
      "Do not ship a draw-only pad. A signature reachable only by pointer fails WCAG 2.1.1 and is a lint error here.",
      "Do not write the signature into Consent — R4 and R5 carry no signature element on it. Only Provenance.signature does.",
    ],
  },

  variants: [
    {
      id: "draw",
      label: "Draw",
      description: "Pointer or stylus. The default on a tablet at the bedside.",
      args: { methods: ["draw"] },
    },
    {
      id: "type",
      label: "Type",
      description:
        "A typed name rendered in a cursive face. The keyboard-reachable path, and never the only one offered.",
      args: { methods: ["type"] },
    },
    {
      id: "upload",
      label: "Upload",
      description: "An image of a wet signature, for a form that arrived on paper.",
      args: { methods: ["upload"] },
    },
    {
      id: "all",
      label: "All three",
      description: "The house default. Every signer has a path that works for them.",
      args: { methods: ["draw", "type", "upload"] },
    },
  ],

  controls: [
    {
      prop: "meaning",
      control: "select",
      label: "Meaning",
      // The eight ISO/ASTM E1762 purposes the type admits, not a shorter list
      // of the familiar ones. 21 CFR 11.50(a)(3) makes the meaning part of what
      // a compliant manifestation must state, so hiding five is not a trim.
      options: [
        "consent",
        "verification",
        "author",
        "coauthor",
        "validation",
        "witness",
        "interpreter",
        "review",
      ],
      defaultValue: "consent",
    },
    {
      prop: "methods",
      control: "segmented",
      label: "Capture methods",
      options: ["draw", "type", "upload"],
      defaultValue: "draw",
    },
    {
      prop: "outcomes",
      control: "select",
      label: "Non-signed outcomes offered",
      options: ["declined", "unable", "verbal", "on-paper"],
    },
    { prop: "disabled", control: "switch", label: "Disabled", defaultValue: false },
    {
      prop: "status",
      control: "segmented",
      label: "Validation status",
      options: ["error", "warning"],
    },
    { prop: "attestation", control: "text", label: "Attestation text" },
    {
      prop: "captureBiometrics",
      control: "switch",
      label: "Capture biometrics",
      defaultValue: false,
    },
    { prop: "onChange", control: "event", label: "onChange" },
  ],

  a11yChecks: [
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "One test signs the whole form using tab() and keyboard() only, never dispatching a pointer event. A draw-only pad is a lint error.",
      evidence: "Signature.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: "The pad is a labelled control with its current outcome in the accessible name, not a bare canvas.",
      evidence: "Signature.test.tsx",
    },
    {
      wcag: "3.3.1",
      name: "Error identification",
      status: "pass",
      how: "signatureRequired() accepts a decline as a valid answer, so refusing is submittable rather than an error state.",
      evidence: "Signature.test.tsx",
    },
    {
      wcag: "3.3.2",
      name: "Labels or instructions",
      status: "pass",
      how: "The attestation is rendered above the pad and is part of the control's accessible description.",
      evidence: "Signature.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "Pad border, baseline and focus ring are gated in the token build across three themes.",
      evidence: "contrast.gate",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "Every method control and the clear affordance hold a 24px minimum.",
      evidence: "e2e/docs-site.spec.ts",
    },
    {
      wcag: "2.4.11",
      name: "Focus not obscured",
      status: "pass",
      how: "The signing dialog returns focus to the invoking control and never leaves it behind the sticky footer.",
      evidence: "e2e/docs-site.spec.ts",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No session timeout is imposed by the component.",
    },
  ],

  fixtures: [
    "patientRoutine",
    "practitionerSigner",
    "practitionerWitness",
    "consentTreatment",
    "consentDeclined",
    "provenanceConsent",
  ],

  examples: [
    {
      id: "consent-in-a-form",
      title: "Consent inside an antd Form",
      description:
        'The common case. `signatureRequired()` treats a decline as a valid answer — a rule demanding outcome === "signed" would make refusal impossible to submit.',
      fixture: "patientRoutine",
      code: `import { Form } from "antd";
import { Signature, signatureRequired } from "@zoblocks/signature";
import "@zoblocks/signature/styles.css";

<Form.Item name="consent" rules={[signatureRequired()]}>
  <Signature
    now={serverTime}
    meaning="consent"
    attestation="I agree to the treatment described above."
  />
</Form.Item>;`,
    },
    {
      id: "refusal",
      title: "The patient who refused to sign",
      description:
        "Seven outcomes, not two. A refusal and an unopened form are different clinical facts, and the union makes it impossible to record them the same way.",
      fixture: "consentDeclined",
      code: `// The value is a discriminated union, so this compiles only if every
// outcome is handled — including the three that are not "signed".
switch (value.outcome) {
  case "signed":   return file(value.image, value.signedAt);
  case "declined": return recordRefusal(value.reason, value.recordedAt);
  case "unable":   return recordUnable(value.reason, value.witness); // witness is required
  case "verbal":   return recordVerbal(value.witness);
  case "on-paper": return awaitScan();
  case "pending":  return null;
  case "revoked":  return revoke(value.revokedAt);
}`,
    },
    {
      id: "provenance-bundle",
      title: "What it emits, and why it is not a Consent",
      description:
        "Consent carries no signature element in R4 or R5 — only Provenance.signature does. The component emits a transaction Bundle so the two land together or not at all.",
      fixture: "provenanceConsent",
      code: `import { toFhirBundle } from "@zoblocks/signature";
import { patientRoutine } from "@zoblocks/fixtures";

// A transaction Bundle: the Consent and the Provenance that signs it, posted
// together or not at all. Emitting the Consent alone would store an agreement
// with nothing proving anyone made it.
const bundle = toFhirBundle(value, {
  release: "R4",
  subject: {
    display: "Amara Okonkwo",
    reference: \`Patient/\${patientRoutine.id}\`,
  },
});

// bundle.entry[0] → POST Consent
// bundle.entry[1] → POST Provenance, carrying Provenance.signature

// The signer travels on the value, not in these options: who signed is part of
// what was captured, and re-supplying it here would let the two disagree.`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["patient-intake", "clinical-documentation"],
    alternatives: [
      {
        ref: "clinical-note",
        when: "you need the whole note signed rather than a single attestation",
      },
      { ref: "switch", when: "the answer is a yes/no acknowledgement with no legal weight" },
    ],
  },

  seo: {
    slug: "signature",
    title: "Signature — React consent signature component",
    description:
      "A React signature component for clinical consent: draw, type or upload, with seven outcomes including refusal, and a FHIR Provenance bundle on submit.",
    primaryKeyword: "react signature component healthcare",
    secondaryKeywords: [
      "consent signature react",
      "e-signature react",
      "fhir provenance signature",
      "patient consent form react",
    ],
    searchIntent: "commercial",
    ogImage: "generated",
  },

  dependencies: ["antd", "@zoblocks/signature-core"],
  registryDependencies: [],
});

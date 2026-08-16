import { defineComponentMeta } from "@oxygenui-design/component-meta";

/**
 * Signature is the first `package` component.
 *
 * It wraps Ant Design, and a component that copied antd's Modal, Tabs and Form
 * into someone's repository would not be "source you own" — it would be a fork
 * of a framework. So it ships on npm with antd as a peer dependency, which is
 * why this metadata lives beside the package rather than in `registry/oxygen`.
 */
export default defineComponentMeta({
  name: "signature",
  title: "Signature",
  tier: "free",
  status: "beta",
  since: "0.1.0",
  layer: "clinical",

  distribution: "package",
  packageName: "@oxygenui-design/signature",

  summary:
    "Signature capture that records the times nobody signed — declined, unable, verbal, on paper — not just the times they did.",
  description:
    "Draw, type or upload a signature inside an Ant Design form, and record the outcomes a signature pad has no answer for. The value is a discriminated union over seven outcomes rather than a base64 string, so a refusal is a fact the record can hold.",
  rationale:
    "Almost every signature component solves one problem: get ink from a pointer onto a canvas and hand back a PNG. That is about fifteen percent of what a healthcare product needs. The rest is everything the PNG does not say — who signed, in what capacity, what they were agreeing to, and, most often of all, what to record when nobody signed at all. A patient who refused and a form nobody opened are different facts with different consequences, and a component whose only states are empty and signed makes the difference unrecordable. That is the same argument AbsentValue makes one tier down, at a much higher stake.",

  categories: ["Clinical", "Data Entry"],
  fhir: [],

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
    ],
    avoid: [
      "Controlled-substance prescribing. DEA EPCS is a separate and far stricter regime — identity proofing, two-factor, a certified application — and this does not satisfy it.",
      "Anywhere you need cryptographic non-repudiation from the component alone. A PNG of a mark carries no integrity guarantee; pair it with a detached JWS.",
      "As an identity check. It records the identity the host asserts and cannot verify it; 21 CFR 11.200's two-component rule lives in your auth layer.",
      'Draw-only configurations. `methods={["draw"]}` is a WCAG Level A failure that renders perfectly and passes every other test.',
    ],
  },

  limitations: [
    "Ant Design is a peer dependency. This is the only Oxygen component that is not distributed as copy-as-source, because copying antd's Modal and Form into a consumer's repository would be a fork rather than a component.",
    "Signature.data is a graphical signature only — an image of a mark. Deployments needing non-repudiation add a second Signature entry carrying a JWS.",
    "The timestamp is a required prop, not read from the clock. A browser clock is not evidence, and 42 CFR 482.24(c)(1) wants entries dated by whoever is accountable.",
    "Stroke biometrics are captured into the model but never emitted unless explicitly opted in, because whether stroke dynamics are a 'writing sample' is unsettled under BIPA and CUBI.",
    "Interpreter attestation, adopt-and-apply, and saved signatures are designed but not built.",
  ],

  related: [],

  usage: `import { Form } from "antd";
import { Signature, signatureRequired } from "@oxygenui-design/signature";
import "@oxygenui-design/signature/styles.css";

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

  dependencies: ["antd", "@oxygenui-design/signature-core"],
  registryDependencies: [],
});

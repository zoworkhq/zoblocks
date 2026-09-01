import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "clinical-note",
  title: "Clinical Note",
  // Free, for the same reason Consult is: the registry item is the adoption
  // engine. A developer runs `oxygen add clinical-note`, and the revenue line
  // is the services and enterprise contracts that follow — not a toll on the
  // front door.
  tier: "free",
  status: "experimental",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A clinical note editor that records where every character came from, and refuses to let anyone sign what they have not read.",

  tagline: "A note editor that records provenance and gates the signature.",
  description:
    "LOINC-coded sections, per-range provenance across six origins, a composable sign gate with three severities, and deterministic FHIR, XHTML and plain-text output. The engine ships as an npm package with no DOM; this item is the Tailwind skin over it.",
  rationale:
    "A rich text editor is a solved problem and competes with a hundred free ones. The parts that are hard are knowing which passages were copied forward from a note about a different admission, proving a clinician actually read the text a model drafted before signing it, and producing bytes that hash the same way twice so a signature over them means something. A 2022 analysis of over 100 million notes found 50.1% of note text duplicated from prior documentation on the same patient; copy-and-paste has been implicated in roughly a third of errors in ambulatory patient-safety analyses; and CMS's July 2025 signature guidance treats an AI scribe exactly as it treats a human one, which makes the review gate the only thing standing between a clinician and words they never read. Note bloat, copy-paste error and AI attribution are one missing data structure seen three times. This component stores it.",

  categories: ["Clinical", "Documentation"],
  fhir: [
    { name: "Composition", url: "https://hl7.org/fhir/R4/composition.html" },
    { name: "DocumentReference", url: "https://hl7.org/fhir/R4/documentreference.html" },
    { name: "Provenance", url: "https://hl7.org/fhir/R4/provenance.html" },
    { name: "Narrative", url: "https://hl7.org/fhir/R4/narrative.html" },
  ],

  states: [
    "Empty draft",
    "In progress",
    "Origins ribbon",
    "Unreviewed AI",
    "Copied forward",
    "Unfilled blanks",
    "Stale pulled value",
    "Gate blocking",
    "Gate clear",
    "Offline draft",
    "Save failed",
    "Signed",
    "Signed with addendum",
    "Awaiting countersignature",
  ],

  a11y: [
    {
      label: "The toolbar is one tab stop, not fifteen",
      detail:
        "role=toolbar with a roving tabindex: one Tab in, arrow keys within, one Tab out. Without it there are fifteen Tab presses between the document and the sign button, every time, for anyone who does not use a mouse.",
    },
    {
      label: "Provenance is never colour alone",
      detail:
        "Each of the six origins carries a hue and a distinct underline style — wavy for dictated, dashed for template, dotted for pulled, solid for copied, double for AI. Under forced-colors the tints are dropped and the underline styles carry the whole distinction, which is also what survives a monochrome print.",
    },
    {
      label: "The blocked sign button says why",
      detail:
        "aria-describedby points at a live count of what is blocking. A disabled control with no stated reason is the most common way a gate gets routed around.",
    },
    {
      label: "Save state reaches assistive technology",
      detail:
        "The status strip is a live region: polite for ordinary transitions, assertive for a failed save. A silent spinner is a status change nobody hears, and an unheard save failure is lost work.",
    },
    {
      label: "Sections are real landmarks",
      detail:
        "The rail is a nav with aria-current on the section holding the caret, and each section is a schema node rather than a bold paragraph — which is what makes both heading navigation and the required-section check possible at all.",
    },
    {
      label: "Formatting is semantic",
      detail:
        "Bold and italic render as strong and em, not styled spans, so a screen reader can convey emphasis. Underline and strikethrough are deliberately absent: underline reads as a link, and strikethrough is silently dropped by some renderers, which applied to a retraction is a safety defect.",
    },
  ],

  guidance: {
    use: [
      "Clinician-facing documentation where the note is the legal record — progress notes, H&Ps, consultations, discharge summaries. The gate and the addendum model are what make it a record rather than a document.",
      "Anywhere an ambient scribe or a drafting model writes into the note. Generated text arrives marked unreviewed and cannot be signed in that state, which is the only mechanical protection the signer has.",
      "Teaching settings with a resident-and-attending countersignature, where two signatures with two times and two authors have to survive into the export.",
      "Deployments that need to measure copy-forward rather than estimate it. The ratio is computed from the marks and can be recorded on the signature.",
    ],
    avoid: [
      "Patient-facing note composition. The gate's language, the do-not-use lint and the section model all assume a clinical author; a patient-authored narrative is a different surface with different rules.",
      "Anything that must round-trip provenance through a third-party FHIR server. Per-range authorship is a custom extension and a conforming server may drop it — verify with the actual endpoint before promising the feature.",
      "Free-form documents that are not clinical notes. The schema refuses prose outside a coded section, which is the point here and an obstruction anywhere else.",
      "Signing workflows where the browser clock is the only clock. `now` is required precisely so that a deployment cannot accidentally attest to a time nobody can defend.",
    ],
  },

  related: ["copilot", "switch", "care-timeline", "signature", "date-picker", "recorder"],

  limitations: [
    "No phrase library, terminology or attestation wording ships here. Those are jurisdictional, organisational and licensing decisions; the component provides the seams.",
    "Per-range provenance is not standardised anywhere in FHIR. It travels as a custom Oxygen extension that a conforming server may legitimately ignore or strip.",
    "There is no clock. `now` is a required prop, because a browser clock on a ward workstation is not evidence.",
    "No speech recognizer, no collaboration server, no crypto. The component defines the channel, the integration and the seam; the implementations are the deployment's.",
    "The LOINC section codes match published display names but must be confirmed — with their C-CDA cardinality — against the implementation guide a deployment conforms to.",
    "Real-time collaboration, tables, live data islands and ink annotation are designed but not built. See the brief.",
  ],

  dependencies: [
    "clsx",
    "tailwind-merge",
    "@oxygenui-design/clinical-note-core",
    "prosemirror-view",
    "prosemirror-state",
    "prosemirror-model",
    "prosemirror-keymap",
    "prosemirror-history",
    "prosemirror-commands",
  ],
  registryDependencies: ["utils", "tokens", "clinical-note-core"],

  usage: `import { ClinicalNote } from "@/components/oxygen/clinical-note";

// The minimum. \`now\` has no default on purpose — the host owns the clock.
<ClinicalNote
  noteType="progress"
  subject={{
    reference: "Patient/4471902",
    display: "RANDOL, Joshua",
    identifier: "4471902",
    birthDate: "12 Mar 1996",
    detail: "30y M · Bed 4E-12",
  }}
  author={{ display: "R. Menon, MD", role: "Resident", requiresCosign: true }}
  now={await serverTime()}
  onCommit={(kind, doc, acknowledgedWarnings) => save(kind, doc, acknowledgedWarnings)}
/>

// Reading a signed note loads no editor at all.
<ClinicalNote.Reader
  subject={subject}
  title="Progress note"
  doc={signedDoc}
  attestations={[{ who: "R. Menon, MD", when: "16 Aug 2026, 14:41 IST (UTC+05:30)" }]}
  addenda={[{ author: "A. Iyer, MD", when: "19 Aug 2026, 09:14 IST", text: "…" }]}
/>`,
});

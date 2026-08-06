import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "absent-value",
  title: "Absent Value",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "Renders absence as a statement. Withheld, not asked, declined, and errored are different facts and never share a dash.",
  description: "Renders the absence of a clinical value as a statement rather than a blank. Distinguishes not-asked, declined, masked, pending, and error — reasons that mean different things and must not share a dash.",
  rationale: "The smallest component in the library and one of the most consequential. A blank cell is indistinguishable from a rendering failure, a dash flattens fifteen FHIR reasons into one, and a zero is a value — reading “not measured” as 0 is a clinical error. This renders the reason instead, and keeps “the system does not have this” separate from “you are not allowed to see this”, which look identical in most products and mean opposite things at the bedside.",

  categories: [
    "Primitive",
    "Clinical",
  ],
  fhir: [
    {
      name: "dataAbsentReason",
      url: "https://terminology.hl7.org/CodeSystem-data-absent-reason.html",
    },
  ],

  states: [
    "Not recorded (no reason given)",
    "Not asked",
    "Declined to answer",
    "Result pending",
    "Hidden — restricted",
    "Unavailable — system error",
    "Not applicable",
  ],

  a11y: [
    {
      label: "Never silent",
      detail: "Always renders text. A screen-reader user landing in the cell hears a reason rather than skipping an empty element.",
    },
    {
      label: "Field prefix",
      detail: "field adds a screen-reader-only prefix so the announcement is “Potassium, not asked” rather than a context-free “not asked”.",
    },
    {
      label: "Not colour alone",
      detail: "Every reason carries an icon and a full-sentence label. The three tones are reinforcement, and the wording survives grayscale and forced-colors.",
    },
  ],

  guidance: {
    use: [
      "Everywhere a clinical value could be missing — cells, fields, and whole sections.",
      "With field set when the absence sits somewhere with no associated label.",
      "In place of any “—”, “N/A”, or empty string standing in for a clinical value.",
    ],
    avoid: [
      "As a permission check. It renders an outcome; the application decides who may see what.",
      "For a zero or a genuinely negative result. Those are values and belong in the value slot.",
      "Passing source text through detail on masked content — the component ignores it by design.",
    ],
  },

  limitations: [
    "Presentational only. It does not evaluate consent, security labels, or role — pass it the resolved reason.",
    "Restricted reasons deliberately drop source text, so a genuinely safe explanation is lost along with an unsafe one.",
    "The request-access affordance emits a callback; the access workflow itself is yours to build.",
  ],
  related: [
    "vitals-panel",
    "status-badge",
  ],

  dependencies: [
    "@oxygenui/fhir",
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { AbsentValue } from "@/components/oxygen/absent-value";

// From a FHIR payload — the reason is read and categorised for you.
<AbsentValue field="Potassium" reason={observation.dataAbsentReason} />

// Or state it directly.
<AbsentValue reason="masked" onRequestAccess={requestAccess} />

// Absence with no stated reason still renders text, never a blank.
<AbsentValue />`,
});

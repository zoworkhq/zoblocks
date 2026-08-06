import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "provenance",
  title: "Provenance Tag",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "Who recorded this, when, from where, and whether it has been amended.",
  description: "Who recorded a datum, when, from what source, and whether it has been amended. Separates event time from charting time and states an absent source rather than guessing.",
  rationale: "Clinicians discount data they cannot source, and an amended result that looks identical to the original is a known harm pathway — both are solved by the same disclosure. It refuses to flatten three distinctions: when something happened versus when it was written, who observed it versus what typed it, and present versus absent provenance. Amendment is surfaced on the trigger itself, because a correction nobody opens is a correction nobody saw.",

  categories: [
    "Primitive",
    "System",
  ],
  fhir: [
    {
      name: "Provenance",
      url: "https://hl7.org/fhir/R4/provenance.html",
    },
  ],

  states: [
    "Clinician-entered",
    "Patient-reported",
    "Device-recorded",
    "Interface feed",
    "Amended",
    "Source not recorded",
    "Charted after the event",
  ],

  a11y: [
    {
      label: "Named trigger",
      detail: "The button says what it reveals and about what, rather than being a bare icon.",
    },
    {
      label: "Dialog semantics",
      detail: "Content is a labelled group, dismissible with Escape; nothing is hover-only.",
    },
    {
      label: "Amendment in the name",
      detail: "The amended state is in the trigger's accessible name, not only in its colour.",
    },
  ],

  guidance: {
    use: [
      "Beside any value whose source a clinician might reasonably question.",
      "On results that can be amended \\u2014 the amended state shows on the trigger.",
      "With inline on dense surfaces where a popover per row is unusable.",
    ],
    avoid: [
      "Treating an absent provenance as clinician-entered. Unknown is rendered as unknown.",
      "Hiding amendment behind the disclosure only.",
      "Assuming meta.lastUpdated is the clinical event time. They are different facts.",
    ],
  },

  limitations: [
    "Reads one agent and one source entity; complex provenance chains are summarised.",
    "Does not fetch version history \\u2014 it reports what the payload and meta carry.",
    "Amendment detection uses versionId and revision entities; systems that populate neither will read as unamended.",
  ],
  related: [
    "clinical-time",
    "vitals-panel",
    "absent-value",
  ],

  dependencies: [
    "@oxygenui-design/fhir@^0.1.0",
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { ProvenanceTag } from "@/components/oxygen/provenance";

<ProvenanceTag
  provenance={provenance}
  resource={observation}
  timeZone="America/New_York"
  subject="Potassium 6.8 mmol/L"
/>`,
});

import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "concept-chip",
  title: "Concept Chip",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary:
    "A coded concept with its coding one interaction away, and honest about what is missing.",
  description:
    "A coded clinical concept with its coding one interaction away. Marks text-only concepts, unrecognised systems, and codes outside an expected value set.",
  rationale:
    "Clinicians read display text; integrations and audits need the code. Hiding the coding makes data problems undiagnosable, showing it inline makes every list unreadable, so it lives behind a disclosure. The useful behaviour is the honesty: text with no coding is marked as such, an unrecognised system shows its raw URI rather than being dressed up as standard, and a concept outside an expected value set is flagged so bad mappings become visible instead of accumulating.",

  categories: ["Primitive", "Clinical"],
  fhir: [
    {
      name: "CodeableConcept",
      url: "https://hl7.org/fhir/R4/datatypes.html#CodeableConcept",
    },
  ],

  states: [
    "Coded concept",
    "Text only, no coding",
    "Multiple codings",
    "Unrecognised system",
    "Outside expected value set",
    "No concept recorded",
  ],

  a11y: [
    {
      label: "Button, not hover",
      detail:
        "The disclosure is a real button with an expanded state, dismissible with Escape. Nothing is hover-only.",
    },
    {
      label: "Code out of the name",
      detail:
        "The accessible name carries the concept text and any warning; system and code live inside the disclosure rather than crowding it.",
    },
    {
      label: "Warnings in text",
      detail: "Text-only and out-of-value-set are labelled in words, never by colour alone.",
    },
  ],

  guidance: {
    use: [
      "Problem lists, order details, and anywhere a coded concept is shown to a clinician.",
      "With expectedCodes on surfaces where mapping quality matters.",
      "With readOnly in virtualised grids, where a popover per row is unusable.",
    ],
    avoid: [
      "Rendering the system URI as though it were a friendly name. Unrecognised means unrecognised.",
      "Using it for concepts you never intend a user to inspect \\u2014 readOnly text is cheaper.",
      "Assuming a coded concept is valid because it renders. The chip shows what is there.",
    ],
  },

  limitations: [
    "No terminology server lookup \\u2014 it displays what the payload carries.",
    "Post-coordinated SNOMED expressions render as their raw code.",
    "The recognised-system list is finite; extend it as your integrations grow.",
  ],
  related: ["condition-list", "vitals-panel", "status-badge"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: `import { ConceptChip } from "@/components/oxygen/concept-chip";

<ConceptChip concept={condition.code} />
<ConceptChip concept={observation.code} showSystem />
<ConceptChip concept={concept} expectedCodes={["http://loinc.org|2823-3"]} />`,
});

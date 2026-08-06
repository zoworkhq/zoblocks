import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "allergy-list",
  title: "Allergy List",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Criticality and verification status, with no-known-allergies as its own state.",
  description: "Allergies and intolerances from FHIR AllergyIntolerance. Distinguishes a recorded no-known-allergies assertion from an empty list, because one means asked-and-answered and the other means nobody asked.",
  rationale: "Renders known allergies and intolerances with criticality, reaction manifestations, and verification status. The decision that matters most is what an empty list means: “no allergies recorded” and “no known allergies” are different clinical facts. The first means nobody has asked; the second means someone asked and documented the answer. Rendering them identically tells a clinician the patient is safe when the truth is the question was never put — so noKnownAllergies must be passed explicitly and is never inferred.",

  categories: [
    "Clinical data",
    "Clinical",
  ],
  fhir: [
    {
      name: "AllergyIntolerance",
      url: "https://hl7.org/fhir/R4/allergyintolerance.html",
    },
  ],

  states: [
    "High risk",
    "Severe / moderate / mild reaction",
    "Risk not assessed",
    "Unconfirmed",
    "Refuted",
    "Inactive",
    "No known allergies",
    "Not recorded",
  ],

  a11y: [
    {
      label: "High-risk announcement",
      detail: "A live region states the high-risk count before the list is read.",
    },
    {
      label: "Distinct empty states",
      detail: "No-known-allergies and not-recorded differ in icon, wording, and tone — not color alone.",
    },
    {
      label: "Verification never dropped",
      detail: "Unconfirmed and refuted entries carry an explicit badge so they cannot be mistaken for confirmed allergies.",
    },
  ],

  guidance: {
    use: [
      "On a chart header, pre-procedure checklist, or prescribing screen.",
      "With noKnownAllergies only when your data genuinely carries that assertion.",
      "Showing refuted entries rather than deleting them — de-prescribing depends on knowing an allergy was ruled out.",
    ],
    avoid: [
      "Inferring noKnownAllergies from an empty array. That is the exact error this component exists to prevent.",
      "Using it as an allergy-checking gate. It displays; it does not screen orders.",
      "hideInactive on a prescribing surface, where a resolved allergy is still relevant history.",
    ],
  },

  limitations: [
    "Reaction onset and the free-text description are not rendered.",
    "Criticality falls back to worst observed reaction severity when absent — documented, but an approximation.",
    "No grouping by category (food, medication, environment).",
  ],
  related: [
    "medication-card",
    "condition-list",
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
    "status-badge",
  ],

  usage: `import { AllergyList } from "@/components/oxygen/allergy-list";

<AllergyList
  allergies={allergies}
  // only when an assertion is actually on file
  noKnownAllergies={patientHasNkaAssertion}
/>`,
});

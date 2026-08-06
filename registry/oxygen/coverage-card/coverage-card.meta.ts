import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "coverage-card",
  title: "Coverage Card",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Effective state derived from status and period together — an active record past its end date reads as lapsed.",
  description: "Insurance coverage from a FHIR Coverage resource. Effective state is derived from status and period together, so a coverage marked active but past its end date reads as lapsed.",
  rationale: "Renders insurance coverage with payer, plan, member and group identifiers, and the active period. A status of active is not sufficient to say a coverage is usable: a record can carry an active status while its period has already ended, and acting on lapsed coverage produces a denied claim and a surprise bill for the patient. The effective state is therefore derived from status and period together.",

  categories: [
    "Billing and coverage",
  ],
  fhir: [
    {
      name: "Coverage",
      url: "https://hl7.org/fhir/R4/coverage.html",
    },
  ],

  states: [
    "Active",
    "Lapsed",
    "Not yet effective",
    "Cancelled",
    "Status unknown",
    "Masked identifiers",
  ],

  a11y: [
    {
      label: "Lapsed is explicit",
      detail: "A lapsed coverage adds a written instruction to verify eligibility, not just a red border.",
    },
    {
      label: "Masked identifiers",
      detail: "Screen readers receive the last four characters and a statement that the value is masked.",
    },
    {
      label: "Absent fields",
      detail: "Every unpopulated field renders as explicitly not recorded rather than as an empty cell.",
    },
  ],

  guidance: {
    use: [
      "On registration, check-in, and billing screens.",
      "With maskIdentifiers on front-desk and shared workstations.",
      "Rendering every coverage in order — secondary coverage matters for coordination of benefits.",
    ],
    avoid: [
      "As an eligibility check. A rendered card is not a real-time eligibility response from the payer.",
      "Showing only the primary coverage. Dropping secondary coverage causes downstream billing errors.",
      "Trusting status alone in your own code — use coverageState from @oxygenui/fhir.",
    ],
  },

  limitations: [
    "Renders payor[0] only; multi-payer coverage shows the first.",
    "Cost-to-beneficiary (copay, deductible) is not rendered.",
    "No eligibility or benefits verification — display only.",
  ],
  related: [
    "patient-banner",
    "appointment-card",
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
    "status-badge",
  ],

  usage: `import { CoverageCard } from "@/components/oxygen/coverage-card";

<CoverageCard
  coverage={coverage}
  maskIdentifiers={isSharedWorkstation}
/>`,
});

import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "medication-card",
  title: "Medication Card",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Dose, route, schedule, and status. Held, stopped, and expired are distinct — not one greyed-out style.",
  description: "Medication order from a FHIR MedicationRequest. On-hold, stopped, completed, and expired each get their own label and tone rather than one greyed-out style, because they lead to opposite next actions.",
  rationale: "Renders a medication order with its dosage instruction and status. The design problem is status: most implementations collapse on-hold, stopped, completed, and expired into a single muted treatment, which loses the difference between a drug a clinician deliberately paused and one that simply ran out of refills. Those lead to opposite next actions, so each gets its own label and tone. Expired is derived rather than stored — FHIR has no expired status, so an order still marked active past its dispense validity period is surfaced as expired instead of presented as current.",

  categories: [
    "Medication",
    "Clinical",
  ],
  fhir: [
    {
      name: "MedicationRequest",
      url: "https://hl7.org/fhir/R4/medicationrequest.html",
    },
  ],

  states: [
    "Active",
    "On hold",
    "Stopped",
    "Cancelled",
    "Completed",
    "Expired",
    "Draft",
    "Entered in error",
    "No dosage recorded",
  ],

  a11y: [
    {
      label: "No strike-through",
      detail: "Discontinued medications are never struck through — struck text is unreadable at small sizes and is not exposed as meaning by screen readers. The status badge carries the state.",
    },
    {
      label: "Status labels",
      detail: "Every status has a text label, not just a tone. On hold, stopped, and expired are distinguishable in grayscale.",
    },
    {
      label: "Activation",
      detail: "When onSelect is provided the card is focusable and responds to Enter and Space.",
    },
  ],

  guidance: {
    use: [
      "On a medication list, discharge summary, or reconciliation screen.",
      "With showProvenance on, wherever a clinician may need to contact the prescriber.",
      "Sorted with active medications first — the component preserves your order.",
    ],
    avoid: [
      "As a prescribing control. This renders an existing order; it does not create or modify one.",
      "For dispense or administration records. Those are MedicationDispense and MedicationAdministration.",
      "Hiding discontinued drugs entirely. Recently stopped medications matter clinically.",
    ],
  },

  limitations: [
    "Renders dosageInstruction[0] only. Tapered and split regimens with multiple instructions show the first.",
    "No interaction or contraindication checking. That is a clinical decision support concern, not a UI one.",
    "medicationReference renders the reference display text; it does not resolve the Medication resource.",
  ],
  related: [
    "allergy-list",
    "condition-list",
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

  usage: `import { MedicationCard, MedicationList } from "@/components/oxygen/medication-card";

<MedicationList requests={activeMedications} />

// or a single order
<MedicationCard
  request={request}
  onSelect={(r) => openOrder(r.id)}
/>`,
});

import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "action-gate",
  title: "Action Gate",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Two-step confirmation that names the consequence and the patient, then emits an audit event.",
  description: "Two-step confirmation for consequential clinical actions. States the specific consequence and names the patient, escalates friction for irreversible actions, and emits a structured audit event.",
  rationale: "The copy rule is the whole component: it states what will happen, to whom, and what cannot be undone. “Are you sure?” is not a confirmation — it asks the reader to re-derive the consequence they were already unsure about, which is why consequence and patientName exist as props. Friction is calibrated rather than maximised: too little and wrong-patient actions happen, too much and clinicians route around the system, which is worse because it moves the work somewhere you cannot see.",

  categories: [
    "Primitive",
    "System",
  ],
  fhir: [
    {
      name: "AuditEvent",
      url: "https://hl7.org/fhir/R4/auditevent.html",
    },
  ],

  states: [
    "Reversible confirm",
    "Irreversible type-to-confirm",
    "Hold-to-confirm",
    "Reason required",
    "In flight",
    "Cancelled",
  ],

  a11y: [
    {
      label: "Focus managed",
      detail: "Focus moves into the dialog on open and returns to the trigger on dismiss. Escape always exits.",
    },
    {
      label: "Consequence in the description",
      detail: "The dialog is an alertdialog whose accessible description carries the consequence and the patient name, not just visible text.",
    },
    {
      label: "Hold has a keyboard path",
      detail: "Hold-to-confirm works with Space and Enter, so it is never pointer-only.",
    },
  ],

  guidance: {
    use: [
      "Anything that changes a clinical record, medication, schedule commitment, or consent state.",
      "With reversible={false} and mode=\\u201ctype\\u201d for genuinely irreversible actions.",
      "With mode=\\u201chold\\u201d on dense screens where a stray double-click could commit.",
    ],
    avoid: [
      "Generic consequence text. If it does not name the effect, it is not a confirmation.",
      "Gating routine, reversible actions \\u2014 friction everywhere teaches people to click through.",
      "Assuming the audit event is stored. It is emitted; you persist it.",
    ],
  },

  limitations: [
    "Emits an audit event; it does not persist one or guarantee delivery.",
    "No re-authentication step \\u2014 compose one around it where policy requires.",
    "Focus is managed but not fully trapped; a portal-based dialog is the next step.",
  ],
  related: [
    "restricted-shield",
    "status-badge",
  ],

  dependencies: [
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { ActionGate } from "@/components/oxygen/action-gate";

<ActionGate
  action="Discontinue"
  consequence="Lisinopril 10 mg will stop immediately and no further doses will be dispensed."
  patientName="Marisol Reyes-Okonkwo"
  reversible={false}
  reasons={["Adverse reaction", "No longer indicated", "Patient request"]}
  onConfirm={(event) => auditLog.record(event)}
/>`,
});

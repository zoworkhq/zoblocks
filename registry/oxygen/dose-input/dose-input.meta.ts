import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "dose-input",
  title: "Dose Input",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary:
    "Dose entry with ISMP formatting rules, plausibility separated from hard limits, and visible arithmetic.",
  description:
    "Numeric entry for doses with ISMP formatting rules, plausibility warnings separated from hard maximums, and weight-based calculation that shows its arithmetic.",
  rationale:
    "One of the highest-consequence inputs in healthcare software, and a free-text number field is not an acceptable control for it. Three defences in order of harm prevented: ISMP formatting rules, because “1.0 mg” read past the decimal point is 10 mg; plausibility warnings kept separate from hard maximums, because a dose can be unusual and correct and conflating the two teaches prescribers to click through both; and weight-based calculation that keeps its inputs on screen, because a calculator returning a bare number invites use with a stale weight.",

  categories: ["Primitive", "Clinical"],
  fhir: [
    {
      name: "Dosage",
      url: "https://hl7.org/fhir/R4/dosage.html",
    },
  ],

  states: [
    "Well-formed dose",
    "Trailing zero",
    "Missing leading zero",
    "Above plausible range",
    "Above absolute maximum",
    "Weight-based calculation",
    "No weight on file",
  ],

  a11y: [
    {
      label: "Messages bound to the field",
      detail:
        "Every warning is associated through aria-describedby and announced on the input, not discovered at submit.",
    },
    {
      label: "Blocking states are alerts",
      detail: "Crossing the absolute maximum uses role=alert and sets aria-invalid.",
    },
    {
      label: "No spinner",
      detail:
        "A numeric keypad without increment controls, so a stray scroll cannot change a prescription.",
    },
  ],

  guidance: {
    use: [
      "Any dose, weight, rate, or volume entry.",
      "With absoluteMax set from the drug reference, not from a guess.",
      "With weightKg wired to a recorded weight and left undefined when there is none.",
    ],
    avoid: [
      "Silently rewriting a typed dose. The corrected form is offered, never applied.",
      "Using plausibleMax as a hard stop \\u2014 unusual doses are sometimes correct.",
      "Substituting an average weight when none is recorded.",
    ],
  },

  limitations: [
    "Plausibility bounds are supplied by the caller \\u2014 there is no built-in drug reference.",
    "Unit lists are caller-supplied; the component does not know which units suit a formulation.",
    "Override workflow for exceeding the maximum is yours to build; this blocks and explains.",
  ],
  related: ["clinical-value", "action-gate", "medication-card"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: `import { DoseInput } from "@/components/oxygen/dose-input";

<DoseInput
  value={dose}
  onChange={setDose}
  units={["mg", "mL"]}
  plausibleMax={40}
  absoluteMax={80}
  dosePerKg={0.5}
  weightKg={patientWeightKg}
/>`,
});

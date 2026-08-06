import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "condition-list",
  title: "Condition List",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary:
    "Problem list that separates active from resolved and never promotes a provisional diagnosis.",
  description:
    "Problem list from FHIR Condition resources. Separates active from resolved, preserves vague onset as recorded, and never presents a provisional diagnosis as confirmed.",
  rationale:
    "Renders a problem list from Condition resources. A problem list is not a log — its value comes from the reader telling at a glance which problems are current, so resolved and inactive entries are grouped separately rather than merely sorted below. Onset renders exactly as recorded: FHIR permits onsetString (“in childhood”) alongside onsetDateTime, and coercing a vague onset into a false precise date is a common and quietly damaging bug.",

  categories: ["Clinical data", "Clinical"],
  fhir: [
    {
      name: "Condition",
      url: "https://hl7.org/fhir/R4/condition.html",
    },
  ],

  states: [
    "Active",
    "Recurrence",
    "Remission",
    "Resolved",
    "Inactive",
    "Provisional",
    "Differential",
    "Vague onset",
    "Onset not recorded",
  ],

  a11y: [
    {
      label: "Native disclosure",
      detail:
        "The inactive group uses details/summary, so it is keyboard operable and announced without custom ARIA.",
    },
    {
      label: "Provisional is labelled",
      detail:
        "Provisional and differential diagnoses carry an explicit badge rather than a subtle style difference.",
    },
    {
      label: "Onset honesty",
      detail:
        "A vague onset renders as its recorded text; a missing one renders as explicitly not recorded.",
    },
  ],

  guidance: {
    use: [
      "On chart summaries, visit preparation, and handoff screens.",
      "With separateInactive on any screen where current problems drive the next action.",
      "Preserving your own clinical sort order — the component does not reorder within a group.",
    ],
    avoid: [
      "As an encounter diagnosis list. Encounter diagnoses are scoped to a visit, not to the patient.",
      "Hiding provisional diagnoses. Carrying one forward as settled fact is the harm; hiding it is not the fix.",
      "separateInactive off on dense clinical screens, where the split is what makes the list scannable.",
    ],
  },

  limitations: [
    "Body site, stage, and evidence are not rendered.",
    "No grouping by category (problem list item vs encounter diagnosis).",
    "Severity is matched on display text; coded severity value sets are not yet mapped.",
  ],
  related: ["allergy-list", "medication-card"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "status-badge"],

  usage: `import { ConditionList } from "@/components/oxygen/condition-list";

<ConditionList
  conditions={problems}
  separateInactive
/>`,
});

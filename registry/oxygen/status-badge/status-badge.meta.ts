import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "status-badge",
  title: "Status Badge",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "The shared severity chip. Critical reads identically on a lab result, a medication, and an allergy.",
  description: "Shared severity and status chip used by every Oxygen component, so critical reads identically on a lab result, a medication, and an allergy. Label is required — there is no icon-only variant.",
  rationale: "The status chip every other Oxygen component uses, so that severity is consistent across the whole system. Two rules are enforced by the API itself: children is required, because an icon alone is not a label but a rebus; and tone maps to a semantic token rather than a raw color, so a caller passes “critical”, never “red”, and the token decides what that means in light, dark, and forced-colors modes.",

  categories: [
    "Primitive",
  ],
  fhir: [],

  states: [
    "Critical",
    "High",
    "Low",
    "Normal",
    "Unknown",
    "Neutral",
  ],

  a11y: [
    {
      label: "Label required",
      detail: "The API has no icon-only variant, so a badge can never ship without an accessible label.",
    },
    {
      label: "Token-driven",
      detail: "Tones resolve through status tokens, keeping contrast correct in light, dark, and forced-colors modes.",
    },
  ],

  guidance: {
    use: [
      "Anywhere a state needs to be shown consistently with the rest of the system.",
      "With a label that names the state, not its severity — “Critical high”, not “Danger”.",
    ],
    avoid: [
      "As a button or a filter control. It is not interactive.",
      "With icon={null} unless a neighbouring icon already conveys the same meaning.",
      "Inventing a tone for a non-clinical concept. Use neutral.",
    ],
  },

  limitations: [
    "Not interactive — no button, link, or dismiss behavior.",
    "Six tones only. Additional semantics belong in a token, not a one-off color.",
  ],
  related: [
    "vitals-panel",
    "medication-card",
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

  usage: `import { StatusBadge } from "@/components/oxygen/status-badge";

<StatusBadge tone="critical">Critical high</StatusBadge>
<StatusBadge tone="unknown">Not interpreted</StatusBadge>`,
});

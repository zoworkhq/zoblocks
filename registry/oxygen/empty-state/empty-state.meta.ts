import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "empty-state",
  title: "Empty State",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "Five reasons a section shows nothing. An unavailable section is never rendered as an empty one.",
  description: "Distinguishes never-recorded, filtered-to-empty, source-unavailable, restricted, and pending. An unavailable section is never rendered as an empty one.",
  rationale: "Most products render one empty state. Never-recorded, filtered-to-empty, source-unavailable, restricted, and pending mean entirely different things, and conflating them has caused documented harm. Unavailable is the dangerous one: a section that failed to load and renders as “no results” tells a clinician the patient has no allergies when the allergy service was simply down. title is required rather than defaulted, because the correct sentence for an empty allergy list is not the correct sentence for an empty problem list.",

  categories: [
    "Primitive",
    "System",
  ],
  fhir: [],

  states: [
    "Never recorded",
    "Filtered to empty",
    "Source unavailable",
    "Restricted",
    "Pending",
    "Compact",
  ],

  a11y: [
    {
      label: "Filtered emptiness announced",
      detail: "Emptiness that follows a user action uses a polite live region; emptiness that was always there does not, because it is not news.",
    },
    {
      label: "Icon decorative",
      detail: "The glyph is hidden from assistive technology. The message carries the meaning.",
    },
    {
      label: "Reason exposed",
      detail: "data-empty-reason is on the element for testing and for styling without re-deriving state.",
    },
  ],

  guidance: {
    use: [
      "Every list, table, and section that can render nothing.",
      "With reason=\\u201cunavailable\\u201d whenever a fetch failed, never \\u201cnever\\u201d.",
      "With lastCheckedLabel wherever staleness would change a clinical reading.",
    ],
    avoid: [
      "Asserting a clinical negative. \\u201cNo allergies recorded\\u201d is safe; \\u201cNo allergies\\u201d is a claim.",
      "Reusing one empty state for a failed fetch and a genuinely empty list.",
      "Illustration-led empty states on clinical surfaces \\u2014 the sentence is the content.",
    ],
  },

  limitations: [
    "Copy is yours \\u2014 the component enforces the distinction, not the wording.",
    "No retry behaviour built in; pass an action.",
    "Does not detect its own reason; the caller knows why the section is empty.",
  ],
  related: [
    "absent-value",
    "clinical-skeleton",
    "restricted-shield",
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

  usage: `import { EmptyState } from "@/components/oxygen/empty-state";

<EmptyState
  reason="never"
  title="No allergy information recorded"
  description="This is not the same as no known allergies. Ask and record before prescribing."
/>

<EmptyState reason="unavailable" title="Allergies could not be loaded" lastCheckedLabel="Last read 08:41" />`,
});

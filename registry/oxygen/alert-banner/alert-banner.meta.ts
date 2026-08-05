import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "alert-banner",
  title: "Alert Banner",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Severity tiers as an interruption budget. Only critical may take focus.",
  description: "Severity tiers as an interruption budget. Only critical may take focus, the specific finding is stated rather than a category, and dismissal captures a reason so rules can be measured.",
  rationale: "Interruption is a scarce resource and every alert spends it. The failure mode of clinical alerting is not missing alerts, it is too many — fire enough and clinicians dismiss everything, including the one that mattered. So the tiers here are a budget rather than a palette. The specific finding is stated rather than the category, because “Potassium 6.8 — critical high” earns its interruption and “Abnormal result” does not. Dismissing a critical alert captures a reason, because an alert everyone silently clears should be retired and you cannot know that without the reasons.",

  categories: [
    "Primitive",
    "Clinical",
  ],
  fhir: [
    {
      name: "DetectedIssue",
      url: "https://hl7.org/fhir/R4/detectedissue.html",
    },
  ],

  states: [
    "Critical",
    "High",
    "Moderate",
    "Low",
    "Info",
    "Dismissal with reason",
  ],

  a11y: [
    {
      label: "Tiered live regions",
      detail: "Only critical is assertive. Everything else is polite and waits its turn in the reading order.",
    },
    {
      label: "Severity as a word",
      detail: "The tier is in the accessible name, so it survives greyscale and forced-colors.",
    },
    {
      label: "Named dismiss",
      detail: "The dismiss control names the alert it closes rather than being a bare X.",
    },
  ],

  guidance: {
    use: [
      "Anywhere a clinical finding must be seen before the user proceeds.",
      "With the specific value and interpretation in finding.",
      "With dismissReasons on critical alerts, so rule performance is measurable.",
    ],
    avoid: [
      "Declaring everything critical. The tier is a budget and it is finite.",
      "Category text like \\u201cAbnormal result\\u201d \\u2014 it teaches dismissal without reading.",
      "Dismissal with no reason on a critical alert; that is how bad rules survive.",
    ],
  },

  limitations: [
    "Does not deduplicate or rank multiple simultaneous alerts \\u2014 compose a stack.",
    "Suppression across encounters is application state, not component state.",
    "Emits dismissal reasons; storing and analysing them is yours.",
  ],
  related: [
    "status-badge",
    "action-gate",
    "empty-state",
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
  ],

  usage: `import { AlertBanner } from "@/components/oxygen/alert-banner";

<AlertBanner
  severity="critical"
  finding="Potassium 6.8 mmol/L — critical high"
  detail="Repeat sample and review cardiac monitoring."
  source="Chemistry · resulted 06:42"
  dismissReasons={["Already actioned", "Known for this patient", "Not clinically relevant"]}
  onDismiss={(d) => alertMetrics.record(d)}
/>`,
});

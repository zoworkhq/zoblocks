import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "patient-snapshot",
  title: "Patient Snapshot",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "block",

  summary: "One-screen pre-encounter summary where every section carries its own recency and failure.",
  description: "One-screen pre-encounter summary. Each section carries its own recency and failure, truncation is counted rather than silent, and changes since last review lead.",
  rationale: "The single most requested and most misdesigned surface in clinical software. The design problem is not what to show but what to leave out, and the answer differs by specialty, setting, and patient. Six source systems back this screen and partial failure is normal, so a section that did not load says so rather than rendering empty. Truncation is counted rather than silent — showing three of eleven problems and stopping is a summary that reads as a complete list. Changes since the reader last looked lead, because covering clinicians need the delta rather than the chart.",

  categories: [
    "Patient identity",
    "Clinical",
  ],
  fhir: [
    {
      name: "Composition",
      url: "https://hl7.org/fhir/R4/composition.html",
    },
  ],

  states: [
    "All sections loaded",
    "Section failed",
    "Section stale",
    "Section empty",
    "Truncated with a count",
    "Changes since last review",
  ],

  a11y: [
    {
      label: "Sections as regions",
      detail: "Each section is a labelled article, so a screen-reader user navigates section by section.",
    },
    {
      label: "Failure summarised first",
      detail: "Failed sections are announced at the top, before the reader forms a picture from the sections above them.",
    },
    {
      label: "Change counts in the name",
      detail: "New-since-review counts are part of the heading, not a decorative badge.",
    },
  ],

  guidance: {
    use: [
      "Pre-visit and handover surfaces, where the reader has minutes rather than an hour.",
      "With one section per source system, so one slow service does not block the rest.",
      "With totalCount and shownCount whenever the section is truncated.",
    ],
    avoid: [
      "Rendering a failed section as empty. That is the harm this exists to prevent.",
      "Truncating without a count.",
      "Making it exhaustive. A summary that shows everything is not a summary.",
    ],
  },

  limitations: [
    "Does not decide what belongs in a summary \\u2014 sections and priority are yours.",
    "Specialty configuration is caller-supplied.",
    "Change detection compares counts you supply; it does not diff resources.",
  ],
  related: [
    "patient-banner",
    "code-status",
    "care-team",
    "clinical-skeleton",
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
    "empty-state",
    "clinical-skeleton",
  ],

  usage: `import { PatientSnapshot } from "@/components/oxygen/patient-snapshot";

<PatientSnapshot
  timeZone="America/New_York"
  lastReviewedAt={lastReviewed}
  sections={[
    {
      id: "problems",
      title: "Problems",
      state: "loaded",
      totalCount: 11,
      shownCount: 3,
      emptyTitle: "No problems recorded",
      content: <ConditionList conditions={top3} />,
    },
  ]}
/>`,
});

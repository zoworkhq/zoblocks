import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "chart-accordion",
  title: "Chart Accordion",
  tier: "free",
  status: "beta",
  since: "0.3.0",
  layer: "clinical",

  summary:
    "A record's sections with their headers composed to the house rules, so a severity can never reach the screen without the words that explain it.",

  tagline: "Chart sections whose severity always arrives with its words.",
  description:
    "Accordion with a clinical summary vocabulary: a status paired with its severity, a count, and a timestamp at the precision the record holds. Adds an expand-all control that never opens a section the reader may not have.",
  rationale:
    "Accordion will happily let a product build a header that says nothing, and at fourteen sections that produces a chart nobody reads. This component closes that gap by composing the summary itself from a small, closed vocabulary. The type does the enforcing: passing severity without status is a build error, because a coloured rail with no words beside it is a signal that forced-colors mode discards, monochrome printing discards, and roughly one in twelve men cannot resolve. The expand-all control is here rather than on the primitive because expanding a whole record is a chart-shaped action — it is what makes the record searchable and printable in one press — and it has to know not to touch a withheld section.",

  categories: ["Disclosure", "Clinical"],
  fhir: [],

  states: [
    "Closed, with summaries",
    "Expanded",
    "Severity across the scale",
    "Consent gate",
    "Withheld section",
    "Section that failed to load",
    "No sections",
  ],

  a11y: [
    {
      label: "Severity is never alone",
      detail:
        "The type requires a status alongside a severity, so the rail always has words beside it. The chip renders text plus colour plus a token-driven border, and the text is what survives forced-colors mode and a monochrome print.",
    },
    {
      label: "Expand all is a real control, not a link",
      detail:
        "Both toolbar controls are buttons with a 24px minimum target, focusable in order, and they change the accordion's controlled state rather than reaching into the DOM.",
    },
    {
      label: "Timestamps carry their precision",
      detail:
        "updatedAt renders inside a <time datetime> using the exact string the record holds, so a FHIR 2026-08 stays August rather than being widened to the first of the month.",
    },
  ],

  guidance: {
    use: [
      "The main record view, where sections are read closed more often than open.",
      "Any list of sections where at least one can carry a severity.",
      "Surfaces that need to be printable in one action.",
    ],
    avoid: [
      "Patient-facing surfaces — this is clinician density and clinician vocabulary. Compose Accordion directly.",
      "Two or three sections. The toolbar and the summary vocabulary are overhead at that size.",
      "As a layout for content with no state to summarise. Use Accordion.",
    ],
  },

  limitations: [
    "The chip is local to this component until StatusBadge ships. It already uses the --ox-badge-* tokens, so adopting StatusBadge is a refactor rather than a re-design.",
    "The timestamp is rendered verbatim, not localised. Formatting and time-zone rendering belong to @oxygenui-design/intl, and inventing a second formatter here would guarantee they disagree.",
    "Expand all opens gated sections to their gate, not to their content — one press cannot consent on the reader's behalf.",
    "Sections are rendered in the order given. It does not sort by severity, because a record's order is usually clinical rather than alphabetical.",
  ],
  related: ["accordion", "safety-plan", "care-timeline", "tabs", "timeline", "clinical-status"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "accordion-core", "accordion"],

  usage: `import { ChartAccordion } from "@/components/oxygen/chart-accordion";

<ChartAccordion
  toolbarLabel="Ada Lovelace · 38 · MRN 4471902"
  headingLevel={2}
  onDisclose={async (event) => audit.record(event)}
  sections={[
    {
      key: "risk",
      label: "Risk & suicidality",
      severity: "critical",
      status: "C-SSRS positive",
      updatedAt: "2026-08-13T09:12:00+05:30",
      children: <RiskPanel {...risk} />,
    },
    {
      key: "meds",
      label: "Medications",
      severity: "high",
      status: "Clozapine ANC due 18 Aug",
      count: "4 active",
      children: <MedicationList {...meds} />,
    },
    {
      key: "psychotherapy",
      label: "Psychotherapy notes",
      access: { kind: "withheld", reason: "Kept separately by the author" },
    },
  ]}
/>`,
});

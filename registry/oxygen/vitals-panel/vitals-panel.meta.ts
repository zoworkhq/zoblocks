import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "vitals-panel",
  title: "Observation Panel",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary:
    "Results table with reference ranges and interpretation. Uninterpreted results stay uninterpreted.",
  description:
    "Results table for FHIR R4 Observation resources. Renders values, units, reference ranges, and interpretation — with uninterpreted results shown as uninterpreted, never as normal.",
  rationale:
    "Renders a set of Observation resources as a results list: value, units, reference range, and interpretation. The interpretation logic is the entire point. An interpretation stated in the payload always wins; absent one, it is derived only by comparing the value to its own reference range; with neither, the result reads “Not interpreted” rather than “Normal”. Silently defaulting an uninterpreted result to normal is how a UI manufactures false reassurance.",

  categories: ["Clinical data", "Clinical"],
  fhir: [
    {
      name: "Observation[]",
      url: "https://hl7.org/fhir/R4/observation.html",
    },
  ],

  states: [
    "Multi-component (blood pressure)",
    "Critical high and low",
    "High and low",
    "Normal",
    "Not interpreted",
    "No value (dataAbsentReason)",
    "Preliminary",
    "Amended and corrected",
    "Empty",
    "Loading",
  ],

  a11y: [
    {
      label: "Table semantics",
      detail: "Real table markup with scoped column headers and an accessible caption.",
    },
    {
      label: "Critical announcement",
      detail:
        "A live region states the critical count before the table is read, so severity is known up front rather than discovered on row seven.",
    },
    {
      label: "Never color alone",
      detail:
        "Every interpretation carries an icon and a text label. Critical rows add an inset rule — a second structural cue that survives grayscale and forced colors.",
    },
    {
      label: "Row activation",
      detail:
        "When onSelect is provided, rows are focusable and respond to Enter and Space with a visible focus ring.",
    },
    {
      label: "Multi-part results",
      detail:
        "Blood pressure and other component-carried readings render each part as its own row, separately valued and separately flagged. The parent escalates to its worst component so a raised systolic is never hidden behind a silent panel.",
    },
  ],

  guidance: {
    use: [
      "For lab panels, vitals, and any grouped set of Observation resources.",
      "With hideReferenceRange on patient-facing surfaces where a range would confuse more than inform.",
      "Sorted with the most clinically urgent results first — the component preserves your order.",
    ],
    avoid: [
      "For a single headline value. Use a metric card so the value is not buried in a table.",
      "For trending over time. This is a point-in-time panel, not a chart.",
      "As a substitute for critical-result notification. A visible badge is not an alerting pathway.",
    ],
  },

  limitations: [
    "Renders referenceRange[0] only. Age- and sex-specific ranges are not yet selected by context.",
    "Component reference ranges are read from referenceRange[0], same as the parent.",
    "No built-in unit conversion. Values render in the units supplied.",
  ],
  related: ["patient-banner"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "absent-value"],

  usage: `import { ObservationPanel } from "@/components/oxygen/vitals-panel";

export function Results({ bundle }: { bundle: Bundle<Observation> }) {
  const observations =
    bundle.entry?.map((entry) => entry.resource!) ?? [];

  return (
    <ObservationPanel
      observations={observations}
      label="Chemistry panel"
      onSelect={(observation) => openDetail(observation.id)}
    />
  );
}`,
});

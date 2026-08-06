import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "clinical-value",
  title: "Clinical Value",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "One measured quantity, unit, and comparator as a single atomic element that cannot drift apart.",
  description: "One measured quantity, unit, comparator, and interpretation as a single atomic element. Preserves reported precision and never lets a value drift apart from its unit.",
  rationale: "The bug this prevents is mundane and everywhere: a value and its unit as separate nodes, which drift apart under truncation, wrapping, or translation. Here they are one element. Precision is never changed — a lab that reported 5.10 meant three significant figures. Comparators survive, because a result of <0.01 is not 0.01. Absence routes to AbsentValue; there is no path that renders an empty string.",

  categories: [
    "Primitive",
    "Clinical",
  ],
  fhir: [
    {
      name: "Quantity",
      url: "https://hl7.org/fhir/R4/datatypes.html#Quantity",
    },
  ],

  states: [
    "Numeric with unit",
    "Comparator (<0.01)",
    "Non-numeric result",
    "Absent with a reason",
    "Absent with no reason",
    "Unit missing",
  ],

  a11y: [
    {
      label: "One accessible name",
      detail: "The comparator, number, and expanded unit are announced as a single phrase, so a screen reader never reads a bare number.",
    },
    {
      label: "Unit expansion",
      detail: "Common units are spoken in full — mg/dL and mmol/L differ by a factor that matters. Unknown units are announced as written rather than guessed at.",
    },
    {
      label: "Tabular figures",
      detail: "Decimal points align down a column, which is what makes a dense results table scannable.",
    },
  ],

  guidance: {
    use: [
      "Any place a measured quantity is displayed, in tables and in patient apps.",
      "With tone set from a resolved interpretation, never from a raw colour.",
      "With field set so an absent value announces which field it belongs to.",
    ],
    avoid: [
      "Re-rounding a value before passing it. Precision came from the source.",
      "Splitting the unit into a sibling element — that is the failure this exists to prevent.",
      "Using tone to convey severity on its own; pair it with a badge.",
    ],
  },

  limitations: [
    "Unit conversion is not performed. Convert upstream and pass the value you want shown.",
    "The spoken-unit table covers common units only; an unlisted unit is read as written.",
    "Tone is presentational \\u2014 it does not derive severity from the value.",
  ],
  related: [
    "absent-value",
    "reference-range",
    "vitals-panel",
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
    "absent-value",
  ],

  usage: `import { ClinicalValue } from "@/components/oxygen/clinical-value";

<ClinicalValue quantity={{ value: 6.8, unit: "mmol/L" }} tone="critical" bold />
<ClinicalValue quantity={{ value: 0.01, comparator: "<", unit: "ng/mL" }} />
<ClinicalValue field="Magnesium" absentReason={observation.dataAbsentReason} />`,
});

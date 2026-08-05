import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "reference-range",
  title: "Reference Range",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "Positions a result against its own range, and refuses to draw when no bound was stated.",
  description: "Positions a result against its own reference range. Refuses to draw when no numeric bound was stated, and marks off-scale and one-sided ranges rather than implying bounds nobody gave.",
  rationale: "A badge tells you a potassium is high. It does not tell you whether it is 5.2 or 6.8, and those are different afternoons. The discipline is in refusing to draw: no numeric bound means no bar, because a drawn scale implies bounds nobody stated. An off-scale value is clamped with an explicit marker rather than silently pinned to the edge as though it were merely borderline.",

  categories: [
    "Primitive",
    "Clinical",
  ],
  fhir: [
    {
      name: "Observation.referenceRange",
      url: "https://hl7.org/fhir/R4/observation.html#Observation.referenceRange",
    },
  ],

  states: [
    "Bounded range",
    "One-sided range",
    "No range available",
    "Value off scale",
    "Text-only range",
    "No value",
  ],

  a11y: [
    {
      label: "Decorative by design",
      detail: "The bar is hidden from assistive technology. The value, bounds, and interpretation are announced by the surrounding row; a nameless graphic would add noise, not access.",
    },
    {
      label: "Off-scale survives greyscale",
      detail: "An off-scale marker changes shape as well as position, and is labelled in text, so the fact survives monochrome printing.",
    },
    {
      label: "Bounds as text",
      detail: "Numeric bounds render as text beside the bar rather than as axis labels inside it.",
    },
  ],

  guidance: {
    use: [
      "Beside a value in a results table, where \\u201chow far out\\u201d is the real question.",
      "In trend and detail views where the band gives a value its context.",
    ],
    avoid: [
      "Supplying a range from a lookup table rather than the observation. Ranges are age-, sex-, and assay-conditional.",
      "Treating it as the severity signal. It is always paired with a badge and text.",
      "Expecting a bar for a text-only range \\u2014 it renders the text instead, deliberately.",
    ],
  },

  limitations: [
    "Purely presentational \\u2014 it does not resolve which range applies to this patient.",
    "One-sided ranges infer the far end of the scale; it is marked, not hidden.",
    "Age- and sex-conditional range selection is the caller's job.",
  ],
  related: [
    "clinical-value",
    "vitals-panel",
    "status-badge",
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

  usage: `import { ReferenceRange } from "@/components/oxygen/reference-range";

<ReferenceRange
  value={6.8}
  range={observation.referenceRange?.[0]}
  interpretation={getInterpretation(observation)}
/>`,
});

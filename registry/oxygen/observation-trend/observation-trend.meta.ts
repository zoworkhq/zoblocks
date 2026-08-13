import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "observation-trend",
  title: "Observation Trend",
  tier: "free",
  status: "experimental",
  since: "0.2.0",
  layer: "clinical",

  summary:
    "One measurement over time. Abnormality is encoded as shape and colour, and the data table is an accessible peer rather than a fallback.",
  description:
    "A time series for FHIR Observations sharing one code. Draws the reference band only when a numeric range was actually stated, encodes each point's interpretation as a distinct shape as well as a colour, annotates only what crosses, and ships a real data table that assistive technology reads instead of the drawing.",
  rationale:
    "A clinician reads a trend, not a number. A potassium of 5.4 means something different if the last three were 4.1, 4.6, 5.0 — and a library that renders every value in isolation uses the one framing that hides deterioration. A chart is also the surface where this library's founding rule is hardest: status is never colour alone, but nothing can put a text label on every point. Four decisions resolve it. Abnormality is a shape as well as a hue, so direction survives monochrome printing and colour vision deficiency. Only critical points and the latest point are annotated, which is the interruption budget applied to a drawing. The data table is always in the accessibility tree and the SVG is hidden from it, so the text equivalent is the primary artifact rather than a degraded one. And no stated range means no band, because an invented normal band is a fabricated clinical claim that reads as the definition of normal for the entire series.",

  categories: ["Clinical", "Visualisation"],
  fhir: [
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
    },
  ],

  states: [
    "Series with a stated reference band",
    "Series with no reference range (no band drawn, stated in the summary)",
    "One-sided reference range",
    "Critical points present",
    "Uninterpreted points (hollow diamond, never a filled normal mark)",
    "Observations excluded for having no value, counted not dropped",
    "Observations excluded for having no usable time, counted not dropped",
    "Imprecise dates marked in the table",
    "Empty series",
    "Table hidden, table revealed",
  ],

  a11y: [
    {
      label: "The table is the accessible artifact",
      detail:
        "The SVG is aria-hidden. A real table with a caption, column headers and a row header per timestamp is always present in the accessibility tree, so a screen-reader user gets every value rather than a summary.",
    },
    {
      label: "Shape as well as colour",
      detail:
        "Circle in range, triangle up for high, triangle down for low, square for critical, hollow diamond for uninterpreted. The direction of an abnormal result survives monochrome output and colour vision deficiency.",
    },
    {
      label: "Uninterpreted is visually distinct",
      detail:
        "An uninterpreted point is drawn hollow so it cannot read as an assessed, in-range one, and the table spells it out as \\u201cNot interpreted\\u201d.",
    },
    {
      label: "Summary states what is missing",
      detail:
        "Excluded observations and the absence of a reference range are stated in the caption, which is read before the table.",
    },
    {
      label: "Toggle is a real button",
      detail:
        "The show/hide control is a button with aria-expanded, and hiding uses sr-only rather than display:none so the table never leaves the accessibility tree.",
    },
  ],

  guidance: {
    use: [
      "For a series of Observations sharing one code, with the time zone stated explicitly.",
      "Beside ObservationPanel, where the panel answers \\u201cwhat is it\\u201d and this answers \\u201cwhere is it going\\u201d.",
      "With range=\\u201cnone\\u201d when the measurement has no meaningful normal band.",
    ],
    avoid: [
      "Mixing codes in one series. Two analytes on one axis is a different component.",
      "Passing a range the source did not state in order to get a band drawn.",
      "Using it as the only representation of a long series \\u2014 past roughly thirty points, the table is the readable artifact and the chart is orientation.",
    ],
  },

  limitations: [
    "Annotates critical points and the latest point only. A dense series with many non-critical abnormal values relies on the table.",
    "The x axis is linear in time and unlabelled; it shows shape, not exact spacing. Read timestamps from the table.",
    "Does not aggregate, resample, or interpolate. Gaps in time are drawn as straight segments between the points that exist.",
    "Interpretation is never computed here \\u2014 it comes from Observation.interpretation, or from the observation's own reference range via getInterpretation.",
    "Components of a multi-component Observation (a blood pressure) are not plotted; pass a single-value code.",
  ],
  related: ["vitals-panel", "clinical-value", "reference-range", "absent-value"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "absent-value"],

  usage: `import { ObservationTrend } from "@/components/oxygen/observation-trend";

<ObservationTrend
  observations={potassiumSeries}
  timeZone="Europe/London"
  label="Potassium"
/>

// No band unless the source stated one:
<ObservationTrend observations={series} timeZone="UTC" range="none" />`,
});

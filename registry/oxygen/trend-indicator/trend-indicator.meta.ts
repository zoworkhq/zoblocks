import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "trend-indicator",
  title: "Trend Indicator",
  technicalName: "TrendIndicator",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A sparkline that refuses to draw a trend it cannot justify — across an assay change, a unit change, or two points.",
  description:
    "Breaks the line wherever comparability breaks and says why in words. Renders no trend below three comparable points. Takes the valence as a required prop, so a falling PHQ-9 reads as improvement and a falling eGFR does not, and carries the reliable-change threshold so a two-point move renders as noise.",
  rationale:
    "A sparkline is a claim that the points are comparable, and three things routinely break that claim while no library checks any of them. The assay changed: a lab switching immunoassay platforms shifts every ferritin by 20% with no clinical change at all. The units changed, silently, in an interface feed. Or there are simply two points, and a line between two points is not a trend, it is a rhetorical device. The second problem is separate and just as common: a downward line is not automatically good news. A falling PHQ-9 is improvement; a falling eGFR is not. Direction has no valence until somebody supplies one, so valence is a required prop rather than an assumption baked into a colour — a library that guesses gets half of all clinical measures wrong, silently, in green.",

  categories: ["Clinical", "Data Display"],

  fhir: [
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "Consumes a series. method, device and valueQuantity.unit decide comparability; referenceRange shades the band behind the line.",
    },
  ],

  states: [
    "Rising, and worsening",
    "Falling, and improving",
    "Within the reliable-change threshold",
    "Broken by an assay change",
    "Broken by a silent unit change",
    "Two points — no trend",
    "One point",
    "No results at all",
    "Neutral valence",
    "With a reference band",
    "Narrow — glyph and delta only",
    "Sixty points",
    "Points reachable from the table",
  ],

  a11y: [
    {
      label: "A text alternative is emitted, not assumed",
      detail:
        'Unless the host supplies describedBy, the component renders the whole series as a visually-hidden table. A sparkline with no text behind it is unreadable to a screen reader and invisible to a page search, and "decorative" is not true of a line somebody is about to act on.',
    },
    {
      label: "Direction and valence are both spoken",
      detail:
        '"Falling, improving" for a PHQ-9 and "falling, worsening" for an eGFR. They are different facts, and a component that spoke only one would be unreadable for exactly the readers who most need the alternative.',
    },
    {
      label: "The glyph carries direction without the hue",
      detail:
        "A triangle for rising, an inverted one for falling, a bar for flat — and the sign on the delta says the same thing again. Remove every colour and the direction survives, which matters here more than almost anywhere: hue is the only channel that ever distinguished a good fall from a bad one.",
    },
    {
      label: "A break is a gap and a sentence",
      detail:
        "Segments are separate paths rather than one path with a dashed gap. A dash is a convention a reader has to already know; two lines that do not join are unambiguous, and the reason is in text beside them rather than in a tooltip.",
    },
    {
      label: "Noise is neutral, not softened",
      detail:
        "Below the reliable-change threshold the direction is flat and the colour is neutral, whatever the arithmetic says. That is the clinical rule for a two-point PHQ-9 move, not a visual softening of a real change.",
    },
  ],

  limitations: [
    "It does not detect an assay change on its own. A lab that switches platform without saying so produces a series this component will happily draw — the break has to be in the data, and only a silent unit change is caught automatically.",
    "Time is linear on the x axis, so a series with one point last year and five this week compresses the recent ones. That is honest about elapsed time and unhelpful for reading the recent shape; a flowsheet wanting even spacing should pass an evenly-spaced series.",
    "No zoom, pan or tooltip. Hover detail belongs to the surface around it, and building a chart library into a 1.4 kB component would defeat the reason it is 1.4 kB.",
    "The significance threshold is a single number. Instruments whose reliable change varies by baseline need the caller to compute it per series.",
  ],

  related: ["result-value", "clinical-status"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "trend-core"],

  usage: `import { TrendIndicator } from "@/components/oxygen/trend-indicator";
import "@/styles/oxygen-trend.css";

<TrendIndicator
  series={{
    id: "phq9",
    label: "PHQ-9",
    valence: "higher-is-worse",
    significantChange: 5,
    points: [{ at: "2026-05-02", value: 18 }, { at: "2026-06-06", value: 14 }],
  }}
/>`,

  guidance: {
    use: [
      "In a flowsheet or a results list, beside the latest value rather than instead of it.",
      "For measurement-based care, with significantChange set to the instrument's reliable-change index — so a two-point PHQ-9 move renders as noise and a six-point move renders as change.",
      "With referenceRange when the measure has one. The band behind the line is what turns a shape into a judgement.",
      "At any width. Below 40px it drops the line for the glyph and the delta rather than drawing something unreadable.",
    ],
    avoid: [
      "As the only representation of a series. It is a shape; the values, the dates and the reference range are the rest, and the hidden table exists precisely because the shape is not enough.",
      'With valence guessed upstream. If nobody knows whether up is good, pass "neutral" and let the colour stay out of it.',
      "For a series whose points came from different instruments without saying so. The component can only break where the data admits a break.",
    ],
  },

  uxGuidelines: {
    do: [
      "Set significantChange from the instrument rather than from taste. It is the difference between a component that reports arithmetic and one that reports change.",
      'Put the break reason in the data. "Switched to Roche Elecsys" is what a reader needs; a gap on its own is a puzzle.',
      "Keep the series identity stable across renders. The memo compares it, and a flowsheet re-renders on every keystroke.",
    ],
    dont: [
      "Do not colour by direction. Half of clinical measures improve by falling, and colouring by direction gets one half wrong in green.",
      "Do not bridge a comparability break to make the line continuous. The continuity is the claim, and it is the one that is false.",
      "Do not suppress the hidden table to tidy the DOM. It is the only representation some readers get.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: ["sparkline", "trend line", "mini chart", "lab trend", "measurement based care"],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "The workhorse of measurement-based care. It carries the reliable-change threshold for the instrument, so a two-point PHQ-9 move renders as noise and a six-point move renders as change — which is the actual clinical rule rather than a visual flourish.",
    workflows: ["assessment", "documentation", "treatment-planning", "care-coordination"],
    phi: {
      handles: true,
      notes:
        "Renders a person's measurements over time, including the dates. The hidden table carries all of them in text, which is the point and is also the part a screenshot will not show.",
    },
    auditable: false,
    permissions: ["observation.read"],
    terminology: ["LOINC", "FHIR"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description: "64 × 20, with the glyph and delta beside the line.",
      args: { width: 64, height: 20 },
    },
    {
      id: "wide",
      label: "Wide",
      description: "For a detail panel, where the shape is the point rather than the summary.",
      args: { width: 160, height: 32 },
    },
    {
      id: "narrow",
      label: "Narrow",
      description:
        "Below 40px the line is dropped for the glyph and the delta — never an unreadable line.",
      args: { width: 32, height: 20 },
    },
  ],

  controls: [
    {
      prop: "width",
      control: "slider",
      label: "Width",
      min: 24,
      max: 200,
      step: 8,
      defaultValue: 64,
    },
    {
      prop: "height",
      control: "slider",
      label: "Height",
      min: 12,
      max: 48,
      step: 4,
      defaultValue: 20,
    },
    { prop: "onSelectPoint", control: "event", label: "onSelectPoint" },
  ],

  a11yChecks: [
    {
      wcag: "1.1.1",
      name: "Non-text content",
      status: "pass",
      how: 'role="figure" with a composed name, and a visually-hidden data table emitted unless the host supplies describedBy. A test asserts the table carries every point.',
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Direction is a CSS glyph and a signed delta before it is a hue, and both the direction and the valence reach the accessible name as words. A test asserts a rising-worse and a rising-better series differ in text, not only in colour.",
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "The hidden alternative is a real table with a caption, column headers and row headers — not a paragraph of comma-separated numbers.",
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: "The svg is aria-hidden and the figure carries the name, so a screen reader gets one statement and one table rather than an unlabelled graphic.",
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Point selection, when the host wires it, is a native button per row inside the table — reachable by keyboard without the component managing focus.",
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "The caller sets the width and the component degrades to glyph and delta below 40px rather than compressing a line into illegibility.",
      evidence: "trend-indicator.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "The line and the terminus draw from gated status tokens; the reference band is deliberately below the floor because it is a backdrop rather than a signal, and it carries no information the text does not.",
      evidence: "contrast.gate",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No timing and no animation.",
    },
  ],

  fixtures: ["observationPanel", "observationCorrected", "observationPotassiumCritical"],

  examples: [
    {
      id: "valence",
      title: "A falling line is not automatically good news",
      description:
        "The same shape, twice. A falling PHQ-9 is improvement; a falling eGFR is not. Valence is a required prop because a library that guesses gets half of all clinical measures wrong, silently, in green.",
      fixture: "observationPanel",
      code: `<TrendIndicator series={{ id: "phq9", label: "PHQ-9", valence: "higher-is-worse",
  significantChange: 5, points: phq9 }} />

<TrendIndicator series={{ id: "egfr", label: "eGFR", valence: "higher-is-better",
  unit: "mL/min", points: egfr }} />`,
    },
    {
      id: "comparability",
      title: "Where comparability breaks, the line breaks",
      description:
        'A lab switching immunoassay platforms shifts every ferritin by 20% with no clinical change at all. Two separate paths say "these are not the same series" without a legend; a dashed gap says it only to somebody who already knows the convention.',
      fixture: "observationCorrected",
      code: `points: [
  { at: "2026-01-04", value: 180 },
  { at: "2026-03-02", value: 176 },
  // Everything after this is on a different scale.
  { at: "2026-05-09", value: 212, breaksComparability: "switched to Roche Elecsys" },
  { at: "2026-07-11", value: 218 },
]`,
    },
    {
      id: "noise",
      title: "Two points of PHQ-9 is not a change",
      description:
        "Below the reliable-change threshold the trend renders flat and neutral, whatever the arithmetic says. That is the clinical rule for the instrument, not a softening of a real move.",
      fixture: "observationPotassiumCritical",
      code: `<TrendIndicator
  series={{
    id: "phq9", label: "PHQ-9", valence: "higher-is-worse",
    // The reliable-change index for the PHQ-9. Below it, noise.
    significantChange: 5,
    points: [{ at: "2026-05-02", value: 14 }, { at: "2026-06-06", value: 13 },
             { at: "2026-07-04", value: 12 }],
  }}
/>;`,
    },
    {
      id: "too-few",
      title: "Two points is not a trend",
      description:
        "It is a rhetorical device. Below three comparable points the component draws no line and says how many it has — because an absent trend and a trend that did not move are different facts, and drawing the second for the first is the lie it exists to refuse.",
      fixture: "observationPanel",
      code: `// Renders "2 results. A trend needs at least 3." — no line.
<TrendIndicator series={{ id: "cr", label: "Creatinine", valence: "higher-is-worse",
  points: [{ at: "2026-06-01", value: 88 }, { at: "2026-07-01", value: 104 }] }} />`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["results-review", "measurement-based-care"],
    alternatives: [{ ref: "result-value", when: "there is one measurement rather than a series" }],
  },

  seo: {
    slug: "trend-indicator",
    title: "Trend Indicator — React clinical sparkline",
    description:
      "A React sparkline for clinical series: breaks where the assay or unit changed, refuses a trend under three points, and takes the valence as a prop.",
    primaryKeyword: "react clinical sparkline",
    secondaryKeywords: [
      "lab trend component react",
      "measurement based care ui",
      "sparkline accessibility",
      "reliable change index display",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});

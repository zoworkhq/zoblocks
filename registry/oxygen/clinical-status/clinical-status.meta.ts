import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "clinical-status",
  title: "Clinical Status",
  technicalName: "ClinicalStatus",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "primitive",

  summary:
    "One closed status vocabulary: nine scales whose every step carries a hue, a CSS shape and a word, emitted together or not at all.",

  tagline: "Nine status scales. Hue, shape and word, or nothing.",
  description:
    "A chip, a dot, or a grid affix — three presentations of one datum, drawn from nine fixed scales with no free-text status. Each step pairs a tone with a CSS-drawn glyph and a word in both a clinician and a patient register, so the state survives greyscale, Windows high-contrast and monochrome print.",
  rationale:
    "Every healthcare product invents its own status colours, six times, in six teams, and the results disagree: amber means pending in the lab module and abnormal in the vitals module, so a clinician who learns one is actively misled by the other. The usual response is a nicer palette, which changes nothing, because the encoding is still colour plus a word in a colour-matched hue — and that collapses in forced-colors, in monochrome print, and for the roughly 8% of male clinicians with a red-green deficiency. The fix is a closed vocabulary. A step exists in it or it cannot be rendered at all, and every step carries three channels chosen together. The shape is not decoration and not an icon: it is a second channel carrying the same bit, drawn in currentColor from CSS geometry so it costs no network request and survives the theme being stripped entirely.",

  categories: ["Clinical", "Primitives"],

  fhir: [
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "status and interpretation map onto the result-status and criticality scales, one adapter each.",
    },
    {
      name: "AllergyIntolerance",
      url: "https://hl7.org/fhir/R4/allergyintolerance.html",
      note: "criticality maps onto the criticality scale — high becomes critical, because the FHIR word understates it.",
    },
    {
      name: "Consent",
      url: "https://hl7.org/fhir/R4/consent.html",
      note: "provision.type plus security labels map onto the access scale, with 42 CFR Part 2 as its own step.",
    },
  ],

  states: [
    "Critical — the panic value",
    "High — outside the range, not dangerous",
    "Normal",
    "Not assessed — absence as a fact",
    "Preliminary — in flight",
    "Corrected — the value changed",
    "Entered in error",
    "Restricted — present, gated, explained",
    "Part 2 segmented",
    "Break-glass open",
    "Stale — true once",
    "Self-reported",
    "AI draft, awaiting a clinician",
    "Disengaged — behavioral health",
    "Dot, in a status column",
    "Grid affix, at forty rows",
    "Compact density",
    "Explainable — the chip is a button",
  ],

  a11y: [
    {
      label: "Colour is never the signal",
      detail:
        "Every step emits a hue, a CSS-drawn shape and a word together. Remove the hue — greyscale, monochrome print, a red-green deficiency — and the shape and the word both survive. This is the component's entire reason to exist, not a mitigation applied afterwards.",
    },
    {
      label: "The glyph survives forced-colors",
      detail:
        "Windows high-contrast strips backgrounds and custom colours. The glyphs are geometry drawn in currentColor rather than an icon font or an SVG sprite, so they inherit the system colour and remain the channel that carries the state when the chip's own palette is gone.",
    },
    {
      label: "The name is qualified by its scale",
      detail:
        'The accessible name is "Criticality: Critical", not "Critical". A chip in a table cell has no column header in its accessible context, and the bare word has been read out beside a medication, a lab value and an appointment on the same screen — meaning something different each time.',
    },
    {
      label: "Interactive only when there is something to open",
      detail:
        "Without onExplain the chip is a labelled image with no tab stop. A focusable element with no action is a keyboard trap with extra steps, and a status chip is the most-repeated element on a chart.",
    },
    {
      label: "The word never disappears",
      detail:
        "Below 360px the chip abbreviates rather than dropping to the glyph alone, and the full word stays in the accessible name. Glyph-alone requires a legend the reader does not have.",
    },
  ],

  limitations: [
    "The vocabulary is closed by design. A host that needs a step outside the nine scales must extend the vocabulary rather than pass free text, and that is a pull request rather than a prop.",
    "The dot presentation carries one visible channel and is only safe in a column that is entirely status, beside a legend. Nothing in the component can enforce that.",
    "No terminology service. The words here are English clinician and patient phrasings; a deployment needing another language supplies them through @oxygenui-design/intl.",
  ],

  related: [
    "chart-accordion",
    "switch",
    "result-value",
    "allergy-chip",
    "risk-indicator",
    "provenance-chip",
    "trend-indicator",
    "care-team-presence",
  ],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "clinical-status-core"],

  usage: `import { ClinicalStatus } from "@/components/oxygen/clinical-status";
import "@/styles/oxygen-clinical-status.css";

<ClinicalStatus scale="criticality" step="critical" />
<ClinicalStatus scale="access" step="part-2" />
<ClinicalStatus scale="result-status" step="preliminary" shape="affix" />`,

  guidance: {
    use: [
      "Anywhere a record carries a state a clinician acts on — result criticality, order lifecycle, access class, engagement, AI verification.",
      'In a grid past about forty rows, with shape="affix", so the column is a set of rules rather than a field of coloured pills.',
      'With onExplain wherever the step\'s meaning is not obvious to every reader of the screen. Guessing what "preliminary" means is a clinical act.',
      'With audience="patient" on any portal surface, so "Entered in error" reaches the person it is about as "Recorded by mistake".',
    ],
    avoid: [
      "As a general-purpose badge. It is a clinical vocabulary, and diluting it with product statuses is how the vocabulary stops being trustworthy.",
      'With shape="dot" outside a column that is entirely status and carries a legend.',
      "To convey a state the scales do not contain. Extend the vocabulary instead — a free-text escape hatch would return the library to the problem it was built to solve.",
    ],
  },

  uxGuidelines: {
    do: [
      'Let the scale carry the qualification. "Criticality: Critical" reads correctly in a table cell; "Critical" does not.',
      "Keep one scale per column. Mixing criticality and result-status in one column makes the shapes ambiguous again.",
      "Pass the qualifier prop for time or count context rather than rendering a second element beside the chip.",
    ],
    dont: [
      "Do not restyle the tones per surface. The point of the vocabulary is that amber means the same thing in every module.",
      "Do not use the affix shape outside a grid — the 3px rule reads as a row marker, and floating in prose it reads as a rendering artefact.",
      "Do not add an icon beside the chip. The glyph is already the second channel, and a third competes with it.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: ["status badge", "status chip", "clinical badge", "severity indicator", "result status"],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "The status vocabulary the rest of the library reads from. Nine scales cover result criticality, result lifecycle, data quality, access class, AI verification, engagement, encounter state, urgency and screener-derived risk — the last two of which no generic component library models at all.",
    workflows: ["assessment", "documentation", "care-coordination", "medication"],
    phi: {
      handles: false,
      notes:
        "Renders a state, never an identifier or a value. The access scale describes how protected a record is without disclosing any of it, which is what lets a Part 2 chip appear on a screen the reader is not cleared for.",
    },
    auditable: false,
    permissions: [],
    terminology: ["FHIR", "SNOMED CT", "LOINC"],
  },

  variants: [
    {
      id: "chip",
      label: "Chip",
      description:
        "All three channels. The default, and the only presentation safe without a legend.",
      args: { shape: "chip" },
    },
    {
      id: "dot",
      label: "Dot",
      description:
        "The glyph alone, word in the accessible name. For a column that is entirely status.",
      args: { shape: "dot" },
    },
    {
      id: "affix",
      label: "Grid affix",
      description: "A 3px leading rule and a short word, for grids past about forty rows.",
      args: { shape: "affix" },
    },
    {
      id: "compact",
      label: "Compact",
      description: "22px rather than 26px. Density changes the chip; the hit area holds at 24px.",
      args: { density: "compact" },
    },
    {
      id: "patient",
      label: "Patient register",
      description: "The same step, in the words the person it is about would use.",
      args: { audience: "patient" },
    },
  ],

  controls: [
    {
      prop: "scale",
      control: "select",
      label: "Scale",
      options: [
        "criticality",
        "result-status",
        "data-quality",
        "access",
        "ai-verification",
        "engagement",
        "encounter",
        "urgency",
        "risk",
      ],
      defaultValue: "criticality",
    },
    { prop: "step", control: "text", label: "Step", defaultValue: "critical" },
    {
      prop: "shape",
      control: "segmented",
      label: "Shape",
      options: ["chip", "dot", "affix"],
      defaultValue: "chip",
    },
    {
      prop: "density",
      control: "segmented",
      label: "Density",
      options: ["compact", "default"],
      defaultValue: "default",
    },
    {
      prop: "audience",
      control: "segmented",
      label: "Register",
      options: ["clinician", "patient"],
      defaultValue: "clinician",
    },
    { prop: "qualifier", control: "text", label: "Qualifier" },
    { prop: "onExplain", control: "event", label: "onExplain" },
  ],

  a11yChecks: [
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Every step emits a hue, a CSS shape and a word. A test asserts each of the thirty-nine steps renders a glyph and a word, so a step cannot be added with colour alone.",
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "1.4.11",
      name: "Non-text contrast",
      status: "pass",
      how: "All seven tones are gated at 3:1 for the glyph and 4.5:1 for the text across three themes in the token build.",
      evidence: "contrast.gate",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="img" with a composed label when static, a real button when onExplain is given. Never a focusable span with no action.',
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "The explain affordance is a native button, reached and activated by keyboard with no handler of the component's own.",
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "The interactive chip holds a 24px minimum at both densities; compact changes the chip, not the target.",
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "1.4.4",
      name: "Resize text",
      status: "pass",
      how: "Every dimension is in rem and the glyph scales with the chip, so the shape survives a 200% zoom rather than clipping.",
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "1.4.12",
      name: "Text spacing",
      status: "pass",
      how: "The chip is inline-flex with no fixed height on the text, so the increased line-height and letter-spacing of a user stylesheet grow it rather than overflow it.",
      evidence: "clinical-status.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "The component has no timing of any kind.",
    },
  ],

  fixtures: [
    "observationPotassiumCritical",
    "observationPreliminary",
    "observationCorrected",
    "patientRestricted",
    "allergyHighRisk",
  ],

  examples: [
    {
      id: "criticality-from-fhir",
      title: "Criticality, mapped rather than guessed",
      description:
        "The interpretation code decides the step. HH and LL are the panic values and the only ones that reach critical; H and L are simply outside the range, and conflating the two is how an alert list becomes noise nobody reads.",
      fixture: "observationPotassiumCritical",
      code: `import { ClinicalStatus, fromInterpretation } from "@/components/oxygen/clinical-status";
import { observationPotassiumCritical } from "@oxygenui-design/fixtures";

const code = observationPotassiumCritical.interpretation?.[0]?.coding?.[0]?.code;
const step = fromInterpretation(code);

// null rather than a guess when the code is unrecognised: a visible gap beats
// a plausible lie.
{step && <ClinicalStatus scale="criticality" step={step} qualifier="resulted 41 minutes ago" />}`,
    },
    {
      id: "restricted-is-not-absent",
      title: "Restricted is a state, not a gap",
      description:
        "Part 2 is its own step rather than a flavour of restricted, because 42 CFR Part 2 is a different legal regime from HIPAA minimum-necessary with a different re-disclosure rule. Rendering them the same teaches staff that they are the same.",
      fixture: "patientRestricted",
      code: `<ClinicalStatus scale="access" step="part-2" />

// The chip describes how protected a record is without disclosing any of it,
// which is what lets it appear on a screen the reader is not cleared for.`,
    },
    {
      id: "grid-affix",
      title: "Forty rows, and no field of pills",
      description:
        "At forty rows, forty chips is a colour field with a table behind it. The affix keeps the tone as a 3px rule at the row's leading edge and the meaning as a short word, and the row stays readable.",
      fixture: "observationPreliminary",
      code: `<td>
  <ClinicalStatus
    scale="result-status"
    step="preliminary"
    shape="affix"
    density="compact"
  />
</td>`,
    },
    {
      id: "patient-register",
      title: "The same step, in the other register",
      description:
        '"Entered in error" is an internal state. A portal that ships it has not translated anything — it has published a system word to the person the record is about.',
      fixture: "observationCorrected",
      code: `<ClinicalStatus scale="result-status" step="entered-in-error" audience="patient" />
// renders "Recorded by mistake"`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["clinical-documentation", "results-review"],
    alternatives: [
      {
        ref: "switch",
        when: "the state is something the reader may change rather than something the record reports",
      },
    ],
  },

  seo: {
    slug: "clinical-status",
    title: "Clinical Status — accessible React status chip",
    description:
      "A React status chip with nine fixed clinical scales. Every step carries a colour, a shape and a word, so it survives greyscale and high contrast.",
    primaryKeyword: "react clinical status component",
    secondaryKeywords: [
      "healthcare status badge react",
      "accessible status chip",
      "fhir observation status react",
      "colour blind safe status indicator",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});

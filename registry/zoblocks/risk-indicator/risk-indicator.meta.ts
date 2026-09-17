import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "risk-indicator",
  title: "Risk Indicator",
  technicalName: "RiskIndicator",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A risk score that cannot be displayed without its date, its drivers, and the fact that it is not a diagnosis.",

  tagline: "A score with its date, its drivers, and its limits.",
  description:
    "The band leads and the numeral is demoted. Staleness is on the face rather than in a tooltip, an expired score offers recompute or acknowledge and no third option, and the not-a-diagnosis framing is a required prop rather than a convention.",
  rationale:
    "Risk scores are the most casually rendered artefact in healthcare software: a number, a colour, a tooltip nobody reads. Three things go wrong. The score is stale — computed nightly, shown at noon, after the admission that would have changed it. The score is unattributed, so the clinician cannot see that 70% of it is driven by one ED visit eighteen months ago. And the score is read as a diagnosis, which is how an externally validated sepsis model with an AUC of 0.63 came to be trusted by clinicians who were never shown its performance. Each needs a shape rather than a caveat: the validity window is data because a 24-hour deterioration model and a 12-month readmission model expire differently, drivers are part of the value type rather than an optional extra, and the framing sentence is a required prop because every product that made it optional shipped without it.",

  categories: ["Clinical", "AI"],

  fhir: [
    {
      name: "RiskAssessment",
      url: "https://hl7.org/fhir/R4/riskassessment.html",
      note: "prediction[].probabilityDecimal and qualitativeRisk, whenPeriod.end as the validity window, basis[] as unweighted drivers, occurrenceDateTime and method. Pairs with a DSI source-attribute record for the model itself.",
    },
  ],

  states: [
    "High, with weighted drivers",
    "Moderate",
    "Low",
    "Imminent",
    "Not scored — the model could not",
    "Expired — past its validity window",
    "Unbounded — no validity window declared",
    "One factor dominates the score",
    "Drivers with no weights, from basis[]",
    "Percentile with its cohort",
    "Model card reachable",
    "Compact, in a panel list",
  ],

  a11y: [
    {
      label: "Never colour alone",
      detail:
        "The band is a ClinicalStatus chip, so it carries a shape and a word. Driver direction is a signed number before it is a fill colour, and the sign is what reaches the accessible name. Removing every hue leaves the band word, the sign and the sentence.",
    },
    {
      label: "The name ends with the framing",
      detail:
        "The whole score is one spoken statement — outcome, band, percentage, cohort, age, drivers, model — and the not-a-diagnosis clause is last. Put first it is boilerplate a listener skips; put last it is the sentence they are left with.",
    },
    {
      label: "Staleness is content, not a tooltip",
      detail:
        "An expired score renders the words on the face, in the reading order, before the drivers. A tooltip is invisible to anyone who did not hover, and the population that most needs this signal is the one scanning a panel of forty.",
    },
    {
      label: "A percentile is never spoken without its cohort",
      detail:
        '"94th percentile" of an unnamed population is routinely read as "94th percentile of people like this patient". The two are supplied together or not at all, and the type enforces it.',
    },
    {
      label: "Unscored is not a low score",
      detail:
        "A patient the model could not score gets its own band, its own dashed edge and its own sentence. Rendering it as the bottom band is how somebody the model cannot see becomes somebody the panel does not call.",
    },
  ],

  limitations: [
    "Presentational. It does not compute a score, refresh one, or call a model — the recompute affordance raises an event and the host does the work.",
    "Driver weights are the model's own units and are never normalised across models. A bar is scaled within one assessment only, because rescaling somebody else's attributions to compare two models is a chart that lies.",
    "No model card. It links to one; ModelTransparencyCard is a separate component, and inlining it here would put a page inside a chip.",
    "The FHIR adapter cannot produce weighted drivers. `basis[]` names references without attribution, so they render as unweighted rather than with a bar the data does not support.",
  ],

  related: ["clinical-status", "result-value", "data-grid"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "risk-core", "clinical-status"],

  usage: `import { RiskIndicator } from "@/components/zoblocks/risk-indicator";
import "@/styles/zoblocks-risk.css";

<RiskIndicator
  assessment={readmission}
  now={serverTime}
  notADiagnosis="A statistical estimate from historical patterns. Not a diagnosis, and not a substitute for assessment."
/>`,

  guidance: {
    use: [
      "Readmission, deterioration, no-show and care-gap models — anywhere a score drives who gets called first.",
      'In a care-manager panel with density="compact", where forty of these are read in a sitting and the staleness signal is the one that has to survive.',
      "Alongside a structured assessment rather than in place of one. A suicide-risk model output is not a C-SSRS, and the two belong on the same screen.",
      "With onRecompute wired wherever recomputation is possible, so an expired score has somewhere to go other than being ignored.",
    ],
    avoid: [
      "Without drivers when the model can produce them. An unattributed score is the second of the three failures, and the component cannot fix it for you.",
      "As the only risk signal on a screen. It is an estimate; the assessment, the history and the clinician are the rest.",
      "With a generic framing sentence copied between models. What a score is not depends on what it is, and a shared sentence is wrong for both.",
    ],
  },

  uxGuidelines: {
    do: [
      "Set validUntil from the model's own window. Without it the score renders as unbounded, which is honest, but it means nothing can ever expire.",
      "Pass the cohort with the percentile. The type requires it, and the reason is that readers supply their own cohort when you do not.",
      "Let the concentration line appear. A score that is mostly one ED visit is not wrong, and a clinician who knows that reads it correctly.",
    ],
    dont: [
      "Do not offer a dismiss action for an expired score. A score somebody waved away stays on the panel looking current.",
      "Do not render the numeral larger than the band. The band is the honest resolution of the estimate.",
      "Do not colour the whole card by band. It borrows the visual language of an alert, which is a thing somebody asserted rather than a thing a model estimated.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: [
    "risk score",
    "readmission risk",
    "predictive score",
    "risk stratification",
    "model output",
  ],

  domain: {
    industries: ["healthcare", "behavioral-health", "payer"],
    clinicalContext:
      "Panel triage and in-chart display for readmission, deterioration, no-show and rising-risk models. Suicide-risk models are the highest-stakes and the least well-calibrated, which is why the calibration is on the face and the component pairs the score with a structured assessment rather than standing in for one.",
    workflows: ["assessment", "care-coordination", "scheduling"],
    phi: {
      handles: true,
      notes:
        "Renders a model's estimate about a person and the factors driving it. The drivers are the disclosive part — 'lives alone', 'no PCP visit' — and they are on the face by design, because an unattributed score is the failure this component exists to prevent.",
    },
    auditable: true,
    permissions: ["risk.read"],
    terminology: ["FHIR", "SNOMED CT"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description: "Band, numeral, percentile, drivers, staleness and framing.",
      args: { density: "default" },
    },
    {
      id: "compact",
      label: "Compact",
      description: "For a panel list. The staleness signal never collapses.",
      args: { density: "compact" },
    },
  ],

  controls: [
    {
      prop: "density",
      control: "segmented",
      label: "Density",
      options: ["compact", "default"],
      defaultValue: "default",
    },
    {
      prop: "driverCount",
      control: "slider",
      label: "Drivers shown",
      min: 1,
      max: 6,
      step: 1,
      defaultValue: 4,
    },
    { prop: "notADiagnosis", control: "text", label: "Framing" },
    { prop: "now", control: "text", label: "Now (ISO 8601)" },
    { prop: "onOpenModel", control: "event", label: "onOpenModel" },
    { prop: "onRecompute", control: "event", label: "onRecompute" },
  ],

  a11yChecks: [
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "One labelled group carrying the whole statement in reading order, with every inner node aria-hidden. The relationship between score, age and framing is in the sentence rather than in visual adjacency.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "The band routes through ClinicalStatus for its shape and word; driver direction is a signed number. A test asserts the sign reaches the accessible name and that unknown is not styled as low.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="group" with a composed label. The model link, recompute and acknowledge affordances are all native buttons, present only when the host supplies a handler.',
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "Every affordance is a native button reached and activated by keyboard, with no handler of the component's own.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "Recompute and acknowledge hold a 24px minimum at both densities.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: "Below 420px the driver bars drop and the rows become label and weight; the staleness signal never collapses.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "1.4.12",
      name: "Text spacing",
      status: "pass",
      how: "A grid with no fixed heights; increased line-height and letter-spacing grow the card rather than clipping it.",
      evidence: "risk-indicator.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No timing. Staleness is computed against a `now` the host supplies, never a clock the component reads.",
    },
  ],

  fixtures: ["patientRoutine", "observationPotassiumCritical", "encounterRoutine"],

  examples: [
    {
      id: "the-three-failures",
      title: "The date, the drivers and the framing",
      description:
        "All three are structural. `validUntil` comes from the model's own window rather than a shared constant, drivers are part of the value type, and the framing is a required prop — because every product that made it optional shipped without it.",
      fixture: "patientRoutine",
      code: `<RiskIndicator
  now={serverTime}
  notADiagnosis="A statistical estimate from historical patterns. Not a diagnosis."
  assessment={{
    id: "readmit-30",
    outcome: "30-day readmission",
    band: "high",
    probability: 0.31,
    percentile: 94,
    cohort: "adult medicine",
    computedAt: "2026-08-12T04:12:00Z",
    validUntil: "2026-08-13T04:12:00Z",
    drivers: [
      { label: "3 admissions / 6 mo", weight: 11.2 },
      { label: "Lives alone", weight: 4.8 },
      { label: "No PCP visit < 90 d", weight: 3.9 },
      { label: "Adherent to statin", weight: -2.1 },
    ],
    model: { name: "Readmit-v4", auc: 0.71 },
  }}
/>;`,
    },
    {
      id: "expired",
      title: "Expired, not old",
      description:
        "Past its validity window the score stops being stale and starts being something the model no longer stands behind. There are two ways out and no third: a dismiss action would leave a waved-away score on the panel looking current.",
      fixture: "encounterRoutine",
      code: `<RiskIndicator
  now="2026-08-14T09:00:00Z"
  notADiagnosis="A statistical estimate, not a diagnosis."
  assessment={{ ...deterioration, validUntil: "2026-08-13T04:12:00Z" }}
  onRecompute={requestRecompute}
  onAcknowledge={recordAcknowledgement}
/>;`,
    },
    {
      id: "unscored",
      title: "Not scored is not low",
      description:
        'Missing features, outside the training population, a service that timed out — all produce a fact, and it is not "low". Rendering it as the bottom band is how a patient the model cannot see becomes a patient the panel does not call.',
      fixture: "patientRoutine",
      code: `<RiskIndicator
  now={serverTime}
  notADiagnosis="A statistical estimate, not a diagnosis."
  assessment={{
    id: "readmit-30",
    outcome: "30-day readmission",
    band: "unknown",
    computedAt: "2026-08-12T04:12:00Z",
  }}
/>;`,
    },
    {
      id: "concentration",
      title: "When one factor is most of the score",
      description:
        "A model whose top driver carries most of the total attribution is not modelling a patient; it is reporting one event. The component says so, because a clinician who knows that reads the number correctly and one who does not treats it as a synthesis.",
      fixture: "observationPotassiumCritical",
      code: `// 78% of the attribution sits on one driver, and the card says so.
drivers: [
  { label: "ED visit, 18 months ago", weight: 14.0 },
  { label: "Lives alone", weight: 2.1 },
  { label: "No PCP visit < 90 d", weight: 1.8 },
]`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["population-health", "results-review"],
    alternatives: [
      {
        ref: "clinical-status",
        when: "the thing being shown is an asserted state rather than a model's estimate",
      },
      { ref: "result-value", when: "the number came from a laboratory rather than a model" },
    ],
  },

  seo: {
    slug: "risk-indicator",
    title: "Risk Indicator — risk score component",
    description:
      "A React risk score component that renders its validity window, its top drivers with direction and weight, and a required not-a-diagnosis framing.",
    primaryKeyword: "react risk score component",
    secondaryKeywords: [
      "fhir riskassessment react",
      "clinical risk stratification ui",
      "predictive model display",
      "readmission risk component",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});

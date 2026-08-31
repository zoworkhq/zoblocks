import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "result-value",
  title: "Result Value",
  technicalName: "ResultValue",
  tier: "free",
  status: "stable",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A single observation rendered so that the four ways a number can lie to you are all impossible.",

  tagline: "One observation, rendered so the number cannot mislead.",
  description:
    "Value, unit and interpretation on one line, qualifiers on a second only when they exist. Seven distinct absence reasons instead of an em dash, a stated interpretation that always beats a derived one, a reference range that says so when there isn't one, and a correction that shows the superseded value rather than a badge.",
  rationale:
    "The most dangerous component in healthcare software is the one that renders a number, because every one of its failures looks perfect on screen. A preliminary result rendered identically to a final one: the clinician acts, and the value changes at 04:00. A result with no reference range rendered as though it were normal, because nothing was highlighted. A corrected result that silently replaced the value somebody read an hour ago and wrote into a note. An absent value rendered as an em dash, indistinguishable from a rendering bug, a cancelled test, a haemolysed specimen and a patient who declined the draw. None of the four is a styling problem and none is fixed by a nicer table. Each needs a shape: status is never implicit, an absent range is stated rather than left blank, a correction carries the old number with a line through it because the hazard is the reader's memory of it, and absence is seven sentences.",

  categories: ["Clinical", "Data Display"],

  fhir: [
    {
      name: "Observation",
      url: "https://hl7.org/fhir/R4/observation.html",
      note: "value[x], dataAbsentReason, status, interpretation, referenceRange including appliesTo, and note. DataAbsentReason renders as seven distinct states rather than one blank.",
    },
  ],

  states: [
    "Final, in range",
    "Critical, with a delta",
    "Preliminary — not verified by the laboratory",
    "Corrected — the superseded value is shown",
    "No reference range for this patient",
    "A range that needs its qualification",
    "Delta suppressed — the method changed",
    "Patient-reported",
    "Extracted by a model",
    "Absent — never ordered",
    "Absent — awaiting a result",
    "Absent — cancelled",
    "Absent — specimen problem",
    "Absent — patient declined",
    "Absent — restricted, and a value exists",
    "Absent — no value and no reason",
    "Compact, in a grid",
    "Interactive — opens the report",
  ],

  a11y: [
    {
      label: "The accessible name is the whole clinical sentence",
      detail:
        '"Potassium 6.8 millimoles per litre, critical, reference 3.5 to 5.1, final, resulted 41 minutes ago." One string, with everything inside hidden from the tree — because the clinical meaning is in the combination, and six separately-labelled nodes are read as six fragments with pauses between them. 6.8 is unremarkable until the unit, the range and the word critical arrive in the same breath.',
    },
    {
      label: "Units are spoken, not spelled",
      detail:
        'mmol/L reaches a screen reader as "millimoles per litre". Left as the symbol it is read character by character or skipped entirely, and a value without its unit is not a result.',
    },
    {
      label: "Direction is a glyph before it is a hue",
      detail:
        "A delta carries an up or down triangle and a signed number, and the direction reaches the accessible name as a word. The colour is reinforcement, which is the only thing colour is allowed to be here.",
    },
    {
      label: "Inert unless there is a report to open",
      detail:
        'role="group" with a label by default and no tab stop. Given onOpenReport it becomes a real button. A focusable element that does nothing is worse in a grid than anywhere else, because there are five hundred of them.',
    },
    {
      label: "Absence is never an em dash",
      detail:
        'Seven reasons, each with a word and a sentence. An em dash is indistinguishable from a rendering bug and asks the reader to guess between "nobody ordered it", "the specimen haemolysed" and "you are not allowed to see it" — three answers with three different next actions.',
    },
  ],

  limitations: [
    "Presentational only. It does not fetch, poll, or subscribe — a corrected result appears when the host re-renders with a new versionId, and nothing here will discover the correction on its own.",
    "The derived interpretation never reaches critical. A panic threshold is a laboratory policy rather than a distance from the reference range, so a red chip only ever appears when the source asserted one.",
    "No unit conversion. A value is rendered in the unit it arrived in; converting mg/dL to mmol/L silently is how the wrong number gets documented.",
    "The spoken-unit table covers the common laboratory units. An unlisted unit is spoken as written, which is correct but reads poorly.",
  ],

  related: [
    "clinical-status",
    "care-timeline",
    "allergy-chip",
    "risk-indicator",
    "provenance-chip",
    "trend-indicator",
  ],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "result-value-core", "clinical-status"],

  usage: `import { ResultValue, fromObservation } from "@/components/oxygen/result-value";
import "@/styles/oxygen-result-value.css";

<ResultValue value={fromObservation(observation)} now={serverTime} />`,

  guidance: {
    use: [
      "Anywhere a single observation is rendered — lab results, vitals, screening scores, device readings, point-of-care tests, patient-reported measures.",
      'In a results grid with density="compact" and hideAnalyte, so the column header carries the name and the rows carry tabular figures that line up.',
      "With the prior value supplied, so a delta appears where it is meaningful and is suppressed where it is not.",
      "In a patient portal, where the absence reasons matter most: a portal that renders an em dash has told the patient nothing and worried them anyway.",
    ],
    avoid: [
      "For a panel of several observations. Compose one per row rather than passing a component array — the reference range and the interpretation belong to a single analyte.",
      "Without `now` if a relative age matters. Omitting it renders no age at all, which is correct; passing a client clock is not.",
      "As a general-purpose statistic display. The four failures it is shaped around are clinical, and the shapes cost layout that a dashboard metric does not need.",
    ],
  },

  uxGuidelines: {
    do: [
      "Pass `versionId` from the record. It is what makes a correction re-render and a filter keystroke not.",
      "Supply `noRangeReason` when the laboratory supplied no range, rather than leaving the range undefined and hoping.",
      "Give the prior value its `differentMethod` flag when the assay changed. The delta disappears, which is the correct answer.",
    ],
    dont: [
      "Do not derive an interpretation upstream and pass it as if the lab stated it. The component distinguishes the two, and a derived critical is a claim nobody made.",
      "Do not replace the absence sentence with a shorter one to fit a column. Narrow the column.",
      "Do not colour the value itself by interpretation. The chip carries the interpretation; a red number is colour-alone and disappears in greyscale.",
    ],
  },

  tags: ["data-display", "themeable", "print-safe", "headless"],
  aliases: ["lab result", "observation value", "vital sign display", "lab value", "test result"],

  domain: {
    industries: ["healthcare", "behavioral-health"],
    clinicalContext:
      "Every number a clinician reads, and every number a patient reads in a portal. Screening scores are observations too: a PHQ-9 of 14 with status amended because the patient revised item 9 after the session is exactly this component's problem, at a much higher consequence than a sodium.",
    workflows: ["assessment", "documentation", "treatment-planning", "medication"],
    phi: {
      handles: true,
      notes:
        "Renders a clinical value and its context. The masked absence exists precisely so a restricted result can be acknowledged on a screen without disclosing it — the reader learns a value exists and that they may not see it, which is a different fact from there being no value.",
    },
    auditable: false,
    permissions: ["observation.read"],
    terminology: ["LOINC", "SNOMED CT", "FHIR"],
  },

  variants: [
    {
      id: "default",
      label: "Default",
      description:
        "Value, unit, interpretation and the qualifier line. For a chart or a detail panel.",
      args: { density: "default" },
    },
    {
      id: "compact",
      label: "Compact",
      description: "Tighter type and spacing, for a grid at forty rows and up.",
      args: { density: "compact" },
    },
    {
      id: "grid",
      label: "In a grid",
      description: "The analyte hidden, because the column header already carries it.",
      args: { density: "compact", hideAnalyte: true },
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
    { prop: "hideAnalyte", control: "switch", label: "Hide analyte", defaultValue: false },
    {
      prop: "value",
      control: "fixture",
      label: "Observation",
      options: [
        "observationPotassiumCritical",
        "observationPreliminary",
        "observationCorrected",
        "observationMasked",
        "observationDeclined",
      ],
    },
    { prop: "now", control: "text", label: "Now (ISO 8601)" },
    { prop: "onOpenReport", control: "event", label: "onOpenReport" },
  ],

  a11yChecks: [
    {
      wcag: "1.3.1",
      name: "Info and relationships",
      status: "pass",
      how: "One labelled group carrying the whole clinical sentence, with every inner node aria-hidden. The relationship between value, unit, range and status is in the sentence rather than in visual adjacency.",
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "1.4.1",
      name: "Use of colour",
      status: "pass",
      how: "Interpretation is a ClinicalStatus chip with a shape and a word; delta direction is a glyph and a signed number. No fact is carried by hue alone, and a test asserts the value itself is never coloured by interpretation.",
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "4.1.2",
      name: "Name, role, value",
      status: "pass",
      how: 'role="group" with a composed label when static; a real button when onOpenReport is supplied. Never a focusable div.',
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "2.1.1",
      name: "Keyboard",
      status: "pass",
      how: "The report affordance is a native button, reached and activated by keyboard with no handler of the component's own.",
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "2.5.8",
      name: "Target size",
      status: "pass",
      how: "The interactive form holds a 24px minimum at both densities, with negative inline margin so the larger hit area does not shift the column.",
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "1.4.10",
      name: "Reflow",
      status: "pass",
      how: 'The qualifier line wraps below the value at narrow widths and the interpretation word never truncates — a truncated "criti…" is worse than no chip.',
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "1.4.12",
      name: "Text spacing",
      status: "pass",
      how: "No fixed heights anywhere; both lines are flex rows that grow with user line-height and letter-spacing rather than clipping.",
      evidence: "result-value.test.tsx",
    },
    {
      wcag: "2.2.1",
      name: "Timing adjustable",
      status: "not-applicable",
      how: "No timing of any kind. The relative age is computed from a `now` the host supplies, never from a clock the component reads.",
    },
  ],

  fixtures: [
    "observationPotassiumCritical",
    "observationPreliminary",
    "observationCorrected",
    "observationMasked",
    "observationDeclined",
    "observationUninterpreted",
    "observationNotAsked",
  ],

  examples: [
    {
      id: "from-fhir",
      title: "A FHIR Observation, unedited",
      description:
        "The adapter leaves undefined everything it cannot determine. A missing referenceRange becomes no range — not an empty one, and not a silent assumption of normality.",
      fixture: "observationPotassiumCritical",
      code: `import { ResultValue, fromObservation } from "@/components/oxygen/result-value";
import { observationPotassiumCritical } from "@oxygenui-design/fixtures";

// \`now\` is the host's, never a clock this component reads: a relative time
// computed at render silently ages on a ward workstation left open all shift.
<ResultValue value={fromObservation(observationPotassiumCritical)} now={serverTime} />;`,
    },
    {
      id: "absence",
      title: "Seven absences, seven sentences",
      description:
        "An em dash is indistinguishable from a rendering bug, and it asks the reader to guess between three answers with three different next actions. Restricted is the one that is not a gap: a value exists and the reader may not see it.",
      fixture: "observationMasked",
      code: `<ResultValue value={{ id: "hba1c", analyte: "HbA1c", absent: "not-ordered" }} />
<ResultValue value={{ id: "tsh", analyte: "TSH", absent: "specimen-problem",
                      absentDetail: "Haemolysed. Recollection requested." }} />
<ResultValue value={{ id: "bh", analyte: "Toxicology", absent: "masked" }} />`,
    },
    {
      id: "correction",
      title: "A correction shows the number it replaced",
      description:
        'A badge saying "corrected" does not address the hazard, which is that somebody read the old value an hour ago and wrote it into a note. The old number, struck through, with the time it changed, does.',
      fixture: "observationCorrected",
      code: `<ResultValue
  value={{
    id: "trop", versionId: "2",
    analyte: "Troponin I", value: 0.09, unit: "ng/mL",
    range: { high: 0.04 },
    status: "corrected",
    superseded: { value: "<0.04", at: "14:22 today" },
  }}
/>;`,
    },
    {
      id: "delta-suppressed",
      title: "A delta the component refuses to draw",
      description:
        "Two numbers from two assays subtracted from each other is not a delta. Flagging the method change and annotating the number anyway would not help — an annotated wrong number still gets read as a number — so the delta disappears entirely.",
      fixture: "observationPreliminary",
      code: `<ResultValue
  value={{
    id: "tsh", analyte: "TSH", value: 6.4, unit: "mIU/L",
    range: { low: 0.4, high: 4.0 },
    // Same analyte, different assay. No delta is drawn.
    prior: { value: 3.1, at: "2026-02-01T09:00:00Z", differentMethod: true },
  }}
/>;`,
    },
  ],

  relationships: {
    builtWith: [],
    usedIn: [],
    patterns: ["results-review", "clinical-documentation"],
    alternatives: [
      {
        ref: "clinical-status",
        when: "the thing being rendered is a state rather than a measurement",
      },
      {
        ref: "care-timeline",
        when: "the question is what happened and when, rather than what one value is",
      },
    ],
  },

  seo: {
    slug: "result-value",
    title: "Result Value — React lab result component",
    description:
      "A React component for a single clinical observation: seven absence reasons, reference ranges, corrected values shown in full, and a FHIR Observation adapter.",
    primaryKeyword: "react lab result component",
    secondaryKeywords: [
      "fhir observation react",
      "clinical value display react",
      "reference range component",
      "lab results table react",
    ],
    ogImage: "generated",
    searchIntent: "informational",
  },
});

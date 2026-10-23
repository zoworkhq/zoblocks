import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "care-timeline",
  title: "Care Timeline",
  tier: "free",
  status: "experimental",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A patient's chronology that cannot be rendered without saying what it is a view of — the window, the sources, the filters and the order.",

  tagline: "A chronology that states its window, sources, filters and order.",
  description:
    "A timeline over clinical, administrative, communication and patient-reported events, with coverage as a required prop. Separates planned from happened, keeps an entry recorded in error visible and marked, and refuses to collapse anything a reader would act on.",
  rationale:
    "A table is read as rows and a chart as a shape, but a timeline is read as an account — and an account is understood to be continuous, so a gap in it becomes a fact. Meanwhile the timeline on screen is nearly always a slice: paginated to five, filtered to one register, assembled from sources that fail independently. Every one of those renders as the same tidy, confident, continuous list. A clinician reads a timeline with no imaging on it and orders a CT; the study was done eleven weeks ago at another hospital and the exchange query timed out four seconds earlier. Nothing was wrong on screen. So coverage is required in the type, with no default, because every plausible default is a claim the caller did not make — and the sentence it produces is rendered in a fixed place and printed. Two consequences follow: planned is not happened, so a future event sits above a now marker and a planned event whose time has passed with nothing against it is lapsed rather than silent; and clinical events are not administrative ones, so registers are typed rather than mixed at one weight.",

  categories: ["Clinical", "Data Display"],
  fhir: [
    { name: "Encounter", url: "https://hl7.org/fhir/R4/encounter.html" },
    { name: "Appointment", url: "https://hl7.org/fhir/R4/appointment.html" },
    { name: "Communication", url: "https://hl7.org/fhir/R4/communication.html" },
    { name: "Observation", url: "https://hl7.org/fhir/R4/observation.html" },
    { name: "DiagnosticReport", url: "https://hl7.org/fhir/R4/diagnosticreport.html" },
    { name: "Procedure", url: "https://hl7.org/fhir/R4/procedure.html" },
    { name: "MedicationRequest", url: "https://hl7.org/fhir/R4/medicationrequest.html" },
    { name: "Immunization", url: "https://hl7.org/fhir/R4/immunization.html" },
    { name: "DocumentReference", url: "https://hl7.org/fhir/R4/documentreference.html" },
    { name: "QuestionnaireResponse", url: "https://hl7.org/fhir/R4/questionnaireresponse.html" },
    { name: "Consent", url: "https://hl7.org/fhir/R4/consent.html" },
    { name: "Provenance", url: "https://hl7.org/fhir/R4/provenance.html" },
  ],

  states: [
    "Newest first, grouped by month",
    "Planned, above the now marker",
    "Lapsed — planned, and nothing recorded against it",
    "Cancelled",
    "Attempted and did not connect",
    "Amended, with what changed",
    "Entered in error, retained and struck",
    "Restricted — it exists and you may not read it",
    "Consent-gated",
    "A thread with its own steps",
    "A cluster, and a critical event promoted out of one",
    "A stated gap in coverage",
    "A source that could not be reached",
    "Filtered, with the hidden count stated",
    "New since last reviewed",
    "An imprecise date, kept imprecise",
    "No record · none in this window · none you may see",
    "Patient-facing, with a result not yet reviewed",
  ],

  a11y: [
    {
      label: "Each group is its own named list",
      detail:
        'One <ol role="list"> per group, each with an accessible name built from the timeline\'s own label and the group heading, so a rotor can move between periods. The since-you-last-looked divider splits a group into two named lists rather than floating a rule inside one.',
    },
    {
      label: "The relative time is never the only time",
      detail:
        "Every event renders an absolute time inside <time datetime> at the record's precision. The relative form beside it is aria-hidden: spoken aloud it doubles the length of every item and adds nothing the date has not said.",
    },
    {
      label: "Every state carries words, not only a shape",
      detail:
        "Planned is a dashed node and a Planned chip; a coverage gap is a dashed rail and a sentence; entered-in-error is a strike, a chip and a paragraph. Forced-colors mode, a monochrome print and a red-green deficiency each keep the meaning.",
    },
    {
      label: "A failed source interrupts",
      detail:
        'An unavailable source renders a role="alert" banner above the list rather than a grey footnote, because the reader is about to convert an absence into a clinical fact.',
    },
  ],

  guidance: {
    use: [
      "The chart's own timeline view, where a clinician is asking what has been happening to this person.",
      "Any surface where not finding an event is itself an answer — 'has she had this before' is the read this component exists for.",
      'A dashboard card, with layout="card" and limit, where the compressed coverage sentence still fits.',
      'A patient portal, with audience="patient", where a result may arrive before anyone has called.',
    ],
    avoid: [
      "As the only view of a record. It is a chronology, not an index — a reader who needs the current medication list should not have to scroll a year of events to build one.",
      "For one resource's own version history. That is a version list and it wants a different component.",
      "Anywhere the coverage genuinely cannot be described. If you do not know what you searched, the honest render is an error state, not a timeline.",
    ],
  },

  limitations: [
    "coverage reports what this query reached, not what exists. A source that answers with an incomplete record is reported as reached, and that limit is the reason the component is not a completeness guarantee.",
    "Coverage gaps are declared by the caller, never inferred. A component that turned eleven quiet weeks into 'records may be missing' would be inventing a claim; the application is what knows a source timed out.",
    "No swimlane layout. One lane per source is the right answer for a medico-legal chronology and it needs horizontal scroll, its own keyboard model and a legend.",
    "Duration events render at their start. A period is not a point, and bands are not in this version.",
    'role="feed" is not used. It is the APG\'s own pattern for an infinitely scrolling list and its example carries a note that it has not reached task-force consensus; load-older is a real button instead.',
    "Dates are formatted by Intl at the record's precision, and a stamp with an offset renders in the record's zone rather than the reader's. Pass localeTag to control the language; there is no per-field format override yet.",
    "The commonest way to defeat the coverage claim is upstream: catching a source's failure in the data layer and returning a shorter array. See content/guides/populating-coverage.md — the component cannot detect what never reached it.",
  ],
  related: [
    "timeline",
    "chart-accordion",
    "clinical-note",
    "accordion",
    "result-value",
    "date-picker",
    "chart-context-menu",
  ],

  controls: [
    {
      prop: "layout",
      control: "select",
      label: "Layout",
      options: ["default", "card", "compact", "register"],
      defaultValue: "default",
    },
    {
      prop: "group",
      control: "select",
      label: "Group by",
      options: ["auto", "month", "quarter", "year", "none"],
      defaultValue: "auto",
    },
    {
      prop: "audience",
      control: "segmented",
      label: "Audience",
      options: ["clinician", "patient"],
      defaultValue: "clinician",
    },
    { prop: "filters", control: "switch", label: "Register filter", defaultValue: false },
    { prop: "jump", control: "switch", label: "Jump control", defaultValue: false },
    { prop: "onSelect", control: "event", label: "onSelect" },
    { prop: "onLoadOlder", control: "event", label: "onLoadOlder" },
    { prop: "onRegistersChange", control: "event", label: "onRegistersChange" },
  ],

  examples: [
    /* ---------------------------------------------------------------- */
    /* What it is a view of                                              */
    /* ---------------------------------------------------------------- */
    {
      id: "chart",
      group: "What it is a view of",
      title: "Newest first, and the footer says of what",
      description:
        "Fourteen months, two source systems, one of them down, grouped by month. Read the footer first: the window, the order, the counts and which sources answered. It is a required prop, and it prints.",
      code: `<CareTimeline
  aria-label="Care timeline for Ada Lovelace"
  events={events}
  now={serverTime}
  coverage={{
    window: { from: "2025-07-01" },
    order: "newest-first",
    total: 43,
    hidden: [{ reason: "access", count: 2 }],
    sources: [
      { id: "ehr", label: "Northside EHR", status: "ok" },
      { id: "hie", label: "Northside Regional Exchange", status: "unavailable" },
    ],
  }}
  onLoadOlder={() => fetchOlder()}
/>`,
    },
    {
      id: "source-down",
      group: "What it is a view of",
      title: "A source that could not be reached",
      description:
        'The repeat-CT case, caught. An unavailable source is a role="alert" banner above the list, not a grey footnote under it, because the reader is about to turn an absence into a clinical fact.',
      code: `<CareTimeline
  {...props}
  coverage={{
    ...coverage,
    sources: [
      { id: "ehr", label: "Northside EHR", status: "ok" },
      {
        id: "hie",
        label: "Northside Regional Exchange",
        status: "unavailable",
        detail: "Timed out after 8s.",
      },
    ],
  }}
/>`,
    },
    {
      id: "gap",
      group: "What it is a view of",
      title: "A stated gap in coverage",
      description:
        "Every source answered and the caller still knows of a hole, so it says so: the rail goes dashed across the missing weeks and a sentence names why. Gaps are declared, never inferred — eleven quiet weeks are not evidence of anything.",
      code: `<CareTimeline
  {...props}
  coverage={{
    ...coverage,
    gaps: [
      { from: "2026-04-03", to: "2026-06-21", reason: "the clinic changed record systems" },
    ],
  }}
/>`,
    },
    {
      id: "filtered",
      group: "What it is a view of",
      title: "Filtered, with the hidden count stated",
      description:
        "One register on, and the count it hides is said beside the list rather than inside a popover that is usually off screen. Toggle a register and the line below shows what the host was told.",
      code: `<CareTimeline
  {...props}
  filters
  defaultRegisters={["clinical"]}
  onRegistersChange={(registers) => save(registers)}
/>`,
    },
    {
      id: "empty",
      group: "What it is a view of",
      title: "No record · none in this window · none you may see",
      description:
        "Three different facts with three different next actions. Rendering them as one empty card is the ambiguity that produces a repeat scan.",
      code: `// Nothing anywhere
<CareTimeline {...props} events={[]} coverage={{ order: "newest-first", sources }} />

// Nothing in the window that was searched
<CareTimeline
  {...props}
  events={[]}
  coverage={{ order: "newest-first", window: { from: "2025-01-01", to: "2025-12-31" }, sources }}
/>

// Records exist, and none are yours to read
<CareTimeline
  {...props}
  events={[]}
  coverage={{ order: "newest-first", hidden: [{ reason: "access", count: 3 }], sources }}
/>`,
    },
    {
      id: "card",
      group: "What it is a view of",
      title: "The dashboard card",
      description:
        "Five entries beside other cards — the shape most patient timelines ship as. The difference is one line: five of 43, newest first, one of two sources reached. Without it, five of forty-three reads as a complete account.",
      code: `<CareTimeline {...props} layout="card" limit={5} />`,
    },

    /* ---------------------------------------------------------------- */
    /* Planned and happened                                              */
    /* ---------------------------------------------------------------- */
    {
      id: "planned",
      group: "Planned and happened",
      title: "Planned, above the now marker",
      description:
        "A future event sits above a now marker, and now is the caller's server time rather than the browser clock — a clinic laptop with the wrong date should not move an appointment into the past.",
      code: `<CareTimeline
  {...props}
  now={serverTime}
  events={[
    {
      id: "appt-endo",
      kind: "appointment",
      occurred: "2026-09-02T09:30:00+05:30",
      status: "planned",
      title: "Endocrinology review",
    },
    ...events,
  ]}
/>`,
    },
    {
      id: "lapsed",
      group: "Planned and happened",
      title: "Lapsed — planned, and nothing recorded against it",
      description:
        "A planned screening whose date has passed with no encounter against it. It says exactly that — not missed, not a no-show, which are conclusions the record cannot support.",
      code: `{
  id: "appt-retinal",
  kind: "appointment",
  occurred: "2026-08-05T11:00:00+05:30",
  status: "planned", // and now is after it
  title: "Diabetic retinal screening",
}`,
    },
    {
      id: "cancelled",
      group: "Planned and happened",
      title: "Cancelled is not did-not-connect",
      description:
        "Somebody decided, and somebody tried and failed: two different facts that must not share a chip. Actor and recipient are separate fields, so the reminder cannot end up addressed to the caller.",
      code: `[
  {
    id: "call-followup",
    kind: "call",
    status: "not-done",
    title: "Follow-up call",
    actor: { name: "Priya Menon", role: "Front desk" },
    recipient: { name: "The patient" },
  },
  {
    id: "appt-cancelled",
    kind: "appointment",
    status: "cancelled",
    title: "Podiatry review",
    detail: "Cancelled by the clinic.",
  },
]`,
    },

    /* ---------------------------------------------------------------- */
    /* Corrections and access                                            */
    /* ---------------------------------------------------------------- */
    {
      id: "amended",
      group: "Corrections and access",
      title: "Amended, with what changed",
      description:
        "An amendment chip with no delta tells the reader something changed and withholds the one thing they need. The revision carries what it was, when and why.",
      code: `{
  id: "lab-hba1c",
  kind: "laboratory",
  status: "amended",
  title: "HbA1c — 8.9%",
  revision: { at: "2026-08-15T16:20:00+05:30", was: "9.4%", reason: "result value corrected" },
}`,
    },
    {
      id: "in-error",
      group: "Corrections and access",
      title: "Entered in error, retained and struck",
      description:
        "Kept and marked rather than filtered out of the query — the one behaviour the record's own rules forbid. A strike, a chip and a sentence, so it survives a monochrome print.",
      code: `{
  id: "enc-ed",
  kind: "encounter",
  status: "in-error",
  title: "Emergency department attendance",
  revision: {
    at: "2026-07-31",
    by: { name: "Dr A Rahman" },
    reason: "recorded against this patient in error",
  },
}`,
    },
    {
      id: "restricted",
      group: "Corrections and access",
      title: "Restricted — it exists and you may not read it",
      description:
        "It says something is here without saying what. Dropping it would misrepresent the record to a reader with no way to know.",
      code: `{
  id: "doc-outside",
  kind: "document",
  occurred: "2026-06-22",
  title: "Discharge summary", // never rendered
  access: { kind: "withheld", reason: "Kept separately by its author." },
}`,
    },
    {
      id: "consent",
      group: "Corrections and access",
      title: "Consent-gated",
      description:
        "A Part 2 note the reader may open, once they record why. The date and the fact of a record are shown; the title waits behind the reason.",
      code: `{
  id: "note-psych",
  kind: "note",
  occurred: "2026-07-14",
  title: "Psychotherapy progress note",
  access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
}`,
    },

    /* ---------------------------------------------------------------- */
    /* Reading                                                           */
    /* ---------------------------------------------------------------- */
    {
      id: "thread",
      group: "Reading",
      title: "A thread with its own steps",
      description:
        "Sent, returned and reviewed happened on different days. Flattening them into one line loses the only question anyone asks of an intake form: has anybody read it?",
      code: `{
  id: "q-history",
  kind: "questionnaire",
  title: "Pre-visit medical history",
  steps: [
    { label: "Sent to the patient", at: "2026-08-11T09:00:00+05:30", state: "done" },
    { label: "Returned by the patient", at: "2026-08-11T21:34:00+05:30", state: "done" },
    { label: "Not yet reviewed", state: "open" },
  ],
}`,
    },
    {
      id: "cluster",
      group: "Reading",
      title: "A cluster, and a critical event kept out of one",
      description:
        "Four routine observations in three days fold into one disclosure. The critical potassium beside them stays on the rail — nothing a reader would act on is ever collapsed.",
      code: `<CareTimeline {...props} cluster={{ kinds: ["observation"], within: "P3D", min: 3 }} />`,
    },
    {
      id: "new-since",
      group: "Reading",
      title: "New since last reviewed",
      description:
        "A divider at the reader's last review splits the group into two named lists, so a rotor lands on it. A note recorded six days after the visit is marked late rather than slipping in below the line.",
      code: `<CareTimeline {...props} seenThrough={lastReviewedAt} lateEntryAfter="P2D" />`,
    },
    {
      id: "imprecise",
      group: "Reading",
      title: "An imprecise date, kept imprecise",
      description:
        "A FHIR 2019 means 2019. Widening it to 1 January invents a precision nobody recorded. A stamp with an offset renders in the record's zone, not the reader's.",
      code: `<CareTimeline
  {...props}
  group="none"
  events={[
    { id: "cond-gdm", kind: "condition", occurred: "2019", title: "Gestational diabetes" },
    ...events,
  ]}
/>`,
    },
    {
      id: "register",
      group: "Reading",
      title: "Clinical on one side, everything else on the other",
      description:
        "Sides alternate on a fact — which register an event is in — rather than to fill space. Under 768px it collapses to one column and the register survives as the kind label. Jump moves between periods and never changes what is shown.",
      code: `<CareTimeline {...props} layout="register" group="month" jump />`,
    },
    {
      id: "patient",
      group: "Reading",
      title: "Patient-facing, with a result not yet reviewed",
      description:
        "A different catalogue, not a softer tone: Visit and Test result rather than Encounter and Laboratory. A result can reach the patient before anyone has looked at it, so the portal has to be able to say so.",
      code: `<CareTimeline {...props} audience="patient" aria-label="Your care timeline" />`,
    },
  ],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "timeline-core", "timeline-fhir", "timeline"],

  usage: `import { CareTimeline } from "@/components/zoblocks/care-timeline";

<CareTimeline
  aria-label="Care timeline for Ada Lovelace"
  events={events}
  now={serverTime}
  coverage={{
    window: { from: "2025-07-01" },
    order: "newest-first",
    total: 43,
    hidden: [{ reason: "access", count: 2 }],
    sources: [
      { id: "ehr", label: "Northside EHR", status: "ok" },
      {
        id: "hie",
        label: "Northside Regional Exchange",
        status: "unavailable",
        detail: "Timed out after 8s.",
      },
    ],
  }}
  group="auto"
  cluster={{ kinds: ["observation"], within: "P3D", min: 3 }}
  seenThrough="2026-08-12T14:02:00+05:30"
  lateEntryAfter="P2D"
  onLoadOlder={() => fetchOlder()}
/>`,
});

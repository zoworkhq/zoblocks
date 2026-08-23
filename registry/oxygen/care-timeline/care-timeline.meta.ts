import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "care-timeline",
  title: "Care Timeline",
  tier: "free",
  status: "experimental",
  since: "0.4.0",
  layer: "clinical",

  summary:
    "A patient's chronology that cannot be rendered without saying what it is a view of — the window, the sources, the filters and the order.",
  description:
    "A timeline over clinical, administrative, communication and patient-reported events, with coverage as a required prop. Separates planned from happened, keeps an entry recorded in error visible and marked, and refuses to collapse anything a reader would act on.",
  rationale:
    "A table is read as rows and a chart as a shape, but a timeline is read as an account — and an account is understood to be continuous, so a gap in it becomes a fact. Meanwhile the timeline on screen is nearly always a slice: paginated to five, filtered to one register, assembled from sources that fail independently. Every one of those renders as the same tidy, confident, continuous list. A clinician reads a timeline with no imaging on it and orders a CT; the study was done eleven weeks ago at another hospital and the exchange query timed out four seconds earlier. Nothing was wrong on screen. So coverage is required in the type, with no default, because every plausible default is a claim the caller did not make — and the sentence it produces is rendered in a fixed place and printed. Two consequences follow: planned is not happened, so a future event sits above a now marker and a planned event whose time has passed with nothing against it is lapsed rather than silent; and clinical events are not administrative ones, so registers are typed rather than mixed at one weight.",

  categories: ["Clinical", "Data display"],
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
  related: ["timeline", "chart-accordion", "clinical-note", "accordion", "result-value"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "timeline-core", "timeline-fhir", "timeline"],

  usage: `import { CareTimeline } from "@/components/oxygen/care-timeline";

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

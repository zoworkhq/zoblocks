/**
 * Component catalog metadata.
 *
 * Everything the catalog index and the component detail pages render, other
 * than source code — that is read from the generated registry JSON at build
 * time so the documented source can never drift from the shipped source.
 */

export type ComponentStatus = "shipping" | "review" | "design";

export interface PropDoc {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface ComponentDoc {
  /** Registry name and URL slug. */
  name: string;
  title: string;
  /** FHIR resource this component consumes. */
  resource: string;
  resourceUrl: string;
  status: ComponentStatus;
  /** One line, used on cards and in metadata. */
  summary: string;
  /** Two or three sentences, used on the detail page. */
  description: string;
  categories: string[];
  dependencies: string[];
  /** The states this component renders explicitly. */
  states: string[];
  props: PropDoc[];
  usage: string;
  guidance: { use: string[]; avoid: string[] };
  accessibility: Array<{ label: string; detail: string }>;
  /** Known gaps. Stated plainly — an undocumented limitation is a bug report. */
  limitations: string[];
  related: string[];
}

export const STATUS_LABEL: Record<ComponentStatus, string> = {
  shipping: "Shipping",
  review: "In review",
  design: "Design",
};

export const CATALOG: ComponentDoc[] = [
  {
    name: "patient-banner",
    title: "Patient Banner",
    resource: "Patient",
    resourceUrl: "https://hl7.org/fhir/R4/patient.html",
    status: "shipping",
    summary: "Persistent identity header for a clinical screen, driven by a FHIR Patient resource.",
    description:
      "Renders who the chart belongs to and keeps it reachable at any point on the screen. Wrong-patient error is one of the highest-consequence failures in clinical software, so this component never invents a name, never renders absence as blankness, and announces deceased and restricted status to assistive technology rather than conveying it through styling alone.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Complete demographics",
      "Name not recorded",
      "Restricted record",
      "Deceased",
      "Masked identifiers",
      "Loading",
    ],
    props: [
      { name: "patient", type: "Patient | undefined", description: "FHIR R4 Patient resource." },
      {
        name: "identifierSystem",
        type: "string",
        description:
          "Identifier system to display, for example your MRN system. Defaults to the official identifier.",
      },
      {
        name: "identifierLabel",
        type: "string",
        default: '"MRN"',
        description: "Label shown before the identifier.",
      },
      {
        name: "maskIdentifiers",
        type: "boolean",
        default: "false",
        description:
          "Mask all but the last four characters. Use on shared or public-facing screens.",
      },
      {
        name: "restricted",
        type: "boolean",
        description:
          "Force the restricted presentation. When omitted, derived from meta.security confidentiality labels.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "asOf",
        type: "Date",
        default: "new Date()",
        description: "Date used to compute age. Pass a fixed date to keep tests deterministic.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "Trailing slot for actions — encounter switcher, chart menu, alerts.",
      },
      {
        name: "headingLevel",
        type: "1 | 2 | 3 | 4 | 5 | 6",
        default: "2",
        description:
          "Heading level for the patient name. Set it when the banner is nested — several banners at h2 each inject a sibling into the document outline, and screen-reader users navigate by that outline.",
      },
    ],
    usage: `import { PatientBanner } from "@/components/oxygen/patient-banner";

export function ChartHeader({ patient }: { patient: Patient }) {
  return (
    <PatientBanner
      patient={patient}
      identifierSystem="http://your-org.example/fhir/sid/mrn"
      maskIdentifiers={isSharedWorkstation}
    />
  );
}`,
    guidance: {
      use: [
        "At the top of any screen showing a single patient's data.",
        "Anywhere a user could plausibly act on the wrong record.",
        "With maskIdentifiers on shared workstations, waiting-room displays, and screen shares.",
      ],
      avoid: [
        "As a list row — it is a page-level landmark, not a repeating item.",
        "As your only access control. The restricted flag changes what is displayed; it does not stop data reaching the browser.",
        "For patient selection. Use a search or worklist component instead.",
      ],
    },
    accessibility: [
      {
        label: "Landmark",
        detail:
          "Renders as a labelled region so the patient context is reachable from anywhere on the page.",
      },
      {
        label: "Status flags",
        detail:
          "Deceased and restricted are text and icon, not color. Both are inside the region's accessible name.",
      },
      {
        label: "Masked identifiers",
        detail:
          "Screen readers receive the last four characters and an explicit statement that the value is masked.",
      },
      {
        label: "Loading",
        detail: "Skeleton carries aria-busy and an accessible label so the wait is announced.",
      },
      {
        label: "Heading level",
        detail:
          "The patient name renders at a configurable heading level so a nested banner does not corrupt the page outline.",
      },
    ],
    limitations: [
      "Does not render address, telecom, or managing organization — compose those alongside it.",
      "Age is computed in whole years only. Neonatal and paediatric age display (days, weeks, months) is not yet handled.",
      "No built-in patient-photo slot.",
    ],
    related: ["vitals-panel"],
  },
  {
    name: "vitals-panel",
    title: "Observation Panel",
    resource: "Observation[]",
    resourceUrl: "https://hl7.org/fhir/R4/observation.html",
    status: "shipping",
    summary:
      "Results table with reference ranges and interpretation. Uninterpreted results stay uninterpreted.",
    description:
      "Renders a set of Observation resources as a results list: value, units, reference range, and interpretation. The interpretation logic is the entire point. An interpretation stated in the payload always wins; absent one, it is derived only by comparing the value to its own reference range; with neither, the result reads “Not interpreted” rather than “Normal”. Silently defaulting an uninterpreted result to normal is how a UI manufactures false reassurance.",
    categories: ["Clinical data", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
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
    props: [
      {
        name: "observations",
        type: "Observation[] | undefined",
        description: "FHIR R4 Observation resources, in the order they should be read.",
      },
      {
        name: "label",
        type: "string",
        default: '"Observations"',
        description: "Accessible name for the results table.",
      },
      {
        name: "hideReferenceRange",
        type: "boolean",
        default: "false",
        description: "Hide the reference-range column. Useful in narrow or patient-facing layouts.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "loadingRows",
        type: "number",
        default: "4",
        description: "Number of skeleton rows while loading.",
      },
      {
        name: "emptyMessage",
        type: "string",
        default: '"No results in this period."',
        description: "Shown when observations is an empty array.",
      },
      {
        name: "onSelect",
        type: "(observation: Observation) => void",
        description: "Called when a row is activated. Omit to render non-interactive rows.",
      },
    ],
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
    accessibility: [
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
    limitations: [
      "Renders referenceRange[0] only. Age- and sex-specific ranges are not yet selected by context.",
      "Component reference ranges are read from referenceRange[0], same as the parent.",
      "No built-in unit conversion. Values render in the units supplied.",
    ],
    related: ["patient-banner"],
  },
  {
    name: "medication-card",
    title: "Medication Card",
    resource: "MedicationRequest",
    resourceUrl: "https://hl7.org/fhir/R4/medicationrequest.html",
    status: "shipping",
    summary:
      "Dose, route, schedule, and status. Held, stopped, and expired are distinct — not one greyed-out style.",
    description:
      "Renders a medication order with its dosage instruction and status. The design problem is status: most implementations collapse on-hold, stopped, completed, and expired into a single muted treatment, which loses the difference between a drug a clinician deliberately paused and one that simply ran out of refills. Those lead to opposite next actions, so each gets its own label and tone. Expired is derived rather than stored — FHIR has no expired status, so an order still marked active past its dispense validity period is surfaced as expired instead of presented as current.",
    categories: ["Medication", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Active",
      "On hold",
      "Stopped",
      "Cancelled",
      "Completed",
      "Expired",
      "Draft",
      "Entered in error",
      "No dosage recorded",
    ],
    props: [
      {
        name: "request",
        type: "MedicationRequest | undefined",
        description: "FHIR R4 MedicationRequest.",
      },
      {
        name: "asOf",
        type: "Date",
        default: "new Date()",
        description: "Date used to evaluate expiry. Pass a fixed date to keep tests deterministic.",
      },
      {
        name: "showProvenance",
        type: "boolean",
        default: "true",
        description: "Show the prescriber and authored date.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "onSelect",
        type: "(request: MedicationRequest) => void",
        description: "Called when the card is activated. Omit to render non-interactive.",
      },
    ],
    usage: `import { MedicationCard, MedicationList } from "@/components/oxygen/medication-card";

<MedicationList requests={activeMedications} />

// or a single order
<MedicationCard
  request={request}
  onSelect={(r) => openOrder(r.id)}
/>`,
    guidance: {
      use: [
        "On a medication list, discharge summary, or reconciliation screen.",
        "With showProvenance on, wherever a clinician may need to contact the prescriber.",
        "Sorted with active medications first — the component preserves your order.",
      ],
      avoid: [
        "As a prescribing control. This renders an existing order; it does not create or modify one.",
        "For dispense or administration records. Those are MedicationDispense and MedicationAdministration.",
        "Hiding discontinued drugs entirely. Recently stopped medications matter clinically.",
      ],
    },
    accessibility: [
      {
        label: "No strike-through",
        detail:
          "Discontinued medications are never struck through — struck text is unreadable at small sizes and is not exposed as meaning by screen readers. The status badge carries the state.",
      },
      {
        label: "Status labels",
        detail:
          "Every status has a text label, not just a tone. On hold, stopped, and expired are distinguishable in grayscale.",
      },
      {
        label: "Activation",
        detail: "When onSelect is provided the card is focusable and responds to Enter and Space.",
      },
    ],
    limitations: [
      "Renders dosageInstruction[0] only. Tapered and split regimens with multiple instructions show the first.",
      "No interaction or contraindication checking. That is a clinical decision support concern, not a UI one.",
      "medicationReference renders the reference display text; it does not resolve the Medication resource.",
    ],
    related: ["allergy-list", "condition-list"],
  },
  {
    name: "allergy-list",
    title: "Allergy List",
    resource: "AllergyIntolerance",
    resourceUrl: "https://hl7.org/fhir/R4/allergyintolerance.html",
    status: "shipping",
    summary: "Criticality and verification status, with no-known-allergies as its own state.",
    description:
      "Renders known allergies and intolerances with criticality, reaction manifestations, and verification status. The decision that matters most is what an empty list means: “no allergies recorded” and “no known allergies” are different clinical facts. The first means nobody has asked; the second means someone asked and documented the answer. Rendering them identically tells a clinician the patient is safe when the truth is the question was never put — so noKnownAllergies must be passed explicitly and is never inferred.",
    categories: ["Clinical data", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "High risk",
      "Severe / moderate / mild reaction",
      "Risk not assessed",
      "Unconfirmed",
      "Refuted",
      "Inactive",
      "No known allergies",
      "Not recorded",
    ],
    props: [
      {
        name: "allergies",
        type: "AllergyIntolerance[] | undefined",
        description: "FHIR R4 AllergyIntolerance resources.",
      },
      {
        name: "noKnownAllergies",
        type: "boolean",
        description:
          "Pass true only when a no-known-allergies assertion is actually recorded. Leaving it undefined with an empty list renders “not recorded”, which is the safe reading.",
      },
      {
        name: "hideInactive",
        type: "boolean",
        default: "false",
        description: "Hide entries whose clinical status is inactive or resolved.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "label",
        type: "string",
        default: '"Allergies and intolerances"',
        description: "Accessible name for the region.",
      },
    ],
    usage: `import { AllergyList } from "@/components/oxygen/allergy-list";

<AllergyList
  allergies={allergies}
  // only when an assertion is actually on file
  noKnownAllergies={patientHasNkaAssertion}
/>`,
    guidance: {
      use: [
        "On a chart header, pre-procedure checklist, or prescribing screen.",
        "With noKnownAllergies only when your data genuinely carries that assertion.",
        "Showing refuted entries rather than deleting them — de-prescribing depends on knowing an allergy was ruled out.",
      ],
      avoid: [
        "Inferring noKnownAllergies from an empty array. That is the exact error this component exists to prevent.",
        "Using it as an allergy-checking gate. It displays; it does not screen orders.",
        "hideInactive on a prescribing surface, where a resolved allergy is still relevant history.",
      ],
    },
    accessibility: [
      {
        label: "High-risk announcement",
        detail: "A live region states the high-risk count before the list is read.",
      },
      {
        label: "Distinct empty states",
        detail:
          "No-known-allergies and not-recorded differ in icon, wording, and tone — not color alone.",
      },
      {
        label: "Verification never dropped",
        detail:
          "Unconfirmed and refuted entries carry an explicit badge so they cannot be mistaken for confirmed allergies.",
      },
    ],
    limitations: [
      "Reaction onset and the free-text description are not rendered.",
      "Criticality falls back to worst observed reaction severity when absent — documented, but an approximation.",
      "No grouping by category (food, medication, environment).",
    ],
    related: ["medication-card", "condition-list"],
  },
  {
    name: "appointment-card",
    title: "Appointment Card",
    resource: "Appointment",
    resourceUrl: "https://hl7.org/fhir/R4/appointment.html",
    status: "shipping",
    summary: "Booked, pending, cancelled, no-show. Time zone is a required prop, not a guess.",
    description:
      "Renders a scheduled appointment with participants, timing, and status. Time zone is a required prop rather than an optional one, because defaulting to the browser's zone is how a clinic in one region books a patient in another for the wrong hour — and it is invisible in testing, since the developer and the test runner usually sit in the same zone as the clinic. Making the caller state the zone turns a silent class of bug into a compile error.",
    categories: ["Scheduling"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Booked",
      "Pending",
      "Arrived",
      "Checked in",
      "Completed",
      "Cancelled",
      "No-show",
      "Waitlisted",
      "Virtual",
      "In person",
    ],
    props: [
      {
        name: "appointment",
        type: "Appointment | undefined",
        description: "FHIR R4 Appointment resource.",
      },
      {
        name: "timeZone",
        type: "string",
        description:
          'IANA time zone the appointment should be read in, e.g. "Asia/Kolkata". Required.',
      },
      {
        name: "locale",
        type: "string",
        description: "BCP 47 locale for date and time formatting.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "onSelect",
        type: "(appointment: Appointment) => void",
        description: "Called when the card is activated.",
      },
    ],
    usage: `import { AppointmentCard } from "@/components/oxygen/appointment-card";

<AppointmentCard
  appointment={appointment}
  timeZone={clinic.timeZone}   // required — never inferred
  locale="en-IN"
/>`,
    guidance: {
      use: [
        "On patient portals, provider schedules, and check-in flows.",
        "With the clinic's time zone on staff-facing screens, and the patient's on patient-facing ones.",
        "Keeping no-show entries visible — follow-up usually depends on them.",
      ],
      avoid: [
        "Passing the browser's zone as a shortcut. If you do not know the correct zone, that is a data problem to fix, not to paper over.",
        "As a booking control. This renders an appointment; it does not schedule one.",
        "Treating no-show as a cancellation. They differ operationally and the component keeps them apart.",
      ],
    },
    accessibility: [
      {
        label: "Zone always visible",
        detail:
          "The time-zone label renders next to the time. A time without one is an assumption the reader cannot check.",
      },
      {
        label: "Modality is text",
        detail: "Virtual and in-person are labelled, not signalled by icon alone.",
      },
      {
        label: "Invalid zones degrade",
        detail:
          "An unrecognised IANA zone falls back to locale formatting rather than throwing and blanking the screen.",
      },
    ],
    limitations: [
      "Renders start time and duration; recurring appointment rules are not expanded.",
      "Shows the first practitioner participant only.",
      "Location is not resolved from the participant reference.",
    ],
    related: ["patient-banner", "coverage-card"],
  },
  {
    name: "condition-list",
    title: "Condition List",
    resource: "Condition",
    resourceUrl: "https://hl7.org/fhir/R4/condition.html",
    status: "shipping",
    summary:
      "Problem list that separates active from resolved and never promotes a provisional diagnosis.",
    description:
      "Renders a problem list from Condition resources. A problem list is not a log — its value comes from the reader telling at a glance which problems are current, so resolved and inactive entries are grouped separately rather than merely sorted below. Onset renders exactly as recorded: FHIR permits onsetString (“in childhood”) alongside onsetDateTime, and coercing a vague onset into a false precise date is a common and quietly damaging bug.",
    categories: ["Clinical data", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Active",
      "Recurrence",
      "Remission",
      "Resolved",
      "Inactive",
      "Provisional",
      "Differential",
      "Vague onset",
      "Onset not recorded",
    ],
    props: [
      {
        name: "conditions",
        type: "Condition[] | undefined",
        description: "FHIR R4 Condition resources.",
      },
      {
        name: "separateInactive",
        type: "boolean",
        default: "true",
        description: "Render resolved and inactive problems in a separate collapsed group.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
      {
        name: "label",
        type: "string",
        default: '"Problem list"',
        description: "Accessible name for the region.",
      },
      {
        name: "emptyMessage",
        type: "string",
        default: '"No problems recorded."',
        description: "Shown when the list is empty.",
      },
    ],
    usage: `import { ConditionList } from "@/components/oxygen/condition-list";

<ConditionList
  conditions={problems}
  separateInactive
/>`,
    guidance: {
      use: [
        "On chart summaries, visit preparation, and handoff screens.",
        "With separateInactive on any screen where current problems drive the next action.",
        "Preserving your own clinical sort order — the component does not reorder within a group.",
      ],
      avoid: [
        "As an encounter diagnosis list. Encounter diagnoses are scoped to a visit, not to the patient.",
        "Hiding provisional diagnoses. Carrying one forward as settled fact is the harm; hiding it is not the fix.",
        "separateInactive off on dense clinical screens, where the split is what makes the list scannable.",
      ],
    },
    accessibility: [
      {
        label: "Native disclosure",
        detail:
          "The inactive group uses details/summary, so it is keyboard operable and announced without custom ARIA.",
      },
      {
        label: "Provisional is labelled",
        detail:
          "Provisional and differential diagnoses carry an explicit badge rather than a subtle style difference.",
      },
      {
        label: "Onset honesty",
        detail:
          "A vague onset renders as its recorded text; a missing one renders as explicitly not recorded.",
      },
    ],
    limitations: [
      "Body site, stage, and evidence are not rendered.",
      "No grouping by category (problem list item vs encounter diagnosis).",
      "Severity is matched on display text; coded severity value sets are not yet mapped.",
    ],
    related: ["allergy-list", "medication-card"],
  },
  {
    name: "coverage-card",
    title: "Coverage Card",
    resource: "Coverage",
    resourceUrl: "https://hl7.org/fhir/R4/coverage.html",
    status: "shipping",
    summary:
      "Effective state derived from status and period together — an active record past its end date reads as lapsed.",
    description:
      "Renders insurance coverage with payer, plan, member and group identifiers, and the active period. A status of active is not sufficient to say a coverage is usable: a record can carry an active status while its period has already ended, and acting on lapsed coverage produces a denied claim and a surprise bill for the patient. The effective state is therefore derived from status and period together.",
    categories: ["Billing and coverage"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Active",
      "Lapsed",
      "Not yet effective",
      "Cancelled",
      "Status unknown",
      "Masked identifiers",
    ],
    props: [
      { name: "coverage", type: "Coverage | undefined", description: "FHIR R4 Coverage resource." },
      {
        name: "asOf",
        type: "Date",
        default: "new Date()",
        description:
          "Date used to evaluate the coverage period. Pass a fixed date for deterministic tests.",
      },
      {
        name: "maskIdentifiers",
        type: "boolean",
        default: "false",
        description: "Mask all but the last four characters of member and group identifiers.",
      },
      {
        name: "loading",
        type: "boolean",
        default: "false",
        description: "Renders the skeleton state.",
      },
    ],
    usage: `import { CoverageCard } from "@/components/oxygen/coverage-card";

<CoverageCard
  coverage={coverage}
  maskIdentifiers={isSharedWorkstation}
/>`,
    guidance: {
      use: [
        "On registration, check-in, and billing screens.",
        "With maskIdentifiers on front-desk and shared workstations.",
        "Rendering every coverage in order — secondary coverage matters for coordination of benefits.",
      ],
      avoid: [
        "As an eligibility check. A rendered card is not a real-time eligibility response from the payer.",
        "Showing only the primary coverage. Dropping secondary coverage causes downstream billing errors.",
        "Trusting status alone in your own code — use coverageState from @oxygenui-design/fhir.",
      ],
    },
    accessibility: [
      {
        label: "Lapsed is explicit",
        detail:
          "A lapsed coverage adds a written instruction to verify eligibility, not just a red border.",
      },
      {
        label: "Masked identifiers",
        detail:
          "Screen readers receive the last four characters and a statement that the value is masked.",
      },
      {
        label: "Absent fields",
        detail:
          "Every unpopulated field renders as explicitly not recorded rather than as an empty cell.",
      },
    ],
    limitations: [
      "Renders payor[0] only; multi-payer coverage shows the first.",
      "Cost-to-beneficiary (copay, deductible) is not rendered.",
      "No eligibility or benefits verification — display only.",
    ],
    related: ["patient-banner", "appointment-card"],
  },
  {
    name: "status-badge",
    title: "Status Badge",
    resource: "Primitive",
    resourceUrl: "https://hl7.org/fhir/R4/",
    status: "shipping",
    summary:
      "The shared severity chip. Critical reads identically on a lab result, a medication, and an allergy.",
    description:
      "The status chip every other Oxygen component uses, so that severity is consistent across the whole system. Two rules are enforced by the API itself: children is required, because an icon alone is not a label but a rebus; and tone maps to a semantic token rather than a raw color, so a caller passes “critical”, never “red”, and the token decides what that means in light, dark, and forced-colors modes.",
    categories: ["Primitive"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: ["Critical", "High", "Low", "Normal", "Unknown", "Neutral"],
    props: [
      {
        name: "tone",
        type: '"critical" | "high" | "low" | "normal" | "unknown" | "neutral"',
        default: '"neutral"',
        description: "Semantic tone. Maps to a status token, never to a raw color.",
      },
      {
        name: "icon",
        type: "ComponentType | null",
        description:
          "Replace the tone's default icon. Pass null only when an adjacent icon already carries the meaning.",
      },
      { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Chip size." },
      {
        name: "children",
        type: "ReactNode",
        description: "The label. Required — a badge without text is not accessible.",
      },
    ],
    usage: `import { StatusBadge } from "@/components/oxygen/status-badge";

<StatusBadge tone="critical">Critical high</StatusBadge>
<StatusBadge tone="unknown">Not interpreted</StatusBadge>`,
    guidance: {
      use: [
        "Anywhere a state needs to be shown consistently with the rest of the system.",
        "With a label that names the state, not its severity — “Critical high”, not “Danger”.",
      ],
      avoid: [
        "As a button or a filter control. It is not interactive.",
        "With icon={null} unless a neighbouring icon already conveys the same meaning.",
        "Inventing a tone for a non-clinical concept. Use neutral.",
      ],
    },
    accessibility: [
      {
        label: "Label required",
        detail:
          "The API has no icon-only variant, so a badge can never ship without an accessible label.",
      },
      {
        label: "Token-driven",
        detail:
          "Tones resolve through status tokens, keeping contrast correct in light, dark, and forced-colors modes.",
      },
    ],
    limitations: [
      "Not interactive — no button, link, or dismiss behavior.",
      "Six tones only. Additional semantics belong in a token, not a one-off color.",
    ],
    related: ["vitals-panel", "medication-card"],
  },
  {
    name: "absent-value",
    title: "Absent Value",
    resource: "dataAbsentReason",
    resourceUrl: "https://terminology.hl7.org/CodeSystem-data-absent-reason.html",
    status: "shipping",
    summary:
      "Renders absence as a statement. Withheld, not asked, declined, and errored are different facts and never share a dash.",
    description:
      "The smallest component in the library and one of the most consequential. A blank cell is indistinguishable from a rendering failure, a dash flattens fifteen FHIR reasons into one, and a zero is a value \u2014 reading \u201cnot measured\u201d as 0 is a clinical error. This renders the reason instead, and keeps \u201cthe system does not have this\u201d separate from \u201cyou are not allowed to see this\u201d, which look identical in most products and mean opposite things at the bedside.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Not recorded (no reason given)",
      "Not asked",
      "Declined to answer",
      "Result pending",
      "Hidden \u2014 restricted",
      "Unavailable \u2014 system error",
      "Not applicable",
    ],
    props: [
      {
        name: "reason",
        type: "CodeableConcept | AbsentReason",
        description:
          "The FHIR dataAbsentReason, or a normalized reason directly. Omit it and the component renders \u201cNot recorded\u201d \u2014 absence with no stated reason is itself a state, not a case to fall through.",
      },
      {
        name: "field",
        type: "string",
        description:
          "Field this absence belongs to, e.g. \u201cPotassium\u201d. Rendered as a screen-reader-only prefix so the announcement is \u201cPotassium, not asked\u201d. Omit inside a cell already associated with a header, or the name is announced twice.",
      },
      {
        name: "detail",
        type: "string",
        description:
          "Free-text explanation from the source. Ignored for masked and not-permitted, where source text can itself describe what was masked.",
      },
      {
        name: "variant",
        type: '"inline" | "block"',
        default: '"inline"',
        description: "Inline for table cells and body text; block for a whole empty section.",
      },
      {
        name: "hideIcon",
        type: "boolean",
        default: "false",
        description: "Hide the icon. Only when an adjacent icon already carries the meaning.",
      },
      {
        name: "onRequestAccess",
        type: "() => void",
        description:
          "Offer a way to request access. Rendered only for restricted reasons \u2014 there is nothing to request when the data genuinely does not exist.",
      },
    ],
    usage: `import { AbsentValue } from "@/components/oxygen/absent-value";

// From a FHIR payload \u2014 the reason is read and categorised for you.
<AbsentValue field="Potassium" reason={observation.dataAbsentReason} />

// Or state it directly.
<AbsentValue reason="masked" onRequestAccess={requestAccess} />

// Absence with no stated reason still renders text, never a blank.
<AbsentValue />`,
    guidance: {
      use: [
        "Everywhere a clinical value could be missing \u2014 cells, fields, and whole sections.",
        "With field set when the absence sits somewhere with no associated label.",
        "In place of any \u201c\u2014\u201d, \u201cN/A\u201d, or empty string standing in for a clinical value.",
      ],
      avoid: [
        "As a permission check. It renders an outcome; the application decides who may see what.",
        "For a zero or a genuinely negative result. Those are values and belong in the value slot.",
        "Passing source text through detail on masked content \u2014 the component ignores it by design.",
      ],
    },
    accessibility: [
      {
        label: "Never silent",
        detail:
          "Always renders text. A screen-reader user landing in the cell hears a reason rather than skipping an empty element.",
      },
      {
        label: "Field prefix",
        detail:
          "field adds a screen-reader-only prefix so the announcement is \u201cPotassium, not asked\u201d rather than a context-free \u201cnot asked\u201d.",
      },
      {
        label: "Not colour alone",
        detail:
          "Every reason carries an icon and a full-sentence label. The three tones are reinforcement, and the wording survives grayscale and forced-colors.",
      },
    ],
    limitations: [
      "Presentational only. It does not evaluate consent, security labels, or role \u2014 pass it the resolved reason.",
      "Restricted reasons deliberately drop source text, so a genuinely safe explanation is lost along with an unsafe one.",
      "The request-access affordance emits a callback; the access workflow itself is yours to build.",
    ],
    related: ["vitals-panel", "status-badge"],
  },
  {
    name: "clinical-value",
    title: "Clinical Value",
    resource: "Quantity",
    resourceUrl: "https://hl7.org/fhir/R4/datatypes.html#Quantity",
    status: "shipping",
    summary:
      "One measured quantity, unit, and comparator as a single atomic element that cannot drift apart.",
    description:
      "The bug this prevents is mundane and everywhere: a value and its unit as separate nodes, which drift apart under truncation, wrapping, or translation. Here they are one element. Precision is never changed — a lab that reported 5.10 meant three significant figures. Comparators survive, because a result of <0.01 is not 0.01. Absence routes to AbsentValue; there is no path that renders an empty string.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Numeric with unit",
      "Comparator (<0.01)",
      "Non-numeric result",
      "Absent with a reason",
      "Absent with no reason",
      "Unit missing",
    ],
    props: [
      { name: "quantity", type: "Quantity", description: "The measured quantity." },
      {
        name: "text",
        type: "string",
        description: "Non-numeric result — a titre, an organism, \u201cNonreactive\u201d.",
      },
      {
        name: "absentReason",
        type: "CodeableConcept",
        description:
          "Passed to AbsentValue when there is no value. Absence renders as a statement, never a blank.",
      },
      {
        name: "field",
        type: "string",
        description: "Field name, used for the accessible name of an absent value.",
      },
      {
        name: "tone",
        type: '"default" | "critical" | "high" | "low" | "normal" | "muted"',
        default: '"default"',
        description: "Emphasis, not severity. Severity belongs to StatusBadge.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg" | "hero"',
        default: '"md"',
        description: "Scales for dense tables through patient-facing hero values.",
      },
      {
        name: "hideUnit",
        type: "boolean",
        default: "false",
        description: "Hide the unit. Only when a column header already carries it.",
      },
    ],
    usage: `import { ClinicalValue } from "@/components/oxygen/clinical-value";

<ClinicalValue quantity={{ value: 6.8, unit: "mmol/L" }} tone="critical" bold />
<ClinicalValue quantity={{ value: 0.01, comparator: "<", unit: "ng/mL" }} />
<ClinicalValue field="Magnesium" absentReason={observation.dataAbsentReason} />`,
    guidance: {
      use: [
        "Any place a measured quantity is displayed, in tables and in patient apps.",
        "With tone set from a resolved interpretation, never from a raw colour.",
        "With field set so an absent value announces which field it belongs to.",
      ],
      avoid: [
        "Re-rounding a value before passing it. Precision came from the source.",
        "Splitting the unit into a sibling element \u2014 that is the failure this exists to prevent.",
        "Using tone to convey severity on its own; pair it with a badge.",
      ],
    },
    accessibility: [
      {
        label: "One accessible name",
        detail:
          "The comparator, number, and expanded unit are announced as a single phrase, so a screen reader never reads a bare number.",
      },
      {
        label: "Unit expansion",
        detail:
          "Common units are spoken in full \u2014 mg/dL and mmol/L differ by a factor that matters. Unknown units are announced as written rather than guessed at.",
      },
      {
        label: "Tabular figures",
        detail:
          "Decimal points align down a column, which is what makes a dense results table scannable.",
      },
    ],
    limitations: [
      "Unit conversion is not performed. Convert upstream and pass the value you want shown.",
      "The spoken-unit table covers common units only; an unlisted unit is read as written.",
      "Tone is presentational \\u2014 it does not derive severity from the value.",
    ],
    related: ["absent-value", "reference-range", "vitals-panel"],
  },
  {
    name: "reference-range",
    title: "Reference Range",
    resource: "Observation.referenceRange",
    resourceUrl: "https://hl7.org/fhir/R4/observation.html#Observation.referenceRange",
    status: "shipping",
    summary:
      "Positions a result against its own range, and refuses to draw when no bound was stated.",
    description:
      "A badge tells you a potassium is high. It does not tell you whether it is 5.2 or 6.8, and those are different afternoons. The discipline is in refusing to draw: no numeric bound means no bar, because a drawn scale implies bounds nobody stated. An off-scale value is clamped with an explicit marker rather than silently pinned to the edge as though it were merely borderline.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Bounded range",
      "One-sided range",
      "No range available",
      "Value off scale",
      "Text-only range",
      "No value",
    ],
    props: [
      { name: "value", type: "number", description: "The measured value." },
      {
        name: "range",
        type: "ObservationReferenceRange",
        description: "The range this observation carries. Never a global constant for the analyte.",
      },
      {
        name: "interpretation",
        type: "Interpretation",
        default: '"unknown"',
        description: "Drives the marker colour. Pass the interpretation already resolved.",
      },
      {
        name: "showBounds",
        type: "boolean",
        default: "true",
        description: "Show the numeric bounds beside the bar.",
      },
      {
        name: "noRangeLabel",
        type: "string",
        default: '"No reference range"',
        description: "Text shown when no range exists. This is the common case, not an error.",
      },
    ],
    usage: `import { ReferenceRange } from "@/components/oxygen/reference-range";

<ReferenceRange
  value={6.8}
  range={observation.referenceRange?.[0]}
  interpretation={getInterpretation(observation)}
/>`,
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
    accessibility: [
      {
        label: "Decorative by design",
        detail:
          "The bar is hidden from assistive technology. The value, bounds, and interpretation are announced by the surrounding row; a nameless graphic would add noise, not access.",
      },
      {
        label: "Off-scale survives greyscale",
        detail:
          "An off-scale marker changes shape as well as position, and is labelled in text, so the fact survives monochrome printing.",
      },
      {
        label: "Bounds as text",
        detail:
          "Numeric bounds render as text beside the bar rather than as axis labels inside it.",
      },
    ],
    limitations: [
      "Purely presentational \\u2014 it does not resolve which range applies to this patient.",
      "One-sided ranges infer the far end of the scale; it is marked, not hidden.",
      "Age- and sex-conditional range selection is the caller's job.",
    ],
    related: ["clinical-value", "vitals-panel", "status-badge"],
  },
  {
    name: "clinical-time",
    title: "Clinical Time",
    resource: "dateTime · instant",
    resourceUrl: "https://hl7.org/fhir/R4/datatypes.html#dateTime",
    status: "shipping",
    summary: "A clinical instant with a required time zone, honouring FHIR partial-date precision.",
    description:
      "timeZone is a required prop with no default, because the browser's zone is the wrong answer often enough to be dangerous. Relative time is an addition, never a replacement \u2014 \u201ctwo hours ago\u201d is useless in a handover and wrong in a medication record. Partial precision is preserved: rendering a year-only value as 1 January invents a day nobody recorded.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Full instant",
      "Day precision",
      "Month precision",
      "Year precision",
      "Future timestamp",
      "Event vs recorded time",
      "No date",
    ],
    props: [
      {
        name: "value",
        type: "string",
        description: "FHIR date, dateTime, or instant. Partial precision is honoured.",
      },
      {
        name: "timeZone",
        type: "string",
        description: "IANA zone the instant is read in. Required \u2014 there is no safe default.",
      },
      {
        name: "display",
        type: '"absolute" | "relative" | "both"',
        default: '"absolute"',
        description: "Relative never replaces the absolute form in the accessible name.",
      },
      {
        name: "showZone",
        type: "boolean",
        default: "false",
        description: "Show the zone label. Recommended wherever zones can differ.",
      },
      {
        name: "recorded",
        type: "string",
        description: "When the event was charted, if that differs from when it happened.",
      },
      {
        name: "asOf",
        type: "Date",
        default: "new Date()",
        description: "Evaluation date. Pass a fixed date for deterministic tests.",
      },
    ],
    usage: `import { ClinicalTime } from "@/components/oxygen/clinical-time";

<ClinicalTime value="2026-08-03T07:40:00Z" timeZone="America/New_York" showZone />
<ClinicalTime value="2026" timeZone="UTC" />  {/* renders "2026", not 1 January */}
<ClinicalTime value={given} recorded={charted} timeZone={facilityZone} />`,
    guidance: {
      use: [
        "Every clinical timestamp, with the facility or patient zone passed explicitly.",
        "With recorded set wherever charting time can differ from event time.",
        "With showZone on any surface where participants can be in different zones.",
      ],
      avoid: [
        "Relying on the browser zone. There is no default here on purpose.",
        "display=\\u201crelative\\u201d in handovers or medication records, where the absolute time is the point.",
        "Passing a pre-formatted string \\u2014 pass the raw FHIR value so precision survives.",
      ],
    },
    accessibility: [
      {
        label: "Absolute always announced",
        detail:
          "The accessible name carries the absolute date, time, and zone even when the visible text is relative.",
      },
      {
        label: "Real time element",
        detail: "Renders a <time> element with a machine-readable dateTime attribute.",
      },
      {
        label: "Future flagged in text",
        detail: "A future timestamp is labelled in words, not by colour alone.",
      },
    ],
    limitations: [
      "Relative phrasing is coarse by design and stops at 30 days.",
      "Daylight-saving ambiguity is not resolved \\u2014 the zone is applied as given.",
      "Relative display is ignored for year and month precision, which have no instant.",
    ],
    related: ["appointment-card", "vitals-panel", "patient-banner"],
  },
  {
    name: "identity-token",
    title: "Identity Token",
    resource: "Patient",
    resourceUrl: "https://hl7.org/fhir/R4/patient.html",
    status: "shipping",
    summary:
      "Compact, privacy-aware representation of a person, built around confirming rather than labelling.",
    description:
      "Wrong-patient error begins with an identity affordance that looked close enough. A photo renders only when consent is explicitly asserted \u2014 the component will not infer consent from a photo being present in the resource. A secondary identifier shows by default, because a name alone does not distinguish two people called J. Patel. Initials and colour derive from the characters of the name only; an avatar is not a classifier.",
    categories: ["Primitive", "Patient identity"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Complete identity",
      "Name not recorded",
      "Restricted record",
      "Deceased",
      "Photo without consent",
      "Name-alike collision",
      "Masked identifiers",
    ],
    props: [
      { name: "patient", type: "Patient", description: "FHIR R4 Patient resource." },
      {
        name: "identifierSystem",
        type: "string",
        description: "Identifier system to display, e.g. your MRN system.",
      },
      {
        name: "maskIdentifiers",
        type: "boolean",
        default: "false",
        description: "Mask all but the last four characters. For shared and public screens.",
      },
      {
        name: "photoConsent",
        type: "boolean",
        default: "false",
        description:
          "Assert that the patient consented to their photo being displayed. Required before any photo renders.",
      },
      {
        name: "size",
        type: '"sm" | "md" | "lg"',
        default: '"md"',
        description: "Avatar and name scale.",
      },
      {
        name: "avatarOnly",
        type: "boolean",
        default: "false",
        description: "Avatar only. The full name still reaches assistive technology.",
      },
      {
        name: "nameAlike",
        type: "boolean",
        default: "false",
        description:
          "Another patient in this view has a confusingly similar name. Renders an explicit warning.",
      },
    ],
    usage: `import { IdentityToken } from "@/components/oxygen/identity-token";

<IdentityToken patient={patient} identifierSystem={MRN_SYSTEM} />
<IdentityToken patient={patient} maskIdentifiers avatarOnly />
<IdentityToken patient={patient} nameAlike />`,
    guidance: {
      use: [
        "Worklists, care-team panels, search results, and anywhere a person is named.",
        "With nameAlike set by the list when two entries are confusable.",
        "With maskIdentifiers on shared workstations and public-facing screens.",
      ],
      avoid: [
        "Passing photoConsent as a constant true. It is an assertion about the patient, not a display preference.",
        "Using the avatar colour to mean anything. It is decorative and stable, nothing more.",
        "Omitting the identifier in a list where two patients could share a name.",
      ],
    },
    accessibility: [
      {
        label: "Full name never truncated",
        detail:
          "The visible name may truncate; the accessible name carries the whole identity, age, identifier, and flags as one phrase.",
      },
      {
        label: "Flags as text",
        detail:
          "Restricted and deceased are words, not icons a reader has to know. Photos carry empty alt because the adjacent name is the label.",
      },
      {
        label: "Name-alike announced",
        detail: "The collision warning is in the accessible name, not conveyed by styling alone.",
      },
    ],
    limitations: [
      "Name-alike detection is list-level; the component renders the warning but cannot detect the collision itself.",
      "Age precision uses birthDate only \\u2014 sub-day precision for neonates needs a birth time the resource rarely carries.",
      "Initial derivation is Latin-script-biased for multi-word names, though single tokens work in any script.",
    ],
    related: ["patient-banner", "absent-value", "restricted-shield"],
  },
  {
    name: "concept-chip",
    title: "Concept Chip",
    resource: "CodeableConcept",
    resourceUrl: "https://hl7.org/fhir/R4/datatypes.html#CodeableConcept",
    status: "shipping",
    summary:
      "A coded concept with its coding one interaction away, and honest about what is missing.",
    description:
      "Clinicians read display text; integrations and audits need the code. Hiding the coding makes data problems undiagnosable, showing it inline makes every list unreadable, so it lives behind a disclosure. The useful behaviour is the honesty: text with no coding is marked as such, an unrecognised system shows its raw URI rather than being dressed up as standard, and a concept outside an expected value set is flagged so bad mappings become visible instead of accumulating.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Coded concept",
      "Text only, no coding",
      "Multiple codings",
      "Unrecognised system",
      "Outside expected value set",
      "No concept recorded",
    ],
    props: [
      { name: "concept", type: "CodeableConcept", description: "The concept to display." },
      {
        name: "expectedCodes",
        type: "string[]",
        description:
          "Codes the concept should carry, as \u201csystem|code\u201d or bare \u201ccode\u201d. Anything outside is flagged.",
      },
      {
        name: "showSystem",
        type: "boolean",
        default: "false",
        description:
          "Show the terminology name inline, e.g. \u201cSNOMED CT \u00b7 Hypertension\u201d.",
      },
      {
        name: "readOnly",
        type: "boolean",
        default: "false",
        description: "Render as plain text with no disclosure. For dense grids.",
      },
      { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Chip size." },
      {
        name: "field",
        type: "string",
        description: "Field name for the accessible name when the chip stands alone.",
      },
    ],
    usage: `import { ConceptChip } from "@/components/oxygen/concept-chip";

<ConceptChip concept={condition.code} />
<ConceptChip concept={observation.code} showSystem />
<ConceptChip concept={concept} expectedCodes={["http://loinc.org|2823-3"]} />`,
    guidance: {
      use: [
        "Problem lists, order details, and anywhere a coded concept is shown to a clinician.",
        "With expectedCodes on surfaces where mapping quality matters.",
        "With readOnly in virtualised grids, where a popover per row is unusable.",
      ],
      avoid: [
        "Rendering the system URI as though it were a friendly name. Unrecognised means unrecognised.",
        "Using it for concepts you never intend a user to inspect \\u2014 readOnly text is cheaper.",
        "Assuming a coded concept is valid because it renders. The chip shows what is there.",
      ],
    },
    accessibility: [
      {
        label: "Button, not hover",
        detail:
          "The disclosure is a real button with an expanded state, dismissible with Escape. Nothing is hover-only.",
      },
      {
        label: "Code out of the name",
        detail:
          "The accessible name carries the concept text and any warning; system and code live inside the disclosure rather than crowding it.",
      },
      {
        label: "Warnings in text",
        detail: "Text-only and out-of-value-set are labelled in words, never by colour alone.",
      },
    ],
    limitations: [
      "No terminology server lookup \\u2014 it displays what the payload carries.",
      "Post-coordinated SNOMED expressions render as their raw code.",
      "The recognised-system list is finite; extend it as your integrations grow.",
    ],
    related: ["condition-list", "vitals-panel", "status-badge"],
  },
  {
    name: "density-provider",
    title: "Density Provider",
    resource: "Primitive",
    resourceUrl: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    status: "shipping",
    summary:
      "Sets the spacing and target-size contract for a subtree. Density changes spacing, never which facts appear.",
    description:
      "Density is a contract, not a preference. The same component serves a patient reading on a phone and a nurse scanning ninety rows, and the difference is spacing and target size \u2014 never which clinical facts appear. Hiding a fact to save a row is a defect, not a density mode. The provider also clamps to the WCAG 2.2 target-size floor rather than trusting every component to remember, and nests so a patient-facing card inside a clinical worklist keeps its own density.",
    categories: ["Primitive", "System"],
    dependencies: ["clsx", "tailwind-merge"],
    states: [
      "Patient density",
      "Standard density",
      "Clinical density",
      "Nested providers",
      "Target-size floor enforced",
    ],
    props: [
      {
        name: "density",
        type: '"patient" | "standard" | "clinical"',
        description: "The density in force for this subtree.",
      },
      {
        name: "asChild",
        type: "boolean",
        default: "false",
        description:
          "Clone the single child instead of wrapping. For table rows where an extra div breaks layout.",
      },
      { name: "children", type: "ReactNode", description: "Subtree the contract applies to." },
    ],
    usage: `import { DensityProvider, useDensity } from "@/components/oxygen/density-provider";

<DensityProvider density="clinical">
  <ObservationPanel observations={observations} />
</DensityProvider>

// Components can adapt behaviour, not just spacing.
const density = useDensity();`,
    guidance: {
      use: [
        "At the root of a worklist, flowsheet, or patient-facing surface.",
        "Nested, when a patient-facing card sits inside a clinical screen.",
        "With asChild inside table rows and other layout-sensitive containers.",
      ],
      avoid: [
        "Deriving density from the viewport. Density and breakpoint are independent axes.",
        "Using clinical density to fit more facts by hiding some. That is a defect.",
        "Assuming the floor makes any spacing safe \\u2014 it clamps targets, not text size.",
      ],
    },
    accessibility: [
      {
        label: "Target-size floor",
        detail:
          "Clinical density cannot shrink an interactive target below the WCAG 2.2 minimum of 24 CSS pixels. DensityTarget enforces it around any control.",
      },
      {
        label: "Independent of zoom",
        detail:
          "Density is an author decision; user text scaling and zoom apply on top and are not overridden.",
      },
      {
        label: "No content hidden",
        detail:
          "Spacing changes only. Nothing that is visible at patient density disappears at clinical density.",
      },
    ],
    limitations: [
      "Does not read OS accessibility preferences \\u2014 wire those into the density you pass.",
      "The floor applies to controls wrapped in DensityTarget, not automatically to every descendant.",
      "Token values come from @oxygenui-design/tokens; this sets the attribute and context, not the spacing scale.",
    ],
    related: ["vitals-panel", "clinical-skeleton"],
  },
  {
    name: "restricted-shield",
    title: "Restricted Shield",
    resource: "Consent · meta.security",
    resourceUrl: "https://hl7.org/fhir/R4/consent.html",
    status: "shipping",
    summary:
      "Redacted by default. Discloses only with a stated reason, on a timer, and can conceal that content exists.",
    description:
      "Behavioral health, substance use under 42 CFR Part 2, reproductive care, HIV status, and minor confidentiality can each be restricted independently of the rest of the chart. The redacted state is the default render, not the fallback, and every path fails closed. The subtle requirement is the middle ground \u2014 stating that restricted content exists without revealing what it is \u2014 with a concealExistence variant for the narrower case where even that acknowledgement is not permitted.",
    categories: ["Primitive", "System", "Clinical"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Restricted, disclosure permitted",
      "Restricted, disclosure not permitted",
      "Existence concealed",
      "Disclosed with countdown",
      "Auto re-redacted",
      "Not restricted",
    ],
    props: [
      {
        name: "restricted",
        type: "boolean",
        default: "false",
        description: "Whether the content is restricted. Decided by the application, not here.",
      },
      {
        name: "disclosurePermitted",
        type: "boolean",
        default: "true",
        description:
          "Whether this viewer may break the glass. False renders no disclosure path and explains why.",
      },
      {
        name: "concealExistence",
        type: "boolean",
        default: "false",
        description: "Do not acknowledge that content exists at all.",
      },
      {
        name: "category",
        type: "string",
        default: '"Restricted record"',
        description:
          "Category shown to the reader, e.g. \u201cSubstance use \u2014 42 CFR Part 2\u201d.",
      },
      {
        name: "reasons",
        type: "string[]",
        description: "Reasons a viewer may choose from. Free text alone is not auditable.",
      },
      {
        name: "durationSeconds",
        type: "number",
        default: "300",
        description: "How long a disclosure lasts before the shield closes again.",
      },
      {
        name: "onDisclose",
        type: "(event: DisclosureEvent) => void",
        description:
          "Emitted on disclosure. The application persists it \u2014 the component does not.",
      },
    ],
    usage: `import { RestrictedShield } from "@/components/oxygen/restricted-shield";

<RestrictedShield
  restricted={isPart2Protected}
  category="Substance use — 42 CFR Part 2"
  onDisclose={(event) => auditLog.record(event)}
>
  <ObservationPanel observations={toxicology} />
</RestrictedShield>`,
    guidance: {
      use: [
        "Around any content subject to a sensitivity policy, at field, section, or record level.",
        "With onDisclose wired to your audit store \\u2014 the event is emitted, not saved.",
        "With concealExistence only where the existence of the record is itself sensitive.",
      ],
      avoid: [
        "Treating it as access control. Restricted data still reached the browser; enforce server-side.",
        "Long durationSeconds values. A disclosure that lasts until logout is not time-boxed.",
        "Putting the sensitive category name in a category string that itself reveals the content.",
      ],
    },
    accessibility: [
      {
        label: "Announced as withheld",
        detail:
          "The redacted state reads as restricted content with an available action, never as an empty section.",
      },
      {
        label: "Polite countdown",
        detail:
          "The re-hide timer uses a polite live region. A countdown that interrupts every second is worse than the risk it mitigates.",
      },
      {
        label: "Real form controls",
        detail:
          "The reason is a labelled select, not a free-text box, so the disclosure record is auditable.",
      },
    ],
    limitations: [
      "Renders policy outcomes; it does not evaluate consent, security labels, or role.",
      "The audit event is emitted only. Persistence, retention, and review are yours.",
      "Timer state is per-instance and resets on remount.",
    ],
    related: ["absent-value", "empty-state", "action-gate"],
  },
  {
    name: "action-gate",
    title: "Action Gate",
    resource: "AuditEvent",
    resourceUrl: "https://hl7.org/fhir/R4/auditevent.html",
    status: "shipping",
    summary:
      "Two-step confirmation that names the consequence and the patient, then emits an audit event.",
    description:
      "The copy rule is the whole component: it states what will happen, to whom, and what cannot be undone. \u201cAre you sure?\u201d is not a confirmation \u2014 it asks the reader to re-derive the consequence they were already unsure about, which is why consequence and patientName exist as props. Friction is calibrated rather than maximised: too little and wrong-patient actions happen, too much and clinicians route around the system, which is worse because it moves the work somewhere you cannot see.",
    categories: ["Primitive", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Reversible confirm",
      "Irreversible type-to-confirm",
      "Hold-to-confirm",
      "Reason required",
      "In flight",
      "Cancelled",
    ],
    props: [
      {
        name: "action",
        type: "string",
        description:
          "Imperative name. The same word appears on the trigger, in the dialog, and in the result.",
      },
      {
        name: "consequence",
        type: "string",
        description: "What actually happens, in plain language. Never \u201cAre you sure?\u201d.",
      },
      {
        name: "patientName",
        type: "string",
        description:
          "The patient affected. Acting on the wrong chart is the error being prevented.",
      },
      {
        name: "reversible",
        type: "boolean",
        default: "true",
        description: "Drives the default friction level and the closing sentence.",
      },
      {
        name: "mode",
        type: '"confirm" | "type" | "hold"',
        description: "Escalate friction. Defaults to confirm when reversible, type when not.",
      },
      {
        name: "reasons",
        type: "string[]",
        description: "Require a reason before proceeding. Recorded on the audit event.",
      },
      {
        name: "onConfirm",
        type: "(event: ActionAuditEvent) => void | Promise<void>",
        description: "Emitted on confirmation. Persisting the event is the application's job.",
      },
    ],
    usage: `import { ActionGate } from "@/components/oxygen/action-gate";

<ActionGate
  action="Discontinue"
  consequence="Lisinopril 10 mg will stop immediately and no further doses will be dispensed."
  patientName="Marisol Reyes-Okonkwo"
  reversible={false}
  reasons={["Adverse reaction", "No longer indicated", "Patient request"]}
  onConfirm={(event) => auditLog.record(event)}
/>`,
    guidance: {
      use: [
        "Anything that changes a clinical record, medication, schedule commitment, or consent state.",
        "With reversible={false} and mode=\\u201ctype\\u201d for genuinely irreversible actions.",
        "With mode=\\u201chold\\u201d on dense screens where a stray double-click could commit.",
      ],
      avoid: [
        "Generic consequence text. If it does not name the effect, it is not a confirmation.",
        "Gating routine, reversible actions \\u2014 friction everywhere teaches people to click through.",
        "Assuming the audit event is stored. It is emitted; you persist it.",
      ],
    },
    accessibility: [
      {
        label: "Focus managed",
        detail:
          "Focus moves into the dialog on open and returns to the trigger on dismiss. Escape always exits.",
      },
      {
        label: "Consequence in the description",
        detail:
          "The dialog is an alertdialog whose accessible description carries the consequence and the patient name, not just visible text.",
      },
      {
        label: "Hold has a keyboard path",
        detail: "Hold-to-confirm works with Space and Enter, so it is never pointer-only.",
      },
    ],
    limitations: [
      "Emits an audit event; it does not persist one or guarantee delivery.",
      "No re-authentication step \\u2014 compose one around it where policy requires.",
      "Focus is managed but not fully trapped; a portal-based dialog is the next step.",
    ],
    related: ["restricted-shield", "status-badge"],
  },
  {
    name: "empty-state",
    title: "Empty State",
    resource: "Primitive",
    resourceUrl: "https://hl7.org/fhir/R4/list.html#List.emptyReason",
    status: "shipping",
    summary:
      "Five reasons a section shows nothing. An unavailable section is never rendered as an empty one.",
    description:
      "Most products render one empty state. Never-recorded, filtered-to-empty, source-unavailable, restricted, and pending mean entirely different things, and conflating them has caused documented harm. Unavailable is the dangerous one: a section that failed to load and renders as \u201cno results\u201d tells a clinician the patient has no allergies when the allergy service was simply down. title is required rather than defaulted, because the correct sentence for an empty allergy list is not the correct sentence for an empty problem list.",
    categories: ["Primitive", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Never recorded",
      "Filtered to empty",
      "Source unavailable",
      "Restricted",
      "Pending",
      "Compact",
    ],
    props: [
      {
        name: "reason",
        type: '"never" | "filtered" | "unavailable" | "restricted" | "pending"',
        default: '"never"',
        description: "Why there is nothing here. These are not interchangeable.",
      },
      {
        name: "title",
        type: "string",
        description:
          "Required. There is no safe default \u2014 a wrong sentence asserts a clinical negative.",
      },
      {
        name: "description",
        type: "string",
        description: "Optional second line explaining what to do.",
      },
      {
        name: "lastCheckedLabel",
        type: "string",
        description:
          "When the source was last read successfully. Without it, an empty list looks current.",
      },
      { name: "action", type: "ReactNode", description: "The next step, where there is one." },
      {
        name: "compact",
        type: "boolean",
        default: "false",
        description: "Single-line rendering for table cells and clinical density.",
      },
    ],
    usage: `import { EmptyState } from "@/components/oxygen/empty-state";

<EmptyState
  reason="never"
  title="No allergy information recorded"
  description="This is not the same as no known allergies. Ask and record before prescribing."
/>

<EmptyState reason="unavailable" title="Allergies could not be loaded" lastCheckedLabel="Last read 08:41" />`,
    guidance: {
      use: [
        "Every list, table, and section that can render nothing.",
        "With reason=\\u201cunavailable\\u201d whenever a fetch failed, never \\u201cnever\\u201d.",
        "With lastCheckedLabel wherever staleness would change a clinical reading.",
      ],
      avoid: [
        "Asserting a clinical negative. \\u201cNo allergies recorded\\u201d is safe; \\u201cNo allergies\\u201d is a claim.",
        "Reusing one empty state for a failed fetch and a genuinely empty list.",
        "Illustration-led empty states on clinical surfaces \\u2014 the sentence is the content.",
      ],
    },
    accessibility: [
      {
        label: "Filtered emptiness announced",
        detail:
          "Emptiness that follows a user action uses a polite live region; emptiness that was always there does not, because it is not news.",
      },
      {
        label: "Icon decorative",
        detail: "The glyph is hidden from assistive technology. The message carries the meaning.",
      },
      {
        label: "Reason exposed",
        detail:
          "data-empty-reason is on the element for testing and for styling without re-deriving state.",
      },
    ],
    limitations: [
      "Copy is yours \\u2014 the component enforces the distinction, not the wording.",
      "No retry behaviour built in; pass an action.",
      "Does not detect its own reason; the caller knows why the section is empty.",
    ],
    related: ["absent-value", "clinical-skeleton", "restricted-shield"],
  },
  {
    name: "clinical-skeleton",
    title: "Clinical Skeleton",
    resource: "Primitive",
    resourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/alert/",
    status: "shipping",
    summary:
      "Loading shaped like layout, never like a value — plus progressive sections that keep partial failure visible.",
    description:
      "A skeleton shaped like a lab result invites the reader to fill in the blank, so these are shaped like layout: neutral bars of varying width, never like a number. The more important export is ProgressiveSection. Six source systems behind one screen is normal in healthcare and partial failure is the normal case, so the dangerous outcome is a screen that renders five sections and silently omits the sixth. A section is always in exactly one of four honest states, and failed and stale are visible facts rather than the absence of a fact.",
    categories: ["Primitive", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Loading",
      "Loaded",
      "Failed with retry",
      "Stale while revalidating",
      "Reduced motion",
    ],
    props: [
      { name: "rows", type: "number", default: "3", description: "Number of placeholder rows." },
      {
        name: "variant",
        type: '"text" | "row" | "card"',
        default: '"text"',
        description: "Match the shape of the content being replaced, to avoid layout shift.",
      },
      {
        name: "state",
        type: '"loading" | "loaded" | "failed" | "stale"',
        description: "ProgressiveSection: the one honest state this section is in.",
      },
      {
        name: "label",
        type: "string",
        description: "ProgressiveSection: section name, used in the failure message.",
      },
      {
        name: "cachedAtLabel",
        type: "string",
        description: "ProgressiveSection: when cached content shown while revalidating was read.",
      },
      {
        name: "onRetry",
        type: "() => void",
        description: "ProgressiveSection: retry handler for the failed state.",
      },
    ],
    usage: `import { ClinicalSkeleton, ProgressiveSection } from "@/components/oxygen/clinical-skeleton";

<ProgressiveSection
  state={medications.state}
  label="Medications"
  failureDetail="The pharmacy system did not respond."
  onRetry={medications.refetch}
>
  <MedicationList requests={medications.data} />
</ProgressiveSection>`,
    guidance: {
      use: [
        "Around every independently-fetched section on a composed clinical screen.",
        "With one section per source system, so one slow service does not block the rest.",
        "With state=\\u201cstale\\u201d whenever cached content is shown during revalidation.",
      ],
      avoid: [
        "Skeletons shaped like specific values \\u2014 that is the failure this prevents.",
        "A single page-level spinner for a screen backed by several sources.",
        "Rendering a failed section as empty. That is the harm ProgressiveSection exists to stop.",
      ],
    },
    accessibility: [
      {
        label: "Announced once",
        detail: "The skeleton is marked busy and announces once, not on every frame.",
      },
      {
        label: "Failure is assertive",
        detail:
          "A failed section uses role=alert, because it changes what the reader can conclude from the screen.",
      },
      {
        label: "Reduced motion respected",
        detail: "Shimmer is motion-safe only; reduced-motion users get a static placeholder.",
      },
    ],
    limitations: [
      "Does not fetch or retry on its own \\u2014 it renders the state you pass.",
      "No automatic timeout detection; decide when slow becomes failed.",
      "Skeleton shapes approximate layout and will not perfectly prevent shift in every composition.",
    ],
    related: ["empty-state", "density-provider", "vitals-panel"],
  },
  {
    name: "dose-input",
    title: "Dose Input",
    resource: "Dosage",
    resourceUrl: "https://hl7.org/fhir/R4/dosage.html",
    status: "shipping",
    summary:
      "Dose entry with ISMP formatting rules, plausibility separated from hard limits, and visible arithmetic.",
    description:
      "One of the highest-consequence inputs in healthcare software, and a free-text number field is not an acceptable control for it. Three defences in order of harm prevented: ISMP formatting rules, because \u201c1.0 mg\u201d read past the decimal point is 10 mg; plausibility warnings kept separate from hard maximums, because a dose can be unusual and correct and conflating the two teaches prescribers to click through both; and weight-based calculation that keeps its inputs on screen, because a calculator returning a bare number invites use with a stale weight.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Well-formed dose",
      "Trailing zero",
      "Missing leading zero",
      "Above plausible range",
      "Above absolute maximum",
      "Weight-based calculation",
      "No weight on file",
    ],
    props: [
      {
        name: "value",
        type: "string",
        description: "Current entry, as typed. Kept as a string so precision is not lost.",
      },
      {
        name: "units",
        type: "string[]",
        description: "Units permitted for this drug and route. Never a free list.",
      },
      {
        name: "plausibleMin / plausibleMax",
        type: "number",
        description: "Soft bounds. Crossing them warns with a reason and does not block.",
      },
      {
        name: "absoluteMax",
        type: "number",
        description: "Documented hard maximum. Crossing it blocks and states the maximum.",
      },
      { name: "dosePerKg", type: "number", description: "Enables weight-based calculation." },
      {
        name: "weightKg",
        type: "number",
        description: "Recorded weight. Omit it and no calculation is offered.",
      },
    ],
    usage: `import { DoseInput } from "@/components/oxygen/dose-input";

<DoseInput
  value={dose}
  onChange={setDose}
  units={["mg", "mL"]}
  plausibleMax={40}
  absoluteMax={80}
  dosePerKg={0.5}
  weightKg={patientWeightKg}
/>`,
    guidance: {
      use: [
        "Any dose, weight, rate, or volume entry.",
        "With absoluteMax set from the drug reference, not from a guess.",
        "With weightKg wired to a recorded weight and left undefined when there is none.",
      ],
      avoid: [
        "Silently rewriting a typed dose. The corrected form is offered, never applied.",
        "Using plausibleMax as a hard stop \\u2014 unusual doses are sometimes correct.",
        "Substituting an average weight when none is recorded.",
      ],
    },
    accessibility: [
      {
        label: "Messages bound to the field",
        detail:
          "Every warning is associated through aria-describedby and announced on the input, not discovered at submit.",
      },
      {
        label: "Blocking states are alerts",
        detail: "Crossing the absolute maximum uses role=alert and sets aria-invalid.",
      },
      {
        label: "No spinner",
        detail:
          "A numeric keypad without increment controls, so a stray scroll cannot change a prescription.",
      },
    ],
    limitations: [
      "Plausibility bounds are supplied by the caller \\u2014 there is no built-in drug reference.",
      "Unit lists are caller-supplied; the component does not know which units suit a formulation.",
      "Override workflow for exceeding the maximum is yours to build; this blocks and explains.",
    ],
    related: ["clinical-value", "action-gate", "medication-card"],
  },
  {
    name: "provenance",
    title: "Provenance Tag",
    resource: "Provenance",
    resourceUrl: "https://hl7.org/fhir/R4/provenance.html",
    status: "shipping",
    summary: "Who recorded this, when, from where, and whether it has been amended.",
    description:
      "Clinicians discount data they cannot source, and an amended result that looks identical to the original is a known harm pathway \u2014 both are solved by the same disclosure. It refuses to flatten three distinctions: when something happened versus when it was written, who observed it versus what typed it, and present versus absent provenance. Amendment is surfaced on the trigger itself, because a correction nobody opens is a correction nobody saw.",
    categories: ["Primitive", "System"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Clinician-entered",
      "Patient-reported",
      "Device-recorded",
      "Interface feed",
      "Amended",
      "Source not recorded",
      "Charted after the event",
    ],
    props: [
      { name: "provenance", type: "Provenance", description: "FHIR Provenance for the datum." },
      {
        name: "resource",
        type: "Resource",
        description: "The resource itself, read for meta.versionId and meta.lastUpdated.",
      },
      {
        name: "timeZone",
        type: "string",
        description: "IANA zone. Required, for the same reason it is on ClinicalTime.",
      },
      {
        name: "subject",
        type: "string",
        description: "What this describes, used in the accessible name.",
      },
      {
        name: "inline",
        type: "boolean",
        default: "false",
        description: "Render attribution as text instead of behind a disclosure.",
      },
    ],
    usage: `import { ProvenanceTag } from "@/components/oxygen/provenance";

<ProvenanceTag
  provenance={provenance}
  resource={observation}
  timeZone="America/New_York"
  subject="Potassium 6.8 mmol/L"
/>`,
    guidance: {
      use: [
        "Beside any value whose source a clinician might reasonably question.",
        "On results that can be amended \\u2014 the amended state shows on the trigger.",
        "With inline on dense surfaces where a popover per row is unusable.",
      ],
      avoid: [
        "Treating an absent provenance as clinician-entered. Unknown is rendered as unknown.",
        "Hiding amendment behind the disclosure only.",
        "Assuming meta.lastUpdated is the clinical event time. They are different facts.",
      ],
    },
    accessibility: [
      {
        label: "Named trigger",
        detail: "The button says what it reveals and about what, rather than being a bare icon.",
      },
      {
        label: "Dialog semantics",
        detail: "Content is a labelled group, dismissible with Escape; nothing is hover-only.",
      },
      {
        label: "Amendment in the name",
        detail: "The amended state is in the trigger's accessible name, not only in its colour.",
      },
    ],
    limitations: [
      "Reads one agent and one source entity; complex provenance chains are summarised.",
      "Does not fetch version history \\u2014 it reports what the payload and meta carry.",
      "Amendment detection uses versionId and revision entities; systems that populate neither will read as unamended.",
    ],
    related: ["clinical-time", "vitals-panel", "absent-value"],
  },
  {
    name: "unsaved-guard",
    title: "Unsaved Guard",
    resource: "Primitive",
    resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event",
    status: "shipping",
    summary:
      "Stops clinical documentation being lost to a navigation, a patient switch, or a closed tab.",
    description:
      "Lost notes are among the most reliably enraging failures in clinical software, and they are almost always a coordination failure rather than a bug in any one form. Dirtiness is registered centrally so every editor participates, and the guard blocks navigation, patient-context changes, and tab close. Two distinctions decide whether the prompt is honest: recoverable drafts versus work that exists only in this tab, and trivially recreatable state versus twenty minutes of documentation \u2014 so the registry takes a description and the prompt names what is at stake.",
    categories: ["Primitive", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Clean",
      "Saving",
      "Saved",
      "Autosave failed",
      "Prompt on navigation",
      "Prompt on patient switch",
      "Browser close guard",
    ],
    props: [
      {
        name: "surface",
        type: "DirtySurface",
        description:
          "useUnsavedWork: id, description, saveState, and last-saved label for this editor.",
      },
      {
        name: "confirmLeave",
        type: "(intent: string) => Promise<boolean>",
        description: "useConfirmLeave: ask the guard whether it is safe to leave.",
      },
      {
        name: "state",
        type: "SaveState",
        description: "SaveStatus: clean, saving, saved, or failed.",
      },
      {
        name: "lastSavedLabel",
        type: "string",
        description: "SaveStatus: when the last successful save happened.",
      },
    ],
    usage: `import {
  UnsavedGuardProvider,
  useUnsavedWork,
  useConfirmLeave,
  SaveStatus,
} from "@/components/oxygen/unsaved-guard";

useUnsavedWork({ id: "note-42", description: "Progress note", saveState });

const confirmLeave = useConfirmLeave();
if (await confirmLeave("Switching to another patient.")) switchPatient();`,
    guidance: {
      use: [
        "Around the whole application, once, at the root.",
        "In every editing surface \\u2014 a guard only some forms use is a guard that does not work.",
        "Before any patient-context change, not just route changes.",
      ],
      avoid: [
        "Describing a surface as \\u201cform\\u201d or \\u201cchanges\\u201d. Name what would be lost.",
        "Treating a failed autosave as recoverable. That draft exists only in this tab.",
        "Relying on the browser prompt alone \\u2014 it cannot be styled or worded.",
      ],
    },
    accessibility: [
      {
        label: "Managed focus",
        detail:
          "The prompt is an alertdialog; focus moves in on open and Escape cancels the departure.",
      },
      {
        label: "Failure is assertive",
        detail:
          "Autosave failure announces assertively. A silent failure lets someone write for twenty minutes believing their note is filed.",
      },
      {
        label: "Named stakes",
        detail:
          "The dialog lists each dirty surface by description, so the consequence is legible rather than generic.",
      },
    ],
    limitations: [
      "The browser-level prompt cannot be styled or worded \\u2014 that is a platform limit.",
      "Does not persist drafts; it reports save state and blocks. Persistence is yours.",
      "Route interception depends on your router calling confirmLeave.",
    ],
    related: ["action-gate", "app-shell"],
  },
  {
    name: "error-boundary",
    title: "Error Boundary",
    resource: "OperationOutcome",
    resourceUrl: "https://hl7.org/fhir/R4/operationoutcome.html",
    status: "shipping",
    summary:
      "Contains a failure to one section and never renders a partial record as a complete one.",
    description:
      "The dangerous case is not a blank screen but a chart rendering five of a patient's eight medications with nothing to indicate the other three failed. A blank screen is obviously broken; a partial render looks complete and gets acted on. Critical boundaries \u2014 a patient banner, a code-status display \u2014 are marked as such because their absence changes what the reader can safely conclude from everything around them. PHI never leaves in a report: React error messages routinely embed props, and props here are patient data.",
    categories: ["Primitive", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: ["Healthy", "Section failed", "Critical boundary failed", "Retried"],
    props: [
      {
        name: "label",
        type: "string",
        description:
          "Section name used in the message. \u201cMedications\u201d, not \u201cMedListView\u201d.",
      },
      {
        name: "critical",
        type: "boolean",
        default: "false",
        description: "Marks a boundary whose failure invalidates the surrounding screen.",
      },
      {
        name: "onError",
        type: "(report: ErrorReport) => void",
        description: "Reported without PHI \u2014 reference, boundary, and message only.",
      },
      {
        name: "onRetry",
        type: "() => void",
        description: "Called when the user retries after a reset.",
      },
    ],
    usage: `import { ClinicalErrorBoundary } from "@/components/oxygen/error-boundary";

<ClinicalErrorBoundary label="Medications" onError={report}>
  <MedicationList requests={medications} />
</ClinicalErrorBoundary>

<ClinicalErrorBoundary label="Patient banner" critical>
  <PatientBanner patient={patient} />
</ClinicalErrorBoundary>`,
    guidance: {
      use: [
        "Around every independently-rendered clinical section.",
        "With critical on identity, code status, and allergy surfaces.",
        "With onError wired to monitoring that you have confirmed scrubs PHI.",
      ],
      avoid: [
        "One boundary around the whole page \\u2014 that is the blank screen this avoids.",
        "Rendering null on error. There is deliberately no silent path.",
        "Passing the raw error to a logger without checking what it contains.",
      ],
    },
    accessibility: [
      {
        label: "Assertive",
        detail:
          "Failures use role=alert, because they change what the reader can conclude from the screen.",
      },
      {
        label: "Quotable reference",
        detail:
          "A short reference id the user can read aloud to support, with no stack trace or PHI.",
      },
      {
        label: "Retry is a real control",
        detail: "Recovery is a labelled button, not a page reload instruction.",
      },
    ],
    limitations: [
      "React error boundaries do not catch errors in event handlers or async code.",
      "PHI scrubbing covers what this sends; your monitoring pipeline is still yours to verify.",
      "Reset re-mounts children; it does not re-fetch unless onRetry does.",
    ],
    related: ["clinical-skeleton", "empty-state"],
  },
  {
    name: "app-shell",
    title: "App Shell",
    resource: "PractitionerRole",
    resourceUrl: "https://hl7.org/fhir/R4/practitionerrole.html",
    status: "shipping",
    summary:
      "Navigation composed from permissions, patient context as a landmark, and guarded context changes.",
    description:
      "A prescriber, a scheduler, and a billing analyst need genuinely different products out of one codebase, so navigation is derived from permissions rather than rendered-then-disabled \u2014 a greyed-out \u201cPrescribe\u201d teaches a nurse the system is broken and teaches an auditor nothing. Patient context is a landmark rather than a breadcrumb, because which chart is open is a safety fact. Session expiry warns before it acts, because expiring a session under a half-written note is how documentation is lost to a policy timer.",
    categories: ["Navigation", "System"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Role with full access",
      "Role with limited access",
      "No features enabled",
      "Session expiring",
      "Break-glass active",
      "Mobile navigation",
    ],
    props: [
      {
        name: "scopes",
        type: "string[]",
        description: "Scopes the user holds, as resolved by the server.",
      },
      {
        name: "items",
        type: "NavItem[]",
        description: "Destinations, each optionally requiring a scope.",
      },
      {
        name: "patientContext",
        type: "ReactNode",
        description: "Persistent patient context, rendered as its own landmark.",
      },
      {
        name: "onNavigate",
        type: "(item) => Promise<boolean> | boolean",
        description: "Called before a destination change so unsaved work can veto it.",
      },
      {
        name: "sessionSecondsRemaining",
        type: "number",
        description: "Under the warning threshold, a countdown and extend control appear.",
      },
      {
        name: "breakGlassActive",
        type: "boolean",
        default: "false",
        description: "Emergency access in force. Marked persistently, not once at entry.",
      },
    ],
    usage: `import { AppShell } from "@/components/oxygen/app-shell";

<AppShell
  scopes={user.scopes}
  items={navItems}
  currentId="worklist"
  patientContext={<PatientBanner patient={patient} />}
  onNavigate={(item) => confirmLeave("Moving to " + item.label)}
  sessionSecondsRemaining={secondsLeft}
>
  {children}
</AppShell>`,
    guidance: {
      use: [
        "As the single outermost frame of a clinical application.",
        "With onNavigate wired to the unsaved-work guard.",
        "With requires set on every destination that is permission-gated.",
      ],
      avoid: [
        "Treating hidden navigation as access control. The server remains the authority.",
        "Dropping patient context on narrow screens \\u2014 it compresses, never disappears.",
        "Rendering permitted-but-disabled items. Absent is clearer and more auditable.",
      ],
    },
    accessibility: [
      {
        label: "Correct landmarks",
        detail:
          "Primary navigation, patient context, and main content are separate labelled landmarks.",
      },
      {
        label: "Counts in the name",
        detail:
          "Badge counts are part of each link's accessible name, with urgent distinguished from unread.",
      },
      {
        label: "Provisioning failure is visible",
        detail: "A role with nothing permitted says so rather than rendering an empty product.",
      },
    ],
    limitations: [
      "Does not implement routing \\u2014 it renders links and delegates to onNavigate.",
      "Session countdown is driven by the prop; the timer itself is yours.",
      "Multi-patient tab management is a separate component.",
    ],
    related: ["unsaved-guard", "patient-banner", "restricted-shield"],
  },
  {
    name: "code-status",
    title: "Code Status",
    resource: "Consent",
    resourceUrl: "https://hl7.org/fhir/R4/consent.html",
    status: "shipping",
    summary:
      "Resuscitation status and directives. Unknown is loud, never a silent default to full code.",
    description:
      "The highest-consequence display in the library. A DNR order that is not visible during a code is a catastrophic failure of information design, and the failure mode is never a crash \u2014 it is a directive on file, one click away, that nobody found in eleven seconds. So unknown is a loud state rather than a default to full code, verification age is part of the status, and conflicting directives are surfaced as a question rather than resolved by silently picking the newer one.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Full code",
      "DNR",
      "DNR / DNI",
      "Comfort measures",
      "Not on file",
      "Verification stale",
      "Conflicting directives",
    ],
    props: [
      {
        name: "status",
        type: "ResuscitationStatus",
        default: '"unknown"',
        description: "Resuscitation status. Defaults to unknown, never to full code.",
      },
      {
        name: "verifiedAt / verifiedBy",
        type: "string",
        description: "When and by whom the status was last confirmed.",
      },
      {
        name: "staleAfterDays",
        type: "number",
        default: "30",
        description: "Policy window after which verification is flagged as stale.",
      },
      {
        name: "documents",
        type: "Array",
        description: "Directive documents, linked rather than merely referenced.",
      },
      {
        name: "proxy / proxyPhone",
        type: "RelatedPerson | string",
        description: "Healthcare proxy and a tel: contact route.",
      },
      {
        name: "conflicting",
        type: "boolean",
        default: "false",
        description: "More than one directive on file that do not agree.",
      },
    ],
    usage: `import { CodeStatus } from "@/components/oxygen/code-status";

<CodeStatus
  status="dnr-dni"
  verifiedAt="2026-07-12T09:00:00Z"
  verifiedBy="A. Bensouda, MD"
  timeZone="America/New_York"
  proxy={proxy}
  proxyPhone="+15551234567"
/>`,
    guidance: {
      use: [
        "High in the reading order of any summary, admission, or emergency surface.",
        "With verifiedAt always supplied \\u2014 an unverified directive is a different claim.",
        "With conflicting set when more than one directive exists and they disagree.",
      ],
      avoid: [
        "Defaulting status to full-code when nothing is found. That is a clinical decision.",
        "Hiding it behind a tab or a disclosure.",
        "Resolving conflicting directives programmatically.",
      ],
    },
    accessibility: [
      {
        label: "First in reading order",
        detail: "A labelled section placed early, so it is reached before the content it governs.",
      },
      {
        label: "Never colour alone",
        detail:
          "Status is a full phrase; the DNR states are spelled out rather than abbreviated to a badge.",
      },
      {
        label: "Reachable proxy",
        detail: "The proxy phone is a tel: link, usable one-handed during an arrest.",
      },
    ],
    limitations: [
      "Does not resolve conflicts or rank directives \\u2014 it surfaces them.",
      "Does not verify document validity across organisations.",
      "Status vocabulary is a fixed set; jurisdictional variants need mapping upstream.",
    ],
    related: ["patient-banner", "precautions-bar", "patient-snapshot"],
  },
  {
    name: "precautions-bar",
    title: "Precautions Bar",
    resource: "Flag",
    resourceUrl: "https://hl7.org/fhir/R4/flag.html",
    status: "shipping",
    summary: "What staff must do before entering the room, ordered by required action.",
    description:
      "This is read on the way through a door, so it is ordered by the action required rather than alphabetically, and required PPE is named rather than implied by a category \u2014 \u201ccontact precautions\u201d is a label, \u201cgown and gloves\u201d is an instruction. Lapsed precautions are dropped rather than greyed, because a stale precaution on screen is how staff learn to ignore all of them. Behavioral flags describe the approach, not the person: \u201ctwo staff for personal care\u201d is actionable and carries no judgement.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Airborne",
      "Contact isolation",
      "Behavioral approach",
      "Fall risk",
      "Mobility",
      "No active precautions",
      "Lapsed and dropped",
    ],
    props: [
      {
        name: "flags",
        type: "Flag[]",
        description: "FHIR Flags. Only those active at asOf are rendered.",
      },
      {
        name: "precautions",
        type: "PrecautionDisplay[]",
        description: "Explicit precautions for callers not modelling these as Flags.",
      },
      {
        name: "actionFor",
        type: "(flag) => string | undefined",
        description: "Maps a Flag to its required action. Without one, the label renders alone.",
      },
      {
        name: "asOf",
        type: "Date",
        default: "new Date()",
        description: "Evaluation date. Pass a fixed date for deterministic tests.",
      },
    ],
    usage: `import { PrecautionsBar } from "@/components/oxygen/precautions-bar";

<PrecautionsBar
  flags={flags}
  actionFor={(flag) => PPE_BY_CODE[flag.code?.coding?.[0]?.code ?? ""]}
/>`,
    guidance: {
      use: [
        "At the top of any chart, room display, or transport handover.",
        "With actionFor supplying the specific PPE or approach required.",
        "On ward and corridor displays, where it is read at distance.",
      ],
      avoid: [
        "Rendering lapsed precautions greyed out rather than removing them.",
        "Behavioral labels that characterise a person rather than an approach.",
        "Relying on the icon alone \\u2014 these are read on poor displays at distance.",
      ],
    },
    accessibility: [
      {
        label: "Icon, text, and colour",
        detail: "All three, always. These are read at distance and often in monochrome.",
      },
      {
        label: "Ordered by action",
        detail:
          "Reading order follows urgency of required action, not the source order of the flags.",
      },
      {
        label: "Empty is stated",
        detail: "No active precautions renders as a sentence rather than an empty bar.",
      },
    ],
    limitations: [
      "PPE mapping is caller-supplied; there is no built-in infection-control catalogue.",
      "Category mapping covers common codes and falls back to a neutral kind.",
      "Does not model precaution ordering rules beyond urgency of action.",
    ],
    related: ["patient-banner", "code-status", "alert-banner"],
  },
  {
    name: "care-team",
    title: "Care Team Panel",
    resource: "CareTeam",
    resourceUrl: "https://hl7.org/fhir/R4/careteam.html",
    status: "shipping",
    summary: "Everyone involved, and who is actually reachable now.",
    description:
      "The gap this closes is that the person on the record is frequently not the person to contact. A panel listing the assigned consultant at 2am with no indication they are off call is worse than no panel \u2014 it produces a confident call to a phone nobody is holding. So coverage sits beside the assignment rather than replacing it. Past members are kept as history, and caregivers, peer supports, and community health workers render with the same weight as clinicians, because in behavioral health and complex care they frequently are the team.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "Current team",
      "Covered member",
      "Past members",
      "Non-clinical members",
      "No team recorded",
      "Role not recorded",
    ],
    props: [
      { name: "team", type: "CareTeam", description: "FHIR CareTeam resource." },
      {
        name: "extraMembers",
        type: "CareTeamMember[]",
        description: "Members not in the resource, e.g. community supports.",
      },
      {
        name: "coverage",
        type: "Record<string, CoverageInfo>",
        description: "Who is actually reachable for a member right now.",
      },
      {
        name: "contacts",
        type: "Record<string, {...}>",
        description: "Contact routes by member reference or name.",
      },
      {
        name: "responsibleRef",
        type: "string",
        description: "Responsible clinician, pinned first.",
      },
      {
        name: "showPast",
        type: "boolean",
        default: "true",
        description: "Keep ended memberships available as history.",
      },
    ],
    usage: `import { CareTeamPanel } from "@/components/oxygen/care-team";

<CareTeamPanel
  team={careTeam}
  responsibleRef="Practitioner/bensouda"
  coverage={{ "Practitioner/bensouda": { coveringName: "P. Ramanathan", until: "07:00" } }}
  contacts={{ "Practitioner/bensouda": { phone: "+15551234567" } }}
/>`,
    guidance: {
      use: [
        "On any chart where someone might need to contact the team.",
        "With coverage supplied from the on-call schedule, not the assignment record.",
        "With community and caregiver members passed through extraMembers.",
      ],
      avoid: [
        "Replacing the assigned clinician with the covering one. Both facts are needed.",
        "Deleting past members \\u2014 reviews ask who was involved and when.",
        "Demoting non-clinical members to a footnote.",
      ],
    },
    accessibility: [
      {
        label: "Named actions",
        detail: "Contact buttons say the action and the person, not just an icon.",
      },
      {
        label: "Avatars decorative",
        detail: "Initials are hidden from assistive technology; the name carries meaning.",
      },
      {
        label: "Coverage is text",
        detail: "Off-call status is a sentence, not a colour or a dimmed row.",
      },
    ],
    limitations: [
      "Coverage is caller-supplied \\u2014 there is no on-call schedule resolution here.",
      "Participants without a display name are skipped rather than shown as unknown.",
      "Does not model team hierarchy; order is source order with the responsible clinician pinned.",
    ],
    related: ["identity-token", "patient-snapshot", "app-shell"],
  },
  {
    name: "alert-banner",
    title: "Alert Banner",
    resource: "DetectedIssue",
    resourceUrl: "https://hl7.org/fhir/R4/detectedissue.html",
    status: "shipping",
    summary: "Severity tiers as an interruption budget. Only critical may take focus.",
    description:
      "Interruption is a scarce resource and every alert spends it. The failure mode of clinical alerting is not missing alerts, it is too many \u2014 fire enough and clinicians dismiss everything, including the one that mattered. So the tiers here are a budget rather than a palette. The specific finding is stated rather than the category, because \u201cPotassium 6.8 \u2014 critical high\u201d earns its interruption and \u201cAbnormal result\u201d does not. Dismissing a critical alert captures a reason, because an alert everyone silently clears should be retired and you cannot know that without the reasons.",
    categories: ["Primitive", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: ["Critical", "High", "Moderate", "Low", "Info", "Dismissal with reason"],
    props: [
      {
        name: "severity",
        type: "AlertSeverity",
        default: '"info"',
        description: "Interruption tier. Only critical takes focus.",
      },
      {
        name: "finding",
        type: "string",
        description: "The specific finding. Never a category like \u201cAbnormal result\u201d.",
      },
      {
        name: "detail",
        type: "string",
        description: "Mechanism or consequence, where it helps a decision.",
      },
      {
        name: "source",
        type: "string",
        description: "Where it came from, so a clinician can judge it.",
      },
      {
        name: "actions",
        type: "ReactNode",
        description: "Inline actions, so responding does not require navigating away.",
      },
      {
        name: "dismissReasons",
        type: "string[]",
        description: "Reasons offered when dismissing a critical alert.",
      },
      {
        name: "onDismiss",
        type: "(dismissal) => void",
        description: "Emitted with the reason, for alert-performance measurement.",
      },
    ],
    usage: `import { AlertBanner } from "@/components/oxygen/alert-banner";

<AlertBanner
  severity="critical"
  finding="Potassium 6.8 mmol/L — critical high"
  detail="Repeat sample and review cardiac monitoring."
  source="Chemistry · resulted 06:42"
  dismissReasons={["Already actioned", "Known for this patient", "Not clinically relevant"]}
  onDismiss={(d) => alertMetrics.record(d)}
/>`,
    guidance: {
      use: [
        "Anywhere a clinical finding must be seen before the user proceeds.",
        "With the specific value and interpretation in finding.",
        "With dismissReasons on critical alerts, so rule performance is measurable.",
      ],
      avoid: [
        "Declaring everything critical. The tier is a budget and it is finite.",
        "Category text like \\u201cAbnormal result\\u201d \\u2014 it teaches dismissal without reading.",
        "Dismissal with no reason on a critical alert; that is how bad rules survive.",
      ],
    },
    accessibility: [
      {
        label: "Tiered live regions",
        detail:
          "Only critical is assertive. Everything else is polite and waits its turn in the reading order.",
      },
      {
        label: "Severity as a word",
        detail: "The tier is in the accessible name, so it survives greyscale and forced-colors.",
      },
      {
        label: "Named dismiss",
        detail: "The dismiss control names the alert it closes rather than being a bare X.",
      },
    ],
    limitations: [
      "Does not deduplicate or rank multiple simultaneous alerts \\u2014 compose a stack.",
      "Suppression across encounters is application state, not component state.",
      "Emits dismissal reasons; storing and analysing them is yours.",
    ],
    related: ["status-badge", "action-gate", "empty-state"],
  },
  {
    name: "patient-snapshot",
    title: "Patient Snapshot",
    resource: "Composition",
    resourceUrl: "https://hl7.org/fhir/R4/composition.html",
    status: "shipping",
    summary:
      "One-screen pre-encounter summary where every section carries its own recency and failure.",
    description:
      "The single most requested and most misdesigned surface in clinical software. The design problem is not what to show but what to leave out, and the answer differs by specialty, setting, and patient. Six source systems back this screen and partial failure is normal, so a section that did not load says so rather than rendering empty. Truncation is counted rather than silent \u2014 showing three of eleven problems and stopping is a summary that reads as a complete list. Changes since the reader last looked lead, because covering clinicians need the delta rather than the chart.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
    states: [
      "All sections loaded",
      "Section failed",
      "Section stale",
      "Section empty",
      "Truncated with a count",
      "Changes since last review",
    ],
    props: [
      {
        name: "sections",
        type: "SnapshotSection[]",
        description: "Each with its own state, counts, recency, and empty copy.",
      },
      {
        name: "timeZone",
        type: "string",
        description: "IANA zone for every timestamp on the summary.",
      },
      {
        name: "lastReviewedAt",
        type: "string",
        description: "When this reader last reviewed the chart, for the change summary.",
      },
      {
        name: "columns",
        type: "1 | 2",
        default: "2",
        description: "Two columns on desktop, or a single prioritised stack.",
      },
    ],
    usage: `import { PatientSnapshot } from "@/components/oxygen/patient-snapshot";

<PatientSnapshot
  timeZone="America/New_York"
  lastReviewedAt={lastReviewed}
  sections={[
    {
      id: "problems",
      title: "Problems",
      state: "loaded",
      totalCount: 11,
      shownCount: 3,
      emptyTitle: "No problems recorded",
      content: <ConditionList conditions={top3} />,
    },
  ]}
/>`,
    guidance: {
      use: [
        "Pre-visit and handover surfaces, where the reader has minutes rather than an hour.",
        "With one section per source system, so one slow service does not block the rest.",
        "With totalCount and shownCount whenever the section is truncated.",
      ],
      avoid: [
        "Rendering a failed section as empty. That is the harm this exists to prevent.",
        "Truncating without a count.",
        "Making it exhaustive. A summary that shows everything is not a summary.",
      ],
    },
    accessibility: [
      {
        label: "Sections as regions",
        detail:
          "Each section is a labelled article, so a screen-reader user navigates section by section.",
      },
      {
        label: "Failure summarised first",
        detail:
          "Failed sections are announced at the top, before the reader forms a picture from the sections above them.",
      },
      {
        label: "Change counts in the name",
        detail: "New-since-review counts are part of the heading, not a decorative badge.",
      },
    ],
    limitations: [
      "Does not decide what belongs in a summary \\u2014 sections and priority are yours.",
      "Specialty configuration is caller-supplied.",
      "Change detection compares counts you supply; it does not diff resources.",
    ],
    related: ["patient-banner", "code-status", "care-team", "clinical-skeleton"],
  },
];

export function getComponent(name: string): ComponentDoc | undefined {
  return CATALOG.find((component) => component.name === name);
}

export const ALL_CATEGORIES = [...new Set(CATALOG.flatMap((c) => c.categories))].sort();

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
    summary:
      "Persistent identity header for a clinical screen, driven by a FHIR Patient resource.",
    description:
      "Renders who the chart belongs to and keeps it reachable at any point on the screen. Wrong-patient error is one of the highest-consequence failures in clinical software, so this component never invents a name, never renders absence as blankness, and announces deceased and restricted status to assistive technology rather than conveying it through styling alone.",
    categories: ["Patient identity", "Clinical"],
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
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
      { name: "identifierLabel", type: "string", default: '"MRN"', description: "Label shown before the identifier." },
      {
        name: "maskIdentifiers",
        type: "boolean",
        default: "false",
        description: "Mask all but the last four characters. Use on shared or public-facing screens.",
      },
      {
        name: "restricted",
        type: "boolean",
        description:
          "Force the restricted presentation. When omitted, derived from meta.security confidentiality labels.",
      },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
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
      { label: "Landmark", detail: "Renders as a labelled region so the patient context is reachable from anywhere on the page." },
      { label: "Status flags", detail: "Deceased and restricted are text and icon, not color. Both are inside the region's accessible name." },
      { label: "Masked identifiers", detail: "Screen readers receive the last four characters and an explicit statement that the value is masked." },
      { label: "Loading", detail: "Skeleton carries aria-busy and an accessible label so the wait is announced." },
      { label: "Heading level", detail: "The patient name renders at a configurable heading level so a nested banner does not corrupt the page outline." },
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
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
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
      { name: "label", type: "string", default: '"Observations"', description: "Accessible name for the results table." },
      {
        name: "hideReferenceRange",
        type: "boolean",
        default: "false",
        description: "Hide the reference-range column. Useful in narrow or patient-facing layouts.",
      },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
      { name: "loadingRows", type: "number", default: "4", description: "Number of skeleton rows while loading." },
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
      { label: "Table semantics", detail: "Real table markup with scoped column headers and an accessible caption." },
      { label: "Critical announcement", detail: "A live region states the critical count before the table is read, so severity is known up front rather than discovered on row seven." },
      { label: "Never color alone", detail: "Every interpretation carries an icon and a text label. Critical rows add an inset rule — a second structural cue that survives grayscale and forced colors." },
      { label: "Row activation", detail: "When onSelect is provided, rows are focusable and respond to Enter and Space with a visible focus ring." },
      { label: "Multi-part results", detail: "Blood pressure and other component-carried readings render each part as its own row, separately valued and separately flagged. The parent escalates to its worst component so a raised systolic is never hidden behind a silent panel." },
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
    summary: "Dose, route, schedule, and status. Held, stopped, and expired are distinct — not one greyed-out style.",
    description:
      "Renders a medication order with its dosage instruction and status. The design problem is status: most implementations collapse on-hold, stopped, completed, and expired into a single muted treatment, which loses the difference between a drug a clinician deliberately paused and one that simply ran out of refills. Those lead to opposite next actions, so each gets its own label and tone. Expired is derived rather than stored — FHIR has no expired status, so an order still marked active past its dispense validity period is surfaced as expired instead of presented as current.",
    categories: ["Medication", "Clinical"],
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
    states: ["Active", "On hold", "Stopped", "Cancelled", "Completed", "Expired", "Draft", "Entered in error", "No dosage recorded"],
    props: [
      { name: "request", type: "MedicationRequest | undefined", description: "FHIR R4 MedicationRequest." },
      { name: "asOf", type: "Date", default: "new Date()", description: "Date used to evaluate expiry. Pass a fixed date to keep tests deterministic." },
      { name: "showProvenance", type: "boolean", default: "true", description: "Show the prescriber and authored date." },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
      { name: "onSelect", type: "(request: MedicationRequest) => void", description: "Called when the card is activated. Omit to render non-interactive." },
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
      { label: "No strike-through", detail: "Discontinued medications are never struck through — struck text is unreadable at small sizes and is not exposed as meaning by screen readers. The status badge carries the state." },
      { label: "Status labels", detail: "Every status has a text label, not just a tone. On hold, stopped, and expired are distinguishable in grayscale." },
      { label: "Activation", detail: "When onSelect is provided the card is focusable and responds to Enter and Space." },
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
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
    states: ["High risk", "Severe / moderate / mild reaction", "Risk not assessed", "Unconfirmed", "Refuted", "Inactive", "No known allergies", "Not recorded"],
    props: [
      { name: "allergies", type: "AllergyIntolerance[] | undefined", description: "FHIR R4 AllergyIntolerance resources." },
      { name: "noKnownAllergies", type: "boolean", description: "Pass true only when a no-known-allergies assertion is actually recorded. Leaving it undefined with an empty list renders “not recorded”, which is the safe reading." },
      { name: "hideInactive", type: "boolean", default: "false", description: "Hide entries whose clinical status is inactive or resolved." },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
      { name: "label", type: "string", default: '"Allergies and intolerances"', description: "Accessible name for the region." },
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
      { label: "High-risk announcement", detail: "A live region states the high-risk count before the list is read." },
      { label: "Distinct empty states", detail: "No-known-allergies and not-recorded differ in icon, wording, and tone — not color alone." },
      { label: "Verification never dropped", detail: "Unconfirmed and refuted entries carry an explicit badge so they cannot be mistaken for confirmed allergies." },
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
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
    states: ["Booked", "Pending", "Arrived", "Checked in", "Completed", "Cancelled", "No-show", "Waitlisted", "Virtual", "In person"],
    props: [
      { name: "appointment", type: "Appointment | undefined", description: "FHIR R4 Appointment resource." },
      { name: "timeZone", type: "string", description: "IANA time zone the appointment should be read in, e.g. \"Asia/Kolkata\". Required." },
      { name: "locale", type: "string", description: "BCP 47 locale for date and time formatting." },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
      { name: "onSelect", type: "(appointment: Appointment) => void", description: "Called when the card is activated." },
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
      { label: "Zone always visible", detail: "The time-zone label renders next to the time. A time without one is an assumption the reader cannot check." },
      { label: "Modality is text", detail: "Virtual and in-person are labelled, not signalled by icon alone." },
      { label: "Invalid zones degrade", detail: "An unrecognised IANA zone falls back to locale formatting rather than throwing and blanking the screen." },
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
    summary: "Problem list that separates active from resolved and never promotes a provisional diagnosis.",
    description:
      "Renders a problem list from Condition resources. A problem list is not a log — its value comes from the reader telling at a glance which problems are current, so resolved and inactive entries are grouped separately rather than merely sorted below. Onset renders exactly as recorded: FHIR permits onsetString (“in childhood”) alongside onsetDateTime, and coercing a vague onset into a false precise date is a common and quietly damaging bug.",
    categories: ["Clinical data", "Clinical"],
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
    states: ["Active", "Recurrence", "Remission", "Resolved", "Inactive", "Provisional", "Differential", "Vague onset", "Onset not recorded"],
    props: [
      { name: "conditions", type: "Condition[] | undefined", description: "FHIR R4 Condition resources." },
      { name: "separateInactive", type: "boolean", default: "true", description: "Render resolved and inactive problems in a separate collapsed group." },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
      { name: "label", type: "string", default: '"Problem list"', description: "Accessible name for the region." },
      { name: "emptyMessage", type: "string", default: '"No problems recorded."', description: "Shown when the list is empty." },
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
      { label: "Native disclosure", detail: "The inactive group uses details/summary, so it is keyboard operable and announced without custom ARIA." },
      { label: "Provisional is labelled", detail: "Provisional and differential diagnoses carry an explicit badge rather than a subtle style difference." },
      { label: "Onset honesty", detail: "A vague onset renders as its recorded text; a missing one renders as explicitly not recorded." },
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
    summary: "Effective state derived from status and period together — an active record past its end date reads as lapsed.",
    description:
      "Renders insurance coverage with payer, plan, member and group identifiers, and the active period. A status of active is not sufficient to say a coverage is usable: a record can carry an active status while its period has already ended, and acting on lapsed coverage produces a denied claim and a surprise bill for the patient. The effective state is therefore derived from status and period together.",
    categories: ["Billing and coverage"],
    dependencies: ["@oxygenui/fhir", "lucide-react", "clsx", "tailwind-merge"],
    states: ["Active", "Lapsed", "Not yet effective", "Cancelled", "Status unknown", "Masked identifiers"],
    props: [
      { name: "coverage", type: "Coverage | undefined", description: "FHIR R4 Coverage resource." },
      { name: "asOf", type: "Date", default: "new Date()", description: "Date used to evaluate the coverage period. Pass a fixed date for deterministic tests." },
      { name: "maskIdentifiers", type: "boolean", default: "false", description: "Mask all but the last four characters of member and group identifiers." },
      { name: "loading", type: "boolean", default: "false", description: "Renders the skeleton state." },
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
        "Trusting status alone in your own code — use coverageState from @oxygenui/fhir.",
      ],
    },
    accessibility: [
      { label: "Lapsed is explicit", detail: "A lapsed coverage adds a written instruction to verify eligibility, not just a red border." },
      { label: "Masked identifiers", detail: "Screen readers receive the last four characters and a statement that the value is masked." },
      { label: "Absent fields", detail: "Every unpopulated field renders as explicitly not recorded rather than as an empty cell." },
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
    summary: "The shared severity chip. Critical reads identically on a lab result, a medication, and an allergy.",
    description:
      "The status chip every other Oxygen component uses, so that severity is consistent across the whole system. Two rules are enforced by the API itself: children is required, because an icon alone is not a label but a rebus; and tone maps to a semantic token rather than a raw color, so a caller passes “critical”, never “red”, and the token decides what that means in light, dark, and forced-colors modes.",
    categories: ["Primitive"],
    dependencies: ["lucide-react", "clsx", "tailwind-merge"],
    states: ["Critical", "High", "Low", "Normal", "Unknown", "Neutral"],
    props: [
      { name: "tone", type: '"critical" | "high" | "low" | "normal" | "unknown" | "neutral"', default: '"neutral"', description: "Semantic tone. Maps to a status token, never to a raw color." },
      { name: "icon", type: "ComponentType | null", description: "Replace the tone's default icon. Pass null only when an adjacent icon already carries the meaning." },
      { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Chip size." },
      { name: "children", type: "ReactNode", description: "The label. Required — a badge without text is not accessible." },
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
      { label: "Label required", detail: "The API has no icon-only variant, so a badge can never ship without an accessible label." },
      { label: "Token-driven", detail: "Tones resolve through status tokens, keeping contrast correct in light, dark, and forced-colors modes." },
    ],
    limitations: [
      "Not interactive — no button, link, or dismiss behavior.",
      "Six tones only. Additional semantics belong in a token, not a one-off color.",
    ],
    related: ["vitals-panel", "medication-card"],
  },
];

export function getComponent(name: string): ComponentDoc | undefined {
  return CATALOG.find((component) => component.name === name);
}

export const ALL_CATEGORIES = [...new Set(CATALOG.flatMap((c) => c.categories))].sort();

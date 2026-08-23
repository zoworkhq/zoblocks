/**
 * Narrow, structural subset of FHIR R4 types.
 *
 * Why a subset rather than a dependency on `@types/fhir`:
 * Oxygen components are copied into customer codebases. Every type they touch
 * becomes a dependency the customer inherits. These declarations are
 * structurally compatible with FHIR R4 — a real `fhir.Patient` satisfies
 * `Patient` here — but carry zero runtime cost and no transitive deps.
 *
 * Everything is optional, because real-world FHIR payloads are sparse.
 * Components are responsible for rendering absence, not assuming presence.
 *
 * Spec: https://hl7.org/fhir/R4/
 */

// ---------------------------------------------------------------------------
// Primitives & general-purpose datatypes
// ---------------------------------------------------------------------------

/** https://hl7.org/fhir/R4/datatypes.html#Coding */
export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

/** https://hl7.org/fhir/R4/datatypes.html#Attachment */
export interface Attachment {
  contentType?: string;
  url?: string;
  data?: string;
  title?: string;
  creation?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#CodeableConcept */
export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#Period */
export interface Period {
  start?: string;
  end?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#Identifier */
export interface Identifier {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: CodeableConcept;
  system?: string;
  value?: string;
  period?: Period;
  assigner?: Reference;
}

/** https://hl7.org/fhir/R4/references.html#Reference */
export interface Reference {
  reference?: string;
  type?: string;
  identifier?: Identifier;
  display?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#HumanName */
export interface HumanName {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: Period;
}

/** https://hl7.org/fhir/R4/datatypes.html#Quantity */
export interface Quantity {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#Range */
export interface Range {
  low?: Quantity;
  high?: Quantity;
}

/** https://hl7.org/fhir/R4/datatypes.html#ContactPoint */
export interface ContactPoint {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: number;
}

/** https://hl7.org/fhir/R4/resource.html#Meta */
export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  /** Confidentiality / sensitivity labels. Drives restricted-record UI. */
  security?: Coding[];
  tag?: Coding[];
}

export interface Resource {
  resourceType?: string;
  id?: string;
  meta?: Meta;
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

/** https://hl7.org/fhir/R4/patient.html */
export interface Patient extends Resource {
  resourceType?: "Patient";
  active?: boolean;
  identifier?: Identifier[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  /**
   * Presence of a photo is not consent to display it. Components require the
   * consuming application to assert that separately.
   */
  photo?: Attachment[];
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  managingOrganization?: Reference;
  /**
   * Record linkage. `replaced-by` is the one that changes what a UI may claim:
   * it means this chart is not where care is being recorded, which is a
   * different fact from inactive and must not render as one.
   *
   * https://hl7.org/fhir/R4/patient.html#Patient.link
   */
  link?: PatientLink[];
  /**
   * Extensions carried by the resource. Typed loosely on purpose — the set is
   * open by definition, and the alternative is a union that goes stale every
   * time an implementation guide ships.
   *
   * Oxygen reads four: `individual-pronouns`, `individual-genderIdentity`,
   * `individual-recordedSexOrGender`, and `patient-sexParameterForClinicalUse`.
   */
  extension?: Extension[];
}

/** https://hl7.org/fhir/R4/patient.html#Patient.link */
export interface PatientLink {
  other: Reference;
  type?: "replaced-by" | "replaces" | "refer" | "seealso";
}

/**
 * https://hl7.org/fhir/R4/extensibility.html
 *
 * Only the value types Oxygen actually reads are enumerated. Anything else is
 * reachable through `extension` nesting, which is how the complex extensions
 * in the Gender Harmony guide are shaped anyway.
 */
export interface Extension {
  url: string;
  valueString?: string;
  valueCode?: string;
  valueBoolean?: boolean;
  valueDateTime?: string;
  valueCodeableConcept?: CodeableConcept;
  valueCoding?: Coding;
  valuePeriod?: Period;
  extension?: Extension[];
}

/** https://hl7.org/fhir/R4/observation.html#Observation.referenceRange */
export interface ObservationReferenceRange {
  low?: Quantity;
  high?: Quantity;
  type?: CodeableConcept;
  appliesTo?: CodeableConcept[];
  age?: Range;
  text?: string;
}

/** https://hl7.org/fhir/R4/observation.html#Observation.component */
export interface ObservationComponent {
  code?: CodeableConcept;
  valueQuantity?: Quantity;
  valueString?: string;
  valueBoolean?: boolean;
  valueCodeableConcept?: CodeableConcept;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  referenceRange?: ObservationReferenceRange[];
}

export type ObservationStatus =
  | "registered"
  | "preliminary"
  | "final"
  | "amended"
  | "corrected"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

/** https://hl7.org/fhir/R4/observation.html */
export interface Observation extends Resource {
  resourceType?: "Observation";
  status?: ObservationStatus;
  category?: CodeableConcept[];
  code?: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueString?: string;
  valueBoolean?: boolean;
  valueCodeableConcept?: CodeableConcept;
  dataAbsentReason?: CodeableConcept;
  interpretation?: CodeableConcept[];
  note?: Array<{ text?: string }>;
  referenceRange?: ObservationReferenceRange[];
  component?: ObservationComponent[];
}

/** https://hl7.org/fhir/R4/datatypes.html#Annotation */
export interface Annotation {
  authorString?: string;
  authorReference?: Reference;
  time?: string;
  text?: string;
}

/** https://hl7.org/fhir/R4/datatypes.html#Timing */
export interface Timing {
  event?: string[];
  repeat?: {
    frequency?: number;
    period?: number;
    periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    duration?: number;
    durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    boundsPeriod?: Period;
    when?: string[];
    timeOfDay?: string[];
  };
  code?: CodeableConcept;
}

/** https://hl7.org/fhir/R4/dosage.html */
export interface Dosage {
  sequence?: number;
  text?: string;
  patientInstruction?: string;
  timing?: Timing;
  asNeededBoolean?: boolean;
  asNeededCodeableConcept?: CodeableConcept;
  site?: CodeableConcept;
  route?: CodeableConcept;
  method?: CodeableConcept;
  doseAndRate?: Array<{
    type?: CodeableConcept;
    doseQuantity?: Quantity;
    doseRange?: Range;
    rateQuantity?: Quantity;
  }>;
  maxDosePerPeriod?: { numerator?: Quantity; denominator?: Quantity };
}

export type MedicationRequestStatus =
  | "active"
  | "on-hold"
  | "cancelled"
  | "completed"
  | "entered-in-error"
  | "stopped"
  | "draft"
  | "unknown";

/** https://hl7.org/fhir/R4/medicationrequest.html */
export interface MedicationRequest extends Resource {
  resourceType?: "MedicationRequest";
  status?: MedicationRequestStatus;
  statusReason?: CodeableConcept;
  intent?:
    | "proposal"
    | "plan"
    | "order"
    | "original-order"
    | "reflex-order"
    | "filler-order"
    | "instance-order"
    | "option";
  priority?: "routine" | "urgent" | "asap" | "stat";
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject?: Reference;
  authoredOn?: string;
  requester?: Reference;
  reasonCode?: CodeableConcept[];
  note?: Annotation[];
  dosageInstruction?: Dosage[];
  dispenseRequest?: {
    validityPeriod?: Period;
    numberOfRepeatsAllowed?: number;
    quantity?: Quantity;
    expectedSupplyDuration?: Quantity;
  };
}

/** https://hl7.org/fhir/R4/allergyintolerance.html */
export interface AllergyIntolerance extends Resource {
  resourceType?: "AllergyIntolerance";
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: "allergy" | "intolerance";
  category?: Array<"food" | "medication" | "environment" | "biologic">;
  criticality?: "low" | "high" | "unable-to-assess";
  code?: CodeableConcept;
  patient?: Reference;
  onsetDateTime?: string;
  recordedDate?: string;
  note?: Annotation[];
  reaction?: Array<{
    substance?: CodeableConcept;
    manifestation?: CodeableConcept[];
    description?: string;
    severity?: "mild" | "moderate" | "severe";
    onset?: string;
  }>;
}

export type AppointmentStatus =
  | "proposed"
  | "pending"
  | "booked"
  | "arrived"
  | "fulfilled"
  | "cancelled"
  | "noshow"
  | "entered-in-error"
  | "checked-in"
  | "waitlist";

/** https://hl7.org/fhir/R4/appointment.html */
export interface Appointment extends Resource {
  resourceType?: "Appointment";
  status?: AppointmentStatus;
  cancelationReason?: CodeableConcept;
  serviceCategory?: CodeableConcept[];
  serviceType?: CodeableConcept[];
  appointmentType?: CodeableConcept;
  reasonCode?: CodeableConcept[];
  priority?: number;
  description?: string;
  start?: string;
  end?: string;
  minutesDuration?: number;
  created?: string;
  comment?: string;
  patientInstruction?: string;
  participant?: Array<{
    type?: CodeableConcept[];
    actor?: Reference;
    required?: "required" | "optional" | "information-only";
    status?: "accepted" | "declined" | "tentative" | "needs-action";
  }>;
}

/** https://hl7.org/fhir/R4/coverage.html */
export interface Coverage extends Resource {
  resourceType?: "Coverage";
  status?: "active" | "cancelled" | "draft" | "entered-in-error";
  type?: CodeableConcept;
  subscriber?: Reference;
  subscriberId?: string;
  beneficiary?: Reference;
  dependent?: string;
  relationship?: CodeableConcept;
  period?: Period;
  payor?: Reference[];
  class?: Array<{ type?: CodeableConcept; value?: string; name?: string }>;
  order?: number;
  network?: string;
}

/** https://hl7.org/fhir/R4/condition.html */
export interface Condition extends Resource {
  resourceType?: "Condition";
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject?: Reference;
  onsetDateTime?: string;
  onsetString?: string;
  abatementDateTime?: string;
  recordedDate?: string;
  note?: Annotation[];
}

/** https://hl7.org/fhir/R4/bundle.html — minimal search/collection shape. */
export interface Bundle<T extends Resource = Resource> {
  resourceType?: "Bundle";
  type?: string;
  total?: number;
  entry?: Array<{ fullUrl?: string; resource?: T }>;
}

/** https://hl7.org/fhir/R4/provenance.html */
export interface Provenance extends Resource {
  resourceType?: "Provenance";
  target?: Reference[];
  occurredDateTime?: string;
  /** When the record was written, which is not when the event happened. */
  recorded?: string;
  reason?: CodeableConcept[];
  activity?: CodeableConcept;
  agent?: Array<{
    type?: CodeableConcept;
    who?: Reference;
    onBehalfOf?: Reference;
  }>;
  entity?: Array<{
    role?: "derivation" | "revision" | "quotation" | "source" | "removal";
    what?: Reference;
  }>;
  /**
   * The signature itself.
   *
   * There is nowhere else for it to go: neither `Consent` nor
   * `DocumentReference` carries a signature element in R4 or R5, so a record
   * with an agreement and no Provenance.signature is an agreement with no
   * proof that anybody made it.
   */
  signature?: Signature[];
}

/**
 * https://hl7.org/fhir/R4/datatypes.html#Signature
 *
 * `data` is `base64Binary` — bare base64, not a data URL. A value beginning
 * `data:image/png;base64,` passes every validator that only checks the field
 * is a string, and produces garbage in every consumer that decodes it.
 */
export interface Signature {
  /** ISO/ASTM E1762-95 purpose codes. Required: an unlabelled signature means nothing. */
  type: Coding[];
  when?: string;
  who?: Reference;
  onBehalfOf?: Reference;
  /** MIME type of the content that was signed. */
  targetFormat?: string;
  /** MIME type of `data` — "image/png" for a drawn signature. */
  sigFormat?: string;
  data?: string;
}

/** https://hl7.org/fhir/R4/flag.html */
export interface Flag extends Resource {
  resourceType?: "Flag";
  status?: "active" | "inactive" | "entered-in-error";
  category?: CodeableConcept[];
  code?: CodeableConcept;
  subject?: Reference;
  period?: Period;
  author?: Reference;
}

/** https://hl7.org/fhir/R4/practitioner.html */
export interface Practitioner extends Resource {
  resourceType?: "Practitioner";
  active?: boolean;
  identifier?: Identifier[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  photo?: Attachment[];
  qualification?: Array<{ code?: CodeableConcept; period?: Period }>;
}

/** https://hl7.org/fhir/R4/practitionerrole.html */
export interface PractitionerRole extends Resource {
  resourceType?: "PractitionerRole";
  active?: boolean;
  period?: Period;
  practitioner?: Reference;
  organization?: Reference;
  code?: CodeableConcept[];
  specialty?: CodeableConcept[];
  telecom?: ContactPoint[];
  availabilityExceptions?: string;
}

/** https://hl7.org/fhir/R4/relatedperson.html */
export interface RelatedPerson extends Resource {
  resourceType?: "RelatedPerson";
  active?: boolean;
  patient?: Reference;
  relationship?: CodeableConcept[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  period?: Period;
}

/** https://hl7.org/fhir/R4/careteam.html */
export interface CareTeam extends Resource {
  resourceType?: "CareTeam";
  status?: "proposed" | "active" | "suspended" | "inactive" | "entered-in-error";
  name?: string;
  subject?: Reference;
  period?: Period;
  participant?: Array<{
    role?: CodeableConcept[];
    member?: Reference;
    onBehalfOf?: Reference;
    period?: Period;
  }>;
  telecom?: ContactPoint[];
}

/** https://hl7.org/fhir/R4/detectedissue.html */
export interface DetectedIssue extends Resource {
  resourceType?: "DetectedIssue";
  status?: "registered" | "preliminary" | "final" | "amended" | "entered-in-error";
  code?: CodeableConcept;
  severity?: "high" | "moderate" | "low";
  patient?: Reference;
  identifiedDateTime?: string;
  detail?: string;
  reference?: string;
  mitigation?: Array<{ action?: CodeableConcept; date?: string; author?: Reference }>;
}

/** https://hl7.org/fhir/R4/consent.html */
export interface Consent extends Resource {
  resourceType?: "Consent";
  status?: "draft" | "proposed" | "active" | "rejected" | "inactive" | "entered-in-error";
  scope?: CodeableConcept;
  category?: CodeableConcept[];
  patient?: Reference;
  dateTime?: string;
  performer?: Reference[];
  sourceAttachment?: Attachment;
  sourceReference?: Reference;
  policyRule?: CodeableConcept;
  provision?: {
    type?: "deny" | "permit";
    period?: Period;
    actor?: Array<{ role?: CodeableConcept; reference?: Reference }>;
    purpose?: Coding[];
  };
}

/** https://hl7.org/fhir/R4/documentreference.html */
export interface DocumentReference extends Resource {
  resourceType?: "DocumentReference";
  status?: "current" | "superseded" | "entered-in-error";
  docStatus?: "preliminary" | "final" | "amended" | "entered-in-error";
  type?: CodeableConcept;
  category?: CodeableConcept[];
  subject?: Reference;
  date?: string;
  author?: Reference[];
  description?: string;
  content?: Array<{ attachment?: Attachment }>;
}

/** https://hl7.org/fhir/R4/encounter.html */
export interface Encounter extends Resource {
  resourceType?: "Encounter";
  /**
   * `entered-in-error` is why this union is written out rather than typed as
   * a string. A record created by mistake is retained and marked, never
   * deleted, so a renderer that cannot name the state will filter it instead.
   */
  status?:
    | "planned"
    | "arrived"
    | "triaged"
    | "in-progress"
    | "onleave"
    | "finished"
    | "cancelled"
    | "entered-in-error"
    | "unknown";
  class?: Coding;
  type?: CodeableConcept[];
  subject?: Reference;
  participant?: Array<{ type?: CodeableConcept[]; individual?: Reference; period?: Period }>;
  /** Encounter records what actually happened; Appointment records what was planned. */
  period?: Period;
  reasonCode?: CodeableConcept[];
  serviceProvider?: Reference;
  appointment?: Reference[];
}

/** https://hl7.org/fhir/R4/communication.html */
export interface Communication extends Resource {
  resourceType?: "Communication";
  /** `not-done` is an attempt that did not connect, which is not a contact. */
  status?:
    | "preparation"
    | "in-progress"
    | "not-done"
    | "on-hold"
    | "stopped"
    | "completed"
    | "entered-in-error"
    | "unknown";
  statusReason?: CodeableConcept;
  category?: CodeableConcept[];
  medium?: CodeableConcept[];
  subject?: Reference;
  topic?: CodeableConcept;
  sent?: string;
  received?: string;
  recipient?: Reference[];
  sender?: Reference;
  payload?: Array<{ contentString?: string; contentAttachment?: Attachment }>;
}

/** https://hl7.org/fhir/R4/diagnosticreport.html */
export interface DiagnosticReport extends Resource {
  resourceType?: "DiagnosticReport";
  status?:
    | "registered"
    | "partial"
    | "preliminary"
    | "final"
    | "amended"
    | "corrected"
    | "appended"
    | "cancelled"
    | "entered-in-error"
    | "unknown";
  category?: CodeableConcept[];
  code?: CodeableConcept;
  subject?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  conclusion?: string;
  result?: Reference[];
}

/** https://hl7.org/fhir/R4/procedure.html */
export interface Procedure extends Resource {
  resourceType?: "Procedure";
  status?:
    | "preparation"
    | "in-progress"
    | "not-done"
    | "on-hold"
    | "stopped"
    | "completed"
    | "entered-in-error"
    | "unknown";
  statusReason?: CodeableConcept;
  code?: CodeableConcept;
  subject?: Reference;
  performedDateTime?: string;
  performedPeriod?: Period;
  performer?: Array<{ function?: CodeableConcept; actor?: Reference }>;
  reasonCode?: CodeableConcept[];
}

/** https://hl7.org/fhir/R4/immunization.html */
export interface Immunization extends Resource {
  resourceType?: "Immunization";
  /** `not-done` is a real answer here — a dose refused is not a dose missing. */
  status?: "completed" | "entered-in-error" | "not-done";
  statusReason?: CodeableConcept;
  vaccineCode?: CodeableConcept;
  patient?: Reference;
  occurrenceDateTime?: string;
  occurrenceString?: string;
  recorded?: string;
  primarySource?: boolean;
  performer?: Array<{ function?: CodeableConcept; actor?: Reference }>;
}

/** https://hl7.org/fhir/R4/questionnaireresponse.html */
export interface QuestionnaireResponse extends Resource {
  resourceType?: "QuestionnaireResponse";
  /** `in-progress` is the form that was sent and never came back. */
  status?: "in-progress" | "completed" | "amended" | "entered-in-error" | "stopped";
  questionnaire?: string;
  subject?: Reference;
  authored?: string;
  author?: Reference;
  source?: Reference;
}

/** https://hl7.org/fhir/R4/task.html */
export interface Task extends Resource {
  resourceType?: "Task";
  status?:
    | "draft"
    | "requested"
    | "received"
    | "accepted"
    | "rejected"
    | "ready"
    | "cancelled"
    | "in-progress"
    | "on-hold"
    | "failed"
    | "completed"
    | "entered-in-error";
  intent?: string;
  code?: CodeableConcept;
  description?: string;
  for?: Reference;
  authoredOn?: string;
  lastModified?: string;
  requester?: Reference;
  owner?: Reference;
}

/** https://hl7.org/fhir/R4/operationoutcome.html */
export interface OperationOutcome extends Resource {
  resourceType?: "OperationOutcome";
  issue?: Array<{
    severity?: "fatal" | "error" | "warning" | "information";
    code?: string;
    diagnostics?: string;
    details?: CodeableConcept;
  }>;
}

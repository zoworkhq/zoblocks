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
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  managingOrganization?: Reference;
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
  intent?: "proposal" | "plan" | "order" | "original-order" | "reflex-order" | "filler-order" | "instance-order" | "option";
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

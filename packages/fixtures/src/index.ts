/**
 * Synthetic FHIR fixtures.
 *
 * ⚠️  Every value here is invented. No real person, encounter, or result is
 * represented. Names are drawn from an obviously-fictional set; identifiers use
 * the reserved `example.org` systems. PHI must never enter this package, the
 * docs site, screenshots, issues, or analytics.
 *
 * These fixtures deliberately over-represent the hard states — critical values,
 * uninterpreted results, restricted records, missing data — because those are
 * the states real products get wrong and demos usually skip.
 */

import type {
  AllergyIntolerance,
  Appointment,
  Condition,
  Coverage,
  MedicationRequest,
  Observation,
  Patient,
} from "@oxygenui-design/fhir";

export const MRN_SYSTEM = "http://example.org/fhir/sid/mrn";

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

/** Straightforward record: complete demographics, nothing flagged. */
export const patientRoutine: Patient = {
  resourceType: "Patient",
  id: "syn-patient-routine",
  active: true,
  identifier: [{ use: "official", system: MRN_SYSTEM, value: "093-441-208" }],
  name: [{ use: "official", given: ["Amara"], family: "Okonkwo" }],
  gender: "female",
  birthDate: "1984-03-17",
  telecom: [{ system: "phone", value: "555-0142", use: "mobile" }],
};

/** Confidentiality-labelled record. Drives the restricted-display path. */
export const patientRestricted: Patient = {
  resourceType: "Patient",
  id: "syn-patient-restricted",
  active: true,
  meta: {
    security: [
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
        code: "R",
        display: "Restricted",
      },
    ],
  },
  identifier: [{ use: "official", system: MRN_SYSTEM, value: "077-310-994" }],
  name: [{ use: "official", given: ["Devin"], family: "Marchetti" }],
  gender: "other",
  birthDate: "1997-11-02",
};

/** Sparse record — the state most demos skip and most products render badly. */
export const patientSparse: Patient = {
  resourceType: "Patient",
  id: "syn-patient-sparse",
  active: true,
  identifier: [{ system: MRN_SYSTEM, value: "110-288-341" }],
  gender: "unknown",
};

/** Deceased patient. Chart headers must state this unambiguously. */
export const patientDeceased: Patient = {
  resourceType: "Patient",
  id: "syn-patient-deceased",
  active: false,
  identifier: [{ use: "official", system: MRN_SYSTEM, value: "058-901-772" }],
  name: [{ use: "official", given: ["Harold", "J"], family: "Whitfield" }],
  gender: "male",
  birthDate: "1941-06-28",
  deceasedDateTime: "2026-05-14T08:22:00Z",
};

export const patients = {
  routine: patientRoutine,
  restricted: patientRestricted,
  sparse: patientSparse,
  deceased: patientDeceased,
} satisfies Record<string, Patient>;

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------

const INTERPRETATION_SYSTEM = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

const subject = { reference: "Patient/syn-patient-routine" };
const vitalSigns = [
  {
    coding: [
      { system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" },
    ],
  },
];

export const observationHeartRate: Observation = {
  resourceType: "Observation",
  id: "syn-obs-hr",
  status: "final",
  category: vitalSigns,
  code: {
    coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }],
    text: "Heart rate",
  },
  subject,
  effectiveDateTime: "2026-08-03T09:14:00Z",
  valueQuantity: {
    value: 72,
    unit: "beats/min",
    system: "http://unitsofmeasure.org",
    code: "/min",
  },
  referenceRange: [
    { low: { value: 60, unit: "beats/min" }, high: { value: 100, unit: "beats/min" } },
  ],
};

/** Explicitly flagged critical — the interpretation is stated, not inferred. */
export const observationPotassiumCritical: Observation = {
  resourceType: "Observation",
  id: "syn-obs-k",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "2823-3", display: "Potassium [Moles/volume] in Serum" },
    ],
    text: "Potassium",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: {
    value: 6.8,
    unit: "mmol/L",
    system: "http://unitsofmeasure.org",
    code: "mmol/L",
  },
  interpretation: [
    { coding: [{ system: INTERPRETATION_SYSTEM, code: "HH", display: "Critical high" }] },
  ],
  referenceRange: [{ low: { value: 3.5, unit: "mmol/L" }, high: { value: 5.1, unit: "mmol/L" } }],
  note: [{ text: "Called to ordering provider 07:52. Repeat specimen requested." }],
};

/** Low, derived from the reference range rather than stated. */
export const observationHemoglobinLow: Observation = {
  resourceType: "Observation",
  id: "syn-obs-hgb",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "718-7", display: "Hemoglobin [Mass/volume] in Blood" },
    ],
    text: "Hemoglobin",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: { value: 10.2, unit: "g/dL" },
  referenceRange: [{ low: { value: 12.0, unit: "g/dL" }, high: { value: 15.5, unit: "g/dL" } }],
};

/** No reference range and no interpretation → renders as "Not interpreted". */
export const observationUninterpreted: Observation = {
  resourceType: "Observation",
  id: "syn-obs-ferritin",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "2276-4", display: "Ferritin [Mass/volume] in Serum" },
    ],
    text: "Ferritin",
  },
  subject,
  effectiveDateTime: "2026-08-02T15:02:00Z",
  valueQuantity: { value: 43, unit: "ng/mL" },
};

/** Preliminary result — must be visibly distinguished from a final one. */
export const observationPreliminary: Observation = {
  resourceType: "Observation",
  id: "syn-obs-tsh",
  status: "preliminary",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "3016-3",
        display: "Thyrotropin [Units/volume] in Serum",
      },
    ],
    text: "TSH",
  },
  subject,
  effectiveDateTime: "2026-08-03T10:05:00Z",
  valueQuantity: { value: 5.9, unit: "mIU/L" },
  referenceRange: [{ low: { value: 0.4, unit: "mIU/L" }, high: { value: 4.0, unit: "mIU/L" } }],
};

/** No value at all — the component must explain why, not render blank. */
export const observationAbsent: Observation = {
  resourceType: "Observation",
  id: "syn-obs-absent",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "6690-2", display: "Leukocytes [#/volume] in Blood" },
    ],
    text: "White blood cell count",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  dataAbsentReason: { text: "Specimen hemolyzed — recollect" },
};

/**
 * The absent-reason taxonomy, one observation per group that a reader must
 * treat differently. These exist so the difference between "nobody asked",
 * "she declined", "it is hidden from you", and "the analyser errored" is
 * demonstrable rather than asserted.
 *
 * http://terminology.hl7.org/CodeSystem/data-absent-reason
 */
const ABSENT_SYSTEM = "http://terminology.hl7.org/CodeSystem/data-absent-reason";

/** Nobody asked. The workflow never captured it. */
export const observationNotAsked: Observation = {
  resourceType: "Observation",
  id: "syn-obs-not-asked",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "2601-3",
        display: "Magnesium [Moles/volume] in Serum or Plasma",
      },
    ],
    text: "Magnesium",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  dataAbsentReason: {
    coding: [{ system: ABSENT_SYSTEM, code: "not-asked", display: "Not Asked" }],
  },
};

/** Asked, and the patient declined to answer. A clinically meaningful answer. */
export const observationDeclined: Observation = {
  resourceType: "Observation",
  id: "syn-obs-declined",
  status: "final",
  code: {
    coding: [{ system: "http://loinc.org", code: "72166-2", display: "Tobacco smoking status" }],
    text: "Smoking status",
  },
  subject,
  effectiveDateTime: "2026-08-03T09:02:00Z",
  dataAbsentReason: {
    coding: [{ system: ABSENT_SYSTEM, code: "asked-declined", display: "Asked But Declined" }],
  },
};

/**
 * Present, but withheld from this reader. The dangerous one: read as "not
 * recorded", a clinician concludes the chart is empty when it is not.
 */
export const observationMasked: Observation = {
  resourceType: "Observation",
  id: "syn-obs-masked",
  status: "final",
  code: {
    coding: [{ system: "http://loinc.org", code: "3426-4", display: "Toxicology screen" }],
    text: "Toxicology screen",
  },
  subject,
  effectiveDateTime: "2026-08-02T18:20:00Z",
  dataAbsentReason: { coding: [{ system: ABSENT_SYSTEM, code: "masked", display: "Masked" }] },
};

/** Ordered, not yet resulted. May still arrive — do not stop asking. */
export const observationPending: Observation = {
  resourceType: "Observation",
  id: "syn-obs-pending",
  status: "registered",
  code: {
    coding: [{ system: "http://loinc.org", code: "2028-9", display: "Carbon dioxide, total" }],
    text: "Bicarbonate",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  dataAbsentReason: {
    coding: [{ system: ABSENT_SYSTEM, code: "temp-unknown", display: "Temporarily Unknown" }],
  },
};

/** The analyser failed. Something is broken; this value SHOULD be here. */
export const observationErrored: Observation = {
  resourceType: "Observation",
  id: "syn-obs-errored",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "1751-7",
        display: "Albumin [Mass/volume] in Serum or Plasma",
      },
    ],
    text: "Albumin",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  dataAbsentReason: { coding: [{ system: ABSENT_SYSTEM, code: "error", display: "Error" }] },
};

/** Every absent path in one list, for the primitive's own documentation. */
export const observationAbsentSet: Observation[] = [
  observationNotAsked,
  observationDeclined,
  observationPending,
  observationMasked,
  observationErrored,
  observationAbsent,
];

/** Corrected after release. Provenance has to be visible. */
export const observationCorrected: Observation = {
  resourceType: "Observation",
  id: "syn-obs-glucose",
  status: "corrected",
  code: {
    coding: [
      { system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" },
    ],
    text: "Glucose",
  },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: { value: 156, unit: "mg/dL" },
  referenceRange: [{ low: { value: 70, unit: "mg/dL" }, high: { value: 100, unit: "mg/dL" } }],
};

/**
 * Blood pressure — the case a component-blind renderer gets wrong.
 *
 * FHIR models BP as ONE Observation with two components and NO value on the
 * parent. A renderer that only reads valueQuantity shows the most common vital
 * sign in medicine as having no value at all.
 */
export const observationBloodPressure: Observation = {
  resourceType: "Observation",
  id: "syn-obs-bp",
  status: "final",
  category: vitalSigns,
  code: {
    coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood pressure panel" }],
    text: "Blood pressure",
  },
  subject,
  effectiveDateTime: "2026-08-03T09:14:00Z",
  component: [
    {
      code: { coding: [{ system: "http://loinc.org", code: "8480-6" }], text: "Systolic" },
      valueQuantity: { value: 168, unit: "mmHg" },
      interpretation: [{ coding: [{ system: INTERPRETATION_SYSTEM, code: "H", display: "High" }] }],
      referenceRange: [{ low: { value: 90 }, high: { value: 130, unit: "mmHg" } }],
    },
    {
      code: { coding: [{ system: "http://loinc.org", code: "8462-4" }], text: "Diastolic" },
      valueQuantity: { value: 82, unit: "mmHg" },
      referenceRange: [{ low: { value: 60 }, high: { value: 85, unit: "mmHg" } }],
    },
  ],
};

/** A representative panel spanning every interpretation and status path. */
export const observationPanel: Observation[] = [
  observationPotassiumCritical,
  observationBloodPressure,
  observationHemoglobinLow,
  observationCorrected,
  observationHeartRate,
  observationPreliminary,
  observationUninterpreted,
  observationAbsent,
];

// ---------------------------------------------------------------------------
// MedicationRequest
// ---------------------------------------------------------------------------

export const medicationActive: MedicationRequest = {
  resourceType: "MedicationRequest",
  id: "syn-med-lisinopril",
  status: "active",
  intent: "order",
  medicationCodeableConcept: {
    coding: [
      {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "314076",
        display: "Lisinopril 10 MG Oral Tablet",
      },
    ],
    text: "Lisinopril 10 mg",
  },
  subject,
  authoredOn: "2026-05-12",
  requester: { display: "Dr. N. Adeyemi" },
  reasonCode: [{ text: "Hypertension" }],
  dosageInstruction: [
    {
      text: "Take 1 tablet by mouth once daily",
      route: { text: "Oral" },
      timing: { repeat: { frequency: 1, period: 1, periodUnit: "d" } },
      doseAndRate: [{ doseQuantity: { value: 10, unit: "mg" } }],
    },
  ],
  dispenseRequest: {
    numberOfRepeatsAllowed: 3,
    validityPeriod: { start: "2026-05-12", end: "2027-05-12" },
  },
};

/** On hold — paused deliberately. Must not look like "stopped". */
export const medicationOnHold: MedicationRequest = {
  resourceType: "MedicationRequest",
  id: "syn-med-metformin",
  status: "on-hold",
  intent: "order",
  medicationCodeableConcept: { text: "Metformin 500 mg" },
  subject,
  authoredOn: "2026-03-02",
  requester: { display: "Dr. N. Adeyemi" },
  statusReason: { text: "Held pending renal function review" },
  reasonCode: [{ text: "Type 2 diabetes mellitus" }],
  dosageInstruction: [
    {
      route: { text: "Oral" },
      timing: { repeat: { frequency: 2, period: 1, periodUnit: "d" } },
      doseAndRate: [{ doseQuantity: { value: 500, unit: "mg" } }],
    },
  ],
};

/** Stopped, with the reason recorded — the field most implementations drop. */
export const medicationStopped: MedicationRequest = {
  resourceType: "MedicationRequest",
  id: "syn-med-ibuprofen",
  status: "stopped",
  intent: "order",
  medicationCodeableConcept: { text: "Ibuprofen 400 mg" },
  subject,
  authoredOn: "2026-01-18",
  statusReason: { text: "Discontinued — GI intolerance" },
  dosageInstruction: [{ text: "400 mg every 8 hours as needed for pain", asNeededBoolean: true }],
};

/** Still `active` in the payload, but past its validity period → expired. */
export const medicationExpired: MedicationRequest = {
  resourceType: "MedicationRequest",
  id: "syn-med-amoxicillin",
  status: "active",
  intent: "order",
  medicationCodeableConcept: { text: "Amoxicillin 500 mg" },
  subject,
  authoredOn: "2025-11-04",
  dosageInstruction: [{ text: "500 mg three times daily for 7 days" }],
  dispenseRequest: {
    numberOfRepeatsAllowed: 0,
    validityPeriod: { start: "2025-11-04", end: "2025-12-04" },
  },
};

/** No dosage instruction at all — the component must say so, not render blank. */
export const medicationNoDosage: MedicationRequest = {
  resourceType: "MedicationRequest",
  id: "syn-med-sparse",
  status: "active",
  intent: "order",
  medicationCodeableConcept: { text: "Atorvastatin 20 mg" },
  subject,
};

export const medicationList: MedicationRequest[] = [
  medicationActive,
  medicationOnHold,
  medicationNoDosage,
  medicationExpired,
  medicationStopped,
];

// ---------------------------------------------------------------------------
// AllergyIntolerance
// ---------------------------------------------------------------------------

const CLINICAL_STATUS = "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical";
const VERIFICATION_STATUS = "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification";

export const allergyHighRisk: AllergyIntolerance = {
  resourceType: "AllergyIntolerance",
  id: "syn-allergy-penicillin",
  clinicalStatus: { coding: [{ system: CLINICAL_STATUS, code: "active" }] },
  verificationStatus: { coding: [{ system: VERIFICATION_STATUS, code: "confirmed" }] },
  type: "allergy",
  category: ["medication"],
  criticality: "high",
  code: { text: "Penicillin" },
  patient: subject,
  recordedDate: "2019-06-11",
  reaction: [
    { manifestation: [{ text: "Anaphylaxis" }, { text: "Urticaria" }], severity: "severe" },
  ],
};

export const allergyModerate: AllergyIntolerance = {
  resourceType: "AllergyIntolerance",
  id: "syn-allergy-shellfish",
  clinicalStatus: { coding: [{ system: CLINICAL_STATUS, code: "active" }] },
  verificationStatus: { coding: [{ system: VERIFICATION_STATUS, code: "confirmed" }] },
  type: "allergy",
  category: ["food"],
  code: { text: "Shellfish" },
  patient: subject,
  reaction: [{ manifestation: [{ text: "Swelling of lips" }], severity: "moderate" }],
};

/** Unconfirmed — must not read as an established allergy. */
export const allergyUnconfirmed: AllergyIntolerance = {
  resourceType: "AllergyIntolerance",
  id: "syn-allergy-latex",
  clinicalStatus: { coding: [{ system: CLINICAL_STATUS, code: "active" }] },
  verificationStatus: { coding: [{ system: VERIFICATION_STATUS, code: "unconfirmed" }] },
  type: "allergy",
  category: ["environment"],
  code: { text: "Latex" },
  patient: subject,
};

/** Refuted — actively ruled out. De-prescribing depends on this distinction. */
export const allergyRefuted: AllergyIntolerance = {
  resourceType: "AllergyIntolerance",
  id: "syn-allergy-sulfa",
  clinicalStatus: { coding: [{ system: CLINICAL_STATUS, code: "inactive" }] },
  verificationStatus: { coding: [{ system: VERIFICATION_STATUS, code: "refuted" }] },
  type: "allergy",
  category: ["medication"],
  code: { text: "Sulfonamides" },
  patient: subject,
  note: [{ text: "Ruled out after allergy testing, March 2026." }],
};

export const allergyList: AllergyIntolerance[] = [
  allergyHighRisk,
  allergyModerate,
  allergyUnconfirmed,
  allergyRefuted,
];

// ---------------------------------------------------------------------------
// Appointment
// ---------------------------------------------------------------------------

export const appointmentBooked: Appointment = {
  resourceType: "Appointment",
  id: "syn-appt-booked",
  status: "booked",
  serviceType: [{ text: "Cardiology follow-up" }],
  description: "Cardiology follow-up",
  start: "2026-08-14T09:30:00Z",
  end: "2026-08-14T10:00:00Z",
  minutesDuration: 30,
  participant: [
    {
      actor: { reference: "Patient/syn-patient-routine", display: "Amara Okonkwo" },
      status: "accepted",
    },
    {
      actor: { reference: "Practitioner/syn-prac-1", display: "Dr. N. Adeyemi" },
      status: "accepted",
    },
  ],
  patientInstruction: "Bring your home blood-pressure log.",
};

export const appointmentVirtual: Appointment = {
  resourceType: "Appointment",
  id: "syn-appt-virtual",
  status: "pending",
  serviceType: [{ text: "Virtual consultation" }],
  appointmentType: { coding: [{ code: "VIRTUAL", display: "Telehealth video visit" }] },
  description: "Medication review",
  start: "2026-08-09T14:00:00Z",
  minutesDuration: 15,
  participant: [
    {
      actor: { reference: "Practitioner/syn-prac-2", display: "Dr. L. Fernandes" },
      status: "tentative",
    },
  ],
};

/** No-show — operationally distinct from a cancellation. */
export const appointmentNoShow: Appointment = {
  resourceType: "Appointment",
  id: "syn-appt-noshow",
  status: "noshow",
  serviceType: [{ text: "Diabetes education" }],
  description: "Diabetes education",
  start: "2026-07-22T11:00:00Z",
  minutesDuration: 45,
  participant: [{ actor: { reference: "Practitioner/syn-prac-3", display: "S. Raman, RD" } }],
};

export const appointmentCancelled: Appointment = {
  resourceType: "Appointment",
  id: "syn-appt-cancelled",
  status: "cancelled",
  serviceType: [{ text: "Dermatology copilot" }],
  description: "Dermatology copilot",
  start: "2026-07-30T15:15:00Z",
  minutesDuration: 20,
  cancelationReason: { text: "Cancelled by patient — schedule conflict" },
};

export const appointmentList: Appointment[] = [
  appointmentBooked,
  appointmentVirtual,
  appointmentNoShow,
  appointmentCancelled,
];

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

const COVERAGE_CLASS = "http://terminology.hl7.org/CodeSystem/coverage-class";

export const coverageActive: Coverage = {
  resourceType: "Coverage",
  id: "syn-coverage-active",
  status: "active",
  type: { text: "PPO" },
  subscriberId: "882-401-556",
  beneficiary: subject,
  relationship: { text: "self" },
  period: { start: "2026-01-01", end: "2026-12-31" },
  payor: [{ display: "Meridian Health Plan" }],
  class: [
    { type: { coding: [{ system: COVERAGE_CLASS, code: "plan" }] }, value: "Meridian Choice PPO" },
    { type: { coding: [{ system: COVERAGE_CLASS, code: "group" }] }, value: "GRP-40218" },
  ],
  order: 1,
};

/** Status says active; the period has already ended. This is the trap. */
export const coverageLapsed: Coverage = {
  resourceType: "Coverage",
  id: "syn-coverage-lapsed",
  status: "active",
  type: { text: "HMO" },
  subscriberId: "119-702-338",
  beneficiary: subject,
  relationship: { text: "spouse" },
  period: { start: "2025-01-01", end: "2025-12-31" },
  payor: [{ display: "Northgate Mutual" }],
  class: [
    {
      type: { coding: [{ system: COVERAGE_CLASS, code: "plan" }] },
      value: "Northgate Essential HMO",
    },
  ],
  order: 2,
};

export const coverageFuture: Coverage = {
  resourceType: "Coverage",
  id: "syn-coverage-future",
  status: "active",
  type: { text: "PPO" },
  subscriberId: "553-880-127",
  beneficiary: subject,
  relationship: { text: "self" },
  period: { start: "2027-01-01" },
  payor: [{ display: "Meridian Health Plan" }],
};

export const coverageList: Coverage[] = [coverageActive, coverageLapsed, coverageFuture];

// ---------------------------------------------------------------------------
// Condition
// ---------------------------------------------------------------------------

const CONDITION_CLINICAL = "http://terminology.hl7.org/CodeSystem/condition-clinical";
const CONDITION_VERIFICATION = "http://terminology.hl7.org/CodeSystem/condition-ver-status";

export const conditionActive: Condition = {
  resourceType: "Condition",
  id: "syn-cond-htn",
  clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: "active" }] },
  verificationStatus: { coding: [{ system: CONDITION_VERIFICATION, code: "confirmed" }] },
  code: {
    coding: [{ system: "http://snomed.info/sct", code: "38341003" }],
    text: "Essential hypertension",
  },
  severity: { text: "Moderate" },
  subject,
  onsetDateTime: "2021-04-09",
  recordedDate: "2021-04-09",
};

/** Vague onset recorded as a string — must not be coerced to a false date. */
export const conditionVagueOnset: Condition = {
  resourceType: "Condition",
  id: "syn-cond-asthma",
  clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: "active" }] },
  verificationStatus: { coding: [{ system: CONDITION_VERIFICATION, code: "confirmed" }] },
  code: { text: "Asthma" },
  severity: { text: "Mild" },
  subject,
  onsetString: "in childhood",
};

/** Provisional — carrying this forward as settled fact is a real-world harm. */
export const conditionProvisional: Condition = {
  resourceType: "Condition",
  id: "syn-cond-provisional",
  clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: "active" }] },
  verificationStatus: { coding: [{ system: CONDITION_VERIFICATION, code: "provisional" }] },
  code: { text: "Iron deficiency anaemia" },
  subject,
  onsetDateTime: "2026-07-28",
};

export const conditionResolved: Condition = {
  resourceType: "Condition",
  id: "syn-cond-resolved",
  clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: "resolved" }] },
  verificationStatus: { coding: [{ system: CONDITION_VERIFICATION, code: "confirmed" }] },
  code: { text: "Community-acquired pneumonia" },
  severity: { text: "Severe" },
  subject,
  onsetDateTime: "2025-11-02",
  abatementDateTime: "2025-11-26",
};

export const conditionList: Condition[] = [
  conditionActive,
  conditionVagueOnset,
  conditionProvisional,
  conditionResolved,
];

export const medications = {
  active: medicationActive,
  onHold: medicationOnHold,
  stopped: medicationStopped,
  expired: medicationExpired,
  noDosage: medicationNoDosage,
  list: medicationList,
};

export const allergies = {
  highRisk: allergyHighRisk,
  moderate: allergyModerate,
  unconfirmed: allergyUnconfirmed,
  refuted: allergyRefuted,
  list: allergyList,
};

export const appointments = {
  booked: appointmentBooked,
  virtual: appointmentVirtual,
  noShow: appointmentNoShow,
  cancelled: appointmentCancelled,
  list: appointmentList,
};

export const coverages = {
  active: coverageActive,
  lapsed: coverageLapsed,
  future: coverageFuture,
  list: coverageList,
};

export const conditions = {
  active: conditionActive,
  vagueOnset: conditionVagueOnset,
  provisional: conditionProvisional,
  resolved: conditionResolved,
  list: conditionList,
};

export const observations = {
  heartRate: observationHeartRate,
  bloodPressure: observationBloodPressure,
  potassiumCritical: observationPotassiumCritical,
  hemoglobinLow: observationHemoglobinLow,
  uninterpreted: observationUninterpreted,
  preliminary: observationPreliminary,
  absent: observationAbsent,
  notAsked: observationNotAsked,
  declined: observationDeclined,
  masked: observationMasked,
  pending: observationPending,
  errored: observationErrored,
  absentSet: observationAbsentSet,
  corrected: observationCorrected,
  panel: observationPanel,
};

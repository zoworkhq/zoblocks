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

import type { Observation, Patient } from "@oxygenui/fhir";

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

const INTERPRETATION_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation";

const subject = { reference: "Patient/syn-patient-routine" };
const vitalSigns = [
  { coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] },
];

export const observationHeartRate: Observation = {
  resourceType: "Observation",
  id: "syn-obs-hr",
  status: "final",
  category: vitalSigns,
  code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }], text: "Heart rate" },
  subject,
  effectiveDateTime: "2026-08-03T09:14:00Z",
  valueQuantity: { value: 72, unit: "beats/min", system: "http://unitsofmeasure.org", code: "/min" },
  referenceRange: [{ low: { value: 60, unit: "beats/min" }, high: { value: 100, unit: "beats/min" } }],
};

/** Explicitly flagged critical — the interpretation is stated, not inferred. */
export const observationPotassiumCritical: Observation = {
  resourceType: "Observation",
  id: "syn-obs-k",
  status: "final",
  code: { coding: [{ system: "http://loinc.org", code: "2823-3", display: "Potassium [Moles/volume] in Serum" }], text: "Potassium" },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: { value: 6.8, unit: "mmol/L", system: "http://unitsofmeasure.org", code: "mmol/L" },
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
  code: { coding: [{ system: "http://loinc.org", code: "718-7", display: "Hemoglobin [Mass/volume] in Blood" }], text: "Hemoglobin" },
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
  code: { coding: [{ system: "http://loinc.org", code: "2276-4", display: "Ferritin [Mass/volume] in Serum" }], text: "Ferritin" },
  subject,
  effectiveDateTime: "2026-08-02T15:02:00Z",
  valueQuantity: { value: 43, unit: "ng/mL" },
};

/** Preliminary result — must be visibly distinguished from a final one. */
export const observationPreliminary: Observation = {
  resourceType: "Observation",
  id: "syn-obs-tsh",
  status: "preliminary",
  code: { coding: [{ system: "http://loinc.org", code: "3016-3", display: "Thyrotropin [Units/volume] in Serum" }], text: "TSH" },
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
  code: { coding: [{ system: "http://loinc.org", code: "6690-2", display: "Leukocytes [#/volume] in Blood" }], text: "White blood cell count" },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  dataAbsentReason: { text: "Specimen hemolyzed — recollect" },
};

/** Corrected after release. Provenance has to be visible. */
export const observationCorrected: Observation = {
  resourceType: "Observation",
  id: "syn-obs-glucose",
  status: "corrected",
  code: { coding: [{ system: "http://loinc.org", code: "2339-0", display: "Glucose [Mass/volume] in Blood" }], text: "Glucose" },
  subject,
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: { value: 156, unit: "mg/dL" },
  referenceRange: [{ low: { value: 70, unit: "mg/dL" }, high: { value: 100, unit: "mg/dL" } }],
};

/** A representative panel spanning every interpretation and status path. */
export const observationPanel: Observation[] = [
  observationPotassiumCritical,
  observationHemoglobinLow,
  observationCorrected,
  observationHeartRate,
  observationPreliminary,
  observationUninterpreted,
  observationAbsent,
];

export const observations = {
  heartRate: observationHeartRate,
  potassiumCritical: observationPotassiumCritical,
  hemoglobinLow: observationHemoglobinLow,
  uninterpreted: observationUninterpreted,
  preliminary: observationPreliminary,
  absent: observationAbsent,
  corrected: observationCorrected,
  panel: observationPanel,
};

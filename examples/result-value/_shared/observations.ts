import type { Observation } from "@zoblocks/fhir";

/** A synthetic critical-high potassium, as a lab system would send it. */
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
  subject: { reference: "Patient/syn-patient-routine" },
  effectiveDateTime: "2026-08-03T07:40:00Z",
  valueQuantity: {
    value: 6.8,
    unit: "mmol/L",
    system: "http://unitsofmeasure.org",
    code: "mmol/L",
  },
  interpretation: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
          code: "HH",
          display: "Critical high",
        },
      ],
    },
  ],
  referenceRange: [{ low: { value: 3.5, unit: "mmol/L" }, high: { value: 5.1, unit: "mmol/L" } }],
  note: [{ text: "Called to ordering provider 07:52. Repeat specimen requested." }],
};

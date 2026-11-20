/**
 * A synthetic potassium result flagged as a panic value (HH). The shape is a
 * FHIR R4 Observation; nothing here identifies a real person.
 */
export const observationPotassiumCritical = {
  resourceType: "Observation",
  id: "syn-obs-k",
  status: "final",
  code: {
    coding: [
      { system: "http://loinc.org", code: "2823-3", display: "Potassium [Moles/volume] in Serum" },
    ],
    text: "Potassium",
  },
  subject: { reference: "Patient/syn-patient-routine", display: "Amara Okonkwo" },
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
};

/** A short results table for the affix example. Values are synthetic. */
export const results = [
  { analyte: "Sodium", value: "139 mmol/L", status: "final" },
  { analyte: "Potassium", value: "6.8 mmol/L", status: "final" },
  { analyte: "TSH", value: "3.1 mIU/L", status: "preliminary" },
  { analyte: "HbA1c", value: "52 mmol/mol", status: "corrected" },
] as const;

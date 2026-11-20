import type { Patient } from "@zoblocks/fhir";

/** A fixed clock, so ages and "expires" readings don't drift between renders. */
export const NOW = "2026-08-24T10:00:00Z";

/** A synthetic patient. The identifiers are made up and validate as nothing real. */
export const patient: Patient = {
  resourceType: "Patient",
  id: "syn-ch-1",
  name: [{ use: "official", family: "Okonkwo", given: ["Amara"] }],
  birthDate: "1985-03-08",
  gender: "female",
  identifier: [
    { use: "official", system: "http://example.org/fhir/sid/mrn", value: "093-441-208" },
    { use: "official", system: "https://fhir.nhs.uk/Id/nhs-number", value: "943 476 5919" },
  ],
};

/** The same patient carrying the sex-parameter-for-clinical-use extension `resolveSpcu` reads. */
export const patientWithSpcu: Patient = {
  ...patient,
  extension: [
    {
      url: "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse",
      extension: [
        { url: "value", valueCodeableConcept: { text: "female" } },
        { url: "comment", valueString: "for medication dosing" },
      ],
    },
  ],
};

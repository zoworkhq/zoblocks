/**
 * Synthetic fixtures.
 *
 * Every person here is invented, every identifier is structurally valid but
 * fictional, and no bitmap image appears anywhere. That is a repo rule with a
 * CI check behind it, and a fixtures file is exactly where it would first be
 * broken.
 */

import type { Patient } from "@zoblocks/fhir";
import {
  EXT_GENDER_IDENTITY,
  EXT_PRONOUNS,
  EXT_RECORDED_SEX_OR_GENDER,
  EXT_SPCU,
} from "../src/resolve.js";

export const MRN_SYSTEM = "urn:oid:2.16.840.1.113883.4.1";
export const NHS_SYSTEM = "https://fhir.nhs.uk/Id/nhs-number";
export const ABHA_SYSTEM = "https://healthid.ndhm.gov.in/";

/** A valid NHS number: 943 476 5919 passes modulus 11. */
export const VALID_NHS = "9434765919";
/** Same digits with the check digit wrong. */
export const INVALID_NHS = "9434765918";

/** A structurally valid ABHA number: Verhoeff check digit 4 over 23456789012. */
export const VALID_ABHA = "234567890124";

export function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    resourceType: "Patient",
    id: "pat-4471",
    active: true,
    name: [{ use: "official", given: ["Amara", "Chinelo"], family: "Okonkwo" }],
    birthDate: "1985-03-08",
    identifier: [{ system: MRN_SYSTEM, value: "123456789", assigner: { display: "St Aidan's" } }],
    ...overrides,
  };
}

/** Chosen name differs from the legal one. The behavioural-health case. */
export const chosenName = patient({
  id: "pat-8801",
  name: [
    { use: "official", given: ["Robert", "James"], family: "Ferreira" },
    { use: "usual", given: ["Robin"], family: "Ferreira" },
  ],
  extension: [
    {
      url: EXT_PRONOUNS,
      extension: [
        {
          url: "value",
          valueCodeableConcept: { coding: [{ code: "they-them", display: "they/them" }] },
        },
      ],
    },
  ],
});

export const deceased = patient({
  id: "pat-2001",
  name: [{ use: "official", given: ["Halima"], family: "Yusuf" }],
  birthDate: "1961-01-04",
  deceasedDateTime: "2024-03-12",
});

export const merged = patient({
  id: "pat-3002",
  name: [{ use: "official", given: ["Kofi"], family: "Mensah" }],
  link: [
    { other: { reference: "Patient/pat-3099", display: "MRN 662100349" }, type: "replaced-by" },
  ],
});

export const testPatient = patient({
  id: "pat-0001",
  name: [{ use: "official", given: ["Integration"], family: "ZZZTEST" }],
  meta: {
    security: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ActReason", code: "HTEST" }],
  },
});

export const sensitive = patient({
  id: "pat-7710",
  meta: {
    security: [
      { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "ETH" },
      { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "PSY" },
    ],
  },
});

export const withSpcu = patient({
  id: "pat-6006",
  gender: "male",
  extension: [
    {
      url: EXT_SPCU,
      extension: [
        {
          url: "value",
          valueCodeableConcept: { coding: [{ code: "female-typical", display: "female-typical" }] },
        },
      ],
    },
    {
      url: EXT_GENDER_IDENTITY,
      extension: [
        { url: "value", valueCodeableConcept: { coding: [{ code: "female", display: "Female" }] } },
      ],
    },
    {
      url: EXT_RECORDED_SEX_OR_GENDER,
      extension: [
        { url: "value", valueCodeableConcept: { coding: [{ code: "M", display: "Male" }] } },
      ],
    },
  ],
});

export const mononym = patient({
  id: "pat-5150",
  name: [{ use: "official", given: ["Suryanto"] }],
});

export const ideographic = patient({
  id: "pat-6650",
  name: [{ use: "official", given: ["美琳"], family: "陳" }],
});

export const compoundSurname = patient({
  id: "pat-4409",
  name: [{ use: "official", given: ["Sofía"], family: "Ramírez Cruz" }],
});

export const particleSurname = patient({
  id: "pat-4410",
  name: [{ use: "official", given: ["Joris"], family: "van der Meer" }],
});

export const neonate = patient({
  id: "pat-9001",
  name: [{ use: "official", given: ["Baby A"], family: "Ferreira" }],
  birthDate: "2026-08-10",
});

export const unnamed = patient({ id: "pat-0000", name: [] });

export const withPhoto = patient({
  id: "pat-4471",
  photo: [{ contentType: "image/png", url: "https://pacs.example.org/p/4471.png" }],
});

/** Fixed clock, so every age assertion is a fact rather than a moving target. */
export const NOW = new Date("2026-08-16T09:00:00Z");

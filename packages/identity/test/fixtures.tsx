/**
 * Synthetic fixtures for the React suite.
 *
 * Every person is invented and no bitmap image appears anywhere. The photo URLs
 * below point at a domain that does not resolve, which is deliberate: the
 * "could not load" path is a real state this suite has to exercise.
 */

import type { Patient } from "@zoblocks/fhir";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { IdentityProvider, type IdentityProviderProps } from "../src/IdentityProvider.js";

export const MRN = "urn:oid:2.16.840.1.113883.4.1";
export const NHS = "https://fhir.nhs.uk/Id/nhs-number";
export const EXT_PRONOUNS = "http://hl7.org/fhir/StructureDefinition/individual-pronouns";
export const EXT_SPCU =
  "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

export const NOW = new Date("2026-08-16T09:00:00Z");

export function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    resourceType: "Patient",
    id: "pat-4471",
    active: true,
    name: [{ use: "official", given: ["Amara", "Chinelo"], family: "Okonkwo" }],
    birthDate: "1985-03-08",
    identifier: [{ system: MRN, value: "123456789", assigner: { display: "St Aidan's" } }],
    ...overrides,
  };
}

export const amaraA = patient();
export const amaraB = patient({
  id: "pat-9910",
  name: [{ use: "official", given: ["Amara", "Nkechi"], family: "Okonkwo" }],
  birthDate: "1991-09-22",
  identifier: [{ system: MRN, value: "998220106", assigner: { display: "St Aidan's" } }],
});
export const ada = patient({
  id: "pat-2210",
  name: [{ use: "official", given: ["Ada"], family: "Lovelace" }],
  birthDate: "1979-02-02",
  identifier: [{ system: MRN, value: "402118776", assigner: { display: "St Aidan's" } }],
});
export const devraj = patient({
  id: "pat-9038",
  name: [{ use: "official", given: ["Devraj", "Anand"], family: "Iyer" }],
  birthDate: "1990-11-19",
  identifier: [{ system: MRN, value: "771004128", assigner: { display: "St Aidan's" } }],
});
export const twinA = patient({
  id: "pat-9001",
  name: [{ use: "official", given: ["Baby A"], family: "Ferreira" }],
  birthDate: "2026-08-15",
  identifier: [{ system: MRN, value: "880112003" }],
});
export const twinB = patient({
  id: "pat-9002",
  name: [{ use: "official", given: ["Baby B"], family: "Ferreira" }],
  birthDate: "2026-08-15",
  identifier: [{ system: MRN, value: "880112004" }],
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
  link: [{ other: { reference: "Patient/pat-3099" }, type: "replaced-by" }],
});
export const inactive = patient({ id: "pat-5005", active: false });
export const testPatient = patient({
  id: "pat-0001",
  name: [{ use: "official", given: ["Integration"], family: "ZZZTEST" }],
  meta: { security: [{ code: "HTEST" }] },
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
  ],
});
export const withPhoto = patient({
  id: "pat-4471",
  photo: [{ contentType: "image/png", url: "https://pacs.invalid/p/4471.png" }],
});
export const withNhs = patient({
  id: "pat-1234",
  identifier: [
    { system: MRN, value: "123456789", assigner: { display: "St Aidan's" } },
    { system: NHS, value: "9434765919" },
  ],
});
export const badCheckDigit = patient({
  id: "pat-1235",
  identifier: [{ system: NHS, value: "9434765918" }],
});

/** A provider with a frozen clock, for tests that build their own tree. */
export function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return <IdentityProvider now={NOW}>{children}</IdentityProvider>;
}

/** Render inside a provider with a frozen clock, so ages never move. */
export function renderWithPolicy(
  ui: ReactElement,
  providerProps: Partial<IdentityProviderProps> = {},
  options?: RenderOptions,
): RenderResult {
  const wrapper = ({ children }: { children: ReactNode }): ReactElement => (
    <IdentityProvider now={NOW} {...(providerProps as IdentityProviderProps)}>
      {children}
    </IdentityProvider>
  );
  return render(ui, { wrapper, ...options });
}

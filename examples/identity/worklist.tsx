import { useState } from "react";
import { IdentityProvider, IdentitySet, IdentitySetNotice, PatientChip } from "@zoblocks/identity";

const MRN_SYSTEM = "https://hospital.example.org/identifiers/mrn";

const patients = [
  {
    resourceType: "Patient" as const,
    id: "amara-001",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Okonkwo",
        given: ["Amara", "Chinelo"],
      },
    ],
    birthDate: "1985-03-08",
    identifier: [{ system: MRN_SYSTEM, value: "123456789" }],
  },
  {
    resourceType: "Patient" as const,
    id: "amara-002",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Okonkwo",
        given: ["Amara", "Nkechi"],
      },
    ],
    birthDate: "1991-09-22",
    identifier: [{ system: MRN_SYSTEM, value: "998220106" }],
  },
  {
    resourceType: "Patient" as const,
    id: "ada-001",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Lovelace",
        given: ["Ada"],
      },
    ],
    birthDate: "1979-02-02",
    identifier: [{ system: MRN_SYSTEM, value: "556677889" }],
  },
  {
    resourceType: "Patient" as const,
    id: "anh-001",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Nguyen",
        given: ["Anh"],
      },
    ],
    birthDate: "1978-02-03",
    identifier: [{ system: MRN_SYSTEM, value: "778899001" }],
  },
  {
    resourceType: "Patient" as const,
    id: "anh-002",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Nguyên",
        given: ["Ánh"],
      },
    ],
    birthDate: "1982-12-11",
    identifier: [{ system: MRN_SYSTEM, value: "778899002" }],
  },
  {
    resourceType: "Patient" as const,
    id: "baby-a",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Ferreira",
        given: ["Baby", "A"],
      },
    ],
    birthDate: "2026-08-15",
    identifier: [{ system: MRN_SYSTEM, value: "880112003" }],
  },
  {
    resourceType: "Patient" as const,
    id: "baby-b",
    active: true,
    name: [
      {
        use: "official" as const,
        family: "Ferreira",
        given: ["Baby", "B"],
      },
    ],
    birthDate: "2026-08-15",
    identifier: [{ system: MRN_SYSTEM, value: "880112004" }],
  },
];

export default function TwoPatientsOneName() {
  const [disambiguate, setDisambiguate] = useState(false);

  return (
    <IdentityProvider
      disclosure="clinical"
      photos="deny"
      now={new Date("2026-08-16T09:00:00Z")}
      identifierSystems={[
        {
          kind: "mrn",
          label: "MRN",
          systems: [MRN_SYSTEM],
          weight: 2,
        },
      ]}
    >
      <div className="w-full">
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disambiguate}
              onChange={(event) => setDisambiguate(event.target.checked)}
            />
            <span>
              Run <code>disambiguate()</code>
            </span>
          </label>
        </div>

        <IdentitySet enabled={disambiguate}>
          <ul className="space-y-3">
            {patients.map((patient) => (
              <li key={patient.id}>
                <PatientChip patient={patient} block showStates />
              </li>
            ))}
          </ul>

          <IdentitySetNotice />
        </IdentitySet>

        <p className="mt-4 text-sm text-gray-600">
          {disambiguate
            ? "On, each collided row gains the minimum that separates it and Ada Lovelace is left alone."
            : "Off, four rows are indistinguishable — two Okonkwos, two Nguyens separated only by diacritics, and twins sharing a surname and a date of birth."}
        </p>
      </div>
    </IdentityProvider>
  );
}

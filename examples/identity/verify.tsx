import { useState } from "react";
import { IdentityProvider, PatientBanner, PatientVerify, useIdentity } from "@zoblocks/identity";

const MRN_SYSTEM = "https://hospital.example.org/identifiers/mrn";
const VISIT_SYSTEM = "https://hospital.example.org/identifiers/visit";

const patient = {
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
  identifier: [
    {
      use: "official" as const,
      system: MRN_SYSTEM,
      value: "123456789",
    },
    {
      use: "secondary" as const,
      system: VISIT_SYSTEM,
      value: "VIS-2026-1001",
    },
  ],
};

function ConfirmBeforeOrdering() {
  const identity = useIdentity(patient);
  const [confirmed, setConfirmed] = useState(false);

  if (!identity) return null;

  if (confirmed) {
    return (
      <div className="space-y-3">
        <PatientBanner
          patient={patient}
          context="action"
          identifiers={[{ kind: "mrn" }, { kind: "visit" }]}
        />

        <p className="text-sm font-medium text-green-700">
          Confirmed. In a real deployment the order proceeds from here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PatientVerify
        identity={identity}
        action="ordering Clozapine 25 mg"
        onConfirm={() => setConfirmed(true)}
      />

      <p className="text-sm text-gray-600">
        Type <code>AO</code> to continue. A dismissible “check the patient” alert reduced
        wrong-patient orders with an odds ratio of 0.84 in Adelman et al.; re-entering the initials
        reduced them with an odds ratio of 0.60. Everyone ships the first.
      </p>
    </div>
  );
}

export default function ConfirmBeforeOrderingExample() {
  return (
    <IdentityProvider
      disclosure="clinical"
      photos="deny"
      identifierSystems={[
        {
          kind: "mrn",
          label: "MRN",
          systems: [MRN_SYSTEM],
          weight: 2,
        },
        {
          kind: "visit",
          label: "Visit ID",
          systems: [VISIT_SYSTEM],
          weight: 1,
        },
      ]}
    >
      <div className="w-full">
        <ConfirmBeforeOrdering />
      </div>
    </IdentityProvider>
  );
}

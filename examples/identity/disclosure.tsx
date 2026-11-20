import { useState } from "react";
import { IdentityProvider, PatientBanner } from "@zoblocks/identity";

const MRN_SYSTEM = "urn:oid:2.16.840.1.113883.4.1";

const EXT_PRONOUNS = "http://hl7.org/fhir/StructureDefinition/individual-pronouns";

const EXT_SPCU = "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

type Audience = "public" | "reception" | "clinical" | "full";

const audiences: {
  id: Audience;
  label: string;
  description: string;
}[] = [
  {
    id: "public",
    label: "Waiting room",
    description: "Enough information for the patient to recognise themselves.",
  },
  {
    id: "reception",
    label: "Reception",
    description: "Full name and DOB, with a masked identifier.",
  },
  {
    id: "clinical",
    label: "Clinician",
    description: "Full clinical detail, with sensitivity categories protected.",
  },
  {
    id: "full",
    label: "Full record",
    description: "Full disclosure, including sensitivity categories.",
  },
];

const patient = {
  resourceType: "Patient" as const,
  id: "pat-7710",
  active: true,
  name: [
    {
      use: "official" as const,
      given: ["Amara", "Chinelo"],
      family: "Okonkwo",
    },
  ],
  birthDate: "1985-03-08",
  gender: "female" as const,
  identifier: [
    {
      use: "official" as const,
      system: MRN_SYSTEM,
      value: "123456789",
      assigner: {
        display: "St Aidan's",
      },
    },
  ],
  meta: {
    security: [
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "ETH",
      },
      {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "PSY",
      },
    ],
  },
  extension: [
    {
      url: EXT_PRONOUNS,
      extension: [
        {
          url: "value",
          valueCodeableConcept: {
            coding: [{ code: "she-her", display: "she/her" }],
          },
        },
      ],
    },
    {
      url: EXT_SPCU,
      extension: [
        {
          url: "value",
          valueCodeableConcept: {
            coding: [
              {
                code: "female-typical",
                display: "female-typical",
              },
            ],
          },
        },
      ],
    },
  ],
};

export default function OneResourceFourAudiences() {
  const [audience, setAudience] = useState<Audience>("public");
  const [auditEntry, setAuditEntry] = useState<string | null>(null);

  const selectedAudience = audiences.find((item) => item.id === audience)!;

  return (
    <div className="flex flex-col gap-3">
      {/* Audience selector */}
      <div className="flex flex-wrap gap-1.5">
        {audiences.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAudience(item.id)}
            aria-pressed={audience === item.id}
            className={[
              "rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
              audience === item.id
                ? "bg-[var(--zb-accent-subtle)] text-[var(--zb-accent)] ring-1 ring-[var(--zb-accent-border)]"
                : "text-[var(--zb-text-muted)] hover:bg-[var(--zb-bg-subtle)] hover:text-[var(--zb-text)]",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Selected audience description */}
      <p className="text-xs leading-relaxed text-[var(--zb-text-muted)]">
        {selectedAudience.description}
      </p>

      {/* Patient identity */}
      <IdentityProvider
        key={audience}
        disclosure={audience}
        photos="deny"
        now={new Date("2026-08-16T09:00:00Z")}
        identifierSystems={[
          {
            kind: "mrn",
            label: "MRN",
            systems: [MRN_SYSTEM],
            maskVisible: 3,
            group: [3, 3, 3],
            weight: 100,
          },
        ]}
        onSensitiveReveal={(event) => {
          setAuditEntry(
            `Sensitive information revealed for patient ${event.patientId}. Categories: ${event.codes.join(", ")}. Recorded at: ${event.at}`,
          );
        }}
      >
        <PatientBanner
          patient={patient}
          context="navigation"
          identifiers={[{ kind: "mrn" }]}
          ward="St Aidan's"
        />
      </IdentityProvider>

      {/* Demonstration audit entry */}
      {auditEntry && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3" role="status">
          <p className="text-sm font-semibold text-green-800">Audit event recorded (demo)</p>

          <p className="mt-1 break-words text-xs text-green-700">{auditEntry}</p>
        </div>
      )}

      {/* Explanation */}
      <p className="text-xs leading-relaxed text-[var(--zb-text-muted)]">
        The same record. A waiting-room screen carries enough for the named person to recognise
        themselves and no more; reception gets a masked identifier because they are confirming an
        appointment, not reading a chart. Below full disclosure the sensitivity categories stay
        behind an audited reveal — in the tag, the row and the accessible name alike.
      </p>
    </div>
  );
}

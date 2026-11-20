import { useState } from "react";
import { IdentityProvider, PatientBanner, PatientGuard } from "@zoblocks/identity";

const MRN_SYSTEM = "urn:oid:2.16.840.1.113883.4.1";

const EXT_PRONOUNS = "http://hl7.org/fhir/StructureDefinition/individual-pronouns";

const EXT_SPCU = "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

const NOW = new Date("2026-08-16T09:00:00Z");

// The patient for whom the order form was originally opened.
const openedFor = {
  resourceType: "Patient" as const,
  id: "pat-4471",
  active: true,
  name: [
    {
      use: "official" as const,
      given: ["Amara", "Chinelo"],
      family: "Okonkwo",
    },
  ],
  birthDate: "1985-03-08",
  identifier: [
    {
      system: MRN_SYSTEM,
      value: "123456789",
      assigner: { display: "St Aidan's" },
    },
  ],
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

// Patients that can be selected as the chart currently on screen.
const switchablePatients = [
  openedFor,
  {
    resourceType: "Patient" as const,
    id: "pat-9038",
    active: true,
    name: [
      {
        use: "official" as const,
        given: ["Devraj", "Anand"],
        family: "Iyer",
      },
    ],
    birthDate: "1990-11-19",
    identifier: [
      {
        system: MRN_SYSTEM,
        value: "771004128",
        assigner: { display: "St Aidan's" },
      },
    ],
  },
];

export default function WrongPatientRefused() {
  const [chart, setChart] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {/* Switch the patient currently displayed in the chart */}
      <button
        type="button"
        onClick={() => setChart((current) => (current + 1) % switchablePatients.length)}
        className="self-start rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-[var(--zb-text-muted)] ring-1 ring-[var(--zb-border)] transition-colors hover:text-[var(--zb-text)]"
      >
        Switch patient
      </button>

      <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
        <PatientBanner patient={switchablePatients[chart] ?? openedFor} context="navigation">
          <div className="mt-3">
            <PatientGuard expect={openedFor.id} expectName="Amara Chinelo Okonkwo">
              <div className="rounded-lg px-3 py-2.5 text-sm ring-1 ring-[var(--zb-border)]">
                Order form for this patient — Clozapine 25 mg
              </div>
            </PatientGuard>
          </div>
        </PatientBanner>
      </IdentityProvider>

      {/* Explanation */}
      <p className="text-xs leading-relaxed text-[var(--zb-text-muted)]">
        The form was opened for Amara Chinelo Okonkwo. Switch the chart and it refuses to render —
        in every environment, not only in a development build, because a working screen showing the
        wrong human is the failure this exists to prevent.
      </p>
    </div>
  );
}

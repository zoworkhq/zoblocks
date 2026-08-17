"use client";

/**
 * The live identity demos.
 *
 * Six of them, because the component's argument is not "here is a banner" —
 * it is that identity has states nobody designs for, and the only way to show
 * that is to render them. A screenshot can show a banner working; only this can
 * show it refusing to work when the chart and the form disagree.
 *
 * Every person here is invented and every identifier is synthetic. That is a
 * repo rule with a CI check behind it, and a demo file is exactly where it
 * would first be broken.
 */

import * as React from "react";
import type { Patient } from "@oxygenui-design/fhir";
import {
  IdentityProvider,
  IdentitySet,
  IdentitySetNotice,
  PatientBanner,
  PatientChip,
  PatientGuard,
  PatientVerify,
  useIdentity,
  type DisclosureLevel,
} from "@oxygenui-design/identity";

const MRN = "urn:oid:2.16.840.1.113883.4.1";
const NHS = "https://fhir.nhs.uk/Id/nhs-number";
const EXT_PRONOUNS = "http://hl7.org/fhir/StructureDefinition/individual-pronouns";
const EXT_SPCU = "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

/**
 * A fixed clock.
 *
 * Ages are derived, and a demo that read the wall clock would drift a year
 * every birthday and produce a different screenshot on every visual-regression
 * run. Passing `now` is how the component makes that the caller's decision.
 */
const NOW = new Date("2026-08-16T09:00:00Z");

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    resourceType: "Patient",
    id: "pat-4471",
    active: true,
    name: [{ use: "official", given: ["Amara", "Chinelo"], family: "Okonkwo" }],
    birthDate: "1985-03-08",
    identifier: [{ system: MRN, value: "123456789", assigner: { display: "St Aidan's" } }],
    extension: [
      {
        url: EXT_PRONOUNS,
        extension: [
          {
            url: "value",
            valueCodeableConcept: { coding: [{ code: "she-her", display: "she/her" }] },
          },
        ],
      },
      {
        url: EXT_SPCU,
        extension: [
          {
            url: "value",
            valueCodeableConcept: {
              coding: [{ code: "female-typical", display: "female-typical" }],
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

const AMARA = patient();
const AMARA_WITH_NHS = patient({
  identifier: [
    { system: MRN, value: "123456789", assigner: { display: "St Aidan's" } },
    { system: NHS, value: "9434765919" },
  ],
});

const DECEASED = patient({
  id: "pat-2001",
  name: [{ use: "official", given: ["Halima"], family: "Yusuf" }],
  birthDate: "1961-01-04",
  deceasedDateTime: "2024-03-12",
  extension: [],
});
const INACTIVE = patient({
  id: "pat-5005",
  name: [{ use: "official", given: ["Devraj", "Anand"], family: "Iyer" }],
  birthDate: "1990-11-19",
  active: false,
  extension: [],
});
const MERGED = patient({
  id: "pat-3002",
  name: [{ use: "official", given: ["Kofi"], family: "Mensah" }],
  link: [{ other: { reference: "Patient/pat-3099" }, type: "replaced-by" }],
  extension: [],
});
const TEST_PATIENT = patient({
  id: "pat-0001",
  name: [{ use: "official", given: ["Integration"], family: "ZZZTEST" }],
  birthDate: "2000-01-01",
  meta: { security: [{ code: "HTEST" }] },
  extension: [],
});
const SENSITIVE = patient({
  id: "pat-7710",
  meta: {
    security: [
      { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "ETH" },
      { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "PSY" },
    ],
  },
});
const BAD_CHECK_DIGIT = patient({
  id: "pat-1235",
  name: [{ use: "official", given: ["Sofía"], family: "Ramírez Cruz" }],
  identifier: [{ system: NHS, value: "9434765918" }],
  extension: [],
});

/** The worklist: three genuine collisions and one row that must stay untouched. */
const WORKLIST: Patient[] = [
  patient({
    id: "wl-1",
    name: [{ use: "official", given: ["Amara", "Chinelo"], family: "Okonkwo" }],
    birthDate: "1985-03-08",
    identifier: [{ system: MRN, value: "123456789" }],
    extension: [],
  }),
  patient({
    id: "wl-2",
    name: [{ use: "official", given: ["Amara", "Nkechi"], family: "Okonkwo" }],
    birthDate: "1991-09-22",
    identifier: [{ system: MRN, value: "998220106" }],
    extension: [],
  }),
  patient({
    id: "wl-3",
    name: [{ use: "official", given: ["Ada"], family: "Lovelace" }],
    birthDate: "1979-02-02",
    identifier: [{ system: MRN, value: "402118776" }],
    extension: [],
  }),
  patient({
    id: "wl-4",
    name: [{ use: "official", given: ["Anh"], family: "Nguyen" }],
    birthDate: "1978-02-03",
    identifier: [{ system: MRN, value: "445019220" }],
    extension: [],
  }),
  patient({
    id: "wl-5",
    name: [{ use: "official", given: ["Ánh"], family: "Nguyên" }],
    birthDate: "1982-12-11",
    identifier: [{ system: MRN, value: "703884561" }],
    extension: [],
  }),
  patient({
    id: "wl-6",
    name: [{ use: "official", given: ["Baby A"], family: "Ferreira" }],
    birthDate: "2026-08-15",
    identifier: [{ system: MRN, value: "880112003" }],
    extension: [],
  }),
  patient({
    id: "wl-7",
    name: [{ use: "official", given: ["Baby B"], family: "Ferreira" }],
    birthDate: "2026-08-15",
    identifier: [{ system: MRN, value: "880112004" }],
    extension: [],
  }),
];

const SWITCHABLE: Patient[] = [
  AMARA,
  patient({
    id: "pat-9038",
    name: [{ use: "official", given: ["Devraj", "Anand"], family: "Iyer" }],
    birthDate: "1990-11-19",
    identifier: [{ system: MRN, value: "771004128", assigner: { display: "St Aidan's" } }],
    extension: [],
  }),
  patient({
    id: "pat-6650",
    name: [{ use: "official", given: ["美琳"], family: "陳" }],
    birthDate: "1968-06-14",
    identifier: [{ system: MRN, value: "553902771", assigner: { display: "St Aidan's" } }],
    extension: [],
  }),
];

// ---------------------------------------------------------------------------

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

function Aside({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-panel-muted">{children}</p>;
}

/** 1 · The banner, in the shape a chart header actually uses. */
export function IdentityBannerDemo() {
  return (
    <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
      <PatientBanner
        patient={AMARA_WITH_NHS}
        context="action"
        identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
        ward="4B / bay 2"
      />
    </IdentityProvider>
  );
}

/** 2 · Four unrelated facts the reference designs draw as one grey pill. */
export function IdentityStatesDemo() {
  return (
    <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
      <Frame>
        <PatientBanner patient={DECEASED} context="navigation" />
        <PatientBanner patient={INACTIVE} context="navigation" />
        <PatientBanner patient={MERGED} context="navigation" />
        <PatientBanner patient={TEST_PATIENT} context="navigation" />
        <PatientBanner patient={BAD_CHECK_DIGIT} context="navigation" />
      </Frame>
    </IdentityProvider>
  );
}

/** 3 · The disambiguation pass, on and off. */
export function IdentityWorklistDemo() {
  const [on, setOn] = React.useState(true);

  return (
    <Frame>
      <label className="flex items-center gap-2 text-xs text-panel-muted">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="size-3.5 accent-[var(--color-trace)]"
        />
        Run <code className="font-mono">disambiguate()</code>
      </label>

      <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
        {on ? (
          <IdentitySet>
            <ul className="flex list-none flex-col gap-1.5 p-0">
              {WORKLIST.map((p) => (
                <li key={p.id}>
                  <PatientChip patient={p} />
                </li>
              ))}
            </ul>
            <IdentitySetNotice />
          </IdentitySet>
        ) : (
          <ul className="flex list-none flex-col gap-1.5 p-0">
            {WORKLIST.map((p) => (
              <li key={p.id}>
                <PatientChip patient={p} />
              </li>
            ))}
          </ul>
        )}
      </IdentityProvider>

      <Aside>
        Off, four rows are indistinguishable — two Okonkwos, two Nguyens separated only by
        diacritics, and twins sharing a surname and a date of birth. On, each collided row gains the
        minimum that separates it and Ada Lovelace is left alone.
      </Aside>
    </Frame>
  );
}

/** 4 · One resource, four audiences. */
export function IdentityDisclosureDemo() {
  const [level, setLevel] = React.useState<DisclosureLevel>("clinical");
  const LEVELS: Array<[DisclosureLevel, string]> = [
    ["public", "Waiting room"],
    ["reception", "Reception"],
    ["clinical", "Clinician"],
    ["full", "Full record"],
  ];

  return (
    <Frame>
      <div className="flex flex-wrap gap-1.5">
        {LEVELS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setLevel(value)}
            aria-pressed={level === value}
            className={[
              "rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors",
              level === value
                ? "bg-trace/12 text-trace ring-1 ring-trace/35"
                : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Keyed, so switching level rebuilds the policy rather than reusing a
          resolution cached under the previous one. */}
      <IdentityProvider key={level} now={NOW} disclosure={level} photos="deny">
        <PatientBanner patient={SENSITIVE} context="navigation" />
      </IdentityProvider>

      <Aside>
        The same record. A waiting-room screen carries enough for the named person to recognise
        themselves and no more; reception gets a masked identifier because they are confirming an
        appointment, not reading a chart. Below full disclosure the sensitivity categories stay
        behind an audited reveal — in the tag, the row and the accessible name alike.
      </Aside>
    </Frame>
  );
}

/** 5 · The coupling that makes the banner a control. */
export function IdentityGuardDemo() {
  const [chart, setChart] = React.useState(0);
  const openedFor = AMARA;

  return (
    <Frame>
      <button
        type="button"
        onClick={() => setChart((n) => (n + 1) % SWITCHABLE.length)}
        className="self-start rounded-lg px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-panel-muted ring-1 ring-panel-rule transition-colors hover:text-panel-fg"
      >
        Switch patient
      </button>

      <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
        <PatientBanner patient={SWITCHABLE[chart]!} context="navigation">
          <div className="mt-3">
            <PatientGuard expect={openedFor.id!} expectName="Amara Chinelo Okonkwo">
              <div className="rounded-lg px-3 py-2.5 text-sm ring-1 ring-panel-rule">
                Order form for this patient — Clozapine 25 mg
              </div>
            </PatientGuard>
          </div>
        </PatientBanner>
      </IdentityProvider>

      <Aside>
        The form was opened for Amara Chinelo Okonkwo. Switch the chart and it refuses to render —
        in every environment, not only in a development build, because a working screen showing the
        wrong human is the failure this exists to prevent.
      </Aside>
    </Frame>
  );
}

/** 6 · The intervention that carried OR 0.60. */
function VerifyInner() {
  const identity = useIdentity(AMARA);
  const [done, setDone] = React.useState(false);

  if (!identity) return null;
  if (done) {
    return (
      <Frame>
        <PatientBanner patient={AMARA} context="navigation" />
        <Aside>Confirmed. In a real deployment the order proceeds from here.</Aside>
      </Frame>
    );
  }

  return (
    <Frame>
      <PatientVerify
        identity={identity}
        action="ordering Clozapine 25 mg"
        onConfirm={() => setDone(true)}
      />
      <Aside>
        Type <code className="font-mono">AO</code> to continue. A dismissible “check the patient”
        alert reduced wrong-patient orders with an odds ratio of 0.84 in Adelman et al.; re-entering
        the initials reduced them with an odds ratio of 0.60. Everyone ships the first.
      </Aside>
    </Frame>
  );
}

export function IdentityVerifyDemo() {
  return (
    <IdentityProvider now={NOW} disclosure="clinical" photos="deny">
      <VerifyInner />
    </IdentityProvider>
  );
}

/** 7 · Five absences, because they are five different facts. */
export function IdentityAbsenceDemo() {
  const WITH_PHOTO = patient({
    photo: [{ contentType: "image/png", url: "https://pacs.invalid/x.png" }],
  });

  return (
    <Frame>
      <div className="flex flex-col gap-2">
        <IdentityProvider now={NOW} photos="deny">
          <PatientBanner patient={AMARA} context="navigation" fields={["photo", "name", "dob"]} />
        </IdentityProvider>
        <Aside>No photo on file — initials, dashed border. The record has never had one.</Aside>
      </div>

      <div className="flex flex-col gap-2">
        <IdentityProvider now={NOW} photos="deny">
          <PatientBanner
            patient={WITH_PHOTO}
            context="navigation"
            fields={["photo", "name", "dob"]}
          />
        </IdentityProvider>
        <Aside>
          Withheld — the record has a photograph and site policy does not show it here. A different
          fact from having none, and it says so.
        </Aside>
      </div>

      <div className="flex flex-col gap-2">
        <IdentityProvider now={NOW} photos="allow">
          <PatientBanner
            patient={WITH_PHOTO}
            context="navigation"
            fields={["photo", "name", "dob"]}
          />
        </IdentityProvider>
        <Aside>
          Allowed, and the URL does not resolve — so it degrades to “could not load” rather than
          silently falling back to initials. A photograph in the banner measurably reduces
          wrong-patient orders, which makes a silently missing one a silently degraded control.
        </Aside>
      </div>

      <div className="flex flex-col gap-2">
        <IdentityProvider now={NOW} photos="deny">
          <PatientBanner loading context="navigation" />
        </IdentityProvider>
        <Aside>
          Loading is a skeleton, never a half-identity. A name above a still-resolving identifier
          reads as a complete record, and someone acts on it.
        </Aside>
      </div>
    </Frame>
  );
}

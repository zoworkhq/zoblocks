"use client";

/**
 * Live previews for Chart Header's four declared examples. Three of the four
 * (spcu, encounter, absence) are pure function-call demonstrations in their
 * own code; each live preview shows the same decision through the real
 * component rather than re-deriving it by hand.
 */

import * as React from "react";
import type { Patient } from "@zoblocks/fhir";
import {
  ChartHeader,
  type EncounterOption,
  type SafetyInput,
} from "@/registry/zoblocks/chart-header/chart-header";

const NOW = "2026-08-24T10:00:00Z";

const PATIENT: Patient = {
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

/** Carries the SPCU extension `resolveSpcu` reads; the base fixture does not. */
const PATIENT_SPCU: Patient = {
  ...PATIENT,
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

const IDENTIFIERS = [{ kind: "mrn" }, { kind: "nhs" }] as const;

const SAFETY: SafetyInput = {
  allergies: { label: "Penicillin — anaphylaxis", tone: "critical", detail: "confirmed" },
  codeStatus: { label: "DNR" },
};

export function CollapsesToTheStrip() {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <ChartHeader
      patient={PATIENT}
      identifiers={IDENTIFIERS}
      now={NOW}
      safety={SAFETY}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
    />
  );
}

export function SpcuWithContext() {
  const [surface, setSurface] = React.useState<"orders" | "overview">("orders");
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
        <button
          type="button"
          onClick={() => setSurface("orders")}
          aria-pressed={surface === "orders"}
          style={{ fontWeight: surface === "orders" ? 600 : 400 }}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setSurface("overview")}
          aria-pressed={surface === "overview"}
          style={{ fontWeight: surface === "overview" ? 600 : 400 }}
        >
          Overview
        </button>
      </div>
      <ChartHeader
        key={surface}
        patient={PATIENT_SPCU}
        identifiers={IDENTIFIERS}
        now={NOW}
        surface={surface}
      />
      <span style={{ fontSize: 12, opacity: 0.62 }}>
        {surface === "orders"
          ? "Orders: the sex parameter shows, with what it applies to."
          : "Overview: the same patient, the same field — not shown at all."}
      </span>
    </div>
  );
}

export function NoEncounterIsAState() {
  const encounters: EncounterOption[] = [
    { id: "enc-1", label: "Inpatient — Ward 4B", type: "inpatient" },
    { id: "enc-2", label: "Outpatient — 24 Aug, 09:00", type: "ambulatory" },
    { id: "enc-3", label: "Telehealth — 24 Aug, 14:00", type: "virtual" },
  ];
  return (
    <ChartHeader patient={PATIENT} identifiers={IDENTIFIERS} now={NOW} encounters={encounters} />
  );
}

export function TwoFactsAlwaysOnTheStrip() {
  return <ChartHeader patient={PATIENT} identifiers={IDENTIFIERS} now={NOW} />;
}

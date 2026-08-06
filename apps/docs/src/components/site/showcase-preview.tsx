"use client";

/**
 * Live compositions for the showcase.
 *
 * These are not screenshots. Each entry mounts the real registry components
 * against the real synthetic fixtures, which means the showcase can never
 * drift from the library — and a visitor can see composition behaviour
 * (density, escalation, masking) rather than a picture of it.
 */

import * as React from "react";
import {
  allergies,
  appointments,
  conditions,
  coverages,
  medications,
  observations,
  patients,
} from "@oxygenui-design/fixtures";
import { PatientBanner } from "@/registry/oxygen/patient-banner/patient-banner";
import { ObservationPanel } from "@/registry/oxygen/vitals-panel/vitals-panel";
import { MedicationList } from "@/registry/oxygen/medication-card/medication-card";
import { AllergyList } from "@/registry/oxygen/allergy-list/allergy-list";
import { AppointmentCard } from "@/registry/oxygen/appointment-card/appointment-card";
import { CoverageCard } from "@/registry/oxygen/coverage-card/coverage-card";
import { ConditionList } from "@/registry/oxygen/condition-list/condition-list";
import { InstrumentGlow } from "@/components/site/interactions";

const AS_OF = new Date("2026-08-03T00:00:00Z");
const TZ = "Asia/Kolkata";

const COMPOSITIONS: Record<string, () => React.ReactNode> = {
  "patient-results": () => (
    <div className="space-y-3">
      <PatientBanner headingLevel={3} patient={patients.routine} asOf={AS_OF} />
      {/* Same component as the clinical view — ranges hidden, patient density. */}
      <ObservationPanel
        observations={[observations.heartRate, observations.hemoglobinLow]}
        hideReferenceRange
        label="Your recent results"
      />
    </div>
  ),

  "chart-summary": () => (
    <div className="space-y-3">
      <PatientBanner headingLevel={3} patient={patients.routine} asOf={AS_OF} />
      <ObservationPanel observations={observations.panel.slice(0, 3)} label="Recent results" />
      <div className="grid gap-3 lg:grid-cols-2">
        <ConditionList conditions={conditions.list} />
        <AllergyList allergies={allergies.list} />
      </div>
    </div>
  ),

  "front-desk": () => (
    <div className="space-y-3">
      {/* Masked: this screen faces a waiting room. */}
      <PatientBanner headingLevel={3} patient={patients.routine} maskIdentifiers asOf={AS_OF} />
      <div className="grid gap-3 lg:grid-cols-2">
        <AppointmentCard appointment={appointments.booked} timeZone={TZ} />
        <CoverageCard coverage={coverages.lapsed} asOf={AS_OF} maskIdentifiers />
      </div>
    </div>
  ),

  "medication-review": () => (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <MedicationList requests={medications.list} asOf={AS_OF} />
      <AllergyList allergies={allergies.list} />
    </div>
  ),
};

export function ShowcasePreview({
  slug,
  density,
}: {
  slug: string;
  density: "patient" | "standard" | "clinical";
}) {
  const render = COMPOSITIONS[slug];

  return (
    <div className="instrument instrument-demo">
      <InstrumentGlow />

      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live composition · synthetic data</span>
        </div>
        <span className="eyebrow hidden text-panel-muted/70 sm:block">{density} density</span>
      </div>

      <div data-ox-density={density} className="relative p-4 sm:p-5">
        {render ? (
          render()
        ) : (
          <p className="py-8 text-center text-sm text-panel-muted">Composition coming soon.</p>
        )}
      </div>
    </div>
  );
}

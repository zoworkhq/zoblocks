"use client";

/**
 * ComponentPreview — the live demo on a component detail page.
 *
 * Same idea as the homepage instrument: real components, real synthetic FHIR,
 * switchable states. A screenshot can show a component working; only this can
 * show it not-working gracefully, which is the actual claim.
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
} from "@oxygenui/fixtures";
import { PatientBanner } from "@/registry/oxygen/patient-banner/patient-banner";
import { ObservationPanel } from "@/registry/oxygen/vitals-panel/vitals-panel";
import { MedicationCard, MedicationList } from "@/registry/oxygen/medication-card/medication-card";
import { AllergyList } from "@/registry/oxygen/allergy-list/allergy-list";
import { AppointmentCard } from "@/registry/oxygen/appointment-card/appointment-card";
import { CoverageCard } from "@/registry/oxygen/coverage-card/coverage-card";
import { ConditionList } from "@/registry/oxygen/condition-list/condition-list";
import { StatusBadge } from "@/registry/oxygen/status-badge/status-badge";
import { InstrumentGlow } from "@/components/site/interactions";
import { cn } from "@/lib/utils";

const AS_OF = new Date("2026-08-03T00:00:00Z");
const TZ = "Asia/Kolkata";

type Density = "patient" | "standard" | "clinical";

interface Scenario {
  id: string;
  label: string;
  note: string;
  render: () => React.ReactNode;
}

const SCENARIOS: Record<string, Scenario[]> = {
  "patient-banner": [
    { id: "routine", label: "Routine", note: "Complete demographics. The easy case.", render: () => <PatientBanner patient={patients.routine} asOf={AS_OF} /> },
    { id: "restricted", label: "Restricted", note: "Confidentiality label on meta.security, identifiers masked for a shared screen.", render: () => <PatientBanner patient={patients.restricted} maskIdentifiers asOf={AS_OF} /> },
    { id: "deceased", label: "Deceased", note: "Stated unambiguously, in text and icon — never by styling alone.", render: () => <PatientBanner patient={patients.deceased} asOf={AS_OF} /> },
    { id: "sparse", label: "Missing data", note: "No name, no birth date. Absence reads as absence.", render: () => <PatientBanner patient={patients.sparse} asOf={AS_OF} /> },
    { id: "loading", label: "Loading", note: "Skeleton carries aria-busy and an accessible label.", render: () => <PatientBanner patient={undefined} loading /> },
  ],
  "vitals-panel": [
    { id: "critical", label: "Critical", note: "Severity reaches the reader three ways: badge, left rule, and a live-region announcement.", render: () => <ObservationPanel observations={observations.panel} label="Chemistry panel" /> },
    { id: "routine", label: "Routine", note: "Interpreted results with reference ranges.", render: () => <ObservationPanel observations={[observations.heartRate, observations.hemoglobinLow]} /> },
    { id: "uninterpreted", label: "Uninterpreted", note: "No range, no stated interpretation. Reads “Not interpreted” — never “Normal”.", render: () => <ObservationPanel observations={[observations.uninterpreted, observations.absent, observations.preliminary]} /> },
    { id: "empty", label: "Empty", note: "An empty result set states so rather than rendering a bare table.", render: () => <ObservationPanel observations={[]} /> },
    { id: "loading", label: "Loading", note: "Skeleton rows preserve the table's shape.", render: () => <ObservationPanel observations={undefined} loading /> },
  ],
  "medication-card": [
    { id: "list", label: "Full list", note: "Active, on hold, expired, and stopped — each with its own label and tone.", render: () => <MedicationList requests={medications.list} asOf={AS_OF} /> },
    { id: "hold", label: "On hold", note: "Paused deliberately, with the reason recorded. Must not read as stopped.", render: () => <MedicationCard request={medications.onHold} asOf={AS_OF} /> },
    { id: "expired", label: "Expired", note: "Still `active` in the payload, but past its dispense validity period.", render: () => <MedicationCard request={medications.expired} asOf={AS_OF} /> },
    { id: "sparse", label: "No dosage", note: "Missing dosage instruction is stated, not left blank.", render: () => <MedicationCard request={medications.noDosage} asOf={AS_OF} /> },
    { id: "loading", label: "Loading", note: "Skeleton state.", render: () => <MedicationCard request={undefined} loading /> },
  ],
  "allergy-list": [
    { id: "list", label: "Recorded", note: "High-risk first, with unconfirmed and refuted entries clearly marked.", render: () => <AllergyList allergies={allergies.list} /> },
    { id: "nka", label: "No known allergies", note: "An assertion someone actually recorded. Positive, confirmed state.", render: () => <AllergyList allergies={[]} noKnownAllergies /> },
    { id: "unrecorded", label: "Not recorded", note: "Nobody has asked. Visually distinct from no-known-allergies — this is the distinction the component exists for.", render: () => <AllergyList allergies={[]} /> },
    { id: "loading", label: "Loading", note: "Skeleton state.", render: () => <AllergyList allergies={undefined} loading /> },
  ],
  "appointment-card": [
    { id: "booked", label: "Booked", note: "Time zone rendered explicitly beside the time.", render: () => <AppointmentCard appointment={appointments.booked} timeZone={TZ} /> },
    { id: "virtual", label: "Virtual", note: "Modality is a text label, not an icon alone.", render: () => <AppointmentCard appointment={appointments.virtual} timeZone={TZ} /> },
    { id: "noshow", label: "No-show", note: "Operationally distinct from a cancellation — follow-up usually depends on it.", render: () => <AppointmentCard appointment={appointments.noShow} timeZone={TZ} /> },
    { id: "cancelled", label: "Cancelled", note: "Cancellation reason surfaced rather than dropped.", render: () => <AppointmentCard appointment={appointments.cancelled} timeZone={TZ} /> },
    { id: "loading", label: "Loading", note: "Skeleton state.", render: () => <AppointmentCard appointment={undefined} timeZone={TZ} loading /> },
  ],
  "coverage-card": [
    { id: "active", label: "Active", note: "Status active and inside its period.", render: () => <CoverageCard coverage={coverages.active} asOf={AS_OF} /> },
    { id: "lapsed", label: "Lapsed", note: "Status says active; the period ended in 2025. This is the trap the component exists to catch.", render: () => <CoverageCard coverage={coverages.lapsed} asOf={AS_OF} /> },
    { id: "future", label: "Not yet effective", note: "Starts next year — not usable today.", render: () => <CoverageCard coverage={coverages.future} asOf={AS_OF} /> },
    { id: "masked", label: "Masked", note: "Member and group identifiers masked for a front-desk screen.", render: () => <CoverageCard coverage={coverages.active} asOf={AS_OF} maskIdentifiers /> },
    { id: "loading", label: "Loading", note: "Skeleton state.", render: () => <CoverageCard coverage={undefined} loading /> },
  ],
  "condition-list": [
    { id: "list", label: "Problem list", note: "Active problems first; resolved collapsed into their own group.", render: () => <ConditionList conditions={conditions.list} /> },
    { id: "flat", label: "Not separated", note: "separateInactive off — everything in one sequence.", render: () => <ConditionList conditions={conditions.list} separateInactive={false} /> },
    { id: "empty", label: "Empty", note: "No problems recorded.", render: () => <ConditionList conditions={[]} /> },
    { id: "loading", label: "Loading", note: "Skeleton state.", render: () => <ConditionList conditions={undefined} loading /> },
  ],
  "status-badge": [
    {
      id: "tones",
      label: "All tones",
      note: "Six tones, each mapping to a status token. A caller passes meaning, never a color.",
      render: () => (
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="critical">Critical high</StatusBadge>
          <StatusBadge tone="high">High</StatusBadge>
          <StatusBadge tone="low">Low</StatusBadge>
          <StatusBadge tone="normal">Normal</StatusBadge>
          <StatusBadge tone="unknown">Not interpreted</StatusBadge>
          <StatusBadge tone="neutral">Completed</StatusBadge>
        </div>
      ),
    },
    {
      id: "sizes",
      label: "Sizes",
      note: "Two sizes. Both keep the label — there is no icon-only variant.",
      render: () => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="critical" size="sm">Small</StatusBadge>
          <StatusBadge tone="critical" size="md">Medium</StatusBadge>
        </div>
      ),
    },
  ],
};

const DENSITIES: Density[] = ["patient", "standard", "clinical"];

export function ComponentPreview({ name }: { name: string }) {
  const scenarios = SCENARIOS[name];
  const [scenarioId, setScenarioId] = React.useState(scenarios?.[0]?.id ?? "");
  const [density, setDensity] = React.useState<Density>("standard");

  if (!scenarios?.length) {
    return (
      <div className="instrument flex items-center justify-center px-6 py-16">
        <p className="text-sm text-graphite-soft">Live preview coming with the next release.</p>
      </div>
    );
  }

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]!;

  return (
    <div className="instrument">
      <InstrumentGlow />

      <div className="relative flex items-center justify-between gap-4 border-b border-ink-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-graphite-soft">Live · synthetic data</span>
        </div>
        <div className="flex items-center gap-1">
          {DENSITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDensity(item)}
              aria-pressed={density === item}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-200",
                density === item ? "bg-paper/10 text-paper" : "text-graphite-soft hover:text-paper/80",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div data-theme="dark" data-ox-density={density} className="relative p-4 sm:p-6">
        {scenario.render()}
      </div>

      <div className="relative border-t border-ink-rule bg-[#060d0c]/60 px-3 py-3 sm:px-4">
        <div role="tablist" aria-label="Component state" className="flex flex-wrap gap-1.5">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scenario.id}
              onClick={() => setScenarioId(item.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider",
                "transition-all duration-200 ease-[var(--ease-out-expo)]",
                item.id === scenario.id
                  ? "bg-trace/12 text-trace ring-1 ring-trace/35"
                  : "text-graphite-soft hover:bg-paper/6 hover:text-paper/85",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p key={scenario.id} className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-graphite-soft">
          {scenario.note}
        </p>
      </div>
    </div>
  );
}

"use client";

/**
 * LiveInstrument — the hero.
 *
 * Not a screenshot and not a decorative mock: the actual registry components,
 * mounted against the actual synthetic FHIR fixtures, driven through the
 * states a real chart hits.
 *
 * This is the demo a generic component library cannot run. Showing "Critical",
 * "Preliminary", "Restricted", and "No value" as first-class, switchable
 * states *is* the product argument — every one of them is a case a marketing
 * screenshot would quietly omit and a real patient would eventually hit.
 */

import * as React from "react";
import {
  Activity,
  CircleAlert,
  EyeOff,
  FileQuestion,
  Loader,
  ShieldAlert,
} from "lucide-react";
import {
  observationPanel,
  observations,
  patients,
} from "@oxygenui/fixtures";
import type { Observation, Patient } from "@oxygenui/fhir";
import { PatientBanner } from "@/registry/oxygen/patient-banner/patient-banner";
import { ObservationPanel } from "@/registry/oxygen/vitals-panel/vitals-panel";
import { InstrumentGlow } from "@/components/site/interactions";
import { TelemetryTrace, type TraceMode } from "@/components/site/telemetry-trace";
import { cn } from "@/lib/utils";

// Fixed so age never drifts and screenshots stay reproducible.
const AS_OF = new Date("2026-08-03T00:00:00Z");

type Density = "patient" | "standard" | "clinical";

interface Scenario {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** What this state teaches. Shown under the rail. */
  note: string;
  patient: Patient | undefined;
  observations: Observation[] | undefined;
  trace: TraceMode;
  loading?: boolean;
  mask?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: "routine",
    label: "Routine",
    icon: Activity,
    note: "Everything present and interpreted. The easy case — and the only one most libraries ship.",
    patient: patients.routine,
    observations: [observations.heartRate, observations.hemoglobinLow, observations.uninterpreted],
    trace: "normal",
  },
  {
    id: "critical",
    label: "Critical result",
    icon: CircleAlert,
    note: "Severity reaches the reader three ways: badge, left rule, and a live-region announcement before the table is read.",
    patient: patients.routine,
    observations: observationPanel,
    trace: "critical",
  },
  {
    id: "uninterpreted",
    label: "Uninterpreted",
    icon: FileQuestion,
    note: "No reference range, no stated interpretation. Reads “Not interpreted” — never “Normal”. Defaulting here manufactures false reassurance.",
    patient: patients.routine,
    observations: [observations.uninterpreted, observations.absent, observations.preliminary],
    trace: "quiet",
  },
  {
    id: "restricted",
    label: "Restricted record",
    icon: ShieldAlert,
    note: "Confidentiality label on meta.security, identifiers masked for a shared screen. Display only — access control stays on your server.",
    patient: patients.restricted,
    observations: [observations.heartRate],
    trace: "quiet",
    mask: true,
  },
  {
    id: "sparse",
    label: "Missing data",
    icon: EyeOff,
    note: "No name, no birth date. Absence reads as absence — a blank cell is indistinguishable from a render failure.",
    patient: patients.sparse,
    observations: [],
    trace: "quiet",
  },
  {
    id: "loading",
    label: "Loading",
    icon: Loader,
    note: "Skeletons carry aria-busy and an accessible label, so the wait is announced rather than silent.",
    patient: undefined,
    observations: undefined,
    trace: "quiet",
    loading: true,
  },
];

const DENSITIES: Array<{ id: Density; label: string; hint: string }> = [
  { id: "patient", label: "Patient", hint: "Patient-facing surfaces" },
  { id: "standard", label: "Standard", hint: "General admin and SaaS" },
  { id: "clinical", label: "Clinical", hint: "Dense worklists and flowsheets" },
];

export function LiveInstrument() {
  const [scenarioId, setScenarioId] = React.useState(SCENARIOS[0]!.id);
  const [density, setDensity] = React.useState<Density>("standard");

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!;

  return (
    <div className="instrument">
      <InstrumentGlow />

      {/* Bezel header — reads as an instrument label strip. */}
      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live components · synthetic data</span>
        </div>
        <span className="eyebrow hidden text-panel-muted/70 sm:block">FHIR R4</span>
      </div>

      {/* The trace responds to whichever state is selected. */}
      <div className="relative border-b border-panel-rule/60">
        <TelemetryTrace mode={scenario.trace} height={52} />
      </div>

      {/* The components themselves, in the dark theme with live density. */}
      <div
        data-theme="dark"
        data-ox-density={density}
        className="relative space-y-3 p-4 sm:p-5"
      >
        <PatientBanner headingLevel={3} patient={scenario.patient}
          loading={scenario.loading}
          maskIdentifiers={scenario.mask}
          asOf={AS_OF}
        />
        <ObservationPanel
          observations={scenario.observations}
          loading={scenario.loading}
          label="Results"
          emptyMessage="No results recorded for this patient."
        />
      </div>

      {/* State rail */}
      <div className="relative border-t border-panel-rule bg-[#060d0c]/60 px-3 py-3 sm:px-4">
        <div
          role="tablist"
          aria-label="Component state"
          className="flex flex-wrap gap-1.5"
        >
          {SCENARIOS.map((item) => {
            const Icon = item.icon;
            const active = item.id === scenario.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setScenarioId(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                  "font-mono text-[0.6875rem] uppercase tracking-wider",
                  "transition-all duration-200 ease-[var(--ease-out-expo)]",
                  active
                    ? item.trace === "critical"
                      ? "bg-critical-lum/12 text-critical-lum ring-1 ring-critical-lum/35"
                      : "bg-trace/12 text-trace ring-1 ring-trace/35"
                    : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
                )}
              >
                <Icon aria-hidden="true" className="size-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Keyed so the note re-animates on change — a small confirmation that
            the selection registered, without moving anything else. */}
        <p
          key={scenario.id}
          className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted"
        >
          {scenario.note}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-panel-rule/70 pt-3">
          <span className="eyebrow mr-1 text-panel-muted/70">Density</span>
          {DENSITIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDensity(item.id)}
              aria-pressed={density === item.id}
              title={item.hint}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition-colors duration-200",
                density === item.id
                  ? "bg-panel-fg/10 text-panel-fg"
                  : "text-panel-muted hover:text-panel-fg/80",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

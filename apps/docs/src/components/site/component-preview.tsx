"use client";

/**
 * ComponentPreview — the live demo on a component detail page.
 *
 * Same idea as the homepage instrument: real components, real synthetic FHIR,
 * switchable states. A screenshot can show a component working; only this can
 * show it not-working gracefully, which is the actual claim.
 */

import * as React from "react";
import type { Observation } from "@oxygenui-design/fhir";
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
import { ObservationTrend } from "@/registry/oxygen/observation-trend/observation-trend";
import { MedicationCard, MedicationList } from "@/registry/oxygen/medication-card/medication-card";
import { AllergyList } from "@/registry/oxygen/allergy-list/allergy-list";
import { AppointmentCard } from "@/registry/oxygen/appointment-card/appointment-card";
import { CoverageCard } from "@/registry/oxygen/coverage-card/coverage-card";
import { ConditionList } from "@/registry/oxygen/condition-list/condition-list";
import { StatusBadge } from "@/registry/oxygen/status-badge/status-badge";
import { AbsentValue } from "@/registry/oxygen/absent-value/absent-value";
import { ClinicalValue } from "@/registry/oxygen/clinical-value/clinical-value";
import { ReferenceRange } from "@/registry/oxygen/reference-range/reference-range";
import { ClinicalTime } from "@/registry/oxygen/clinical-time/clinical-time";
import { IdentityToken } from "@/registry/oxygen/identity-token/identity-token";
import { ConceptChip } from "@/registry/oxygen/concept-chip/concept-chip";
import { DensityProvider } from "@/registry/oxygen/density-provider/density-provider";
import { RestrictedShield } from "@/registry/oxygen/restricted-shield/restricted-shield";
import { ActionGate } from "@/registry/oxygen/action-gate/action-gate";
import { EmptyState } from "@/registry/oxygen/empty-state/empty-state";
import {
  ClinicalSkeleton,
  ProgressiveSection,
} from "@/registry/oxygen/clinical-skeleton/clinical-skeleton";
import { DoseInput } from "@/registry/oxygen/dose-input/dose-input";
import { ProvenanceTag } from "@/registry/oxygen/provenance/provenance";
import { SaveStatus } from "@/registry/oxygen/unsaved-guard/unsaved-guard";
import { ClinicalErrorBoundary } from "@/registry/oxygen/error-boundary/error-boundary";
import { AppShell } from "@/registry/oxygen/app-shell/app-shell";
import { CodeStatus } from "@/registry/oxygen/code-status/code-status";
import { PrecautionsBar } from "@/registry/oxygen/precautions-bar/precautions-bar";
import { CareTeamPanel } from "@/registry/oxygen/care-team/care-team";
import { AlertBanner } from "@/registry/oxygen/alert-banner/alert-banner";
import { PatientSnapshot } from "@/registry/oxygen/patient-snapshot/patient-snapshot";
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

/**
 * A rising potassium. The point of the trend component in one dataset: every
 * one of these values read alone is a different conversation from the four of
 * them read together.
 */
function potassiumSeries(): Observation[] {
  const days = [
    ["2026-07-30T08:10:00Z", 4.1, undefined],
    ["2026-07-31T08:05:00Z", 4.6, undefined],
    ["2026-08-01T08:20:00Z", 5.0, undefined],
    ["2026-08-02T07:55:00Z", 5.6, "H"],
    ["2026-08-03T08:00:00Z", 6.8, "HH"],
  ] as const;

  return days.map(([when, value, interpretation]) => ({
    resourceType: "Observation" as const,
    status: "final" as const,
    code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
    effectiveDateTime: when,
    valueQuantity: { value, unit: "mmol/L" },
    interpretation: interpretation ? [{ coding: [{ code: interpretation }] }] : undefined,
    referenceRange: [{ low: { value: 3.5 }, high: { value: 5.3, unit: "mmol/L" } }],
  }));
}

const SCENARIOS: Record<string, Scenario[]> = {
  "observation-trend": [
    {
      id: "rising",
      label: "A rising potassium",
      note: "Each value read alone is a different conversation from the five read together. Shape carries direction, so the escalation survives monochrome and colour vision deficiency.",
      render: () => (
        <ObservationTrend observations={potassiumSeries()} timeZone={TZ} label="Potassium" />
      ),
    },
    {
      id: "no-range",
      label: "No reference range",
      note: "No stated bound means no band. An invented normal band reads as the definition of normal for the whole series.",
      render: () => (
        <ObservationTrend
          observations={potassiumSeries().map((o) => ({ ...o, referenceRange: undefined }))}
          timeZone={TZ}
          label="Potassium"
        />
      ),
    },
    {
      id: "gaps",
      label: "Results that cannot be plotted",
      note: "Counted, never dropped. A trend built from five of seven results that presents itself as the whole series is worse than no chart.",
      render: () => (
        <ObservationTrend
          observations={[
            ...potassiumSeries(),
            {
              resourceType: "Observation",
              status: "final",
              code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
              effectiveDateTime: "2026-08-04T08:00:00Z",
              dataAbsentReason: { coding: [{ code: "error" }] },
            },
            {
              resourceType: "Observation",
              status: "final",
              code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
              valueQuantity: { value: 5.2, unit: "mmol/L" },
            },
          ]}
          timeZone={TZ}
          label="Potassium"
        />
      ),
    },
    {
      id: "refusal",
      label: "When it refuses to draw",
      note: "Two units on one axis would render a unit change as a cliff in the patient. The drawing is withheld; the table stays correct because it carries a unit per row.",
      render: () => (
        <ObservationTrend
          observations={[
            ...potassiumSeries().slice(0, 3),
            {
              resourceType: "Observation",
              status: "final",
              code: { text: "Potassium", coding: [{ system: "http://loinc.org", code: "2823-3" }] },
              effectiveDateTime: "2026-08-03T08:00:00Z",
              valueQuantity: { value: 21.9, unit: "mg/dL" },
            },
          ]}
          timeZone={TZ}
          label="Potassium"
        />
      ),
    },
  ],
  "patient-banner": [
    {
      id: "routine",
      label: "Routine",
      note: "Complete demographics. The easy case.",
      render: () => <PatientBanner headingLevel={3} patient={patients.routine} asOf={AS_OF} />,
    },
    {
      id: "restricted",
      label: "Restricted",
      note: "Confidentiality label on meta.security, identifiers masked for a shared screen.",
      render: () => (
        <PatientBanner
          headingLevel={3}
          patient={patients.restricted}
          maskIdentifiers
          asOf={AS_OF}
        />
      ),
    },
    {
      id: "deceased",
      label: "Deceased",
      note: "Stated unambiguously, in text and icon — never by styling alone.",
      render: () => <PatientBanner headingLevel={3} patient={patients.deceased} asOf={AS_OF} />,
    },
    {
      id: "sparse",
      label: "Missing data",
      note: "No name, no birth date. Absence reads as absence.",
      render: () => <PatientBanner headingLevel={3} patient={patients.sparse} asOf={AS_OF} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton carries aria-busy and an accessible label.",
      render: () => <PatientBanner headingLevel={3} patient={undefined} loading />,
    },
  ],
  "vitals-panel": [
    {
      id: "critical",
      label: "Critical",
      note: "Severity reaches the reader three ways: badge, left rule, and a live-region announcement.",
      render: () => <ObservationPanel observations={observations.panel} label="Chemistry panel" />,
    },
    {
      id: "routine",
      label: "Routine",
      note: "Interpreted results with reference ranges.",
      render: () => (
        <ObservationPanel observations={[observations.heartRate, observations.hemoglobinLow]} />
      ),
    },
    {
      id: "uninterpreted",
      label: "Uninterpreted",
      note: "No range, no stated interpretation. Reads “Not interpreted” — never “Normal”.",
      render: () => (
        <ObservationPanel
          observations={[observations.uninterpreted, observations.absent, observations.preliminary]}
        />
      ),
    },
    {
      id: "empty",
      label: "Empty",
      note: "An empty result set states so rather than rendering a bare table.",
      render: () => <ObservationPanel observations={[]} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton rows preserve the table's shape.",
      render: () => <ObservationPanel observations={undefined} loading />,
    },
  ],
  "medication-card": [
    {
      id: "list",
      label: "Full list",
      note: "Active, on hold, expired, and stopped — each with its own label and tone.",
      render: () => <MedicationList requests={medications.list} asOf={AS_OF} />,
    },
    {
      id: "hold",
      label: "On hold",
      note: "Paused deliberately, with the reason recorded. Must not read as stopped.",
      render: () => <MedicationCard request={medications.onHold} asOf={AS_OF} />,
    },
    {
      id: "expired",
      label: "Expired",
      note: "Still `active` in the payload, but past its dispense validity period.",
      render: () => <MedicationCard request={medications.expired} asOf={AS_OF} />,
    },
    {
      id: "sparse",
      label: "No dosage",
      note: "Missing dosage instruction is stated, not left blank.",
      render: () => <MedicationCard request={medications.noDosage} asOf={AS_OF} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton state.",
      render: () => <MedicationCard request={undefined} loading />,
    },
  ],
  "allergy-list": [
    {
      id: "list",
      label: "Recorded",
      note: "High-risk first, with unconfirmed and refuted entries clearly marked.",
      render: () => <AllergyList allergies={allergies.list} />,
    },
    {
      id: "nka",
      label: "No known allergies",
      note: "An assertion someone actually recorded. Positive, confirmed state.",
      render: () => <AllergyList allergies={[]} noKnownAllergies />,
    },
    {
      id: "unrecorded",
      label: "Not recorded",
      note: "Nobody has asked. Visually distinct from no-known-allergies — this is the distinction the component exists for.",
      render: () => <AllergyList allergies={[]} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton state.",
      render: () => <AllergyList allergies={undefined} loading />,
    },
  ],
  "appointment-card": [
    {
      id: "booked",
      label: "Booked",
      note: "Time zone rendered explicitly beside the time.",
      render: () => <AppointmentCard appointment={appointments.booked} timeZone={TZ} />,
    },
    {
      id: "virtual",
      label: "Virtual",
      note: "Modality is a text label, not an icon alone.",
      render: () => <AppointmentCard appointment={appointments.virtual} timeZone={TZ} />,
    },
    {
      id: "noshow",
      label: "No-show",
      note: "Operationally distinct from a cancellation — follow-up usually depends on it.",
      render: () => <AppointmentCard appointment={appointments.noShow} timeZone={TZ} />,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      note: "Cancellation reason surfaced rather than dropped.",
      render: () => <AppointmentCard appointment={appointments.cancelled} timeZone={TZ} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton state.",
      render: () => <AppointmentCard appointment={undefined} timeZone={TZ} loading />,
    },
  ],
  "coverage-card": [
    {
      id: "active",
      label: "Active",
      note: "Status active and inside its period.",
      render: () => <CoverageCard coverage={coverages.active} asOf={AS_OF} />,
    },
    {
      id: "lapsed",
      label: "Lapsed",
      note: "Status says active; the period ended in 2025. This is the trap the component exists to catch.",
      render: () => <CoverageCard coverage={coverages.lapsed} asOf={AS_OF} />,
    },
    {
      id: "future",
      label: "Not yet effective",
      note: "Starts next year — not usable today.",
      render: () => <CoverageCard coverage={coverages.future} asOf={AS_OF} />,
    },
    {
      id: "masked",
      label: "Masked",
      note: "Member and group identifiers masked for a front-desk screen.",
      render: () => <CoverageCard coverage={coverages.active} asOf={AS_OF} maskIdentifiers />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton state.",
      render: () => <CoverageCard coverage={undefined} loading />,
    },
  ],
  "condition-list": [
    {
      id: "list",
      label: "Problem list",
      note: "Active problems first; resolved collapsed into their own group.",
      render: () => <ConditionList conditions={conditions.list} />,
    },
    {
      id: "flat",
      label: "Not separated",
      note: "separateInactive off — everything in one sequence.",
      render: () => <ConditionList conditions={conditions.list} separateInactive={false} />,
    },
    {
      id: "empty",
      label: "Empty",
      note: "No problems recorded.",
      render: () => <ConditionList conditions={[]} />,
    },
    {
      id: "loading",
      label: "Loading",
      note: "Skeleton state.",
      render: () => <ConditionList conditions={undefined} loading />,
    },
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
          <StatusBadge tone="critical" size="sm">
            Small
          </StatusBadge>
          <StatusBadge tone="critical" size="md">
            Medium
          </StatusBadge>
        </div>
      ),
    },
  ],

  "absent-value": [
    {
      id: "reasons",
      label: "Every reason",
      note: "Fifteen FHIR codes collapsed to the groups a reader must act on differently. None of them is a dash.",
      render: () => (
        <dl className="grid gap-2 text-[length:var(--ox-text-sm)] sm:grid-cols-2">
          {(
            [
              ["Magnesium", "not-collected"],
              ["Smoking status", "declined"],
              ["Bicarbonate", "pending"],
              ["Toxicology screen", "masked"],
              ["Albumin", "error"],
              ["Last menstrual period", "not-applicable"],
            ] as const
          ).map(([field, reason]) => (
            <div key={reason} className="flex items-baseline justify-between gap-3">
              <dt className="text-[var(--ox-text-muted)]">{field}</dt>
              <dd>
                <AbsentValue reason={reason} />
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "unstated",
      label: "No reason given",
      note: "The most common real case. Absence with nothing stated still renders text — never blank, never a zero.",
      render: () => (
        <dl className="grid gap-2 text-[length:var(--ox-text-sm)] sm:grid-cols-2">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[var(--ox-text-muted)]">Potassium</dt>
            <dd>
              <AbsentValue field="Potassium" />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[var(--ox-text-muted)]">White cell count</dt>
            <dd>
              <AbsentValue field="White cell count" reason={observations.absent.dataAbsentReason} />
            </dd>
          </div>
        </dl>
      ),
    },
    {
      id: "restricted",
      label: "Withheld, not absent",
      note: "The distinction the component exists for. Read as “not recorded”, a clinician concludes the chart is empty when it is not.",
      render: () => (
        <div className="grid gap-3">
          <AbsentValue
            variant="block"
            field="Toxicology screen"
            reason="masked"
            onRequestAccess={() => {}}
          />
          <AbsentValue variant="block" field="Magnesium" reason="not-collected" />
        </div>
      ),
    },
    {
      id: "in-context",
      label: "In a results table",
      note: "Five absent paths in one panel. The reason travels with the row rather than collapsing to an empty cell.",
      render: () => <ObservationPanel observations={observations.absentSet} />,
    },
  ],

  "clinical-value": [
    {
      id: "precision",
      label: "Precision & comparators",
      note: "Reported precision is never changed, and a comparator survives — <0.01 is not 0.01.",
      render: () => (
        <dl className="grid gap-2 text-[length:var(--ox-text-sm)] sm:grid-cols-2">
          {[
            ["Potassium", { value: 6.8, unit: "mmol/L" }, "critical" as const],
            ["Sodium", { value: 138, unit: "mmol/L" }, "normal" as const],
            [
              "Troponin",
              { value: 0.01, comparator: "<" as const, unit: "ng/mL" },
              "default" as const,
            ],
            ["HbA1c", { value: 5.7, unit: "%" }, "normal" as const],
          ].map(([label, quantity, tone]) => (
            <div key={label as string} className="flex items-baseline justify-between gap-3">
              <dt className="text-[var(--ox-text-muted)]">{label as string}</dt>
              <dd>
                <ClinicalValue
                  quantity={quantity as never}
                  tone={tone as never}
                  bold={tone === "critical"}
                />
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "sizes",
      label: "Sizes",
      note: "The same element from a dense grid cell to a patient-facing hero number.",
      render: () => (
        <div className="flex flex-wrap items-baseline gap-5">
          <ClinicalValue quantity={{ value: 120, unit: "mmHg" }} size="sm" />
          <ClinicalValue quantity={{ value: 120, unit: "mmHg" }} size="md" />
          <ClinicalValue quantity={{ value: 120, unit: "mmHg" }} size="lg" />
          <ClinicalValue quantity={{ value: 120, unit: "mmHg" }} size="hero" tone="normal" bold />
        </div>
      ),
    },
    {
      id: "absent",
      label: "No value",
      note: "There is no code path here that renders an empty string — absence routes to AbsentValue.",
      render: () => (
        <div className="flex flex-col gap-2">
          <ClinicalValue field="Magnesium" absentReason={observations.notAsked.dataAbsentReason} />
          <ClinicalValue field="Toxicology" absentReason={observations.masked.dataAbsentReason} />
          <ClinicalValue field="White cell count" />
        </div>
      ),
    },
  ],

  "reference-range": [
    {
      id: "positions",
      label: "How far out",
      note: "A badge says “high”. The bar says whether it is 5.2 or 6.8, which is a different afternoon.",
      render: () => (
        <div className="flex flex-col gap-3 text-[length:var(--ox-text-sm)]">
          {[
            ["Potassium 4.3", 4.3, "normal"],
            ["Potassium 5.4", 5.4, "high"],
            ["Potassium 6.8", 6.8, "critical-high"],
            ["Potassium 12.0", 12, "critical-high"],
          ].map(([label, value, interp]) => (
            <div
              key={label as string}
              className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3"
            >
              <span className="text-[var(--ox-text-muted)]">{label as string}</span>
              <ReferenceRange
                value={value as number}
                range={{ low: { value: 3.5 }, high: { value: 5.1, unit: "mmol/L" } }}
                interpretation={interp as never}
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "refusals",
      label: "When it refuses to draw",
      note: "No numeric bound means no bar. A drawn scale would imply bounds nobody stated.",
      render: () => (
        <div className="flex flex-col gap-3 text-[length:var(--ox-text-sm)]">
          <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-[var(--ox-text-muted)]">One-sided</span>
            <ReferenceRange
              value={4.9}
              range={{ high: { value: 5.7, unit: "%" } }}
              interpretation="normal"
            />
          </div>
          <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-[var(--ox-text-muted)]">Text-only range</span>
            <ReferenceRange value={0.74} range={{ text: "See report" }} />
          </div>
          <div className="grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-3">
            <span className="text-[var(--ox-text-muted)]">No range at all</span>
            <ReferenceRange value={0.74} />
          </div>
        </div>
      ),
    },
  ],

  "clinical-time": [
    {
      id: "precision",
      label: "Partial precision",
      note: "FHIR dateTime may be a year, a month, a day, or an instant. Rendering “2026” as 1 January invents a day.",
      render: () => (
        <div className="flex flex-col gap-2">
          <ClinicalTime value="2026-08-03T07:40:00Z" timeZone={TZ} showZone asOf={AS_OF} />
          <ClinicalTime value="2026-08-03" timeZone={TZ} asOf={AS_OF} />
          <ClinicalTime value="2026-08" timeZone={TZ} asOf={AS_OF} />
          <ClinicalTime value="2026" timeZone={TZ} asOf={AS_OF} />
          <ClinicalTime timeZone={TZ} asOf={AS_OF} />
        </div>
      ),
    },
    {
      id: "zones",
      label: "The same instant, four zones",
      note: "timeZone is required and has no default. The browser’s zone is the wrong answer often enough to be dangerous.",
      render: () => (
        <div className="flex flex-col gap-2">
          {["UTC", "America/New_York", "Asia/Kolkata", "Australia/Sydney"].map((zone) => (
            <div key={zone} className="grid grid-cols-[11rem_minmax(0,1fr)] items-center gap-3">
              <span className="font-mono text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
                {zone}
              </span>
              <ClinicalTime value="2026-08-03T02:00:00Z" timeZone={zone} showZone asOf={AS_OF} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "anomalies",
      label: "Charted late, dated wrong",
      note: "A dose given at 08:00 and charted at 11:20 is two facts. A future timestamp is almost always a data error.",
      render: () => (
        <div className="flex flex-col gap-2">
          <ClinicalTime
            value="2026-08-03T08:00:00Z"
            recorded="2026-08-03T11:20:00Z"
            timeZone={TZ}
            asOf={AS_OF}
          />
          <ClinicalTime value="2027-01-14T09:00:00Z" timeZone={TZ} asOf={AS_OF} />
          <ClinicalTime value="2026-08-03T06:42:00Z" timeZone={TZ} display="both" asOf={AS_OF} />
        </div>
      ),
    },
  ],

  "identity-token": [
    {
      id: "states",
      label: "Identity states",
      note: "Restricted and deceased are words, not icons a reader has to know. A missing name is not a blank.",
      render: () => (
        <div className="flex flex-col gap-3">
          <IdentityToken patient={patients.routine} asOf={AS_OF} />
          <IdentityToken patient={patients.restricted} asOf={AS_OF} />
          <IdentityToken patient={patients.deceased} asOf={AS_OF} />
          <IdentityToken patient={patients.sparse} asOf={AS_OF} />
        </div>
      ),
    },
    {
      id: "collision",
      label: "Name-alike",
      note: "The collision the component exists to interrupt. Detection is list-level; the warning is not optional.",
      render: () => (
        <div className="flex flex-col gap-3">
          <IdentityToken patient={patients.routine} asOf={AS_OF} nameAlike />
          <IdentityToken patient={patients.routine} asOf={AS_OF} maskIdentifiers />
        </div>
      ),
    },
    {
      id: "sizes",
      label: "Sizes",
      note: "Avatar-only still carries the full identity to assistive technology.",
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          <IdentityToken patient={patients.routine} size="sm" asOf={AS_OF} />
          <IdentityToken patient={patients.routine} size="lg" asOf={AS_OF} />
          <IdentityToken patient={patients.routine} avatarOnly asOf={AS_OF} />
        </div>
      ),
    },
  ],

  "concept-chip": [
    {
      id: "coded",
      label: "Coded concepts",
      note: "Select a chip to see the coding. Clinicians read text; audits and integrations need the code.",
      render: () => (
        <div className="flex flex-wrap gap-2">
          <ConceptChip concept={observations.potassiumCritical.code} />
          <ConceptChip concept={observations.heartRate.code} showSystem />
          <ConceptChip concept={conditions.active.code} />
        </div>
      ),
    },
    {
      id: "gaps",
      label: "What is missing",
      note: "Text with no coding cannot drive a rule or a report, and an unrecognised system is a mapping problem worth seeing.",
      render: () => (
        <div className="flex flex-wrap gap-2">
          <ConceptChip concept={{ text: "Chest pain, atypical" }} />
          <ConceptChip
            concept={{
              coding: [
                { system: "http://example.org/local", code: "LOC-42", display: "Local code" },
              ],
            }}
          />
          <ConceptChip
            concept={observations.heartRate.code}
            expectedCodes={["http://loinc.org|2823-3"]}
          />
          <ConceptChip />
        </div>
      ),
    },
  ],

  "density-provider": [
    {
      id: "three",
      label: "One component, three densities",
      note: "Spacing and target size change. Which clinical facts appear does not — hiding a fact to save a row is a defect.",
      render: () => (
        <div className="flex flex-col gap-4">
          {(["patient", "standard", "clinical"] as const).map((mode) => (
            <div key={mode}>
              <p className="mb-1 font-mono text-[length:var(--ox-text-2xs)] uppercase tracking-wider text-[var(--ox-text-subtle)]">
                {mode}
              </p>
              <DensityProvider density={mode}>
                <ObservationPanel observations={observations.panel.slice(0, 3)} />
              </DensityProvider>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "nested",
      label: "Nesting",
      note: "A patient-facing card inside a clinical worklist keeps its own density. Innermost wins.",
      render: () => (
        <DensityProvider
          density="clinical"
          className="rounded-[var(--ox-radius)] border border-[var(--ox-border)] p-3"
        >
          <p className="mb-2 font-mono text-[length:var(--ox-text-2xs)] uppercase tracking-wider text-[var(--ox-text-subtle)]">
            clinical
          </p>
          <ObservationPanel observations={observations.panel.slice(0, 2)} />
          <DensityProvider density="patient" className="mt-3">
            <p className="mb-2 font-mono text-[length:var(--ox-text-2xs)] uppercase tracking-wider text-[var(--ox-text-subtle)]">
              patient, nested
            </p>
            <ObservationPanel observations={observations.panel.slice(0, 2)} />
          </DensityProvider>
        </DensityProvider>
      ),
    },
  ],

  "restricted-shield": [
    {
      id: "disclose",
      label: "Break the glass",
      note: "Redacted by default. Disclosure needs a stated reason and re-hides on its own — try it.",
      render: () => (
        <RestrictedShield restricted category="Substance use — 42 CFR Part 2" durationSeconds={20}>
          <ObservationPanel observations={[observations.masked, observations.potassiumCritical]} />
        </RestrictedShield>
      ),
    },
    {
      id: "denied",
      label: "Disclosure not permitted",
      note: "Different from being able to ask and choosing not to. The content is acknowledged; the path is not offered.",
      render: () => (
        <RestrictedShield
          restricted
          disclosurePermitted={false}
          category="Adolescent confidential record"
        >
          <ObservationPanel observations={[observations.masked]} />
        </RestrictedShield>
      ),
    },
  ],

  "action-gate": [
    {
      id: "modes",
      label: "Friction by consequence",
      note: "Each dialog names the effect and the patient. “Are you sure?” asks the reader to re-derive what they were unsure about.",
      render: () => (
        <div className="flex flex-wrap gap-2">
          <ActionGate
            action="Acknowledge"
            consequence="The critical potassium result will be marked as reviewed by you, with a timestamp."
            patientName="Marisol Reyes-Okonkwo"
            onConfirm={() => {}}
          />
          <ActionGate
            action="Discontinue"
            consequence="Lisinopril 10 mg stops immediately and no further doses will be dispensed."
            patientName="Marisol Reyes-Okonkwo"
            reversible={false}
            reasons={["Adverse reaction", "No longer indicated", "Patient request"]}
            destructive
            onConfirm={() => {}}
          />
          <ActionGate
            action="Cancel appointment"
            consequence="The 09:30 telehealth visit is released and the patient is notified."
            patientName="Léa Fontaine"
            reversible={false}
            mode="hold"
            destructive
            onConfirm={() => {}}
          />
        </div>
      ),
    },
  ],

  "empty-state": [
    {
      id: "five",
      label: "Five reasons",
      note: "“Unavailable” rendered as “no results” tells a clinician the patient has no allergies when the service was down.",
      render: () => (
        <div className="grid gap-3 sm:grid-cols-2">
          <EmptyState
            reason="never"
            title="No allergy information recorded"
            description="This is not the same as no known allergies. Ask and record before prescribing."
          />
          <EmptyState
            reason="unavailable"
            title="Allergies could not be loaded"
            description="The source system did not respond. Do not read this section as complete."
            lastCheckedLabel="Last read 08:41"
          />
          <EmptyState
            reason="filtered"
            title="No results match these filters"
            description="12 results are hidden by the active filters."
          />
          <EmptyState
            reason="pending"
            title="Ordered, not yet resulted"
            description="Expected within 4 hours."
          />
        </div>
      ),
    },
    {
      id: "compact",
      label: "Compact",
      note: "Single-line rendering for table cells and clinical density, with the distinction intact.",
      render: () => (
        <div className="flex flex-col gap-2">
          <EmptyState compact reason="never" title="No problems recorded" />
          <EmptyState compact reason="unavailable" title="Problem list unavailable" />
          <EmptyState compact reason="restricted" title="Restricted — not shown" />
        </div>
      ),
    },
  ],

  "clinical-skeleton": [
    {
      id: "partial",
      label: "Partial failure",
      note: "The dangerous screen renders five sections and silently omits the sixth. Here the sixth says so.",
      render: () => (
        <div className="flex flex-col gap-3">
          <ProgressiveSection state="loaded" label="Vitals">
            <ObservationPanel observations={observations.panel.slice(0, 2)} />
          </ProgressiveSection>
          <ProgressiveSection
            state="failed"
            label="Medications"
            failureDetail="The pharmacy system did not respond."
            onRetry={() => {}}
          />
          <ProgressiveSection state="stale" label="Allergies" cachedAtLabel="08:41">
            <ObservationPanel observations={observations.panel.slice(2, 3)} />
          </ProgressiveSection>
          <ProgressiveSection state="loading" label="Problems" skeletonRows={2} />
        </div>
      ),
    },
    {
      id: "shapes",
      label: "Shaped like layout",
      note: "Never shaped like a value. A skeleton in the shape of a lab result invites the reader to fill in the blank.",
      render: () => (
        <div className="grid gap-4 sm:grid-cols-3">
          <ClinicalSkeleton rows={4} variant="text" />
          <ClinicalSkeleton rows={3} variant="row" />
          <ClinicalSkeleton rows={2} variant="card" />
        </div>
      ),
    },
  ],

  "dose-input": [
    {
      id: "ismp",
      label: "ISMP rules",
      note: "Type 1.0 or .5 — both are flagged with the corrected form offered, never applied silently.",
      render: () => <DoseInputDemo initial="1.0" plausibleMax={40} absoluteMax={80} />,
    },
    {
      id: "limits",
      label: "Warning vs block",
      note: "A dose can be unusual and correct. 50 warns and lets you continue; 90 blocks and names the maximum.",
      render: () => <DoseInputDemo initial="50" plausibleMax={40} absoluteMax={80} />,
    },
    {
      id: "weight",
      label: "Weight-based",
      note: "The arithmetic stays on screen. A bare number invites use with a stale weight.",
      render: () => (
        <div className="flex flex-col gap-4">
          <DoseInputDemo
            initial=""
            dosePerKg={15}
            weightKg={3.2}
            units={["mg"]}
            absoluteMax={1000}
          />
          <DoseInputDemo initial="" dosePerKg={15} units={["mg"]} />
        </div>
      ),
    },
  ],

  provenance: [
    {
      id: "sources",
      label: "Four sources",
      note: "Select a tag. Patient-reported, device-recorded, and clinician-entered carry different weight.",
      render: () => (
        <dl className="grid gap-3 text-[length:var(--ox-text-sm)]">
          {[
            [
              "Potassium 6.8 mmol/L",
              {
                agent: [
                  { type: { coding: [{ code: "author" }] }, who: { display: "A. Bensouda, MD" } },
                ],
                recorded: "2026-08-03T06:44:00Z",
                occurredDateTime: "2026-08-03T06:42:00Z",
              },
            ],
            [
              "Home blood pressure",
              {
                agent: [{ who: { reference: "Device/bp-monitor-4", display: "Omron BP7450" } }],
                recorded: "2026-08-02T21:10:00Z",
              },
            ],
            [
              "Smoking status",
              {
                agent: [{ type: { coding: [{ code: "informant" }] }, who: { display: "Patient" } }],
                recorded: "2026-08-01T14:00:00Z",
              },
            ],
            ["Referral letter", {}],
          ].map(([label, prov]) => (
            <div key={label as string} className="flex items-center justify-between gap-3">
              <dt className="text-[var(--ox-text-muted)]">{label as string}</dt>
              <dd>
                <ProvenanceTag provenance={prov as never} timeZone={TZ} subject={label as string} />
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "amended",
      label: "Amended",
      note: "Surfaced on the trigger, not only inside it. A correction nobody opens is a correction nobody saw.",
      render: () => (
        <div className="flex flex-wrap items-center gap-4">
          <ProvenanceTag
            provenance={{
              agent: [
                { type: { coding: [{ code: "author" }] }, who: { display: "Lab interface" } },
              ],
              recorded: "2026-08-03T08:10:00Z",
            }}
            resource={{ meta: { versionId: "3" } }}
            timeZone={TZ}
            subject="Glucose 156 mg/dL"
          />
          <ProvenanceTag
            provenance={{
              agent: [
                { type: { coding: [{ code: "author" }] }, who: { display: "A. Bensouda, MD" } },
              ],
              recorded: "2026-08-03T06:44:00Z",
            }}
            timeZone={TZ}
            inline
          />
        </div>
      ),
    },
  ],

  "unsaved-guard": [
    {
      id: "status",
      label: "Save status",
      note: "Failure is announced assertively. Silent autosave failure lets someone write for twenty minutes believing the note is filed.",
      render: () => (
        <div className="flex flex-col gap-2">
          <SaveStatus state="saving" />
          <SaveStatus state="saved" lastSavedLabel="09:41" />
          <SaveStatus state="failed" />
        </div>
      ),
    },
  ],

  "error-boundary": [
    {
      id: "scoped",
      label: "Scoped failure",
      note: "One section fails; the rest of the chart is unaffected and says so. Reference id carries no PHI.",
      render: () => (
        <div className="flex flex-col gap-3">
          <ClinicalErrorBoundary label="Medications">
            <Boom />
          </ClinicalErrorBoundary>
          <ObservationPanel observations={observations.panel.slice(0, 2)} />
        </div>
      ),
    },
    {
      id: "critical",
      label: "Critical boundary",
      note: "Identity and code status invalidate the surrounding screen when they fail, so they say so louder.",
      render: () => (
        <ClinicalErrorBoundary label="Patient banner" critical>
          <Boom />
        </ClinicalErrorBoundary>
      ),
    },
  ],

  "app-shell": [
    {
      id: "prescriber",
      label: "Prescriber",
      note: "Navigation is composed from scopes. Compare with the scheduler — unavailable features are absent, not disabled.",
      render: () => <ShellDemo scopes={["chart", "prescribe", "results", "schedule"]} />,
    },
    {
      id: "scheduler",
      label: "Scheduler",
      note: "Same items array, fewer scopes. A greyed-out Prescribe teaches a nurse the system is broken.",
      render: () => <ShellDemo scopes={["schedule"]} />,
    },
    {
      id: "session",
      label: "Session & break-glass",
      note: "Expiry warns before it acts. Emergency access is a standing condition, marked persistently.",
      render: () => (
        <ShellDemo scopes={["chart", "results"]} sessionSecondsRemaining={95} breakGlassActive />
      ),
    },
  ],

  "code-status": [
    {
      id: "states",
      label: "Status states",
      note: "Unknown is loud. There is no default to full code — that would be a clinical decision made by a fallback.",
      render: () => (
        <div className="flex flex-col gap-3">
          <CodeStatus
            status="dnr-dni"
            verifiedAt="2026-08-01T09:00:00Z"
            verifiedBy="A. Bensouda, MD"
            timeZone={TZ}
            asOf={AS_OF}
            proxyPhone="+15550100"
            proxy={{ name: [{ text: "R. Okonkwo" }], relationship: [{ text: "spouse" }] }}
          />
          <CodeStatus status="unknown" timeZone={TZ} asOf={AS_OF} />
          <CodeStatus
            status="full-code"
            verifiedAt="2026-05-02T09:00:00Z"
            timeZone={TZ}
            asOf={AS_OF}
          />
        </div>
      ),
    },
    {
      id: "conflict",
      label: "Conflicting directives",
      note: "Surfaced as a question. Picking the newer one silently is not this component's decision to make.",
      render: () => (
        <CodeStatus
          status="dnr"
          conflicting
          verifiedAt="2026-07-30T09:00:00Z"
          timeZone={TZ}
          asOf={AS_OF}
          documents={[
            { id: "1", title: "Advance directive (2024)" },
            { id: "2", title: "POLST (2026)" },
          ]}
        />
      ),
    },
  ],

  "precautions-bar": [
    {
      id: "active",
      label: "Ordered by action",
      note: "Airborne before contact before behavioral. The required PPE is named, not implied by a category.",
      render: () => (
        <PrecautionsBar
          precautions={[
            { kind: "fall", label: "Fall risk", action: "Bed low, call bell in reach" },
            {
              kind: "airborne",
              label: "Airborne precautions",
              action: "N95 before entry, door closed",
            },
            { kind: "behavioral", label: "Approach", action: "Two staff for personal care" },
            { kind: "isolation", label: "Contact precautions", action: "Gown and gloves" },
          ]}
        />
      ),
    },
    {
      id: "lapsed",
      label: "Lapsed are dropped",
      note: "Both flags are status active; one has a period that ended. A stale precaution on screen devalues every precaution beside it.",
      render: () => (
        <PrecautionsBar
          asOf={AS_OF}
          flags={[
            {
              status: "active",
              category: [{ coding: [{ code: "infection" }] }],
              code: { text: "Contact precautions" },
            },
            {
              status: "active",
              category: [{ coding: [{ code: "infection" }] }],
              code: { text: "Droplet precautions (ended 12 Jul)" },
              period: { end: "2026-07-12" },
            },
          ]}
          actionFor={(flag) =>
            flag.code?.text?.startsWith("Contact") ? "Gown and gloves" : undefined
          }
        />
      ),
    },
    {
      id: "none",
      label: "None active",
      note: "Stated as a sentence rather than an empty bar.",
      render: () => <PrecautionsBar precautions={[]} />,
    },
  ],

  "care-team": [
    {
      id: "coverage",
      label: "Coverage",
      note: "The person on the record is not always the person to contact. Both facts are shown.",
      render: () => (
        <CareTeamPanel
          asOf={AS_OF}
          responsibleRef="Practitioner/bensouda"
          team={{
            participant: [
              {
                member: { display: "A. Bensouda, MD", reference: "Practitioner/bensouda" },
                role: [{ text: "Psychiatrist" }],
              },
              { member: { display: "J. Whitfield, LCSW" }, role: [{ text: "Therapist" }] },
              { member: { display: "M. Okonkwo" }, role: [{ text: "Spouse and caregiver" }] },
              { member: { display: "T. Alvarez" }, role: [{ text: "Peer support specialist" }] },
              {
                member: { display: "S. Vukovic, MD" },
                role: [{ text: "Prior psychiatrist" }],
                period: { end: "2026-03-01" },
              },
            ],
          }}
          coverage={{
            "Practitioner/bensouda": { coveringName: "P. Ramanathan, PMHNP", until: "07:00" },
          }}
          contacts={{
            "Practitioner/bensouda": { phone: "+15550111" },
            "J. Whitfield, LCSW": { onMessage: () => {} },
          }}
        />
      ),
    },
    {
      id: "empty",
      label: "No team recorded",
      note: "Not the same as having no care team.",
      render: () => <CareTeamPanel team={{ participant: [] }} />,
    },
  ],

  "alert-banner": [
    {
      id: "budget",
      label: "The interruption budget",
      note: "Only critical takes focus. The finding is stated, not the category — “Abnormal result” teaches dismissal without reading.",
      render: () => (
        <div className="flex flex-col gap-2">
          <AlertBanner
            severity="critical"
            finding="Potassium 6.8 mmol/L — critical high"
            detail="Repeat sample and review cardiac monitoring."
            source="Chemistry · resulted 06:42"
            dismissReasons={[
              "Already actioned",
              "Known for this patient",
              "Not clinically relevant",
            ]}
            onDismiss={() => {}}
          />
          <AlertBanner
            severity="high"
            finding="Penicillin allergy — amoxicillin ordered"
            detail="Documented anaphylaxis in 2019."
            onDismiss={() => {}}
          />
          <AlertBanner severity="moderate" finding="Lithium level due — last drawn 94 days ago" />
          <AlertBanner severity="info" finding="Care plan reviewed 3 days ago" />
        </div>
      ),
    },
  ],

  "patient-snapshot": [
    {
      id: "partial",
      label: "Honest summary",
      note: "One section failed, one is truncated with a count, one is empty. None of them look complete.",
      render: () => (
        <PatientSnapshot
          timeZone={TZ}
          lastReviewedAt="2026-08-01T17:00:00Z"
          sections={[
            {
              id: "problems",
              title: "Problems",
              state: "loaded",
              totalCount: 11,
              shownCount: 2,
              changedCount: 1,
              lastReadAt: "2026-08-03T09:10:00Z",
              emptyTitle: "No problems recorded",
              content: <ConditionList conditions={conditions.list.slice(0, 2)} />,
            },
            {
              id: "meds",
              title: "Medications",
              state: "failed",
              failureDetail: "The pharmacy system did not respond.",
              emptyTitle: "No medications recorded",
              onRetry: () => {},
              content: null,
            },
            {
              id: "results",
              title: "Recent results",
              state: "loaded",
              lastReadAt: "2026-08-03T09:10:00Z",
              emptyTitle: "No results in this period",
              content: <ObservationPanel observations={observations.panel.slice(0, 2)} />,
            },
            {
              id: "allergies",
              title: "Allergies",
              state: "loaded",
              isEmpty: true,
              lastReadAt: "2026-08-03T09:10:00Z",
              emptyTitle: "No allergy information recorded",
              emptyDescription:
                "This is not the same as no known allergies. Ask and record before prescribing.",
              content: null,
            },
          ]}
        />
      ),
    },
  ],
};

/** Controlled wrapper — DoseInput is a controlled input and the demo owns state. */
function DoseInputDemo({
  initial,
  units = ["mg"],
  plausibleMax,
  absoluteMax,
  dosePerKg,
  weightKg,
}: {
  initial: string;
  units?: string[];
  plausibleMax?: number;
  absoluteMax?: number;
  dosePerKg?: number;
  weightKg?: number;
}) {
  const [value, setValue] = React.useState(initial);
  const [unit, setUnit] = React.useState(units[0]);
  return (
    <DoseInput
      value={value}
      onChange={setValue}
      units={units}
      unit={unit}
      onUnitChange={setUnit}
      plausibleMax={plausibleMax}
      absoluteMax={absoluteMax}
      dosePerKg={dosePerKg}
      weightKg={weightKg}
    />
  );
}

/**
 * Throws so the boundary has something real to catch — but only after mount.
 *
 * React error boundaries do not catch during server rendering, so throwing on
 * the first render would 500 the page rather than demonstrate the component.
 * Deferring to a post-mount state change reproduces the case the boundary
 * actually exists for: a client render that fails.
 */
function Boom(): React.ReactNode {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => setArmed(true), []);
  if (armed) throw new Error("Synthetic failure for the preview");
  return null;
}

function ShellDemo({
  scopes,
  sessionSecondsRemaining,
  breakGlassActive,
}: {
  scopes: string[];
  sessionSecondsRemaining?: number;
  breakGlassActive?: boolean;
}) {
  const items = [
    { id: "worklist", label: "Worklist", href: "#", badgeCount: 12, urgent: true },
    { id: "chart", label: "Chart", href: "#", requires: "chart" },
    { id: "results", label: "Results", href: "#", requires: "results", badgeCount: 3 },
    { id: "prescribe", label: "Prescribe", href: "#", requires: "prescribe" },
    { id: "schedule", label: "Schedule", href: "#", requires: "schedule" },
    { id: "billing", label: "Billing", href: "#", requires: "billing" },
  ];
  return (
    <div className="overflow-hidden rounded-[var(--ox-radius)] border border-[var(--ox-border)]">
      <AppShell
        scopes={scopes}
        items={items}
        currentId="worklist"
        sessionSecondsRemaining={sessionSecondsRemaining}
        onExtendSession={() => {}}
        breakGlassActive={breakGlassActive}
        brand={<span className="text-[length:var(--ox-text-sm)] font-bold">Oxygen Clinic</span>}
      >
        <p className="text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
          {scopes.length} scope{scopes.length === 1 ? "" : "s"} held — navigation composed from
          them.
        </p>
      </AppShell>
    </div>
  );
}

const DENSITIES: Density[] = ["patient", "standard", "clinical"];

export function ComponentPreview({ name }: { name: string }) {
  const scenarios = SCENARIOS[name];
  const [scenarioId, setScenarioId] = React.useState(scenarios?.[0]?.id ?? "");
  const [density, setDensity] = React.useState<Density>("standard");

  if (!scenarios?.length) {
    return (
      <div className="instrument instrument-demo flex items-center justify-center px-6 py-16">
        <p className="text-sm text-panel-muted">Live preview coming with the next release.</p>
      </div>
    );
  }

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]!;

  return (
    <div className="instrument instrument-demo">
      <InstrumentGlow />

      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live · synthetic data</span>
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
                density === item
                  ? "bg-panel-fg/10 text-panel-fg"
                  : "text-panel-muted hover:text-panel-fg/80",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/*
        Keyed by scenario so switching tabs remounts the demo. Without it React
        reconciles two different scenarios as the same component and their
        state bleeds across — a dose typed in one scenario survived into the
        next, which made the preview show something the scenario never set up.
      */}
      <div key={scenario.id} data-ox-density={density} className="relative p-4 sm:p-6">
        {scenario.render()}
      </div>

      <div className="relative border-t border-panel-rule bg-panel/60 px-3 py-3 sm:px-4">
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
                  : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p
          key={scenario.id}
          className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted"
        >
          {scenario.note}
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TimelineRegister, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  // August 2026 — Clinical events
  {
    id: "hba1c-amended",
    kind: "laboratory",
    occurred: "2026-08-14T08:12:00+05:30",
    recorded: "2026-08-15T16:20:00+05:30",
    title: "HbA1c — 8.9%",
    actor: {
      name: "Northside Pathology",
      role: "Reporting laboratory",
    },
    status: "amended",
    revision: {
      at: "2026-08-15T16:20:00+05:30",
      was: "9.4%",
      reason: "Result value corrected",
    },
    source: "ehr",
  },
  {
    id: "diabetes-review-encounter",
    kind: "encounter",
    occurred: "2026-08-12T10:05:00+05:30",
    title: "HbA1c 8.9% — Diabetes review clinic",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
      organization: "Northside Clinic",
    },
    source: "ehr",
  },
  {
    id: "diabetes-review-note",
    kind: "note",
    occurred: "2026-08-12T10:05:00+05:30",
    title: "Diabetes review — progress note",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
    },
    source: "ehr",
  },
  {
    id: "capillary-glucose-aug10",
    kind: "observation",
    occurred: "2026-08-10T12:00:00+05:30",
    title: "Capillary glucose — 7.1 mmol/L",
    source: "ehr",
  },
  {
    id: "blood-pressure-aug10",
    kind: "observation",
    occurred: "2026-08-10T08:00:00+05:30",
    title: "Blood pressure — 128/78 mmHg",
    source: "ehr",
  },
  {
    id: "capillary-glucose-aug09",
    kind: "observation",
    occurred: "2026-08-09T20:00:00+05:30",
    title: "Capillary glucose — 9.8 mmol/L",
    source: "ehr",
  },
  {
    id: "weight-aug09",
    kind: "observation",
    occurred: "2026-08-09T08:00:00+05:30",
    title: "Weight — 71.4 kg",
    source: "ehr",
  },
  {
    id: "potassium-result",
    kind: "laboratory",
    occurred: "2026-08-09T02:14:00+05:30",
    title: "Potassium 6.8 mmol/L",
    detail: "Urea and electrolytes",
    source: "ehr",
  },

  // July 2026 — Clinical events
  {
    id: "entered-in-error",
    kind: "encounter",
    occurred: "2026-07-30",
    recorded: "2026-07-31",
    title: "Emergency department attendance",
    status: "in-error",
    revision: {
      at: "2026-07-31",
      reason: "Recorded against this patient in error",
    },
    source: "ehr",
  },
  {
    id: "restricted-clinical-note",
    kind: "note",
    occurred: "2026-07-14",
    title: "Clinical note",
    access: {
      kind: "reason",
      reasons: [
        { code: "care-coordination", label: "Care coordination" },
        { code: "treatment", label: "Treatment" },
        { code: "patient-safety", label: "Patient safety" },
      ],
    },
    source: "ehr",
  },

  // June 2026 — Clinical event
  {
    id: "restricted-document",
    kind: "document",
    occurred: "2026-06-22",
    title: "Document",
    access: {
      kind: "withheld",
      reason: "Kept separately by its author.",
    },
    source: "ehr",
  },

  // April 2026 — Clinical event
  {
    id: "metformin",
    kind: "medication",
    occurred: "2026-04-02T09:30:00-04:00",
    title: "Metformin",
    detail: "1 g — twice daily",
    actor: {
      name: "Northside Regional Exchange",
      role: "Source system",
    },
    source: "ehr",
  },

  // Six events from other registers — hidden initially
  {
    id: "follow-up-appointment",
    kind: "appointment",
    occurred: "2026-08-11T09:00:00+05:30",
    title: "Follow-up appointment",
    status: "planned",
    source: "ehr",
  },
  {
    id: "cardiology-referral",
    kind: "referral",
    occurred: "2026-08-08T11:00:00+05:30",
    title: "Cardiology referral",
    source: "ehr",
  },
  {
    id: "appointment-message",
    kind: "message",
    occurred: "2026-08-07T10:00:00+05:30",
    title: "Appointment reminder",
    source: "ehr",
  },
  {
    id: "outbound-call",
    kind: "call",
    occurred: "2026-08-06T14:30:00+05:30",
    title: "Outbound appointment call",
    source: "ehr",
  },
  {
    id: "patient-questionnaire",
    kind: "questionnaire",
    occurred: "2026-08-05T09:00:00+05:30",
    title: "Patient symptom questionnaire",
    source: "ehr",
  },
  {
    id: "record-access-audit",
    kind: "access",
    occurred: "2026-08-04T12:00:00+05:30",
    title: "Record access audit",
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  window: { from: "2025-07-01" },
  order: "newest-first",
  total: 43,
  hidden: [{ reason: "access", count: 2 }],
  sources: [
    {
      id: "ehr",
      label: "Northside EHR",
      status: "ok",
    },
  ],
};

export default function FilteredRegistersExample() {
  const [registers, setRegisters] = useState<TimelineRegister[]>(["clinical"]);

  return (
    <>
      <CareTimeline
        aria-label="Care timeline for Ada Lovelace"
        events={events}
        now={serverTime}
        coverage={coverage}
        group="month"
        registers={registers}
        onRegistersChange={(nextRegisters) => {
          setRegisters(nextRegisters);
        }}
      />

      <p role="status">onRegistersChange({JSON.stringify(registers)})</p>
    </>
  );
}

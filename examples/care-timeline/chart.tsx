import { useState } from "react";
import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

/**
 * The 18 most recent records shown in the example.
 *
 * The timeline sorts these newest first. The future appointment
 * appears separately in the Planned section.
 */
const recentEvents: TypedTimelineEvent[] = [
  {
    id: "appointment-endocrinology",
    kind: "appointment",
    occurred: "2026-09-02T09:30:00+05:30",
    title: "Endocrinology appointment",
    detail: "Follow-up appointment.",
    status: "planned",
    actor: { name: "Dr Wade Warren", role: "Endocrinology" },
    source: "ehr",
  },
  {
    id: "hba1c-amended",
    kind: "laboratory",
    occurred: "2026-08-17T08:30:00+05:30",
    recorded: "2026-08-18T09:15:00+05:30",
    title: "HbA1c",
    detail: "8.9%",
    status: "amended",
    revision: {
      at: "2026-08-18T09:15:00+05:30",
      by: { name: "Dr Wade Warren" },
      was: "8.6%",
      reason: "Corrected laboratory result.",
    },
    source: "ehr",
  },
  {
    id: "encounter-aug-16",
    kind: "encounter",
    occurred: "2026-08-16T11:20:00+05:30",
    title: "Diabetes follow-up encounter",
    detail: "Outpatient consultation.",
    actor: { name: "Dr Wade Warren", role: "Endocrinology" },
    source: "ehr",
  },
  {
    id: "clinical-note-aug-15",
    kind: "note",
    occurred: "2026-08-15T12:10:00+05:30",
    title: "Clinical progress note",
    detail: "Medication review and follow-up plan.",
    actor: { name: "Dr Wade Warren" },
    source: "ehr",
  },
  {
    id: "questionnaire-aug-14",
    kind: "questionnaire",
    occurred: "2026-08-14T16:00:00+05:30",
    title: "Patient-reported diabetes questionnaire",
    steps: [
      {
        label: "Sent",
        at: "2026-08-12T09:00:00+05:30",
        state: "done",
      },
      {
        label: "Returned",
        at: "2026-08-14T15:45:00+05:30",
        state: "done",
      },
      {
        label: "Reviewed",
        state: "open",
      },
    ],
    source: "ehr",
  },
  {
    id: "glucose-aug-13",
    kind: "observation",
    occurred: "2026-08-13T08:10:00+05:30",
    title: "Blood glucose",
    detail: "142 mg/dL",
    source: "ehr",
  },
  {
    id: "blood-pressure-aug-12",
    kind: "observation",
    occurred: "2026-08-12T08:15:00+05:30",
    title: "Blood pressure",
    detail: "132/84 mmHg",
    source: "ehr",
  },
  {
    id: "weight-aug-11",
    kind: "observation",
    occurred: "2026-08-11T08:20:00+05:30",
    title: "Body weight",
    detail: "74.2 kg",
    source: "ehr",
  },
  {
    id: "potassium-aug-10",
    kind: "laboratory",
    occurred: "2026-08-10T10:30:00+05:30",
    title: "Serum potassium",
    detail: "4.2 mmol/L",
    source: "ehr",
  },
  {
    id: "retinal-screening",
    kind: "appointment",
    occurred: "2026-08-09T09:00:00+05:30",
    title: "Diabetic retinal screening",
    status: "lapsed",
    detail: "The planned screening was not completed.",
    source: "ehr",
  },
  {
    id: "encounter-entered-in-error",
    kind: "encounter",
    occurred: "2026-08-08T14:00:00+05:30",
    title: "Emergency department encounter",
    status: "in-error",
    revision: {
      at: "2026-08-09T10:00:00+05:30",
      by: { name: "Records administrator" },
      reason: "Encounter attached to the wrong patient.",
    },
    source: "ehr",
  },
  {
    id: "telephone-call",
    kind: "call",
    occurred: "2026-08-07T15:30:00+05:30",
    title: "Telephone follow-up",
    detail: "The call was not completed.",
    status: "not-done",
    actor: { name: "Care coordination team" },
    recipient: { name: "Ada Lovelace" },
    source: "ehr",
  },
  {
    id: "podiatry-appointment",
    kind: "appointment",
    occurred: "2026-08-06T10:00:00+05:30",
    title: "Podiatry appointment",
    status: "cancelled",
    detail: "Appointment cancelled.",
    source: "ehr",
  },
  {
    id: "restricted-note",
    kind: "note",
    occurred: "2026-08-05T11:00:00+05:30",
    title: "Restricted clinical note",
    access: {
      kind: "withheld",
      reason: "This record is not available to this reader.",
    },
    source: "ehr",
  },
  {
    id: "restricted-document",
    kind: "document",
    occurred: "2026-08-04T09:30:00+05:30",
    title: "Restricted document",
    access: {
      kind: "withheld",
      reason: "Access to this document is restricted.",
    },
    source: "ehr",
  },
  {
    id: "care-plan-review",
    kind: "care-plan",
    occurred: "2026-08-03T13:00:00+05:30",
    title: "Diabetes care plan review",
    detail: "Care plan reviewed and updated.",
    source: "ehr",
  },
  {
    id: "remote-medication",
    kind: "medication",
    occurred: "2026-04-02T09:00:00-04:00",
    title: "Metformin",
    detail: "Medication record received from a remote source.",
    source: "hie",
  },
  {
    id: "gestational-diabetes",
    kind: "condition",
    occurred: "2019-04-12",
    title: "Gestational diabetes",
    detail: "Patient-reported medical history.",
    register: "patient-reported",
    source: "ehr",
  },
];

/**
 * Additional older records.
 *
 * These are present in the loaded dataset but fall beyond the
 * first 18 records displayed by the timeline.
 */
const olderEvents: TypedTimelineEvent[] = Array.from({ length: 23 }, (_, index) => {
  const date = new Date(Date.UTC(2018, 11, 1 - index * 14)).toISOString().slice(0, 10);

  return {
    id: `older-record-${index + 1}`,
    kind: "observation",
    occurred: date,
    title: `Historical observation ${index + 1}`,
    detail: "Historical patient record.",
    source: "ehr",
  };
});

const events: TypedTimelineEvent[] = [...recentEvents, ...olderEvents];

const coverage: TimelineCoverage = {
  window: {
    from: "2025-07-01",
  },
  order: "newest-first",
  total: 43,
  hidden: [
    {
      reason: "access",
      count: 2,
    },
  ],
  gaps: [
    {
      from: "2026-07-20",
      to: "2026-07-24",
      reason: "No records were received during this period.",
    },
  ],
  sources: [
    {
      id: "ehr",
      label: "Northside EHR",
      status: "ok",
    },
    {
      id: "hie",
      label: "Northside Regional Exchange",
      status: "unavailable",
      detail: "Timed out after 8s.",
    },
  ],
};

export default function NewestFirstExample() {
  const [loadMessage, setLoadMessage] = useState("");

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mx-auto w-full max-w-5xl">
        <CareTimeline
          aria-label="Care timeline for Ada Lovelace"
          events={events}
          now={serverTime}
          coverage={coverage}
          group="month"
          limit={18}
          onLoadOlder={() => {
            setLoadMessage("onLoadOlder() — the host fetches the next window.");
          }}
        />

        {loadMessage && (
          <p className="mt-3 text-sm text-slate-600" role="status">
            {loadMessage}
          </p>
        )}
      </div>
    </div>
  );
}

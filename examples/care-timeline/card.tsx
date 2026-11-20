import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "endocrinology-review",
    kind: "appointment",
    occurred: "2026-09-02T09:30:00+05:30",
    title: "Endocrinology review",
    status: "planned",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
    },
    source: "ehr",
  },
  {
    id: "hba1c-amended",
    kind: "laboratory",
    occurred: "2026-08-14T08:12:00+05:30",
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
    title: "HbA1c 8.9%",
    detail: "Diabetes review clinic",
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
    id: "pre-visit-questionnaire",
    kind: "questionnaire",
    occurred: "2026-08-11T09:00:00+05:30",
    title: "Pre-visit medical history",
    steps: [
      {
        label: "Sent to the patient",
        at: "2026-08-11T09:00:00+05:30",
        state: "done",
      },
      {
        label: "Returned by the patient",
        at: "2026-08-11T21:34:00+05:30",
        state: "done",
      },
      {
        label: "Not yet reviewed",
        state: "open",
      },
    ],
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  order: "newest-first",
  window: {
    from: "2025-07-01",
  },
  total: 43,
  hidden: [{ reason: "access", count: 2 }],
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

export default function DashboardCardExample() {
  return (
    <CareTimeline
      aria-label="Care timeline for Ada Lovelace"
      events={events}
      now={serverTime}
      coverage={coverage}
      layout="card"
      limit={3}
    />
  );
}

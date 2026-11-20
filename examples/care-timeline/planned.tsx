import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "appt-endo",
    kind: "appointment",
    occurred: "2026-09-02T09:30:00+05:30",
    status: "planned",
    title: "Endocrinology review",
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
    status: "amended",
    actor: {
      name: "Northside Pathology",
      role: "Reporting laboratory",
    },
    revision: {
      at: "2026-08-15T16:20:00+05:30",
      was: "9.4%",
      reason: "result value corrected",
    },
    source: "ehr",
  },
  {
    id: "diabetes-review",
    kind: "encounter",
    occurred: "2026-08-12T10:05:00+05:30",
    title: "HbA1c 8.9%",
    detail: "Diabetes review clinic · Northside Clinic",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
    },
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  window: {
    from: "2025-07-01",
  },
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

export default function PlannedAboveNowExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing a planned appointment above the now marker"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "lab-hba1c",
    kind: "laboratory",
    occurred: "2026-08-14T08:12:00+05:30",
    status: "amended",
    title: "HbA1c — 8.9%",
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
    id: "encounter-diabetes-review",
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

export default function AmendedWithDeltaExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing an amended laboratory result"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

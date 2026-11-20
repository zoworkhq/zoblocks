import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "appointment-endocrinology",
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
    id: "laboratory-thyroid-function",
    kind: "laboratory",
    occurred: "2026-08-17T22:41:00+05:30",
    status: "in-progress",
    title: "Thyroid function",
    detail: "Released to you at the same time as your care team. Nobody has looked at it yet.",
    source: "ehr",
  },
  {
    id: "laboratory-hba1c-amended",
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
  hidden: [
    {
      reason: "access",
      count: 2,
    },
  ],
  sources: [
    {
      id: "ehr",
      label: "Northside EHR",
      status: "ok",
    },
  ],
};

export default function PatientFacingUnreviewedResultExample() {
  return (
    <CareTimeline
      events={events}
      now={serverTime}
      coverage={coverage}
      audience="patient"
      aria-label="Your care timeline"
    />
  );
}

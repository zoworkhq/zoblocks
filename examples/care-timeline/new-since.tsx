import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";
const lastReviewedAt = "2026-08-12T14:02:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "lab-hba1c-amended",
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
  {
    id: "note-diabetes-progress",
    kind: "note",
    occurred: "2026-08-12T10:05:00+05:30",
    recorded: "2026-08-18T09:40:00+05:30",
    title: "Diabetes review — progress note",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
    },
    source: "ehr",
  },
  {
    id: "questionnaire-pre-visit",
    kind: "questionnaire",
    register: "patient-reported",
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
  {
    id: "observation-blood-pressure",
    kind: "observation",
    occurred: "2026-08-10T08:00:00+05:30",
    title: "Blood pressure — 128/78 mmHg",
    source: "ehr",
  },
  {
    id: "observation-weight",
    kind: "observation",
    occurred: "2026-08-09T08:00:00+05:30",
    title: "Weight — 71.4 kg",
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

export default function NewSinceLastReviewedExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing events since the last review and a late-recorded note"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
      seenThrough={lastReviewedAt}
      lateEntryAfter="P2D"
    />
  );
}

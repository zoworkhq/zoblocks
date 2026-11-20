import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "enc-diabetes-review",
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
    id: "q-history",
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

export default function QuestionnaireThreadExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing a questionnaire with its workflow steps"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

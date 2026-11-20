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
    id: "call-follow-up",
    kind: "call",
    occurred: "2026-07-22T15:10:00+05:30",
    status: "not-done",
    title: "Follow-up call",
    detail: "To confirm the visit and update insurance.",
    actor: {
      name: "Priya Menon",
      role: "Front desk",
    },
    recipient: {
      name: "The patient",
    },
    source: "ehr",
  },
  {
    id: "appointment-podiatry",
    kind: "appointment",
    occurred: "2026-07-16T14:00:00+05:30",
    status: "cancelled",
    title: "Podiatry review",
    detail: "Cancelled by the clinic.",
    source: "ehr",
  },
  {
    id: "condition-gestational-diabetes",
    kind: "condition",
    register: "patient-reported",
    occurred: "2019",
    title: "Gestational diabetes",
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

export default function ClinicalOnOneSideExample() {
  return (
    <CareTimeline
      aria-label="Care timeline with clinical and administrative events on separate sides"
      events={events}
      now={serverTime}
      coverage={coverage}
      layout="register"
      group="month"
      jump
    />
  );
}

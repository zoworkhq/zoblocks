import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "appt-podiatry",
    kind: "appointment",
    occurred: "2026-07-16T14:00:00+05:30",
    status: "cancelled",
    title: "Podiatry review",
    detail: "Cancelled by the clinic.",
    source: "ehr",
  },
  {
    id: "note-psych",
    kind: "note",
    occurred: "2026-07-14",
    title: "Psychotherapy progress note",
    access: {
      kind: "consent",
      policy: "42 CFR Part 2",
      state: "granted",
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

export default function ConsentGatedExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing a consent-gated clinical note"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

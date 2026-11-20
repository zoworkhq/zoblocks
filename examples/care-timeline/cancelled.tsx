import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "call-followup",
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
    id: "appt-cancelled",
    kind: "appointment",
    occurred: "2026-07-16T14:00:00+05:30",
    status: "cancelled",
    title: "Podiatry review",
    detail: "Cancelled by the clinic.",
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  window: {
    from: "2026-07-01",
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

export default function CancelledVsNotDoneExample() {
  return (
    <CareTimeline
      aria-label="Care timeline distinguishing cancelled appointments from unsuccessful calls"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "enc-ed",
    kind: "encounter",
    occurred: "2026-07-30",
    status: "in-error",
    title: "Emergency department attendance",
    revision: {
      at: "2026-07-31",
      by: {
        name: "Dr A Rahman",
      },
      reason: "recorded against this patient in error",
    },
    source: "ehr",
  },
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

export default function EnteredInErrorExample() {
  return (
    <CareTimeline
      aria-label="Care timeline retaining an encounter entered in error"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

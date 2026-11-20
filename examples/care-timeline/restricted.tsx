import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "doc-outside",
    kind: "document",
    occurred: "2026-06-22",
    title: "Discharge summary",
    detail: "Private document content",
    access: {
      kind: "withheld",
      reason: "Kept separately by its author.",
    },
    source: "ehr",
  },
  {
    id: "med-metformin",
    kind: "medication",
    occurred: "2026-04-02T09:30:00-04:00",
    title: "Metformin 1 g — twice daily",
    actor: {
      name: "Northside Regional Exchange",
      role: "Source system",
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
  sources: [
    {
      id: "ehr",
      label: "Northside EHR",
      status: "ok",
    },
  ],
};

export default function RestrictedRecordExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing a restricted document and a medication record"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

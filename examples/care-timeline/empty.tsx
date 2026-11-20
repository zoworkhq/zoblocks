import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [];

const sources: TimelineCoverage["sources"] = [
  {
    id: "ehr",
    label: "Northside EHR",
    status: "ok",
  },
];

export default function EmptyStatesExample() {
  return (
    <>
      {/* Nothing anywhere */}
      <CareTimeline
        aria-label="Care timeline with no records"
        events={events}
        now={serverTime}
        coverage={{
          order: "newest-first",
          sources,
        }}
      />

      {/* Nothing in the searched window */}
      <CareTimeline
        aria-label="Care timeline with no records in the selected window"
        events={events}
        now={serverTime}
        coverage={{
          order: "newest-first",
          window: {
            from: "2025-01-01",
            to: "2025-12-31",
          },
          sources,
        }}
      />

      {/* Records exist, but access is restricted */}
      <CareTimeline
        aria-label="Care timeline with records that are restricted"
        events={events}
        now={serverTime}
        coverage={{
          order: "newest-first",
          hidden: [{ reason: "access", count: 3 }],
          sources,
        }}
      />
    </>
  );
}

import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "observation-weight",
    kind: "observation",
    occurred: "2026-08-07T08:15:00+05:30",
    title: "Weight 74.2 kg",
    detail: "Routine observations",
    source: "ehr",
  },
  {
    id: "observation-blood-pressure",
    kind: "observation",
    occurred: "2026-08-08T09:20:00+05:30",
    title: "Blood pressure 128/82 mmHg",
    detail: "Routine observations",
    source: "ehr",
  },
  {
    id: "observation-pulse",
    kind: "observation",
    occurred: "2026-08-09T01:45:00+05:30",
    title: "Pulse 78 bpm",
    detail: "Routine observations",
    source: "ehr",
  },
  {
    id: "observation-temperature",
    kind: "observation",
    occurred: "2026-08-09T02:00:00+05:30",
    title: "Temperature 36.8 °C",
    detail: "Routine observations",
    source: "ehr",
  },
  {
    id: "critical-potassium",
    kind: "laboratory",
    occurred: "2026-08-09T02:14:00+05:30",
    title: "Potassium 6.8 mmol/L",
    detail: "Urea and electrolytes",
    severity: "critical",
    severityStatus: "Critical",
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  window: { from: "2025-07-01" },
  order: "newest-first",
  total: 43,
  hidden: [{ reason: "access", count: 2 }],
  sources: [{ id: "ehr", label: "Northside EHR", status: "ok" }],
};

export default function ClusterWithCriticalEvent() {
  return (
    <CareTimeline
      aria-label="Routine observations clustered with critical result kept visible"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
      cluster={{
        kinds: ["observation"],
        within: "P3D",
        min: 3,
      }}
    />
  );
}

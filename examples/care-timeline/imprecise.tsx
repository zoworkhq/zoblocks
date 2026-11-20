import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
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
    id: "medication-metformin",
    kind: "medication",
    occurred: "2026-04-02T09:30:00-04:00",
    title: "Metformin 1 g — twice daily",
    actor: {
      name: "Northside Regional Exchange",
      role: "Source system",
    },
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
  hidden: [{ reason: "access", count: 2 }],
  sources: [
    {
      id: "ehr",
      label: "Northside EHR",
      status: "ok",
    },
  ],
};

export default function ImpreciseDateExample() {
  return (
    <CareTimeline
      aria-label="Care timeline showing imprecise dates and preserved timezone offsets"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="none"
    />
  );
}

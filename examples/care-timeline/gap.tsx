import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "podiatry-review",
    kind: "appointment",
    occurred: "2026-07-16T14:00:00+05:30",
    title: "Podiatry review",
    detail: "Cancelled by the clinic.",
    status: "cancelled",
    source: "ehr",
  },
  {
    id: "restricted-clinical-note",
    kind: "note",
    occurred: "2026-07-14",
    title: "Clinical note",
    access: {
      kind: "reason",
      reasons: [
        { code: "care-coordination", label: "Care coordination" },
        { code: "treatment", label: "Treatment" },
        { code: "patient-safety", label: "Patient safety" },
      ],
    },
    source: "ehr",
  },
  {
    id: "restricted-document",
    kind: "document",
    occurred: "2026-06-22",
    title: "Document",
    access: {
      kind: "withheld",
      reason: "Kept separately by its author.",
    },
    source: "ehr",
  },
  {
    id: "metformin",
    kind: "medication",
    occurred: "2026-04-02T09:30:00-04:00",
    title: "Metformin",
    detail: "1 g — twice daily",
    actor: {
      name: "Northside Regional Exchange",
      role: "Source system",
    },
    source: "ehr",
  },
];

const coverage: TimelineCoverage = {
  window: { from: "2025-07-01" },
  order: "newest-first",
  total: 43,
  hidden: [{ reason: "access", count: 2 }],
  gaps: [
    {
      from: "2026-04-03",
      to: "2026-06-21",
      reason: "the clinic changed record systems",
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

export default function StatedGapExample() {
  return (
    <CareTimeline
      aria-label="Care timeline for Ada Lovelace"
      events={events}
      now={serverTime}
      coverage={coverage}
      group="month"
    />
  );
}

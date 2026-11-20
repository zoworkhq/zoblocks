import { CareTimeline } from "@/components/zoblocks/care-timeline";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

const serverTime = "2026-08-18T10:40:00+05:30";

const events: TypedTimelineEvent[] = [
  {
    id: "hba1c-amended",
    kind: "laboratory",
    occurred: "2026-08-14T08:12:00+05:30",
    recorded: "2026-08-15T16:20:00+05:30",
    title: "HbA1c — 8.9%",
    actor: {
      name: "Northside Pathology",
      role: "Reporting laboratory",
    },
    status: "amended",
    revision: {
      at: "2026-08-15T16:20:00+05:30",
      was: "9.4%",
      reason: "Result value corrected",
    },
    source: "ehr",
  },
  {
    id: "diabetes-review-encounter",
    kind: "encounter",
    occurred: "2026-08-12T10:05:00+05:30",
    title: "HbA1c 8.9% — Diabetes review clinic",
    actor: {
      name: "Dr Wade Warren",
      role: "Endocrinology",
      organization: "Northside Clinic",
    },
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
        {
          code: "care-coordination",
          label: "Care coordination",
        },
        {
          code: "treatment",
          label: "Treatment",
        },
        {
          code: "patient-safety",
          label: "Patient safety",
        },
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
    source: "hie",
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
      reason: "one source was not reached",
    },
    {
      from: "2025-07-01",
      to: "2026-04-01",
      reason: "one source was not reached",
    },
  ],
  sources: [
    { id: "ehr", label: "Northside EHR", status: "ok" },
    {
      id: "hie",
      label: "Northside Regional Exchange",
      status: "unavailable",
      detail: "Timed out after 8s.",
    },
  ],
};

export default function SourceUnavailableExample() {
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

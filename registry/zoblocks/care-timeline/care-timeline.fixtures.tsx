/**
 * One synthetic patient, fourteen months, two source systems, one of them down.
 *
 * ⚠️  Every value here is invented. Ada Lovelace is not a patient; the
 * identifiers, dates and results are made up on reserved example systems.
 *
 * Shared between the stories and the tests so both argue about the same chart.
 * The set deliberately over-represents the hard states — lapsed, entered in
 * error, amended, restricted, consent-gated, imprecise, cross-zone — because
 * those are the states a real product gets wrong and a demo skips.
 */

import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

export const NOW = "2026-08-18T10:40:00+05:30";
export const SEEN_THROUGH = "2026-08-12T14:02:00+05:30";

export const EVENTS: TypedTimelineEvent[] = [
  {
    id: "appt-endo",
    kind: "appointment",
    occurred: "2026-09-02T09:30:00+05:30",
    status: "planned",
    title: "Endocrinology review",
    actor: { name: "Dr Wade Warren", role: "Endocrinology" },
    source: "ehr",
  },
  {
    id: "appt-retinal",
    kind: "appointment",
    occurred: "2026-08-05T11:00:00+05:30",
    status: "planned",
    title: "Diabetic retinal screening",
    source: "ehr",
  },
  {
    id: "lab-hba1c",
    kind: "laboratory",
    occurred: "2026-08-14T08:12:00+05:30",
    status: "amended",
    title: "HbA1c — 8.9%",
    actor: { name: "Northside Pathology", role: "Reporting laboratory" },
    revision: {
      at: "2026-08-15T16:20:00+05:30",
      was: "9.4%",
      reason: "result value corrected",
    },
    source: "ehr",
  },
  {
    id: "note-review",
    kind: "note",
    occurred: "2026-08-12T10:05:00+05:30",
    recorded: "2026-08-18T09:40:00+05:30",
    title: "Diabetes review — progress note",
    actor: { name: "Dr Wade Warren", role: "Endocrinology" },
    source: "ehr",
  },
  {
    id: "enc-diabetes",
    kind: "encounter",
    occurred: "2026-08-12T10:05:00+05:30",
    title: "Diabetes review clinic",
    severity: "high",
    severityStatus: "HbA1c 8.9%",
    actor: { name: "Dr Wade Warren", role: "Endocrinology", organization: "Northside Clinic" },
    source: "ehr",
  },
  {
    id: "q-history",
    kind: "questionnaire",
    occurred: "2026-08-11T09:00:00+05:30",
    title: "Pre-visit medical history",
    steps: [
      { label: "Sent to the patient", at: "2026-08-11T09:00:00+05:30", state: "done" },
      { label: "Returned by the patient", at: "2026-08-11T21:34:00+05:30", state: "done" },
      { label: "Not yet reviewed", state: "open" },
    ],
    source: "ehr",
  },
  {
    id: "obs-1",
    kind: "observation",
    occurred: "2026-08-10T08:00:00+05:30",
    title: "Blood pressure — 128/78 mmHg",
    source: "ehr",
  },
  {
    id: "obs-2",
    kind: "observation",
    occurred: "2026-08-10T12:00:00+05:30",
    title: "Capillary glucose — 7.1 mmol/L",
    source: "ehr",
  },
  {
    id: "obs-3",
    kind: "observation",
    occurred: "2026-08-09T08:00:00+05:30",
    title: "Weight — 71.4 kg",
    source: "ehr",
  },
  {
    id: "obs-4",
    kind: "observation",
    occurred: "2026-08-09T20:00:00+05:30",
    title: "Capillary glucose — 9.8 mmol/L",
    source: "ehr",
  },
  {
    id: "lab-potassium",
    kind: "laboratory",
    occurred: "2026-08-09T02:14:00+05:30",
    title: "Urea and electrolytes",
    severity: "critical",
    severityStatus: "Potassium 6.8 mmol/L",
    source: "ehr",
  },
  {
    id: "enc-ed",
    kind: "encounter",
    occurred: "2026-07-30",
    status: "in-error",
    title: "Emergency department attendance",
    revision: {
      at: "2026-07-31",
      by: { name: "Dr A Rahman" },
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
    actor: { name: "Priya Menon", role: "Front desk" },
    recipient: { name: "The patient" },
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
  {
    id: "note-psych",
    kind: "note",
    occurred: "2026-07-14",
    title: "Psychotherapy progress note",
    access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
    source: "ehr",
  },
  {
    id: "doc-outside",
    kind: "document",
    occurred: "2026-06-22",
    title: "Discharge summary",
    access: { kind: "withheld", reason: "Kept separately by its author." },
    source: "ehr",
  },
  {
    id: "med-metformin",
    kind: "medication",
    occurred: "2026-04-02T09:30:00-04:00",
    title: "Metformin 1 g — twice daily",
    actor: { name: "Northside Regional Exchange", role: "Source system" },
    source: "hie",
  },
  {
    id: "cond-gdm",
    kind: "condition",
    occurred: "2019",
    register: "patient-reported",
    title: "Gestational diabetes",
    source: "ehr",
  },
];

export const COVERAGE: TimelineCoverage = {
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

/** The same chart with every source answering. Used where the banner is noise. */
export const HEALTHY_COVERAGE: TimelineCoverage = {
  ...COVERAGE,
  gaps: undefined,
  sources: [{ id: "ehr", label: "Northside EHR", status: "ok" }],
};

"use client";

/**
 * Live examples for CareTimeline, one per state the metadata declares.
 *
 * Every example is the shipped component over the same synthetic chart the
 * stories and tests argue about — Ada Lovelace, fourteen months, two source
 * systems, one of them down. Every value is invented. What changes between
 * examples is the slice of that chart, or one prop, so each shows the single
 * thing its description says and nothing has to be read past to find it.
 *
 * `now` is the fixture's, never the clock's: planned and lapsed are judged
 * against it, and a preview that read the clock would drift out of its own
 * description the day after it shipped.
 */

import * as React from "react";
import {
  CareTimeline,
  type CareTimelineProps,
} from "@/registry/zoblocks/care-timeline/care-timeline";
import {
  COVERAGE,
  EVENTS,
  HEALTHY_COVERAGE,
  NOW,
  SEEN_THROUGH,
} from "@/registry/zoblocks/care-timeline/care-timeline.fixtures";
import type { TimelineCoverage, TypedTimelineEvent } from "@/lib/timeline-core";

/** The events with these ids, in the fixture's order. */
function pick(...ids: string[]): TypedTimelineEvent[] {
  return EVENTS.filter((event) => ids.includes(event.id));
}

/** The props every example shares; each overrides only what it is about. */
const BASE = {
  "aria-label": "Care timeline for Ada Lovelace",
  events: EVENTS,
  now: NOW,
  coverage: HEALTHY_COVERAGE,
  localeTag: "en-GB",
  filters: false,
} satisfies Partial<CareTimelineProps>;

function Timeline(props: Partial<CareTimelineProps>) {
  return (
    <div className="w-full min-w-0">
      <CareTimeline {...BASE} {...props} />
    </div>
  );
}

/** A line under the timeline saying what the host was told. */
function HostLine({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="m-0 mt-2 min-h-5 text-xs text-graphite">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* What it is a view of                                               */
/* ------------------------------------------------------------------ */

export function WholeChart() {
  const [told, setTold] = React.useState("");
  return (
    <div className="w-full min-w-0">
      <Timeline
        coverage={COVERAGE}
        onLoadOlder={() => setTold("onLoadOlder() — the host fetches the next window.")}
      />
      <HostLine>{told}</HostLine>
    </div>
  );
}

export function SourceDown() {
  return (
    <Timeline
      aria-label="Care timeline with a failed source"
      events={pick("lab-hba1c", "enc-diabetes", "note-psych", "doc-outside", "med-metformin")}
      coverage={COVERAGE}
    />
  );
}

/** Every source answered, and the caller still knows of a hole. */
const GAP_COVERAGE: TimelineCoverage = {
  ...HEALTHY_COVERAGE,
  gaps: [{ from: "2026-04-03", to: "2026-06-21", reason: "the clinic changed record systems" }],
};

export function StatedGap() {
  return (
    <Timeline
      aria-label="Care timeline with a gap in coverage"
      events={pick("appt-cancelled", "note-psych", "doc-outside", "med-metformin")}
      coverage={GAP_COVERAGE}
    />
  );
}

export function Filtered() {
  const [told, setTold] = React.useState("");
  return (
    <div className="w-full min-w-0">
      <Timeline
        aria-label="Care timeline, clinical register"
        filters
        defaultRegisters={["clinical"]}
        onRegistersChange={(registers) =>
          setTold(`onRegistersChange([${registers.map((r) => `"${r}"`).join(", ")}])`)
        }
      />
      <HostLine>{told}</HostLine>
    </div>
  );
}

export function ThreeEmpties() {
  const ehr: TimelineCoverage["sources"] = [{ id: "ehr", label: "Northside EHR", status: "ok" }];
  return (
    <div className="grid w-full min-w-0 gap-6">
      <Timeline
        aria-label="No record at all"
        events={[]}
        coverage={{ order: "newest-first", sources: ehr }}
      />
      <Timeline
        aria-label="Nothing in this window"
        events={[]}
        coverage={{
          order: "newest-first",
          window: { from: "2025-01-01", to: "2025-12-31" },
          sources: ehr,
        }}
      />
      <Timeline
        aria-label="Nothing you may see"
        events={[]}
        coverage={{
          order: "newest-first",
          hidden: [{ reason: "access", count: 3 }],
          sources: ehr,
        }}
      />
    </div>
  );
}

export function DashboardCard() {
  return (
    <div className="w-full max-w-md">
      <CareTimeline
        {...BASE}
        aria-label="Patient timeline"
        coverage={{ ...HEALTHY_COVERAGE, sources: COVERAGE.sources }}
        layout="card"
        limit={5}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Planned and happened                                               */
/* ------------------------------------------------------------------ */

export function PlannedAboveNow() {
  return (
    <Timeline
      aria-label="Care timeline with a planned review"
      events={pick("appt-endo", "lab-hba1c", "enc-diabetes")}
    />
  );
}

export function Lapsed() {
  return (
    <Timeline
      aria-label="Care timeline with a lapsed screening"
      events={pick("appt-endo", "enc-diabetes", "appt-retinal")}
    />
  );
}

export function CancelledAndNotDone() {
  return (
    <Timeline
      aria-label="Care timeline with a cancellation and a failed call"
      events={pick("call-followup", "appt-cancelled")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Corrections and access                                             */
/* ------------------------------------------------------------------ */

export function Amended() {
  return (
    <Timeline
      aria-label="Care timeline with an amended result"
      events={pick("lab-hba1c", "enc-diabetes")}
    />
  );
}

export function EnteredInError() {
  return (
    <Timeline
      aria-label="Care timeline with an entry recorded in error"
      events={pick("enc-ed", "call-followup")}
    />
  );
}

export function Restricted() {
  return (
    <Timeline
      aria-label="Care timeline with a restricted document"
      events={pick("doc-outside", "med-metformin")}
      coverage={{ ...HEALTHY_COVERAGE, hidden: undefined }}
    />
  );
}

export function ConsentGated() {
  return (
    <Timeline
      aria-label="Care timeline with a consent-gated note"
      events={pick("appt-cancelled", "note-psych")}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Reading                                                            */
/* ------------------------------------------------------------------ */

export function Thread() {
  return (
    <Timeline
      aria-label="Care timeline with an intake thread"
      events={pick("enc-diabetes", "q-history")}
    />
  );
}

export function Clustered() {
  return (
    <Timeline
      aria-label="Care timeline with clustered observations"
      events={pick("obs-1", "obs-2", "obs-3", "obs-4", "lab-potassium")}
      cluster={{ kinds: ["observation"], within: "P3D", min: 3 }}
    />
  );
}

export function NewSinceReviewed() {
  return (
    <Timeline
      aria-label="Care timeline since last review"
      events={pick("lab-hba1c", "note-review", "enc-diabetes", "q-history", "obs-1", "obs-3")}
      seenThrough={SEEN_THROUGH}
      lateEntryAfter="P2D"
    />
  );
}

export function ImpreciseDate() {
  return (
    <Timeline
      aria-label="Care timeline with an imprecise date"
      events={pick("enc-diabetes", "med-metformin", "cond-gdm")}
      group="none"
    />
  );
}

export function ByRegister() {
  return (
    <Timeline
      aria-label="Care timeline by register"
      events={pick(
        "appt-endo",
        "lab-hba1c",
        "enc-diabetes",
        "q-history",
        "call-followup",
        "appt-cancelled",
        "cond-gdm",
      )}
      layout="register"
      group="month"
      jump
    />
  );
}

export function PatientFacing() {
  return (
    <Timeline
      aria-label="Your care timeline"
      audience="patient"
      events={[
        {
          id: "lab-tft",
          kind: "laboratory",
          occurred: "2026-08-17T22:41:00+05:30",
          title: "Thyroid function",
          detail:
            "Released to you at the same time as your care team. Nobody has looked at it yet.",
          status: "in-progress",
        },
        ...pick("appt-endo", "lab-hba1c", "enc-diabetes"),
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Playground                                                         */
/* ------------------------------------------------------------------ */

/**
 * The whole chart, with a failed source and a review marker, so every knob
 * has something to act on: group re-buckets fourteen months, register splits
 * the clinical side from the rest, and the patient audience re-labels kinds.
 *
 * The list scrolls inside its own region rather than pushing the controls a
 * screen below it; the region is focusable so a keyboard can scroll it too.
 */
export function CareTimelinePlayground(props: Partial<CareTimelineProps>) {
  return (
    <div
      role="region"
      aria-label="Care timeline preview"
      tabIndex={0}
      className="max-h-[32rem] w-full min-w-0 overflow-y-auto scroll-thin"
    >
      <CareTimeline
        {...BASE}
        coverage={COVERAGE}
        seenThrough={SEEN_THROUGH}
        cluster={{ kinds: ["observation"], within: "P3D", min: 3 }}
        onLoadOlder={() => {}}
        {...props}
      />
    </div>
  );
}

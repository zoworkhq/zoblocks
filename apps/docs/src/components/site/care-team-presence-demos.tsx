"use client";

/**
 * Live previews for Care Team Presence's four declared examples. The
 * "escalation" example's own code calls `resolveEscalation` directly — the
 * live preview shows the same decision through the real `PresenceChip`,
 * which calls that resolver internally to decide what its contact button
 * offers, rather than re-deriving the result by hand.
 */

import * as React from "react";
import {
  ChartCoPresence,
  CoverageCard,
  PresenceChip,
  type ChartPresence,
  type Clinician,
  type CoverageWindow,
} from "@/registry/zoblocks/care-team-presence/care-team-presence";

const NOW = "2026-08-24T02:30:00+05:30";

const MARSH: Clinician = { id: "clin-2", display: "L. Marsh, LCSW", role: "Therapist" };
const VANCE: Clinician = { id: "clin-4", display: "A. Vance, MD", role: "Attending" };
const BOATENG: Clinician = { id: "clin-1", display: "T. Boateng, MD", role: "Night attending" };
const OKAFOR: Clinician = { id: "clin-3", display: "N. Okafor, PMHNP", role: "Nurse practitioner" };

export function NotAGreenDot() {
  return (
    <div style={{ display: "grid", gap: 14, maxInlineSize: 420, inlineSize: "100%" }}>
      <PresenceChip presence={{ clinician: MARSH, state: "in-session", until: "15:50" }} />
      <PresenceChip
        presence={{
          clinician: VANCE,
          state: "signed-out",
          coveredBy: BOATENG,
          until: "07:00",
        }}
      />
    </div>
  );
}

export function CoverageGapIsDrawn() {
  const windows: CoverageWindow[] = [
    { clinician: VANCE, start: "2026-08-24T18:00:00+05:30", end: "2026-08-25T07:00:00+05:30" },
  ];
  return (
    <div style={{ inlineSize: "100%", maxInlineSize: 320 }}>
      <CoverageCard windows={windows} now="2026-08-24T08:00:00+05:30" />
    </div>
  );
}

export function EscalationIsARedirect() {
  return (
    <div style={{ display: "grid", gap: 14, maxInlineSize: 420, inlineSize: "100%" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <PresenceChip presence={{ clinician: MARSH, state: "in-group", coveredBy: OKAFOR }} />
        <span style={{ fontSize: 12, opacity: 0.62 }}>With cover named — offers the cover.</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <PresenceChip presence={{ clinician: MARSH, state: "in-group" }} />
        <span style={{ fontSize: 12, opacity: 0.62 }}>
          With nobody covering — offers an override instead.
        </span>
      </div>
    </div>
  );
}

export function ToldBeforeYouType() {
  const [last, setLast] = React.useState<string | null>(null);
  const others: ChartPresence[] = [
    {
      clinician: MARSH,
      activity: "documenting",
      since: "2026-08-24T02:12:00+05:30",
      target: "Progress note",
      unsigned: true,
    },
  ];
  return (
    <div style={{ display: "grid", gap: 10, inlineSize: "100%", maxInlineSize: 420 }}>
      <ChartCoPresence
        others={others}
        now={NOW}
        onOpenTheirs={() => setLast("Opened their draft, read-only.")}
        onRequestHandoff={() => setLast("Requested a handoff.")}
        onSeparateAddendum={() => setLast("Started a separate addendum.")}
      />
      <span style={{ fontSize: 12, opacity: 0.62 }}>
        {last ??
          "Pick one — none is highlighted, because which is right depends on facts this component does not have."}
      </span>
    </div>
  );
}

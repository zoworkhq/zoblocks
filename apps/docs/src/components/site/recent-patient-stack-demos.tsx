"use client";

/**
 * Live previews for Recent Patient Stack's four declared examples, all of
 * which are pure function-call demonstrations in their own code. Three of
 * the four (similar, closing, return) are decisions the real component
 * already makes internally — `canClose` and `needsReassertion` are called
 * by the component itself, not by a host wiring them in — so giving it the
 * right fixture and letting it run is the live preview, not a re-derivation.
 */

import * as React from "react";
import {
  RecentPatientStack,
  chartAccent,
  type OpenChart,
} from "@/registry/zoblocks/recent-patient-stack/recent-patient-stack";

const NOW = "2026-08-24T10:20:00Z";

export function HueIsDerived() {
  const charts: OpenChart[] = [
    { id: "chart-okonkwo", display: "A. Okonkwo", reason: "Ward round" },
    { id: "chart-boateng", display: "T. Boateng", reason: "Triage" },
    { id: "chart-marsh", display: "L. Marsh", reason: "Med review" },
  ];
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" now={NOW} />
      <dl style={{ display: "flex", gap: 14, margin: 0, fontSize: 12, opacity: 0.62 }}>
        {charts.map((chart) => (
          <div key={chart.id} style={{ display: "flex", gap: 4 }}>
            <dt>{chart.id}</dt>
            <dd style={{ margin: 0 }}>slot {chartAccent(chart.id)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function BothGrowAnIdentifier() {
  const charts: OpenChart[] = [
    { id: "look-a", display: "J. Okonkwo", identifier: "093-441-208", reason: "Ward round" },
    { id: "look-b", display: "J. Okonjo", identifier: "093-118-774", reason: "Triage" },
    { id: "look-c", display: "T. Boateng", identifier: "093-772-115", reason: "Med review" },
  ];
  return <RecentPatientStack charts={charts} activeId="look-a" now={NOW} />;
}

export function ClosingIsGraded() {
  const charts: OpenChart[] = [
    { id: "clean", display: "A. Okonkwo", reason: "Ward round" },
    {
      id: "with-note",
      display: "T. Boateng",
      reason: "Discharge summary",
      work: [{ kind: "unsigned-note", label: "Progress note" }],
    },
    {
      id: "with-order",
      display: "L. Marsh",
      reason: "Triage",
      work: [{ kind: "draft-order", label: "Lithium level" }],
    },
  ];
  const [open, setOpen] = React.useState(charts);
  const [last, setLast] = React.useState<string | null>(null);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <RecentPatientStack
        charts={open}
        activeId="clean"
        now={NOW}
        expanded
        onClose={(chart) => {
          setLast(`Closed — ${chart.display} had nothing to lose.`);
          setOpen((current) => current.filter((c) => c.id !== chart.id));
        }}
      />
      <span style={{ fontSize: 12, opacity: 0.62 }}>
        {last ??
          "Close each: the clean one closes, the unsigned note asks first, the draft order refuses outright."}
      </span>
    </div>
  );
}

export function ReturnReasserts() {
  const [last, setLast] = React.useState<string | null>(null);
  const charts: OpenChart[] = [
    {
      id: "fresh",
      display: "A. Okonkwo",
      reason: "Ward round",
      lastActiveAt: "2026-08-24T10:18:00Z",
    },
    { id: "stale", display: "T. Boateng", reason: "Triage", lastActiveAt: "2026-08-24T10:00:00Z" },
  ];
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <RecentPatientStack
        charts={charts}
        activeId="fresh"
        now={NOW}
        onActivate={(chart, { reassert }) =>
          setLast(
            `${chart.display}: ${reassert ? "re-asserts — away long enough to matter" : "no re-assertion needed"}`,
          )
        }
      />
      <span style={{ fontSize: 12, opacity: 0.62 }}>
        {last ?? 'Pick a chart — "fresh" was active 2 min ago, "stale" 20 min ago.'}
      </span>
    </div>
  );
}

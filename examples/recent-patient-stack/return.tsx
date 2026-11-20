import { useState } from "react";
import { RecentPatientStack, type OpenChart } from "@/components/zoblocks/recent-patient-stack";

const now = "2026-08-24T10:20:00Z";

const charts: OpenChart[] = [
  // Active 2 minutes ago: needsReassertion(chart, now) → false
  {
    id: "fresh",
    display: "A. Okonkwo",
    reason: "Ward round",
    lastActiveAt: "2026-08-24T10:18:00Z",
  },
  // Active 20 minutes ago: needsReassertion(chart, now) → true
  { id: "stale", display: "T. Boateng", reason: "Triage", lastActiveAt: "2026-08-24T10:00:00Z" },
];

export default function ReturnExample() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="grid gap-1.5">
      <RecentPatientStack
        charts={charts}
        activeId="fresh"
        now={now}
        onActivate={(chart, { reassert }) =>
          setLast(
            `${chart.display}: ${reassert ? "re-asserts — away long enough to matter" : "no re-assertion needed"}`,
          )
        }
      />
      <span className="text-xs opacity-60">
        {last ?? 'Pick a chart — "fresh" was active 2 min ago, "stale" 20 min ago.'}
      </span>
    </div>
  );
}

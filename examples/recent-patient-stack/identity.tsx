import {
  RecentPatientStack,
  chartAccent,
  type OpenChart,
} from "@/components/zoblocks/recent-patient-stack";

// A fixed clock, so "last active" readings are the same on every render.
const now = "2026-08-24T10:20:00Z";

const charts: OpenChart[] = [
  { id: "chart-okonkwo", display: "A. Okonkwo", reason: "Ward round" },
  { id: "chart-boateng", display: "T. Boateng", reason: "Triage" },
  { id: "chart-marsh", display: "L. Marsh", reason: "Med review" },
];

export default function IdentityExample() {
  return (
    <div className="grid gap-2.5">
      <RecentPatientStack charts={charts} activeId="chart-okonkwo" now={now} />
      {/* chartAccent("chart-okonkwo") → the same slot today and next month */}
      <dl className="m-0 flex gap-3.5 text-xs opacity-60">
        {charts.map((chart) => (
          <div key={chart.id} className="flex gap-1">
            <dt>{chart.id}</dt>
            <dd className="m-0">slot {chartAccent(chart.id)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

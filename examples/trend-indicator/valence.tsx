import { TrendIndicator } from "@/components/zoblocks/trend-indicator";

// The same falling shape, twice: improvement for PHQ-9, decline for eGFR.
const phq9 = [
  { at: "2026-05-02", value: 18 },
  { at: "2026-06-06", value: 14 },
  { at: "2026-07-04", value: 12 },
];

const egfr = [
  { at: "2026-05-02", value: 92 },
  { at: "2026-06-06", value: 88 },
  { at: "2026-07-04", value: 86 },
];

export default function ValenceExample() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">PHQ-9</span>
        <TrendIndicator
          series={{
            id: "phq9",
            label: "PHQ-9",
            valence: "higher-is-worse",
            significantChange: 5,
            points: phq9,
          }}
          width={120}
          height={32}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">eGFR</span>
        <TrendIndicator
          series={{
            id: "egfr",
            label: "eGFR",
            valence: "higher-is-better",
            unit: "mL/min",
            points: egfr,
          }}
          width={120}
          height={32}
        />
      </div>
    </div>
  );
}

import { TrendIndicator } from "@/components/zoblocks/trend-indicator";

export default function TooFewExample() {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Creatinine</span>
      {/* Renders "2 results. A trend needs at least 3." — no line. */}
      <TrendIndicator
        width={180}
        height={36}
        series={{
          id: "cr",
          label: "Creatinine",
          valence: "higher-is-worse",
          unit: "µmol/L",
          points: [
            { at: "2026-06-01", value: 88 },
            { at: "2026-07-01", value: 104 },
          ],
        }}
      />
    </div>
  );
}

import { TrendIndicator } from "@/components/zoblocks/trend-indicator";

export default function NoiseExample() {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">PHQ-9</span>
      <TrendIndicator
        width={180}
        height={36}
        series={{
          id: "phq9",
          label: "PHQ-9",
          valence: "higher-is-worse",
          // The reliable-change index for the PHQ-9. Below it, noise.
          significantChange: 5,
          points: [
            { at: "2026-05-02", value: 14 },
            { at: "2026-06-06", value: 13 },
            { at: "2026-07-04", value: 12 },
          ],
        }}
      />
    </div>
  );
}

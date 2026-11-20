import { TrendIndicator } from "@/components/zoblocks/trend-indicator";

export default function ComparabilityExample() {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Ferritin</span>
      <TrendIndicator
        width={180}
        height={36}
        series={{
          id: "ferritin",
          label: "Ferritin",
          valence: "higher-is-worse",
          unit: "ng/mL",
          points: [
            { at: "2026-01-04", value: 180 },
            { at: "2026-03-02", value: 176 },
            { at: "2026-04-10", value: 172 },
            // Everything after this is on a different scale.
            { at: "2026-05-09", value: 212, breaksComparability: "Switched to Roche Elecsys" },
            { at: "2026-07-11", value: 218 },
          ],
        }}
      />
    </div>
  );
}

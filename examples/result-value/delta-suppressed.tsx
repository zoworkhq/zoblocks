import { ResultValue } from "@/components/zoblocks/result-value";

export default function DeltaSuppressedExample() {
  return (
    <div className="grid gap-2.5">
      <div className="grid gap-1">
        <span className="text-xs opacity-60">Same assay — the delta prints.</span>
        <ResultValue
          value={{
            id: "tsh-same-assay",
            analyte: "TSH",
            value: 6.4,
            unit: "mIU/L",
            range: { low: 0.4, high: 4.0 },
            resultedAt: "2026-02-15T09:00:00Z",
            prior: { value: 3.1, at: "2026-02-01T09:00:00Z" },
          }}
        />
      </div>
      <div className="grid gap-1">
        <span className="text-xs opacity-60">
          Different assay — flagged, and the delta disappears entirely.
        </span>
        <ResultValue
          value={{
            id: "tsh",
            analyte: "TSH",
            value: 6.4,
            unit: "mIU/L",
            range: { low: 0.4, high: 4.0 },
            resultedAt: "2026-02-15T09:00:00Z",
            // Same analyte, different assay. No delta is drawn.
            prior: { value: 3.1, at: "2026-02-01T09:00:00Z", differentMethod: true },
          }}
        />
      </div>
    </div>
  );
}

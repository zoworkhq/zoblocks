import { ProvenanceChip } from "@/components/zoblocks/provenance-chip";

// A fixed clock, so the chips' ages read the same on every render.
const now = "2026-08-12T10:00:00Z";
const t12min = "2026-08-12T09:48:00Z";
const t4days = "2026-08-08T08:10:00Z";

export default function SixProvenancesExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <ProvenanceChip
        now={now}
        record={{
          source: "clinic",
          observedAt: t12min,
          performer: { display: "M. Adeyemi", role: "MA" },
          device: "Welch Allyn 6000",
        }}
      />
      <ProvenanceChip
        now={now}
        record={{
          source: "device",
          observedAt: t4days,
          device: "Omron BP7450",
          deviceNote: "unvalidated cuff size, median of 3",
        }}
      />
      <ProvenanceChip
        now={now}
        record={{
          source: "ai-extracted",
          observedAt: "2026-08-10T09:00:00Z",
          model: "zb-extract-3",
          span: { document: "Scanned referral", page: 2, line: 14 },
          confirmed: false,
        }}
      />
    </div>
  );
}

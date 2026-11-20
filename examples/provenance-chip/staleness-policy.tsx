import { ProvenanceChip, type StalenessPolicy } from "@/components/zoblocks/provenance-chip";

const now = "2026-08-12T10:00:00Z";
const t4days = "2026-08-08T08:10:00Z";

const policy: StalenessPolicy = (record) => {
  if (record.source === "device") return 48 * 3600_000; // two days
  if (record.source === "patient-reported") return 30 * 86400_000;
  return null; // no opinion, and the chip says nothing rather than guessing
};

export default function StalenessPolicyExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="grid gap-1">
        <ProvenanceChip
          now={now}
          stalenessPolicy={policy}
          record={{ source: "device", observedAt: t4days, device: "Omron BP7450" }}
        />
        <span className="text-xs opacity-60">
          A device reading, 4 days old — past its 2-day threshold.
        </span>
      </div>
      <div className="grid gap-1">
        <ProvenanceChip
          now={now}
          stalenessPolicy={policy}
          record={{
            source: "clinic",
            observedAt: t4days,
            performer: { display: "M. Adeyemi", role: "MA" },
          }}
        />
        <span className="text-xs opacity-60">
          A clinic reading, the same age — no policy opinion, so no staleness mark.
        </span>
      </div>
    </div>
  );
}

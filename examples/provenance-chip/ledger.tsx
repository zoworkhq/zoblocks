import { ProvenanceChip, ledgerFrom } from "@/components/zoblocks/provenance-chip";

const now = "2026-08-12T10:00:00Z";
const t = "2026-08-10T09:00:00Z";

// The host subscribes once; the chips read from the ledger and never fetch.
const ledger = ledgerFrom({
  "obs-1": { source: "clinic", observedAt: t },
  // Versioned first: an amended value and its original are two provenances.
  "obs-1@2": { source: "amended", observedAt: t, supersedes: { value: "182/76", reason: "typo" } },
});

export default function LedgerExample() {
  return <ProvenanceChip resourceId="obs-1" versionId="2" ledger={ledger} now={now} />;
}

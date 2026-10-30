"use client";

/**
 * Live previews for Provenance Chip's four declared examples.
 */

import {
  ProvenanceChip,
  ledgerFrom,
  type StalenessPolicy,
} from "@/registry/zoblocks/provenance-chip/provenance-chip";

const NOW = "2026-08-12T10:00:00Z";

export function SixProvenances() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <ProvenanceChip
        now={NOW}
        record={{
          source: "clinic",
          observedAt: "2026-08-12T09:48:00Z",
          performer: { display: "M. Adeyemi", role: "MA" },
          device: "Welch Allyn 6000",
        }}
      />
      <ProvenanceChip
        now={NOW}
        record={{
          source: "device",
          observedAt: "2026-08-08T08:10:00Z",
          device: "Omron BP7450",
          deviceNote: "unvalidated cuff size, median of 3",
        }}
      />
      <ProvenanceChip
        now={NOW}
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

export function DocumentVintage() {
  return (
    <ProvenanceChip
      now={NOW}
      record={{
        source: "external",
        organisation: "Northgate Family Med",
        exchange: "Carequality",
        document: "C-CDA, authored 11 Mar",
        observedAt: "2026-01-14T09:00:00Z",
        recordedAt: "2026-03-11T00:00:00Z",
      }}
    />
  );
}

export function OneSubscription() {
  const ledger = ledgerFrom({
    "obs-1": { source: "clinic", observedAt: "2026-08-10T09:00:00Z" },
    "obs-1@2": {
      source: "amended",
      observedAt: "2026-08-10T09:00:00Z",
      supersedes: { value: "182/76", reason: "typo" },
    },
  });
  return <ProvenanceChip resourceId="obs-1" versionId="2" ledger={ledger} now={NOW} />;
}

const POLICY: StalenessPolicy = (record) => {
  if (record.source === "device") return 48 * 3_600_000;
  if (record.source === "patient-reported") return 30 * 86_400_000;
  return null;
};

export function FourDaysDiffersByDatum() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <ProvenanceChip
          now={NOW}
          stalenessPolicy={POLICY}
          record={{ source: "device", observedAt: "2026-08-08T08:10:00Z", device: "Omron BP7450" }}
        />
        <span style={{ fontSize: 12, opacity: 0.62 }}>
          A device reading, 4 days old — past its 2-day threshold.
        </span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <ProvenanceChip
          now={NOW}
          stalenessPolicy={POLICY}
          record={{
            source: "clinic",
            observedAt: "2026-08-08T08:10:00Z",
            performer: { display: "M. Adeyemi", role: "MA" },
          }}
        />
        <span style={{ fontSize: 12, opacity: 0.62 }}>
          A clinic reading, the same age — no policy opinion, so no staleness mark.
        </span>
      </div>
    </div>
  );
}

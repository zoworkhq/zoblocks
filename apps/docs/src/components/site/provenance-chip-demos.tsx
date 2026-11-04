"use client";
import * as React from "react";
/**
 * Live previews for Provenance Chip examples.
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
      <ProvenanceChip
        now={NOW}
        record={{
          source: "patient-reported",
          observedAt: "2026-08-11T20:15:00Z",
        }}
      />
      <ProvenanceChip
        now={NOW}
        record={{
          source: "ai-extracted",
          observedAt: "2026-08-10T09:00:00Z",
          model: "zb-extract-3",
          span: { document: "Scanned referral", page: 2, line: 14 },
          confirmed: true,
          confirmedBy: { display: "Dr. R. Okafor", role: "Attending" },
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

export function GlyphOnlyGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      <div>
        <span>Blood pressure · 128/76</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{ source: "clinic", observedAt: "2026-08-12T09:48:00Z" }}
        />
      </div>

      <div>
        <span>Heart rate · 72 bpm</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{
            source: "device",
            observedAt: "2026-08-08T08:10:00Z",
            device: "Omron BP7450",
          }}
        />
      </div>

      <div>
        <span>Pain score · 3/10</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{ source: "patient-reported", observedAt: "2026-08-11T20:15:00Z" }}
        />
      </div>

      <div>
        <span>Diagnosis · Hypertension</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{
            source: "external",
            exchange: "Carequality",
            observedAt: "2026-08-10T09:00:00Z",
          }}
        />
      </div>

      <div>
        <span>Potassium · 4.2 mmol/L</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{
            source: "ai-extracted",
            model: "zb-extract-3",
            observedAt: "2026-08-11T08:00:00Z",
          }}
        />
      </div>

      <div>
        <span>Medication · Metformin</span>
        <ProvenanceChip
          now={NOW}
          glyphOnly
          record={{
            source: "amended",
            observedAt: "2026-08-11T10:00:00Z",
            supersedes: { value: "Previous medication entry" },
          }}
        />
      </div>
    </div>
  );
}

export function NoLedgerEntry() {
  const ledger = ledgerFrom({});

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>Blood pressure</span>
        <strong>128/76 mmHg</strong>
        <ProvenanceChip resourceId="obs-missing" ledger={ledger} now={NOW} />
      </div>

      <span style={{ fontSize: 12, opacity: 0.62 }}>
        No provenance entry exists, so no chip is rendered.
      </span>
    </div>
  );
}
export function ChainAndSpanReachable() {
  const [message, setMessage] = React.useState("");

  const record = {
    source: "ai-extracted" as const,
    observedAt: "2026-08-11T09:00:00Z",
    model: "zb-extract-3",
    span: {
      document: "Scanned referral",
      page: 2,
      line: 14,
    },
    confirmed: false,
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ProvenanceChip
        now={NOW}
        record={record}
        onOpenChain={(record) => setMessage(`Chain opened: ${record.source} · ${record.model}`)}
        onOpenSpan={(span) =>
          setMessage(`Span opened: ${span.document}, page ${span.page}, line ${span.line}`)
        }
      />

      {message && <span style={{ fontSize: 12, opacity: 0.7 }}>{message}</span>}
    </div>
  );
}

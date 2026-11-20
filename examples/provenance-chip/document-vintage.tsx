import { ProvenanceChip } from "@/components/zoblocks/provenance-chip";

const now = "2026-08-12T10:00:00Z";

export default function DocumentVintageExample() {
  return (
    <ProvenanceChip
      now={now}
      record={{
        source: "external",
        organisation: "Northgate Family Med",
        exchange: "Carequality",
        document: "C-CDA, authored 11 Mar",
        observedAt: "2026-01-14T09:00:00Z", // the reading
        recordedAt: "2026-03-11T00:00:00Z", // the document
      }}
    />
  );
}

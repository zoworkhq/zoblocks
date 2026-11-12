"use client";

import * as React from "react";
import { AllergyChip, AllergyList } from "@/registry/zoblocks/allergy-chip/allergy-chip";

export function CriticalityIsNotSeverity() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AllergyChip
        record={{
          id: "1",
          substance: "Penicillin G",
          kind: "allergy",
          criticality: "high",
          verification: "confirmed",
          reactions: [
            { manifestation: "Urticaria", severity: "mild", onset: "1998", note: "age 6" },
          ],
        }}
      />
      <AllergyChip
        record={{
          id: "2",
          substance: "Amoxicillin",
          kind: "allergy",
          criticality: "low",
          verification: "unconfirmed",
          reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
        }}
      />
    </div>
  );
}

export function TwoEmptyStates() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AllergyList
        noneKnown={{
          asserter: "R. Okafor, RN",
          assertedAt: "14 Aug 2026",
          context: "reconciled at intake",
        }}
      />
      <AllergyList noneKnown={{ assertedAt: "14 Aug 2026" }} onAsk={() => {}} />
    </div>
  );
}

export function Intolerance() {
  return (
    <AllergyChip
      record={{
        id: "3",
        substance: "Lithium carbonate",
        kind: "intolerance",
        criticality: "unable-to-assess",
        verification: "confirmed",
        reactions: [
          {
            manifestation: "Tremor, polyuria",
            severity: "moderate",
            note: "ongoing at therapeutic level",
          },
        ],
      }}
    />
  );
}

export function Refuted() {
  return (
    <AllergyChip
      record={{
        id: "4",
        substance: "Sulfa drugs",
        kind: "allergy",
        verification: "refuted",
        note: "Rechallenged 2024 · tolerated · refuted by allergist",
      }}
    />
  );
}

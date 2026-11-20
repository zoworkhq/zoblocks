import type { AllergyRecord, NoKnownAllergies } from "@/lib/zoblocks-allergy";

// 01 — Two rows, one manifestation, opposite consequences
export const allergyHighRisk: AllergyRecord = {
  id: "1",
  substance: "Penicillin G",
  kind: "allergy",
  criticality: "high",
  verification: "confirmed",
  reactions: [
    {
      manifestation: "Urticaria",
      severity: "mild",
      onset: "1998",
      note: "age 6",
    },
  ],
};

export const allergyLowRisk: AllergyRecord = {
  id: "2",
  substance: "Amoxicillin",
  kind: "allergy",
  criticality: "low",
  verification: "unconfirmed",
  reactions: [{ manifestation: "Urticaria", severity: "mild", onset: "2019" }],
};

// 02 — The two absences that are not the same fact
export const allergyListKnown: NoKnownAllergies = {
  asserter: "R. Okafor, RN",
  assertedAt: "14 Aug 2026",
  context: "reconciled at intake",
};

export const allergyListUnattributed: Partial<NoKnownAllergies> = {
  assertedAt: "14 Aug 2026",
};

// 03 — An intolerance is not a weak allergy
export const allergyModerate: AllergyRecord = {
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
};

// 04 — A refuted entry stays in the record
export const allergyRefuted: AllergyRecord = {
  id: "4",
  substance: "Sulfa drugs",
  kind: "allergy",
  verification: "refuted",
  note: "Rechallenged 2024 · tolerated · refuted by allergist",
};

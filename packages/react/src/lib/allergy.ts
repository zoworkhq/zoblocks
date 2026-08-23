// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/allergy.ts. Edit that file, not this one.
/**
 * Two severity-shaped fields that mean opposite things, and the empty state
 * that is not empty.
 *
 * `AllergyIntolerance` carries `criticality` — the clinician's judgement of
 * the risk of a *future* life-threatening reaction — and `reaction.severity`,
 * which describes how bad a *past* reaction was. A patient whose only
 * documented reaction was mild urticaria can still be `criticality: high`;
 * that is the entire reason the field exists. Nearly every implementation
 * renders one and drops the other, and the one they keep is the past.
 *
 * The second failure is subtler and more common. "No known allergies" and
 * "nobody asked" are shown the same way, and an empty allergy list beside a
 * prescribing button is an assertion the software has not earned. So the two
 * are different shapes here, and a no-known assertion without an asserter and
 * a date degrades to not-asked rather than being taken on trust.
 *
 * No React, no DOM, and no terminology bundle: class expansion is an injected
 * function, because shipping RxNorm inside a chip is not a component.
 */

/* ------------------------------------------------------------------ */
/* What kind of thing it is                                            */
/* ------------------------------------------------------------------ */

/**
 * Four, not two.
 *
 * FHIR R4 offers `allergy | intolerance`, and that is too coarse in two
 * directions. An intolerance is not a weak allergy — akathisia on
 * aripiprazole and sedation on quetiapine dominate psychotropic histories and
 * are the entries most often lost, because somebody decided they were "not
 * real allergies". And a contraindication is neither: it is a reason not to
 * prescribe that has nothing to do with the immune system.
 */
export type AllergyKind = "allergy" | "intolerance" | "adverse-reaction" | "contraindication";

export const KIND_LABEL: Record<AllergyKind, string> = {
  allergy: "Allergy",
  intolerance: "Intolerance",
  "adverse-reaction": "Non-allergic adverse reaction",
  contraindication: "Contraindication",
};

/** How much the record is believed. Six, and two of them mean "do not act". */
export type Verification =
  "unconfirmed" | "presumed" | "confirmed" | "refuted" | "entered-in-error" | "unable-to-verify";

export const VERIFICATION_LABEL: Record<Verification, string> = {
  unconfirmed: "Unconfirmed",
  presumed: "Presumed",
  confirmed: "Confirmed",
  refuted: "Refuted",
  "entered-in-error": "Entered in error",
  "unable-to-verify": "Unable to verify",
};

/**
 * The two verification states that mean the entry is no longer a warning.
 *
 * Exported because a prescribing check has to ask, and asking by string
 * comparison in five places is how one of them gets missed.
 */
export const INACTIVE_VERIFICATIONS: readonly Verification[] = ["refuted", "entered-in-error"];

export function isActive(verification: Verification | undefined): boolean {
  return !verification || !INACTIVE_VERIFICATIONS.includes(verification);
}

/** Future risk. The field implementations drop. */
export type Criticality = "high" | "low" | "unable-to-assess";

/** Worst past reaction. The field implementations keep and mislabel. */
export type ReactionSeverity = "mild" | "moderate" | "severe";

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  high: "High criticality",
  low: "Low criticality",
  "unable-to-assess": "Unable to assess",
};

export const SEVERITY_LABEL: Record<ReactionSeverity, string> = {
  mild: "mild",
  moderate: "moderate",
  severe: "severe",
};

/* ------------------------------------------------------------------ */
/* The record                                                          */
/* ------------------------------------------------------------------ */

export interface Reaction {
  /** "Urticaria", "Anaphylaxis", "Tremor, polyuria". */
  manifestation: string;
  severity?: ReactionSeverity;
  /** ISO 8601 or a prose year — "1998", "2019-04-02". */
  onset?: string;
  /** "age 6", "ongoing at therapeutic level". */
  note?: string;
}

export interface AllergyRecord {
  id: string;
  /** "Penicillin G", "Lithium carbonate". Rendered first and at full weight. */
  substance: string;
  kind: AllergyKind;
  criticality?: Criticality;
  verification?: Verification;
  reactions?: readonly Reaction[];
  /** Who said so, and when. Rendered in the popover, not the chip. */
  asserter?: string;
  recordedDate?: string;
  lastOccurrence?: string;
  category?: "food" | "medication" | "environment" | "biologic";
  /** Free text the record carried — "Rechallenged 2024 · tolerated". */
  note?: string;
}

/**
 * Expands a substance into the class it implicates.
 *
 * Injected rather than bundled. A cephalosporin entry implicates the
 * beta-lactams, and knowing that requires a terminology service — which is a
 * deployment's concern, not a chip's. Returning `null` means the host has no
 * expansion for this substance, which is different from an expansion of zero.
 */
export type ClassExpander = (substance: string) => { label: string; count: number } | null;

/* ------------------------------------------------------------------ */
/* The two empty states                                                */
/* ------------------------------------------------------------------ */

/**
 * A no-known-allergies assertion, which is a positive clinical finding.
 *
 * It has an author and a date or it is not one. `asserter` and `assertedAt`
 * are both required for exactly that reason: SNOMED 716186003 recorded by
 * nobody, at no time, is the same nothing as an empty list — and it is the
 * nothing that gets prescribed against.
 */
export interface NoKnownAllergies {
  asserter: string;
  assertedAt: string;
  /** "reconciled at intake", "confirmed with the patient's mother". */
  context?: string;
  /** Which class the assertion covers. Undefined means all of them. */
  scope?: "medication" | "food" | "environment";
}

export type AllergyListState =
  | { kind: "records"; records: readonly AllergyRecord[] }
  | { kind: "none-known"; assertion: NoKnownAllergies }
  | { kind: "not-asked" };

/**
 * Which of the three states a list is actually in.
 *
 * The degradation is the point: a caller that passes a no-known assertion
 * missing its asserter or its date gets `not-asked`, because that is what an
 * unattributed assertion is worth. Silently accepting it would let a
 * prescribing screen show "No known allergies" on the strength of nothing.
 */
export function resolveListState(input: {
  records?: readonly AllergyRecord[];
  noneKnown?: Partial<NoKnownAllergies>;
}): AllergyListState {
  const active = (input.records ?? []).filter((r) => isActive(r.verification));
  if (active.length) return { kind: "records", records: input.records ?? [] };

  const { asserter, assertedAt } = input.noneKnown ?? {};
  if (asserter?.trim() && assertedAt?.trim()) {
    return { kind: "none-known", assertion: { ...input.noneKnown, asserter, assertedAt } };
  }

  // Includes the case where every record is refuted or entered in error: the
  // list is empty of warnings, and nobody has asserted that it should be.
  return { kind: "not-asked" };
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

/** The worst past reaction, which is not the same question as the risk. */
export function worstReaction(record: AllergyRecord): Reaction | null {
  const order: Record<ReactionSeverity, number> = { severe: 3, moderate: 2, mild: 1 };
  let worst: Reaction | null = null;
  for (const reaction of record.reactions ?? []) {
    const rank = reaction.severity ? order[reaction.severity] : 0;
    const best = worst?.severity ? order[worst.severity] : 0;
    if (!worst || rank > best) worst = reaction;
  }
  return worst;
}

/**
 * The accessible name: kind, substance, criticality, verification. In that
 * order, and always all four.
 *
 * Criticality before verification because it is what decides whether to
 * prescribe; verification last because it decides how much to trust the rest.
 * The past reaction comes after both, since leading with it is the mistake
 * this component exists to correct.
 */
export function describeAllergy(record: AllergyRecord): string {
  const parts: string[] = [`${KIND_LABEL[record.kind]}: ${record.substance}`];

  if (record.criticality) parts.push(CRITICALITY_LABEL[record.criticality].toLowerCase());
  if (record.verification) parts.push(VERIFICATION_LABEL[record.verification].toLowerCase());

  const worst = worstReaction(record);
  if (worst) {
    const severity = worst.severity ? `, ${SEVERITY_LABEL[worst.severity]}` : "";
    const when = worst.onset ? `, ${worst.onset}` : "";
    parts.push(`worst recorded reaction ${worst.manifestation.toLowerCase()}${severity}${when}`);
  } else if (record.criticality) {
    // Said out loud, because its absence beside a high criticality is exactly
    // the combination a reader is most likely to misread as a contradiction.
    parts.push("no reaction recorded");
  }

  if (record.note) parts.push(record.note);
  return `${parts.join(", ")}.`;
}

export function describeNoKnown(assertion: NoKnownAllergies): string {
  const scope = assertion.scope ? ` ${assertion.scope}` : "";
  const context = assertion.context ? `, ${assertion.context}` : "";
  return `No known${scope} allergies. Asserted by ${assertion.asserter} on ${assertion.assertedAt}${context}.`;
}

export const NOT_ASKED_SENTENCE =
  "Allergy status not recorded. There is no entry, and no assertion that there is nothing to enter.";

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

interface FhirConcept {
  coding?: Array<{ system?: string; code?: string; display?: string }>;
  text?: string;
}

interface FhirAllergy {
  id?: string;
  type?: string;
  category?: string[];
  criticality?: string;
  code?: FhirConcept;
  clinicalStatus?: FhirConcept;
  verificationStatus?: FhirConcept;
  onsetDateTime?: string;
  recordedDate?: string;
  lastOccurrence?: string;
  asserter?: { display?: string };
  note?: Array<{ text?: string }>;
  reaction?: Array<{
    manifestation?: FhirConcept[];
    description?: string;
    severity?: string;
    onset?: string;
  }>;
}

/** SNOMED codes that assert an absence rather than record a presence. */
export const NO_KNOWN_ALLERGY_CODES: Record<string, NoKnownAllergies["scope"] | undefined> = {
  "716186003": undefined, // No known allergy
  "409137002": "medication", // No known drug allergy
  "429625007": "food", // No known food allergy
  "428607008": "environment", // No known environmental allergy
};

function conceptText(concept: FhirConcept | undefined): string | undefined {
  return concept?.text ?? concept?.coding?.[0]?.display;
}

function conceptCode(concept: FhirConcept | undefined): string | undefined {
  return concept?.coding?.[0]?.code;
}

/**
 * `AllergyIntolerance.type` onto the four kinds.
 *
 * R4 only has two, so the other two are read from `category` and from the
 * clinical-status coding a deployment uses for them. A host with richer data
 * should set `kind` directly rather than round-tripping through this.
 */
export function toKind(observation: FhirAllergy): AllergyKind {
  if (observation.type === "intolerance") return "intolerance";
  if (observation.type === "allergy") return "allergy";
  // No type at all is the common real-world case, and "allergy" is the wrong
  // guess: it is the stronger claim, and the one that stops a prescription.
  return "adverse-reaction";
}

export function toVerification(concept: FhirConcept | undefined): Verification | undefined {
  switch (conceptCode(concept)) {
    case "unconfirmed":
      return "unconfirmed";
    case "presumed":
      return "presumed";
    case "confirmed":
      return "confirmed";
    case "refuted":
      return "refuted";
    case "entered-in-error":
      return "entered-in-error";
    default:
      return undefined;
  }
}

/**
 * A FHIR `AllergyIntolerance` as an `AllergyRecord`.
 *
 * Returns `null` when the resource is a no-known-allergy assertion rather than
 * an allergy — those are a different shape and rendering one as an allergy to
 * "No known allergy" is a real bug that ships.
 */
export function fromAllergyIntolerance(resource: FhirAllergy): AllergyRecord | null {
  const code = conceptCode(resource.code);
  if (code && code in NO_KNOWN_ALLERGY_CODES) return null;

  const record: AllergyRecord = {
    id: resource.id ?? "",
    substance: conceptText(resource.code) ?? "Unnamed substance",
    kind: toKind(resource),
  };

  if (resource.criticality === "high" || resource.criticality === "low") {
    record.criticality = resource.criticality;
  } else if (resource.criticality === "unable-to-assess") {
    record.criticality = "unable-to-assess";
  }

  const verification = toVerification(resource.verificationStatus);
  if (verification) record.verification = verification;

  const reactions = (resource.reaction ?? [])
    .map((reaction) => {
      const manifestation =
        reaction.manifestation
          ?.map((m) => conceptText(m))
          .filter(Boolean)
          .join(", ") ?? reaction.description;
      if (!manifestation) return null;
      const out: Reaction = { manifestation };
      if (
        reaction.severity === "mild" ||
        reaction.severity === "moderate" ||
        reaction.severity === "severe"
      ) {
        out.severity = reaction.severity;
      }
      if (reaction.onset) out.onset = reaction.onset;
      return out;
    })
    .filter((r): r is Reaction => r !== null);
  if (reactions.length) record.reactions = reactions;

  if (resource.asserter?.display) record.asserter = resource.asserter.display;
  if (resource.recordedDate) record.recordedDate = resource.recordedDate;
  if (resource.lastOccurrence) record.lastOccurrence = resource.lastOccurrence;

  const category = resource.category?.[0];
  if (
    category === "food" ||
    category === "medication" ||
    category === "environment" ||
    category === "biologic"
  ) {
    record.category = category;
  }

  const note = (resource.note ?? [])
    .map((n) => n.text)
    .filter(Boolean)
    .join(" · ");
  if (note) record.note = note;

  return record;
}

/**
 * The no-known assertion carried by a bundle, if there is a valid one.
 *
 * A resource with a no-known code but no asserter returns `null`, for the same
 * reason `resolveListState` degrades: an unattributed assertion of absence is
 * not an assertion.
 */
export function noKnownFromFHIR(resource: FhirAllergy): NoKnownAllergies | null {
  const code = conceptCode(resource.code);
  if (!code || !(code in NO_KNOWN_ALLERGY_CODES)) return null;

  const asserter = resource.asserter?.display;
  const assertedAt = resource.recordedDate;
  if (!asserter || !assertedAt) return null;

  const assertion: NoKnownAllergies = { asserter, assertedAt };
  const scope = NO_KNOWN_ALLERGY_CODES[code];
  if (scope) assertion.scope = scope;
  const note = (resource.note ?? [])
    .map((n) => n.text)
    .filter(Boolean)
    .join(" · ");
  if (note) assertion.context = note;
  return assertion;
}

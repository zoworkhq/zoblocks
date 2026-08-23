// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/risk.ts. Edit that file, not this one.
/**
 * A risk score, and the three things that go wrong when one is rendered
 * casually.
 *
 * Risk scores are the most casually rendered artefact in healthcare software:
 * a number, a colour, a tooltip nobody reads.
 *
 *   1. The score is *stale*. Computed nightly, shown at noon, after the
 *      admission that would have changed it.
 *   2. The score is *unattributed*. The clinician cannot see that 70% of it is
 *      driven by one ED visit eighteen months ago.
 *   3. The score is read as a *diagnosis*. That is how an externally validated
 *      sepsis model with an AUC of 0.63 came to be trusted by clinicians who
 *      were never shown its performance.
 *
 * So: the validity window is data rather than a constant, drivers are part of
 * the shape rather than an optional extra, and the not-a-diagnosis framing is
 * a required prop. The band leads and the numeral is demoted, because two
 * decimal places imply a precision the model does not have.
 *
 * No React, no DOM.
 */

/* ------------------------------------------------------------------ */
/* Bands                                                               */
/* ------------------------------------------------------------------ */

/**
 * Five bands, and `unknown` is one of them.
 *
 * A model that could not score this patient — missing features, outside the
 * training population, a service that timed out — has produced a fact, and it
 * is not "low". Rendering it as the bottom band is how a patient the model
 * cannot see becomes a patient the panel does not call.
 */
export type RiskBand = "unknown" | "low" | "moderate" | "high" | "imminent";

export const BAND_LABEL: Record<RiskBand, string> = {
  unknown: "Not scored",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  imminent: "Imminent",
};

/** Maps onto the shared vocabulary so the shape agrees library-wide. */
export const BAND_STEP: Record<RiskBand, string> = {
  unknown: "none",
  low: "low",
  moderate: "moderate",
  high: "high",
  imminent: "imminent",
};

/* ------------------------------------------------------------------ */
/* Drivers                                                             */
/* ------------------------------------------------------------------ */

/**
 * One contributing factor, with its direction and its weight.
 *
 * `weight` is signed and in the model's own units — SHAP values, rule points,
 * log-odds. It is never normalised here: rescaling somebody else's
 * attributions to fit a bar is how a driver contributing 11.2 and one
 * contributing 0.4 end up looking comparable.
 */
export interface RiskDriver {
  label: string;
  weight: number;
  /** What the driver is drawn from, for the explanation surface. */
  reference?: string;
}

export function driverDirection(driver: RiskDriver): "raises" | "lowers" | "neutral" {
  if (driver.weight > 0) return "raises";
  if (driver.weight < 0) return "lowers";
  return "neutral";
}

/** Sorted by absolute weight, because the biggest driver is the point. */
export function topDrivers(drivers: readonly RiskDriver[], k = 4): RiskDriver[] {
  return [...drivers].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, k);
}

/**
 * The share of total attribution the largest driver carries, 0–1.
 *
 * Surfaced because it is the number that tells a clinician whether the score
 * is a synthesis or a proxy for one event. A model whose top driver is 70% of
 * the total is not modelling a patient; it is reporting an ED visit.
 */
export function concentration(drivers: readonly RiskDriver[]): number | null {
  if (!drivers.length) return null;
  const total = drivers.reduce((n, d) => n + Math.abs(d.weight), 0);
  if (total === 0) return null;
  const largest = Math.max(...drivers.map((d) => Math.abs(d.weight)));
  return largest / total;
}

/* ------------------------------------------------------------------ */
/* The assessment                                                      */
/* ------------------------------------------------------------------ */

export interface RiskAssessment {
  id: string;
  /** "30-day readmission", "Deterioration within 24 h". */
  outcome: string;
  band: RiskBand;
  /** 0–1. Optional: a band without a probability is still a usable score. */
  probability?: number;
  /** 0–100, and meaningless without the cohort below. */
  percentile?: number;
  /**
   * What the percentile is a percentile *of*.
   *
   * Required whenever `percentile` is set — enforced at the type level below.
   * "94th percentile" of an unnamed population is not information, and it is
   * routinely read as "94th percentile of people like this patient".
   */
  cohort?: string;

  /** ISO 8601. When the model ran, not when the page loaded. */
  computedAt: string;
  /**
   * ISO 8601. After this the score is expired rather than old.
   *
   * Data, not a constant: a 24-hour deterioration model and a 12-month
   * readmission model expire differently, and a shared threshold would make
   * one of them permanently stale and the other permanently fresh.
   */
  validUntil?: string;

  drivers?: readonly RiskDriver[];
  /** This score against the same patient's previous ones, oldest first. */
  trajectory?: readonly { at: string; probability: number }[];

  /** Model name and version, for the card. */
  model?: { name: string; version?: string; auc?: number };
}

/**
 * A percentile with no cohort is not a percentile.
 *
 * Enforced as a discriminated pair rather than left to review: the two are
 * always supplied together, and the type is what makes that true at the call
 * site rather than at the design review.
 */
export type RiskAssessmentInput = RiskAssessment &
  ({ percentile: number; cohort: string } | { percentile?: undefined; cohort?: string });

/* ------------------------------------------------------------------ */
/* Freshness                                                           */
/* ------------------------------------------------------------------ */

export type Freshness =
  | { state: "fresh"; ageMs: number }
  /** Past its validity window. Not "old" — the model no longer stands behind it. */
  | { state: "expired"; ageMs: number; expiredForMs: number }
  /** No validity window declared, so nothing can be said about it. */
  | { state: "unbounded"; ageMs: number };

/**
 * How old the score is, and whether that matters.
 *
 * `now` is a parameter. A component that reads a clock produces a staleness
 * that is untestable, non-deterministic in a screenshot, and — on a ward
 * workstation left open all shift — silently wrong in the direction that
 * matters.
 */
export function freshness(assessment: RiskAssessment, now: string): Freshness {
  const computed = Date.parse(assessment.computedAt);
  const ageMs = Math.max(0, Date.parse(now) - computed);

  if (!assessment.validUntil) return { state: "unbounded", ageMs };

  const expiredForMs = Date.parse(now) - Date.parse(assessment.validUntil);
  return expiredForMs > 0 ? { state: "expired", ageMs, expiredForMs } : { state: "fresh", ageMs };
}

/** "4 hours", "3 days". Coarse: precision here implies a freshness nobody has. */
export function describeAge(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (ms < 60_000) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
  return `${Math.round(days / 30)} months`;
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

/**
 * The whole thing as one spoken statement, ending in the framing.
 *
 * The not-a-diagnosis clause is last on purpose. Put first it is boilerplate a
 * listener skips; put last it is the sentence they are left with, and it is
 * the one the whole component exists to deliver.
 */
export function describeRisk(
  assessment: RiskAssessment,
  now: string,
  notADiagnosis: string,
  /** Matches what the face shows. A reader hearing a different set is worse
   *  than hearing fewer, because neither of them knows the other exists. */
  driverCount = 3,
): string {
  const parts: string[] = [`${assessment.outcome}: ${BAND_LABEL[assessment.band]} risk`];

  if (assessment.band === "unknown") {
    // No probability, no percentile, no drivers — saying any of them would be
    // inventing a score the model did not produce.
    parts.push("the model could not score this patient");
  } else {
    if (typeof assessment.probability === "number") {
      parts.push(`${Math.round(assessment.probability * 100)} per cent`);
    }
    if (typeof assessment.percentile === "number" && assessment.cohort) {
      parts.push(`${ordinal(assessment.percentile)} percentile of ${assessment.cohort}`);
    }
  }

  const fresh = freshness(assessment, now);
  if (fresh.state === "expired") {
    parts.push(`expired ${describeAge(fresh.expiredForMs)} ago`);
  } else {
    parts.push(`computed ${describeAge(fresh.ageMs)} ago`);
  }

  const top = topDrivers(assessment.drivers ?? [], driverCount);
  if (top.length) {
    const spoken = top
      .map((d) => `${d.label}, ${driverDirection(d) === "lowers" ? "lowers" : "raises"} it`)
      .join("; ");
    parts.push(`top drivers: ${spoken}`);
  }

  if (assessment.model) {
    const auc = typeof assessment.model.auc === "number" ? `, AUC ${assessment.model.auc}` : "";
    parts.push(
      `${assessment.model.name}${assessment.model.version ? ` ${assessment.model.version}` : ""}${auc}`,
    );
  }

  // Joined as sentences, so each clause is capitalised. "…adult medicine.
  // computed 6 hours ago." reads as a transcription error rather than prose.
  const sentence = parts
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(". ");
  return `${sentence}. ${notADiagnosis}`;
}

function ordinal(n: number): string {
  const rounded = Math.round(n);
  const rem100 = rounded % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${rounded}th`;
  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}

export { ordinal };

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

interface FhirConcept {
  coding?: Array<{ code?: string; display?: string }>;
  text?: string;
}

interface FhirRiskAssessment {
  id?: string;
  occurrenceDateTime?: string;
  method?: FhirConcept;
  basis?: Array<{ display?: string; reference?: string }>;
  prediction?: Array<{
    outcome?: FhirConcept;
    probabilityDecimal?: number;
    qualitativeRisk?: FhirConcept;
    whenPeriod?: { start?: string; end?: string };
  }>;
}

/**
 * `qualitativeRisk` onto the five bands.
 *
 * The R4 value set is `negligible | low | moderate | high | certain`.
 * `certain` becomes `imminent` rather than a sixth band: a risk model does not
 * produce certainty, and rendering the word would grant it an authority the
 * component spends its whole surface withholding.
 */
export function toBand(code: string | undefined): RiskBand {
  switch (code) {
    case "negligible":
    case "low":
      return "low";
    case "moderate":
      return "moderate";
    case "high":
      return "high";
    case "certain":
      return "imminent";
    default:
      return "unknown";
  }
}

/**
 * A FHIR `RiskAssessment` as the shape this component renders.
 *
 * `whenPeriod.end` becomes the validity window, which is the field that turns
 * "old" into "expired". A resource without one produces an unbounded score,
 * and the component says that rather than assuming a default.
 */
export function fromRiskAssessment(resource: FhirRiskAssessment): RiskAssessment | null {
  const prediction = resource.prediction?.[0];
  if (!prediction) return null;

  const assessment: RiskAssessment = {
    id: resource.id ?? "",
    outcome: prediction.outcome?.text ?? prediction.outcome?.coding?.[0]?.display ?? "Risk",
    band: toBand(prediction.qualitativeRisk?.coding?.[0]?.code ?? prediction.qualitativeRisk?.text),
    computedAt: resource.occurrenceDateTime ?? "",
  };

  if (typeof prediction.probabilityDecimal === "number") {
    assessment.probability = prediction.probabilityDecimal;
  }
  if (prediction.whenPeriod?.end) assessment.validUntil = prediction.whenPeriod.end;

  // `basis` names the references a score was drawn from, with no weights —
  // so they become unweighted drivers rather than invented ones.
  const basis = (resource.basis ?? [])
    .map((b) => b.display ?? b.reference)
    .filter((x): x is string => Boolean(x));
  if (basis.length) {
    assessment.drivers = basis.map((label) => ({ label, weight: 0 }));
  }

  const method = resource.method?.text ?? resource.method?.coding?.[0]?.display;
  if (method) assessment.model = { name: method };

  return assessment;
}

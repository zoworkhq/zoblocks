/**
 * The behavioral health pack.
 *
 * Deliberately unambitious, and that is the design.
 *
 * The high-value behavioral health use for a copilot is not therapy and not
 * diagnosis. It is the thing every behavioral health organisation says it wants
 * and under a fifth do consistently: **measurement-based care**. PHQ-9, GAD-7,
 * AUDIT-C, PCL-5, collected on schedule and actually looked at before the
 * session.
 *
 * A shortcut that opens with "PHQ-9 down 14→8 over three visits, GAD-7 flat at
 * 12, last completed 6 days ago, two items unanswered" is genuinely useful, is
 * a pure restatement of documented data, generates no clinical recommendation,
 * sits outside every current US state restriction on AI in mental health, and
 * takes a week to build. It is also the kind of thing a psychiatrist notices on
 * day one and misses when it is gone.
 *
 * ---
 *
 * **On the state laws.** Three states have legislated and they do not agree.
 * Illinois' WOPR Act bars AI from independently performing therapy, from
 * therapeutic communication with clients, and — specifically — from detecting
 * emotions or mental state. Nevada AB 406 bars AI from providing professional
 * mental or behavioral healthcare outright. Utah HB 452 requires disclosure
 * rather than prohibition.
 *
 * The consequence is `assertClinicianFacing` below. Every mode in this file
 * sets `patientFacing: false`, and the guard throws rather than degrades,
 * because a component that quietly reconfigured itself into a patient-facing
 * chatbot in Nevada would be a five-figure penalty per violation. There is no
 * flag to flip: the patient-facing configuration is a different product with a
 * different regulatory footing, and it should carry a different name.
 *
 * There is also no sentiment or affect analysis anywhere in this package. That
 * is not an omission — it is Illinois' enumerated prohibition, and it is a
 * feature product teams ask for constantly.
 */

import { defineMode, type ConsultMode } from "./modes.js";

/* ------------------------------------------------------------------ */
/* Instruments                                                         */
/* ------------------------------------------------------------------ */

export interface SeverityBand {
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

export interface Instrument {
  readonly id: string;
  readonly label: string;
  /** LOINC where one exists, so a host can match its own data. */
  readonly loinc?: string;
  readonly min: number;
  readonly max: number;
  readonly bands: readonly SeverityBand[];
  /**
   * Minimal clinically important difference — the change below which a
   * difference in score is noise rather than news. Rendering a 2-point PHQ-9
   * move as "improving" is the kind of false precision that erodes trust in
   * the whole surface.
   */
  readonly mcid: number;
  /** Higher scores mean worse, for every instrument here. */
  readonly higherIsWorse: true;
  /**
   * Item indices (1-based) that carry independent risk meaning regardless of
   * total score. PHQ-9 item 9 is the suicidality item: a total of 4 with item 9
   * positive is not a low-risk result, and any summary that reports only the
   * total is actively misleading.
   */
  readonly riskItems?: readonly number[];
  readonly note?: string;
}

export const PHQ9: Instrument = {
  id: "phq-9",
  label: "PHQ-9",
  loinc: "44249-1",
  min: 0,
  max: 27,
  mcid: 5,
  higherIsWorse: true,
  riskItems: [9],
  bands: [
    { min: 0, max: 4, label: "minimal" },
    { min: 5, max: 9, label: "mild" },
    { min: 10, max: 14, label: "moderate" },
    { min: 15, max: 19, label: "moderately severe" },
    { min: 20, max: 27, label: "severe" },
  ],
  note: "Item 9 carries risk meaning independent of the total.",
};

export const GAD7: Instrument = {
  id: "gad-7",
  label: "GAD-7",
  loinc: "69737-5",
  min: 0,
  max: 21,
  mcid: 4,
  higherIsWorse: true,
  bands: [
    { min: 0, max: 4, label: "minimal" },
    { min: 5, max: 9, label: "mild" },
    { min: 10, max: 14, label: "moderate" },
    { min: 15, max: 21, label: "severe" },
  ],
};

export const AUDITC: Instrument = {
  id: "audit-c",
  label: "AUDIT-C",
  loinc: "72109-2",
  min: 0,
  max: 12,
  mcid: 2,
  higherIsWorse: true,
  bands: [
    { min: 0, max: 2, label: "low risk" },
    { min: 3, max: 4, label: "screen positive" },
    { min: 5, max: 12, label: "higher risk" },
  ],
  note: "Positive thresholds differ by sex; the band shown is the lower of the two.",
};

export const PCL5: Instrument = {
  id: "pcl-5",
  label: "PCL-5",
  loinc: "85035-2",
  min: 0,
  max: 80,
  mcid: 10,
  higherIsWorse: true,
  bands: [
    { min: 0, max: 30, label: "below provisional threshold" },
    { min: 31, max: 80, label: "at or above provisional threshold" },
  ],
};

export const INSTRUMENTS: readonly Instrument[] = [PHQ9, GAD7, AUDITC, PCL5];

export function findInstrument(id: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.id === id);
}

export function bandFor(instrument: Instrument, score: number): SeverityBand | undefined {
  return instrument.bands.find((b) => score >= b.min && score <= b.max);
}

/* ------------------------------------------------------------------ */
/* Trends                                                              */
/* ------------------------------------------------------------------ */

export interface InstrumentScore {
  /** ISO 8601 date the instrument was completed. */
  readonly date: string;
  readonly score: number;
  /** Number of items left blank. An incomplete instrument is a different fact. */
  readonly unanswered?: number;
  /** 1-based indices of risk items scored above zero. */
  readonly riskItemsPositive?: readonly number[];
}

export type TrendDirection = "improving" | "worsening" | "flat" | "insufficient-data";

export interface InstrumentTrend {
  readonly instrument: Instrument;
  readonly direction: TrendDirection;
  readonly latest: InstrumentScore;
  readonly earliest: InstrumentScore;
  readonly change: number;
  /** Whether `change` clears the instrument's MCID. */
  readonly meaningful: boolean;
  readonly latestBand: SeverityBand | undefined;
  /** Days since the most recent completion. Staleness is clinically relevant. */
  readonly daysSinceLatest: number;
  /**
   * True when any risk item is positive on the most recent completion,
   * regardless of the total. Rendered as its own line, never folded into the
   * severity band.
   */
  readonly riskItemPositive: boolean;
}

/**
 * Compute a trend, or refuse to.
 *
 * Refuses on a single data point rather than reporting a direction from one
 * score, because "PHQ-9 is 14" and "PHQ-9 is 14, down from 22" are different
 * clinical facts and only one of them is a trend. The `insufficient-data`
 * direction is a real answer, not a failure.
 */
export function computeTrend(
  instrument: Instrument,
  scores: readonly InstrumentScore[],
  asOf: string,
): InstrumentTrend | undefined {
  if (scores.length === 0) return undefined;

  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date));
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];
  if (!earliest || !latest) return undefined;

  const change = latest.score - earliest.score;
  const meaningful = Math.abs(change) >= instrument.mcid;

  let direction: TrendDirection;
  if (sorted.length < 2) {
    direction = "insufficient-data";
  } else if (!meaningful) {
    direction = "flat";
  } else {
    direction = change < 0 ? "improving" : "worsening";
  }

  return {
    instrument,
    direction,
    latest,
    earliest,
    change,
    meaningful,
    latestBand: bandFor(instrument, latest.score),
    daysSinceLatest: daysBetween(latest.date, asOf),
    riskItemPositive: (latest.riskItemsPositive?.length ?? 0) > 0,
  };
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86_400_000));
}

/**
 * A one-line summary, in the register a clinician writes in.
 *
 * Deliberately terse and deliberately unhedged about *facts* while making no
 * claim at all about what to do. "PHQ-9 8, mild, down 6 from 14 over 3
 * completions" is a restatement. "PHQ-9 improving, consider reducing contact"
 * would be a recommendation, and this pack does not make them.
 */
export function describeTrend(trend: InstrumentTrend): string {
  const { instrument, latest, latestBand, change, direction, daysSinceLatest } = trend;
  const parts = [`${instrument.label} ${latest.score}`];

  if (latestBand) parts.push(latestBand.label);

  switch (direction) {
    case "improving":
      parts.push(`down ${Math.abs(change)} from ${trend.earliest.score}`);
      break;
    case "worsening":
      parts.push(`up ${Math.abs(change)} from ${trend.earliest.score}`);
      break;
    case "flat":
      parts.push(`no meaningful change (±${Math.abs(change)}, MCID ${instrument.mcid})`);
      break;
    case "insufficient-data":
      parts.push("single completion");
      break;
  }

  parts.push(daysSinceLatest === 0 ? "completed today" : `completed ${daysSinceLatest}d ago`);

  if (latest.unanswered && latest.unanswered > 0) {
    parts.push(`${latest.unanswered} item${latest.unanswered === 1 ? "" : "s"} unanswered`);
  }

  // Always last, so it is the thing the eye lands on.
  if (trend.riskItemPositive) {
    parts.push("RISK ITEM POSITIVE — review directly");
  }

  return parts.join(" · ");
}

/* ------------------------------------------------------------------ */
/* Modes                                                               */
/* ------------------------------------------------------------------ */

/**
 * Between visits — instrument trends and adherence signals.
 *
 * Reads only what was documented and recommends nothing. Note that
 * `sud-counseling-notes` and `psychotherapy-notes` stay in the exclusion list
 * even though this is a behavioral health mode: 42 CFR Part 2 now defines SUD
 * counselling notes as a category needing specific consent rather than a broad
 * treatment authorisation, and the mode has no business receiving them to build
 * a score summary.
 */
export const betweenVisits: ConsultMode = defineMode({
  id: "between-visits",
  label: "Between visits",
  description: "Instrument trends, attendance and adherence since the last session.",
  promptRef: "between-visits@1",
  risk: "summary",
  reads: ["QuestionnaireResponse", "Observation", "Encounter", "MedicationRequest", "CarePlan"],
  historyTurns: 4,
  output: {
    requireCitations: true,
    forbidDosing: true,
    forbidDiagnosis: true,
    maxClaims: 8,
  },
  suggestions: [
    {
      id: "measures",
      label: "Measure trends",
      reads: "PHQ-9, GAD-7, AUDIT-C, PCL-5 · last 12 months",
    },
    {
      id: "attendance",
      label: "Attendance since last session",
      reads: "Encounters, cancellations, no-shows",
    },
    {
      id: "outstanding",
      label: "Outstanding measures",
      reads: "Scheduled QuestionnaireResponse, incomplete items",
    },
  ],
});

/**
 * Formulate — case formulation support.
 *
 * Genuinely valuable, genuinely dangerous, and the closest thing in this
 * package to what Illinois prohibits. Ships behind a flag, clinician-facing,
 * evals first. It is not in `behavioralModes` for the same reason `workUp` is
 * not in `defaultModes`: a host has to reach for it by name.
 */
export const formulate: ConsultMode = defineMode({
  id: "formulate",
  label: "Formulate",
  description: "Structure a case formulation from documented history. Clinician-facing.",
  promptRef: "formulate@1",
  risk: "clinical",
  reads: ["Condition", "QuestionnaireResponse", "Observation", "Encounter", "CarePlan"],
  historyTurns: 4,
  output: { requireCitations: true, maxClaims: 6, forbidDosing: true, forbidDiagnosis: true },
  suggestions: [
    { id: "5p", label: "Five Ps", reads: "Documented history only" },
    { id: "maintaining", label: "Maintaining factors", reads: "Documented history only" },
    { id: "measures-link", label: "Link measures to formulation", reads: "QuestionnaireResponse" },
  ],
});

/** What a behavioral health deployment gets by default. Look up plus this. */
export const behavioralModes: readonly ConsultMode[] = [betweenVisits];

/* ------------------------------------------------------------------ */
/* The guard                                                           */
/* ------------------------------------------------------------------ */

export class PatientFacingNotSupportedError extends Error {
  readonly code = "patient-facing-not-supported" as const;
  constructor(modeId: string) {
    super(
      `Mode "${modeId}" is clinician-facing and cannot run on a patient-facing surface. ` +
        `Consult has no patient-facing behavioral health configuration by design: ` +
        `Illinois (WOPR Act), Nevada (AB 406) and Utah (HB 452) each regulate AI in mental ` +
        `health differently, and Nevada prohibits it outright. A patient-facing product is a ` +
        `separate product with a separate regulatory footing — it is not a flag on this one.`,
    );
    this.name = "PatientFacingNotSupportedError";
  }
}

/**
 * Throws unless the surface is clinician-facing.
 *
 * Throws rather than returning false, and rather than silently disabling the
 * mode, because a component that quietly degrades is a component whose
 * configuration nobody checks. The exception is the check.
 */
export function assertClinicianFacing(mode: ConsultMode, surface: "clinician" | "patient"): void {
  if (surface === "patient" && !mode.patientFacing) {
    throw new PatientFacingNotSupportedError(mode.id);
  }
}

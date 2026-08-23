/**
 * The four ways a rendered number lies, and the shapes that make each one
 * impossible.
 *
 * The most dangerous component in healthcare software is the one that renders
 * a number, because every one of its failures looks perfect on screen:
 *
 *   1. A preliminary result rendered identically to a final one. The clinician
 *      acts on it; the value changes at 04:00.
 *   2. A result with no reference range rendered as though it were normal,
 *      because nothing was highlighted.
 *   3. A corrected result that silently replaced the value somebody read an
 *      hour ago and wrote into a note.
 *   4. An absent value rendered as an em dash — indistinguishable from a
 *      rendering bug, a cancelled test, a haemolysed specimen and a patient
 *      who declined the draw.
 *
 * So: status is never implicit, an absent range is stated rather than left
 * blank, a correction carries the superseded value rather than a badge, and
 * absence is seven distinct sentences with no em dash among them.
 *
 * No React, no DOM. The FHIR adapter is at the bottom and is the only part
 * that knows what an `Observation` is.
 */

import type { ScaleName, StepOf } from "./clinical-status";
import { fromInterpretation, fromObservationStatus } from "./clinical-status";

/* ------------------------------------------------------------------ */
/* Absence                                                             */
/* ------------------------------------------------------------------ */

/**
 * Seven reasons a value is not here, and they are not interchangeable.
 *
 * "Nobody ordered it", "the specimen haemolysed" and "you are not allowed to
 * see it" demand three different things of whoever is reading the screen, and
 * an em dash asks them to guess which. `unknown` is deliberately in the list:
 * a source system that sent no value and no reason has a data-quality defect,
 * and the interface should say so rather than absorb it.
 */
export type ResultAbsence =
  "not-ordered" | "awaiting" | "cancelled" | "specimen-problem" | "declined" | "masked" | "unknown";

export const ABSENT_REASONS: readonly ResultAbsence[] = [
  "not-ordered",
  "awaiting",
  "cancelled",
  "specimen-problem",
  "declined",
  "masked",
  "unknown",
];

interface AbsenceCopy {
  /** Two or three words, for the value slot where a number would be. */
  readonly short: string;
  /** The sentence beneath it. A host may override with something specific. */
  readonly detail: string;
  /** Which status scale step describes it, so the chip agrees with the words. */
  readonly step: StepOf<"criticality"> | StepOf<"result-status"> | StepOf<"access">;
  readonly scale: ScaleName;
}

export const ABSENCE: Record<ResultAbsence, AbsenceCopy> = {
  "not-ordered": {
    short: "Not ordered",
    detail: "No result has ever been ordered for this patient.",
    scale: "criticality",
    step: "not-assessed",
  },
  awaiting: {
    short: "Awaiting",
    detail: "Collected and not yet resulted.",
    scale: "result-status",
    step: "preliminary",
  },
  cancelled: {
    short: "Cancelled",
    detail: "Cancelled before it was performed.",
    scale: "result-status",
    step: "cancelled",
  },
  "specimen-problem": {
    short: "Specimen problem",
    detail: "The specimen could not be analysed. A recollection is needed.",
    scale: "result-status",
    step: "cancelled",
  },
  declined: {
    short: "Declined",
    detail: "The patient declined.",
    scale: "criticality",
    step: "not-assessed",
  },
  masked: {
    short: "Restricted",
    // The one absence that is not a gap: a value exists and the reader may not
    // see it. Rendering it as "not ordered" would be a lie about the record.
    detail: "A result exists and you are not permitted to see it.",
    scale: "access",
    step: "restricted",
  },
  unknown: {
    short: "No value",
    detail: "The source system sent no value and no reason. This is a data-quality defect.",
    scale: "criticality",
    step: "not-assessed",
  },
};

/* ------------------------------------------------------------------ */
/* The value                                                           */
/* ------------------------------------------------------------------ */

export type Interpretation = StepOf<"criticality">;

export interface ReferenceRange {
  low?: number;
  high?: number;
  /** Printed instead of low–high when the lab supplied prose. */
  text?: string;
  /**
   * "maintenance", "12 h post-dose", "female, 18–45".
   *
   * A range without its qualification is a different range. Lithium at 0.9 is
   * therapeutic for maintenance and low for acute mania, and a bare 0.6–1.2
   * cannot tell a reader which one they are looking at.
   */
  appliesTo?: string;
}

/** Where the number came from, which changes how much it is worth. */
export type Provenance = "lab" | "device" | "patient-reported" | "external" | "ai-extracted";

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  lab: "Laboratory",
  device: "Device",
  "patient-reported": "Patient-reported",
  external: "Received from another organisation",
  "ai-extracted": "Extracted by a model",
};

export interface PriorValue {
  value: number;
  /** ISO 8601. Used for the interval, and printed in the superseded line. */
  at: string;
  /**
   * Set when the prior value came from a different assay or method.
   *
   * A delta across a method change is not a delta — it is two numbers from two
   * scales subtracted from each other. Setting this suppresses the delta
   * rather than annotating it, because an annotated wrong number still gets
   * read as a number.
   */
  differentMethod?: boolean;
  /** Set when the prior value measured something else under the same name. */
  differentAnalyte?: boolean;
}

export interface ResultValueData {
  /** Stable identity, for memoisation. */
  id: string;
  /** Bumped whenever the record changes, so a correction re-renders. */
  versionId?: string;

  /** "Potassium", "PHQ-9 total". */
  analyte: string;
  /** Absent when the value is. */
  value?: number | string;
  unit?: string;
  /** "<", ">=" — printed before the value, never dropped. */
  comparator?: string;

  /** Omit when there is no value; supply `absent` instead. */
  absent?: ResultAbsence;
  /** Overrides the stock sentence for the absence. */
  absentDetail?: string;

  /**
   * The lab's own interpretation. Always wins over a derived one.
   *
   * A range is a population statistic; an interpretation is the laboratory's
   * judgement about this specimen, and it accounts for things the range cannot
   * — the assay, the collection, the patient's own history.
   */
  interpretation?: Interpretation;
  range?: ReferenceRange;
  /**
   * Set when the lab supplied no range at all.
   *
   * Distinct from `range: undefined`, which only means the caller did not pass
   * one. This is the lab saying there is no range for this patient, and it
   * must be printed — a number with nothing highlighted reads as normal.
   */
  noRangeReason?: string;

  status?: StepOf<"result-status">;
  /** The value this one replaced, for a correction. */
  superseded?: { value: number | string; at: string };
  prior?: PriorValue;

  provenance?: Provenance;
  /** ISO 8601, when the result was released. */
  resultedAt?: string;
  /** Free-text qualifiers the lab attached — "trough assumed", "haemolysed". */
  notes?: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Derivation                                                          */
/* ------------------------------------------------------------------ */

/**
 * The interpretation to render, and where it came from.
 *
 * Precedence is the whole point. A stated interpretation always wins; a
 * derived one is only ever a fallback, and it is labelled as derived so a
 * reader can tell the difference between the laboratory's judgement and this
 * component's arithmetic.
 *
 * When there is no range and no stated interpretation the answer is
 * `not-assessed`, never `normal`. Silence is not a normal result.
 */
export function resolveInterpretation(data: ResultValueData): {
  step: Interpretation;
  derived: boolean;
} | null {
  if (data.interpretation) return { step: data.interpretation, derived: false };
  if (typeof data.value !== "number") return null;

  const { low, high } = data.range ?? {};
  if (low === undefined && high === undefined) {
    // No range: not assessed. Rendering nothing here is the second of the four
    // failures — a number with nothing highlighted reads as in range.
    return { step: "not-assessed", derived: true };
  }

  const above = high !== undefined && data.value > high;
  const below = low !== undefined && data.value < low;
  if (!above && !below) return { step: "normal", derived: true };

  /*
   * Derived abnormality never reaches `critical`.
   *
   * Critical means a panic value, and a panic threshold is a laboratory
   * policy, not a distance from the reference range. Inferring one from
   * arithmetic would put a red chip on a result nobody flagged.
   */
  return { step: "high", derived: true };
}

/** Whether a delta against the prior value is meaningful enough to print. */
export function resolveDelta(data: ResultValueData): {
  change: number;
  direction: "up" | "down" | "flat";
  sinceMs: number;
} | null {
  const prior = data.prior;
  if (!prior || typeof data.value !== "number") return null;
  // Two numbers from two scales subtracted from each other is not a delta.
  if (prior.differentMethod || prior.differentAnalyte) return null;

  const change = Number((data.value - prior.value).toFixed(6));
  const sinceMs = Date.parse(data.resultedAt ?? prior.at) - Date.parse(prior.at);
  return {
    change,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    sinceMs: Number.isFinite(sinceMs) ? Math.max(0, sinceMs) : 0,
  };
}

/** "3.5 to 5.1", "under 0.04", "0.6 to 1.2 maintenance". */
export function describeRange(range: ReferenceRange | undefined): string | null {
  if (!range) return null;
  if (range.text) return range.appliesTo ? `${range.text}, ${range.appliesTo}` : range.text;

  const { low, high, appliesTo } = range;
  let body: string;
  if (low !== undefined && high !== undefined) body = `${low} to ${high}`;
  else if (high !== undefined) body = `under ${high}`;
  else if (low !== undefined) body = `over ${low}`;
  else return null;

  return appliesTo ? `${body}, ${appliesTo}` : body;
}

/** The same range, printed rather than spoken: "3.5–5.1". */
export function formatRange(range: ReferenceRange | undefined): string | null {
  if (!range) return null;
  if (range.text) return range.text;
  const { low, high } = range;
  if (low !== undefined && high !== undefined) return `${low}–${high}`;
  if (high !== undefined) return `<${high}`;
  if (low !== undefined) return `>${low}`;
  return null;
}

/** "41 minutes", "3 days". Coarse on purpose: precision here implies freshness. */
export function describeElapsed(ms: number): string {
  // Checked before rounding: 30 seconds rounds to one minute, and "1 minute
  // ago" on a result that landed half a minute ago overstates how settled it is.
  if (ms < 60_000) return "just now";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

const SPOKEN_UNIT: Record<string, string> = {
  "mmol/L": "millimoles per litre",
  "mg/dL": "milligrams per decilitre",
  "ng/mL": "nanograms per millilitre",
  "mIU/L": "milli-international units per litre",
  "g/dL": "grams per decilitre",
  mmHg: "millimetres of mercury",
  "%": "per cent",
};

const INTERPRETATION_WORD: Record<Interpretation, string> = {
  critical: "critical",
  high: "abnormal",
  moderate: "borderline",
  normal: "within the reference range",
  "not-assessed": "not interpreted",
};

/**
 * The whole clinical sentence, as one string.
 *
 * "Potassium 6.8 millimoles per litre, critical, reference 3.5 to 5.1, final,
 * resulted 41 minutes ago."
 *
 * One string rather than five nodes, because a screen-reader user should not
 * have to assemble the clinical meaning from fragments separated by pauses —
 * and because the order matters: the value, then how bad it is, then what it
 * is being compared against, then how much to trust it.
 *
 * `now` is a parameter. The component never reads a clock: a relative time
 * computed at render is untestable, non-deterministic in a screenshot, and on
 * a result it is the difference between "41 minutes ago" and a number that
 * quietly ages while a page sits open on a ward workstation.
 */
export function describeResult(data: ResultValueData, now?: string): string {
  const parts: string[] = [];

  if (data.absent) {
    const copy = ABSENCE[data.absent];
    return `${data.analyte}: ${copy.short}. ${data.absentDetail ?? copy.detail}`;
  }

  const unit = data.unit ? ` ${SPOKEN_UNIT[data.unit] ?? data.unit}` : "";
  const comparator = data.comparator ? `${data.comparator} ` : "";
  parts.push(`${data.analyte} ${comparator}${data.value}${unit}`);

  const interpretation = resolveInterpretation(data);
  const interpretationWord = interpretation && INTERPRETATION_WORD[interpretation.step];
  if (interpretationWord) parts.push(interpretationWord);

  const range = describeRange(data.range);
  if (range) parts.push(`reference ${range}`);
  else if (data.noRangeReason) parts.push(data.noRangeReason);

  const statusWord = data.status && STATUS_WORD[data.status];
  if (statusWord) parts.push(statusWord);

  if (data.superseded) {
    // Spoken before the timing, because it is the fact that changes what the
    // reader should do next.
    parts.push(`replaces ${data.superseded.value}, changed ${data.superseded.at}`);
  }

  const delta = resolveDelta(data);
  if (delta && delta.direction !== "flat") {
    const word = delta.direction === "up" ? "up" : "down";
    parts.push(`${word} ${Math.abs(delta.change)} over ${describeElapsed(delta.sinceMs)}`);
  }

  if (data.provenance && data.provenance !== "lab") {
    parts.push(PROVENANCE_LABEL[data.provenance].toLowerCase());
  }

  if (now && data.resultedAt) {
    const elapsed = Date.parse(now) - Date.parse(data.resultedAt);
    if (Number.isFinite(elapsed) && elapsed >= 0) {
      parts.push(`resulted ${describeElapsed(elapsed)} ago`);
    }
  }

  for (const note of data.notes ?? []) parts.push(note);

  return `${parts.join(", ")}.`;
}

const STATUS_WORD: Record<StepOf<"result-status">, string> = {
  final: "final",
  preliminary: "preliminary, not verified by the laboratory",
  corrected: "corrected",
  cancelled: "cancelled",
  "entered-in-error": "entered in error",
};

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}
interface FhirConcept {
  coding?: FhirCoding[];
  text?: string;
}
interface FhirQuantity {
  value?: number;
  unit?: string;
  comparator?: string;
}
interface FhirObservation {
  id?: string;
  meta?: { versionId?: string };
  status?: string;
  code?: FhirConcept;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  valueCodeableConcept?: FhirConcept;
  dataAbsentReason?: FhirConcept;
  interpretation?: FhirConcept[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
    appliesTo?: FhirConcept[];
    type?: FhirConcept;
  }>;
  issued?: string;
  effectiveDateTime?: string;
  note?: Array<{ text?: string }>;
}

/**
 * `Observation.dataAbsentReason` onto the seven.
 *
 * The R4 value set is wider than seven and several of its codes describe the
 * same thing to a reader — `not-performed` and `not-permitted` differ in
 * whether a result exists, which is exactly the distinction that matters, so
 * they land on different reasons. Anything unrecognised becomes `unknown`
 * rather than being dropped, because an unmapped code is itself a
 * data-quality defect and the component says so.
 */
export function fromDataAbsentReason(code: string | undefined): ResultAbsence {
  switch (code) {
    case "not-asked":
    case "not-performed":
      return "not-ordered";
    case "temp-unknown":
    case "as-text":
      return "awaiting";
    case "error":
      return "specimen-problem";
    case "asked-declined":
      return "declined";
    case "masked":
    case "not-permitted":
      return "masked";
    case "not-applicable":
      return "cancelled";
    default:
      return "unknown";
  }
}

/**
 * A FHIR `Observation` as a `ResultValueData`.
 *
 * Everything this cannot determine is left undefined rather than guessed. A
 * missing `referenceRange` becomes no range — not an empty one, and not a
 * silent assumption of normality.
 */
export function fromFHIR(observation: FhirObservation): ResultValueData {
  const range = observation.referenceRange?.[0];
  const absentCode = observation.dataAbsentReason?.coding?.[0]?.code;
  const interpretationCode = observation.interpretation?.[0]?.coding?.[0]?.code;
  const quantity = observation.valueQuantity;

  const value =
    quantity?.value ??
    observation.valueString ??
    observation.valueCodeableConcept?.text ??
    undefined;

  const data: ResultValueData = {
    id: observation.id ?? "",
    analyte: observation.code?.text ?? observation.code?.coding?.[0]?.display ?? "Result",
  };

  if (observation.meta?.versionId) data.versionId = observation.meta.versionId;
  if (value !== undefined) data.value = value;
  if (quantity?.unit) data.unit = quantity.unit;
  if (quantity?.comparator) data.comparator = quantity.comparator;

  // An absent reason wins over a value: a record carrying both is malformed,
  // and rendering the value would publish something the source said is not there.
  if (absentCode || value === undefined) {
    data.absent = fromDataAbsentReason(absentCode);
    delete data.value;
  }

  const interpretation = fromInterpretation(interpretationCode);
  if (interpretation) data.interpretation = interpretation;

  const status = fromObservationStatus(observation.status);
  if (status) data.status = status;

  if (range) {
    const parsed: ReferenceRange = {};
    if (range.low?.value !== undefined) parsed.low = range.low.value;
    if (range.high?.value !== undefined) parsed.high = range.high.value;
    if (range.text) parsed.text = range.text;
    const applies = range.appliesTo?.[0]?.text ?? range.type?.text;
    if (applies) parsed.appliesTo = applies;
    if (Object.keys(parsed).length) data.range = parsed;
  }

  const resultedAt = observation.issued ?? observation.effectiveDateTime;
  if (resultedAt) data.resultedAt = resultedAt;

  const notes = (observation.note ?? [])
    .map((n) => n.text)
    .filter((t): t is string => Boolean(t && t.trim()));
  if (notes.length) data.notes = notes;

  return data;
}

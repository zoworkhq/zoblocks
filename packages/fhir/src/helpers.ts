/**
 * Pure helpers for reading FHIR R4 payloads.
 *
 * Rules for everything in this file:
 *   - no side effects, no I/O, no dependencies
 *   - never throw on malformed input — return a safe fallback
 *   - never invent clinical meaning that is not in the payload
 */

import type {
  AllergyIntolerance,
  Appointment,
  CareTeam,
  DetectedIssue,
  Flag,
  Provenance,
  CodeableConcept,
  Coding,
  Coverage,
  Dosage,
  HumanName,
  Identifier,
  MedicationRequest,
  Observation,
  ObservationComponent,
  ObservationReferenceRange,
  Patient,
  Quantity,
  Resource,
} from "./types";

// ---------------------------------------------------------------------------
// Codings
// ---------------------------------------------------------------------------

/** First human-readable label available on a CodeableConcept. */
export function codeableText(concept: CodeableConcept | undefined): string | undefined {
  if (!concept) return undefined;
  if (concept.text) return concept.text;
  const coding = concept.coding?.find((c) => c.display ?? c.code);
  return coding?.display ?? coding?.code;
}

/** Find a coding by system, e.g. LOINC on an Observation.code. */
export function findCoding(
  concept: CodeableConcept | undefined,
  system: string,
): Coding | undefined {
  return concept?.coding?.find((c) => c.system === system);
}

export const LOINC = "http://loinc.org";
export const SNOMED = "http://snomed.info/sct";

// ---------------------------------------------------------------------------
// Patient
// ---------------------------------------------------------------------------

/**
 * Render a HumanName the way clinicians read it: "Family, Given".
 * Falls back through text → structured parts → undefined.
 */
export function formatHumanName(
  name: HumanName | undefined,
  format: "official" | "display" = "display",
): string | undefined {
  if (!name) return undefined;
  if (name.text) return name.text;

  const given = name.given?.filter(Boolean).join(" ");
  const family = name.family;
  if (!given && !family) return undefined;

  if (format === "official") {
    // "Family, Given" — the form used on wristbands, charts, and worklists.
    return [family, given].filter(Boolean).join(", ");
  }
  return [given, family].filter(Boolean).join(" ");
}

/**
 * Pick the name a UI should show. FHIR allows many; prefer official/usual
 * over nicknames and maiden names, and never show an `old` name by default.
 */
export function resolvePatientName(
  patient: Patient | undefined,
  format: "official" | "display" = "display",
): string | undefined {
  const names = patient?.name?.filter((n) => n.use !== "old");
  if (!names?.length) return undefined;

  const preferred =
    names.find((n) => n.use === "official") ??
    names.find((n) => n.use === "usual") ??
    names.find((n) => !n.use) ??
    names[0];

  return formatHumanName(preferred, format);
}

/**
 * Pull a specific identifier (MRN, NHS number, ABHA, member ID).
 * Pass a `system` to target one; otherwise returns the first usable value.
 */
export function getIdentifier(
  patient: Patient | undefined,
  system?: string,
): Identifier | undefined {
  const identifiers = patient?.identifier?.filter((i) => i.value);
  if (!identifiers?.length) return undefined;
  if (system) return identifiers.find((i) => i.system === system);
  return identifiers.find((i) => i.use === "official") ?? identifiers[0];
}

/**
 * Mask all but the last `visible` characters of an identifier.
 * Used for shoulder-surfing resistance on shared and public-facing screens.
 */
export function maskIdentifier(value: string | undefined, visible = 4): string | undefined {
  if (!value) return undefined;
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(value.length - visible) + value.slice(-visible);
}

/**
 * Age in whole years at `asOf`. Returns undefined rather than guessing when
 * birthDate is absent or unparseable — an unknown age must render as unknown.
 */
export function calculateAge(birthDate: string | undefined, asOf: Date = new Date()): number | undefined {
  if (!birthDate) return undefined;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return undefined;

  let age = asOf.getFullYear() - born.getFullYear();
  const monthDelta = asOf.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < born.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
}

export function isDeceased(patient: Patient | undefined): boolean {
  return Boolean(patient?.deceasedBoolean || patient?.deceasedDateTime);
}

/**
 * True when the resource carries a confidentiality label requiring restricted
 * display. Callers must still enforce access server-side — this only drives UI.
 *
 * https://terminology.hl7.org/ValueSet-v3-Confidentiality.html
 */
export function isRestricted(resource: Resource | undefined): boolean {
  const security = resource?.meta?.security;
  if (!security?.length) return false;
  const restrictedCodes = new Set(["R", "V"]); // Restricted, Very Restricted
  return security.some((s) => s.code && restrictedCodes.has(s.code));
}

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------

/**
 * Normalized interpretation, collapsing FHIR's v3 interpretation codes into
 * the small set a UI can actually style.
 *
 * https://terminology.hl7.org/ValueSet-v3-ObservationInterpretation.html
 */
export type Interpretation =
  | "critical-high"
  | "critical-low"
  | "high"
  | "low"
  | "abnormal"
  | "normal"
  | "unknown";

const INTERPRETATION_BY_CODE: Record<string, Interpretation> = {
  HH: "critical-high",
  LL: "critical-low",
  H: "high",
  ">": "high",
  HU: "high",
  L: "low",
  "<": "low",
  LU: "low",
  A: "abnormal",
  AA: "critical-high",
  N: "normal",
};

/**
 * Read the interpretation FHIR states explicitly. If the payload does not say,
 * fall back to comparing the value against its own reference range.
 *
 * Deliberately does NOT infer clinical severity from anything else. A missing
 * interpretation renders as "unknown", not as "normal".
 */
export function getInterpretation(
  observation: Observation | undefined,
): Interpretation {
  const codes = observation?.interpretation?.flatMap((i) => i.coding ?? []) ?? [];
  for (const coding of codes) {
    const mapped = coding.code ? INTERPRETATION_BY_CODE[coding.code] : undefined;
    if (mapped) return mapped;
  }

  const value = observation?.valueQuantity?.value;
  const range = observation?.referenceRange?.[0];
  if (typeof value === "number" && range) {
    if (typeof range.high?.value === "number" && value > range.high.value) return "high";
    if (typeof range.low?.value === "number" && value < range.low.value) return "low";
    if (range.low?.value !== undefined || range.high?.value !== undefined) return "normal";
  }

  return "unknown";
}

/** True for interpretations that warrant visual escalation. */
export function isCritical(interpretation: Interpretation): boolean {
  return interpretation === "critical-high" || interpretation === "critical-low";
}

export function isAbnormal(interpretation: Interpretation): boolean {
  return interpretation !== "normal" && interpretation !== "unknown";
}

/** Human label for an interpretation. Paired with an icon — never color alone. */
export const INTERPRETATION_LABEL: Record<Interpretation, string> = {
  "critical-high": "Critical high",
  "critical-low": "Critical low",
  high: "High",
  low: "Low",
  abnormal: "Abnormal",
  normal: "Normal",
  unknown: "Not interpreted",
};

/** "120 mmHg", "<0.01 ng/mL". Returns undefined when there is no value. */
export function formatQuantity(quantity: Quantity | undefined): string | undefined {
  if (!quantity || typeof quantity.value !== "number") return undefined;
  const comparator = quantity.comparator ?? "";
  const unit = quantity.unit ?? quantity.code ?? "";
  return `${comparator}${quantity.value}${unit ? ` ${unit}` : ""}`.trim();
}

/**
 * Best available display value for an Observation, in FHIR's own precedence
 * order. Returns undefined when the observation genuinely has no value —
 * check `dataAbsentReason` to explain why.
 */
export function formatObservationValue(observation: Observation | undefined): string | undefined {
  if (!observation) return undefined;
  return (
    formatQuantity(observation.valueQuantity) ??
    observation.valueString ??
    codeableText(observation.valueCodeableConcept) ??
    (typeof observation.valueBoolean === "boolean"
      ? observation.valueBoolean
        ? "Yes"
        : "No"
      : undefined)
  );
}

/** "70 – 100 mg/dL", "< 5.7 %", or the range's own text. */
export function formatReferenceRange(
  range: ObservationReferenceRange | undefined,
): string | undefined {
  if (!range) return undefined;
  if (range.text) return range.text;

  const low = range.low?.value;
  const high = range.high?.value;
  const unit = range.high?.unit ?? range.low?.unit ?? "";
  const suffix = unit ? ` ${unit}` : "";

  if (typeof low === "number" && typeof high === "number") return `${low} – ${high}${suffix}`;
  if (typeof high === "number") return `< ${high}${suffix}`;
  if (typeof low === "number") return `> ${low}${suffix}`;
  return undefined;
}

// ---------------------------------------------------------------------------
// Absence
//
// FHIR distinguishes fifteen reasons a value can be missing. Implementations
// routinely flatten all of them to a dash, which destroys a distinction with
// real clinical consequence: "we asked and she declined" is not "nobody asked",
// and neither is "you are not allowed to see this".
//
// https://terminology.hl7.org/CodeSystem-data-absent-reason.html
// ---------------------------------------------------------------------------

/**
 * The absent-reason taxonomy collapsed to the groups that a reader must treat
 * DIFFERENTLY. Codes are merged only where the clinical response is identical.
 *
 * `unstated` is ours, not FHIR's: it means the value is absent and the payload
 * gave no reason at all. That is a distinct and very common state, and it must
 * not be silently promoted to `unknown` — which is a positive assertion that
 * the value was expected.
 */
export type AbsentReason =
  | "unknown"
  | "pending"
  | "not-collected"
  | "declined"
  | "masked"
  | "not-permitted"
  | "not-applicable"
  | "not-performed"
  | "as-text"
  | "error"
  | "unstated";

const ABSENT_REASON_BY_CODE: Record<string, AbsentReason> = {
  unknown: "unknown",
  "asked-unknown": "unknown",
  "temp-unknown": "pending",
  "not-asked": "not-collected",
  "asked-declined": "declined",
  masked: "masked",
  "not-permitted": "not-permitted",
  "not-applicable": "not-applicable",
  "not-performed": "not-performed",
  "as-text": "as-text",
  error: "error",
  unsupported: "error",
  "not-a-number": "error",
  "negative-infinity": "error",
  "positive-infinity": "error",
  // Legacy/abbreviated forms seen in the wild.
  NaN: "error",
  NINF: "error",
  PINF: "error",
};

export const DATA_ABSENT_REASON_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/data-absent-reason";

/**
 * Normalize a `dataAbsentReason` into the group that drives display.
 *
 * Returns `unstated` only when there is genuinely nothing to read. A concept
 * carrying text or an unrecognised code returns `unknown`, because the source
 * did say something — we just cannot categorise it, and the caller should
 * surface that text rather than the category label.
 */
export function resolveAbsentReason(concept: CodeableConcept | undefined): AbsentReason {
  if (!concept) return "unstated";

  for (const coding of concept.coding ?? []) {
    const mapped = coding.code ? ABSENT_REASON_BY_CODE[coding.code] : undefined;
    if (mapped) return mapped;
  }

  const hasContent = Boolean(concept.text) || Boolean(concept.coding?.length);
  return hasContent ? "unknown" : "unstated";
}

/**
 * Label shown to a reader. Deliberately a full statement rather than a word,
 * because these strings are read out of context by assistive technology and in
 * a dense grid cell where "unknown" alone is ambiguous.
 */
export const ABSENT_REASON_LABEL: Record<AbsentReason, string> = {
  unknown: "Not known",
  pending: "Result pending",
  "not-collected": "Not asked",
  declined: "Declined to answer",
  masked: "Hidden — restricted",
  "not-permitted": "Not permitted",
  "not-applicable": "Not applicable",
  "not-performed": "Not performed",
  "as-text": "See narrative",
  error: "Unavailable — system error",
  unstated: "Not recorded",
};

/**
 * True when the absence is a permissions boundary rather than missing data.
 *
 * The distinction matters in both directions: a clinician who reads "hidden"
 * as "not recorded" believes the chart is empty when it is not, and one who
 * reads "not recorded" as "hidden" goes looking for data that does not exist.
 */
export function isRestrictedAbsence(reason: AbsentReason): boolean {
  return reason === "masked" || reason === "not-permitted";
}

/** True when something is broken, as opposed to genuinely absent. */
export function isErrorAbsence(reason: AbsentReason): boolean {
  return reason === "error";
}

/**
 * True when the value may still arrive. Callers use this to decide whether to
 * keep polling or to stop asking — a pending result is not a final answer.
 */
export function isPendingAbsence(reason: AbsentReason): boolean {
  return reason === "pending";
}

// ---------------------------------------------------------------------------
// Observation.component
//
// FHIR models blood pressure as ONE Observation with two components — systolic
// and diastolic — and no value on the parent. A renderer that only reads
// `valueQuantity` shows the most common vital sign in medicine as having no
// value at all, which is worse than not supporting it.
// ---------------------------------------------------------------------------

/** True when the reading lives in components rather than on the parent. */
export function hasComponents(observation: Observation | undefined): boolean {
  return Boolean(observation?.component?.length);
}

/** Best available display value for a single component. */
export function formatComponentValue(
  component: ObservationComponent | undefined,
): string | undefined {
  if (!component) return undefined;
  return (
    formatQuantity(component.valueQuantity) ??
    component.valueString ??
    codeableText(component.valueCodeableConcept) ??
    (typeof component.valueBoolean === "boolean"
      ? component.valueBoolean
        ? "Yes"
        : "No"
      : undefined)
  );
}

/**
 * Interpretation for a component, using the same rules as the parent: a stated
 * interpretation wins, otherwise compare to the component's own reference
 * range, otherwise unknown.
 */
export function getComponentInterpretation(
  component: ObservationComponent | undefined,
): Interpretation {
  const codes = component?.interpretation?.flatMap((i) => i.coding ?? []) ?? [];
  for (const coding of codes) {
    const mapped = coding.code ? INTERPRETATION_BY_CODE[coding.code] : undefined;
    if (mapped) return mapped;
  }

  const value = component?.valueQuantity?.value;
  const range = component?.referenceRange?.[0];
  if (typeof value === "number" && range) {
    if (typeof range.high?.value === "number" && value > range.high.value) return "high";
    if (typeof range.low?.value === "number" && value < range.low.value) return "low";
    if (range.low?.value !== undefined || range.high?.value !== undefined) return "normal";
  }

  return "unknown";
}

/** Severity order, worst first. Used to escalate a panel to its worst part. */
const INTERPRETATION_SEVERITY: Interpretation[] = [
  "critical-high",
  "critical-low",
  "abnormal",
  "high",
  "low",
  "normal",
  "unknown",
];

export function worstInterpretation(interpretations: Interpretation[]): Interpretation {
  for (const candidate of INTERPRETATION_SEVERITY) {
    if (interpretations.includes(candidate)) return candidate;
  }
  return "unknown";
}

/**
 * Interpretation for the whole observation, including its components.
 *
 * A panel is only as reassuring as its worst part — a critical systolic must
 * escalate the blood-pressure row even though the parent carries no value and
 * no interpretation of its own.
 */
export function getPanelInterpretation(observation: Observation | undefined): Interpretation {
  const own = getInterpretation(observation);
  if (!hasComponents(observation)) return own;

  const parts = (observation?.component ?? []).map(getComponentInterpretation);
  return worstInterpretation(own === "unknown" ? parts : [own, ...parts]);
}

/** Observation statuses that must be surfaced to the reader, not hidden. */
export function isProvisional(observation: Observation | undefined): boolean {
  const status = observation?.status;
  return status === "preliminary" || status === "registered";
}

export function isCorrected(observation: Observation | undefined): boolean {
  const status = observation?.status;
  return status === "amended" || status === "corrected";
}

// ---------------------------------------------------------------------------
// MedicationRequest
// ---------------------------------------------------------------------------

/** Drug name from either the inline concept or the referenced Medication. */
export function medicationName(request: MedicationRequest | undefined): string | undefined {
  return (
    codeableText(request?.medicationCodeableConcept) ??
    request?.medicationReference?.display
  );
}

const TIMING_UNIT_LABEL: Record<string, string> = {
  s: "second",
  min: "minute",
  h: "hour",
  d: "day",
  wk: "week",
  mo: "month",
  a: "year",
};

/**
 * Human-readable dosage line.
 *
 * Prefers `Dosage.text` whenever present — that string was authored or
 * generated by the prescribing system and is the legally meaningful
 * instruction. Only when it is absent do we compose one from the structured
 * fields, and we never silently drop a component we could not express.
 */
export function formatDosage(dosage: Dosage | undefined): string | undefined {
  if (!dosage) return undefined;
  if (dosage.text) return dosage.text;

  const parts: string[] = [];

  const dose = dosage.doseAndRate?.find((d) => d.doseQuantity)?.doseQuantity;
  const doseText = formatQuantity(dose);
  if (doseText) parts.push(doseText);

  const route = codeableText(dosage.route);
  if (route) parts.push(route);

  const repeat = dosage.timing?.repeat;
  if (repeat?.frequency && repeat.period && repeat.periodUnit) {
    const unit = TIMING_UNIT_LABEL[repeat.periodUnit] ?? repeat.periodUnit;
    const every = repeat.period === 1 ? unit : `${repeat.period} ${unit}s`;
    parts.push(
      repeat.frequency === 1 ? `once every ${every}` : `${repeat.frequency} times every ${every}`,
    );
  }

  if (dosage.asNeededBoolean) parts.push("as needed");
  const asNeededFor = codeableText(dosage.asNeededCodeableConcept);
  if (asNeededFor) parts.push(`as needed for ${asNeededFor}`);

  return parts.length ? parts.join(" · ") : undefined;
}

/**
 * Medication statuses that mean "not currently being taken".
 * Kept explicit rather than `status !== "active"` so that `unknown` and
 * `draft` are not quietly presented as discontinued.
 */
export function isMedicationInactive(request: MedicationRequest | undefined): boolean {
  const status = request?.status;
  return status === "stopped" || status === "cancelled" || status === "completed";
}

/** True when the dispense validity period has already ended. */
export function isMedicationExpired(
  request: MedicationRequest | undefined,
  asOf: Date = new Date(),
): boolean {
  const end = request?.dispenseRequest?.validityPeriod?.end;
  if (!end) return false;
  const ends = new Date(end);
  return !Number.isNaN(ends.getTime()) && ends < asOf;
}

// ---------------------------------------------------------------------------
// AllergyIntolerance
// ---------------------------------------------------------------------------

/**
 * Worst reaction severity recorded against an allergy.
 * Returns undefined when no reaction is documented — which is different from
 * a documented mild reaction and must not be flattened into one.
 */
export function worstReactionSeverity(
  allergy: AllergyIntolerance | undefined,
): "mild" | "moderate" | "severe" | undefined {
  const severities = allergy?.reaction?.map((r) => r.severity).filter(Boolean);
  if (!severities?.length) return undefined;
  if (severities.includes("severe")) return "severe";
  if (severities.includes("moderate")) return "moderate";
  return "mild";
}

/** Clinical status code, e.g. "active", "inactive", "resolved". */
export function clinicalStatusCode(
  resource: { clinicalStatus?: CodeableConcept } | undefined,
): string | undefined {
  return resource?.clinicalStatus?.coding?.[0]?.code ?? resource?.clinicalStatus?.text;
}

/** Verification status code, e.g. "confirmed", "unconfirmed", "refuted". */
export function verificationStatusCode(
  resource: { verificationStatus?: CodeableConcept } | undefined,
): string | undefined {
  return resource?.verificationStatus?.coding?.[0]?.code ?? resource?.verificationStatus?.text;
}

/** All reaction manifestations, flattened for display. */
export function reactionManifestations(allergy: AllergyIntolerance | undefined): string[] {
  return (
    allergy?.reaction
      ?.flatMap((r) => r.manifestation ?? [])
      .map((m) => codeableText(m))
      .filter((text): text is string => Boolean(text)) ?? []
  );
}

// ---------------------------------------------------------------------------
// Appointment
// ---------------------------------------------------------------------------

/**
 * Format an appointment's start time in an explicit time zone.
 *
 * Time zone is a required argument, not an optional one. Defaulting to the
 * browser's zone is how a clinic in one region books a patient in another for
 * the wrong hour — the caller must state which zone the time should be read in.
 */
export function formatAppointmentTime(
  appointment: Appointment | undefined,
  timeZone: string,
  locale?: string,
): string | undefined {
  if (!appointment?.start) return undefined;
  const start = new Date(appointment.start);
  if (Number.isNaN(start.getTime())) return undefined;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(start);
  } catch {
    // An invalid IANA zone must not take the screen down with it.
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(start);
  }
}

/** Short time-zone label, e.g. "GMT+5:30". */
export function timeZoneLabel(timeZone: string, at: Date = new Date()): string | undefined {
  try {
    const parts = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "shortOffset" }).formatToParts(at);
    return parts.find((p) => p.type === "timeZoneName")?.value;
  } catch {
    return undefined;
  }
}

/** True when any participant is a virtual-care channel. */
export function isVirtualAppointment(appointment: Appointment | undefined): boolean {
  const codes = [
    ...(appointment?.serviceType ?? []),
    ...(appointment?.appointmentType ? [appointment.appointmentType] : []),
  ];
  return codes.some((c) =>
    c.coding?.some((coding) => {
      const value = `${coding.code ?? ""} ${coding.display ?? ""}`.toLowerCase();
      return value.includes("virtual") || value.includes("telehealth") || value.includes("video");
    }) || (c.text ?? "").toLowerCase().includes("virtual"),
  );
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export type CoverageState = "active" | "not-yet-effective" | "lapsed" | "cancelled" | "unknown";

/**
 * Effective state of a coverage at a point in time.
 *
 * `status: "active"` alone is not enough — a coverage can be marked active
 * while its period has already ended. Acting on lapsed coverage produces a
 * denied claim and a surprise bill, so the period is checked as well.
 */
export function coverageState(
  coverage: Coverage | undefined,
  asOf: Date = new Date(),
): CoverageState {
  if (!coverage) return "unknown";
  if (coverage.status === "cancelled" || coverage.status === "entered-in-error") return "cancelled";
  if (coverage.status !== "active") return "unknown";

  const { start, end } = coverage.period ?? {};
  const startsAt = start ? new Date(start) : undefined;
  const endsAt = end ? new Date(end) : undefined;

  if (startsAt && !Number.isNaN(startsAt.getTime()) && startsAt > asOf) return "not-yet-effective";
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt < asOf) return "lapsed";
  return "active";
}

/** Named class value from a Coverage, e.g. "group", "plan", "subgroup". */
export function coverageClass(coverage: Coverage | undefined, type: string): string | undefined {
  return coverage?.class?.find((c) => c.type?.coding?.some((coding) => coding.code === type))?.value;
}

// ---------------------------------------------------------------------------
// Quantity parts
//
// Layout is where a value and its unit drift apart. Returning the pieces lets
// a renderer keep them in one element and style them independently without
// re-parsing a formatted string.
// ---------------------------------------------------------------------------

export interface QuantityParts {
  /** "<", ">", "<=", ">=" — preserved, because <0.01 is not 0.01. */
  comparator?: string;
  /** The number exactly as reported. Never re-rounded. */
  value: string;
  /** Display unit, or the UCUM code when no display unit was given. */
  unit?: string;
}

/**
 * Split a Quantity into its display parts, preserving reported precision.
 *
 * `value` is a string on purpose: 5.10 and 5.1 are the same number and
 * different results, and a lab that reported three decimals meant three.
 */
export function quantityParts(quantity: Quantity | undefined): QuantityParts | undefined {
  if (!quantity || typeof quantity.value !== "number" || Number.isNaN(quantity.value)) {
    return undefined;
  }
  return {
    comparator: quantity.comparator,
    value: String(quantity.value),
    unit: quantity.unit ?? quantity.code,
  };
}

// ---------------------------------------------------------------------------
// Reference range geometry
//
// Turning a value and its range into a drawable position. The hard requirement
// is that the scale never implies a bound nobody stated.
// ---------------------------------------------------------------------------

export interface RangeGeometry {
  /** Position of the value across the drawn scale, 0–1, clamped. */
  position: number;
  /** Normal band as [start, end] in the same 0–1 space. */
  band: [number, number];
  /** True when the value fell outside the scale and was clamped to an edge. */
  offScale: boolean;
  /** True when only one bound was stated, so one end of the scale is inferred. */
  oneSided: boolean;
}

/**
 * Geometry for a reference-range bar.
 *
 * Returns undefined when there is nothing honest to draw — no numeric value,
 * or a range with no numeric bound at all. A text-only range ("see report")
 * cannot be positioned and must not be faked.
 */
export function rangeGeometry(
  value: number | undefined,
  range: ObservationReferenceRange | undefined,
): RangeGeometry | undefined {
  if (typeof value !== "number" || Number.isNaN(value) || !range) return undefined;

  const low = typeof range.low?.value === "number" ? range.low.value : undefined;
  const high = typeof range.high?.value === "number" ? range.high.value : undefined;
  if (low === undefined && high === undefined) return undefined;

  let scaleMin: number;
  let scaleMax: number;
  let bandStart: number;
  let bandEnd: number;
  const oneSided = low === undefined || high === undefined;

  if (low !== undefined && high !== undefined) {
    if (high < low) return undefined; // malformed; refuse rather than invert
    const width = high - low || Math.abs(high) || 1;

    // The scale grows to fit the value, up to a ceiling. Without this, a
    // potassium of 6.8 and one of 12.0 both pin to the same edge and read as
    // the same result, which throws away the distinction the bar exists for.
    // Past the ceiling we stop growing and mark it off-scale, so a single
    // extreme value cannot squash the normal band into invisibility.
    const PAD = 0.75; // comfortable padding for an in-range value
    const MAX_PAD = 3; // beyond this, clamp rather than keep zooming out
    const overshoot = Math.max(0, value - high, low - value) / width;
    const pad = Math.min(MAX_PAD, Math.max(PAD, overshoot * 1.15));

    scaleMin = low - width * pad;
    scaleMax = high + width * pad;
    bandStart = low;
    bandEnd = high;
  } else if (high !== undefined) {
    // "< 5.7": the scale runs from zero, which is a real floor for the
    // analytes that get one-sided upper bounds, not an invented bound.
    scaleMin = Math.min(0, value);
    scaleMax = high * 1.75 || 1;
    bandStart = scaleMin;
    bandEnd = high;
  } else {
    const l = low as number;
    scaleMin = Math.min(l * 0.25, value);
    scaleMax = Math.max(l * 1.75 || 1, value);
    bandStart = l;
    bandEnd = scaleMax;
  }

  const span = scaleMax - scaleMin || 1;
  const raw = (value - scaleMin) / span;
  const clamped = Math.min(1, Math.max(0, raw));

  return {
    position: clamped,
    band: [
      Math.min(1, Math.max(0, (bandStart - scaleMin) / span)),
      Math.min(1, Math.max(0, (bandEnd - scaleMin) / span)),
    ],
    offScale: raw !== clamped,
    oneSided,
  };
}

// ---------------------------------------------------------------------------
// Dates and precision
//
// FHIR dateTime is deliberately imprecise: "2026", "2026-08", "2026-08-03",
// and a full instant are all valid. Rendering a year-only date as 1 January
// invents a day that nobody recorded.
// ---------------------------------------------------------------------------

export type DatePrecision = "year" | "month" | "day" | "time";

/** Precision actually present in a FHIR date, dateTime, or instant. */
export function datePrecision(value: string | undefined): DatePrecision | undefined {
  if (!value) return undefined;
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}$/.test(value)) return "month";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "day";
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "time";
  return undefined;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format a FHIR date at the precision it was recorded, in an explicit zone.
 *
 * `timeZone` is required for instants and ignored for partial dates — a
 * year-only value has no instant to shift, and applying a zone to one is how
 * a date silently moves by a day.
 */
export function formatClinicalDate(
  value: string | undefined,
  timeZone: string,
  locale?: string,
): string | undefined {
  const precision = datePrecision(value);
  if (!precision || !value) return undefined;

  if (precision === "year") return value;
  if (precision === "month") {
    const [year, month] = value.split("-");
    const name = MONTHS[Number(month) - 1];
    return name ? `${name} ${year}` : value;
  }

  const parsed = new Date(precision === "day" ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(parsed.getTime())) return undefined;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      ...(precision === "time" ? { timeStyle: "short" as const } : {}),
      timeZone: precision === "day" ? "UTC" : timeZone,
    }).format(parsed);
  } catch {
    // An invalid IANA zone must not take the screen down with it.
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
  }
}

/** True when an instant is in the future, which usually signals a data error. */
export function isFutureDate(value: string | undefined, asOf: Date = new Date()): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed > asOf;
}

// ---------------------------------------------------------------------------
// Age
// ---------------------------------------------------------------------------

/**
 * Age at the precision the age itself warrants.
 *
 * A heart rate of 150 is an emergency in an adult and unremarkable in a
 * newborn, so "0 y" is not an acceptable rendering for a six-day-old.
 */
export function formatAge(birthDate: string | undefined, asOf: Date = new Date()): string | undefined {
  if (!birthDate) return undefined;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime()) || born > asOf) return undefined;

  const days = Math.floor((asOf.getTime() - born.getTime()) / 86_400_000);
  if (days < 28) return `${days} d`;

  const years = calculateAge(birthDate, asOf);
  if (years === undefined) return undefined;
  if (years < 2) {
    let months = (asOf.getFullYear() - born.getFullYear()) * 12 + (asOf.getMonth() - born.getMonth());
    if (asOf.getDate() < born.getDate()) months -= 1;
    return `${Math.max(0, months)} mo`;
  }
  return `${years} y`;
}

/**
 * Deterministic initials for an avatar.
 *
 * Derived from the characters of the name only. Nothing here infers gender,
 * ethnicity, or anything else from a name — an avatar is not a classifier.
 */
export function nameInitials(name: string | undefined, max = 2): string | undefined {
  if (!name) return undefined;
  const words = name
    .replace(/[(),.]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !/^(mr|mrs|ms|mx|dr|prof|sir|rev)$/i.test(w));
  if (!words.length) return undefined;

  const picked = words.length === 1 ? [words[0]!] : [words[0]!, words[words.length - 1]!];
  const initials = picked
    .slice(0, max)
    .map((w) => Array.from(w)[0] ?? "")
    .join("")
    .toUpperCase();
  return initials || undefined;
}

// ---------------------------------------------------------------------------
// Terminology
// ---------------------------------------------------------------------------

const TERMINOLOGY_NAME: Record<string, string> = {
  "http://loinc.org": "LOINC",
  "http://snomed.info/sct": "SNOMED CT",
  "http://hl7.org/fhir/sid/icd-10": "ICD-10",
  "http://hl7.org/fhir/sid/icd-10-cm": "ICD-10-CM",
  "http://hl7.org/fhir/sid/icd-11": "ICD-11",
  "http://hl7.org/fhir/sid/icd-9-cm": "ICD-9-CM",
  "http://www.nlm.nih.gov/research/umls/rxnorm": "RxNorm",
  "http://www.ama-assn.org/go/cpt": "CPT",
  "http://hl7.org/fhir/sid/cvx": "CVX",
  "http://unitsofmeasure.org": "UCUM",
  "http://terminology.hl7.org/CodeSystem/data-absent-reason": "Data absent reason",
};

/**
 * Human name for a terminology system URI.
 *
 * Returns undefined for systems we do not recognise rather than echoing the
 * URI as though it were a name — an unrecognised system is worth showing as
 * unrecognised, because it is usually a mapping problem.
 */
export function terminologyName(system: string | undefined): string | undefined {
  if (!system) return undefined;
  return TERMINOLOGY_NAME[system];
}

// ---------------------------------------------------------------------------
// Dose safety
//
// ISMP identifies a small set of numeric formatting patterns behind a
// disproportionate share of tenfold medication errors. These are not style
// preferences — a trailing zero read past the decimal point is a 10× overdose.
//
// https://www.ismp.org/recommendations/error-prone-abbreviations-list
// ---------------------------------------------------------------------------

export type DoseFormatIssue = "trailing-zero" | "naked-decimal" | "not-a-number";

/**
 * Formatting problems in a typed dose, worst first.
 *
 *   1.0 mg  → trailing zero. Read as "10" if the point is missed.
 *   .5 mg   → naked decimal. Read as "5" if the point is missed.
 *
 * Returns an empty array for a well-formed dose, so an empty result is a pass.
 */
export function doseFormatIssues(raw: string | undefined): DoseFormatIssue[] {
  if (raw === undefined || raw.trim() === "") return [];
  const value = raw.trim();
  const issues: DoseFormatIssue[] = [];

  if (!/^\d*\.?\d+$/.test(value)) return ["not-a-number"];
  if (/^\./.test(value)) issues.push("naked-decimal");
  if (/\.\d*0$/.test(value)) issues.push("trailing-zero");
  return issues;
}

/** Corrected rendering of a dose: no naked decimal, no trailing zero. */
export function safeDoseText(raw: string | undefined): string | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const numeric = Number(raw);
  if (Number.isNaN(numeric)) return undefined;
  // String(Number) drops a trailing zero and adds the leading zero, which is
  // exactly the ISMP-recommended form.
  return String(numeric);
}

export const DOSE_ISSUE_LABEL: Record<DoseFormatIssue, string> = {
  "trailing-zero": "Trailing zero — write 1 mg, not 1.0 mg. A missed decimal point reads as a tenfold overdose.",
  "naked-decimal": "Missing leading zero — write 0.5 mg, not .5 mg. A missed decimal point reads as a tenfold overdose.",
  "not-a-number": "Not a number.",
};

/**
 * Weight-based dose with the arithmetic kept, not just the answer.
 *
 * A calculator that returns a bare number invites use with a stale or wrong
 * weight. Returning the inputs lets the caller show its working.
 */
export interface WeightBasedDose {
  dosePerKg: number;
  weightKg: number;
  total: number;
  /** Capped by a stated maximum, if one applied. */
  cappedAt?: number;
  workings: string;
}

export function weightBasedDose(
  dosePerKg: number | undefined,
  weightKg: number | undefined,
  maxDose?: number,
): WeightBasedDose | undefined {
  if (
    typeof dosePerKg !== "number" ||
    typeof weightKg !== "number" ||
    Number.isNaN(dosePerKg) ||
    Number.isNaN(weightKg) ||
    weightKg <= 0
  ) {
    // No weight means no calculation. Substituting an average weight is how a
    // paediatric dose becomes an adult one.
    return undefined;
  }

  const raw = dosePerKg * weightKg;
  const rounded = Math.round(raw * 1000) / 1000;
  const capped = typeof maxDose === "number" && rounded > maxDose;
  const total = capped ? maxDose : rounded;

  return {
    dosePerKg,
    weightKg,
    total,
    cappedAt: capped ? maxDose : undefined,
    workings: capped
      ? `${dosePerKg} × ${weightKg} kg = ${rounded}, capped at ${maxDose}`
      : `${dosePerKg} × ${weightKg} kg = ${rounded}`,
  };
}

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

export type EntryMethod = "clinician" | "patient-reported" | "device" | "interface" | "unknown";

const AGENT_TYPE_METHOD: Record<string, EntryMethod> = {
  author: "clinician",
  enterer: "clinician",
  performer: "clinician",
  informant: "patient-reported",
  custodian: "interface",
  assembler: "interface",
  composer: "interface",
};

/**
 * Who recorded this, when, and by what route.
 *
 * Clinicians discount data they cannot source, so "unknown" is returned
 * honestly rather than papered over with a plausible-looking default.
 */
export interface ProvenanceSummary {
  author?: string;
  recordedAt?: string;
  occurredAt?: string;
  source?: string;
  method: EntryMethod;
  /** True when the record was changed after it was first released. */
  amended: boolean;
  versionId?: string;
}

export function summariseProvenance(
  provenance: Provenance | undefined,
  resource?: Resource,
): ProvenanceSummary {
  const agent = provenance?.agent?.[0];
  const agentCode = agent?.type?.coding?.[0]?.code;

  // A device agent is stated by reference type, not by agent type code.
  const isDevice = agent?.who?.type === "Device" || agent?.who?.reference?.startsWith("Device/");
  const method: EntryMethod = isDevice
    ? "device"
    : agentCode
      ? (AGENT_TYPE_METHOD[agentCode] ?? "unknown")
      : "unknown";

  const versionId = resource?.meta?.versionId;

  return {
    author: agent?.who?.display,
    recordedAt: provenance?.recorded ?? resource?.meta?.lastUpdated,
    occurredAt: provenance?.occurredDateTime,
    source: provenance?.entity?.find((e) => e.role === "source")?.what?.display ?? resource?.meta?.source,
    method,
    // versionId "1" is the original. Anything higher means it was revised, and
    // a corrected result that looks identical to the original is a known harm.
    amended:
      Boolean(provenance?.entity?.some((e) => e.role === "revision")) ||
      (versionId !== undefined && Number(versionId) > 1),
    versionId,
  };
}

export const ENTRY_METHOD_LABEL: Record<EntryMethod, string> = {
  clinician: "Entered by a clinician",
  "patient-reported": "Patient-reported",
  device: "Device-recorded",
  interface: "Received by interface",
  unknown: "Source not recorded",
};

// ---------------------------------------------------------------------------
// Flags and precautions
// ---------------------------------------------------------------------------

/** True when a flag is active at `asOf`, rather than merely status: active. */
export function isFlagActive(flag: Flag | undefined, asOf: Date = new Date()): boolean {
  if (flag?.status !== "active") return false;
  const { start, end } = flag.period ?? {};
  const startsAt = start ? new Date(start) : undefined;
  const endsAt = end ? new Date(end) : undefined;
  if (startsAt && !Number.isNaN(startsAt.getTime()) && startsAt > asOf) return false;
  // A lapsed precaution left on screen teaches staff to ignore all of them.
  if (endsAt && !Number.isNaN(endsAt.getTime()) && endsAt < asOf) return false;
  return true;
}

/** Category code on a flag, e.g. "infection", "safety", "behavioral". */
export function flagCategory(flag: Flag | undefined): string | undefined {
  return flag?.category?.[0]?.coding?.[0]?.code ?? flag?.category?.[0]?.text;
}

// ---------------------------------------------------------------------------
// Care team
// ---------------------------------------------------------------------------

export interface CareTeamMember {
  name: string;
  role?: string;
  /** False once the participation period has ended — history, not current. */
  current: boolean;
  reference?: string;
}

/**
 * Flatten CareTeam participants, keeping ended memberships as history.
 *
 * Deleting a past member loses the answer to "who was looking after them in
 * March", which is exactly what a review asks.
 */
export function careTeamMembers(
  team: CareTeam | undefined,
  asOf: Date = new Date(),
): CareTeamMember[] {
  const members: CareTeamMember[] = [];
  for (const participant of team?.participant ?? []) {
    const name = participant.member?.display;
    // A participant we cannot name is not renderable. Skipping is honest;
    // inventing "Unknown member" would pad the team with a phantom.
    if (!name) continue;

    const start = participant.period?.start ? new Date(participant.period.start) : undefined;
    const end = participant.period?.end ? new Date(participant.period.end) : undefined;
    const started = !start || Number.isNaN(start.getTime()) || start <= asOf;
    const notEnded = !end || Number.isNaN(end.getTime()) || end >= asOf;

    members.push({
      name,
      role: codeableText(participant.role?.[0]),
      current: started && notEnded,
      reference: participant.member?.reference,
    });
  }
  return members;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type AlertSeverity = "critical" | "high" | "moderate" | "low" | "info";

/**
 * Severity from a DetectedIssue, mapped to the tiers that decide whether an
 * alert is allowed to interrupt. Interruption is a scarce resource and only
 * the top tier gets to spend it.
 */
export function detectedIssueSeverity(issue: DetectedIssue | undefined): AlertSeverity {
  switch (issue?.severity) {
    case "high":
      return "critical";
    case "moderate":
      return "high";
    case "low":
      return "low";
    default:
      return "info";
  }
}

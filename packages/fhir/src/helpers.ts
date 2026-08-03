/**
 * Pure helpers for reading FHIR R4 payloads.
 *
 * Rules for everything in this file:
 *   - no side effects, no I/O, no dependencies
 *   - never throw on malformed input — return a safe fallback
 *   - never invent clinical meaning that is not in the payload
 */

import type {
  CodeableConcept,
  Coding,
  HumanName,
  Identifier,
  Observation,
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

/** Observation statuses that must be surfaced to the reader, not hidden. */
export function isProvisional(observation: Observation | undefined): boolean {
  const status = observation?.status;
  return status === "preliminary" || status === "registered";
}

export function isCorrected(observation: Observation | undefined): boolean {
  const status = observation?.status;
  return status === "amended" || status === "corrected";
}

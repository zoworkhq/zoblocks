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

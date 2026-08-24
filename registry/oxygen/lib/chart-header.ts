/**
 * The rules behind the most-read 80 pixels in healthcare software.
 *
 * A chart header is almost always built as a heading, and three things follow
 * from that. It scrolls away, so the clinician acts with no identity on screen.
 * It shows administrative gender, which is the wrong field for any clinical
 * decision. And it treats the encounter as a subtitle, when *which encounter am
 * I documenting into* is the most common cause of a misfiled note.
 *
 * This file is the part with opinions in it: what the safety strip must carry,
 * what may never appear beside a dose, and what "no encounter selected" means.
 * The rendering, the sticky behaviour and the collapse live in the component.
 *
 * Identity itself is not re-implemented here. `@oxygenui-design/identity-core`
 * already resolves the name a person uses, their pronouns, their identifiers,
 * their photo state and the deceased/merged/test flags, and deliberately never
 * resolves `Patient.gender`. What is added here is the context-specific reading
 * of the Sex Parameter for Clinical Use, which is a different question from
 * "what is on the demographic record".
 *
 * No React, no DOM.
 */

import { clockTime } from "@/lib/oxygen-clock";

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

/**
 * What the clinician has in view, which decides what the header may say.
 *
 * Not a layout mode. It is the reason a field appears: SPCU belongs beside an
 * order or a result and nowhere else, because outside those two it is a
 * demographic being read as a clinical fact, which is the failure the field
 * was created to fix.
 */
export type ChartSurface = "overview" | "orders" | "results" | "documentation";

/** The two surfaces where the Sex Parameter for Clinical Use is a fact in use. */
export const SPCU_SURFACES: readonly ChartSurface[] = ["orders", "results"];

/* ------------------------------------------------------------------ */
/* Sex Parameter for Clinical Use                                      */
/* ------------------------------------------------------------------ */

export interface SpcuReading {
  /** "female", "male", "specified", "unknown" — the recorded parameter. */
  value: string;
  /**
   * What it is for. "For medication dosing", "for reference ranges".
   *
   * The context is the field's whole point: a patient can have one parameter
   * for dosing and another for reference ranges, and a value shown without its
   * context has been flattened back into the demographic it was meant to
   * replace.
   */
  context: string | null;
  /**
   * False when the surface calls for the parameter and nothing is recorded.
   *
   * Rendered as "not recorded" rather than omitted. An absent SPCU on an order
   * screen is the moment somebody reaches for `Patient.gender`, and saying so
   * out loud is what stops them.
   */
  recorded: boolean;
}

interface FhirCoding {
  code?: string;
  display?: string;
  system?: string;
}

interface FhirConcept {
  text?: string;
  coding?: FhirCoding[];
}

interface FhirExtension {
  url?: string;
  valueCodeableConcept?: FhirConcept;
  valueString?: string;
  valuePeriod?: { start?: string; end?: string };
  extension?: FhirExtension[];
}

interface FhirPatientLike {
  extension?: FhirExtension[];
}

export const EXT_SPCU =
  "http://hl7.org/fhir/StructureDefinition/patient-sexParameterForClinicalUse";

function conceptText(concept: FhirConcept | undefined): string | null {
  if (!concept) return null;
  if (concept.text) return concept.text;
  const coding = concept.coding?.[0];
  return coding?.display ?? coding?.code ?? null;
}

function withinPeriod(period: { start?: string; end?: string } | undefined, now?: string): boolean {
  if (!period || !now) return true;
  const at = Date.parse(now);
  if (!Number.isFinite(at)) return true;
  const start = period.start ? Date.parse(period.start) : Number.NEGATIVE_INFINITY;
  const end = period.end ? Date.parse(period.end) : Number.POSITIVE_INFINITY;
  return at >= start && at < end;
}

/**
 * The parameter that applies to what is on screen.
 *
 * `null` when the surface does not warrant it — an overview screen showing a
 * clinical sex parameter is showing a demographic, and the component declines.
 * A reading with `recorded: false` when the surface does warrant it and the
 * record has none, because on an order screen the absence is the finding.
 *
 * `Patient.gender` is never read. Not as a fallback, not as a last resort.
 */
export function resolveSpcu(
  patient: FhirPatientLike | undefined,
  surface: ChartSurface,
  now?: string,
): SpcuReading | null {
  if (!SPCU_SURFACES.includes(surface)) return null;

  const candidates = (patient?.extension ?? []).filter((ext) => ext.url === EXT_SPCU);

  for (const candidate of candidates) {
    // The complex form: value plus its comment and period, as sub-extensions.
    const parts = candidate.extension ?? [];
    const value =
      conceptText(candidate.valueCodeableConcept) ??
      conceptText(parts.find((p) => p.url === "value")?.valueCodeableConcept);
    if (!value) continue;

    const period = candidate.valuePeriod ?? parts.find((p) => p.url === "period")?.valuePeriod;
    if (!withinPeriod(period, now)) continue;

    const context =
      parts.find((p) => p.url === "comment")?.valueString ??
      parts.find((p) => p.url === "context")?.valueString ??
      candidate.valueString ??
      null;

    return { value, context, recorded: true };
  }

  return { value: "not recorded", context: null, recorded: false };
}

/** "Sex parameter for clinical use: female, for medication dosing." */
export function describeSpcu(reading: SpcuReading): string {
  if (!reading.recorded) {
    return "Sex parameter for clinical use not recorded. Do not substitute the administrative gender.";
  }
  return reading.context
    ? `Sex parameter for clinical use: ${reading.value}, ${reading.context}`
    : `Sex parameter for clinical use: ${reading.value}`;
}

/* ------------------------------------------------------------------ */
/* The safety strip                                                    */
/* ------------------------------------------------------------------ */

/**
 * The facts that survive the collapse.
 *
 * Six, and the order is fixed. A strip whose contents move between screens is
 * a strip nobody can read at a glance, and reading it at a glance is the only
 * thing it is for.
 */
export type SafetyKind =
  "allergy" | "code-status" | "isolation" | "fall-risk" | "legal-status" | "alert";

export const SAFETY_ORDER: readonly SafetyKind[] = [
  "allergy",
  "code-status",
  "isolation",
  "fall-risk",
  "legal-status",
  "alert",
];

/**
 * How loudly the fact reads.
 *
 * `absent` is a tone rather than an omission. "Allergies not asked" is not the
 * same fact as "no known allergies", and neither is the same as a blank space
 * — the blank is the one that gets prescribed against.
 */
export type SafetyTone = "critical" | "warn" | "info" | "absent";

export interface SafetyFact {
  kind: SafetyKind;
  /** "Penicillin, anaphylaxis", "DNR", "Contact precautions". */
  label: string;
  /** Where the fact came from, or what qualifies it. */
  detail?: string;
  tone: SafetyTone;
  /**
   * ISO 8601. A hold, a precaution or an alert that has an end.
   *
   * An involuntary hold that expired at 14:00 is a different legal fact from
   * one that runs until Friday, and a strip that shows only "involuntary" has
   * lost the half that decides what happens next.
   */
  until?: string;
}

export interface SafetyInput {
  /**
   * Pre-resolved, because the allergy question has its own component and its
   * own five-state answer. Passing a count here would collapse "none known"
   * and "never asked" into the same zero.
   */
  allergies?: { label: string; tone: SafetyTone; detail?: string };
  codeStatus?: { label: string; tone?: SafetyTone; until?: string };
  isolation?: { label: string; detail?: string; until?: string };
  fallRisk?: { label: string; tone?: SafetyTone };
  legalStatus?: { label: string; until?: string; detail?: string };
  alerts?: ReadonlyArray<{ label: string; tone?: SafetyTone; detail?: string }>;
}

/**
 * The strip, in fixed order, with absences named.
 *
 * Two facts are always emitted whether or not the host supplied them: allergy
 * status and code status. Everything else appears only when it exists — an
 * isolation row on every chart in the hospital is noise, and noise on this
 * strip is what makes the two rows that matter invisible.
 */
export function safetyStrip(input: SafetyInput): SafetyFact[] {
  const facts: SafetyFact[] = [];

  facts.push(
    input.allergies
      ? {
          kind: "allergy",
          label: input.allergies.label,
          tone: input.allergies.tone,
          ...(input.allergies.detail ? { detail: input.allergies.detail } : {}),
        }
      : { kind: "allergy", label: "Allergies not asked", tone: "absent" },
  );

  facts.push(
    input.codeStatus
      ? {
          kind: "code-status",
          label: input.codeStatus.label,
          tone: input.codeStatus.tone ?? "warn",
          ...(input.codeStatus.until ? { until: input.codeStatus.until } : {}),
        }
      : { kind: "code-status", label: "Code status not recorded", tone: "absent" },
  );

  if (input.isolation) {
    facts.push({
      kind: "isolation",
      label: input.isolation.label,
      tone: "critical",
      ...(input.isolation.detail ? { detail: input.isolation.detail } : {}),
      ...(input.isolation.until ? { until: input.isolation.until } : {}),
    });
  }

  if (input.fallRisk) {
    facts.push({
      kind: "fall-risk",
      label: input.fallRisk.label,
      tone: input.fallRisk.tone ?? "warn",
    });
  }

  if (input.legalStatus) {
    facts.push({
      kind: "legal-status",
      label: input.legalStatus.label,
      tone: "warn",
      ...(input.legalStatus.detail ? { detail: input.legalStatus.detail } : {}),
      ...(input.legalStatus.until ? { until: input.legalStatus.until } : {}),
    });
  }

  for (const alert of input.alerts ?? []) {
    facts.push({
      kind: "alert",
      label: alert.label,
      tone: alert.tone ?? "warn",
      ...(alert.detail ? { detail: alert.detail } : {}),
    });
  }

  return facts;
}

/**
 * Whether a dated fact has run out.
 *
 * Separate from rendering because an expired hold must still be *shown* — it
 * is shown as expired. Hiding it at the moment it lapses is how somebody
 * discovers at 02:00 that the legal basis for a patient's admission ended six
 * hours ago and nothing said so.
 */
export function hasExpired(fact: SafetyFact, now?: string): boolean {
  if (!fact.until || !now) return false;
  const end = Date.parse(fact.until);
  const at = Date.parse(now);
  return Number.isFinite(end) && Number.isFinite(at) && at >= end;
}

/** The whole strip as one spoken statement, in the order it is drawn. */
export function describeSafety(facts: readonly SafetyFact[], now?: string): string {
  if (!facts.length) return "No safety information recorded.";

  const parts = facts.map((fact) => {
    const clause = [fact.label, fact.detail].filter(Boolean).join(", ");
    if (!fact.until) return clause;
    // A clock time, not the instant. An ISO string read aloud is not an answer
    // to "until when" — it is the raw field the reader was meant to be spared.
    const when = clockTime(fact.until, now);
    return hasExpired(fact, now) ? `${clause}, expired ${when}` : `${clause}, until ${when}`;
  });

  return `${parts.join(". ")}.`;
}

/* ------------------------------------------------------------------ */
/* Encounter context                                                   */
/* ------------------------------------------------------------------ */

export interface EncounterOption {
  id: string;
  /** "Outpatient — 24 Aug, 09:00", "Inpatient — Ward 4B". */
  label: string;
  /** "ambulatory", "inpatient", "virtual". */
  type?: string;
  location?: string;
  /** ISO 8601 start, for ordering. */
  start?: string;
}

export type EncounterContext =
  { kind: "none"; reason: string } | { kind: "selected"; encounter: EncounterOption };

/**
 * Which encounter the clinician is documenting into.
 *
 * Never auto-selects when more than one is open. An encounter picked for the
 * user is an encounter the user did not read, and the note lands in whichever
 * one happened to sort first — which is the misfiling this control exists to
 * prevent. One open encounter is different: there is nothing to choose between,
 * so choosing it is not a guess.
 */
export function resolveEncounterContext(
  options: readonly EncounterOption[],
  selectedId?: string,
): EncounterContext {
  if (selectedId) {
    const chosen = options.find((option) => option.id === selectedId);
    if (chosen) return { kind: "selected", encounter: chosen };
    // A selection that no longer matches anything is not a selection. Falling
    // back to the first option would silently move the note.
    return { kind: "none", reason: "The selected encounter is no longer open" };
  }

  if (options.length === 1) {
    const only = options[0];
    if (only) return { kind: "selected", encounter: only };
  }

  return {
    kind: "none",
    reason: options.length
      ? `${options.length} encounters are open — choose one before documenting`
      : "No encounter is open",
  };
}

export function describeEncounterContext(context: EncounterContext): string {
  return context.kind === "selected"
    ? `Documenting into ${context.encounter.label}`
    : `No encounter selected. ${context.reason}.`;
}

/* ------------------------------------------------------------------ */
/* Program                                                             */
/* ------------------------------------------------------------------ */

export interface Program {
  /** "Intensive outpatient", "Partial hospitalisation". */
  name: string;
  /** 1-based. Week 3 of 8. */
  week?: number;
  of?: number;
}

/**
 * "IOP · week 3 of 8".
 *
 * Behavioral health needs this in the header and a general clinical library
 * never puts it there: the week is what decides whether today's session is a
 * mid-course review or a discharge plan, and it is the field a therapist looks
 * for first.
 */
export function describeProgram(program: Program): string {
  if (program.week === undefined) return program.name;
  return program.of === undefined
    ? `${program.name} · week ${program.week}`
    : `${program.name} · week ${program.week} of ${program.of}`;
}

interface FhirEpisode {
  status?: string;
  type?: FhirConcept[];
  period?: { start?: string; end?: string };
}

const WEEK_MS = 7 * 24 * 3_600_000;

/**
 * `EpisodeOfCare` into a program and a week.
 *
 * Returns `null` for an episode that is not active, and computes the week only
 * from a real start date. A week number guessed from an absent start is worse
 * than no week at all — it is a number a clinician will act on.
 */
export function programFromEpisode(episode: FhirEpisode, now: string): Program | null {
  if (episode.status && episode.status !== "active") return null;

  const name = conceptText(episode.type?.[0]);
  if (!name) return null;

  const program: Program = { name };

  const start = episode.period?.start ? Date.parse(episode.period.start) : Number.NaN;
  const at = Date.parse(now);
  if (Number.isFinite(start) && Number.isFinite(at) && at >= start) {
    program.week = Math.floor((at - start) / WEEK_MS) + 1;
    const end = episode.period?.end ? Date.parse(episode.period.end) : Number.NaN;
    if (Number.isFinite(end) && end > start) {
      program.of = Math.max(1, Math.ceil((end - start) / WEEK_MS));
    }
  }

  return program;
}

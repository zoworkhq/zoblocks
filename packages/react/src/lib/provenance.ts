// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/provenance.ts. Edit that file, not this one.
/**
 * Where a value came from, how it got here, and how much of it a human has
 * actually looked at.
 *
 * A blood pressure typed by a medical assistant, streamed from a home cuff,
 * pulled from an HIE document of unknown vintage, and extracted by a language
 * model from a scanned fax all render as `128/76`. They are not the same fact
 * and they do not support the same decision. As ambient AI and external
 * exchange both scale, the proportion of chart content no human ever typed is
 * rising fast, and there is no widely used convention for saying so.
 *
 * Two distinctions this file exists to hold:
 *
 *   recorded-at vs observed-at   the person who typed it is not always the
 *                                person who saw it, and an HIE document's date
 *                                is the document's, not the observation's
 *   patient-reported             the *instrument* in behavioral health, and a
 *                                *substitute* for a measurement elsewhere —
 *                                the same source class, two different weights
 *
 * No React, no DOM. Staleness thresholds are injected because four days is
 * nothing for a problem list and a lot for a blood pressure.
 */

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/**
 * Six classes, each with its own glyph rather than its own colour.
 *
 * Colour would put them on a scale — better to worse — and they are not one.
 * A patient-reported PHQ-9 is the correct provenance for a PHQ-9; a
 * patient-reported blood pressure standing in for a measurement is not. The
 * class is the same and the weight is the caller's to judge.
 */
export type ProvenanceSource =
  /** Measured in the room, by a person, on a device the organisation owns. */
  | "clinic"
  /** Streamed from a device the patient owns. */
  | "device"
  /** Typed by the patient. The instrument in behavioral health. */
  | "patient-reported"
  /** Received from another organisation, through a named exchange. */
  | "external"
  /** Lifted from a document by a model. */
  | "ai-extracted"
  /** Changed after the fact, with the original retained. */
  | "amended";

export const SOURCE_LABEL: Record<ProvenanceSource, string> = {
  clinic: "Clinic",
  device: "Device",
  "patient-reported": "Patient-reported",
  external: "External",
  "ai-extracted": "AI-extracted",
  amended: "Amended",
};

/** CSS shapes, so the class survives greyscale and forced colours. */
export const SOURCE_GLYPH: Record<ProvenanceSource, string> = {
  clinic: "building",
  device: "wave",
  "patient-reported": "person",
  external: "arrow-in",
  "ai-extracted": "spark",
  amended: "revision",
};

/* ------------------------------------------------------------------ */
/* The record                                                          */
/* ------------------------------------------------------------------ */

export interface ProvenanceAgent {
  /** "M. Adeyemi, MA". */
  display: string;
  /** "Medical assistant", "Attending". Rendered after the name. */
  role?: string;
}

export interface ProvenanceRecord {
  source: ProvenanceSource;

  /**
   * When the value was *observed*.
   *
   * Distinct from `recordedAt`, and the distinction is the whole reason an HIE
   * row is dangerous: a C-CDA authored on 11 March may carry a blood pressure
   * measured in January, and rendering the document's date as the
   * observation's is how a nine-week-old reading is acted on as current.
   */
  observedAt?: string;
  /** When it entered this record. Always at least as late as `observedAt`. */
  recordedAt?: string;

  /** Who observed it. */
  performer?: ProvenanceAgent;
  /** Who typed it, when that is somebody else. */
  recorder?: ProvenanceAgent;

  /** "Welch Allyn 6000", "Omron BP7450". */
  device?: string;
  /** "unvalidated cuff size", "median of 3". Caveats the device carries. */
  deviceNote?: string;

  /** Sending organisation, for an external value. */
  organisation?: string;
  /** "Carequality", "TEFCA", "Direct". The exchange, not just "external". */
  exchange?: string;
  /** "C-CDA, authored 11 Mar". What the value arrived inside. */
  document?: string;

  /** Model identity, for an extracted value. */
  model?: string;
  /**
   * Where in the source document the value was lifted from.
   *
   * Jumping to it is the single most requested behaviour from clinicians
   * reviewing extraction, which is why it is a first-class field rather than
   * something a host threads through an opaque payload.
   */
  span?: { document: string; page?: number; line?: number; ref?: string };
  /**
   * Whether a human has confirmed an extracted value.
   *
   * Only meaningful for `ai-extracted`, and `false` is not the same as absent:
   * absent means the question does not apply, false means nobody has looked.
   */
  confirmed?: boolean;
  confirmedBy?: ProvenanceAgent;

  /** For an amended value: what it used to say, and why it changed. */
  supersedes?: { value: string; reason?: string; at?: string };
}

/* ------------------------------------------------------------------ */
/* Staleness                                                           */
/* ------------------------------------------------------------------ */

/**
 * How old is too old, per kind of datum.
 *
 * Injected rather than global. Four days is nothing for a problem list and a
 * lot for a blood pressure, and a single threshold would either scream about
 * every diagnosis or stay silent about every vital.
 */
export type StalenessPolicy = (record: ProvenanceRecord) => number | null;

export type Staleness =
  | { state: "fresh"; ageMs: number }
  | { state: "stale"; ageMs: number }
  /** No policy, or nothing to measure. Says so rather than assuming fresh. */
  | { state: "unknown" };

/**
 * The age of the *observation*, not of the record.
 *
 * `observedAt` first and `recordedAt` only as a fallback: an HIE document
 * received today carrying a January reading is nine weeks old, and measuring
 * from the receipt is exactly the error the two fields exist to prevent.
 */
export function staleness(
  record: ProvenanceRecord,
  now: string,
  policy?: StalenessPolicy,
): Staleness {
  const at = record.observedAt ?? record.recordedAt;
  if (!at) return { state: "unknown" };

  const ageMs = Math.max(0, Date.parse(now) - Date.parse(at));
  if (!Number.isFinite(ageMs)) return { state: "unknown" };

  const threshold = policy?.(record) ?? null;
  if (threshold === null) return { state: "unknown" };

  return ageMs > threshold ? { state: "stale", ageMs } : { state: "fresh", ageMs };
}

/**
 * "4 h", "4 d". Abbreviated, unlike the spoken form the other libs use.
 *
 * Deliberately its own function rather than a shared one. These files are
 * copied into a consumer's repository one at a time, so a helper shared across
 * two libs means installing ProvenanceChip drags in RiskIndicator — and the
 * two want different output anyway: an affix beside a value has room for "4 d"
 * and a risk card has room for "4 days".
 */
export function describeAgeShort(ms: number): string {
  if (ms < 60_000) return "just now";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} d`;
  return `${Math.round(days / 30)} mo`;
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

/**
 * The whole provenance as one spoken statement.
 *
 * "Source: home blood-pressure cuff, transmitted 4 days ago, not reviewed."
 *
 * Order matters and is fixed: what kind of source, then who or what, then when,
 * then — for an extracted value — whether anybody has looked at it. The
 * confirmation clause is last because it is the one that decides whether to
 * act, and a listener remembers the end of a sentence.
 */
export function describeProvenance(
  record: ProvenanceRecord,
  now?: string,
  policy?: StalenessPolicy,
): string {
  const parts: string[] = [`Source: ${SOURCE_LABEL[record.source].toLowerCase()}`];

  if (record.organisation) {
    parts.push(
      record.exchange ? `${record.organisation} via ${record.exchange}` : record.organisation,
    );
  }
  if (record.document) parts.push(record.document);
  if (record.device)
    parts.push(record.deviceNote ? `${record.device}, ${record.deviceNote}` : record.device);

  const performer = record.performer;
  if (performer) {
    parts.push(
      performer.role
        ? `observed by ${performer.display}, ${performer.role}`
        : `observed by ${performer.display}`,
    );
  }
  // Only when it is somebody else — otherwise it is the same fact twice.
  if (record.recorder && record.recorder.display !== performer?.display) {
    parts.push(`recorded by ${record.recorder.display}`);
  }

  if (record.model) parts.push(`model ${record.model}`);
  if (record.span) {
    const where = [
      record.span.document,
      typeof record.span.page === "number" ? `page ${record.span.page}` : null,
      typeof record.span.line === "number" ? `line ${record.span.line}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    parts.push(`from ${where}`);
  }

  if (record.supersedes) {
    const reason = record.supersedes.reason ? `, ${record.supersedes.reason}` : "";
    parts.push(`originally ${record.supersedes.value}${reason}`);
  }

  /*
   * The age is a fact; staleness is an opinion.
   *
   * So the age is spoken whenever there is a date to measure from, and only
   * the "stale" judgement waits for a policy. The first version fell back to
   * printing the raw ISO string when no policy had an opinion, which reads
   * aloud as "dated two thousand and twenty-six dash oh eight" — worse than
   * saying nothing.
   */
  const at = record.observedAt ?? record.recordedAt;
  if (now && at) {
    const elapsed = Date.parse(now) - Date.parse(at);
    if (Number.isFinite(elapsed) && elapsed >= 0) {
      const verb = record.observedAt ? "observed" : "recorded";
      const judged = staleness(record, now, policy);
      parts.push(
        `${verb} ${describeAgeShort(elapsed)} ago${judged.state === "stale" ? ", stale" : ""}`,
      );
    }
  }

  // Last, because it is the clause that decides whether to act.
  if (record.source === "ai-extracted") {
    parts.push(
      record.confirmed
        ? record.confirmedBy
          ? `confirmed by ${record.confirmedBy.display}`
          : "confirmed by a clinician"
        : "not reviewed by a human",
    );
  }

  return `${parts.join(", ")}.`;
}

/* ------------------------------------------------------------------ */
/* The ledger                                                          */
/* ------------------------------------------------------------------ */

/**
 * Provenance keyed by resource id and version.
 *
 * Components never fetch their own: a chart with two hundred values would make
 * two hundred requests, and the chips would each render at a different moment.
 * The host subscribes once and passes the ledger down, so every chip on a
 * screen is describing the same snapshot.
 */
export interface ProvenanceLedger {
  get(resourceId: string, versionId?: string): ProvenanceRecord | undefined;
}

/** A ledger over a plain record map, for hosts with no streaming source. */
export function ledgerFrom(entries: Record<string, ProvenanceRecord>): ProvenanceLedger {
  return {
    get(resourceId, versionId) {
      // The versioned key first: an amended value and its original are two
      // provenances, and falling straight through to the unversioned one would
      // describe the wrong version of the fact.
      return (versionId ? entries[`${resourceId}@${versionId}`] : undefined) ?? entries[resourceId];
    },
  };
}

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

interface FhirConcept {
  coding?: Array<{ system?: string; code?: string; display?: string }>;
  text?: string;
}

interface FhirProvenanceResource {
  recorded?: string;
  occurredDateTime?: string;
  activity?: FhirConcept;
  agent?: Array<{
    type?: FhirConcept;
    who?: { display?: string; reference?: string };
    onBehalfOf?: { display?: string };
  }>;
  entity?: Array<{ role?: string; what?: { display?: string; reference?: string } }>;
}

/**
 * `Provenance.agent[].type` onto the six classes.
 *
 * The R4 participation-type value set does not distinguish an extraction from
 * an authorship, so `assembler` and `composer` become `ai-extracted` only when
 * the activity says so. Guessing from the agent alone would label every
 * transcription as a model output.
 */
export function toSource(resource: FhirProvenanceResource): ProvenanceSource {
  const activity = resource.activity?.coding?.[0]?.code ?? resource.activity?.text;
  if (activity === "UPDATE" || activity === "amend") return "amended";

  const types = (resource.agent ?? []).map((a) => a.type?.coding?.[0]?.code ?? a.type?.text);

  if (types.includes("assembler") && activity === "derive") return "ai-extracted";
  if (types.includes("informant")) return "patient-reported";
  if (types.includes("custodian") || types.includes("transmitter")) return "external";
  if (types.includes("device")) return "device";
  return "clinic";
}

/**
 * A FHIR `Provenance` as a `ProvenanceRecord`.
 *
 * `occurredDateTime` becomes `observedAt` and `recorded` becomes `recordedAt`,
 * separately and never merged — the gap between them is the fact this
 * component exists to render.
 */
export function fromProvenance(resource: FhirProvenanceResource): ProvenanceRecord {
  const record: ProvenanceRecord = { source: toSource(resource) };

  if (resource.occurredDateTime) record.observedAt = resource.occurredDateTime;
  if (resource.recorded) record.recordedAt = resource.recorded;

  const author = (resource.agent ?? []).find(
    (a) => (a.type?.coding?.[0]?.code ?? a.type?.text) === "author",
  );
  const performer = author ?? resource.agent?.[0];
  if (performer?.who?.display) record.performer = { display: performer.who.display };
  if (performer?.onBehalfOf?.display) record.organisation = performer.onBehalfOf.display;

  const source = (resource.entity ?? []).find((e) => e.role === "source");
  if (source?.what?.display) record.document = source.what.display;

  return record;
}

/**
 * FHIR resources, read into timeline events.
 *
 * Pure functions over resources the caller already has. No fetching, no
 * `$everything` call, no assumption about a server — the component takes data
 * and the application gets it, which is the same line Consult holds.
 *
 * The one thing this module will not do is drop a resource quietly.
 * `toTimelineEvents` returns what it could not map, by type and by count, and
 * that number flows into `coverage.hidden`. An adapter that silently discards
 * six resources it does not understand has told the same lie the component
 * exists to prevent — one layer further down, where nobody will look for it.
 *
 * Three mappings are worth reading before changing them.
 *
 *   1. `entered-in-error` maps straight through on every resource that has it.
 *      It is never filtered, because retaining and marking is what the record's
 *      own rules require and filtering is what every implementation reaches
 *      for.
 *   2. An `Appointment` that is still `booked` after its start time, with no
 *      `Encounter` referring to it, becomes **lapsed** — which is how a no-show
 *      stops being silence. Deriving it needs the encounters too, so
 *      `toTimelineEvents` does it across the whole set rather than per
 *      resource.
 *   3. `Provenance` is not an event. It is read for `recorded` and the agent on
 *      the resources it points at, which is what makes a note written six days
 *      after the visit visible as one.
 */

import type {
  Appointment,
  Bundle,
  CodeableConcept,
  Communication,
  Condition,
  Consent,
  DiagnosticReport,
  DocumentReference,
  Encounter,
  Immunization,
  MedicationRequest,
  Observation,
  Procedure,
  Provenance,
  QuestionnaireResponse,
  Reference,
  Resource,
  Task,
} from "@zoblocks/fhir";
import {
  codeableText,
  formatObservationValue,
  isCritical,
  getInterpretation,
  medicationName,
} from "@zoblocks/fhir";
import type { Party, TimelineEvent, TimelineStatus } from "@/lib/timeline-core";

/* ------------------------------------------------------------------ */
/* Shared reads                                                        */
/* ------------------------------------------------------------------ */

/**
 * A FHIR status word, in this component's vocabulary.
 *
 * Deliberately narrow. Anything not named here becomes `unknown`, which the
 * component states in words, rather than `occurred`, which would assert
 * something the source did not.
 */
const STATUS_MAP: Readonly<Record<string, TimelineStatus>> = {
  planned: "planned",
  booked: "planned",
  proposed: "planned",
  pending: "planned",
  draft: "planned",
  requested: "planned",
  ready: "planned",
  arrived: "in-progress",
  triaged: "in-progress",
  "in-progress": "in-progress",
  onleave: "in-progress",
  "on-hold": "in-progress",
  accepted: "in-progress",
  received: "in-progress",
  preparation: "in-progress",
  registered: "in-progress",
  partial: "in-progress",
  preliminary: "in-progress",
  finished: "occurred",
  completed: "occurred",
  final: "occurred",
  active: "occurred",
  fulfilled: "occurred",
  cancelled: "cancelled",
  noshow: "not-done",
  "not-done": "not-done",
  rejected: "not-done",
  failed: "not-done",
  stopped: "not-done",
  declined: "not-done",
  amended: "amended",
  appended: "amended",
  corrected: "corrected",
  "entered-in-error": "in-error",
  unknown: "unknown",
};

function statusOf(value: string | undefined): TimelineStatus {
  if (!value) return "unknown";
  return STATUS_MAP[value] ?? "unknown";
}

function partyOf(reference: Reference | undefined, role?: string): Party | undefined {
  const name = reference?.display?.trim();
  if (!name) return undefined;
  return role ? { name, role } : { name };
}

function textOf(concept: CodeableConcept | undefined, fallback: string): string {
  return codeableText(concept)?.trim() || fallback;
}

function idOf(resource: Resource, prefix: string): string {
  return `${prefix}:${resource.id ?? Math.abs(hash(JSON.stringify(resource))).toString(36)}`;
}

/**
 * A stable id for a resource that arrived without one.
 *
 * Stable matters more than unique here: an id that changes between renders
 * breaks the tie-break in `compareByTime`, and two renders of the same chart
 * would disagree about the order of same-second records.
 */
function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* One resource at a time                                              */
/* ------------------------------------------------------------------ */

export function encounterToEvent(resource: Encounter): TimelineEvent | undefined {
  const occurred = resource.period?.start;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "encounter"),
    kind: "encounter",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.type?.[0], "Encounter"),
    actor:
      partyOf(resource.participant?.[0]?.individual) ??
      partyOf(resource.serviceProvider, "Organisation"),
  };
}

export function appointmentToEvent(resource: Appointment): TimelineEvent | undefined {
  const occurred = resource.start;
  if (!occurred) return undefined;
  // `noshow` is FHIR's own word and it is a conclusion somebody recorded. What
  // the component must not do is *derive* one — that is the lapsed state, and
  // it says only that nothing was recorded.
  return {
    id: idOf(resource, "appointment"),
    kind: "appointment",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.appointmentType ?? resource.serviceType?.[0], "Appointment"),
    detail: resource.description,
    actor: partyOf(resource.participant?.[0]?.actor),
  };
}

export function communicationToEvent(resource: Communication): TimelineEvent | undefined {
  const occurred = resource.sent ?? resource.received;
  if (!occurred) return undefined;
  const medium = codeableText(resource.medium?.[0])?.toLowerCase() ?? "";
  return {
    id: idOf(resource, "communication"),
    kind: medium.includes("phone") || medium.includes("telephone") ? "call" : "message",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.topic ?? resource.category?.[0], "Contact"),
    detail: resource.payload?.[0]?.contentString,
    actor: partyOf(resource.sender),
    recipient: partyOf(resource.recipient?.[0]),
  };
}

export function observationToEvent(resource: Observation): TimelineEvent | undefined {
  const occurred = resource.effectiveDateTime;
  if (!occurred) return undefined;
  const name = textOf(resource.code, "Observation");
  const value = formatObservationValue(resource);
  const interpretation = getInterpretation(resource);
  const laboratory = (resource.category ?? []).some((category) =>
    (codeableText(category) ?? "").toLowerCase().includes("lab"),
  );

  const base = {
    id: idOf(resource, "observation"),
    kind: laboratory ? ("laboratory" as const) : ("observation" as const),
    occurred,
    status: statusOf(resource.status),
    title: value ? `${name} — ${value}` : name,
    actor: partyOf(resource.performer?.[0]),
  };

  // Severity travels with a status word or not at all, so the interpretation
  // has to arrive as both or neither.
  if (isCritical(interpretation)) {
    return { ...base, severity: "critical", severityStatus: value ?? "Critical" };
  }
  return base;
}

export function reportToEvent(resource: DiagnosticReport): TimelineEvent | undefined {
  const occurred = resource.effectiveDateTime ?? resource.effectivePeriod?.start ?? resource.issued;
  if (!occurred) return undefined;
  const imaging = (resource.category ?? []).some((category) =>
    /imaging|radiology|rad\b/i.test(codeableText(category) ?? ""),
  );
  return {
    id: idOf(resource, "report"),
    kind: imaging ? "imaging" : "laboratory",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.code, "Diagnostic report"),
    detail: resource.conclusion,
    actor: partyOf(resource.performer?.[0]),
  };
}

export function procedureToEvent(resource: Procedure): TimelineEvent | undefined {
  const occurred = resource.performedDateTime ?? resource.performedPeriod?.start;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "procedure"),
    kind: "procedure",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.code, "Procedure"),
    detail: codeableText(resource.statusReason),
    actor: partyOf(resource.performer?.[0]?.actor),
  };
}

export function medicationToEvent(resource: MedicationRequest): TimelineEvent | undefined {
  const occurred = resource.authoredOn;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "medication"),
    kind: "medication",
    occurred,
    status: statusOf(resource.status),
    title: medicationName(resource) ?? "Medication",
    actor: partyOf(resource.requester),
  };
}

export function immunizationToEvent(resource: Immunization): TimelineEvent | undefined {
  const occurred = resource.occurrenceDateTime;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "immunization"),
    kind: "immunization",
    occurred,
    recorded: resource.recorded,
    status: statusOf(resource.status),
    title: textOf(resource.vaccineCode, "Immunisation"),
    detail: codeableText(resource.statusReason),
    // primarySource false means somebody reported it rather than administered
    // it here, which is a different kind of fact about the same dose.
    register: resource.primarySource === false ? "patient-reported" : undefined,
  };
}

export function documentToEvent(resource: DocumentReference): TimelineEvent | undefined {
  const occurred = resource.date;
  if (!occurred) return undefined;
  const note = /note|summary|letter/i.test(codeableText(resource.type) ?? "");
  return {
    id: idOf(resource, "document"),
    kind: note ? "note" : "document",
    occurred,
    status: statusOf(resource.docStatus ?? resource.status),
    title: textOf(resource.type, resource.description ?? "Document"),
    actor: partyOf(resource.author?.[0]),
  };
}

export function questionnaireToEvent(resource: QuestionnaireResponse): TimelineEvent | undefined {
  const occurred = resource.authored;
  if (!occurred) return undefined;
  const status = statusOf(resource.status);
  return {
    id: idOf(resource, "questionnaire"),
    kind: "questionnaire",
    occurred,
    status,
    title: resource.questionnaire ?? "Questionnaire",
    // in-progress is the form that was sent and never came back. Rendering it
    // as a completed one is how an unreturned intake form disappears.
    steps:
      status === "in-progress"
        ? [
            { label: "Sent", at: occurred, state: "done" },
            { label: "Not yet returned", state: "open" },
          ]
        : undefined,
    actor: partyOf(resource.author) ?? partyOf(resource.source),
  };
}

export function consentToEvent(resource: Consent): TimelineEvent | undefined {
  const occurred = resource.dateTime;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "consent"),
    kind: "consent",
    occurred,
    status: statusOf(resource.status),
    title: textOf(resource.scope ?? resource.category?.[0], "Consent"),
  };
}

export function taskToEvent(resource: Task): TimelineEvent | undefined {
  const occurred = resource.authoredOn;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "task"),
    kind: "task",
    occurred,
    recorded: resource.lastModified,
    status: statusOf(resource.status),
    title: textOf(resource.code, resource.description ?? "Task"),
    actor: partyOf(resource.requester),
    recipient: partyOf(resource.owner),
  };
}

export function conditionToEvent(resource: Condition): TimelineEvent | undefined {
  const occurred = resource.onsetDateTime ?? resource.recordedDate;
  if (!occurred) return undefined;
  return {
    id: idOf(resource, "condition"),
    kind: "condition",
    occurred,
    recorded: resource.recordedDate,
    status: statusOf(resource.verificationStatus?.coding?.[0]?.code),
    title: textOf(resource.code, "Condition"),
  };
}

/* ------------------------------------------------------------------ */
/* A whole bundle                                                      */
/* ------------------------------------------------------------------ */

const ADAPTERS: Record<string, (resource: never) => TimelineEvent | undefined> = {
  Encounter: encounterToEvent as (resource: never) => TimelineEvent | undefined,
  Appointment: appointmentToEvent as (resource: never) => TimelineEvent | undefined,
  Communication: communicationToEvent as (resource: never) => TimelineEvent | undefined,
  Observation: observationToEvent as (resource: never) => TimelineEvent | undefined,
  DiagnosticReport: reportToEvent as (resource: never) => TimelineEvent | undefined,
  Procedure: procedureToEvent as (resource: never) => TimelineEvent | undefined,
  MedicationRequest: medicationToEvent as (resource: never) => TimelineEvent | undefined,
  Immunization: immunizationToEvent as (resource: never) => TimelineEvent | undefined,
  DocumentReference: documentToEvent as (resource: never) => TimelineEvent | undefined,
  QuestionnaireResponse: questionnaireToEvent as (resource: never) => TimelineEvent | undefined,
  Consent: consentToEvent as (resource: never) => TimelineEvent | undefined,
  Task: taskToEvent as (resource: never) => TimelineEvent | undefined,
  Condition: conditionToEvent as (resource: never) => TimelineEvent | undefined,
};

/** Resource types this module reads. Named so a caller can check before querying. */
export const TIMELINE_RESOURCE_TYPES: readonly string[] = Object.keys(ADAPTERS);

export interface ToTimelineEventsResult {
  events: TimelineEvent[];
  /**
   * What could not be turned into an event, by resource type.
   *
   * Feed this into `coverage.hidden` as an `unmapped` entry. A silent drop here
   * is a coverage lie one layer down.
   */
  unmapped: { type: string; count: number }[];
}

export interface ToTimelineEventsOptions {
  /**
   * Used to derive `lapsed`: a booked appointment whose start has passed with
   * no encounter recorded against it. Supplied by the caller, like everywhere
   * else in this component.
   */
  now?: string;
  /** Attached to every event produced, so the coverage sentence can name it. */
  source?: string;
  /**
   * Read for `recorded` and the responsible agent on the resources they point
   * at. Provenance is not itself an event.
   */
  provenance?: readonly Provenance[];
  /** `AuditEvent`-style read history is off unless asked for. */
  includeSystem?: boolean;
}

function resourcesOf(input: Bundle | readonly Resource[]): Resource[] {
  if (Array.isArray(input)) return [...input];
  const bundle = input as Bundle;
  return (bundle.entry ?? []).flatMap((entry) => (entry.resource ? [entry.resource] : []));
}

/**
 * A bundle in, a timeline out — and an honest account of what did not fit.
 */
export function toTimelineEvents(
  input: Bundle | readonly Resource[],
  options: ToTimelineEventsOptions = {},
): ToTimelineEventsResult {
  const resources = resourcesOf(input);
  const events: TimelineEvent[] = [];
  const unmapped = new Map<string, number>();

  for (const resource of resources) {
    const type = resource.resourceType;
    if (!type) continue;
    if (type === "Provenance") continue;

    const adapter = ADAPTERS[type];
    if (!adapter) {
      unmapped.set(type, (unmapped.get(type) ?? 0) + 1);
      continue;
    }

    const event = adapter(resource as never);
    if (!event) {
      // A resource of a type we understand, with no date we can read. It is
      // still a record, and dropping it silently is the thing this function
      // refuses to do.
      unmapped.set(type, (unmapped.get(type) ?? 0) + 1);
      continue;
    }
    events.push(options.source ? { ...event, source: options.source } : event);
  }

  applyProvenance(events, options.provenance);
  markLapsedAppointments(events, resources, options.now);

  return {
    events,
    unmapped: [...unmapped.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type)),
  };
}

/**
 * `recorded` from Provenance, which is what makes a late entry visible.
 *
 * A note written six days after the visit it describes is a different document,
 * evidentially, from one written that afternoon — and every retrospective chart
 * review turns on that gap.
 */
function applyProvenance(events: TimelineEvent[], provenance: readonly Provenance[] | undefined) {
  if (!provenance || provenance.length === 0) return;

  const byTarget = new Map<string, Provenance>();
  for (const record of provenance) {
    for (const target of record.target ?? []) {
      const reference = target.reference;
      if (reference) byTarget.set(reference, record);
    }
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event) continue;
    const [, id] = event.id.split(":");
    const match =
      byTarget.get(event.id) ??
      [...byTarget.entries()].find(([reference]) => id && reference.endsWith(`/${id}`))?.[1];
    if (!match?.recorded) continue;
    events[index] = {
      ...event,
      recorded: match.recorded,
      actor: event.actor ?? partyOf(match.agent?.[0]?.who),
    };
  }
}

/**
 * Booked, the time has passed, and nothing was recorded against it.
 *
 * The one derivation in this module, and it is deliberately conservative: it
 * produces `lapsed`, which the component renders as "no encounter has been
 * recorded against it". It does not produce "missed" or "no-show", because the
 * record cannot support either sentence.
 */
function markLapsedAppointments(
  events: TimelineEvent[],
  resources: readonly Resource[],
  now: string | undefined,
) {
  if (!now) return;

  const claimed = new Set<string>();
  for (const resource of resources) {
    if (resource.resourceType !== "Encounter") continue;
    for (const reference of (resource as Encounter).appointment ?? []) {
      const value = reference.reference;
      if (value) claimed.add(value.split("/").pop() as string);
    }
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || event.kind !== "appointment" || event.status !== "planned") continue;
    const id = event.id.split(":")[1];
    if (id && claimed.has(id)) {
      events[index] = { ...event, status: "occurred" };
    }
    // Everything else stays `planned`; the component derives `lapsed` from its
    // own `now`, so the two cannot disagree about what time it is.
  }
}

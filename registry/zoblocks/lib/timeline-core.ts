/**
 * timeline-core — everything a chronology has to get right before it renders.
 *
 * Nothing here touches React or the DOM. It is the part a customer must not
 * rewrite when they replace our visual language, because it is where the
 * safety rules live rather than the styling.
 *
 * Four ideas carry the file.
 *
 *   1. **A timeline is a claim about completeness.** A chronological list is
 *      read as an *account*, and an account is understood to be continuous —
 *      so a gap becomes a fact. But the list on screen is nearly always a
 *      slice: paginated, filtered, and assembled from sources that fail
 *      independently. `TimelineCoverage` is what makes the slice say so, and
 *      `describeCoverage` turns it into the sentence that gets rendered and
 *      printed.
 *
 *   2. **Planned is not happened.** FHIR draws this line — `Appointment`
 *      records a planned activity, `Encounter` an actual one — and every
 *      timeline in the field erases it. `resolveStatus` derives `planned` and
 *      `lapsed` from a caller-supplied `now`, never the wall clock, so the
 *      output is deterministic and visually regression-testable.
 *
 *   3. **Time is compared and rendered at the precision the record holds.** A
 *      FHIR `2019` means 2019. Parsing it into a `Date` invents a January, a
 *      first, a midnight and a zone, none of which anybody recorded.
 *
 *   4. **Collapsing may not hide.** Clustering forty routine observations into
 *      one row is necessary at chart scale. Letting the one critical potassium
 *      go into that row is the defect clustering invents, so anything a reader
 *      would act on is promoted out before a cluster forms.
 *
 * Styling lives in `styles/zoblocks-timeline.css`, installed alongside this file.
 */

import type { AccessDescriptor } from "@/lib/zoblocks-accordion";

/* ------------------------------------------------------------------ */
/* Vocabulary                                                          */
/* ------------------------------------------------------------------ */

/**
 * Which stream an event belongs to.
 *
 * An SMS reminder and a creatinine of 3.2 are not the same kind of fact. At
 * five events an undifferentiated list reads as a rich account; at two hundred
 * it buries the encounter note under sixty automated reminders, and the
 * clinician stops reading the timeline at all.
 */
export type TimelineRegister =
  "clinical" | "administrative" | "communication" | "patient-reported" | "system";

export const TIMELINE_REGISTERS: readonly TimelineRegister[] = [
  "clinical",
  "administrative",
  "communication",
  "patient-reported",
  "system",
];

/**
 * What sort of thing happened.
 *
 * Closed, so a kind can be filtered, counted, translated and iconed. `other`
 * is the escape hatch and it costs a `typeLabel` — an unlabelled unknown is a
 * build error rather than a blank chip.
 */
export type TimelineKind =
  | "encounter"
  | "observation"
  | "laboratory"
  | "imaging"
  | "procedure"
  | "medication"
  | "immunization"
  | "condition"
  | "allergy"
  | "note"
  | "document"
  | "care-plan"
  | "questionnaire"
  | "appointment"
  | "referral"
  | "task"
  | "coverage"
  | "consent"
  | "message"
  | "call"
  | "access"
  | "other";

/**
 * The register each kind belongs to unless the caller says otherwise.
 *
 * A default rather than a law: a questionnaire completed by a nurse is
 * clinical, and the caller knows which one it was.
 */
export const KIND_REGISTER: Readonly<Record<TimelineKind, TimelineRegister>> = {
  encounter: "clinical",
  observation: "clinical",
  laboratory: "clinical",
  imaging: "clinical",
  procedure: "clinical",
  medication: "clinical",
  immunization: "clinical",
  condition: "clinical",
  allergy: "clinical",
  note: "clinical",
  document: "clinical",
  "care-plan": "clinical",
  questionnaire: "patient-reported",
  appointment: "administrative",
  referral: "administrative",
  task: "administrative",
  coverage: "administrative",
  consent: "administrative",
  message: "communication",
  call: "communication",
  access: "system",
  other: "administrative",
};

/**
 * What became of it.
 *
 * `lapsed` and `not-done` are the two this vocabulary exists for. A planned
 * event whose time has passed with nothing recorded against it is how a
 * no-show becomes visible instead of becoming silence; an attempt that did not
 * connect is not a contact, and a practice-management timeline is mostly
 * attempts.
 */
export type TimelineStatus =
  | "occurred"
  | "in-progress"
  | "planned"
  | "lapsed"
  | "cancelled"
  | "not-done"
  | "amended"
  | "corrected"
  | "in-error"
  | "unknown";

export const TIMELINE_STATUSES: readonly TimelineStatus[] = [
  "occurred",
  "in-progress",
  "planned",
  "lapsed",
  "cancelled",
  "not-done",
  "amended",
  "corrected",
  "in-error",
  "unknown",
];

/** Shared with Accordion so one severity scale spans the library. */
export type TimelineSeverity = "critical" | "high" | "low" | "normal" | "unknown";

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

/**
 * A FHIR `date`, `dateTime` or `instant`, as the record spells it.
 *
 * A string rather than a `Date`, deliberately and everywhere. The record's own
 * precision is part of its meaning and a `Date` cannot hold it.
 */
export type FhirDateTime = string;

export type TimePrecision = "year" | "month" | "day" | "minute" | "second";

const YEAR = /^(\d{4})$/;
const MONTH = /^(\d{4})-(\d{2})$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const STAMP =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * How precisely the record knows this time.
 *
 * `undefined` for a value this module cannot read, which is a state the caller
 * has to render rather than one we may quietly treat as absent.
 */
export function precisionOf(value: string | undefined): TimePrecision | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (YEAR.test(trimmed)) return "year";
  if (MONTH.test(trimmed)) return "month";
  if (DAY.test(trimmed)) return "day";
  const stamp = STAMP.exec(trimmed);
  if (stamp) return stamp[6] ? "second" : "minute";
  return undefined;
}

/**
 * The earliest instant the value can denote, in epoch milliseconds.
 *
 * Ordering has to be total, and two values of different precision can overlap
 * — `2019` contains `2019-06-04`. Using the lower bound makes the comparison
 * deterministic; `compareByTime` then breaks the resulting tie on precision and
 * identity rather than on input order, so two renders never disagree.
 *
 * A value with no zone is read as UTC. That is a choice, not an oversight: the
 * alternative is reading it in the *viewer's* zone, which makes the same record
 * sort differently in Chennai and Chicago.
 */
export function instantOf(value: string | undefined): number {
  if (!value) return Number.NaN;
  const trimmed = value.trim();

  const year = YEAR.exec(trimmed);
  if (year) return Date.UTC(Number(year[1]), 0, 1);

  const month = MONTH.exec(trimmed);
  if (month) return Date.UTC(Number(month[1]), Number(month[2]) - 1, 1);

  const day = DAY.exec(trimmed);
  if (day) return Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]));

  const stamp = STAMP.exec(trimmed);
  if (!stamp) return Number.NaN;
  if (stamp[7]) return new Date(trimmed.replace(" ", "T")).getTime();
  return Date.UTC(
    Number(stamp[1]),
    Number(stamp[2]) - 1,
    Number(stamp[3]),
    Number(stamp[4]),
    Number(stamp[5]),
    stamp[6] ? Number(stamp[6]) : 0,
  );
}

const PRECISION_RANK: Readonly<Record<TimePrecision, number>> = {
  year: 0,
  month: 1,
  day: 2,
  minute: 3,
  second: 4,
};

/**
 * An ISO 8601 duration, restricted to what a timeline needs: `P3D`, `PT4H`,
 * `P1M`. Returns milliseconds, or `undefined` for anything unreadable.
 *
 * Months and years are nominal — 30 and 365 days. Good enough for "cluster
 * events within a month of each other" and stated here so nobody later
 * discovers it in a diff.
 */
export function parseDuration(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value.trim(),
  );
  if (!match || match.slice(1).every((part) => part === undefined)) return undefined;
  const n = (index: number) => (match[index] ? Number(match[index]) : 0);
  return (
    n(1) * 365 * 86_400_000 +
    n(2) * 30 * 86_400_000 +
    n(3) * 86_400_000 +
    n(4) * 3_600_000 +
    n(5) * 60_000 +
    n(6) * 1000
  );
}

/* ------------------------------------------------------------------ */
/* The event                                                           */
/* ------------------------------------------------------------------ */

/** Who did it, who it was to, whose record it is. Three roles, three fields. */
export interface Party {
  name: string;
  /** "Endocrinology", "Front desk". Rendered beside the name, never instead of it. */
  role?: string;
  organization?: string;
}

/** One move inside a workflow that spans days. */
export interface TimelineStep {
  label: string;
  at?: FhirDateTime;
  /** `open` is the one that matters: a form returned and never reviewed. */
  state: "done" | "open" | "not-done";
}

/** What changed, and when. An amendment with no delta is a rumour. */
export interface TimelineRevision {
  at: FhirDateTime;
  by?: Party;
  /** The previous value, as it was recorded. */
  was?: string;
  reason?: string;
}

/** Where an event came from, matched by id to a `TimelineSource`. */
export interface TimelineEventBase {
  id: string;
  kind: TimelineKind;
  /** Required alongside `kind: "other"`. Enforced in `TimelineEvent`. */
  typeLabel?: string;
  /** Defaults to `KIND_REGISTER[kind]`. */
  register?: TimelineRegister;

  /** When it happened, at the precision the record holds. */
  occurred: FhirDateTime;
  /** When it entered the record, when that is a different fact. */
  recorded?: FhirDateTime;

  /** A noun phrase. Never a sentence with the actor inside it. */
  title: string;
  detail?: string;

  status?: TimelineStatus;
  revision?: TimelineRevision;

  actor?: Party;
  recipient?: Party;
  subject?: Party;

  /** Matches `TimelineSource.id`. */
  source?: string;

  /** Exists, and this reader may not read it. Accordion's vocabulary, unchanged. */
  access?: AccessDescriptor;

  steps?: readonly TimelineStep[];
  href?: string;
}

/**
 * Severity travels with a status word or not at all.
 *
 * Enforced in the type rather than at runtime, so the omission is a build
 * failure at the call site instead of a coloured dot with nothing beside it —
 * a signal forced-colors mode discards, monochrome printing discards, and
 * roughly one in twelve men cannot resolve.
 */
export type TimelineEvent =
  | (TimelineEventBase & { severity: TimelineSeverity; severityStatus: string })
  | (TimelineEventBase & { severity?: undefined; severityStatus?: undefined });

/**
 * `kind: "other"` without a label is a blank chip.
 *
 * This is the type the component's `events` prop accepts, so the omission is a
 * build failure at the call site rather than an unlabelled node in a chart. The
 * escape hatch stays open; it just costs a word.
 */
export type TypedTimelineEvent = TimelineEvent &
  ({ kind: Exclude<TimelineKind, "other"> } | { kind: "other"; typeLabel: string });

/**
 * Split rows by register, for the two-column layout.
 *
 * Which side an event is on *is* its register — the one alternating timeline
 * that alternates on a fact rather than to fill space. A cluster or a gap goes
 * to the side its own register belongs to, and a gap has none, so it stays with
 * the clinical column where the reader is looking.
 */
export function splitByRegister(rows: readonly TimelineRow[]): {
  clinical: TimelineRow[];
  other: TimelineRow[];
} {
  const clinical: TimelineRow[] = [];
  const other: TimelineRow[] = [];
  for (const row of rows) {
    const register =
      row.type === "event"
        ? row.resolved.register
        : row.type === "cluster"
          ? row.register
          : "clinical";
    (register === "clinical" ? clinical : other).push(row);
  }
  return { clinical, other };
}

export function registerOf(event: TimelineEventBase): TimelineRegister {
  return event.register ?? KIND_REGISTER[event.kind];
}

/** The words a reader sees for an event whose kind is not in the vocabulary. */
export function typeLabelOf(event: TimelineEventBase, locale: TimelineLocale): string {
  if (event.kind === "other") return event.typeLabel ?? locale.kindOther;
  return locale.kind[event.kind];
}

/* ------------------------------------------------------------------ */
/* Coverage — the claim                                                */
/* ------------------------------------------------------------------ */

export type SourceStatus = "ok" | "partial" | "unavailable" | "excluded";

export interface TimelineSource {
  id: string;
  label: string;
  status: SourceStatus;
  /** Required by `validateCoverage` when status is not `ok`. A failure with no reason is a shrug. */
  detail?: string;
  window?: { from?: FhirDateTime; to?: FhirDateTime };
}

export type HiddenReason = "filter" | "page" | "access" | "unmapped";

export interface HiddenCount {
  reason: HiddenReason;
  count: number;
  /** The filter's own words, so the reader can undo it. */
  label?: string;
}

/** A stretch of time this timeline cannot speak for. Renders as a dashed rail. */
export interface CoverageGap {
  from?: FhirDateTime;
  to?: FhirDateTime;
  reason: string;
}

/**
 * What this timeline is a view of.
 *
 * Required on the component, and there is no default, because every plausible
 * default is a claim the caller did not make.
 */
export interface TimelineCoverage {
  window?: { from?: FhirDateTime; to?: FhirDateTime };
  /** Non-empty by construction: a timeline assembled from nothing is not a timeline. */
  sources: readonly [TimelineSource, ...TimelineSource[]];
  /** How many events match the query, when the server said. */
  total?: number;
  hidden?: readonly HiddenCount[];
  gaps?: readonly CoverageGap[];
  order: "newest-first" | "oldest-first";
}

/**
 * Problems a coverage claim can have that the type system cannot catch.
 *
 * Returned rather than thrown. A component that throws on a malformed payload
 * takes the chart down with it, and this repository forbids both throwing and
 * logging in component source — so the caller gets the list and the component
 * renders a blocking state.
 */
export function validateCoverage(coverage: TimelineCoverage): string[] {
  const problems: string[] = [];
  if (coverage.sources.length === 0) {
    problems.push("coverage.sources is empty — name at least the system this data came from");
  }
  for (const source of coverage.sources) {
    if (source.status !== "ok" && !source.detail?.trim()) {
      problems.push(
        `source "${source.label}" is ${source.status} with no detail — say what happened, or the reader learns only that something did`,
      );
    }
  }
  for (const hidden of coverage.hidden ?? []) {
    if (hidden.count < 0) problems.push("a hidden count cannot be negative");
  }
  if (typeof coverage.total === "number" && coverage.total < 0) {
    problems.push("coverage.total cannot be negative");
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Status resolution                                                   */
/* ------------------------------------------------------------------ */

export interface ResolvedEvent {
  event: TimelineEvent;
  /** The status after `planned` and `lapsed` are derived against `now`. */
  status: TimelineStatus;
  register: TimelineRegister;
  /** Epoch ms of the earliest instant `occurred` can denote. */
  at: number;
  precision: TimePrecision | undefined;
  /** After `now`. Renders above the now marker. */
  future: boolean;
  /** After `seenThrough`. Drives the "new since you last looked" divider. */
  isNew: boolean;
  /** Milliseconds between `occurred` and `recorded`, when both are readable and the gap is worth stating. */
  lateBy?: number;
  /** Never collapsed into a cluster. */
  protectedFromClustering: boolean;
}

/**
 * A planned event whose time has passed with nothing recorded against it.
 *
 * Derived, never written back. The component says what is *not* known —
 * "scheduled, and no encounter has been recorded against it" — rather than
 * "missed", because the record cannot support the second sentence.
 */
export function resolveStatus(event: TimelineEvent, nowAt: number): TimelineStatus {
  const declared = event.status ?? "occurred";
  if (declared !== "planned") return declared;
  return instantOf(event.occurred) > nowAt ? "planned" : "lapsed";
}

/** Statuses a reader has to act on, and which therefore never get collapsed. */
const PROTECTED_STATUSES: ReadonlySet<TimelineStatus> = new Set<TimelineStatus>([
  "lapsed",
  "cancelled",
  "not-done",
  "in-error",
  "amended",
  "corrected",
]);

function isProtected(event: TimelineEvent, status: TimelineStatus): boolean {
  if (event.severity === "critical" || event.severity === "high") return true;
  if (PROTECTED_STATUSES.has(status)) return true;
  if (event.access && event.access.kind !== "open") return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Ordering                                                            */
/* ------------------------------------------------------------------ */

/**
 * A total order over events, stable across renders.
 *
 * Bulk-imported records routinely share an instant to the second. Falling back
 * to input order there would mean the same data renders in two orders in two
 * sessions, so ties break on precision — the coarser value is the wider period
 * and sorts first — and then on `id`, which is stable by definition.
 *
 * Exported because a caller sorting server-side has to sort the same way.
 */
export function compareByTime(
  a: ResolvedEvent,
  b: ResolvedEvent,
  order: TimelineCoverage["order"] = "newest-first",
): number {
  const direction = order === "newest-first" ? -1 : 1;

  const aAt = Number.isNaN(a.at) ? Number.POSITIVE_INFINITY : a.at;
  const bAt = Number.isNaN(b.at) ? Number.POSITIVE_INFINITY : b.at;
  if (aAt !== bAt) return (aAt - bAt) * direction;

  const aRank = a.precision ? PRECISION_RANK[a.precision] : -1;
  const bRank = b.precision ? PRECISION_RANK[b.precision] : -1;
  if (aRank !== bRank) return aRank - bRank;

  return a.event.id < b.event.id ? -1 : a.event.id > b.event.id ? 1 : 0;
}

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

export type GroupBy = "auto" | "month" | "quarter" | "year" | "none";

const MONTH_MS = 30 * 86_400_000;

/**
 * A fourteen-month history groups by month; a fourteen-year one by year.
 *
 * Chosen from the span rather than hardcoded, because a component that always
 * groups by month turns a decade into a hundred and twenty headings.
 */
export function chooseGrouping(spanMs: number): Exclude<GroupBy, "auto" | "none"> {
  if (spanMs <= 18 * MONTH_MS) return "month";
  if (spanMs <= 5 * 12 * MONTH_MS) return "quarter";
  return "year";
}

/**
 * The bucket a value may go in, given how precisely the record knows it.
 *
 * A FHIR `2019` grouped under a month header renders as "January 2019" — which
 * invents a January in exactly the place the component refuses to invent one on
 * the event itself. So the grouping is coarsened to the value's own precision:
 * a year-only date gets a year bucket, whatever the caller asked for, and the
 * header says what the record says.
 */
function bucketFor(
  precision: TimePrecision | undefined,
  by: Exclude<GroupBy, "auto" | "none">,
): Exclude<GroupBy, "auto" | "none"> {
  if (precision === "year") return "year";
  if (precision === "month" && by === "quarter") return "quarter";
  return by;
}

function groupKeyFor(at: number, by: Exclude<GroupBy, "auto" | "none">): string {
  const date = new Date(at);
  const year = date.getUTCFullYear();
  if (by === "year") return `${year}`;
  if (by === "quarter") return `${year}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  return `${year}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

export interface EventRow {
  type: "event";
  key: string;
  resolved: ResolvedEvent;
}

export interface ClusterRow {
  type: "cluster";
  key: string;
  kind: TimelineKind;
  register: TimelineRegister;
  /** In render order, so `from` is the newest when the order is newest-first. */
  from: FhirDateTime;
  to: FhirDateTime;
  members: readonly ResolvedEvent[];
}

export interface GapRow {
  type: "gap";
  key: string;
  gap: CoverageGap;
}

export type TimelineRow = EventRow | ClusterRow | GapRow;

export interface TimelineSection {
  /** `planned` is always its own section and always precedes the now marker. */
  type: "planned" | "period";
  key: string;
  /** A group key like `2026-08`; the caller formats it. */
  label: string;
  /**
   * Whether this section names a period.
   *
   * False for the single section produced by `group="none"`: a card headed
   * "Planned" and "All" is two headings where the second says nothing, and a
   * heading that says nothing is still a heading in the outline.
   */
  titled: boolean;
  rows: readonly TimelineRow[];
  /** Events in this section, counting cluster members individually. */
  count: number;
}

export interface ClusterOptions {
  /** Only these kinds cluster. Everything else always renders individually. */
  kinds: readonly TimelineKind[];
  /** ISO 8601 duration. Adjacent members must fall within it of each other. */
  within?: string;
  /** Fewer than this many and the cluster is not worth the disclosure. */
  min?: number;
}

export interface BuildTimelineOptions {
  events: readonly TimelineEvent[];
  /** Caller-supplied. Reading the clock here would make every render untestable. */
  now: FhirDateTime;
  coverage: TimelineCoverage;
  group?: GroupBy;
  cluster?: ClusterOptions | false;
  /** What the reader had already seen. Never computed here. */
  seenThrough?: FhirDateTime;
  /** ISO 8601. A recording gap at least this long is worth stating. */
  lateEntryAfter?: string;
  /** Render at most this many events. The remainder is reported, never dropped. */
  limit?: number;
}

export interface TimelineModel {
  sections: readonly TimelineSection[];
  /** Events rendered, counting cluster members individually. */
  shown: number;
  /** Events inside clusters. Shown, but behind one disclosure. */
  clustered: number;
  /** Events `limit` kept off the page. Reported in the coverage sentence. */
  truncated: number;
  /** Events whose `occurred` this module could not read. Rendered, never dropped. */
  undated: number;
  order: TimelineCoverage["order"];
  /** True when at least one event is newer than `seenThrough`. */
  hasNew: boolean;
  /** True when at least one event is in the future relative to `now`. */
  hasPlanned: boolean;
}

/**
 * Sort, group, cluster and place the gaps — in that order, and losing nothing.
 *
 * The invariant the property tests hold this to: for any input,
 * `shown + truncated === events.length`. Three transformations each of which
 * can drop a record without a visible symptom is precisely why that assertion
 * exists rather than a rendering test.
 */
export function buildTimeline(options: BuildTimelineOptions): TimelineModel {
  const {
    events,
    now,
    coverage,
    group = "auto",
    cluster = false,
    seenThrough,
    lateEntryAfter,
    limit,
  } = options;

  const nowAt = instantOf(now);
  const seenAt = seenThrough ? instantOf(seenThrough) : Number.NaN;
  const lateMs = parseDuration(lateEntryAfter);

  const resolved: ResolvedEvent[] = events.map((event) => {
    const status = resolveStatus(event, nowAt);
    const at = instantOf(event.occurred);
    const recordedAt = instantOf(event.recorded);
    const late =
      lateMs !== undefined &&
      !Number.isNaN(at) &&
      !Number.isNaN(recordedAt) &&
      recordedAt - at >= lateMs
        ? recordedAt - at
        : undefined;

    return {
      event,
      status,
      register: registerOf(event),
      at,
      precision: precisionOf(event.occurred),
      future: !Number.isNaN(at) && at > nowAt,
      isNew: !Number.isNaN(seenAt) && !Number.isNaN(at) && at > seenAt,
      lateBy: late,
      protectedFromClustering: isProtected(event, status),
    };
  });

  const undated = resolved.filter((item) => Number.isNaN(item.at)).length;

  resolved.sort((a, b) => compareByTime(a, b, coverage.order));

  // The limit applies to the rendered order, so "showing 5 of 43" is the five
  // the reader would have read first rather than an arbitrary five.
  const kept = typeof limit === "number" && limit >= 0 ? resolved.slice(0, limit) : resolved;
  const truncated = resolved.length - kept.length;

  const placedGaps = placeGaps(kept, coverage.gaps, coverage.order);
  const planned = kept.filter((item) => item.future);
  const past = kept.filter((item) => !item.future);

  const span = spanOf(past);
  const grouping = group === "auto" ? chooseGrouping(span) : group;

  const sections: TimelineSection[] = [];

  if (planned.length > 0) {
    sections.push({
      type: "planned",
      key: "planned",
      label: "planned",
      titled: true,
      rows: withGaps(clusterRows(planned, cluster), placedGaps),
      count: planned.length,
    });
  }

  if (grouping === "none") {
    if (past.length > 0) {
      sections.push({
        type: "period",
        key: "all",
        label: "all",
        titled: false,
        rows: withGaps(clusterRows(past, cluster), placedGaps),
        count: past.length,
      });
    }
  } else {
    let current: ResolvedEvent[] = [];
    let currentKey: string | undefined;
    const flush = () => {
      if (currentKey === undefined || current.length === 0) return;
      sections.push({
        type: "period",
        key: currentKey,
        label: currentKey,
        titled: true,
        rows: withGaps(clusterRows(current, cluster), placedGaps),
        count: current.length,
      });
      current = [];
    };

    for (const item of past) {
      const key = Number.isNaN(item.at)
        ? "undated"
        : groupKeyFor(item.at, bucketFor(item.precision, grouping));
      if (key !== currentKey) {
        flush();
        currentKey = key;
      }
      current.push(item);
    }
    flush();
  }

  return {
    sections,
    shown: kept.length,
    clustered: sections.reduce(
      (total, section) =>
        total +
        section.rows.reduce(
          (rows, row) => rows + (row.type === "cluster" ? row.members.length : 0),
          0,
        ),
      0,
    ),
    truncated,
    undated,
    order: coverage.order,
    hasNew: kept.some((item) => item.isNew),
    hasPlanned: planned.length > 0,
  };
}

function spanOf(items: readonly ResolvedEvent[]): number {
  const dated = items.filter((item) => !Number.isNaN(item.at)).map((item) => item.at);
  if (dated.length < 2) return 0;
  return Math.max(...dated) - Math.min(...dated);
}

/**
 * Collapse runs of the same routine kind, and refuse to collapse anything a
 * reader would act on.
 *
 * The promotion rule is the whole point. A cluster that could contain a
 * critical result is a cluster that has hidden one, and "None critical" on a
 * cluster chip is only honest because reaching this function is the only way a
 * cluster gets made.
 */
function clusterRows(
  items: readonly ResolvedEvent[],
  options: ClusterOptions | false,
): TimelineRow[] {
  if (!options || options.kinds.length === 0) {
    return items.map((resolved) => ({ type: "event", key: resolved.event.id, resolved }));
  }

  const kinds = new Set(options.kinds);
  const within = parseDuration(options.within) ?? 3 * 86_400_000;
  const min = options.min ?? 3;

  const rows: TimelineRow[] = [];
  let run: ResolvedEvent[] = [];

  const flush = () => {
    if (run.length === 0) return;
    if (run.length >= min) {
      const first = run[0];
      const last = run[run.length - 1];
      if (first && last) {
        rows.push({
          type: "cluster",
          key: `cluster:${first.event.id}`,
          kind: first.event.kind,
          register: first.register,
          from: first.event.occurred,
          to: last.event.occurred,
          members: run,
        });
        run = [];
        return;
      }
    }
    for (const resolved of run) rows.push({ type: "event", key: resolved.event.id, resolved });
    run = [];
  };

  for (const item of items) {
    const clusterable = kinds.has(item.event.kind) && !item.protectedFromClustering;
    if (!clusterable) {
      flush();
      rows.push({ type: "event", key: item.event.id, resolved: item });
      continue;
    }
    const previous = run[run.length - 1];
    const contiguous =
      !previous ||
      (previous.event.kind === item.event.kind &&
        !Number.isNaN(previous.at) &&
        !Number.isNaN(item.at) &&
        Math.abs(previous.at - item.at) <= within);
    if (!contiguous) flush();
    run.push(item);
  }
  flush();

  return rows;
}

/**
 * Work out which event each declared gap belongs after, in render order.
 *
 * Placement is computed over the whole ordered list rather than inside a
 * group, because the interesting gaps are exactly the ones that span a month
 * boundary — a source that went quiet in April and came back in June leaves a
 * hole with a group header in the middle of it. Computing per group would
 * silently drop those, which is the failure mode this component exists to stop
 * one level up.
 *
 * The gap is caller-declared rather than inferred. Turning eleven quiet weeks
 * into "records may be missing" would be the component inventing a claim; the
 * application is the thing that knows a source timed out.
 */
function placeGaps(
  items: readonly ResolvedEvent[],
  gaps: readonly CoverageGap[] | undefined,
  order: TimelineCoverage["order"],
): Map<string, CoverageGap[]> {
  const placed = new Map<string, CoverageGap[]>();
  if (!gaps || gaps.length === 0 || items.length === 0) return placed;

  const attach = (id: string, gap: CoverageGap) => {
    placed.set(id, [...(placed.get(id) ?? []), gap]);
  };

  for (const gap of gaps) {
    const from = gap.from ? instantOf(gap.from) : Number.NEGATIVE_INFINITY;
    const to = gap.to ? instantOf(gap.to) : Number.POSITIVE_INFINITY;

    let anchor: string | undefined;
    for (let index = 0; index < items.length - 1; index += 1) {
      const here = items[index];
      const next = items[index + 1];
      if (!here || !next || Number.isNaN(here.at) || Number.isNaN(next.at)) continue;
      const [older, newer] = order === "newest-first" ? [next.at, here.at] : [here.at, next.at];
      if (from >= older && to <= newer) {
        anchor = here.event.id;
        break;
      }
    }

    // A gap beyond the oldest event still has to be said: it is the one that
    // means "and we cannot speak for anything before this".
    if (!anchor) {
      const last = items[items.length - 1];
      const oldest = order === "newest-first" ? last : items[0];
      if (oldest && !Number.isNaN(oldest.at) && to <= oldest.at) anchor = oldest.event.id;
    }

    if (anchor) attach(anchor, gap);
  }

  return placed;
}

/** Splice the placed gaps into a section's rows, after the row that carries them. */
function withGaps(rows: readonly TimelineRow[], placed: Map<string, CoverageGap[]>): TimelineRow[] {
  if (placed.size === 0) return [...rows];

  const output: TimelineRow[] = [];
  for (const row of rows) {
    output.push(row);
    const ids =
      row.type === "event"
        ? [row.resolved.event.id]
        : row.type === "cluster"
          ? row.members.map((member) => member.event.id)
          : [];
    for (const id of ids) {
      for (const gap of placed.get(id) ?? []) {
        output.push({
          type: "gap",
          key: `gap:${gap.from ?? "start"}:${gap.to ?? "end"}`,
          gap,
        });
      }
    }
  }
  return output;
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

/**
 * Every string the component renders.
 *
 * Two catalogs ship — clinician and patient — because the house rule is that
 * patient-facing and clinician-facing strings are *different words*, not the
 * same words in a softer tone.
 */
export interface TimelineLocale {
  kind: Readonly<Record<Exclude<TimelineKind, "other">, string>>;
  kindOther: string;
  status: Readonly<Record<Exclude<TimelineStatus, "occurred">, string>>;
  register: Readonly<Record<TimelineRegister, string>>;

  registerColumnClinical: string;
  registerColumnOther: string;
  jumpToDate: string;
  jumpToDateHint: string;
  arrived: (count: number) => string;
  planned: string;
  now: string;
  newSince: (at: string) => string;
  lapsedDetail: string;
  amendedBy: (at: string) => string;
  wasValue: (value: string) => string;
  recordedLater: (at: string) => string;
  clusterSummary: (count: number, kind: string) => string;
  clusterNoneCritical: string;
  gapNotice: (reason: string) => string;

  withheldTitle: string;
  gatedTitle: string;
  gatedAction: string;

  /** Three empty states, three sentences. Rendering all three as one is the defect. */
  emptyNoRecord: string;
  emptyNoneInWindow: string;
  emptyNoneVisible: string;

  coverageShowing: (shown: number, total: number) => string;
  coverageShowingAll: (shown: number) => string;
  coverageOrderNewest: string;
  coverageOrderOldest: string;
  coverageWindow: (from: string, to: string) => string;
  coverageWindowOpen: (to: string) => string;
  coverageHiddenFilter: (count: number, label: string) => string;
  coverageHiddenPage: (count: number) => string;
  coverageHiddenAccess: (count: number) => string;
  coverageHiddenUnmapped: (count: number) => string;
  coverageSourcesReached: (reached: number, total: number) => string;
  sourceUnavailable: (label: string) => string;
  sourceUnavailableLead: string;
  sourceNotAClaim: string;
  sourcesLabel: string;
  stepsLabel: (title: string) => string;
  loadOlder: string;
  seeAll: (total: number) => string;
  listLabel: string;
}

const KIND_WORDS_CLINICIAN: TimelineLocale["kind"] = {
  encounter: "Encounter",
  observation: "Observation",
  laboratory: "Laboratory",
  imaging: "Imaging",
  procedure: "Procedure",
  medication: "Medication",
  immunization: "Immunisation",
  condition: "Condition",
  allergy: "Allergy",
  note: "Clinical note",
  document: "Document",
  "care-plan": "Care plan",
  questionnaire: "Questionnaire",
  appointment: "Appointment",
  referral: "Referral",
  task: "Task",
  coverage: "Coverage",
  consent: "Consent",
  message: "Message",
  call: "Telephone",
  access: "Record access",
};

const STATUS_WORDS_CLINICIAN: TimelineLocale["status"] = {
  "in-progress": "In progress",
  planned: "Planned",
  lapsed: "Lapsed",
  cancelled: "Cancelled",
  "not-done": "Did not connect",
  amended: "Amended",
  corrected: "Corrected",
  "in-error": "Entered in error",
  unknown: "Status not stated",
};

/**
 * The clinician catalog.
 *
 * Not yet in an `@zoblocks/intl` catalog, deliberately: that is the
 * point at which changing a word becomes a breaking change, and these should
 * be checked against a real product's screen first.
 */
export const DEFAULT_TIMELINE_LOCALE: TimelineLocale = {
  kind: KIND_WORDS_CLINICIAN,
  kindOther: "Other",
  status: STATUS_WORDS_CLINICIAN,
  register: {
    clinical: "Clinical",
    administrative: "Administrative",
    communication: "Contact",
    "patient-reported": "Patient reported",
    system: "System",
  },

  registerColumnClinical: "Clinical",
  registerColumnOther: "Administrative & contact",
  jumpToDate: "Jump to",
  jumpToDateHint: "Moves the reader to a period. It does not change what is shown.",
  arrived: (count) => `${count} new`,
  planned: "Planned",
  now: "Now",
  newSince: (at) => `New since you last reviewed this chart — ${at}`,
  lapsedDetail:
    "Scheduled, and no encounter has been recorded against it. Nothing here says the patient did not attend — only that this record has nothing.",
  amendedBy: (at) => `Amended ${at}`,
  wasValue: (value) => `previously ${value}`,
  recordedLater: (at) => `recorded ${at}`,
  clusterSummary: (count, kind) => `${count} ${kind.toLowerCase()} records`,
  clusterNoneCritical: "None critical",
  gapNotice: (reason) => `Records may be missing here — ${reason}`,

  withheldTitle: "A record exists on this date and you do not have access to it",
  gatedTitle: "A record exists on this date",
  gatedAction: "Record a reason and open",

  emptyNoRecord: "There are no records for this person in any source that was searched.",
  emptyNoneInWindow:
    "This window was searched and returned nothing. It is not a statement that nothing happened.",
  emptyNoneVisible:
    "Records exist in this window and none of them are ones you have access to read.",

  coverageShowing: (shown, total) => `Showing ${shown} of ${total} events`,
  coverageShowingAll: (shown) => `Showing all ${shown} events`,
  coverageOrderNewest: "newest first",
  coverageOrderOldest: "oldest first",
  coverageWindow: (from, to) => `from ${from} to ${to}`,
  coverageWindowOpen: (to) => `everything held, to ${to}`,
  coverageHiddenFilter: (count, label) => `${count} hidden by the “${label}” filter`,
  coverageHiddenPage: (count) => `${count} beyond this page`,
  coverageHiddenAccess: (count) => `${count} you do not have access to`,
  coverageHiddenUnmapped: (count) => `${count} of a type this view cannot render`,
  coverageSourcesReached: (reached, total) => `${reached} of ${total} sources reached`,
  sourceUnavailable: (label) => `${label} — could not be reached`,
  sourceUnavailableLead: "One or more sources could not be reached.",
  sourceNotAClaim: "This is not a statement that no such records exist.",
  sourcesLabel: "Sources searched",
  stepsLabel: (title) => `${title} — progress`,
  loadOlder: "Load older records",
  seeAll: (total) => `See all ${total}`,
  listLabel: "Care timeline",
};

/**
 * The patient catalog.
 *
 * Different words, not a softer tone. "Entered in error" is what a chart says;
 * "recorded by mistake and kept for the record" is what a person needs.
 */
export const PATIENT_TIMELINE_LOCALE: TimelineLocale = {
  ...DEFAULT_TIMELINE_LOCALE,
  kind: {
    ...KIND_WORDS_CLINICIAN,
    encounter: "Visit",
    laboratory: "Test result",
    observation: "Measurement",
    note: "Note from your care team",
    questionnaire: "Form you completed",
    call: "Phone call",
    access: "Who looked at your record",
  },
  status: {
    ...STATUS_WORDS_CLINICIAN,
    lapsed: "No visit recorded",
    "not-done": "We could not reach you",
    "in-error": "Recorded by mistake, and kept for the record",
    unknown: "We do not know what happened next",
  },
  lapsedDetail:
    "This was booked, and no visit has been recorded against it. If you did attend, tell your care team so the record can be corrected.",
  newSince: (at) => `New since you last looked — ${at}`,
  emptyNoRecord: "There is nothing in your record yet from any of the places we checked.",
  emptyNoneInWindow:
    "We looked at this period and found nothing. That does not mean nothing happened.",
  emptyNoneVisible: "There are records here that your care team has not released to you yet.",
  sourceUnavailableLead: "We could not reach one of the places that holds your records.",
  sourceNotAClaim: "There may be more to see once it is reachable again.",
  sourcesLabel: "Where we looked",
  stepsLabel: (title) => `${title} — what has happened so far`,
  registerColumnOther: "Appointments & messages",
  jumpToDate: "Go to",
  jumpToDateHint: "Moves you to a period. It does not change what is shown.",
  loadOlder: "Show older records",
  listLabel: "Your care timeline",
};

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

export interface CoverageSentence {
  /** "Showing 8 of 43 events". Always present. */
  headline: string;
  /** The rest, already joined: order, window, and what is hidden. */
  detail: string;
  /** "1 of 2 sources reached" — the compressed form, for a narrow card. */
  compact: string;
  /** True when a source is `unavailable`. Escalates the footnote to a banner. */
  degraded: boolean;
}

/**
 * Coverage in words.
 *
 * Exported because the sentence belongs in a print header, an export, and an
 * audit record as well as at the foot of the component — and three
 * implementations of one claim is how they come to disagree.
 */
export function describeCoverage(
  coverage: TimelineCoverage,
  model: Pick<TimelineModel, "shown" | "truncated">,
  locale: TimelineLocale = DEFAULT_TIMELINE_LOCALE,
  formatDate: (value: FhirDateTime) => string = (value) => value,
): CoverageSentence {
  const total = coverage.total ?? model.shown + model.truncated;
  const headline =
    total > model.shown
      ? locale.coverageShowing(model.shown, total)
      : locale.coverageShowingAll(model.shown);

  const parts: string[] = [
    coverage.order === "newest-first" ? locale.coverageOrderNewest : locale.coverageOrderOldest,
  ];

  const window = coverage.window;
  if (window?.from && window.to)
    parts.push(locale.coverageWindow(formatDate(window.from), formatDate(window.to)));
  else if (window?.from) parts.push(locale.coverageWindow(formatDate(window.from), "now"));
  else if (window?.to) parts.push(locale.coverageWindowOpen(formatDate(window.to)));

  const hidden: string[] = [];
  const declared = [...(coverage.hidden ?? [])];
  if (!declared.some((entry) => entry.reason === "page")) {
    // Two ways an event can be off the page, and the reader needs the sum of
    // both: `limit` kept some of what we were given, and the server may hold
    // more than the caller passed at all. Reporting only the first understates
    // the remainder by exactly the amount that matters on a paged query.
    const otherHidden = declared.reduce((sum, entry) => sum + Math.max(0, entry.count), 0);
    const beyond = Math.max(model.truncated, total - model.shown - otherHidden);
    if (beyond > 0) declared.push({ reason: "page", count: beyond });
  }
  for (const entry of declared) {
    if (entry.count <= 0) continue;
    if (entry.reason === "filter")
      hidden.push(locale.coverageHiddenFilter(entry.count, entry.label ?? ""));
    else if (entry.reason === "page") hidden.push(locale.coverageHiddenPage(entry.count));
    else if (entry.reason === "access") hidden.push(locale.coverageHiddenAccess(entry.count));
    else hidden.push(locale.coverageHiddenUnmapped(entry.count));
  }

  const reached = coverage.sources.filter(
    (source) => source.status === "ok" || source.status === "partial",
  ).length;

  return {
    headline,
    detail: [parts.join(", "), hidden.join(", ")].filter(Boolean).join(". "),
    compact: locale.coverageSourcesReached(reached, coverage.sources.length),
    degraded: coverage.sources.some((source) => source.status === "unavailable"),
  };
}

/**
 * Which of the three empty states this is.
 *
 * "No record", "none in this window", and "none you may see" are three
 * different facts with three different next actions, and rendering them as one
 * empty card is the exact ambiguity this library exists to prevent.
 */
export function emptyStateOf(
  coverage: TimelineCoverage,
  model: Pick<TimelineModel, "shown">,
): "none" | "no-record" | "none-in-window" | "none-visible" {
  if (model.shown > 0) return "none";
  const withheld = (coverage.hidden ?? []).find((entry) => entry.reason === "access");
  if (withheld && withheld.count > 0) return "none-visible";
  if (coverage.window?.from ?? coverage.window?.to) return "none-in-window";
  return "no-record";
}

/* ------------------------------------------------------------------ */
/* Rendering a time                                                    */
/* ------------------------------------------------------------------ */

const MONTH_FORMAT: Readonly<Record<TimePrecision, Intl.DateTimeFormatOptions>> = {
  year: { year: "numeric", timeZone: "UTC" },
  month: { year: "numeric", month: "long", timeZone: "UTC" },
  day: { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" },
  minute: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  },
  second: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  },
};

/**
 * A time, rendered at the precision the record holds it.
 *
 * Two rules, and the second one is the reason this is not a one-liner over
 * `toLocaleString`.
 *
 *   A FHIR `2019` renders as 2019. Widening it to 1 January invents a
 *   precision nobody recorded, and a date of birth is not the only field where
 *   that matters.
 *
 *   A stamp carrying an offset renders in *the record's* zone, not the
 *   reader's. A transfer, a traveller or a teleconsult otherwise shows a
 *   different time to a clinician in Chennai and one in Chicago, for the same
 *   event, with nothing on screen to say why. The wall-clock components are
 *   read straight out of the string and formatted against UTC, so what appears
 *   is what was written down, with the offset appended.
 */
export function formatFhirDateTime(
  value: FhirDateTime | undefined,
  options: { locale?: string; showZone?: boolean } = {},
): string | undefined {
  const precision = precisionOf(value);
  if (!value || !precision) return undefined;

  const trimmed = value.trim();
  const stamp = STAMP.exec(trimmed);
  const parts = stamp
    ? Date.UTC(
        Number(stamp[1]),
        Number(stamp[2]) - 1,
        Number(stamp[3]),
        Number(stamp[4]),
        Number(stamp[5]),
        stamp[6] ? Number(stamp[6]) : 0,
      )
    : instantOf(trimmed);

  if (Number.isNaN(parts)) return undefined;

  const rendered = new Intl.DateTimeFormat(options.locale, MONTH_FORMAT[precision]).format(
    new Date(parts),
  );

  const zone = stamp?.[7];
  if (!zone || options.showZone === false) return rendered;
  return `${rendered} ${zone === "Z" ? "UTC" : zone}`;
}

/**
 * "in 15 days", "4 days ago".
 *
 * Always rendered `aria-hidden` beside an absolute time, never instead of one:
 * a relative time alone is not a clinical timestamp, and spoken aloud it
 * doubles the length of every item while adding nothing a date has not said.
 */
export function formatRelative(at: number, nowAt: number, locale?: string): string | undefined {
  if (Number.isNaN(at) || Number.isNaN(nowAt)) return undefined;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const delta = at - nowAt;
  const abs = Math.abs(delta);

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 86_400_000],
    ["month", 30 * 86_400_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, size] of units) {
    if (abs >= size) return format.format(Math.round(delta / size), unit);
  }
  return format.format(0, "minute");
}

/** A group key (`2026-08`, `2026-Q3`, `2026`) in the reader's words. */
export function formatGroupLabel(key: string, locale?: string): string {
  if (/^\d{4}$/.test(key)) return key;
  const quarter = /^(\d{4})-Q(\d)$/.exec(key);
  if (quarter) return `Q${quarter[2]} ${quarter[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(key);
  if (month) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1)));
  }
  return key;
}

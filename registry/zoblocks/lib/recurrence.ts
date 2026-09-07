/**
 * Recurrence: an RFC 5545 subset, stated as a subset.
 *
 * Behavioural health does not book appointments; it books courses of
 * treatment, and the unit is the series. So this emits and reads **real
 * RRULE strings** — a series round-trips with iCalendar, with FHIR `Timing`,
 * and with every calendar the customer already runs.
 *
 * **It implements a named subset and refuses the rest.** `parseRRule` returns
 * `{ ok: false, unsupported }` rather than a rule it cannot expand, and the
 * component renders such a series read-only with its original string intact.
 * The alternative is a general expander that silently drops what it does not
 * understand, and the failure mode there is a twelve-week treatment plan
 * quietly losing four sessions on import — which nobody notices until a
 * patient arrives on a day that is not in the diary.
 *
 * **Expansion is bounded twice.** By the rule's own COUNT or UNTIL, and by a
 * hard cap. An unbounded rule a caller forgot to bound must not be able to
 * hang the tab.
 */

import {
  addCalendarDays,
  addCalendarMonths,
  compareDates,
  formatPlainDate,
  isSameDate,
  weekdayOf,
  WEEKDAY_NAMES,
  type ZbDate,
  type ZbTime,
} from "@/lib/zoblocks-datetime";

/* ------------------------------------------------------------------ */
/* The rule                                                           */
/* ------------------------------------------------------------------ */

/**
 * The frequencies a healthcare workflow actually produces.
 *
 * `YEARLY` is deliberately absent: an annual review is a task, not a series,
 * and modelling it as one means somebody maintains a recurrence rule for a
 * thing that happens once. `HOURLY` and below have no clinical analogue at
 * all outside an infusion protocol, which is a different component.
 */
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

/** 0 = Sunday, matching `weekdayOf`. Serialised as SU/MO/TU… */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface RecurrenceRule {
  freq: RecurrenceFrequency;
  /** Every N. 1 by default; 2 is the commonest non-default in therapy. */
  interval?: number;
  /** WEEKLY: which days. Empty means the start date's own weekday. */
  byWeekday?: Weekday[];
  /** MONTHLY: the nth weekday, with -1 for last. Needs `byWeekday`. */
  bySetPos?: 1 | 2 | 3 | 4 | -1;
  /** MONTHLY: a day of the month. Clamped, never rolled into the next. */
  byMonthDay?: number;
  /** Stop after N occurrences. Mutually exclusive with `until`. */
  count?: number;
  /** Stop on or before this date. Mutually exclusive with `count`. */
  until?: ZbDate;
  /**
   * Dates the series skips — facility closures, holidays.
   *
   * Written into the series rather than filtered at render, so the count
   * downstream matches the sessions that will actually happen. A group
   * scheduler that prints the naive occurrence count has told the billing
   * team a number that does not match reality.
   */
  exceptions?: ZbDate[];
}

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

/* ------------------------------------------------------------------ */
/* Expansion                                                          */
/* ------------------------------------------------------------------ */

export interface Occurrence {
  date: ZbDate;
  /** 1-based position in the series, counting only kept dates. */
  index: number;
  /** Set when the date is in `exceptions`; the occurrence is not counted. */
  skippedReason?: string;
}

const HARD_CAP = 400;

/**
 * The dates a rule produces from a start, exceptions marked rather than
 * silently removed.
 *
 * Marked because a skipped date is information: "26 dates, 2 facility
 * closures, 24 sessions" is the sentence a scheduler needs, and a list that
 * has quietly dropped two rows cannot produce it.
 */
export function expandRule(rule: RecurrenceRule, start: ZbDate, cap = 60): Occurrence[] {
  const limit = Math.min(cap, HARD_CAP);
  const interval = Math.max(1, rule.interval ?? 1);
  const out: Occurrence[] = [];
  /* Two counters, and the difference between them is the whole point.
   *
   * `emitted` bounds the expansion, because RFC 5545 applies COUNT to the
   * RRULE and removes EXDATEs from the set it produces — in that order. A
   * COUNT of 26 with three EXDATEs is twenty-three occurrences, not
   * twenty-six ending three weeks later.
   *
   * Counting only kept dates toward COUNT reads like the kinder answer —
   * the programme still gets its twenty-six sessions — and it is the wrong
   * one, because `toRRule` exports COUNT=26 alongside those EXDATEs. Any
   * conforming consumer would then expand a series ending three weeks
   * earlier than the one on screen, and the screen is not the artefact the
   * appointment reminders are generated from. The tally names all three
   * numbers so the difference is visible rather than resolved silently.
   */
  let emitted = 0;
  /** 1-based session number, which skipped dates do not advance. */
  let sessions = 0;

  const isException = (date: ZbDate) =>
    (rule.exceptions ?? []).some((exception) => isSameDate(exception, date));

  const push = (date: ZbDate): boolean => {
    if (rule.until && compareDates(date, rule.until) > 0) return false;
    emitted += 1;
    if (isException(date)) {
      out.push({ date, index: sessions, skippedReason: "excluded" });
    } else {
      sessions += 1;
      out.push({ date, index: sessions });
    }
    if (rule.count && emitted >= rule.count) return false;
    return out.length < limit;
  };

  if (rule.freq === "DAILY") {
    let current = start;
    for (let guard = 0; guard < HARD_CAP; guard += 1) {
      if (!push(current)) break;
      current = addCalendarDays(current, interval);
    }
    return out;
  }

  if (rule.freq === "WEEKLY") {
    const days = (
      rule.byWeekday?.length ? [...rule.byWeekday] : [weekdayOf(start) as Weekday]
    ).sort((a, b) => a - b);
    // Anchored on the week containing the start, then walked in intervals.
    // Anchoring on the start date itself would make "every other Tuesday and
    // Thursday" mean different things depending on which one came first.
    let weekStart = addCalendarDays(start, -weekdayOf(start));
    for (let guard = 0; guard < HARD_CAP; guard += 1) {
      let stop = false;
      for (const day of days) {
        const date = addCalendarDays(weekStart, day);
        if (compareDates(date, start) < 0) continue;
        if (!push(date)) {
          stop = true;
          break;
        }
      }
      if (stop) break;
      weekStart = addCalendarDays(weekStart, 7 * interval);
    }
    return out;
  }

  // MONTHLY
  let month = start;
  for (let guard = 0; guard < HARD_CAP; guard += 1) {
    const date = monthlyDate(month, rule) ?? month;
    if (compareDates(date, start) >= 0 && !push(date)) break;
    month = addCalendarMonths(month, interval);
  }
  return out;
}

/** The nth weekday of a month, or a clamped day-of-month. */
function monthlyDate(anchor: ZbDate, rule: RecurrenceRule): ZbDate | null {
  if (rule.bySetPos && rule.byWeekday?.length) {
    const weekday = rule.byWeekday[0];
    if (weekday === undefined) return null;
    if (rule.bySetPos === -1) {
      // Walk back from the end of the month rather than guessing at week five.
      let date = addCalendarDays(addCalendarMonths({ ...anchor, d: 1 }, 1), -1);
      while (weekdayOf(date) !== weekday) date = addCalendarDays(date, -1);
      return date;
    }
    let date: ZbDate = { kind: "date", y: anchor.y, m: anchor.m, d: 1 };
    while (weekdayOf(date) !== weekday) date = addCalendarDays(date, 1);
    return addCalendarDays(date, 7 * (rule.bySetPos - 1));
  }
  if (rule.byMonthDay) {
    // `addCalendarMonths` clamps, which is the behaviour a monthly injection
    // needs: 31 January plus a month is 28 February, never 3 March.
    return addCalendarMonths({ kind: "date", y: anchor.y, m: anchor.m, d: 1 }, 0).d === 1
      ? clampToMonth(anchor.y, anchor.m, rule.byMonthDay)
      : null;
  }
  return null;
}

function clampToMonth(y: number, m: number, day: number): ZbDate {
  const last = addCalendarDays(addCalendarMonths({ kind: "date", y, m, d: 1 }, 1), -1).d;
  return { kind: "date", y, m, d: Math.min(day, last) };
}

/** Only the dates that will actually happen. */
export function keptOccurrences(occurrences: readonly Occurrence[]): Occurrence[] {
  return occurrences.filter((occurrence) => !occurrence.skippedReason);
}

/* ------------------------------------------------------------------ */
/* Words                                                              */
/* ------------------------------------------------------------------ */

/**
 * The rule in plain language.
 *
 * **This is the product.** It is the only part of a recurrence builder most
 * users read, so it is rendered as content rather than as a hint, and it is
 * what the live region announces when the rule changes. A builder whose
 * summary is buried in a tooltip has a dozen controls and no answer.
 */
export function describeRule(rule: RecurrenceRule): string {
  const interval = Math.max(1, rule.interval ?? 1);

  if (rule.freq === "DAILY") {
    return interval === 1 ? "Every day" : `Every ${interval} days`;
  }

  if (rule.freq === "WEEKLY") {
    const days = (rule.byWeekday ?? [])
      .map((day) => WEEKDAY_NAMES[day])
      .filter(Boolean) as string[];
    if (interval === 1 && days.length === 1) return `Every ${days[0]}`;
    const stem = interval === 1 ? "Every week" : `Every ${interval} weeks`;
    if (days.length === 0) return stem;
    const list =
      days.length === 1 ? days[0] : `${days.slice(0, -1).join(", ")} and ${days[days.length - 1]}`;
    return `${stem} on ${list}`;
  }

  const stem = interval === 1 ? "Every month" : `Every ${interval} months`;
  if (rule.bySetPos && rule.byWeekday?.length) {
    const ordinal =
      rule.bySetPos === -1 ? "last" : ["first", "second", "third", "fourth"][rule.bySetPos - 1];
    const weekday = WEEKDAY_NAMES[rule.byWeekday[0] as number];
    return `${stem} on the ${ordinal} ${weekday}`;
  }
  if (rule.byMonthDay) return `${stem} on day ${rule.byMonthDay}`;
  return stem;
}

/** The whole series as one sentence, which is what gets read back before a save. */
export function describeSeries(
  rule: RecurrenceRule,
  options: { at?: ZbTime; timeLabel?: string } = {},
): string {
  let sentence = describeRule(rule);
  if (options.timeLabel) sentence += ` at ${options.timeLabel}`;
  if (rule.count) sentence += ` for ${rule.count} session${rule.count === 1 ? "" : "s"}`;
  else if (rule.until) sentence += ` until ${formatPlainDate(rule.until, "medium")}`;
  else sentence += ", with no end date";
  return sentence;
}

/* ------------------------------------------------------------------ */
/* RFC 5545                                                           */
/* ------------------------------------------------------------------ */

function isoBasic(date: ZbDate): string {
  return formatPlainDate(date, "iso").replace(/-/g, "");
}

/** A real RRULE, so a series round-trips with iCalendar and FHIR Timing. */
export function toRRule(rule: RecurrenceRule): string {
  const parts = [`FREQ=${rule.freq}`];
  const interval = rule.interval ?? 1;
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  if (rule.byWeekday?.length) {
    parts.push(`BYDAY=${rule.byWeekday.map((day) => WEEKDAY_CODES[day]).join(",")}`);
  }
  if (rule.bySetPos) parts.push(`BYSETPOS=${rule.bySetPos}`);
  if (rule.byMonthDay) parts.push(`BYMONTHDAY=${rule.byMonthDay}`);
  if (rule.count) parts.push(`COUNT=${rule.count}`);
  if (rule.until) parts.push(`UNTIL=${isoBasic(rule.until)}T235959Z`);
  return `RRULE:${parts.join(";")}`;
}

/** The EXDATE line, which is what keeps a downstream count honest. */
export function toExDate(rule: RecurrenceRule, timeLabel = "000000"): string | null {
  if (!rule.exceptions?.length) return null;
  return `EXDATE:${rule.exceptions.map((date) => `${isoBasic(date)}T${timeLabel}`).join(",")}`;
}

export type RRuleParse =
  | { ok: true; rule: RecurrenceRule }
  /**
   * The parts we deliberately do not implement.
   *
   * A rule we cannot expand is a rule we must not pretend to: the caller
   * renders the original string read-only and says the series cannot be
   * edited here, rather than showing a silently truncated version of it.
   */
  | { ok: false; unsupported: string[] };

const SUPPORTED_PARTS = new Set([
  "FREQ",
  "INTERVAL",
  "BYDAY",
  "BYSETPOS",
  "BYMONTHDAY",
  "COUNT",
  "UNTIL",
  "WKST",
]);

export function parseRRule(input: string): RRuleParse {
  const body = input.replace(/^RRULE:/i, "").trim();
  if (!body) return { ok: false, unsupported: ["an empty rule"] };

  const pairs = new Map<string, string>();
  const unsupported: string[] = [];

  for (const chunk of body.split(";")) {
    const [rawName, rawValue] = chunk.split("=");
    const name = (rawName ?? "").toUpperCase();
    if (!name || rawValue === undefined) continue;
    if (!SUPPORTED_PARTS.has(name)) {
      unsupported.push(name);
      continue;
    }
    pairs.set(name, rawValue);
  }

  const freq = (pairs.get("FREQ") ?? "").toUpperCase();
  if (!["DAILY", "WEEKLY", "MONTHLY"].includes(freq)) {
    unsupported.push(`FREQ=${freq || "(missing)"}`);
  }
  if (unsupported.length > 0) return { ok: false, unsupported };

  const rule: RecurrenceRule = { freq: freq as RecurrenceFrequency };

  const interval = Number(pairs.get("INTERVAL"));
  if (Number.isFinite(interval) && interval > 1) rule.interval = interval;

  const byday = pairs.get("BYDAY");
  if (byday) {
    const days: Weekday[] = [];
    for (const code of byday.split(",")) {
      // A numeric prefix — "3WE", "-1FR" — is BYSETPOS by another name and
      // beyond the subset. Refuse rather than drop the prefix.
      if (/^[+-]?\d/.test(code)) return { ok: false, unsupported: [`BYDAY=${code}`] };
      const index = WEEKDAY_CODES.indexOf(code.toUpperCase() as (typeof WEEKDAY_CODES)[number]);
      if (index < 0) return { ok: false, unsupported: [`BYDAY=${code}`] };
      days.push(index as Weekday);
    }
    if (days.length) rule.byWeekday = days.sort((a, b) => a - b);
  }

  const setPos = Number(pairs.get("BYSETPOS"));
  if ([1, 2, 3, 4, -1].includes(setPos)) rule.bySetPos = setPos as RecurrenceRule["bySetPos"];

  const monthDay = Number(pairs.get("BYMONTHDAY"));
  if (Number.isFinite(monthDay) && monthDay >= 1 && monthDay <= 31) rule.byMonthDay = monthDay;

  const count = Number(pairs.get("COUNT"));
  if (Number.isFinite(count) && count > 0) rule.count = count;

  const until = pairs.get("UNTIL");
  if (until) {
    const parsed = /^(\d{4})(\d{2})(\d{2})/.exec(until);
    if (parsed) {
      rule.until = {
        kind: "date",
        y: Number(parsed[1]),
        m: Number(parsed[2]),
        d: Number(parsed[3]),
      };
    }
  }

  if (rule.count && rule.until) {
    // RFC 5545 forbids both. Refusing beats picking one and being wrong about
    // where a treatment course ends.
    return { ok: false, unsupported: ["COUNT and UNTIL together"] };
  }

  return { ok: true, rule };
}

/* ------------------------------------------------------------------ */
/* Conflicts across a horizon                                         */
/* ------------------------------------------------------------------ */

/**
 * A host's verdict on one occurrence.
 *
 * Checking twelve future Tuesdays against a clinician's calendar, a patient's
 * other appointments, a room and a payer authorisation is a server query, not
 * a client computation — and ADR 0009 forbids this component making it. The
 * component's contract is narrow and testable: expand the rule, hand the host
 * the candidate dates, render whatever comes back. It does not know what a
 * conflict is.
 */
export interface OccurrenceVerdict {
  /** ISO date, so a host can key a map without a date library. */
  date: string;
  reason: string;
  /** An alternative the host proposes. Offered, never applied. */
  alternative?: { date: ZbDate; label: string };
}

export interface SeriesReview {
  occurrences: Occurrence[];
  total: number;
  bookable: number;
  conflicts: number;
  excluded: number;
}

/** The arithmetic that is the feature: dates in range versus sessions held. */
export function reviewSeries(
  occurrences: readonly Occurrence[],
  verdicts: readonly OccurrenceVerdict[],
  resolved: ReadonlySet<string> = new Set(),
): SeriesReview {
  const blocked = new Set(
    verdicts.map((verdict) => verdict.date).filter((date) => !resolved.has(date)),
  );
  const excluded = occurrences.filter((occurrence) => occurrence.skippedReason).length;
  const conflicts = occurrences.filter(
    (occurrence) =>
      !occurrence.skippedReason && blocked.has(formatPlainDate(occurrence.date, "iso")),
  ).length;
  const total = occurrences.length;
  return {
    occurrences: [...occurrences],
    total,
    bookable: total - excluded - conflicts,
    conflicts,
    excluded,
  };
}

/** The presets a behavioural-health practice starts from. Not a default. */
export const THERAPY_CADENCES: ReadonlyArray<{ id: string; label: string; rule: RecurrenceRule }> =
  [
    { id: "weekly", label: "Weekly", rule: { freq: "WEEKLY", interval: 1 } },
    { id: "fortnightly", label: "Every 2 weeks", rule: { freq: "WEEKLY", interval: 2 } },
    {
      id: "twice-weekly",
      label: "Twice a week",
      rule: { freq: "WEEKLY", interval: 1, byWeekday: [2, 4] },
    },
    { id: "monthly", label: "Monthly", rule: { freq: "MONTHLY", interval: 1 } },
  ];

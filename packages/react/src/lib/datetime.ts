// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/datetime.ts. Edit that file, not this one.
/**
 * The temporal engine: values, calendar arithmetic, parsing, and the session
 * algebra. No React, no DOM, no I/O, and — deliberately — no wall clock.
 *
 * Four rules shape everything below, and each one is a decision rather than a
 * preference.
 *
 * **1. A value carries its own precision.** `OxDate` has no time member and
 * `OxPartialDate` has no day. That is not tidiness: `new Date("1986-07-18")`
 * is midnight UTC, which is the 17th of July in California, and a birth date
 * stored as an instant is the single most common temporal defect in healthcare
 * software. The type makes it unrepresentable rather than discouraged.
 *
 * **2. Calendar arithmetic is integer arithmetic.** A civil date is a label on
 * a calendar, not a point on a timeline, so adding a day is `+1` on a day
 * number. No floating point, no timezone, no DST, and every comparison is
 * exact. Zones enter only where an *instant* does.
 *
 * **3. Nothing reads the clock.** ENGINEERING.md §9 forbids a component
 * deciding what to render from `Date.now()`, because output that depends on
 * when it rendered cannot be visually regression-tested. Every function that
 * needs "now" takes it as an argument. There is no argless `new Date()` in
 * this file and a test asserts there never will be.
 *
 * **4. Absence is a value.** `OxAbsentDate` carries a reason, the same way
 * Switch carries `"unknown"`. A registration form that cannot distinguish
 * "no date of birth" from "nobody asked" is lying, and CONTENT.md forbids
 * punctuating the difference away as an em dash.
 */

/* ------------------------------------------------------------------ */
/* Values                                                             */
/* ------------------------------------------------------------------ */

/** A civil calendar date. No time, no zone, no instant. */
export interface OxDate {
  kind: "date";
  y: number;
  /** 1–12. */
  m: number;
  /** 1–31, valid for the month. */
  d: number;
}

/**
 * A date known only to the year or the month.
 *
 * FHIR permits `YYYY` and `YYYY-MM` for `Patient.birthDate`, and homeless
 * services, unaccompanied minors and forensic intake all produce them.
 * Coercing "born around 1962" to 1 January 1962 invents a fact that will be
 * read as precise for the rest of the record's life.
 */
export interface OxPartialDate {
  kind: "partial-date";
  y: number;
  m?: number;
  d?: number;
}

/** A wall-clock time with no date. A shift start is one of these. */
export interface OxTime {
  kind: "time";
  /** 0–23, always. The 12-hour split is presentation. */
  h: number;
  mi: number;
  /** Present only where the workflow needs it — a code call, a restraint. */
  s?: number;
}

/** A local date and time with no zone. An encounter start in clinic time. */
export interface OxDateTime {
  kind: "datetime";
  date: OxDate;
  time: OxTime;
}

/**
 * A point on the timeline, carrying the IANA zone it was asserted in.
 *
 * The zone is stored, never the offset. `-04:00` is correct for half the year,
 * and a recurring appointment stored with an offset is wrong for roughly
 * twenty-three weeks of every year — surfacing as "everything moved an hour"
 * on a Monday morning in November.
 */
export interface OxInstant {
  kind: "instant";
  date: OxDate;
  time: OxTime;
  /** An IANA identifier, e.g. `"America/New_York"`. Never an offset. */
  zone: string;
}

/** Why a temporal value is not present. Mirrors FHIR `data-absent-reason`. */
export type TemporalAbsence = "unknown" | "asked-declined" | "not-asked" | "temp-unknown";

export interface OxAbsentDate {
  kind: "absent";
  reason: TemporalAbsence;
}

export type OxTemporal = OxDate | OxPartialDate | OxTime | OxDateTime | OxInstant | OxAbsentDate;

export type TemporalPrecision = OxTemporal["kind"];

/** The discriminant, as a function, for hosts narrowing an unknown value. */
export function temporalPrecision(value: OxTemporal): TemporalPrecision {
  return value.kind;
}

export function isTemporalAbsent(value: OxTemporal | null | undefined): value is OxAbsentDate {
  return !!value && value.kind === "absent";
}

export function plainDate(y: number, m: number, d: number): OxDate {
  return { kind: "date", y, m, d };
}

export function plainTime(h: number, mi: number, s?: number): OxTime {
  return s === undefined ? { kind: "time", h, mi } : { kind: "time", h, mi, s };
}

/* ------------------------------------------------------------------ */
/* Calendar arithmetic                                                */
/* ------------------------------------------------------------------ */

/**
 * The full Gregorian rule, not `% 4`.
 *
 * 2100 is not a leap year. A prototype that gets that wrong is a prototype
 * whose date maths cannot be trusted anywhere else, and a 75-year-old born on
 * 29 February is not a hypothetical patient.
 */
export function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function daysInMonth(y: number, m: number): number {
  return m === 2 && isLeapYear(y) ? 29 : (MONTH_LENGTHS[m - 1] as number);
}

/**
 * Days since 1970-01-01, by Howard Hinnant's civil-from-days algorithm.
 *
 * Integer throughout, so `compareDates` is a subtraction and a difference in
 * days is exact at any distance. The alternative — constructing two `Date`
 * objects and subtracting — is wrong across a DST boundary by an hour, which
 * rounds to a day often enough to matter in a length-of-stay calculation.
 */
export function toEpochDay(a: OxDate): number {
  let y = a.y;
  const m = a.m;
  if (m <= 2) y -= 1;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + a.d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromEpochDay(days: number): OxDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp + (mp < 10 ? 3 : -9);
  return plainDate(m <= 2 ? y + 1 : y, m, d);
}

export function addCalendarDays(a: OxDate, n: number): OxDate {
  return fromEpochDay(toEpochDay(a) + n);
}

/**
 * Month arithmetic that clamps rather than rolls over.
 *
 * 31 January plus one month is 28 February, not 3 March. Rolling over is how a
 * monthly depot injection silently moves to the wrong month and stays there
 * for the rest of the series.
 */
export function addCalendarMonths(a: OxDate, n: number): OxDate {
  const total = a.y * 12 + (a.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (((total % 12) + 12) % 12) + 1;
  return plainDate(y, m, Math.min(a.d, daysInMonth(y, m)));
}

/** Negative when `a` is earlier. The value is the difference in days. */
export function compareDates(a: OxDate, b: OxDate): number {
  return toEpochDay(a) - toEpochDay(b);
}

export function isSameDate(a: OxDate | null | undefined, b: OxDate | null | undefined): boolean {
  return !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;
}

/** 0 = Sunday. 1970-01-01 was a Thursday, which is where the 4 comes from. */
export function weekdayOf(a: OxDate): number {
  const z = toEpochDay(a);
  return (((z + 4) % 7) + 7) % 7;
}

/** Whether a date is representable — 30 February is not, and neither is month 13. */
export function isValidDate(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/* ------------------------------------------------------------------ */
/* Business days                                                      */
/* ------------------------------------------------------------------ */

export interface BusinessDayOptions {
  /** Weekday numbers that count as working, 0 = Sunday. Defaults to Mon–Fri. */
  workdays?: readonly number[];
  /** Organisation closures — holidays, training days, a facility shutdown. */
  closed?: (date: OxDate) => boolean;
}

const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5] as const;

/**
 * Both the working week and the closure predicate are arguments, because
 * neither is "Monday to Friday". A partial-hospitalisation programme running
 * Saturday clinics has a different working week from an outpatient office, and
 * "three business days" means something different in each.
 */
export function isBusinessDay(date: OxDate, options: BusinessDayOptions = {}): boolean {
  const workdays = options.workdays ?? DEFAULT_WORKDAYS;
  if (!workdays.includes(weekdayOf(date))) return false;
  return !options.closed?.(date);
}

export function addBusinessDays(from: OxDate, n: number, options: BusinessDayOptions = {}): OxDate {
  const direction = n < 0 ? -1 : 1;
  const wanted = Math.abs(n);
  let current = from;
  let counted = 0;
  // Bounded: a closure predicate that returns true for every day would
  // otherwise spin. Ten years is far past any real scheduling horizon.
  for (let guard = 0; counted < wanted && guard < 3650; guard += 1) {
    current = addCalendarDays(current, direction);
    if (isBusinessDay(current, options)) counted += 1;
  }
  return current;
}

/* ------------------------------------------------------------------ */
/* Calendar periods                                                   */
/* ------------------------------------------------------------------ */

/**
 * The first day of the week `date` falls in.
 *
 * `weekStart` is a locale fact — `Intl.Locale.getWeekInfo().firstDay` — and
 * never a constant here, because "this week" is Sunday-to-Saturday in the
 * United States, Monday-to-Sunday across most of Europe, and Saturday-to-Friday
 * in much of the Middle East. A preset that quietly means the wrong seven days
 * is worse than no preset: it is a report that is off by two days and looks
 * right.
 */
export function startOfWeek(date: OxDate, weekStart = 0): OxDate {
  const into = (((weekdayOf(date) - weekStart) % 7) + 7) % 7;
  return addCalendarDays(date, -into);
}

/** The last day of the week `date` falls in. */
export function endOfWeek(date: OxDate, weekStart = 0): OxDate {
  return addCalendarDays(startOfWeek(date, weekStart), 6);
}

/** The first of the month `date` falls in. */
export function startOfMonth(date: OxDate): OxDate {
  return plainDate(date.y, date.m, 1);
}

/** The last day of the month `date` falls in — February aware, leap aware. */
export function endOfMonth(date: OxDate): OxDate {
  return plainDate(date.y, date.m, daysInMonth(date.y, date.m));
}

/** 1 January of the year `date` falls in. */
export function startOfYear(date: OxDate): OxDate {
  return plainDate(date.y, 1, 1);
}

/** 31 December of the year `date` falls in. */
export function endOfYear(date: OxDate): OxDate {
  return plainDate(date.y, 12, 31);
}

/* ------------------------------------------------------------------ */
/* Date ranges                                                        */
/* ------------------------------------------------------------------ */

/** A closed interval of whole days. Both ends are inclusive and selectable. */
export interface OxDateRange {
  start: OxDate | null;
  end: OxDate | null;
}

/**
 * Both ends in ascending order, whichever way round they were given.
 *
 * A range is built by two clicks and the second one is often earlier than the
 * first. Sorting at the boundary rather than at every read is what keeps
 * `rangeContains` and the band painter from each having their own opinion
 * about which end is which.
 */
export function normalizeDateRange(range: OxDateRange): OxDateRange {
  const { start, end } = range;
  if (!start || !end) return range;
  return compareDates(start, end) <= 0 ? range : { start: end, end: start };
}

/** Whether a range has both ends. An incomplete range is a legal state, not an error. */
export function isCompleteRange(range: OxDateRange | null | undefined): boolean {
  return Boolean(range?.start && range?.end);
}

/**
 * Days in a range, counting both ends.
 *
 * Inclusive because a date range in healthcare is a span of service — an
 * authorisation from the 1st to the 7th is seven days of care, not six. The
 * exclusive convention belongs to timestamps, and mixing the two is how a
 * week of treatment gets billed as six days.
 */
export function rangeDayCount(range: OxDateRange): number | null {
  const { start, end } = normalizeDateRange(range);
  if (!start || !end) return null;
  return toEpochDay(end) - toEpochDay(start) + 1;
}

/** Whether a date falls inside a range, both ends included. */
export function rangeContains(range: OxDateRange, date: OxDate): boolean {
  const { start, end } = normalizeDateRange(range);
  if (!start || !end) return false;
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0;
}

/** Whether two ranges describe the same two days. */
export function isSameRange(
  a: OxDateRange | null | undefined,
  b: OxDateRange | null | undefined,
): boolean {
  const left = a ? normalizeDateRange(a) : null;
  const right = b ? normalizeDateRange(b) : null;
  return isSameDate(left?.start, right?.start) && isSameDate(left?.end, right?.end);
}

/**
 * A named single date a reader can take in one press.
 *
 * The single-date counterpart of `DateRangePreset`, and the shape
 * `relativeDateOptions` already returns. Named as a type so a calendar's rail
 * can accept either without the host having to reverse-engineer the object.
 */
export interface DateShortcut {
  id: string;
  label: string;
  date: OxDate;
}

/** A named range a reader can take in one press. */
export interface DateRangePreset {
  id: string;
  label: string;
  start: OxDate;
  end: OxDate;
}

/**
 * The seven named periods that answer most range questions.
 *
 * Exported as data rather than rendered inside the calendar, for the same
 * reason as `relativeDateOptions`: a host drops the ones its field has no use
 * for — "This year" on a two-week authorisation window is noise — and
 * translates the words without forking the component.
 *
 * Every preset is derived from the `now` the host supplies. Nothing here reads
 * a clock, so "This month" is deterministic and a calendar renders identically
 * in March and in August, which is what makes the whole surface testable.
 */
export function dateRangePresets(
  now: OxDate,
  options: { weekStart?: number } = {},
): DateRangePreset[] {
  const weekStart = options.weekStart ?? 0;
  const yesterday = addCalendarDays(now, -1);
  const lastWeekDay = addCalendarDays(startOfWeek(now, weekStart), -1);
  const lastMonthDay = addCalendarDays(startOfMonth(now), -1);
  return [
    { id: "today", label: "Today", start: now, end: now },
    { id: "yesterday", label: "Yesterday", start: yesterday, end: yesterday },
    {
      id: "this-week",
      label: "This week",
      start: startOfWeek(now, weekStart),
      end: endOfWeek(now, weekStart),
    },
    {
      id: "last-week",
      label: "Last week",
      start: startOfWeek(lastWeekDay, weekStart),
      end: lastWeekDay,
    },
    { id: "this-month", label: "This month", start: startOfMonth(now), end: endOfMonth(now) },
    {
      id: "last-month",
      label: "Last month",
      start: startOfMonth(lastMonthDay),
      end: lastMonthDay,
    },
    { id: "this-year", label: "This year", start: startOfYear(now), end: endOfYear(now) },
  ];
}

/** The preset a range currently matches, or null when the reader built their own. */
export function matchRangePreset(
  range: OxDateRange | null | undefined,
  presets: readonly DateRangePreset[],
): DateRangePreset | null {
  if (!range?.start || !range.end) return null;
  return presets.find((preset) => isSameRange(range, preset)) ?? null;
}

/* ------------------------------------------------------------------ */
/* Times and durations                                                */
/* ------------------------------------------------------------------ */

export function minutesOfTime(t: OxTime): number {
  return t.h * 60 + t.mi;
}

/**
 * Minutes back to a time, plus how many days it crossed.
 *
 * The day offset is returned rather than swallowed, because "11:30 PM plus
 * ninety minutes" is a different appointment depending on whether the caller
 * notices it landed on tomorrow.
 */
export function timeFromMinutes(total: number): { time: OxTime; dayOffset: number } {
  const dayOffset = Math.floor(total / 1440);
  const rest = ((total % 1440) + 1440) % 1440;
  return { time: plainTime(Math.floor(rest / 60), rest % 60), dayOffset };
}

/* ------------------------------------------------------------------ */
/* Age                                                                */
/* ------------------------------------------------------------------ */

export interface TemporalAge {
  years: number;
  months: number;
  days: number;
  /** True when the date given is in the future — impossible for a birth date. */
  future: boolean;
}

/**
 * Age on a given day, which the caller supplies. There is no default `now`.
 *
 * Whole years is wrong below about two: a chart that reads "0 years old" for a
 * four-month-old has discarded the only number that mattered, and under four
 * weeks the unit that matters is days. `describeAgeLabel` picks the unit; this
 * returns all three so a host can pick differently.
 */
export function ageOn(dob: OxDate, now: OxDate): TemporalAge {
  const days = compareDates(now, dob);
  if (days < 0) return { years: 0, months: 0, days, future: true };

  let years = now.y - dob.y;
  if (now.m < dob.m || (now.m === dob.m && now.d < dob.d)) years -= 1;

  let months = (now.y - dob.y) * 12 + (now.m - dob.m);
  if (now.d < dob.d) months -= 1;

  return { years, months, days, future: false };
}

export function describeAgeLabel(age: TemporalAge): string {
  if (age.future) return "Not yet born";
  if (age.days < 28) return age.days === 1 ? "1 day old" : `${age.days} days old`;
  if (age.years < 2) return age.months === 1 ? "1 month old" : `${age.months} months old`;
  return age.years === 1 ? "1 year old" : `${age.years} years old`;
}

/* ------------------------------------------------------------------ */
/* Formatting                                                         */
/* ------------------------------------------------------------------ */

export type DateStyle = "iso" | "numeric" | "short" | "medium" | "long" | "full" | "weekday";

/** The order a locale writes a numeric date in. */
export type DateOrder = "MDY" | "DMY" | "YMD";

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const MONTH_NAMES = MONTH_LONG;
export const MONTH_ABBREVIATIONS = MONTH_SHORT;
export const WEEKDAY_NAMES = WEEKDAY_LONG;
export const WEEKDAY_ABBREVIATIONS = WEEKDAY_SHORT;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * English fallbacks. A deployment with a locale supplies `Intl`-derived names
 * through the component's props rather than translating this table — shipping
 * our own month names is how a library ends up with fourteen locales and a
 * backlog.
 */
export function formatPlainDate(date: OxDate, style: DateStyle = "medium"): string {
  const month = MONTH_SHORT[date.m - 1];
  switch (style) {
    case "iso":
      return `${date.y}-${pad2(date.m)}-${pad2(date.d)}`;
    case "numeric":
      return `${pad2(date.m)}/${pad2(date.d)}/${date.y}`;
    case "short":
      return `${month} ${date.d}`;
    case "long":
      return `${WEEKDAY_LONG[weekdayOf(date)]}, ${MONTH_LONG[date.m - 1]} ${date.d}`;
    case "full":
      return `${WEEKDAY_LONG[weekdayOf(date)]}, ${MONTH_LONG[date.m - 1]} ${date.d}, ${date.y}`;
    case "weekday":
      return `${WEEKDAY_SHORT[weekdayOf(date)]}, ${month} ${date.d}`;
    case "medium":
    default:
      return `${month} ${date.d}, ${date.y}`;
  }
}

export interface ClockFormatOptions {
  /** 24-hour rendering. The stored value is 24-hour either way. */
  hour24?: boolean;
  /** Render the seconds member when the value carries one. */
  showSecond?: boolean;
}

export function formatClockTime(t: OxTime, options: ClockFormatOptions = {}): string {
  const seconds = options.showSecond && t.s !== undefined ? `:${pad2(t.s)}` : "";
  if (options.hour24) return `${pad2(t.h)}:${pad2(t.mi)}${seconds}`;
  const hour = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${hour}:${pad2(t.mi)}${seconds} ${t.h < 12 ? "AM" : "PM"}`;
}

export interface DurationFormatOptions {
  /**
   * "3h", "45m", "1h 30m" — for a badge sitting inside a field, where the
   * words do not fit and the reader already knows they are looking at a length.
   * Everywhere a duration stands on its own, spell it: `hr` and `min` survive
   * being read aloud, and `1h 30m` does not.
   */
  compact?: boolean;
}

/** "53 min", "1 hr", "1 hr 30 min" — the words a schedule actually uses. */
export function formatDuration(minutes: number, options: DurationFormatOptions = {}): string {
  const negative = minutes < 0;
  const total = Math.abs(Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const body = options.compact
    ? h === 0
      ? `${m}m`
      : m === 0
        ? `${h}h`
        : `${h}h ${m}m`
    : h === 0
      ? `${m} min`
      : m === 0
        ? `${h} hr`
        : `${h} hr ${m} min`;
  return negative ? `-${body}` : body;
}

/* ------------------------------------------------------------------ */
/* Time ranges                                                        */
/* ------------------------------------------------------------------ */

/** A start and an end time of day. Both ends are the times themselves, not a duration. */
export interface OxTimeRange {
  start: OxTime | null;
  end: OxTime | null;
}

/**
 * The length of a time range in minutes, or null while it is incomplete.
 *
 * An end that is earlier than its start is an overnight span when the caller
 * allows one — a night shift, an inpatient observation window — and a negative
 * number when it does not. Returning the negative rather than clamping to zero
 * is deliberate: the field reports "ends before it starts" and offers a
 * correction, which is information a clamp destroys.
 */
export function timeRangeMinutes(
  range: OxTimeRange,
  options: { allowOvernight?: boolean } = {},
): number | null {
  const { start, end } = range;
  if (!start || !end) return null;
  const span = minutesOfTime(end) - minutesOfTime(start);
  if (span > 0) return span;
  if (span === 0) return options.allowOvernight ? 1440 : 0;
  return options.allowOvernight ? span + 1440 : span;
}

/**
 * A relative label, as a reading aid and never as the value.
 *
 * CONTENT.md: the absolute date is always rendered too. "5 days ago" in a legal
 * record is not a date, and the thresholds below are a clinical judgement
 * rather than a locale one — which is why they live here and not in `Intl`.
 */
export function describeRelativeDay(date: OxDate, now: OxDate): string {
  const n = compareDates(date, now);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return `In ${n} days`;
  if (n < -1 && n > -7) return `${-n} days ago`;
  if (n >= 7 && n < 14) return "Next week";
  if (n <= -7 && n > -14) return "Last week";
  if (n >= 14) return `In ${Math.round(n / 7)} weeks`;
  return `${Math.round(-n / 7)} weeks ago`;
}

/* ------------------------------------------------------------------ */
/* Parsing                                                            */
/* ------------------------------------------------------------------ */

export interface DateParseOptions {
  order?: DateOrder;
  /**
   * Two-digit years above this resolve to the 1900s, at or below to the 2000s.
   *
   * The sharpest edge in a date-of-birth field, and the reason it is a stated
   * constant rather than an inference: `62` is 1962 for a patient and 2062 for
   * nobody, while `15` is 2015 for a paediatric intake and 1915 for a
   * centenarian. A window that slides with the current year would also make
   * the same keystrokes mean different things in different years.
   */
  twoDigitYearPivot?: number;
}

/**
 * Eight digits, or six with the pivot applied. Anything else is rejected.
 *
 * Seven digits is genuinely ambiguous and returns `null` rather than a guess,
 * because a plausible wrong date in a clinical field is worse than an empty one.
 */
export function parseDateDigits(input: string, options: DateParseOptions = {}): OxDate | null {
  const digits = (input ?? "").replace(/\D/g, "");
  const order = options.order ?? "MDY";
  const pivot = options.twoDigitYearPivot ?? 30;

  let y: number;
  let m: number;
  let d: number;

  if (digits.length === 8) {
    if (order === "YMD") {
      y = Number(digits.slice(0, 4));
      m = Number(digits.slice(4, 6));
      d = Number(digits.slice(6, 8));
    } else if (order === "DMY") {
      d = Number(digits.slice(0, 2));
      m = Number(digits.slice(2, 4));
      y = Number(digits.slice(4, 8));
    } else {
      m = Number(digits.slice(0, 2));
      d = Number(digits.slice(2, 4));
      y = Number(digits.slice(4, 8));
    }
  } else if (digits.length === 6) {
    const yy = Number(digits.slice(4, 6));
    y = yy > pivot ? 1900 + yy : 2000 + yy;
    if (order === "DMY") {
      d = Number(digits.slice(0, 2));
      m = Number(digits.slice(2, 4));
    } else if (order === "YMD") {
      return null; // YY-MM-DD is not a form anybody types deliberately.
    } else {
      m = Number(digits.slice(0, 2));
      d = Number(digits.slice(2, 4));
    }
  } else {
    return null;
  }

  return isValidDate(y, m, d) ? plainDate(y, m, d) : null;
}

export interface ParsedTime {
  time: OxTime;
  /**
   * True when a 1–12 hour was typed in a 12-hour locale with no meridiem.
   *
   * Resolving it silently is how a 9 PM discharge becomes a 9 AM one. The
   * caller is told and decides; the field keeps the meridiem segment unfilled
   * and the value incomplete.
   */
  ambiguous: boolean;
}

/** `930a`, `0930`, `9:30 pm`, `14:05`, `9p` — everything a fast typist produces. */
export function parseClockTime(
  input: string,
  options: { hour24?: boolean } = {},
): ParsedTime | null {
  const raw = String(input ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return null;

  let meridiem: "am" | "pm" | null = null;
  if (/p\.?m?\.?$/.test(raw)) meridiem = "pm";
  else if (/a\.?m?\.?$/.test(raw)) meridiem = "am";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let h: number;
  let mi: number;
  let s: number | undefined;

  if (digits.length <= 2) {
    h = Number(digits);
    mi = 0;
  } else if (digits.length === 3) {
    h = Number(digits.slice(0, 1));
    mi = Number(digits.slice(1, 3));
  } else if (digits.length === 4) {
    h = Number(digits.slice(0, 2));
    mi = Number(digits.slice(2, 4));
  } else if (digits.length === 6) {
    h = Number(digits.slice(0, 2));
    mi = Number(digits.slice(2, 4));
    s = Number(digits.slice(4, 6));
  } else {
    return null;
  }

  if (mi > 59 || (s !== undefined && s > 59)) return null;

  if (meridiem === "pm" && h < 12) h += 12;
  if (meridiem === "am" && h === 12) h = 0;

  if (meridiem === null && !options.hour24 && h >= 1 && h <= 12) {
    return { time: plainTime(h % 12, mi, s), ambiguous: true };
  }
  if (h > 23) return null;
  return { time: plainTime(h, mi, s), ambiguous: false };
}

/* ------------------------------------------------------------------ */
/* Month grid                                                         */
/* ------------------------------------------------------------------ */

export interface MonthRef {
  y: number;
  /** 1–12. */
  m: number;
}

export interface CalendarCell {
  date: OxDate;
  /** False for the leading and trailing days of the adjacent months. */
  inMonth: boolean;
}

/**
 * Six weeks, always.
 *
 * A grid that is five rows in one month and six in the next moves every
 * control below it, and a user reaching for "Next" finds the footer where the
 * last row used to be. The cost is one row of adjacent-month days.
 */
export function buildMonthGrid(month: MonthRef, weekStart = 0): CalendarCell[] {
  const first = plainDate(month.y, month.m, 1);
  const lead = (weekdayOf(first) - weekStart + 7) % 7;
  const start = addCalendarDays(first, -lead);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = addCalendarDays(start, i);
    cells.push({ date, inMonth: date.m === month.m && date.y === month.y });
  }
  return cells;
}

/** Weekday indices in display order for a locale's week start. */
export function weekdayOrder(weekStart = 0): number[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => (i + weekStart) % 7);
}

/* ------------------------------------------------------------------ */
/* The session algebra                                                */
/* ------------------------------------------------------------------ */

/** Which of end and duration the user asserted, and which is derived. */
export type SessionHold = "duration" | "end";

export interface SessionInterval {
  start: OxTime;
  end: OxTime;
  /** 1 when the end falls on the next day. Crossing midnight is a value. */
  endDayOffset: 0 | 1;
  durationMin: number;
  hold: SessionHold;
  /** The bound the derived duration was checked against. */
  maxMin: number;
  /** True when the derived duration exceeded `maxMin`. Never silently clamped. */
  exceedsMax?: boolean;
  /**
   * The likeliest correction when `exceedsMax` — usually the other meridiem.
   * Offered, never applied.
   */
  suggestedEnd?: OxTime;
}

export interface SessionOptions {
  /**
   * Upper bound on a derived duration. Eight hours by default: long enough for
   * a residential block, short enough that dragging a start past a held end
   * cannot silently produce a twenty-two-hour therapy session.
   */
  maxMin?: number;
  /**
   * Whether an end at or before the start is read as crossing midnight.
   * True by default — a crisis line and a residential unit both need it, and
   * refusing it teaches staff to type the wrong date to get past the validator.
   */
  allowOvernight?: boolean;
}

const DEFAULT_MAX_MIN = 480;

/**
 * Three values, two degrees of freedom, and one explicit driver.
 *
 * The whole design problem is which member is derived. A triple that silently
 * recomputes is the most common defect in scheduling UI: the user asserted one
 * of the three, and which one survives the next edit is information they
 * otherwise have to discover by experiment. `hold` is that information, it is
 * state rather than inference, and the component renders it.
 */
function deriveSession(input: {
  start: OxTime;
  end?: OxTime;
  endDayOffset?: number;
  durationMin?: number;
  hold: SessionHold;
  maxMin: number;
  allowOvernight: boolean;
}): SessionInterval {
  const startMin = minutesOfTime(input.start);

  if (input.hold === "duration") {
    const duration = Math.max(0, Math.round(input.durationMin ?? 0));
    const landed = timeFromMinutes(startMin + duration);
    return {
      start: input.start,
      end: landed.time,
      endDayOffset: landed.dayOffset > 0 ? 1 : 0,
      durationMin: duration,
      hold: "duration",
      maxMin: input.maxMin,
    };
  }

  const end = input.end ?? input.start;
  const endMin = minutesOfTime(end) + (input.endDayOffset ?? 0) * 1440;
  let duration = endMin - startMin;
  if (duration <= 0) {
    if (!input.allowOvernight) duration = 0;
    else duration += 1440;
  }

  const result: SessionInterval = {
    start: input.start,
    end,
    endDayOffset: (startMin + duration >= 1440 ? 1 : 0) as 0 | 1,
    durationMin: duration,
    hold: "end",
    maxMin: input.maxMin,
  };

  if (duration > input.maxMin) {
    result.exceedsMax = true;
    // The likeliest intent when a start is dragged past a held end: the end
    // was meant to be the other half of the day.
    const alternative = minutesOfTime(end) + 720;
    if (alternative > startMin && alternative - startMin <= input.maxMin) {
      result.suggestedEnd = timeFromMinutes(alternative).time;
    }
  }
  return result;
}

export function sessionFrom(
  start: OxTime,
  durationMin: number,
  options: SessionOptions = {},
): SessionInterval {
  return deriveSession({
    start,
    durationMin,
    hold: "duration",
    maxMin: options.maxMin ?? DEFAULT_MAX_MIN,
    allowOvernight: options.allowOvernight ?? true,
  });
}

/**
 * Moving the start keeps whatever the user asserted.
 *
 * Hold duration and the session slides; hold end and it stretches. Both are
 * correct, only one can be the default, and the badge is why the user is not
 * left guessing which they got.
 */
export function withSessionStart(
  session: SessionInterval,
  start: OxTime,
  options: SessionOptions = {},
): SessionInterval {
  return deriveSession({
    start,
    end: session.end,
    endDayOffset: session.endDayOffset,
    durationMin: session.durationMin,
    hold: session.hold,
    maxMin: options.maxMin ?? session.maxMin,
    allowOvernight: options.allowOvernight ?? true,
  });
}

export function withSessionEnd(
  session: SessionInterval,
  end: OxTime,
  options: SessionOptions = {},
): SessionInterval {
  const allowOvernight = options.allowOvernight ?? true;
  const startMin = minutesOfTime(session.start);
  const endMin = minutesOfTime(end);
  return deriveSession({
    start: session.start,
    end,
    // The crossing is only assumed where the workflow permits one. Setting
    // the offset first and asking afterwards makes `allowOvernight: false`
    // silently ineffective, because a pre-shifted end never reaches the
    // non-positive branch that would have caught it.
    endDayOffset: allowOvernight && endMin <= startMin ? 1 : 0,
    hold: "end",
    maxMin: options.maxMin ?? session.maxMin,
    allowOvernight,
  });
}

export function withSessionDuration(
  session: SessionInterval,
  durationMin: number,
  options: SessionOptions = {},
): SessionInterval {
  return deriveSession({
    start: session.start,
    durationMin,
    hold: "duration",
    maxMin: options.maxMin ?? session.maxMin,
    allowOvernight: options.allowOvernight ?? true,
  });
}

/* ------------------------------------------------------------------ */
/* Duration bands                                                     */
/* ------------------------------------------------------------------ */

/**
 * A band a duration falls in, supplied by the organisation.
 *
 * The component renders the band a value lands in and asserts nothing. ADR
 * 0009 prohibits a component deriving a clinical or coding recommendation, and
 * the thresholds differ by payer, by contract and by year — so they are data.
 */
export interface DurationBand {
  minMinutes: number;
  maxMinutes: number;
  /** The organisation's own code, or null for a band that is not billable. */
  code: string | null;
  label: string;
}

export function bandFor(minutes: number, bands: readonly DurationBand[]): DurationBand | null {
  for (const band of bands) {
    if (minutes >= band.minMinutes && minutes <= band.maxMinutes) return band;
  }
  return null;
}

/** A duration the organisation offers as a chip. */
export interface DurationPreset {
  minutes: number;
  /** The workflow word — "Therapy", "Med follow-up". "45m" alone helps less. */
  label?: string;
}

/* ------------------------------------------------------------------ */
/* Zones                                                              */
/* ------------------------------------------------------------------ */

/**
 * The zone's fields for an instant, read from the platform's own IANA data.
 *
 * `Intl` is the only correct source here. Shipping an offset table is wrong the
 * first time a government moves a transition — and one does, somewhere, most
 * years — and the failure is silent for everybody outside that country.
 */
interface ZonedFields {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

function fieldsInZone(zone: string, epochMs: number): ZonedFields | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(epochMs));

    const read = (type: string) => {
      const found = parts.find((part) => part.type === type);
      return found ? Number(found.value) : Number.NaN;
    };
    const hour = read("hour");
    const fields: ZonedFields = {
      y: read("year"),
      m: read("month"),
      d: read("day"),
      // `hour12: false` still yields 24 for midnight in some engines.
      h: hour === 24 ? 0 : hour,
      mi: read("minute"),
      s: read("second"),
    };
    return Object.values(fields).some(Number.isNaN) ? null : fields;
  } catch {
    return null;
  }
}

function asUtcMs(date: OxDate, time: OxTime): number {
  return Date.UTC(date.y, date.m - 1, date.d, time.h, time.mi, time.s ?? 0);
}

function fieldsToUtcMs(fields: ZonedFields): number {
  return Date.UTC(fields.y, fields.m - 1, fields.d, fields.h, fields.mi, fields.s);
}

/** Offset of `zone` at an absolute instant, in minutes east of UTC. */
function offsetAtInstant(zone: string, epochMs: number): number | null {
  const fields = fieldsInZone(zone, epochMs);
  if (!fields) return null;
  return Math.round((fieldsToUtcMs(fields) - epochMs) / 60000);
}

/**
 * Every instant that renders as this exact local time in this zone.
 *
 * Two, once a year, on the night the clocks go back. **Zero**, once a year, on
 * the night they go forward — and that is the case an offset probe cannot see,
 * because asking "what is the offset at 2:30 AM" returns a number for a time
 * that never happened. The fix is to round-trip: convert the candidate back to
 * the zone's own fields and require them to match what was asked for.
 */
function instantsForLocal(zone: string, date: OxDate, time: OxTime): number[] {
  const naive = asUtcMs(date, time);
  const day = 86400000;

  // Probe a day either side as well as the naive instant. One probe is enough
  // to find a spring-forward gap but not a fall-back repeat: on the night the
  // clocks go back, both candidate offsets are in force within the same hour,
  // and probing only from the naive instant lands on one of them and never
  // sees the other. The two outer probes bracket any transition in the day.
  const offsets = new Set<number>();
  for (const probe of [naive - day, naive, naive + day]) {
    const offset = offsetAtInstant(zone, probe);
    if (offset !== null) offsets.add(offset);
  }
  if (offsets.size === 0) return [];

  const candidates = new Set<number>();
  for (const offset of offsets) candidates.add(naive - offset * 60000);

  const valid: number[] = [];
  for (const candidate of candidates) {
    const fields = fieldsInZone(zone, candidate);
    if (!fields) continue;
    if (fieldsToUtcMs(fields) === naive) valid.push(candidate);
  }
  return valid.sort((a, b) => a - b);
}

/**
 * The offset that applies to a local wall-clock time in a zone, in minutes.
 *
 * Minutes rather than hours throughout, because India, Nepal, Chatham Island
 * and Lord Howe are not on hour boundaries and every "offset in hours" API
 * eventually meets one of them. Returns null when the runtime does not know
 * the zone, so a caller renders clinic time alone rather than a converted lie.
 */
export function zoneOffsetMinutes(zone: string, date: OxDate, time: OxTime): number | null {
  const [first] = instantsForLocal(zone, date, time);
  if (first !== undefined) return offsetAtInstant(zone, first);
  // A non-existent local time still has a defensible offset for arithmetic —
  // the one in force just before the gap. `classifyLocalTime` is what a caller
  // should ask when the distinction matters.
  return offsetAtInstant(zone, asUtcMs(date, time));
}

export type DisambiguationPolicy = "reject" | "earlier" | "later" | "compatible";

export type ZoneVerdict =
  /** The ordinary case: the local time happens exactly once. */
  | { kind: "ok"; offsetMinutes: number }
  /** Spring forward: the local time does not exist on that date. */
  | { kind: "nonexistent"; skippedMinutes: number }
  /** Fall back: the local time happens twice, an hour apart. */
  | { kind: "ambiguous"; earlierOffset: number; laterOffset: number }
  | { kind: "unknown-zone" };

/**
 * Whether a local time exists once, twice, or not at all in a zone.
 *
 * This reports rather than resolves, because the same non-existent time means
 * different things to different fields. Scheduling should refuse 2:30 AM on a
 * spring-forward Sunday and offer 3:30; documentation must treat it as a hard
 * error, because it could not have happened. And a medication given at 1:30 AM
 * on a fall-back night is an hour of ambiguity in a controlled-substance record
 * unless somebody is asked which one — so the two offsets are both returned.
 */
export function classifyLocalTime(zone: string, date: OxDate, time: OxTime): ZoneVerdict {
  const instants = instantsForLocal(zone, date, time);
  const [earliest] = instants;
  const latest = instants.length > 0 ? instants[instants.length - 1] : undefined;

  if (instants.length === 1 && earliest !== undefined) {
    const offset = offsetAtInstant(zone, earliest);
    return offset === null ? { kind: "unknown-zone" } : { kind: "ok", offsetMinutes: offset };
  }

  if (instants.length > 1 && earliest !== undefined && latest !== undefined) {
    const earlierOffset = offsetAtInstant(zone, earliest);
    const laterOffset = offsetAtInstant(zone, latest);
    if (earlierOffset === null || laterOffset === null) return { kind: "unknown-zone" };
    return { kind: "ambiguous", earlierOffset, laterOffset };
  }

  const before = offsetAtInstant(zone, asUtcMs(date, plainTime(0, 0)) - 86400000);
  const after = offsetAtInstant(zone, asUtcMs(addCalendarDays(date, 1), plainTime(0, 0)));
  if (before === null || after === null) return { kind: "unknown-zone" };
  return { kind: "nonexistent", skippedMinutes: Math.max(0, after - before) };
}

/**
 * The same instant, as a wall clock in another zone.
 *
 * Converts through the absolute instant rather than by subtracting two offsets
 * taken at the same local fields — the shortcut is off by an hour whenever the
 * two zones transition on different dates, which for the United States and the
 * European Union is three weeks of every March.
 */
export function describeZoneShift(
  instant: OxInstant,
  viewerZone: string,
): { local: OxTime; date: OxDate; sameZone: boolean } | null {
  if (instant.zone === viewerZone) {
    return { local: instant.time, date: instant.date, sameZone: true };
  }
  const [candidate] = instantsForLocal(instant.zone, instant.date, instant.time);
  const epochMs = candidate ?? asUtcMs(instant.date, instant.time);
  const fields = fieldsInZone(viewerZone, epochMs);
  if (!fields) return null;
  return {
    date: plainDate(fields.y, fields.m, fields.d),
    local: plainTime(fields.h, fields.mi),
    sameZone: false,
  };
}

/* ------------------------------------------------------------------ */
/* ISO interchange                                                    */
/* ------------------------------------------------------------------ */

/**
 * Parses the FHIR `date` forms — `YYYY`, `YYYY-MM`, `YYYY-MM-DD`.
 *
 * A partial form returns a partial value rather than being padded to the first
 * of the month, which is the whole reason `OxPartialDate` exists.
 */
export function fromIsoDate(value: string): OxDate | OxPartialDate | null {
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (full) {
    const [y, m, d] = [Number(full[1]), Number(full[2]), Number(full[3])];
    return isValidDate(y, m, d) ? plainDate(y, m, d) : null;
  }
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) {
    const m = Number(month[2]);
    return m >= 1 && m <= 12 ? { kind: "partial-date", y: Number(month[1]), m } : null;
  }
  const year = /^(\d{4})$/.exec(value);
  if (year) return { kind: "partial-date", y: Number(year[1]) };
  return null;
}

export function toIsoDate(value: OxDate | OxPartialDate): string {
  if (value.kind === "date") return formatPlainDate(value, "iso");
  if (value.m === undefined) return String(value.y);
  if (value.d === undefined) return `${value.y}-${pad2(value.m)}`;
  return `${value.y}-${pad2(value.m)}-${pad2(value.d)}`;
}

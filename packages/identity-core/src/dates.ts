/**
 * Dates and ages, rendered so they cannot be read two ways.
 *
 * Two rules govern this file:
 *
 *   - **Never all-numeric.** `08/03/1985` is 3 August in Delhi and 8 March in
 *     Denver. A date of birth is one of the two identifiers used to confirm a
 *     human being; it cannot mean two things.
 *   - **Never widen precision.** A FHIR date of `1985-03` means March, not the
 *     1st of March. Rendering the day invents a fact.
 */

import { datePrecision } from "@zoblocks/fhir";
import type { Age, PreciseDate } from "./types.js";

const MONTHS_SHORT = [
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
];
const MONTHS_LONG = [
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
];

/**
 * Parse a FHIR `date` or `dateTime` into its precision and both renderings.
 *
 * Returns `undefined` for an unparseable value rather than guessing. A banner
 * that renders a malformed date as a plausible one is worse than a banner that
 * says the date is missing.
 */
export function precise(value: string | undefined): PreciseDate | undefined {
  if (!value) return undefined;
  const precision = datePrecision(value);
  if (!precision) return undefined;

  const m = /^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(value);
  if (!m) return undefined;

  const year = m[1];
  const monthRaw = m[2];
  const dayRaw = m[3];
  if (!year) return undefined;

  if (!monthRaw) {
    return { value, precision, text: year, spoken: year };
  }

  const mi = Number(monthRaw) - 1;
  const short = MONTHS_SHORT[mi];
  const long = MONTHS_LONG[mi];
  if (short === undefined || long === undefined) return undefined;

  if (!dayRaw) {
    return { value, precision, text: `${short} ${year}`, spoken: `${long} ${year}` };
  }

  const day = Number(dayRaw);
  return {
    value,
    precision,
    // Two digits, so a column of dates aligns and `08` cannot be misread as a
    // month by someone scanning quickly.
    text: `${String(day).padStart(2, "0")} ${short} ${year}`,
    spoken: `${day} ${long} ${year}`,
  };
}

/** A calendar day in UTC. The month is zero-based, as `Date` has it. */
interface Day {
  y: number;
  m: number;
  d: number;
}

const dayOf = (date: Date): Day => ({
  y: date.getUTCFullYear(),
  m: date.getUTCMonth(),
  d: date.getUTCDate(),
});

const isBefore = (a: Day, b: Day): boolean =>
  a.y !== b.y ? a.y < b.y : a.m !== b.m ? a.m < b.m : a.d < b.d;

const wholeYears = (born: Day, on: Day): number =>
  on.y - born.y - (on.m < born.m || (on.m === born.m && on.d < born.d) ? 1 : 0);

const wholeMonths = (born: Day, on: Day): number =>
  (on.y - born.y) * 12 + (on.m - born.m) - (on.d < born.d ? 1 : 0);

/**
 * The oldest and youngest the patient can be, as birthdays, on `on`.
 *
 * `1985-03` is some day in March: as old as a 1 March birth, as young as a
 * 31 March one. Reading it as 1 January aged people up to a year early. The
 * youngest bound is cut at `on`, since nobody is born after today. Returns
 * `undefined` when the whole window is in the future or the month is not one.
 */
function birthWindow(
  birth: string,
  on: Day,
): { oldest: Day; youngest: Day; exact: boolean } | undefined {
  const r = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/.exec(birth);
  if (!r) return undefined;
  const y = Number(r[1]);
  const m = Number(r[2] ?? 1) - 1;

  let oldest: Day;
  let youngest: Day;
  if (r[3] !== undefined) {
    oldest = youngest = { y, m, d: Number(r[3]) };
  } else if (r[2] === undefined) {
    oldest = { y, m: 0, d: 1 };
    youngest = { y, m: 11, d: 31 };
  } else {
    if (m < 0 || m > 11) return undefined;
    oldest = { y, m, d: 1 };
    youngest = { y, m, d: new Date(Date.UTC(y, m + 1, 0)).getUTCDate() };
  }

  if (isBefore(on, oldest)) return undefined;
  return { oldest, youngest: isBefore(on, youngest) ? on : youngest, exact: r[3] !== undefined };
}

/**
 * Whole years between two dates, floor. Returns `undefined` when the birth date
 * is unparseable or in the future.
 *
 * For a partial date this is the fewest years the date allows. A number cannot
 * carry a range, and an age that is too low by one is the safer error than an
 * adult threshold crossed early.
 */
export function yearsBetween(birth: string | undefined, asOf: Date): number | undefined {
  if (!birth) return undefined;
  const on = dayOf(asOf);
  const window = birthWindow(birth, on);
  return window && wholeYears(window.youngest, on);
}

/** Whole days between two dates, floor. */
function daysBetween(birth: string, asOf: Date): number | undefined {
  const t = Date.parse(birth.length <= 10 ? `${birth}T00:00:00Z` : birth);
  if (Number.isNaN(t)) return undefined;
  return Math.floor((asOf.getTime() - t) / 86_400_000);
}

/**
 * Age with the precision the reader needs, and the moment it was computed.
 *
 * Neonatal precision is not cosmetic. Weight-based dosing for a two-week-old
 * and a twenty-month-old differ by an order of magnitude, and both render as
 * "0 y" under the obvious implementation. Days below four weeks, weeks below
 * three months, months below two years, years after that.
 *
 * When the subject is deceased the value is age *at death* and stops advancing.
 *
 * A partial birth date renders a range whenever its window straddles a
 * boundary: `1985` is `40–41 y` until New Year's Eve, `2025` is `7–19 mo`.
 * The unit follows the oldest the patient can be, except that anyone who may
 * still be under two stays in months — the dosing reason above.
 */
export function resolveAge(
  birthDate: string | undefined,
  asOf: Date,
  deceasedOn?: string,
): Age | undefined {
  if (!birthDate) return undefined;
  const atDeath = deceasedOn !== undefined;
  const reference = atDeath
    ? new Date(Date.parse(deceasedOn.length <= 10 ? `${deceasedOn}T00:00:00Z` : deceasedOn))
    : asOf;
  if (Number.isNaN(reference.getTime())) return undefined;

  const on = dayOf(reference);
  const window = birthWindow(birthDate, on);
  if (!window) return undefined;
  const { oldest, youngest } = window;

  const range = (lo: number, hi: number, unit: string): string =>
    hi > lo ? `${lo}–${hi} ${unit}` : `${lo} ${unit}`;
  const daysSince = (born: Day): number =>
    Math.floor((reference.getTime() - Date.UTC(born.y, born.m, born.d)) / 86_400_000);

  // An exact date keeps its time of birth, which matters on the first day.
  const exactDays = window.exact ? daysBetween(birthDate, reference) : undefined;
  const days: [number, number] | undefined = window.exact
    ? exactDays === undefined
      ? undefined
      : [exactDays, exactDays]
    : [daysSince(youngest), daysSince(oldest)];

  let text: string;
  if (days && days[1] < 28) {
    text = range(Math.max(0, days[0]), Math.max(0, days[1]), "d");
  } else if (days && days[1] < 91) {
    text = range(Math.floor(days[0] / 7), Math.floor(days[1] / 7), "wk");
  } else if (wholeYears(youngest, on) < 2) {
    text = range(Math.max(0, wholeMonths(youngest, on)), wholeMonths(oldest, on), "mo");
  } else {
    text = range(wholeYears(youngest, on), wholeYears(oldest, on), "y");
  }

  return { text, asOf: asOf.toISOString(), atDeath };
}

/** True when `value` is after `asOf`. A future date of birth is a data defect. */
export function isFuture(value: string | undefined, asOf: Date): boolean {
  if (!value) return false;
  const t = Date.parse(value.length <= 10 ? `${value}T00:00:00Z` : value);
  return !Number.isNaN(t) && t > asOf.getTime();
}

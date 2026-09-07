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

/**
 * Whole years between two dates, floor. Returns `undefined` when the birth date
 * is unparseable or in the future.
 */
export function yearsBetween(birth: string | undefined, asOf: Date): number | undefined {
  if (!birth) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birth);
  const y = /^(\d{4})/.exec(birth);
  if (!y?.[1]) return undefined;

  const by = Number(y[1]);
  const bm = m?.[2] ? Number(m[2]) - 1 : 0;
  const bd = m?.[3] ? Number(m[3]) : 1;

  let years = asOf.getUTCFullYear() - by;
  const monthDiff = asOf.getUTCMonth() - bm;
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getUTCDate() < bd)) years -= 1;
  return years < 0 ? undefined : years;
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

  const days = daysBetween(birthDate, reference);
  const years = yearsBetween(birthDate, reference);
  if (years === undefined) return undefined;

  const stamp = asOf.toISOString();
  let text: string;

  if (days !== undefined && days < 28) {
    text = `${Math.max(0, days)} d`;
  } else if (days !== undefined && days < 91) {
    text = `${Math.floor(days / 7)} wk`;
  } else if (years < 2) {
    const bm = /^(\d{4})-(\d{2})/.exec(birthDate);
    const by = Number(bm?.[1] ?? 0);
    const bmo = Number(bm?.[2] ?? 1) - 1;
    const bd = Number(/^\d{4}-\d{2}-(\d{2})/.exec(birthDate)?.[1] ?? 1);
    let months = (reference.getUTCFullYear() - by) * 12 + (reference.getUTCMonth() - bmo);
    if (reference.getUTCDate() < bd) months -= 1;
    text = `${Math.max(0, months)} mo`;
  } else {
    text = `${years} y`;
  }

  return { text, asOf: stamp, atDeath };
}

/** True when `value` is after `asOf`. A future date of birth is a data defect. */
export function isFuture(value: string | undefined, asOf: Date): boolean {
  if (!value) return false;
  const t = Date.parse(value.length <= 10 ? `${value}T00:00:00Z` : value);
  return !Number.isNaN(t) && t > asOf.getTime();
}

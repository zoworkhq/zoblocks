// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/clock.ts. Edit that file, not this one.
/**
 * One date format, shared by every component that has to say "until when".
 *
 * It lives in its own module rather than in `lib/utils` for a reason worth
 * writing down: inside the docs app `@/lib/utils` resolves to the *app's*
 * utils, not the registry's. The two happen to agree on `cn`, so nothing has
 * ever noticed — but a second export added on one side is missing on the
 * other, and the failure is a build error in the preview only, long after the
 * unit tests are green.
 *
 * No React, no DOM, no locale service.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * An ISO timestamp as a clock time, read from the string as written.
 *
 * Deliberately not `Date` plus `toLocaleTimeString`. A rota, a hold and a
 * precaution are published in the hospital's local time, and a browser in
 * another timezone that renders "night coverage until 03:30" has changed the
 * fact rather than the presentation. The written offset is the record's own,
 * so the wall-clock digits in the string are the ones the ward needs.
 *
 * When `now` is supplied and the timestamp falls on another day, the day is
 * said too: "until 07:00" on a window that ends tomorrow morning is the
 * sentence that sends somebody home twelve hours early.
 *
 * Anything that is not an ISO timestamp comes back unchanged, so a host that
 * already passes "07:00" or "end of shift" keeps it.
 */
export function clockTime(value: string, now?: string): string {
  const at = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!at) return value;

  const [, year, month, day, hour, minute] = at as unknown as string[];
  const time = `${hour}:${minute}`;
  if (!now) return time;

  const today = /^(\d{4})-(\d{2})-(\d{2})/.exec(now);
  if (today && today[1] === year && today[2] === month && today[3] === day) return time;

  const name = MONTHS[Number(month) - 1];
  return name ? `${time} on ${Number(day)} ${name}` : time;
}

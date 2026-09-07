/**
 * The availability engine: slots, holds, buffers and conflicts.
 *
 * **Nothing here fetches.** ADR 0009 forbids component source calling the
 * network, and that constraint turns out to be the correct architecture
 * anyway: availability is *data with an age*, and a component that loads its
 * own hides that age from the application that has to reconcile it. So an
 * `AvailabilitySet` arrives as a prop, carries the instant it was true at, and
 * every transition is reported back through a callback the host owns.
 *
 * Three rules follow from that, and each one is the difference between a
 * scheduling surface people trust and one they work around.
 *
 * **The server is authoritative and may always say no.** `rejected` therefore
 * carries alternatives, because a lost slot has to be a choice rather than an
 * error message that sends somebody back to the start of the task.
 *
 * **Buffers are part of the interval, never special-cased.** They are added
 * before an overlap is tested, so there is exactly one definition of "these
 * two collide" and it cannot drift between the grid and the save.
 *
 * **Half-open intervals, always.** `[start, end)`. Two sessions that touch do
 * not overlap, which is the only reason back-to-back booking works at all.
 */

import {
  addCalendarDays,
  compareDates,
  formatClockTime,
  minutesOfTime,
  timeFromMinutes,
  weekdayOf,
  type ZbDate,
  type ZbTime,
} from "@/lib/zoblocks-datetime";

/* ------------------------------------------------------------------ */
/* Slots                                                              */
/* ------------------------------------------------------------------ */

/**
 * Why a slot cannot be taken.
 *
 * A closed vocabulary rather than free text, because the reason drives both
 * the accessible name and what the host is allowed to offer next — and a
 * scheduler that renders "unavailable" for all five has thrown away the only
 * thing a user could act on.
 */
export type SlotBlockReason =
  "booked" | "provider-unavailable" | "facility-closed" | "no-room" | "outside-hours" | "too-short";

export const SLOT_BLOCK_WORDS: Record<SlotBlockReason, string> = {
  booked: "already booked",
  "provider-unavailable": "clinician unavailable",
  "facility-closed": "facility closed",
  "no-room": "no room available",
  "outside-hours": "outside working hours",
  "too-short": "not long enough for this appointment",
};

/**
 * What a slot is doing right now.
 *
 * `held` is the one worth naming separately from `booked`: somebody else's
 * reservation expires, and a grid that renders the two identically tells a
 * user to give up on a time that will be free in four minutes.
 */
export type SlotState =
  | { kind: "free" }
  | { kind: "held"; by: "me" | "other"; expiresInSeconds: number }
  | { kind: "blocked"; reason: SlotBlockReason }
  | { kind: "selecting" }
  | { kind: "confirming" }
  | { kind: "booked" };

export interface Slot {
  /** Stable across a refresh, so a selection survives new availability. */
  id: string;
  start: ZbTime;
  durationMinutes: number;
  state: SlotState;
}

/** Somebody else's appointment, for conflict detection. */
export interface BusyInterval {
  start: ZbTime;
  durationMinutes: number;
  label?: string;
}

/**
 * Minutes reserved around a session that are not the session.
 *
 * Organisation configuration, never a field on an appointment form: exposing
 * buffer per booking gives every front-desk user the ability to break the
 * clinic's own schedule policy one appointment at a time.
 */
export interface Buffers {
  before?: number;
  after?: number;
}

/**
 * Availability as it was at a moment, which is the only way it is ever true.
 *
 * `asOf` is rendered rather than hidden, and `exhausted` distinguishes "this
 * clinician has nothing" from "we stopped looking after thirty days" — two
 * different sentences with two different next actions.
 */
export interface AvailabilitySet {
  /** The instant the host read this. Shown when it goes stale. */
  asOf: { date: ZbDate; time: ZbTime };
  /** Seconds after which the set is presented as stale rather than replaced. */
  staleAfterSeconds?: number;
  slots: Slot[];
  /** False means the search was bounded, not that nothing exists beyond it. */
  exhausted: boolean;
}

/* ------------------------------------------------------------------ */
/* Intervals                                                          */
/* ------------------------------------------------------------------ */

/** Half-open. Touching is not overlapping, or back-to-back booking dies. */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Everything a proposed appointment collides with, buffers included.
 *
 * The buffer is folded into the interval before the test rather than checked
 * separately, so the grid and the save cannot disagree about what "collides"
 * means.
 */
export function findConflicts(
  start: ZbTime,
  durationMinutes: number,
  busy: readonly BusyInterval[],
  buffers: Buffers = {},
): BusyInterval[] {
  const from = minutesOfTime(start) - (buffers.before ?? 0);
  const to = minutesOfTime(start) + durationMinutes + (buffers.after ?? 0);
  return busy.filter((other) =>
    intervalsOverlap(
      from,
      to,
      minutesOfTime(other.start),
      minutesOfTime(other.start) + other.durationMinutes,
    ),
  );
}

/** The first minute a following appointment could start. */
export function nextBookableMinute(
  start: ZbTime,
  durationMinutes: number,
  buffers: Buffers = {},
  gridMinutes = 15,
): number {
  const end = minutesOfTime(start) + durationMinutes + (buffers.after ?? 0);
  // Rounded up to the organisation's own grid. A clinic that books on the
  // quarter hour does not want 11:00:53 offered back to it.
  return gridMinutes > 0 ? Math.ceil(end / gridMinutes) * gridMinutes : end;
}

/* ------------------------------------------------------------------ */
/* Grouping                                                           */
/* ------------------------------------------------------------------ */

export type DayPart = "morning" | "afternoon" | "evening";

export const DAY_PART_WORDS: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function dayPartOf(time: ZbTime): DayPart {
  if (time.h < 12) return "morning";
  if (time.h < 17) return "afternoon";
  return "evening";
}

export interface SlotGroup {
  part: DayPart;
  label: string;
  slots: Slot[];
  /** How many can actually be taken. The count a user is looking for. */
  openCount: number;
}

/**
 * Slots grouped by part of day, empty groups dropped.
 *
 * A heading that says "Evening — 0 open" over nothing is a heading that has
 * cost a line and answered a question nobody asked.
 */
export function groupSlots(slots: readonly Slot[]): SlotGroup[] {
  const parts: DayPart[] = ["morning", "afternoon", "evening"];
  return parts
    .map((part) => {
      const inPart = slots.filter((slot) => dayPartOf(slot.start) === part);
      return {
        part,
        label: DAY_PART_WORDS[part],
        slots: inPart,
        openCount: inPart.filter((slot) => slot.state.kind === "free").length,
      };
    })
    .filter((group) => group.slots.length > 0);
}

export function openSlots(set: AvailabilitySet): Slot[] {
  return set.slots.filter((slot) => slot.state.kind === "free");
}

/* ------------------------------------------------------------------ */
/* Staleness                                                          */
/* ------------------------------------------------------------------ */

/**
 * How old a set is, judged against a clock the host supplies.
 *
 * `now` is an argument for the same reason it is everywhere else in this
 * family: ENGINEERING.md §9 forbids a component deciding what to render from
 * the wall clock, and a staleness banner that appears on its own schedule
 * cannot be visually regression-tested.
 */
export function secondsSince(set: AvailabilitySet, now: { date: ZbDate; time: ZbTime }): number {
  const days = compareDates(now.date, set.asOf.date);
  return (days * 1440 + minutesOfTime(now.time) - minutesOfTime(set.asOf.time)) * 60;
}

export function isStale(set: AvailabilitySet, now: { date: ZbDate; time: ZbTime }): boolean {
  if (set.staleAfterSeconds == null) return false;
  return secondsSince(set, now) >= set.staleAfterSeconds;
}

/* ------------------------------------------------------------------ */
/* Next available                                                     */
/* ------------------------------------------------------------------ */

export interface NextAvailable {
  slot: Slot;
  /** Position in the host's own ranking. Never re-sorted here. */
  rank: number;
}

/**
 * The earliest slot that fits the whole request, not merely the earliest slot.
 *
 * Duration, buffers and the working day are all part of the question: a
 * thirty-minute opening at 11:30 is not an answer to "when can I have an hour",
 * and offering it is how a scheduler earns a reputation for lying. Ranking
 * beyond "soonest that fits" belongs to the host, because whether the best
 * next appointment is the soonest, the one with the right modality or the one
 * with the established therapeutic relationship is a clinical and commercial
 * question rather than a UI one.
 */
export function firstFitting(
  set: AvailabilitySet,
  durationMinutes: number,
  buffers: Buffers = {},
  dayEndMinute = 24 * 60,
): Slot | null {
  const needed = durationMinutes + (buffers.after ?? 0);
  const free = openSlots(set).sort((a, b) => minutesOfTime(a.start) - minutesOfTime(b.start));

  for (const slot of free) {
    const from = minutesOfTime(slot.start);
    if (from + needed > dayEndMinute) continue;
    // Every minute the appointment would occupy has to be free, not just the
    // slot it starts in — a run of 30-minute slots does not make an hour
    // unless the next one is open too.
    const covered = coversRun(free, from, from + needed);
    if (covered) return slot;
  }
  return null;
}

function coversRun(free: readonly Slot[], from: number, to: number): boolean {
  let reached = from;
  // Slots are sorted; walk forward while they abut or overlap.
  for (const slot of free) {
    const start = minutesOfTime(slot.start);
    if (start > reached) break;
    reached = Math.max(reached, start + slot.durationMinutes);
    if (reached >= to) return true;
  }
  return reached >= to;
}

/* ------------------------------------------------------------------ */
/* FHIR adapters                                                      */
/* ------------------------------------------------------------------ */

/**
 * FHIR's five slot states, mapped to ours.
 *
 * `busy-tentative` becomes a hold rather than a booking, because that is what
 * it means: somebody else's provisional reservation, which expires. Rendering
 * it as booked tells a user to give up on a time that will be free shortly.
 */
export function fromSlotStatus(status: string | undefined, expiresInSeconds?: number): SlotState {
  switch (status) {
    case "free":
      return { kind: "free" };
    case "busy":
      return { kind: "blocked", reason: "booked" };
    case "busy-unavailable":
      return { kind: "blocked", reason: "provider-unavailable" };
    case "busy-tentative":
      return { kind: "held", by: "other", expiresInSeconds: expiresInSeconds ?? 0 };
    default:
      // `entered-in-error` and anything unrecognised. A slot we cannot name is
      // a slot we must not offer.
      return { kind: "blocked", reason: "booked" };
  }
}

const FHIR_WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Whether a `PractitionerRole.availableTime` entry covers a given day and time.
 *
 * Two R4 rules that are easy to miss and expensive to get wrong: an omitted
 * `daysOfWeek` means *every* day, and `allDay` beats the two time members
 * rather than combining with them.
 */
export function coversWorkingTime(
  entry: {
    daysOfWeek?: readonly string[];
    allDay?: boolean;
    availableStartTime?: string;
    availableEndTime?: string;
  },
  date: ZbDate,
  time: ZbTime,
): boolean {
  const day = FHIR_WEEKDAYS[weekdayOf(date)];
  if (entry.daysOfWeek && day && !entry.daysOfWeek.includes(day)) return false;
  if (entry.allDay) return true;

  const minutes = minutesOfTime(time);
  const from = entry.availableStartTime ? clockStringToMinutes(entry.availableStartTime) : 0;
  const to = entry.availableEndTime ? clockStringToMinutes(entry.availableEndTime) : 24 * 60;
  if (from === null || to === null) return false;
  return minutes >= from && minutes < to;
}

/** `hh:mm:ss` — local to the practice, and never an instant. */
export function clockStringToMinutes(value: string): number | null {
  const parsed = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!parsed) return null;
  const h = Number(parsed[1]);
  const mi = Number(parsed[2]);
  if (h > 24 || mi > 59) return null;
  return h * 60 + mi;
}

/**
 * A run of slots at a fixed interval, for a host that has working hours rather
 * than a slot table.
 *
 * Every real scheduling system eventually needs this, and every one writes it
 * slightly differently.
 */
export function buildSlots(options: {
  fromMinute: number;
  toMinute: number;
  everyMinutes: number;
  durationMinutes: number;
  /** Returns the reason a start is unavailable, or null. */
  blocked?: (start: ZbTime) => SlotBlockReason | null;
  idPrefix?: string;
}): Slot[] {
  const {
    fromMinute,
    toMinute,
    everyMinutes,
    durationMinutes,
    blocked,
    idPrefix = "slot",
  } = options;
  if (everyMinutes <= 0) return [];
  const out: Slot[] = [];
  for (let minute = fromMinute; minute + durationMinutes <= toMinute; minute += everyMinutes) {
    const start = timeFromMinutes(minute).time;
    const reason = blocked?.(start) ?? null;
    out.push({
      id: `${idPrefix}-${minute}`,
      start,
      durationMinutes,
      state: reason ? { kind: "blocked", reason } : { kind: "free" },
    });
  }
  return out;
}

/** "9:00 AM – 9:30 AM", for a summary line or an accessible name. */
export function describeSlot(slot: Slot, options: { hour24?: boolean } = {}): string {
  const end = timeFromMinutes(minutesOfTime(slot.start) + slot.durationMinutes).time;
  return `${formatClockTime(slot.start, options)} – ${formatClockTime(end, options)}`;
}

/** The day a slot's end falls on, which is not always the day it starts. */
export function slotEndDate(slot: Slot, date: ZbDate): ZbDate {
  const landed = timeFromMinutes(minutesOfTime(slot.start) + slot.durationMinutes);
  return landed.dayOffset > 0 ? addCalendarDays(date, landed.dayOffset) : date;
}

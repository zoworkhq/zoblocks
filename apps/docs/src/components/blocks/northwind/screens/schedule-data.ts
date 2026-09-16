/**
 * Northwind's appointment book, weeks of 03, 10 and 17 August 2026.
 *
 * Derived from the cohort rather than authored beside it: a patient's `next`
 * label is their booked slot, and their `lastSeen` date is a session that
 * happened. The cohort keeps its slots unique per clinician, so nothing here
 * moves a booking; a held session is skipped rather than moved when its day
 * already has one.
 *
 * Days are offsets from the demo's today (Thu 13 Aug = 0), the same unit
 * `dayLabel` takes. Times are minutes from midnight.
 */

import {
  CLINICIANS,
  NOW,
  PATIENTS,
  RISKS,
  dayLabel,
  patient as patientById,
  type ClinicianId,
  type Patient,
  type RiskItem,
} from "../data";

export type ApptStatus = "completed" | "checked-in" | "booked" | "no-show" | "cancelled";
export type ApptType = "individual" | "intake" | "med" | "risk" | "group" | "admin" | "supervision";
export type Modality = "Telehealth" | "In person";

export interface Appt {
  id: string;
  /** Null for blocks that are not a session with one patient. */
  patient: string | null;
  /** For non-patient blocks: "Admin · notes". */
  title?: string;
  clinician: ClinicianId;
  day: number;
  start: number;
  minutes: number;
  type: ApptType;
  modality: Modality;
  status: ApptStatus;
  measureDue: string | null;
  risk: boolean;
  reason?: string;
}

export const TYPES: Record<
  ApptType,
  { label: string; short: string; minutes: number; bookable: boolean }
> = {
  individual: { label: "Individual therapy", short: "Individual", minutes: 50, bookable: true },
  intake: { label: "Intake assessment", short: "Intake", minutes: 60, bookable: true },
  med: { label: "Medication management", short: "Med management", minutes: 25, bookable: true },
  risk: { label: "Risk follow-up", short: "Risk follow-up", minutes: 15, bookable: true },
  group: { label: "Group — CBT skills", short: "Group", minutes: 90, bookable: false },
  admin: { label: "Admin", short: "Admin", minutes: 30, bookable: false },
  supervision: { label: "Supervision", short: "Supervision", minutes: 50, bookable: false },
};

export const STATUS: Record<ApptStatus, { label: string; sev: "norm" | "low" | "crit" | "unk" }> = {
  completed: { label: "Completed", sev: "unk" },
  "checked-in": { label: "Checked in", sev: "norm" },
  booked: { label: "Booked", sev: "low" },
  "no-show": { label: "No-show", sev: "crit" },
  cancelled: { label: "Cancelled", sev: "unk" },
};

/* ------------------------------------------------------------------ time */

export const DAY_START = 8 * 60;
export const DAY_END = 18 * 60;
const [NH, NM] = NOW.time.split(":").map(Number) as [number, number];
/** 10:08 as minutes. */
export const NOW_MIN = NH * 60 + NM;

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Mon = 0. The demo's today is a Thursday. */
export function weekday(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}
export function mondayOf(day: number): number {
  return day - weekday(day);
}
export function isWeekend(day: number): boolean {
  return weekday(day) >= 5;
}
/** "Thu 13 Aug". */
export function dayName(day: number): string {
  return `${WD[weekday(day)]} ${dayLabel(day)}`;
}
export function dayShort(day: number): string {
  return WD[weekday(day)]!;
}
/** "10–14 Aug", or "31 Aug – 04 Sep" across a month. */
export function weekRange(monday: number): string {
  const a = dayLabel(monday);
  const b = dayLabel(monday + 4);
  return a.slice(3) === b.slice(3) ? `${a.slice(0, 2)}–${b}` : `${a} – ${b}`;
}
export function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
export function span(a: Appt): string {
  return `${hhmm(a.start)}–${hhmm(a.start + a.minutes)}`;
}
function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return h * 60 + m;
}
/** "Thu 13 Aug 11:00" → offset and minutes. Every label in the cohort is August. */
function parseNext(label: string): { day: number; start: number } {
  const [, dd, , time] = label.split(" ");
  return { day: Number(dd) - 13, start: toMin(time!) };
}

export function isPast(a: Appt): boolean {
  return a.day < 0 || (a.day === 0 && a.start + a.minutes <= NOW_MIN);
}

/* -------------------------------------------------------------- helpers */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function overlaps(
  list: readonly Appt[],
  clinician: ClinicianId,
  day: number,
  start: number,
  minutes: number,
  except?: string,
): boolean {
  return list.some(
    (a) =>
      a.id !== except &&
      a.clinician === clinician &&
      a.day === day &&
      a.status !== "cancelled" &&
      a.start < start + minutes &&
      start < a.start + a.minutes,
  );
}

/** Half-hour starts that fit a session of `minutes` for one clinician on one day. */
export function freeSlots(
  list: readonly Appt[],
  clinician: ClinicianId,
  day: number,
  minutes: number,
  except?: string,
): number[] {
  if (isWeekend(day) || day < 0) return [];
  const out: number[] = [];
  for (let t = DAY_START + 60; t + minutes <= DAY_END; t += 30) {
    if (day === 0 && t <= NOW_MIN) continue;
    if (!overlaps(list, clinician, day, t, minutes, except)) out.push(t);
  }
  return out;
}

export function nextWeekday(day: number): number {
  let d = day + 1;
  while (isWeekend(d)) d += 1;
  return d;
}

/** An open risk item for this patient, whatever it is. */
export function riskFor(patientId: string): RiskItem | undefined {
  return RISKS.find((r) => r.patient === patientId);
}

/** "14:20" today, or "Fri 05:08" when the window closes on a later day. */
export function dueLabel(r: RiskItem): string {
  if (r.minutes < 0) return "overdue";
  const t = NOW_MIN + r.minutes;
  const d = Math.floor(t / 1440);
  return d === 0 ? hhmm(t) : `${dayShort(d)} ${hhmm(t % 1440)}`;
}

export function typeFor(p: Patient, first: boolean): ApptType {
  if (first && p.track === "baseline") return "intake";
  return p.clinician === "tash" ? "med" : "individual";
}

export function measureFor(
  p: Patient,
  type: ApptType,
  sessions: number,
  authored: boolean,
): string | null {
  if (type === "intake") return `${p.instrument} at intake`;
  if (type !== "individual" && type !== "med") return null;
  if (p.track === "not-on-track") return `${p.instrument} due`;
  if (!authored && sessions % 4 === 0) return `${p.instrument} due`;
  return null;
}

export function patientOf(a: Appt): Patient | null {
  return a.patient ? patientById(a.patient) : null;
}

export function clinicianShort(id: ClinicianId): string {
  return CLINICIANS[id].short;
}

/* ---------------------------------------------------------------- build */

/** The patients `data.ts` authors by hand. */
const AUTHORED = new Set(PATIENTS.slice(0, 16).map((p) => p.id));
const WEEKDAYS = [-10, -9, -8, -7, -6, -3, -2, -1, 0, 1, 4, 5, 6, 7, 8];
const FIRST_DAY = -10;

/** "06 Aug" or "27 Jul" → offset from today. */
function offsetOf(label: string): number {
  const dd = Number(label.slice(0, 2));
  return label.endsWith("Jul") ? dd - 13 - 31 : dd - 13;
}

function statusAt(day: number, start: number, minutes: number): ApptStatus {
  if (day < 0 || (day === 0 && start + minutes <= NOW_MIN)) return "completed";
  if (day === 0 && start <= NOW_MIN) return "checked-in";
  return "booked";
}

function build(): Appt[] {
  const out: Appt[] = [];
  const ids = new Set<string>();
  const risky = new Set(RISKS.map((r) => r.patient));
  const add = (a: Omit<Appt, "id">, base: string) => {
    let id = base;
    for (let n = 2; ids.has(id); n += 1) id = `${base}-${n}`;
    ids.add(id);
    out.push({ ...a, id });
  };
  const session = (
    p: Patient,
    day: number,
    start: number,
    type: ApptType,
    status: ApptStatus,
    measureDue: string | null,
  ) =>
    add(
      {
        patient: p.id,
        clinician: p.clinician,
        day,
        start,
        minutes: TYPES[type].minutes,
        type,
        modality: type === "intake" ? "In person" : p.modality,
        status,
        measureDue,
        risk: status === "booked" || status === "checked-in" ? risky.has(p.id) : false,
        ...(status === "cancelled" ? { reason: "Patient request" } : {}),
      },
      `ap-${p.id}-${day}`,
    );
  const block = (
    clinician: ClinicianId,
    day: number,
    start: number,
    minutes: number,
    type: ApptType,
    title: string,
  ) =>
    add(
      {
        patient: null,
        title,
        clinician,
        day,
        start,
        minutes,
        type,
        modality: "In person",
        status: statusAt(day, start, minutes),
        measureDue: null,
        risk: false,
      },
      `ev-${type}-${clinician}-${day}`,
    );
  const hasSession = (pid: string, day: number) =>
    out.some((a) => a.patient === pid && a.day === day);

  // Standing blocks. The cohort already keeps its hours clear of these.
  for (const d of WEEKDAYS) block("lake", d, 12 * 60, 30, "admin", "Admin · notes");
  for (const d of [-7, 0, 7]) {
    block("lake", d, 14 * 60, 50, "supervision", "Supervision · P. Osei");
    block("osei", d, 14 * 60, 50, "supervision", "Supervision · E. Lake");
  }

  // Booked slots, exactly as the cohort labels them.
  const booked = new Map<string, { day: number; start: number }>();
  for (const p of PATIENTS) {
    if (p.next === "—") continue;
    const n = parseNext(p.next);
    const type = typeFor(p, true);
    const status = statusAt(n.day, n.start, TYPES[type].minutes);
    booked.set(p.id, n);
    session(
      p,
      n.day,
      n.start,
      type,
      status,
      status === "completed" ? null : measureFor(p, type, p.sessions + 1, AUTHORED.has(p.id)),
    );
  }

  // The week after, for weekly patients booked on Thursday or Friday.
  for (const p of PATIENTS) {
    const at = booked.get(p.id);
    if (!at || at.day > 1 || p.cadence !== "Weekly") continue;
    const type = typeFor(p, false);
    if (overlaps(out, p.clinician, at.day + 7, at.start, TYPES[type].minutes)) continue;
    session(
      p,
      at.day + 7,
      at.start,
      type,
      "booked",
      measureFor(p, type, p.sessions + 2, AUTHORED.has(p.id)),
    );
  }

  // Sessions already held: the last-seen date, and the cadence before it.
  const held = (p: Patient, day: number, start: number, status: ApptStatus) => {
    if (day < FIRST_DAY || isWeekend(day) || hasSession(p.id, day)) return;
    const type = typeFor(p, false);
    const minutes = TYPES[type].minutes;
    if (day === 0 && start + minutes > NOW_MIN) return;
    if (overlaps(out, p.clinician, day, start, minutes)) return;
    session(p, day, start, type, status, null);
  };
  for (const p of PATIENTS) {
    if (p.lastSeen === "—") continue;
    const seen = offsetOf(p.lastSeen);
    const start = booked.get(p.id)?.start ?? 9 * 60;
    held(p, seen, start, "completed");
    const step = p.cadence === "Weekly" ? 7 : 14;
    const h = hash(p.id);
    const status: ApptStatus = AUTHORED.has(p.id)
      ? "completed"
      : h % 11 === 0
        ? "no-show"
        : h % 13 === 0
          ? "cancelled"
          : "completed";
    held(p, seen - step, start, status);
  }

  // The two Mondays the safety queue opened an outreach item for.
  const haddad = patientById("haddad");
  held(haddad, -10, 11 * 60, "no-show");
  held(haddad, -3, 11 * 60, "no-show");

  // Risk follow-ups the queue implies, and the group, in whatever time is free.
  const firstFree = (clinician: ClinicianId, day: number, minutes: number, from: number) => {
    for (let t = from; t + minutes <= DAY_END; t += 15)
      if (!overlaps(out, clinician, day, t, minutes)) return t;
    return null;
  };
  const followUp = (pid: string, day: number, from: number) => {
    const p = patientById(pid);
    const t = firstFree(p.clinician, day, 15, from);
    if (t === null) return;
    add(
      {
        patient: pid,
        clinician: p.clinician,
        day,
        start: t,
        minutes: 15,
        type: "risk",
        modality: "Telehealth",
        status: statusAt(day, t, 15),
        measureDue: null,
        risk: true,
      },
      `rf-${pid}-${day}`,
    );
  };
  followUp("mwangi", 0, 11 * 60 + 30);
  followUp("haddad", 1, 12 * 60 + 15);
  for (const d of [-8, -1, 6]) {
    const t = firstFree("brandt", d, 90, 12 * 60);
    if (t !== null) block("brandt", d, t, 90, "group", "Group · CBT skills");
  }

  return out.sort((a, b) => a.day - b.day || a.start - b.start);
}

export const APPOINTMENTS: readonly Appt[] = build();

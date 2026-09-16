/**
 * Everything the record says about a patient that the cohort does not carry.
 *
 * Derived, never random: a problem list follows the program, a chronology
 * follows the administrations, a claim follows a session. Okonkwo is the one
 * authored chart, so her rows are written out and everyone else's are built.
 */

import {
  CLINICIANS,
  INSTRUMENT_MAX,
  RISKS,
  band,
  dayLabel,
  type Patient,
  type RiskItem,
  type Sev,
} from "../data";

export type TabId =
  | "overview"
  | "chronology"
  | "measures"
  | "notes"
  | "medications"
  | "safety"
  | "documents"
  | "billing";

export const TABS: readonly { value: TabId; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "chronology", label: "Chronology" },
  { value: "measures", label: "Measures" },
  { value: "notes", label: "Notes" },
  { value: "medications", label: "Medications" },
  { value: "safety", label: "Safety" },
  { value: "documents", label: "Documents" },
  { value: "billing", label: "Billing" },
];

export function isTab(v: string | undefined): v is TabId {
  return TABS.some((t) => t.value === v);
}

export const COORDINATOR = { name: "A. Brennan", initials: "AB" } as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Days from the demo's today to a "04 Jun" label. Fixed dates, so SSR agrees. */
export function offsetOf(label: string): number {
  const [d, m] = label.split(" ");
  const mi = MONTHS.indexOf(m ?? "");
  if (mi < 0) return 0;
  return Math.round((Date.UTC(2026, mi, Number(d)) - Date.UTC(2026, 7, 13)) / 86_400_000);
}

export const isOkonkwo = (p: Patient) => p.id === "okonkwo";

/** The next booking, or null when nothing is booked ("—" in the cohort). */
export function booked(p: Patient): string | null {
  return p.next === "—" ? null : p.next;
}

export function firstName(p: Patient): string {
  return p.full.split(", ")[1] ?? p.name;
}

/* -------------------------------------------------------------- identity */

export interface Identity {
  mrn: string;
  dob: string;
  age: number;
  pronouns: string;
  lastSeen: string;
}

/** Identity as the record shows it. `data.ts` pins the authored values. */
export function identity(p: Patient): Identity {
  return { mrn: p.mrn, dob: p.dob, age: p.age, pronouns: p.pronouns, lastSeen: p.lastSeen };
}

/**
 * Notes the dashboard lists as unsigned past 48 hours. The unsigned note is
 * the latest session, so these dates also stand in for the last visit.
 */
export const UNSIGNED: Record<string, string> = {
  whitfield: "06 Aug",
  kowalski: "11 Aug",
  ibrahim: "06 Aug",
  lindqvist: "10 Aug",
};

/** Offsets (days from today) of each administration, intake first, weekly. */
export function scoreOffsets(p: Patient): number[] {
  const last = offsetOf(identity(p).lastSeen);
  const n = p.scores.length;
  return p.scores.map((_, i) => last - (n - 1 - i) * 7);
}

export function episode(p: Patient, index: number): string {
  if (isOkonkwo(p)) return "Ep-2026-0118 · week 9 of 16";
  const weeks = Math.max(1, Math.floor(-offsetOf(p.enrolled) / 7) + 1);
  return `Ep-2026-${String(120 + index * 7).padStart(4, "0")} · week ${Math.min(weeks, 16)} of 16`;
}

export function openRisk(p: Patient, resolved: Record<string, string>): RiskItem | undefined {
  return RISKS.find((r) => r.patient === p.id && !resolved[r.id]);
}

export function riskFor(p: Patient): RiskItem | undefined {
  return RISKS.find((r) => r.patient === p.id);
}

/* ------------------------------------------------------------- measures */

/** Where a score sits in the instrument card's 0–34 sparkline. */
export function sparkY(v: number, max: number): number {
  return Math.round((4 + (1 - v / max) * 26) * 10) / 10;
}

/**
 * The band a patient with this intake score is expected to be in by session
 * `k`: [upper, lower]. A curve rather than a line — most of the response
 * that is coming arrives in the first eight to ten sessions.
 */
export function expected(intake: number, k: number): [number, number] {
  const f = Math.sqrt(Math.min(k, 10) / 10);
  return [intake * (1 - 0.22 * f), intake * (1 - 0.62 * f)];
}

export function response(p: Patient): { label: string; sev: Sev } {
  const s = p.scores;
  if (isOkonkwo(p)) return { label: "Above expected band since S5", sev: "crit" };
  if (s.length === 0) return { label: "No baseline", sev: "unk" };
  if (s.length === 1) return { label: "Intake only", sev: "unk" };
  const intake = s[0]!;
  const n = s.length - 1;
  const [upper, lower] = expected(intake, n);
  const last = s[n]!;
  if (last > upper) {
    let since = n;
    while (since > 1 && s[since - 1]! > expected(intake, since - 1)[0]) since -= 1;
    return { label: `Above expected band since S${since}`, sev: "crit" };
  }
  if (last < lower) return { label: "Ahead of expected band", sev: "norm" };
  return p.track === "slow"
    ? { label: "Upper edge of expected band", sev: "high" }
    : { label: "Within expected band", sev: "norm" };
}

export interface Admin {
  key: string;
  date: string;
  offset: number;
  instrument: string;
  score: string;
  band: string;
  sev: Sev;
  change: string;
}

function changeOf(prev: number | undefined, v: number): string {
  if (prev === undefined) return "intake";
  const d = v - prev;
  return d === 0 ? "no change" : d < 0 ? `↓ ${-d}` : `↑ ${d}`;
}

/** Every administration, newest first. */
export function administrations(p: Patient): Admin[] {
  const offs = scoreOffsets(p);
  const rows: Admin[] = p.scores.map((v, i) => {
    const b = band(p.instrument, v);
    return {
      key: `${p.instrument}-${i}`,
      date: dayLabel(offs[i]!),
      offset: offs[i]!,
      instrument: p.instrument,
      score: `${v} / ${INSTRUMENT_MAX[p.instrument]}`,
      band: b.label,
      sev: b.sev,
      change: changeOf(p.scores[i - 1], v),
    };
  });
  if (isOkonkwo(p)) {
    const gad = [15, 14, 12, 11, 10, 9];
    gad.forEach((v, i) => {
      const off = offs[offs.length - gad.length + i]!;
      const b = band("GAD-7", v);
      rows.push({
        key: `gad-${i}`,
        date: dayLabel(off),
        offset: off,
        instrument: "GAD-7",
        score: `${v} / 21`,
        band: b.label,
        sev: b.sev,
        change: changeOf(gad[i - 1], v),
      });
    });
    const cssrs: [number, string, Sev][] = [
      [0, "Negative", "norm"],
      [-21, "Negative", "norm"],
      [-1, "Positive · ideation, no plan", "crit"],
    ];
    cssrs.forEach(([off, label, sev], i) =>
      rows.push({
        key: `cssrs-${i}`,
        date: dayLabel(off === 0 ? -50 : off),
        offset: off === 0 ? -50 : off,
        instrument: "C-SSRS",
        score: sev === "crit" ? "+" : "−",
        band: label,
        sev,
        change: i === 0 ? "intake" : sev === "crit" ? "new positive" : "no change",
      }),
    );
  }
  return rows.sort((a, b) => b.offset - a.offset);
}

/* ------------------------------------------------------ problems and meds */

export interface Problem {
  title: string;
  code: string;
  meta: string;
  status: string;
  sev: Sev;
}

function activeSev(p: Patient): Sev {
  if (p.track === "not-on-track") return "crit";
  if (p.track === "slow") return "high";
  if (p.track === "baseline") return "unk";
  return "norm";
}

function activeStatus(p: Patient): string {
  if (p.track === "remission") return "in remission";
  if (p.track === "responding") return "improving";
  if (p.track === "baseline") return "provisional";
  return "active";
}

export function problems(p: Patient): Problem[] {
  if (isOkonkwo(p)) {
    return [
      {
        title: "Major depressive disorder, recurrent",
        code: "F33.1",
        meta: "since Feb 2026 · focus of treatment",
        status: "active",
        sev: "crit",
      },
      {
        title: "Generalised anxiety disorder",
        code: "F41.1",
        meta: "since Feb 2026",
        status: "improving",
        sev: "high",
      },
      {
        title: "Insomnia",
        code: "G47.00",
        meta: "since Mar 2026",
        status: "secondary",
        sev: "low",
      },
    ];
  }
  const since = `since ${p.enrolled}`;
  const focus = {
    meta: `${since} · focus of treatment`,
    status: activeStatus(p),
    sev: activeSev(p),
  };
  const second = (title: string, code: string): Problem => ({
    title,
    code,
    meta: since,
    status: "secondary",
    sev: "low",
  });
  switch (p.program) {
    case "Anxiety":
      return [
        { title: "Generalised anxiety disorder", code: "F41.1", ...focus },
        second("Panic disorder", "F41.0"),
      ];
    case "Perinatal":
      return [
        { title: "Depression with peripartum onset", code: "F53.0", ...focus },
        second("Sleep disturbance", "G47.9"),
      ];
    case "Young adult":
      return [
        { title: "Adjustment disorder, mixed anxiety and low mood", code: "F43.23", ...focus },
        second("Social anxiety disorder", "F40.10"),
      ];
    default:
      return [
        { title: "Major depressive disorder, single episode", code: "F32.1", ...focus },
        second("Insomnia", "G47.00"),
      ];
  }
}

export interface Med {
  drug: string;
  dose: string;
  route: string;
  since: string;
  status: "active" | "new" | "stopped";
  note: string;
}

export const MED_SEV: Record<Med["status"], Sev> = { active: "low", new: "high", stopped: "unk" };

export function meds(p: Patient): Med[] {
  if (isOkonkwo(p)) {
    return [
      {
        drug: "Sertraline",
        dose: "100 mg",
        route: "Oral, daily",
        since: "12 Feb",
        status: "active",
        note: "unchanged at review",
      },
      {
        drug: "Trazodone",
        dose: "50 mg",
        route: "Oral, at night",
        since: "05 Aug",
        status: "new",
        note: "started 05 Aug",
      },
      {
        drug: "Zolpidem",
        dose: "5 mg",
        route: "Oral",
        since: "discontinued 05 Aug",
        status: "stopped",
        note: "discontinued 05 Aug",
      },
    ];
  }
  if (p.track === "baseline") return [];
  const since = p.enrolled;
  const base = (drug: string, dose: string, route: string): Med => ({
    drug,
    dose,
    route,
    since,
    status: "active",
    note: `since ${since}`,
  });
  switch (p.program) {
    case "Anxiety":
      return [
        base("Escitalopram", "10 mg", "Oral, daily"),
        base("Hydroxyzine", "25 mg", "Oral, as needed"),
      ];
    case "Perinatal":
      return [base("Sertraline", "50 mg", "Oral, daily")];
    case "Young adult":
      return [base("Fluoxetine", "20 mg", "Oral, daily")];
    default:
      return [base("Sertraline", "100 mg", "Oral, daily")];
  }
}

/* ----------------------------------------------------------- chronology */

export type Source = "sessions" | "measures" | "medications" | "safety";

export interface Event {
  key: string;
  when: string;
  offset: number;
  sev: Sev;
  what: string;
  sub: string;
  source: Source;
}

export interface SessionRow {
  id: string;
  date: string;
  offset: number;
  type: string;
  intake: boolean;
}

/** One session per administration; baseline patients get their intake alone. */
export function sessions(p: Patient): SessionRow[] {
  const offs = scoreOffsets(p);
  if (offs.length === 0 && p.sessions > 0) offs.push(offsetOf(p.lastSeen));
  return offs
    .map((off, i) => ({
      id: noteId(p, dayLabel(off)),
      date: dayLabel(off),
      offset: off,
      type: i === 0 ? "Intake assessment" : "Individual therapy",
      intake: i === 0,
    }))
    .reverse();
}

/** "okonkwo-0812": month then day, as the note screen keys it. */
export function noteId(p: Patient, date: string): string {
  const [d, m] = date.split(" ");
  return `${p.id}-${String(MONTHS.indexOf(m ?? "") + 1).padStart(2, "0")}${d}`;
}

function okonkwoEvents(signed: boolean): Event[] {
  const top: Event[] = [
    {
      key: "a1",
      when: "12 Aug",
      offset: -1,
      sev: "crit",
      what: "PHQ-9 administered — 16",
      sub: "Third consecutive administration without movement",
      source: "measures",
    },
    {
      key: "a2",
      when: "12 Aug",
      offset: -1,
      sev: "crit",
      what: "C-SSRS positive — ideation, no plan",
      sub: "Safety plan updated same session",
      source: "safety",
    },
    {
      key: "a3",
      when: "12 Aug",
      offset: -1,
      sev: "norm",
      what: "Individual therapy, 50 min",
      sub: `E. Lake · note ${signed ? "signed" : "unsigned"}`,
      source: "sessions",
    },
    {
      key: "a4",
      when: "05 Aug",
      offset: -8,
      sev: "high",
      what: "Safety plan reviewed",
      sub: "Previous review 41 days earlier",
      source: "safety",
    },
    {
      key: "a5",
      when: "29 Jul",
      offset: -15,
      sev: "low",
      what: "Medication review",
      sub: "Sertraline continued at 100 mg",
      source: "medications",
    },
  ];
  const more: Event[] = [
    {
      key: "b1",
      when: "05 Aug",
      offset: -8,
      sev: "high",
      what: "Trazodone 50 mg started",
      sub: "Zolpidem 5 mg discontinued the same day",
      source: "medications",
    },
    {
      key: "b2",
      when: "25 Jun",
      offset: -49,
      sev: "low",
      what: "Safety plan created",
      sub: "C-SSRS negative at intake",
      source: "safety",
    },
    {
      key: "b3",
      when: "18 Jun",
      offset: -56,
      sev: "unk",
      what: "Referred by primary care",
      sub: "Adult depression program · E. Lake",
      source: "sessions",
    },
  ];
  return [...top, ...more];
}

export function chronology(p: Patient, signed: Record<string, true>): Event[] {
  const events: Event[] = [];
  const clin = CLINICIANS[p.clinician].short;
  const offs = scoreOffsets(p);
  const n = p.scores.length;

  if (isOkonkwo(p)) {
    events.push(...okonkwoEvents(Boolean(signed["okonkwo-0812"])));
    // The authored rows already cover 12 Aug; older weeks come from the scores.
    p.scores.forEach((v, i) => {
      const off = offs[i]!;
      if (off > -8) return;
      const when = dayLabel(off);
      if (off < -8) {
        events.push({
          key: `m${i}`,
          when,
          offset: off,
          sev: band("PHQ-9", v).sev,
          what: `PHQ-9 administered — ${v}`,
          sub:
            i === 0
              ? "Moderately severe at intake"
              : `${band("PHQ-9", v).label} · ${changeOf(p.scores[i - 1], v)}`,
          source: "measures",
        });
      }
      events.push({
        key: `s${i}`,
        when,
        offset: off,
        sev: "norm",
        what: i === 0 ? "Intake assessment, 60 min" : "Individual therapy, 50 min",
        sub: "E. Lake · note signed",
        source: "sessions",
      });
    });
    events.push({
      key: "m-last",
      when: "05 Aug",
      offset: -8,
      sev: "crit",
      what: "PHQ-9 administered — 16",
      sub: "No change from 29 Jul",
      source: "measures",
    });
    return stable(events);
  }

  p.scores.forEach((v, i) => {
    const off = offs[i]!;
    const when = dayLabel(off);
    const b = band(p.instrument, v);
    events.push({
      key: `m${i}`,
      when,
      offset: off,
      sev: b.sev,
      what: `${p.instrument} administered — ${v}`,
      sub: i === 0 ? `${b.label} at intake` : `${b.label} · ${changeOf(p.scores[i - 1], v)}`,
      source: "measures",
    });
  });
  for (const s of sessions(p)) {
    events.push({
      key: `s${s.offset}`,
      when: s.date,
      offset: s.offset,
      sev: "norm",
      what: s.intake ? "Intake assessment, 60 min" : "Individual therapy, 50 min",
      sub: `${clin} · note ${UNSIGNED[p.id] === s.date && !signed[noteId(p, s.date)] ? "unsigned" : "signed"}`,
      source: "sessions",
    });
    if (s.intake) {
      events.push({
        key: "plan",
        when: s.date,
        offset: s.offset,
        sev: "low",
        what: "Safety plan created",
        sub: "C-SSRS negative at intake",
        source: "safety",
      });
    }
  }
  const m = meds(p)[0];
  if (m && n >= 3) {
    const off = offs[2]!;
    events.push({
      key: "med",
      when: dayLabel(off),
      offset: off,
      sev: "low",
      what: "Medication review",
      sub: `${m.drug} continued at ${m.dose}`,
      source: "medications",
    });
  }
  const risk = riskFor(p);
  if (risk) {
    const when = risk.opened.split(" ").slice(0, 2).join(" ");
    events.push({
      key: "risk",
      when,
      offset: offsetOf(when),
      sev: risk.kind === "plan-review" ? "low" : risk.sev,
      // A plan-review item opens on the day of the last review, not the day it fell due.
      what: risk.kind === "plan-review" ? "Safety plan reviewed" : risk.what,
      sub:
        risk.kind === "plan-review"
          ? `Next review due within 60 days · ${CLINICIANS[risk.owner].short}`
          : `${risk.window} · ${CLINICIANS[risk.owner].short}`,
      source: "safety",
    });
  }
  events.push({
    key: "enrol",
    when: p.enrolled,
    offset: offsetOf(p.enrolled) - 0.5,
    sev: "unk",
    what: `Enrolled · ${p.program}`,
    sub: `Referred to ${clin}`,
    source: "sessions",
  });
  if (n === 0) {
    events.push({
      key: "due",
      when: "13 Aug",
      offset: 0,
      sev: "unk",
      what: `${p.instrument} not yet administered`,
      sub: booked(p) ? `Baseline due at ${p.next}` : "Baseline due at intake · none booked",
      source: "measures",
    });
  }
  return stable(events);
}

function stable(events: Event[]): Event[] {
  return events
    .map((e, i) => ({ e, i }))
    .sort((a, b) => b.e.offset - a.e.offset || a.i - b.i)
    .map(({ e }) => e);
}

/* ---------------------------------------------------------------- notes */

export interface NoteRow {
  id: string;
  date: string;
  type: string;
  clinician: string;
  status: "signed" | "unsigned" | "draft";
  /** How long an unsigned note has waited: "20h", "5d". */
  age?: string;
  body: string;
}

export function noteBody(p: Patient, s: SessionRow): string {
  const who = firstName(p);
  const i = p.scores.length - 1 - sessions(p).findIndex((x) => x.offset === s.offset);
  const v = p.scores[i];
  const reading =
    v === undefined ? "" : ` ${p.instrument} ${v} (${band(p.instrument, v).label.toLowerCase()}).`;
  if (s.intake) {
    return `Intake for the ${p.program.toLowerCase()} program. ${who} describes low mood and poor sleep over several months.${reading} C-SSRS negative; safety plan completed together. Plan: ${p.cadence.toLowerCase()} ${p.modality.toLowerCase()} sessions, review measures at each visit.`;
  }
  const course =
    p.track === "not-on-track"
      ? "reports little change since last session and finds homework hard to start."
      : p.track === "slow"
        ? "reports some easing, uneven across the week."
        : p.track === "remission"
          ? "reports sustained improvement and is using relapse-prevention skills."
          : "reports clearer improvement in mood and routine.";
  return `${who} ${course}${reading} Reviewed behavioural activation log and sleep routine. No new safety concerns raised. Plan: continue current approach and repeat ${p.instrument} next session.`;
}

export function notes(p: Patient, signed: Record<string, true>): NoteRow[] {
  const clin = CLINICIANS[p.clinician].short;
  return sessions(p).map((s) => {
    const id = noteId(p, s.date);
    const pending = id === "okonkwo-0812" || UNSIGNED[p.id] === s.date;
    const unsigned = pending && !signed[id];
    return {
      id,
      date: s.date,
      type: s.type,
      clinician: clin,
      status: unsigned ? "unsigned" : "signed",
      age: unsigned ? (s.offset === -1 ? "20h" : `${-s.offset}d`) : undefined,
      body: noteBody(p, s),
    };
  });
}

/* ----------------------------------------------------------- safety plan */

export function safetyPlan(p: Patient): {
  reviewed: string;
  sections: { title: string; summary: string; items: string[] }[];
} {
  const reviewed = isOkonkwo(p)
    ? "12 Aug · updated same session"
    : p.id === "ferreira"
      ? "12 Jun · 62 days ago"
      : p.id === "oyelaran"
        ? "20 Jun · 54 days ago"
        : `${sessions(p).at(-1)?.date ?? p.enrolled} · at intake`;
  return {
    reviewed,
    sections: [
      {
        title: "Warning signs",
        summary: "3 listed",
        items: ["Staying in bed past midday", "Skipping meals", "Withdrawing from messages"],
      },
      {
        title: "Coping strategies",
        summary: "3 listed",
        items: ["Walk outside for 20 minutes", "Paced breathing, 4–6", "Shower and change clothes"],
      },
      {
        title: "People and places",
        summary: "2 people · 1 place",
        items: ["Sibling, by phone", "Close friend, evenings", "Public library reading room"],
      },
      {
        title: "Professionals",
        summary: "988 and care team",
        items: [
          `${CLINICIANS[p.clinician].name} · clinic hours`,
          "Northwind after-hours line",
          "988 Suicide & Crisis Lifeline · call or text 988",
        ],
      },
      {
        title: "Means safety",
        summary: isOkonkwo(p) ? "Reviewed 12 Aug" : "Reviewed at intake",
        items: ["Medications stored by a family member", "No firearms in the home, confirmed"],
      },
    ],
  };
}

/* ------------------------------------------------------------- documents */

export interface Doc {
  id: string;
  title: string;
  status: string;
  sev: Sev;
  meta: [string, string][];
}

export function documents(p: Patient): Doc[] {
  const ok = isOkonkwo(p);
  const signedOn = ok ? "12 Feb 2026" : `${p.enrolled} 2026`;
  const intake = sessions(p).find((s) => s.intake);
  return [
    {
      id: "consent",
      title: "Consent to treatment",
      status: `Signed ${signedOn}`,
      sev: "norm",
      meta: [
        ["Signed", signedOn],
        ["Method", "E-signature"],
        ["Expires", "On discharge"],
        ["Pages", "2"],
      ],
    },
    {
      id: "roi",
      title: "Release of information · primary care",
      status: `Signed ${signedOn}`,
      sev: "norm",
      meta: [
        ["Signed", signedOn],
        ["Recipient", "Primary care physician"],
        ["Scope", "Diagnoses, medications"],
        ["Expires", "12 months"],
      ],
    },
    {
      id: "intake",
      title: "Intake assessment",
      status: intake ? `Completed ${intake.date}` : "Not yet completed",
      sev: intake ? "norm" : "unk",
      meta: intake
        ? [
            ["Completed", intake.date],
            ["Clinician", CLINICIANS[p.clinician].name],
            ["Pages", "6"],
          ]
        : [
            ["Status", booked(p) ? `Booked ${p.next}` : "Intake not booked"],
            ["Clinician", CLINICIANS[p.clinician].name],
          ],
    },
    {
      id: "part2",
      title: "42 CFR Part 2 consent",
      status: ok ? "Not on file" : "Not required",
      sev: ok ? "high" : "unk",
      meta: ok
        ? [
            ["Status", "Not on file"],
            ["Needed for", "Substance-use section"],
            ["Requested", "Never"],
          ]
        : [
            ["Status", "Not required"],
            ["Reason", "No Part 2 records held"],
          ],
    },
  ];
}

/* --------------------------------------------------------------- billing */

export interface Claim {
  id: string;
  date: string;
  cpt: string;
  desc: string;
  payer: string;
  amount: number;
  status: "paid" | "pending" | "denied";
}

export const CLAIM_SEV: Record<Claim["status"], Sev> = {
  paid: "norm",
  pending: "unk",
  denied: "crit",
};

export function claims(p: Patient): Claim[] {
  const rows = sessions(p).slice(0, 8);
  return rows.map((s, i) => {
    const long = !s.intake && (s.offset + p.id.length) % 3 === 0;
    const cpt = s.intake ? "90791" : long ? "90837" : "90834";
    const status: Claim["status"] =
      i < 2 ? "pending" : (p.id.length + i) % 7 === 3 ? "denied" : "paid";
    return {
      id: `CL-${s.id.replace(/\D/g, "")}${i}`,
      date: s.date,
      cpt,
      desc: s.intake
        ? "Diagnostic evaluation"
        : long
          ? "Psychotherapy, 60 min"
          : "Psychotherapy, 45 min",
      payer: p.payer,
      amount: cpt === "90791" ? 210 : cpt === "90837" ? 180 : 140,
      status,
    };
  });
}

/* ------------------------------------------------------------ side column */

export function engagement(p: Patient): { attended: number; booked: number; cadence: number } {
  if (isOkonkwo(p)) return { attended: 11, booked: 13, cadence: 92 };
  const missed = p.id === "haddad" ? 2 : p.sessions > 6 ? 1 : 0;
  const booked = p.sessions + missed;
  return {
    attended: p.sessions,
    booked,
    cadence:
      booked === 0
        ? 0
        : Math.round((p.sessions / booked) * 100) - (p.track === "not-on-track" ? 4 : 0),
  };
}

export type DetailKey = "contact" | "insurance" | "emergency" | "pharmacy";

export function details(
  p: Patient,
  index: number,
): { key: DetailKey; label: string; short: string; rows: [string, string][] }[] {
  const tail = String(100 + ((index * 17) % 90)).slice(-2);
  return [
    {
      key: "contact",
      label: "Contact",
      short: "mobile",
      rows: [
        ["Mobile", `(555) 01${tail}-4${tail}7`],
        ["Preferred", "Text, then call"],
        ["Voicemail", "OK to leave"],
        ["Portal", "Active"],
      ],
    },
    {
      key: "insurance",
      label: "Insurance",
      short: p.payer === "Self-pay" ? "self-pay" : "verified",
      rows:
        p.payer === "Self-pay"
          ? [
              ["Payer", "Self-pay"],
              ["Sliding scale", "Tier 2"],
              ["Card on file", "No"],
            ]
          : [
              ["Payer", p.payer],
              ["Member ID", `NW${tail}0${index + 31}7`],
              ["Verified", "03 Aug"],
              ["Copay", "$20"],
            ],
    },
    {
      key: "emergency",
      label: "Emergency contact",
      short: "1 listed",
      rows: [
        ["Relationship", "Sibling"],
        ["Phone", `(555) 01${tail}-9${tail}2`],
        ["Release on file", "Yes"],
      ],
    },
    {
      key: "pharmacy",
      label: "Pharmacy",
      short: "Riverside",
      rows: [
        ["Name", "Riverside Pharmacy"],
        ["Address", "214 Mill St"],
        ["Phone", "(555) 0142-3300"],
        ["E-prescribing", "Enabled"],
      ],
    },
  ];
}

export function presenting(p: Patient): string {
  switch (p.program) {
    case "Anxiety":
      return "Referred for persistent worry, muscle tension and poor concentration affecting work.";
    case "Perinatal":
      return "Referred by obstetrics for low mood and anxiety since the birth, with disrupted sleep.";
    case "Young adult":
      return "Self-referred after a difficult first year of study: low mood, avoidance and poor sleep.";
    default:
      return "Referred by primary care for low mood and sleep disruption over several months.";
  }
}

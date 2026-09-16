/**
 * Northwind Health — the one cohort every screen reads.
 *
 * The screens used to carry their own copies of the same people, and they
 * disagreed: the dashboard's risk queue had a patient whose 24-hour window
 * opened two days before "now". One list, one clock, so a name clicked on one
 * screen is the same person, with the same numbers, on the next.
 *
 * Synthetic. Seeded, so a screenshot taken today matches the page tomorrow.
 */

import { faceFor } from "@/lib/faces";

export type Sev = "crit" | "high" | "low" | "norm" | "unk";

/** The demo's clock. Thursday 13 August 2026, 10:08. */
export const NOW = { day: "Thu 13 Aug", time: "10:08", iso: "2026-08-13T10:08" } as const;

/* ------------------------------------------------------------ clinicians */

export type ClinicianId = "lake" | "tash" | "osei" | "brandt";

export interface Clinician {
  id: ClinicianId;
  name: string;
  short: string;
  role: string;
  initials: string;
}

export const CLINICIANS: Record<ClinicianId, Clinician> = {
  lake: { id: "lake", name: "E. Lake, LCSW", short: "E. Lake", role: "Therapist", initials: "EL" },
  tash: {
    id: "tash",
    name: "J. Tashpulatov, MD",
    short: "J. Tashpulatov",
    role: "Psychiatrist",
    initials: "JT",
  },
  osei: {
    id: "osei",
    name: "P. Osei, PhD",
    short: "P. Osei",
    role: "Psychologist",
    initials: "PO",
  },
  brandt: {
    id: "brandt",
    name: "L. Brandt, LPC",
    short: "L. Brandt",
    role: "Counselor",
    initials: "LB",
  },
};

/** The signed-in user. */
export const ME: ClinicianId = "lake";

/* -------------------------------------------------------------- patients */

export type Track = "not-on-track" | "slow" | "responding" | "remission" | "baseline";

export const TRACK: Record<Track, { label: string; sev: Sev; rank: number }> = {
  "not-on-track": { label: "not on track", sev: "crit", rank: 0 },
  slow: { label: "slow response", sev: "high", rank: 1 },
  baseline: { label: "awaiting baseline", sev: "unk", rank: 5 },
  responding: { label: "responding", sev: "norm", rank: 3 },
  remission: { label: "remission", sev: "norm", rank: 4 },
};

export type InstrumentCode = "PHQ-9" | "GAD-7";

export const INSTRUMENT_MAX: Record<InstrumentCode, number> = { "PHQ-9": 27, "GAD-7": 21 };

export type Program = "Adult depression" | "Anxiety" | "Perinatal" | "Young adult";

export interface Patient {
  id: string;
  /** As lists write it: "R. Okonkwo". */
  name: string;
  /** As the record header writes it: "Okonkwo, Rachel". */
  full: string;
  mrn: string;
  dob: string;
  age: number;
  pronouns: string;
  clinician: ClinicianId;
  program: Program;
  instrument: InstrumentCode;
  /** One score per administration, intake first. Empty while awaiting baseline. */
  scores: readonly number[];
  sessions: number;
  track: Track;
  modality: "Telehealth" | "In person";
  cadence: "Weekly" | "Fortnightly";
  enrolled: string;
  lastSeen: string;
  /** Next booked contact, as a label, or "—" when nothing is booked. */
  next: string;
  payer: string;
  /** Enrolled in the last 30 days. */
  isNew: boolean;
}

type Seed = [
  id: string,
  name: string,
  full: string,
  clinician: ClinicianId,
  program: Program,
  instrument: InstrumentCode,
  scores: readonly number[],
  sessions: number,
  track: Track,
  next: string,
];

/**
 * The patients other screens name. Every figure the dashboard, record, note
 * and copilot quote about these people is here and nowhere else.
 */
const AUTHORED: readonly Seed[] = [
  [
    "okonkwo",
    "R. Okonkwo",
    "Okonkwo, Rachel",
    "lake",
    "Adult depression",
    "PHQ-9",
    [18, 18, 17, 18, 17, 16, 16, 16],
    8,
    "not-on-track",
    "Fri 14 Aug 14:00",
  ],
  [
    "almeida",
    "T. Almeida",
    "Almeida, Tomás",
    "lake",
    "Anxiety",
    "GAD-7",
    [13, 14, 14, 15, 15],
    5,
    "not-on-track",
    "Thu 13 Aug 11:00",
  ],
  [
    "mwangi",
    "D. Mwangi",
    "Mwangi, Daniel",
    "tash",
    "Adult depression",
    "PHQ-9",
    [21, 20, 21, 20, 21, 20],
    6,
    "not-on-track",
    "Thu 13 Aug 15:30",
  ],
  [
    "whitfield",
    "J. Whitfield",
    "Whitfield, Jonah",
    "lake",
    "Adult depression",
    "PHQ-9",
    [14, 14, 13, 13, 12, 12, 12, 11, 11, 11, 11, 11],
    12,
    "slow",
    "Thu 13 Aug 13:00",
  ],
  [
    "delacroix",
    "M. Delacroix",
    "Delacroix, Maëlle",
    "lake",
    "Adult depression",
    "PHQ-9",
    [15, 13, 11, 10, 9, 8, 7, 6, 6],
    9,
    "responding",
    "Mon 17 Aug 09:00",
  ],
  [
    "ferreira",
    "S. Ferreira",
    "Ferreira, Sofia",
    "lake",
    "Anxiety",
    "GAD-7",
    [15, 13, 11, 9, 8, 7, 6, 5, 5, 4, 4, 4, 4, 4],
    14,
    "remission",
    "Tue 18 Aug 10:00",
  ],
  [
    "nakamura",
    "A. Nakamura",
    "Nakamura, Aiko",
    "lake",
    "Young adult",
    "PHQ-9",
    [],
    1,
    "baseline",
    "Thu 13 Aug 16:00",
  ],
  [
    "haddad",
    "L. Haddad",
    "Haddad, Layla",
    "osei",
    "Perinatal",
    "PHQ-9",
    [17, 17, 16, 17, 17],
    5,
    "not-on-track",
    "Mon 17 Aug 11:00",
  ],
  [
    "kowalski",
    "P. Kowalski",
    "Kowalski, Piotr",
    "brandt",
    "Anxiety",
    "GAD-7",
    [16, 16, 17, 16, 16, 16],
    6,
    "not-on-track",
    "Tue 18 Aug 15:00",
  ],
  [
    "oyelaran",
    "B. Oyelaran",
    "Oyelaran, Bisi",
    "osei",
    "Adult depression",
    "PHQ-9",
    [20, 19, 20, 19, 19, 19, 18],
    7,
    "not-on-track",
    "Fri 14 Aug 10:00",
  ],
  [
    "reyes",
    "C. Reyes",
    "Reyes, Camila",
    "lake",
    "Perinatal",
    "PHQ-9",
    [16, 15, 14, 14, 13, 13],
    6,
    "slow",
    "Thu 13 Aug 15:00",
  ],
  [
    "lindqvist",
    "E. Lindqvist",
    "Lindqvist, Erik",
    "brandt",
    "Young adult",
    "GAD-7",
    [12, 12, 11, 11, 10],
    5,
    "slow",
    "Mon 17 Aug 14:00",
  ],
  [
    "chen",
    "W. Chen",
    "Chen, Wei",
    "osei",
    "Adult depression",
    "PHQ-9",
    [19, 16, 13, 11, 9, 8],
    6,
    "responding",
    "Fri 14 Aug 11:00",
  ],
  [
    "ibrahim",
    "F. Ibrahim",
    "Ibrahim, Fatima",
    "lake",
    "Anxiety",
    "GAD-7",
    [14, 12, 10, 8, 7],
    5,
    "responding",
    "Wed 19 Aug 09:00",
  ],
  [
    "santos",
    "G. Santos",
    "Santos, Gabriel",
    "brandt",
    "Young adult",
    "PHQ-9",
    [15, 15, 16, 15, 16],
    5,
    "not-on-track",
    "Wed 19 Aug 16:00",
  ],
  [
    "novak",
    "K. Novak",
    "Novak, Katarina",
    "tash",
    "Adult depression",
    "PHQ-9",
    [],
    0,
    "baseline",
    "Fri 14 Aug 13:00",
  ],
];

/**
 * Facts other screens quote, pinned over the seeded values. Last-seen dates
 * are each patient's usual weekday, and match the unsigned notes the
 * dashboard lists.
 */
const OVERRIDES: Record<string, Partial<Patient>> = {
  okonkwo: {
    mrn: "40-118-227",
    dob: "1991-03-14",
    age: 35,
    lastSeen: "12 Aug",
    modality: "Telehealth",
  },
  ibrahim: { lastSeen: "13 Aug" },
  nakamura: { lastSeen: "—" },
  // Missed 03 and 10 Aug, which is why the safety queue has her.
  haddad: { lastSeen: "27 Jul" },
};

const SURNAMES = [
  "Abara",
  "Bauer",
  "Castillo",
  "Dimitrov",
  "Eze",
  "Fontaine",
  "Gallagher",
  "Horvat",
  "Iwu",
  "Jansen",
  "Kaur",
  "Laine",
  "Moreau",
  "Nwosu",
  "Ortega",
  "Petrov",
  "Quinn",
  "Rossi",
  "Sato",
  "Tanaka",
  "Umar",
  "Varga",
  "Wójcik",
  "Xu",
  "Yilmaz",
  "Zamora",
  "Achebe",
  "Berg",
  "Costa",
  "Duarte",
  "Engel",
  "Farouk",
  "Grant",
  "Hughes",
  "Ivanova",
  "Joshi",
  "Keller",
  "Lopez",
  "Mensah",
  "Nilsen",
  "Obi",
  "Park",
  "Rahman",
  "Silva",
  "Torres",
  "Ueda",
  "Vance",
  "Walsh",
  "Young",
  "Zeller",
  "Amari",
  "Brooks",
  "Cruz",
] as const;

const FIRSTS = [
  "Ada",
  "Ben",
  "Clara",
  "Dev",
  "Esi",
  "Felix",
  "Grace",
  "Hugo",
  "Ines",
  "Jae",
  "Kofi",
  "Lena",
  "Marco",
  "Nia",
  "Omar",
  "Priya",
  "Rui",
  "Sana",
  "Theo",
  "Uma",
  "Vera",
  "Wen",
  "Yara",
  "Zane",
] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "04 Jun", counted in days from the demo's today. */
export function dayLabel(offset: number): string {
  const d = new Date(Date.UTC(2026, 7, 13 + offset));
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
}

/* ----------------------------------------------------------------- faces */

/**
 * The portrait set, sorted by who it shows.
 *
 * `faceFor` hashes a name into all thirty fixtures, which is fine for a card
 * and wrong for a clinic: it gave an adult depression patient a child's face,
 * and "Rachel" a man's. Two of the fixtures are children and are left out; the
 * rest are matched to the patient's first name.
 */
const FACES_F = [
  "2214009",
  "2214870",
  "2298440",
  "3327469",
  "3384712",
  "3390264",
  "4471902",
  "5140276",
  "5518203",
  "6031288",
  "6620158",
  "8812004",
  "8853097",
  "9905633",
] as const;
const FACES_M = [
  "1148936",
  "3320145",
  "4405177",
  "4420931",
  "5567842",
  "6673518",
  "6690321",
  "6690822",
  "7702581",
  "7731905",
  "7745012",
  "8814053",
  "9910447",
  "9963410",
] as const;

const FEMININE = new Set([
  "Rachel",
  "Maëlle",
  "Sofia",
  "Aiko",
  "Layla",
  "Bisi",
  "Camila",
  "Fatima",
  "Katarina",
  "Ada",
  "Clara",
  "Esi",
  "Grace",
  "Ines",
  "Lena",
  "Nia",
  "Priya",
  "Sana",
  "Uma",
  "Vera",
  "Wen",
  "Yara",
]);

const firstName = (full: string) => full.split(", ")[1] ?? full;

function feminine(full: string): boolean {
  return FEMININE.has(firstName(full));
}

/** Mostly by first name; every ninth patient is they/them. */
function pronounsFor(full: string, i: number): string {
  if (i > 0 && i % 9 === 0) return "They/them";
  return feminine(full) ? "She/her" : "He/him";
}

const path = (id: string) => `/fixtures/patients/${id}.jpg`;

/**
 * Each patient keeps the face the rest of the site gives their name when that
 * face fits; otherwise the least-used fitting face. Twenty-eight portraits for
 * sixty-eight people means repeats, so they are spread as thinly as possible.
 */
function assignFaces(list: readonly Patient[]): Map<string, string> {
  const used = new Map<string, number>();
  const out = new Map<string, string>();
  for (const p of list) {
    const pool = feminine(p.full) ? FACES_F : FACES_M;
    const preferred = faceFor(p.name).match(/(\d+)\.jpg$/)?.[1];
    const floor = Math.min(...pool.map((f) => used.get(f) ?? 0));
    let pick: string =
      preferred &&
      (pool as readonly string[]).includes(preferred) &&
      (used.get(preferred) ?? 0) === floor
        ? preferred
        : pool[0];
    if (pick !== preferred) {
      const start = out.size % pool.length;
      for (let k = 0; k < pool.length; k += 1) {
        const f = pool[(start + k) % pool.length]!;
        if ((used.get(f) ?? 0) === floor) {
          pick = f;
          break;
        }
      }
    }
    used.set(pick, (used.get(pick) ?? 0) + 1);
    out.set(p.id, path(pick));
  }
  return out;
}

const DAY_OFFSET: Record<string, number> = {
  "Thu 13 Aug": 0,
  "Fri 14 Aug": 1,
  "Mon 17 Aug": 4,
  "Tue 18 Aug": 5,
  "Wed 19 Aug": 6,
};

/** The session before the next one: a week back, or two on a fortnightly cadence. */
function lastSeenFor(next: string, sessions: number, track: Track, r: () => number): string {
  if (sessions === 0) return "—";
  const off = DAY_OFFSET[next.slice(0, 10)];
  if (off === undefined) return dayLabel(-8 - Math.floor(r() * 3) * 7);
  return dayLabel(off - (track === "remission" ? 14 : 7));
}

/** mulberry32 — small, seeded, and the same on the server and the client. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Counts chosen so the whole cohort agrees with the dashboard: 68 active,
   7 not on track. Authored rows are counted first. */
const MIX: readonly Track[] = [
  ...Array<Track>(12).fill("slow"),
  ...Array<Track>(30).fill("responding"),
  ...Array<Track>(12).fill("remission"),
  ...Array<Track>(7).fill("baseline"),
];

const DAYS = ["Thu 13 Aug", "Fri 14 Aug", "Mon 17 Aug", "Tue 18 Aug", "Wed 19 Aug"] as const;
const HOURS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] as const;
const PAYERS = ["Aetna", "BCBS", "Cigna", "Medicaid", "Self-pay", "UnitedHealthcare"] as const;
const PROGRAMS: readonly Program[] = ["Adult depression", "Anxiety", "Perinatal", "Young adult"];
const CLIN: readonly ClinicianId[] = ["lake", "osei", "brandt", "tash", "lake", "osei", "brandt"];

function curve(track: Track, start: number, n: number, r: () => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const t = n <= 1 ? 0 : i / (n - 1);
    const drop =
      track === "slow"
        ? start * 0.28 * t
        : track === "responding"
          ? start * 0.55 * Math.sqrt(t)
          : start * 0.78 * Math.sqrt(t);
    const noise = i === 0 ? 0 : Math.round((r() - 0.5) * 2);
    out.push(Math.max(0, Math.round(start - drop) + noise));
  }
  return out;
}

function build(): Patient[] {
  const r = rng(0x5eed);
  const out: Patient[] = [];

  const make = (s: Seed, i: number): Patient => {
    const [id, name, full, clinician, program, instrument, scores, sessions, track, next] = s;
    const age = 19 + Math.floor(r() * 44);
    const month = 1 + Math.floor(r() * 12);
    const day = 1 + Math.floor(r() * 27);
    const enrolledWeeks = Math.max(sessions, 1) + Math.floor(r() * 3);
    return {
      id,
      name,
      full,
      mrn: `40-${String(100 + ((i * 37) % 900)).padStart(3, "0")}-${String(200 + ((i * 131) % 800)).padStart(3, "0")}`,
      dob: `${2026 - age}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      age,
      pronouns: pronounsFor(full, i),
      clinician,
      program,
      instrument,
      scores,
      sessions,
      track,
      modality: r() > 0.45 ? "Telehealth" : "In person",
      cadence: track === "remission" ? "Fortnightly" : "Weekly",
      enrolled: dayLabel(-enrolledWeeks * 7),
      lastSeen: lastSeenFor(next, sessions, track, r),
      next,
      payer: PAYERS[Math.floor(r() * PAYERS.length)]!,
      isNew: sessions <= 2,
    };
  };

  /* One booking per clinician per hour. E. Lake's Thursday is fully authored,
     P. Osei supervises at 14:00, and nothing is booked before now. */
  const taken = new Set<string>();
  for (const s of AUTHORED) taken.add(`${s[3]}|${s[9]}`);
  for (const h of HOURS) taken.add(`lake|Thu 13 Aug ${h}`);
  taken.add("osei|Thu 13 Aug 14:00");
  const book = (clinician: ClinicianId, d0: number, h0: number): string => {
    for (let n = 0; n < DAYS.length * HOURS.length; n += 1) {
      const d = (d0 + Math.floor((h0 + n) / HOURS.length)) % DAYS.length;
      const h = (h0 + n) % HOURS.length;
      const label = `${DAYS[d]!} ${HOURS[h]!}`;
      if (d === 0 && HOURS[h]! < "11:00") continue;
      if (taken.has(`${clinician}|${label}`)) continue;
      taken.add(`${clinician}|${label}`);
      return label;
    }
    return "—";
  };

  AUTHORED.forEach((s, i) => out.push({ ...make(s, i), ...OVERRIDES[s[0]] }));

  const counts = new Map<Track, number>();
  for (const p of out) counts.set(p.track, (counts.get(p.track) ?? 0) + 1);
  const remaining = [...MIX];
  for (const [track, n] of counts) {
    for (let k = 0; k < n; k += 1) {
      const at = remaining.indexOf(track);
      if (at >= 0) remaining.splice(at, 1);
    }
  }

  remaining.forEach((track, k) => {
    const surname = SURNAMES[k % SURNAMES.length]!;
    const first = FIRSTS[(k * 7) % FIRSTS.length]!;
    const instrument: InstrumentCode = r() > 0.4 ? "PHQ-9" : "GAD-7";
    const max = INSTRUMENT_MAX[instrument];
    const sessions = track === "baseline" ? Math.floor(r() * 2) : 3 + Math.floor(r() * 12);
    const start = Math.round(max * (0.45 + r() * 0.3));
    const scores = track === "baseline" ? [] : curve(track, start, sessions, r);
    const clinician = CLIN[k % CLIN.length]!;
    const d0 = Math.floor(r() * DAYS.length);
    const h0 = Math.floor(r() * HOURS.length);
    // Three people with nothing booked: the gap the caseload exists to catch.
    const next = k === 5 || k === 22 || k === 39 ? "—" : book(clinician, d0, h0);
    out.push(
      make(
        [
          surname.toLowerCase().replace(/[^a-z]/g, ""),
          `${first[0]}. ${surname}`,
          `${surname}, ${first}`,
          clinician,
          PROGRAMS[k % PROGRAMS.length]!,
          instrument,
          scores,
          sessions,
          track,
          next,
        ],
        out.length,
      ),
    );
  });

  return out;
}

export const PATIENTS: readonly Patient[] = build();

const BY_ID = new Map(PATIENTS.map((p) => [p.id, p]));

export function patient(id: string): Patient {
  return BY_ID.get(id) ?? PATIENTS[0]!;
}

/** One face per person across the app; the first 28 never collide. */
const BY_NAME = new Map(PATIENTS.map((p) => [p.name, p]));
const ASSIGNED = assignFaces(PATIENTS);

/** A patient's portrait. Same person, same face, on every screen. */
export function faceOf(name: string): string {
  const p = BY_NAME.get(name);
  return (p && ASSIGNED.get(p.id)) ?? faceFor(name);
}

export function latest(p: Patient): number | null {
  return p.scores.length ? p.scores[p.scores.length - 1]! : null;
}

/** "flat", "↓ 9", "↑ 2" — intake to latest. */
export function trend(p: Patient): string {
  if (p.scores.length < 2) return "—";
  const d = p.scores[p.scores.length - 1]! - p.scores[0]!;
  if (Math.abs(d) <= 2 && p.track === "not-on-track" && d <= 0) return "flat";
  if (d === 0) return "flat";
  return d < 0 ? `↓ ${-d}` : `↑ ${d}`;
}

/** "PHQ-9 16", or an em dash before a baseline exists. */
export function reading(p: Patient): string {
  const v = latest(p);
  return v === null ? "—" : `${p.instrument} ${v}`;
}

/** Severity band of a score on its own instrument. */
export function band(code: InstrumentCode, v: number): { label: string; sev: Sev } {
  if (code === "PHQ-9") {
    if (v >= 20) return { label: "Severe", sev: "crit" };
    if (v >= 15) return { label: "Moderately severe", sev: "crit" };
    if (v >= 10) return { label: "Moderate", sev: "high" };
    if (v >= 5) return { label: "Mild", sev: "low" };
    return { label: "Minimal", sev: "norm" };
  }
  if (v >= 15) return { label: "Severe", sev: "crit" };
  if (v >= 10) return { label: "Moderate", sev: "high" };
  if (v >= 5) return { label: "Mild", sev: "low" };
  return { label: "Minimal", sev: "norm" };
}

/** Attention order: track first, then by how far the score sits from remission. */
export function byAttention(a: Patient, b: Patient): number {
  const t = TRACK[a.track].rank - TRACK[b.track].rank;
  if (t !== 0) return t;
  return (
    (latest(b) ?? 0) / INSTRUMENT_MAX[b.instrument] -
    (latest(a) ?? 0) / INSTRUMENT_MAX[a.instrument]
  );
}

/* ------------------------------------------------------------ risk items */

export type RiskKind = "cssrs" | "plan-review" | "crisis-call" | "missed-contact";

export interface RiskItem {
  id: string;
  patient: string;
  kind: RiskKind;
  what: string;
  opened: string;
  owner: ClinicianId;
  sev: Sev;
  /** Time left as shown, or "overdue". */
  left: string;
  usedPct: number;
  window: string;
  /** Minutes remaining, for ordering. Negative when overdue. */
  minutes: number;
}

/**
 * The queue. Ordered by `minutes`, never by severity label — the overdue plan
 * review outranks a positive screen with most of its window left.
 */
export const RISKS: readonly RiskItem[] = [
  {
    id: "rk-ferreira-plan",
    patient: "ferreira",
    kind: "plan-review",
    what: "Safety plan 62 days old",
    opened: "12 Jun",
    owner: "lake",
    sev: "high",
    left: "overdue",
    usedPct: 100,
    window: "60d review",
    minutes: -2880,
  },
  {
    id: "rk-okonkwo-cssrs",
    patient: "okonkwo",
    kind: "cssrs",
    what: "C-SSRS positive",
    opened: "12 Aug 14:20",
    owner: "lake",
    sev: "crit",
    left: "4h 12m",
    usedPct: 83,
    window: "24h window",
    minutes: 252,
  },
  {
    id: "rk-mwangi-cssrs",
    patient: "mwangi",
    kind: "crisis-call",
    what: "C-SSRS positive, crisis line",
    opened: "13 Aug 05:08",
    owner: "tash",
    sev: "crit",
    left: "19h 00m",
    usedPct: 21,
    window: "24h window",
    minutes: 1140,
  },
  {
    id: "rk-haddad-missed",
    patient: "haddad",
    kind: "missed-contact",
    what: "Two missed sessions, perinatal",
    opened: "10 Aug",
    owner: "osei",
    sev: "high",
    left: "1d 23h",
    usedPct: 45,
    window: "72h outreach",
    minutes: 2820,
  },
  {
    id: "rk-oyelaran-plan",
    patient: "oyelaran",
    kind: "plan-review",
    what: "Safety plan review due",
    opened: "20 Jun",
    owner: "osei",
    sev: "low",
    left: "6d",
    usedPct: 90,
    window: "60d review",
    minutes: 8640,
  },
];

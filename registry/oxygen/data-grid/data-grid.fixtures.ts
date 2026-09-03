/**
 * One synthetic behavioral health caseload, and four kinds of missing value.
 *
 * ⚠️  Every value here is invented. Nobody below is a client; the names, MRNs,
 * scores and risk numbers are made up, and the portraits referenced by `photo`
 * are generated images of people who do not exist.
 *
 * Shared between the stories, the tests and the docs preview so all three argue
 * about the same caseload. It was a med-surg potassium worklist and is now the
 * domain this library is actually for, which changes what the hard cases are:
 *
 *   · a **declined** questionnaire is not a gap in the record, it is a clinical
 *     event with its own follow-up;
 *   · a **restricted** row is usually 42 CFR Part 2, where a substance use
 *     record is governed by a different federal rule than the chart around it,
 *     and "not available to you" is the honest and legally required answer;
 *   · a risk screen still **awaiting** is somebody's job in progress, and
 *     rendering it as "no risk" is the failure that gets written up.
 *
 * The absence vocabulary was built for exactly these and they are all here.
 */

import type { GridColumnSpec, GridCoverage, GridDerivation, GridValue } from "@/lib/oxygen-grid";

export interface CaseloadRow {
  name: string;
  mrn: string;
  /** Level of care. A term from a small vocabulary, not a quantity. */
  program: "IOP" | "PHP" | "Outpatient" | "ACT";
  /** PHQ-9 total, 0–27, or the reason there is not one. */
  phq9: GridValue;
  /** The previous total, so the row carries a direction as well as a number. */
  previousPhq9?: number;
  /** Most recent C-SSRS screen, or the reason there is not one. */
  cssrs: GridValue;
  /** Model output. Sorting by it is the thing that raises the footnote. */
  risk: number;
  /** Next scheduled contact. */
  due: string;
  /** Who is answerable for the row. */
  clinician: string;
  /**
   * A portrait, for surfaces that show one.
   *
   * Docs-side only: the component renders whatever `cell` returns and has no
   * opinion about photographs. A real product's answer to "no photo on file"
   * versus "photo withheld by policy" is PatientChip, which distinguishes five
   * of them.
   */
  photo: string;
}

/**
 * The model behind the risk column.
 *
 * Disengagement rather than suicide risk, deliberately. Both are real models in
 * this field; only one of them can go on a marketing page without the
 * demonstration becoming a claim about something nobody should rank casually.
 * The population clause is the honest kind — a model fitted on English-language
 * intakes does not apply to a good part of the caseload it will be pointed at,
 * and saying so is exactly what the footnote is for.
 */
export const DISENGAGEMENT: GridDerivation = {
  model: "disengagement",
  version: "v1.8",
  validatedOn: "9,140 outpatient episodes",
  population: "adults, English-language intake only",
};

/**
 * The C-SSRS screen, worst first.
 *
 * A `status` column sorts by this declared order rather than alphabetically,
 * which is the whole reason the kind exists: "None reported" sorting above
 * "Ideation with plan" because N precedes I is how a worklist buries the row it
 * was built to surface.
 */
export const CSSRS_ORDER: readonly string[] = [
  "Ideation with plan",
  "Ideation, no plan",
  "Passive ideation",
  "None reported",
];

const portrait = (mrn: string) => `/fixtures/patients/${mrn}.jpg`;

/**
 * The caseload, in the order the team last touched it.
 *
 * Not pre-sorted by risk, deliberately. A grid that boots sorted by a model
 * column has performed the clinical act before anybody asked for it, and the
 * caller's own order carries information no column does.
 */
export const CASELOAD: CaseloadRow[] = [
  {
    name: "Novak, K.",
    mrn: "5518203",
    program: "Outpatient",
    phq9: 11,
    previousPhq9: 13,
    cssrs: "Passive ideation",
    risk: 0.52,
    due: "Thu 16:00",
    clinician: "T. Boateng",
    photo: portrait("5518203"),
  },
  {
    name: "Adeyemi, R.",
    mrn: "4471902",
    program: "IOP",
    phq9: 22,
    previousPhq9: 17,
    cssrs: "Ideation with plan",
    risk: 0.82,
    due: "Today 14:00",
    clinician: "A. Vance",
    photo: portrait("4471902"),
  },
  {
    name: "Haddad, N.",
    mrn: "6690321",
    program: "IOP",
    phq9: 7,
    previousPhq9: 11,
    cssrs: "None reported",
    risk: 0.41,
    due: "Fri 18:20",
    clinician: "K. Marsh",
    photo: portrait("6690321"),
  },
  {
    name: "Raman, A.",
    mrn: "3320145",
    program: "PHP",
    phq9: 18,
    previousPhq9: 15,
    cssrs: "Ideation, no plan",
    risk: 0.68,
    due: "Today 15:30",
    clinician: "A. Vance",
    photo: portrait("3320145"),
  },
  {
    name: "Vasquez, I.",
    mrn: "2214870",
    program: "PHP",
    phq9: { absent: "awaiting", detail: "Assessment booked; the client has not completed it." },
    cssrs: "Ideation, no plan",
    risk: 0.39,
    due: "Today 17:10",
    clinician: "S. Okafor",
    photo: portrait("2214870"),
  },
  {
    name: "Lindqvist, S.",
    mrn: "7745012",
    program: "Outpatient",
    /*
     * 42 CFR Part 2.
     *
     * A substance use record governed by a different federal rule than the
     * chart around it. The value exists and this reader is not entitled to it,
     * which is a different fact from nobody having recorded one — and the one
     * case where rendering a blank is not merely unhelpful but wrong.
     */
    phq9: { absent: "restricted", detail: "Part 2 record — not available to you." },
    cssrs: { absent: "restricted", detail: "Part 2 record — not available to you." },
    risk: 0.19,
    due: "Mon 19:00",
    clinician: "T. Boateng",
    photo: portrait("7745012"),
  },
];

/**
 * The rest of the caseload, for the surfaces that scroll.
 *
 * Twenty-two more rows so infinite scroll has something to reach the end of.
 * Kept separate from `CASELOAD` on purpose: the stories and tests assert on six
 * named rows, and a fixture that grew under them would turn every count in the
 * suite into a moving target. Risk thins out down the list, which is what a
 * caseload sorted by it actually looks like.
 */
export const CASELOAD_TAIL: CaseloadRow[] = [
  {
    name: "Okafor, B.",
    mrn: "8812004",
    program: "IOP",
    phq9: 16,
    previousPhq9: 12,
    cssrs: "Ideation, no plan",
    risk: 0.61,
    due: "Mon 8:30",
    clinician: "A. Vance",
    photo: portrait("8812004"),
  },
  {
    name: "Silva, M.",
    mrn: "4420931",
    program: "PHP",
    phq9: 17,
    previousPhq9: 18,
    cssrs: "Ideation, no plan",
    risk: 0.57,
    due: "Tue 9:00",
    clinician: "T. Boateng",
    photo: portrait("4420931"),
  },
  {
    name: "Dubois, H.",
    mrn: "6673518",
    program: "Outpatient",
    phq9: 20,
    previousPhq9: 19,
    cssrs: "Ideation with plan",
    risk: 0.58,
    due: "Wed 10:30",
    clinician: "K. Marsh",
    photo: portrait("6673518"),
  },
  {
    name: "Iqbal, S.",
    mrn: "2298440",
    program: "ACT",
    phq9: 15,
    previousPhq9: 12,
    cssrs: "Ideation, no plan",
    risk: 0.52,
    due: "Thu 11:00",
    clinician: "S. Okafor",
    photo: portrait("2298440"),
  },
  {
    name: "Kowalski, P.",
    mrn: "5140276",
    program: "IOP",
    phq9: 16,
    previousPhq9: 12,
    cssrs: "Ideation, no plan",
    risk: 0.51,
    due: "Fri 12:30",
    clinician: "A. Vance",
    photo: portrait("5140276"),
  },
  {
    name: "Mensah, A.",
    mrn: "7731905",
    program: "PHP",
    phq9: 13,
    previousPhq9: 12,
    cssrs: "Ideation, no plan",
    risk: 0.52,
    due: "Mon 13:00",
    clinician: "T. Boateng",
    photo: portrait("7731905"),
  },
  {
    name: "Rossi, G.",
    mrn: "3384712",
    program: "Outpatient",
    phq9: 15,
    previousPhq9: 11,
    cssrs: "Ideation, no plan",
    risk: 0.48,
    due: "Tue 14:30",
    clinician: "K. Marsh",
    photo: portrait("3384712"),
  },
  {
    name: "Andersen, L.",
    mrn: "9905633",
    program: "ACT",
    phq9: 13,
    previousPhq9: 12,
    cssrs: "Ideation, no plan",
    risk: 0.46,
    due: "Wed 15:00",
    clinician: "S. Okafor",
    photo: portrait("9905633"),
  },
  {
    name: "Nguyen, T.",
    mrn: "1176284",
    program: "IOP",
    phq9: 14,
    previousPhq9: 14,
    cssrs: "Ideation, no plan",
    risk: 0.4,
    due: "Thu 16:30",
    clinician: "A. Vance",
    photo: portrait("1176284"),
  },
  {
    name: "Farah, Y.",
    mrn: "6620158",
    program: "PHP",
    phq9: 12,
    previousPhq9: 12,
    cssrs: "Passive ideation",
    risk: 0.4,
    due: "Fri 8:00",
    clinician: "T. Boateng",
    photo: portrait("6620158"),
  },
  {
    name: "Brennan, C.",
    mrn: "4471330",
    program: "Outpatient",
    phq9: 12,
    previousPhq9: 9,
    cssrs: "Passive ideation",
    risk: 0.38,
    due: "Mon 9:30",
    clinician: "K. Marsh",
    photo: portrait("4471330"),
  },
  {
    name: "Tanaka, R.",
    mrn: "8853097",
    program: "ACT",
    phq9: 12,
    previousPhq9: 13,
    cssrs: "Passive ideation",
    risk: 0.36,
    due: "Tue 10:00",
    clinician: "S. Okafor",
    photo: portrait("8853097"),
  },
  {
    name: "Ortiz, E.",
    mrn: "2214009",
    program: "IOP",
    phq9: 11,
    previousPhq9: 7,
    cssrs: "Passive ideation",
    risk: 0.31,
    due: "Wed 11:30",
    clinician: "A. Vance",
    photo: portrait("2214009"),
  },
  {
    name: "Weber, J.",
    mrn: "5567842",
    program: "PHP",
    phq9: 10,
    previousPhq9: 12,
    cssrs: "Passive ideation",
    risk: 0.32,
    due: "Thu 12:00",
    clinician: "T. Boateng",
    photo: portrait("5567842"),
  },
  {
    name: "Ahmed, N.",
    mrn: "3390264",
    program: "Outpatient",
    phq9: 9,
    previousPhq9: 12,
    cssrs: "Passive ideation",
    risk: 0.3,
    due: "Fri 13:30",
    clinician: "K. Marsh",
    photo: portrait("3390264"),
  },
  {
    name: "Larsen, K.",
    mrn: "7702581",
    program: "ACT",
    phq9: 6,
    previousPhq9: 4,
    cssrs: "Passive ideation",
    risk: 0.25,
    due: "Mon 14:00",
    clinician: "S. Okafor",
    photo: portrait("7702581"),
  },
  {
    name: "Costa, D.",
    mrn: "1148936",
    program: "IOP",
    phq9: 6,
    previousPhq9: 6,
    cssrs: "Passive ideation",
    risk: 0.25,
    due: "Tue 15:30",
    clinician: "A. Vance",
    photo: portrait("1148936"),
  },
  {
    name: "Bello, F.",
    mrn: "9963410",
    program: "PHP",
    phq9: 9,
    previousPhq9: 12,
    cssrs: "Passive ideation",
    risk: 0.21,
    due: "Wed 16:00",
    clinician: "T. Boateng",
    photo: portrait("9963410"),
  },
  {
    name: "Hansen, M.",
    mrn: "4405177",
    program: "Outpatient",
    phq9: 8,
    previousPhq9: 5,
    cssrs: "Passive ideation",
    risk: 0.18,
    due: "Thu 8:30",
    clinician: "K. Marsh",
    photo: portrait("4405177"),
  },
  {
    name: "Grant, A.",
    mrn: "6690822",
    program: "ACT",
    phq9: 3,
    previousPhq9: 4,
    cssrs: "None reported",
    risk: 0.16,
    due: "Fri 9:00",
    clinician: "S. Okafor",
    photo: portrait("6690822"),
  },
  {
    name: "Yusuf, Z.",
    mrn: "3327469",
    program: "IOP",
    phq9: 4,
    previousPhq9: 0,
    cssrs: "None reported",
    risk: 0.12,
    due: "Mon 10:30",
    clinician: "A. Vance",
    photo: portrait("3327469"),
  },
  {
    name: "Moreau, V.",
    mrn: "8814053",
    program: "PHP",
    phq9: 2,
    previousPhq9: 3,
    cssrs: "None reported",
    risk: 0.14,
    due: "Tue 11:00",
    clinician: "T. Boateng",
    photo: portrait("8814053"),
  },
];

/** The twenty-eight hand-written rows the stories and tests assert on by name. */
const CASELOAD_FULL_SEED: CaseloadRow[] = [...CASELOAD, ...CASELOAD_TAIL];

/* ------------------------------------------------------------------ */
/* The rest of the team's caseload, generated                          */
/* ------------------------------------------------------------------ */

/**
 * Three hundred more rows, made rather than typed.
 *
 * ⚠️  Still invented, and more obviously so: these come out of a seeded
 * generator, which is the strongest guarantee this file can offer that nothing
 * here was copied from a chart. The twenty-eight rows above are hand-written
 * because the stories assert on them by name; the rest exist so a scrolling
 * surface has something real to scroll, and so the demo is a caseload rather
 * than a screenshot of one.
 *
 * Deterministic on purpose. A fixture that reshuffles on every import is a
 * fixture that makes a snapshot flake and a screenshot lie.
 */
function seeded(seed: number): () => number {
  // mulberry32 — 32 bits of state, uniform enough for names and scores, and
  // short enough to read in one sitting.
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FAMILY = [
  "Abara",
  "Alvarez",
  "Baptiste",
  "Bergström",
  "Cardoso",
  "Chowdhury",
  "Delacroix",
  "Duarte",
  "Egwuatu",
  "Eriksen",
  "Fontaine",
  "Gallagher",
  "Georgiou",
  "Guzmán",
  "Halloran",
  "Ibrahim",
  "Ivanova",
  "Jankowski",
  "Kaur",
  "Keita",
  "Lindberg",
  "Maalouf",
  "Mbeki",
  "Navarro",
  "Nwosu",
  "O'Doherty",
  "Pereira",
  "Petrosyan",
  "Quintero",
  "Rahimi",
  "Reyes",
  "Salazar",
  "Sandoval",
  "Sørensen",
  "Tadesse",
  "Thibault",
  "Uddin",
  "Vermeulen",
  "Whitfield",
  "Xiao",
  "Yamamoto",
  "Zubair",
];

const INITIAL = "ABCDEFGHIJKLMNOPRSTVWY".split("");

const PROGRAMS: CaseloadRow["program"][] = ["IOP", "PHP", "Outpatient", "ACT"];

/** Six clinicians, so "my caseload" is a sixth of the team rather than all of it. */
const CLINICIANS = ["A. Vance", "K. Marsh", "S. Okafor", "T. Boateng", "R. Idris", "M. Halloway"];

/* "Today" is in the pool so an overdue-contact view has something to select.
   Weighted low: most of a caseload is not due in the next few hours. */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Mon", "Tue", "Wed", "Thu", "Fri", "Today"];
const TIMES = ["8:00", "8:30", "9:15", "10:00", "11:30", "13:00", "14:15", "15:45", "16:30"];

/** The MRNs with a portrait on disk, reused across the generated rows. */
const FACES = CASELOAD_FULL_SEED.map((row) => row.mrn);

/**
 * One generated row.
 *
 * Absence is sprinkled at roughly one row in nine, which is close to what a
 * real caseload carries and well above what a demo usually admits to. The four
 * reasons keep their proportions: a booked-but-unfinished assessment is common,
 * a Part 2 restriction is not.
 */
function makeRow(index: number, random: () => number): CaseloadRow {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)] as T;
  // Drawn, not counted: a column of MRNs climbing by a fixed step reads as a
  // spreadsheet's row number, which is the one thing an identifier must not
  // look like.
  const mrn = String(1_000_000 + Math.floor(random() * 8_999_000));
  const phq9Total = Math.floor(random() * 28);
  const drift = Math.floor(random() * 9) - 4;
  const absence = random();

  return {
    name: `${pick(FAMILY)}, ${pick(INITIAL)}.`,
    mrn,
    program: pick(PROGRAMS),
    phq9:
      absence < 0.05
        ? { absent: "awaiting", detail: "Assessment booked; the client has not completed it." }
        : absence < 0.08
          ? { absent: "refused" }
          : phq9Total,
    previousPhq9: absence < 0.08 ? undefined : Math.max(0, Math.min(27, phq9Total - drift)),
    cssrs:
      absence < 0.03
        ? { absent: "restricted", detail: "Part 2 record — not available to you." }
        : absence < 0.11
          ? { absent: "not-recorded" }
          : pick(CSSRS_ORDER),
    risk: Math.round(random() * 80 + 5) / 100,
    due: `${pick(DAYS)} ${pick(TIMES)}`,
    clinician: pick(CLINICIANS),
    photo: portrait(FACES[(index * 7) % FACES.length] ?? FACES[0] ?? ""),
  };
}

/** The generated remainder. One seed, so the list is the same everywhere. */
export const CASELOAD_GENERATED: CaseloadRow[] = (() => {
  const random = seeded(20_260_902);
  const taken = new Set(CASELOAD_FULL_SEED.map((row) => row.mrn));
  const out: CaseloadRow[] = [];
  for (let i = 0; out.length < 300; i += 1) {
    const row = makeRow(i, random);
    // An MRN that collided would give two rows the same key, which is the one
    // thing this component's row identity may not tolerate.
    if (taken.has(row.mrn)) continue;
    taken.add(row.mrn);
    out.push(row);
  }
  return out;
})();

/** The caseload as a scrolling surface sees it: the twenty-eight, then the rest. */
export const CASELOAD_FULL: CaseloadRow[] = [...CASELOAD_FULL_SEED, ...CASELOAD_GENERATED];

/**
 * Two more rows, for the state that shows every absence at once.
 *
 * `not-recorded` and `refused` are the two most often collapsed into one blank
 * cell and the two furthest apart clinically. In this domain especially: a
 * client declining a depression questionnaire is a clinical event with its own
 * follow-up, and rendering it identically to a form nobody handed out loses the
 * only signal in the row.
 */
export const CASELOAD_WITH_EVERY_ABSENCE: CaseloadRow[] = [
  ...CASELOAD,
  {
    name: "Petrov, D.",
    mrn: "9910447",
    program: "ACT",
    phq9: { absent: "not-recorded" },
    cssrs: "Passive ideation",
    risk: 0.35,
    due: "Thu 16:40",
    clinician: "K. Marsh",
    photo: portrait("9910447"),
  },
  {
    name: "Nakamura, Y.",
    mrn: "6031288",
    program: "Outpatient",
    phq9: { absent: "refused" },
    cssrs: "None reported",
    risk: 0.31,
    due: "Fri 17:55",
    clinician: "S. Okafor",
    photo: portrait("6031288"),
  },
  /*
   * The fifth reason, which the fixture was missing.
   *
   * `GridAbsence` has five members and this list demonstrated four, so the
   * component's own state was published as "Absence, said four ways" while the
   * type, the rationale and the FHIR note all said five. `unknown` is the one
   * that gets dropped because it feels like a non-answer — and it is precisely
   * the one a federated query produces most often: the source returned no
   * value and gave no reason, which is different from every other row here
   * because there is nobody to chase.
   */
  {
    name: "Adebayo, K.",
    mrn: "7742019",
    program: "Outpatient",
    phq9: { absent: "unknown" },
    cssrs: "None reported",
    risk: 0.28,
    due: "Fri 09:15",
    clinician: "K. Marsh",
    photo: portrait("7742019"),
  },
];

/**
 * Scores that have come back and are being held.
 *
 * Every one lands on a row that already has a value, so admitting them changes
 * numbers and order without changing the row count or the footnote list. That
 * is a demo constraint rather than a clinical one, and it is written here so
 * the next person does not "fix" it by pointing them at the absent rows.
 */
const arrival = (mrn: string, phq9: number, previousPhq9: number, risk: number): CaseloadRow => {
  const row = CASELOAD.find((entry) => entry.mrn === mrn);
  // By MRN rather than by index: an arrival that silently attached itself to
  // whichever row happened to sit at position 3 is the same class of mistake
  // the component's row keys exist to prevent.
  if (!row) throw new Error(`no caseload row for ${mrn}`);
  return { ...row, phq9, previousPhq9, risk };
};

export const ARRIVALS: CaseloadRow[] = [
  arrival("3320145", 21, 18, 0.74),
  arrival("5518203", 14, 11, 0.58),
  arrival("6690321", 5, 7, 0.33),
];

/** How many the filter matched, against how many are on screen. */
export const CASELOAD_COVERAGE: GridCoverage = {
  shown: CASELOAD.length,
  total: 312,
  noun: "clients on this team's caseload",
  predicate: "PHQ-9 of 10 or more, or a risk screen in the last 14 days.",
};

/**
 * The same query against a server that will not say how many matched.
 *
 * Not a contrived case. `Bundle.total` is optional in FHIR, the spec forbids
 * constructing paging URLs, and some servers return a `next` link and nothing
 * else — so this is the shape a conformant integration actually produces.
 */
export const UNKNOWN_TOTAL_COVERAGE: GridCoverage = {
  shown: CASELOAD.length,
  total: "unknown",
  noun: "clients",
  predicate: "PHQ-9 of 10 or more, or a risk screen in the last 14 days.",
};

/**
 * The severity band for a PHQ-9 total.
 *
 * Supplied by the caller, never by the grid: these cut points belong to the
 * instrument, and a component library that shipped them would be asserting a
 * threshold on behalf of every service that installs it.
 */
export function phq9Band(value: GridValue): string {
  if (typeof value !== "number") return "";
  if (value >= 20) return "severe";
  if (value >= 15) return "mod-severe";
  if (value >= 10) return "moderate";
  if (value >= 5) return "mild";
  return "minimal";
}

/** The columns every story and test shares. */
export const CASELOAD_COLUMNS: GridColumnSpec<CaseloadRow>[] = [
  { key: "name", header: "Client", kind: "text", value: (row) => row.name },
  { key: "mrn", header: "MRN", kind: "identifier", value: (row) => row.mrn },
  { key: "phq9", header: "PHQ-9", kind: "measure", value: (row) => row.phq9 },
  {
    key: "cssrs",
    header: "Risk screen",
    kind: "status",
    order: CSSRS_ORDER,
    value: (row) => row.cssrs,
  },
  {
    key: "risk",
    header: "Disengagement risk",
    kind: "number",
    value: (row) => row.risk,
    derived: DISENGAGEMENT,
  },
  { key: "due", header: "Next contact", kind: "instant", value: (row) => row.due },
];

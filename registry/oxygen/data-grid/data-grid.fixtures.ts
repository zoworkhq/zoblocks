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

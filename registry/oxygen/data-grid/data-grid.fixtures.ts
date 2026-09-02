/**
 * One synthetic ward, six patients, four kinds of missing value.
 *
 * ⚠️  Every value here is invented. Nobody below is a patient; the names,
 * MRNs, results and risk scores are made up, and the portraits referenced by
 * `photo` are generated images of people who do not exist.
 *
 * Shared between the stories, the tests and the docs preview so all three
 * argue about the same ward. The set deliberately over-represents the states a
 * worklist gets wrong: a critical value, a value awaiting a lab, a record this
 * reader is not entitled to, a question nobody asked, and an answer the
 * patient declined. A demo with six clean numbers in it proves nothing.
 */

import type { GridColumnSpec, GridCoverage, GridDerivation, GridValue } from "@/lib/oxygen-grid";

export interface WardRow {
  name: string;
  mrn: string;
  /** The latest potassium, or the reason there is not one. */
  potassium: GridValue;
  /** Model output. Sorting by it is the thing that raises the footnote. */
  risk: number;
  /** Next observation round. */
  due: string;
  /**
   * A portrait, for surfaces that show one.
   *
   * Docs-side only: the component renders whatever `cell` returns and has no
   * opinion about photographs. A real product's answer to "no photo on file"
   * versus "photo withheld by policy" is PatientChip, which distinguishes
   * five of them.
   */
  photo: string;
  /** Ward and bed. An identifier, not a number: 4W-07 does not sort as seven. */
  bed: string;
  /**
   * The previous potassium, so the row can carry a direction as well as a value.
   *
   * A worklist that shows 5.9 and not "up from 4.8 yesterday" has left the
   * reader to remember the trajectory, and the trajectory is most of the
   * clinical signal — a stable 5.9 and a climbing 5.9 are different patients.
   */
  previous?: number;
  /**
   * Who is answerable for the row.
   *
   * Present on every row on purpose. A queue that shows what is owed and not
   * who owes it is a list somebody else will action, and the column that would
   * most often be blank is the one worth making mandatory.
   */
  owner: string;
}

/** The model behind the risk column. Named so the footnote can be generated. */
export const EARLY_WARNING: GridDerivation = {
  model: "early-warning",
  version: "v2.4",
  validatedOn: "12,410 med-surg admissions",
  population: "adults only",
};

const portrait = (mrn: string) => `/fixtures/patients/${mrn}.jpg`;

/**
 * The ward, in arrival order.
 *
 * Not pre-sorted by risk, deliberately. A grid that boots sorted by a model
 * column has performed the clinical act before anybody asked for it, and the
 * caller's own order carries information — here, the order results came back
 * in — that no column does.
 */
export const WARD: WardRow[] = [
  {
    name: "Novak, K.",
    mrn: "5518203",
    owner: "T. Boateng",
    bed: "4W-02",
    previous: 4.3,
    potassium: 4.1,
    risk: 0.44,
    due: "16:00",
    photo: portrait("5518203"),
  },
  {
    name: "Adeyemi, R.",
    mrn: "4471902",
    owner: "A. Vance",
    bed: "4W-07",
    previous: 5.9,
    potassium: 6.8,
    risk: 0.82,
    due: "14:00",
    photo: portrait("4471902"),
  },
  {
    name: "Haddad, N.",
    mrn: "6690321",
    owner: "K. Marsh",
    bed: "4W-11",
    previous: 3.6,
    potassium: 3.2,
    risk: 0.28,
    due: "18:20",
    photo: portrait("6690321"),
  },
  {
    name: "Raman, A.",
    mrn: "3320145",
    owner: "A. Vance",
    bed: "4W-04",
    previous: 4.8,
    potassium: 5.4,
    risk: 0.61,
    due: "15:30",
    photo: portrait("3320145"),
  },
  {
    name: "Vasquez, I.",
    mrn: "2214870",
    owner: "S. Okafor",
    bed: "4W-15",
    potassium: { absent: "awaiting", detail: "Specimen received; the lab has not resulted it." },
    risk: 0.39,
    due: "17:10",
    photo: portrait("2214870"),
  },
  {
    name: "Lindqvist, S.",
    mrn: "7745012",
    owner: "T. Boateng",
    bed: "4W-09",
    potassium: { absent: "restricted" },
    risk: 0.19,
    due: "19:00",
    photo: portrait("7745012"),
  },
];

/**
 * Two more rows, for the state that shows every absence at once.
 *
 * `not-recorded` and `refused` are the two most often collapsed into the same
 * blank cell, and they are the two furthest apart clinically: one is an
 * omission and the other is the patient's own decision, which is itself a
 * clinical fact somebody may need to act on.
 */
export const WARD_WITH_EVERY_ABSENCE: WardRow[] = [
  ...WARD,
  {
    name: "Petrov, D.",
    mrn: "9910447",
    owner: "K. Marsh",
    bed: "4W-06",
    previous: 4.7,
    potassium: { absent: "not-recorded" },
    risk: 0.35,
    due: "16:40",
    photo: portrait("9910447"),
  },
  {
    name: "Nakamura, Y.",
    mrn: "6031288",
    owner: "S. Okafor",
    bed: "4W-13",
    previous: 4.0,
    potassium: { absent: "refused" },
    risk: 0.31,
    due: "17:55",
    photo: portrait("6031288"),
  },
];

/** Results that have landed and are being held. */
export const ARRIVALS: WardRow[] = [
  {
    name: "Raman, A.",
    mrn: "3320145",
    owner: "A. Vance",
    bed: "4W-04",
    previous: 5.4,
    potassium: 5.9,
    risk: 0.68,
    due: "15:30",
    photo: portrait("3320145"),
  },
  {
    name: "Petrov, D.",
    mrn: "9910447",
    owner: "K. Marsh",
    bed: "4W-06",
    previous: 5.2,
    potassium: 5.2,
    risk: 0.55,
    due: "16:40",
    photo: portrait("9910447"),
  },
  {
    name: "Nakamura, Y.",
    mrn: "6031288",
    owner: "S. Okafor",
    bed: "4W-13",
    previous: 3.9,
    potassium: 3.4,
    risk: 0.31,
    due: "17:55",
    photo: portrait("6031288"),
  },
];

/** How many the filter matched, against how many are on screen. */
export const WARD_COVERAGE: GridCoverage = {
  shown: WARD.length,
  total: 1438,
  noun: "patients in the cohort",
  predicate: "Unit is 4-West, and potassium outside the reference range in the last 24 hours.",
  asOf: "11:40",
};

/**
 * The same query against a server that will not say how many matched.
 *
 * Not a contrived case. `Bundle.total` is optional in FHIR, the spec forbids
 * constructing paging URLs, and some servers return a `next` link and nothing
 * else — so this is the shape a conformant integration actually produces.
 */
export const UNKNOWN_TOTAL_COVERAGE: GridCoverage = {
  shown: WARD.length,
  total: "unknown",
  noun: "patients",
  predicate: "Unit is 4-West, and potassium outside the reference range in the last 24 hours.",
};

/** The word beside a potassium. Supplied by the caller; the grid has no ranges. */
export function potassiumQualifier(value: GridValue): string {
  if (typeof value !== "number") return "";
  if (value >= 6) return "critical";
  if (value > 5.1) return "high";
  if (value < 3.5) return "low";
  return "";
}

/** The four columns every story and test shares. */
export const WARD_COLUMNS: GridColumnSpec<WardRow>[] = [
  { key: "name", header: "Patient", kind: "text", value: (row) => row.name },
  { key: "mrn", header: "MRN", kind: "identifier", value: (row) => row.mrn },
  { key: "potassium", header: "Potassium", kind: "measure", value: (row) => row.potassium },
  {
    key: "risk",
    header: "Deterioration risk",
    kind: "number",
    value: (row) => row.risk,
    derived: EARLY_WARNING,
  },
  { key: "due", header: "Next due", kind: "instant", value: (row) => row.due },
];

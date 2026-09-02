// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/lib/grid.ts. Edit that file, not this one.
/**
 * The engine behind DataGrid, and the reason it can be trusted.
 *
 * A clinical worklist is not a view of rows. It is a claim about a population
 * — "these twenty-four are the ones that matter" — made to somebody who will
 * act on it and who cannot see the other 1,414. Four things follow, and all
 * four live here rather than in the component, because each one has to be
 * provable without a DOM:
 *
 *   **Coverage is arithmetic, not a footer note.** A filtered grid is a worse
 *   liar than a paginated one: the filter was set by a human who has since
 *   stopped seeing it. So the predicate is a sentence and the count is a
 *   number, and `total` may be the literal string "unknown" — because against
 *   a FHIR server it often genuinely is, and inventing a total is the failure
 *   this type exists to prevent.
 *
 *   **Absence is a value, not a hole.** `GridValue` has no `null` member. A
 *   specimen still in the lab, a record this reader may not see, a question
 *   nobody asked and an answer the patient refused are four different facts,
 *   and the type will not let a caller collapse them into an em dash.
 *
 *   **Sorting is a clinical act.** A column can declare that its values are
 *   model output rather than observation, and sorting by one is ranking a
 *   prediction. The derivation travels with the column so the component
 *   cannot forget to say so.
 *
 *   **An export is an attack surface.** A patient's preferred name is free
 *   text; `=cmd|' /C calc'!A0` in it is remote code execution on whoever opens
 *   the CSV. Neutralising it is not an option flag here — there is no way to
 *   ask for the unsafe version.
 *
 * No React, no DOM, no network, no clock. Runs in Node.
 */

/* ------------------------------------------------------------------ */
/* Absence                                                             */
/* ------------------------------------------------------------------ */

/**
 * Why a cell has no value.
 *
 * Five reasons rather than one, because they lead to five different actions.
 * `awaiting` is somebody else's job in progress; `not-recorded` is nobody's;
 * `restricted` means the value exists and this reader is not entitled to it;
 * `refused` is the patient's own decision and is clinically meaningful;
 * `unknown` is the honest answer when the source did not say which.
 */
export type GridAbsence = "awaiting" | "not-recorded" | "restricted" | "refused" | "unknown";

/** The word rendered in the cell. Short, because it sits in a column. */
export const GRID_ABSENCE_LABEL: Record<GridAbsence, string> = {
  awaiting: "Awaiting",
  "not-recorded": "Not recorded",
  restricted: "Restricted",
  refused: "Declined",
  unknown: "Not known",
};

/** The longer form, for a footnote or an announcement. */
export const GRID_ABSENCE_DETAIL: Record<GridAbsence, string> = {
  awaiting: "Ordered; no result yet.",
  "not-recorded": "Nobody has recorded a value.",
  restricted: "A value exists and is not available to you.",
  refused: "The patient declined.",
  unknown: "The source did not say why there is no value.",
};

/** A cell with no value, and the reason. */
export interface GridAbsent {
  absent: GridAbsence;
  /** Overrides `GRID_ABSENCE_DETAIL` where the caller knows something specific. */
  detail?: string;
}

/**
 * What a cell can hold.
 *
 * Deliberately without `null` or `undefined`. A caller with no value has to
 * say which kind of no-value it is, and the type checker is the thing that
 * makes them — which is the only mechanism that has ever worked.
 */
export type GridValue = string | number | boolean | GridAbsent;

export function isGridAbsent(value: GridValue): value is GridAbsent {
  return typeof value === "object" && value !== null && "absent" in value;
}

/** The word for an absent cell, honouring a caller's override. */
export function gridAbsenceLabel(value: GridAbsent): string {
  return GRID_ABSENCE_LABEL[value.absent];
}

/** The sentence for an absent cell, honouring a caller's override. */
export function gridAbsenceDetail(value: GridAbsent): string {
  return value.detail ?? GRID_ABSENCE_DETAIL[value.absent];
}

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

/**
 * What the column means — which decides alignment, comparison and export.
 *
 * Not a display format. `identifier` and `number` both hold digits and must
 * never be compared the same way: an MRN sorts as text because 044 and 44 are
 * different patients, and a potassium sorts as a quantity because 10 is
 * greater than 9.
 */
export type GridColumnKind =
  /** Words. Compared with the host locale's collator. */
  | "text"
  /** A count or a score. Compared numerically. */
  | "number"
  /** A measured quantity with a unit somewhere. Compared numerically. */
  | "measure"
  /** An MRN, an accession, an NHS number. Digits that are not a quantity. */
  | "identifier"
  /** An ISO instant or a wall time. Compared as text, which sorts correctly. */
  | "instant"
  /** A term from a small, ordered vocabulary. Compared by declaration order. */
  | "status";

/**
 * The claim a column makes about where its values came from.
 *
 * Present only on columns whose values are computed rather than observed.
 * Sorting by one of these ranks a prediction, and the component is required
 * to say so — which is why the derivation lives on the column rather than
 * being passed alongside it and forgotten.
 */
export interface GridDerivation {
  /** What produced the value. `early-warning`, not "the algorithm". */
  model: string;
  /** The version actually in production. */
  version: string;
  /** What it was fitted or validated against. */
  validatedOn: string;
  /** In whom. The sentence a reader needs to know it does not apply to them. */
  population: string;
}

/** The provenance sentence. One line, printable, no markup. */
export function describeGridDerivation(derivation: GridDerivation): string {
  return (
    `${derivation.model} ${derivation.version}, ` +
    `validated on ${derivation.validatedOn}, ${derivation.population}.`
  );
}

/**
 * The part of a column this module can reason about.
 *
 * Presentation — the cell renderer, the width, the alignment — belongs to the
 * component. Everything here is what sorting and exporting need, so both can
 * be tested against a plain object with no React in the process.
 */
export interface GridColumnSpec<Row> {
  key: string;
  header: string;
  kind?: GridColumnKind;
  value: (row: Row) => GridValue;
  sortable?: boolean;
  derived?: GridDerivation;
  /** Declaration order for `kind: "status"`, worst first. */
  order?: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

/**
 * What this grid is showing, out of what.
 *
 * `total` is `number | "unknown"` because against a FHIR server it often is.
 * `Bundle.total` is optional, the spec forbids constructing paging URLs, and
 * Azure returns a `next` link and nothing else — so "24 of 1,438" is a
 * sentence a conformant server cannot always support. The alternative to this
 * union is a component that quietly renders the page size as the total, which
 * is the exact lie the type is here to prevent.
 */
export interface GridCoverage {
  /** Rows on screen. */
  shown: number;
  /** Rows the predicate matches, or "unknown" when the source will not say. */
  total: number | "unknown";
  /** What the rows have in common, in words. Rendered above the table. */
  predicate?: string;
  /** What the grid counts. Defaults to "records". */
  noun?: string;
  /** When the count was true. */
  asOf?: string;
}

/**
 * Coverage where the caller genuinely has everything.
 *
 * The escape hatch for a local array, so `coverage` staying required costs a
 * caller one line rather than a lie. It is a function rather than a default
 * because "all of them" has to be asserted, not assumed.
 */
export function localGridCoverage(rows: readonly unknown[], noun?: string): GridCoverage {
  return { shown: rows.length, total: rows.length, noun };
}

/** The coverage sentence. The one line that must survive a screenshot. */
export function describeGridCoverage(coverage: GridCoverage): string {
  const noun = coverage.noun ?? "records";
  const shown = coverage.shown.toLocaleString("en");

  if (coverage.total === "unknown") {
    // Said this way round on purpose. "24 of an unknown total" reads as a
    // defect in the grid; "the source did not say" names the actual cause and
    // is the sentence a reader can act on.
    return `${shown} ${noun} shown. The source did not say how many match.`;
  }

  if (coverage.total === coverage.shown) {
    return `All ${shown} ${noun}.`;
  }

  return `${shown} of ${coverage.total.toLocaleString("en")} ${noun}.`;
}

/** How many the reader cannot see. `null` when that is not knowable. */
export function gridUnseenCount(coverage: GridCoverage): number | null {
  if (coverage.total === "unknown") return null;
  return Math.max(0, coverage.total - coverage.shown);
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

export type GridSortDirection = "ascending" | "descending";

export interface GridSort {
  key: string;
  direction: GridSortDirection;
}

/**
 * Where a header click goes next: descending, ascending, then back to the
 * order the caller supplied.
 *
 * Descending first for anything quantitative, because a worklist sorted by
 * potassium ascending puts the 6.8 at the bottom of a scroll — the reader
 * asked "who is worst" and got "who is best". Text goes ascending first,
 * where A–Z is what the word "sort" means to everybody.
 *
 * The third state is unsorted rather than a two-way toggle. The caller's own
 * order is usually arrival order, which carries information no column does,
 * and a grid with no way back to it has destroyed that.
 */
export function nextGridSort<Row>(
  current: GridSort | null,
  column: GridColumnSpec<Row>,
): GridSort | null {
  const quantitative =
    column.kind === "number" || column.kind === "measure" || column.kind === "status";
  const first: GridSortDirection = quantitative ? "descending" : "ascending";

  if (!current || current.key !== column.key) return { key: column.key, direction: first };
  if (current.direction === first) {
    return { key: column.key, direction: first === "ascending" ? "descending" : "ascending" };
  }
  return null;
}

/**
 * Compare two cell values.
 *
 * Absence always sorts last, in both directions, and that is the load-bearing
 * line in this file. A potassium that has not come back is not a low
 * potassium; sorting ascending and finding four "Awaiting" rows above the 3.2
 * tells the reader the sickest patient is fine. Every grid that treats a
 * missing value as negative infinity has this defect, and it is invisible
 * until it matters.
 */
export function compareGridValues(
  a: GridValue,
  b: GridValue,
  kind: GridColumnKind = "text",
  order?: readonly string[],
): number {
  const aAbsent = isGridAbsent(a);
  const bAbsent = isGridAbsent(b);
  if (aAbsent && bAbsent) return 0;
  if (aAbsent) return 1;
  if (bAbsent) return -1;

  if (kind === "number" || kind === "measure") {
    return Number(a) - Number(b);
  }

  if (kind === "status" && order) {
    const rank = (value: GridValue) => {
      const at = order.indexOf(String(value));
      return at === -1 ? order.length : at;
    };
    return rank(a) - rank(b);
  }

  // `identifier` lands here deliberately: an MRN is digits that are not a
  // quantity, and comparing 044 to 44 numerically merges two patients.
  return String(a).localeCompare(String(b), "en", { numeric: kind !== "identifier" });
}

/**
 * Rows in sorted order, as a new array.
 *
 * Never in place: the caller's array is very often React state, and a grid
 * that mutates the props it was handed produces a component that renders
 * correctly once and then stops updating.
 */
export function sortGridRows<Row>(
  rows: readonly Row[],
  column: GridColumnSpec<Row> | undefined,
  direction: GridSortDirection,
): Row[] {
  if (!column) return [...rows];
  const sign = direction === "ascending" ? 1 : -1;

  // Decorate–sort–undecorate: `value` is caller code and may be expensive, and
  // a comparator calls it O(n log n) times. This calls it once per row.
  return rows
    .map((row, index) => ({ row, index, value: column.value(row) }))
    .sort((a, b) => {
      const absent = isGridAbsent(a.value) ? 1 : 0;
      const bAbsent = isGridAbsent(b.value) ? 1 : 0;
      // Applied before the sign so that absence stays at the bottom when the
      // direction flips, rather than being promoted to the top.
      if (absent !== bAbsent) return absent - bAbsent;

      const compared = compareGridValues(a.value, b.value, column.kind, column.order);
      // Stable on ties, so re-sorting by a column full of equal values does not
      // shuffle rows under a reader who was looking at one.
      return compared === 0 ? a.index - b.index : compared * sign;
    })
    .map((entry) => entry.row);
}

/* ------------------------------------------------------------------ */
/* Arrivals                                                            */
/* ------------------------------------------------------------------ */

/**
 * The line above a queue of results that have landed and not been let in.
 *
 * "Nothing moved" is the whole message. A grid that reorders under a pointer
 * is how somebody actions the row that used to be there, so arrivals wait
 * behind this line until the reader asks — and the reader has to be told that
 * waiting is what is happening, or the grid simply looks stale.
 */
export function describeGridArrivals(count: number, at?: string): string {
  if (count <= 0) return "";
  const noun = count === 1 ? "result" : "results";
  return at
    ? `${count} ${noun} arrived at ${at} — nothing moved.`
    : `${count} ${noun} arrived — nothing moved.`;
}

/* ------------------------------------------------------------------ */
/* Capacity                                                            */
/* ------------------------------------------------------------------ */

/**
 * The point at which this refuses rather than degrades.
 *
 * Chosen from measurement rather than taste. The best-instrumented row model
 * in the ecosystem retains roughly 380 MB for a million rows at eight
 * columns; a clinical grid runs forty columns on a ward workstation that is
 * often a 4 GB thin client shared with the EHR itself. Twenty thousand rows
 * is about where a forty-column client-side model stops being something you
 * would put in front of a nurse at handover.
 *
 * Stated as a refusal because the alternative is worse. A grid that accepts a
 * million rows and takes nine seconds to paint has not failed loudly; it has
 * taught the reader that the software is slow, which is what people say right
 * before they stop trusting the number on the screen.
 */
export const GRID_CLIENT_ROW_CEILING = 20_000;

/** The refusal, or `null` when the grid can honestly render this many. */
export function gridCapacityRefusal(
  rowCount: number,
  ceiling: number = GRID_CLIENT_ROW_CEILING,
): string | null {
  if (rowCount <= ceiling) return null;
  return (
    `${rowCount.toLocaleString("en")} rows is past what this renders on a ward workstation ` +
    `(the ceiling is ${ceiling.toLocaleString("en")}). ` +
    `Narrow the query or move paging to the server — the grid will not pretend to hold them.`
  );
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

/** Where focus is, in cells. Row 0 is the header. */
export interface GridCursor {
  row: number;
  column: number;
}

export interface GridBounds {
  /** Body rows. The header is handled separately and is always row 0. */
  rows: number;
  columns: number;
  /** How far Page Up and Page Down travel. */
  page?: number;
}

export interface GridCursorModifiers {
  ctrl?: boolean;
  meta?: boolean;
}

/**
 * Two-dimensional navigation, as `role="grid"` requires and as no table in
 * this ecosystem actually ships.
 *
 * Returns `null` for a key this does not handle, so the caller knows whether
 * to prevent the default — the difference between arrow keys that move a cell
 * and arrow keys that also scroll the page underneath.
 *
 * Row `-1` is the header row. It is reachable by Up from the first body row
 * and by Ctrl+Home, because the header holds the sort controls and a keyboard
 * user who cannot reach them cannot sort at all.
 */
export function moveGridCursor(
  cursor: GridCursor,
  key: string,
  bounds: GridBounds,
  modifiers: GridCursorModifiers = {},
): GridCursor | null {
  const jump = modifiers.ctrl || modifiers.meta;
  const last = bounds.rows - 1;
  const lastColumn = bounds.columns - 1;
  const page = bounds.page ?? 10;

  const clampRow = (row: number) => Math.max(-1, Math.min(last, row));
  const clampColumn = (column: number) => Math.max(0, Math.min(lastColumn, column));

  switch (key) {
    case "ArrowRight":
      return { ...cursor, column: clampColumn(cursor.column + 1) };
    case "ArrowLeft":
      return { ...cursor, column: clampColumn(cursor.column - 1) };
    case "ArrowDown":
      return { ...cursor, row: clampRow(cursor.row + 1) };
    case "ArrowUp":
      return { ...cursor, row: clampRow(cursor.row - 1) };
    case "PageDown":
      return { ...cursor, row: clampRow(cursor.row + page) };
    case "PageUp":
      return { ...cursor, row: clampRow(cursor.row - page) };
    case "Home":
      // Ctrl+Home goes to the first cell of the header rather than of the
      // body, per the APG grid pattern.
      return jump ? { row: -1, column: 0 } : { ...cursor, column: 0 };
    case "End":
      return jump ? { row: last, column: lastColumn } : { ...cursor, column: lastColumn };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Row identity                                                        */
/* ------------------------------------------------------------------ */

/**
 * Who a row is about, re-stated where the reader is about to act.
 *
 * Acting on the wrong row is the retract-and-reorder error, and the
 * interventions that measurably reduce it all share one mechanic: the
 * identifier is put back in front of the person at the moment of action
 * rather than left at the top of the screen where they read it four minutes
 * ago. `secondary` is the identifier, and it is separate from `primary`
 * because a name is not an identifier — two patients on one ward sharing a
 * surname is common enough to appear in every study of this failure.
 */
export interface GridIdentity {
  primary: string;
  secondary?: string;
  /** True when the record is masked, so the line may not name anybody. */
  masked?: boolean;
}

/** The identity line. Never says more than the row it came from. */
export function describeGridIdentity(
  identity: GridIdentity,
  position: { row: number; of: number | "unknown" },
): string {
  const where =
    position.of === "unknown"
      ? `Row ${position.row}`
      : `Row ${position.row} of ${position.of.toLocaleString("en")}`;
  if (identity.masked) return `${where} — restricted record.`;
  const who = identity.secondary ? `${identity.primary}, ${identity.secondary}` : identity.primary;
  // Abbreviated clinical names end in a full stop far more often than not —
  // "Adeyemi, R." — and appending a second one produces "R.." on most rows of
  // a real worklist.
  return who.endsWith(".") ? `${where} — ${who}` : `${where} — ${who}.`;
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

/**
 * The characters a spreadsheet treats as the start of a formula.
 *
 * The full-width forms are not decoration. Excel normalises them in several
 * locales, so `＝cmd` executes where `=cmd` was the only thing anybody
 * filtered for. Tab and carriage return are here because a leading one lets
 * the next character start the formula instead.
 */
const FORMULA_LEADS = ["=", "+", "-", "@", "\t", "\r", "＝", "＋", "－", "＠"];

/**
 * Make one cell safe to put in a spreadsheet.
 *
 * There is no way to switch this off, and that is deliberate. A patient's
 * preferred name is free text that arrives from a registration desk, and
 * `=cmd|' /C calc'!A0` in it is remote code execution on the machine of
 * whoever opens the export — a person who is usually not the person who
 * chose to include the column.
 *
 * The single quote is the prefix Excel, LibreOffice and Numbers all honour.
 * It is visible in the cell, which is the cost, and the alternative is a
 * silent execution, which is not a trade.
 */
export function neutraliseGridCell(text: string): string {
  const first = text.charAt(0);
  return FORMULA_LEADS.includes(first) ? `'${text}` : text;
}

/** Quote a field for RFC 4180, after neutralising it. */
function quoteField(text: string, delimiter: string): string {
  const safe = neutraliseGridCell(text);
  const needsQuotes =
    safe.includes(delimiter) || safe.includes('"') || safe.includes("\n") || safe.includes("\r");
  return needsQuotes ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export interface GridExportOptions {
  delimiter?: string;
  /** Prepend the coverage sentence as a comment row. On by default. */
  coverage?: GridCoverage;
}

/**
 * The rows as delimited text.
 *
 * The coverage sentence goes in the file, on its own row above the header,
 * because an export outlives the screen it came from. A spreadsheet of
 * twenty-four patients with no record that 1,414 others matched the same
 * filter is the same lie as the grid without a coverage line, except it is
 * now in somebody's inbox with no way to ask.
 */
export function toGridDelimited<Row>(
  rows: readonly Row[],
  columns: readonly GridColumnSpec<Row>[],
  options: GridExportOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";
  const lines: string[] = [];

  if (options.coverage) {
    const parts = [describeGridCoverage(options.coverage)];
    if (options.coverage.predicate) parts.push(options.coverage.predicate);
    lines.push(quoteField(parts.join(" "), delimiter));
  }

  for (const column of columns) {
    if (!column.derived) continue;
    lines.push(
      quoteField(
        `${column.header} is model output, not an observation. ` +
          describeGridDerivation(column.derived),
        delimiter,
      ),
    );
  }

  lines.push(columns.map((column) => quoteField(column.header, delimiter)).join(delimiter));

  for (const row of rows) {
    lines.push(
      columns
        .map((column) => {
          const value = column.value(row);
          // An absence exports as its word, never as an empty cell. A blank in
          // a spreadsheet is indistinguishable from a value nobody typed, and
          // the whole point of the absence vocabulary is that it is not.
          const text = isGridAbsent(value) ? gridAbsenceLabel(value) : String(value);
          return quoteField(text, delimiter);
        })
        .join(delimiter),
    );
  }

  return lines.join("\r\n");
}

"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/data-grid/data-grid.tsx. Edit that file, not this one.
/**
 * DataGrid — a worklist that states what it is showing, out of what.
 *
 *     <DataGrid
 *       caption="Patients on 4-West with a potassium outside the reference range"
 *       title="Worklist · 4-West · potassium out of range"
 *       columns={columns}
 *       rows={rows}
 *       rowKey={(row) => row.mrn}
 *       coverage={{ shown: 24, total: 1438, noun: "patients in the cohort",
 *                   predicate: "Unit is 4-West, and potassium outside the reference range in the last 24 hours." }}
 *       identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
 *       arrivals={held}
 *       onAdmitArrivals={admit}
 *     />
 *
 * **It is a document, and it prints.** That is the design, not a nice
 * property of it. A clinical worklist gets printed, photographed, pasted into
 * a handover and read at 3 a.m. on a screen somebody else set the filter on —
 * so it is set as a ruled ledger with a masthead and numbered footnotes,
 * because that is a form that survives all four. Nothing here depends on
 * colour, hover, or an animation running.
 *
 * Four behaviours are the component rather than decoration on it. All four
 * live in `@/lib/oxygen-grid` so they can be proved without a DOM.
 *
 *   **Coverage is in the masthead, above the data.** Not a footer note: the
 *   reader has to meet the claim before they meet the rows it is about. A
 *   `total` of `"unknown"` says so in words rather than rendering the page
 *   size as if it were the answer.
 *
 *   **A derived column carries a footnote, and sorting by it promotes that
 *   footnote to a statement.** Ranking by model output is ranking a
 *   prediction, and the footnote names the model, its version, what it was
 *   validated on and in whom — the way a real report cites a derived value.
 *
 *   **Arrivals wait behind a line.** Results that have landed are counted and
 *   held. Nothing reorders until the reader asks, because a grid that moves
 *   under a pointer is how somebody actions the row that used to be there.
 *
 *   **The row the reader is on is named at the bottom of the page.** A ledger
 *   has a "read by" line; this is that line, and it re-states the identifier
 *   at the moment of action rather than leaving it at the top of the screen.
 *
 * `role="grid"` with real two-dimensional keyboard navigation, `aria-rowcount`
 * against the *cohort* rather than the page, and `aria-rowindex` on every row.
 * The engine under the table most teams reach for ships one `aria-*`
 * attribute in its entire build and zero keyboard handlers; none of this is
 * inherited, because there was nothing to inherit.
 *
 * Styling lives in `styles/oxygen-grid.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  describeGridArrivals,
  describeGridCoverage,
  describeGridDerivation,
  describeGridIdentity,
  gridAbsenceDetail,
  gridAbsenceLabel,
  gridCapacityRefusal,
  isGridAbsent,
  moveGridCursor,
  nextGridSort,
  sortGridRows,
  type GridColumnSpec,
  type GridCoverage,
  type GridIdentity,
  type GridSort,
  type GridValue,
} from "../../lib/grid";

export {
  GRID_ABSENCE_DETAIL,
  GRID_ABSENCE_LABEL,
  GRID_CLIENT_ROW_CEILING,
  compareGridValues,
  describeGridArrivals,
  describeGridCoverage,
  describeGridDerivation,
  describeGridIdentity,
  gridAbsenceDetail,
  gridAbsenceLabel,
  gridCapacityRefusal,
  gridUnseenCount,
  isGridAbsent,
  localGridCoverage,
  moveGridCursor,
  neutraliseGridCell,
  nextGridSort,
  sortGridRows,
  toGridDelimited,
  type GridAbsence,
  type GridAbsent,
  type GridBounds,
  type GridColumnKind,
  type GridColumnSpec,
  type GridCoverage,
  type GridCursor,
  type GridDerivation,
  type GridExportOptions,
  type GridIdentity,
  type GridSort,
  type GridSortDirection,
  type GridValue,
} from "../../lib/grid";

/**
 * A column.
 *
 * Extends the engine's spec with the presentational half. Columns are typed
 * objects rather than JSX children on purpose: `<Grid.Column>` makes a column
 * set unserialisable, and an unserialisable column set makes a saved view
 * impossible — which is the feature every worklist product is eventually
 * asked for.
 */
export interface DataGridColumn<Row> extends GridColumnSpec<Row> {
  /**
   * How the value is drawn. Returns nodes; there is no path here that takes a
   * string of markup, which makes raw HTML in a cell a type error rather than
   * a code review.
   *
   * Absence is drawn by the grid whatever this returns, so a caller cannot
   * accidentally render an em dash over a restricted value.
   */
  cell?: (row: Row) => React.ReactNode;
  /** A CSS width for the column, e.g. `"9rem"`. */
  width?: string;
  /** Numbers read right. Defaults from `kind`. */
  align?: "start" | "end";
  /** Anything the header cannot say in two words. Printed as a footnote. */
  footnote?: string;
}

export interface DataGridProps<Row> {
  /** What the table is, for a screen reader. Required — a grid with no name is a wall. */
  caption: string;
  /** The masthead line. Falls back to `caption`. */
  title?: React.ReactNode;
  /** The right-hand side of the masthead: a window, a source, a role. */
  note?: React.ReactNode;

  /** The columns, in display order. Typed objects rather than JSX children, so a saved view can carry them. */
  columns: readonly DataGridColumn<Row>[];
  /** The rows on screen. The grid never fetches, filters or merges — this is exactly what it draws. */
  rows: readonly Row[];
  /** Stable identity for a row. Focus follows this, not the row's position. */
  rowKey: (row: Row) => string;

  /**
   * What is on screen, out of what.
   *
   * Required, and there is no escape hatch — `localGridCoverage(rows)` is the
   * one line a caller who genuinely has everything writes instead.
   */
  coverage: GridCoverage;

  /** Sort, controlled. */
  sort?: GridSort | null;
  /** Sort, uncontrolled. Defaults to the caller's own row order. */
  defaultSort?: GridSort | null;
  /** Fires on every sort change, including the third activation that clears it back to your order. */
  onSortChange?: (sort: GridSort | null) => void;

  /**
   * Results that have landed and are being held.
   *
   * The grid never merges these itself. It counts them, says nothing moved,
   * and offers the reader a way to ask — at which point `onAdmitArrivals`
   * fires and the caller decides what the new row set is.
   */
  arrivals?: readonly Row[];
  /** When the arrivals landed, for the held line. */
  arrivalsAt?: string;
  /** The reader asked for the held results. Merge them into `rows`; the grid will not do it for you. */
  onAdmitArrivals?: (rows: readonly Row[]) => void;

  /** Who the row is about, re-stated in the footer at the point of action. */
  identify?: (row: Row) => GridIdentity;

  /** Enter on a row. */
  onRowActivate?: (row: Row) => void;

  /** Above this many rows the grid refuses rather than degrading. */
  ceiling?: number;

  /** Row height and type scale. `compact` keeps every target above the density floor. */
  density?: "regular" | "compact";
  /** Merged onto the outer element. */
  className?: string;
  /** The outer element's id. Generated when absent; the masthead title and the grid's label derive from it. */
  id?: string;
}

/** The header row, in cursor terms. */
const HEADER_ROW = -1;

/*
 * Class names as literal maps rather than template strings.
 *
 * The house lint rule is written for Tailwind — a class built by interpolation
 * is never scanned, so it emits no CSS and the element renders unstyled. These
 * are BEM classes from the component's own stylesheet, so that particular
 * failure could not happen here; the maps are kept anyway because they make
 * the complete set of classes this file can emit greppable, which is what the
 * rule is really protecting.
 */
const ALIGN_CLASS = {
  start: { th: "ox-grid__th--start", td: "ox-grid__td--start" },
  end: { th: "ox-grid__th--end", td: "ox-grid__td--end" },
} as const;

const KIND_CLASS: Record<NonNullable<DataGridColumn<never>["kind"]>, string> = {
  text: "ox-grid__td--text",
  number: "ox-grid__td--number",
  measure: "ox-grid__td--measure",
  identifier: "ox-grid__td--identifier",
  instant: "ox-grid__td--instant",
  status: "ox-grid__td--status",
};

function defaultAlign<Row>(column: DataGridColumn<Row>): "start" | "end" {
  if (column.align) return column.align;
  return column.kind === "number" || column.kind === "measure" ? "end" : "start";
}

/**
 * The footnotes, numbered in the order they are referenced.
 *
 * Derived columns come first because they are the ones that change what the
 * numbers mean. Built once per render rather than during it, so the marker in
 * the header and the note at the bottom cannot disagree about a number.
 */
function collectFootnotes<Row>(
  columns: readonly DataGridColumn<Row>[],
  absences: readonly string[],
): { marks: Map<string, number>; notes: string[] } {
  const marks = new Map<string, number>();
  const notes: string[] = [];

  for (const column of columns) {
    if (!column.derived) continue;
    notes.push(
      `${column.header} is model output, not an observation. ` +
        describeGridDerivation(column.derived),
    );
    marks.set(column.key, notes.length);
  }

  for (const column of columns) {
    if (!column.footnote || marks.has(column.key)) continue;
    notes.push(column.footnote);
    marks.set(column.key, notes.length);
  }

  for (const absence of absences) {
    notes.push(absence);
    marks.set(`absence:${absence}`, notes.length);
  }

  return { marks, notes };
}

export function DataGrid<Row>({
  caption,
  title,
  note,
  columns,
  rows,
  rowKey,
  coverage,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  arrivals,
  arrivalsAt,
  onAdmitArrivals,
  identify,
  onRowActivate,
  ceiling,
  density = "regular",
  className,
  id,
}: DataGridProps<Row>) {
  const reactId = React.useId();
  const gridId = id ?? `ox-grid-${reactId}`;
  const titleId = `${gridId}-title`;

  const [uncontrolledSort, setUncontrolledSort] = React.useState<GridSort | null>(defaultSort);
  const sort = sortProp !== undefined ? sortProp : uncontrolledSort;

  /*
   * Focus is remembered by key, not by index.
   *
   * This is the whole "nothing moves under the hand" claim expressed at the
   * level of a single cell. Sorting, admitting arrivals, or the caller
   * replacing the array all change which index a row sits at; every one of
   * them would silently move focus onto a different patient if the cursor
   * were a pair of numbers. Indices are derived from the keys on each render
   * instead, so the cursor stays on the row it was on or, if that row is
   * genuinely gone, falls back to the header rather than to whoever inherited
   * its position.
   */
  const [cursorKey, setCursorKey] = React.useState<{ row: string | null; column: string }>(() => ({
    row: null,
    column: columns[0]?.key ?? "",
  }));

  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const headRef = React.useRef<HTMLTableRowElement>(null);
  const wantsFocus = React.useRef(false);

  const refusal = gridCapacityRefusal(rows.length, ceiling);

  const sortColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const ordered = React.useMemo(
    () => (sort && sortColumn ? sortGridRows(rows, sortColumn, sort.direction) : [...rows]),
    [rows, sort, sortColumn],
  );

  const keys = React.useMemo(() => ordered.map(rowKey), [ordered, rowKey]);

  const cursor = React.useMemo(() => {
    const column = Math.max(
      0,
      columns.findIndex((entry) => entry.key === cursorKey.column),
    );
    if (cursorKey.row === null) return { row: HEADER_ROW, column };
    const row = keys.indexOf(cursorKey.row);
    return { row: row === -1 ? HEADER_ROW : row, column };
  }, [columns, cursorKey, keys]);

  /*
   * Every absence reason actually present, in column order.
   *
   * Collected from the rendered rows rather than declared, because a footnote
   * explaining "Restricted" on a page with nothing restricted on it is noise,
   * and a page with something restricted and no explanation is the defect.
   */
  const absenceNotes = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of ordered) {
      for (const column of columns) {
        const value = column.value(row);
        if (!isGridAbsent(value)) continue;
        const detail = gridAbsenceDetail(value);
        const key = `${gridAbsenceLabel(value)}|${detail}`;
        if (!seen.has(key)) seen.set(key, `“${gridAbsenceLabel(value)}” — ${detail}`);
      }
    }
    return [...seen.values()];
  }, [columns, ordered]);

  const { marks, notes } = React.useMemo(
    () => collectFootnotes(columns, absenceNotes),
    [absenceNotes, columns],
  );

  const focused = cursor.row >= 0 ? ordered[cursor.row] : undefined;
  const identity = focused && identify ? identify(focused) : undefined;

  /* Move focus to whichever cell the cursor now names. Only after a key or a
     click put it there — never on a data change, which would steal focus from
     wherever the reader actually is. */
  React.useEffect(() => {
    if (!wantsFocus.current) return;
    wantsFocus.current = false;
    const scope = cursor.row === HEADER_ROW ? headRef.current : bodyRef.current;
    scope
      ?.querySelector<HTMLElement>(
        cursor.row === HEADER_ROW
          ? `[data-ox-cell][data-ox-col="${cursor.column}"]`
          : `[data-ox-row="${cursor.row}"] [data-ox-cell][data-ox-col="${cursor.column}"]`,
      )
      ?.focus();
  }, [cursor]);

  const place = React.useCallback(
    (next: { row: number; column: number }) => {
      wantsFocus.current = true;
      setCursorKey({
        row: next.row === HEADER_ROW ? null : (keys[next.row] ?? null),
        column: columns[next.column]?.key ?? columns[0]?.key ?? "",
      });
    },
    [columns, keys],
  );

  const applySort = React.useCallback(
    (column: DataGridColumn<Row>) => {
      const next = nextGridSort(sort, column);
      if (sortProp === undefined) setUncontrolledSort(next);
      onSortChange?.(next);
    },
    [onSortChange, sort, sortProp],
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTableElement>) => {
      if (event.key === "Enter" && cursor.row >= 0 && onRowActivate) {
        const row = ordered[cursor.row];
        if (row) {
          event.preventDefault();
          onRowActivate(row);
        }
        return;
      }

      const next = moveGridCursor(
        cursor,
        event.key,
        { rows: ordered.length, columns: columns.length },
        { ctrl: event.ctrlKey, meta: event.metaKey },
      );
      if (!next) return;
      // Only once we know the key was one of ours, so Tab still leaves and the
      // page still scrolls on keys the grid does not handle.
      event.preventDefault();
      place(next);
    },
    [columns.length, cursor, onRowActivate, ordered, place],
  );

  if (refusal) {
    return (
      <section
        className={cn("ox-grid ox-grid--refused", className)}
        data-ox-grid=""
        data-ox-density={density}
        aria-labelledby={titleId}
        id={gridId}
      >
        <div className="ox-grid__masthead">
          <p className="ox-grid__title" id={titleId}>
            {title ?? caption}
          </p>
        </div>
        <p className="ox-grid__refusal" role="status">
          {refusal}
        </p>
      </section>
    );
  }

  const footVisible = Boolean(identify) || Boolean(sortColumn?.derived) || notes.length > 0;
  const held = arrivals?.length ?? 0;
  const heldLine = describeGridArrivals(held, arrivalsAt);

  return (
    <section
      className={cn("ox-grid", className)}
      data-ox-grid=""
      data-ox-density={density}
      aria-labelledby={titleId}
      id={gridId}
    >
      {/*
        The masthead.

        Coverage sits above the data because the reader has to meet the claim
        before they meet the rows it is about. Below the table it is a
        disclaimer; above it, it is the heading of the thing they are reading.
      */}
      <header className="ox-grid__masthead">
        <div className="ox-grid__mastline">
          <p className="ox-grid__title" id={titleId}>
            {title ?? caption}
          </p>
          {note ? <p className="ox-grid__note">{note}</p> : null}
        </div>
        {/*
          Three sentences, three elements, in descending order of consequence.

          They were one paragraph with the numbers picked out by `::first-line`
          — which takes whatever the first *rendered* line happens to be, so at
          one width it emphasised the count and at the next it emphasised the
          count plus half the filter. The count is the claim and the predicate
          is its qualification; that is a structural difference, so it is
          structure rather than a typographic trick.
        */}
        <p className="ox-grid__coverage">{describeGridCoverage(coverage)}</p>
        {coverage.predicate || coverage.asOf ? (
          <p className="ox-grid__predicate">
            {coverage.predicate}
            {coverage.asOf ? <> As of {coverage.asOf}.</> : null}
          </p>
        ) : null}
      </header>

      {/*
        Held arrivals.

        Rendered as a ruled strip rather than a toast, because a toast is gone
        by the time somebody looks up. The count is live so a screen-reader
        user learns that results are arriving without the rows underneath
        moving out from under their cursor.
      */}
      {held > 0 ? (
        <div className="ox-grid__held">
          <p className="ox-grid__heldline" aria-live="polite">
            {heldLine}
          </p>
          {onAdmitArrivals ? (
            <button
              type="button"
              className="ox-grid__admit"
              onClick={() => onAdmitArrivals(arrivals ?? [])}
            >
              Let them in
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="ox-grid__scroll">
        <table
          className="ox-grid__table"
          role="grid"
          aria-labelledby={titleId}
          /* Against the cohort, not the page. A reader on row 3 of 24 in a
             cohort of 1,438 is told exactly that; -1 is ARIA's "the total is
             not known", which is the honest value when the source will not
             say. */
          aria-rowcount={coverage.total === "unknown" ? -1 : coverage.total + 1}
          aria-colcount={columns.length}
          onKeyDown={onKeyDown}
        >
          <caption className="ox-grid__caption">{caption}</caption>

          <thead role="rowgroup">
            <tr role="row" aria-rowindex={1} ref={headRef} className="ox-grid__headrow">
              {columns.map((column, index) => {
                const active = sort?.key === column.key;
                const mark = marks.get(column.key);
                const tab = cursor.row === HEADER_ROW && cursor.column === index ? 0 : -1;
                const sortable = column.sortable !== false && Boolean(column.value);

                return (
                  <th
                    key={column.key}
                    role="columnheader"
                    scope="col"
                    aria-colindex={index + 1}
                    aria-sort={
                      active ? (sort?.direction ?? undefined) : sortable ? "none" : undefined
                    }
                    className={cn(
                      "ox-grid__th",
                      ALIGN_CLASS[defaultAlign(column)].th,
                      active && "ox-grid__th--sorted",
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        data-ox-cell=""
                        data-ox-col={index}
                        tabIndex={tab}
                        className="ox-grid__sort"
                        onClick={() => {
                          place({ row: HEADER_ROW, column: index });
                          applySort(column);
                        }}
                      >
                        <span className="ox-grid__label">{column.header}</span>
                        {mark ? <sup className="ox-grid__mark">{mark}</sup> : null}
                        {/* A glyph, not a colour, and it is absent rather than
                            dimmed when the column is not the sorted one — an
                            arrow on every header teaches nothing. */}
                        <span aria-hidden="true" className="ox-grid__arrow">
                          {active ? (sort?.direction === "ascending" ? "↑" : "↓") : ""}
                        </span>
                      </button>
                    ) : (
                      <span
                        data-ox-cell=""
                        data-ox-col={index}
                        tabIndex={tab}
                        className="ox-grid__static"
                      >
                        <span className="ox-grid__label">{column.header}</span>
                        {mark ? <sup className="ox-grid__mark">{mark}</sup> : null}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody role="rowgroup" ref={bodyRef}>
            {ordered.map((row, rowIndex) => {
              const key = keys[rowIndex] ?? String(rowIndex);
              const current = cursor.row === rowIndex;
              return (
                <tr
                  key={key}
                  role="row"
                  /* +2: ARIA rows are 1-based and the header is row 1. A
                     reader is on "row 4 of 1,439" in the grid's terms, which
                     is what a screen reader reads out. */
                  aria-rowindex={rowIndex + 2}
                  data-ox-row={rowIndex}
                  className={cn("ox-grid__tr", current && "ox-grid__tr--current")}
                >
                  {columns.map((column, index) => {
                    const value = column.value(row);
                    const tab = current && cursor.column === index ? 0 : -1;
                    return (
                      <td
                        key={column.key}
                        role="gridcell"
                        aria-colindex={index + 1}
                        data-ox-cell=""
                        data-ox-col={index}
                        tabIndex={tab}
                        onFocus={() => setCursorKey({ row: key, column: column.key })}
                        onClick={() => place({ row: rowIndex, column: index })}
                        className={cn(
                          "ox-grid__td",
                          ALIGN_CLASS[defaultAlign(column)].td,
                          column.kind && KIND_CLASS[column.kind],
                        )}
                      >
                        <Cell value={value} marks={marks}>
                          {column.cell?.(row)}
                        </Cell>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*
        The bottom of the ledger.

        The identity line first, because it is the safety control: it names the
        row the reader is on, where they are about to act, rather than leaving
        the identifier at the top of a screen they read four minutes ago.
      */}
      {/*
        Nothing to say, nothing drawn.

        The foot carries a 2px rule, and an empty one is a closing line under a
        table with no reason for it — which reads as a rendering fault rather
        than as restraint. A grid with no derived column, no absences and no
        `identify` genuinely has no foot.
      */}
      {footVisible ? (
        <footer className="ox-grid__foot">
          {/*
          Rendered whenever `identify` is supplied, selected or not.

          The empty case has a line of its own rather than nothing at all: a
          footer that appears on the first click moves every row above it by
          its own height, under a pointer that is already travelling. The
          layout has to be the same before and after the reader arrives.
        */}
          {identify ? (
            <p className="ox-grid__reading">
              <span className="ox-grid__readinglabel">Reading</span>
              <span className="ox-grid__readingline" data-empty={!identity}>
                {identity
                  ? describeGridIdentity(identity, { row: cursor.row + 1, of: coverage.total })
                  : "No row selected."}
              </span>
            </p>
          ) : null}

          {/*
          Sorting by a derived column is announced here and cited rather than
          restated.

          The derivation is already footnote 1 — a property of the column, true
          whether or not anybody sorted — so printing the whole sentence again
          gave a reader the same model, version and population twice on one
          page and left the header's marker pointing at the duplicate. A report
          cites its own note; so does this.
        */}
          {sortColumn?.derived ? (
            <p className="ox-grid__sorted">
              Sorted by a prediction — see note {marks.get(sortColumn.key) ?? 1}.
            </p>
          ) : null}

          {notes.length ? (
            <ol className="ox-grid__notes">
              {notes.map((text, index) => (
                <li key={text} className="ox-grid__noteitem">
                  <span className="ox-grid__notemark" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}

/**
 * One cell.
 *
 * Absence is drawn here rather than by the caller's renderer, and that is the
 * point of the split: a caller cannot accidentally render an em dash over a
 * restricted value, because their renderer is never reached for one.
 */
function Cell({
  value,
  marks,
  children,
}: {
  value: GridValue;
  marks: Map<string, number>;
  children?: React.ReactNode;
}) {
  if (isGridAbsent(value)) {
    const label = gridAbsenceLabel(value);
    const mark = marks.get(`absence:“${label}” — ${gridAbsenceDetail(value)}`);
    return (
      <span className="ox-grid__absent" data-ox-absence={value.absent}>
        {label}
        {mark ? <sup className="ox-grid__mark">{mark}</sup> : null}
      </span>
    );
  }

  if (children !== undefined && children !== null) return <>{children}</>;
  return <>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</>;
}

"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/data-grid/data-grid.tsx. Edit that file, not this one.
/**
 * DataGrid — a worklist that states what it is showing, out of what.
 *
 *     <DataGrid
 *       caption="Clients with a raised PHQ-9 or a recent risk screen"
 *       title="Caseload · adult outpatient"
 *       columns={columns}
 *       rows={rows}
 *       rowKey={(row) => row.mrn}
 *       coverage={{ shown: 24, total: 1438, noun: "patients in the cohort",
 *                   predicate: "Adult outpatient behavioral health, PHQ-9 of 10 or more in the last 30 days." }}
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
 * live in `@/lib/zoblocks-grid` so they can be proved without a DOM.
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
 * Styling lives in `styles/zoblocks-grid.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  describeGridArrivals,
  describeGridLoaded,
  describeGridSelection,
  describeGridCoverage,
  describeGridDerivation,
  describeGridIdentity,
  gridAbsenceDetail,
  gridAbsenceLabel,
  gridCapacityRefusal,
  gridSelectionState,
  shouldLoadMoreGridRows,
  isGridAbsent,
  moveGridCursor,
  nextGridSort,
  sortGridRows,
  toggleAllGridSelection,
  toggleGridSelection,
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
  describeGridLoaded,
  describeGridSelection,
  gridCapacityRefusal,
  gridSelectionState,
  shouldLoadMoreGridRows,
  gridUnseenCount,
  isGridAbsent,
  localGridCoverage,
  moveGridCursor,
  neutraliseGridCell,
  nextGridSort,
  sortGridRows,
  toGridDelimited,
  toggleAllGridSelection,
  toggleGridSelection,
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
  type GridSelectionState,
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
  /**
   * Draw the masthead — the title, the coverage sentence and the predicate.
   *
   * On by default, because a grid dropped into a page with no framing has to
   * carry its own. Turn it off when the host already frames it: an application
   * screen with a page header naming the list and a filter bar naming the
   * predicate is saying both things twice, and the second copy reads as
   * chrome rather than as the claim it is.
   *
   * `caption` is unaffected — the accessible name never goes away, so the grid
   * is still named for a screen reader when nothing is drawn for the eye. Where
   * the masthead is off, the coverage sentence becomes the host's to place, and
   * `describeGridCoverage(coverage)` is the one line that does it.
   */
  masthead?: boolean;
  /**
   * Draw the foot — the reading line, the sort citation and the footnotes.
   *
   * On by default, for the same reason as the masthead: a grid standing alone
   * has to carry its own provenance, and a derived column with no note beside
   * it is a number with no author.
   *
   * Turning it off does not make an absent cell lie. The absence keeps its
   * word — "Not recorded", "Restricted" — and only loses the superscript that
   * pointed at the note, because the note is no longer on the page. Turn it
   * off only where the host carries provenance itself.
   */
  footer?: boolean;
  /**
   * What to say when the predicate matched nothing.
   *
   * A grid that renders a header over an empty body has said nothing about
   * why, and the reader's next move — widen the filter, or trust that there is
   * genuinely nobody — depends entirely on which it is. The default names the
   * noun from `coverage`; pass a node to say something the host knows and the
   * grid cannot, such as which filter to drop.
   */
  empty?: React.ReactNode;
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

  /**
   * Rows the reader has selected, by `rowKey`. Controlled.
   *
   * Omit it and the grid renders no selection column at all — a checkbox that
   * cannot lead anywhere is a control that teaches a reader to expect a bulk
   * action the product does not have.
   */
  selectedKeys?: readonly string[];
  /** Fires with the whole new selection, never a delta — so a caller can store it as-is. */
  onSelectionChange?: (keys: readonly string[]) => void;
  /**
   * What can be done to a selection, rendered in a bar above the table.
   *
   * Receives the selected rows rather than their keys, because the verbs a
   * host offers usually depend on what was picked — and because handing back
   * keys makes every caller re-derive the rows the grid already has.
   */
  bulkActions?: (selected: readonly Row[]) => React.ReactNode;

  /**
   * How many leading columns stay put while the rest scroll sideways.
   *
   * The identity column is the one a reader must never lose: scrolled twelve
   * columns right with no name in view, every row is the same row. Offsets are
   * measured rather than declared, so a pinned column needs no fixed width.
   * Defaults to 1, the identity column; pass 0 to pin nothing.
   */
  pinnedColumns?: number;

  /**
   * The reader has reached the end of what is loaded. Fetch the next batch.
   *
   * This replaced a numbered pager, and not for taste: FHIR search returns
   * opaque `link.next` URLs, the spec forbids constructing paging URLs by
   * hand, and `Bundle.total` is optional. "Page 4 of 7" is therefore a control
   * that cannot be built against a conformant server — the count is not
   * derivable and the jump target is not addressable. Following `next` until
   * it stops is the shape the protocol has.
   *
   * The grid never fetches. It watches a sentinel below the last row and says
   * when it comes into view; appending to `rows` is the caller's.
   */
  onReachEnd?: () => void;
  /** A fetch is in flight. Draws the waiting line and suppresses further calls. */
  loadingMore?: boolean;
  /** There is no more to load. Draws the end of the list rather than waiting forever. */
  exhausted?: boolean;

  /** A scroll height for the body. The header sticks to the top of it. */
  maxHeight?: string;

  /** Row height and type scale. Every density keeps targets above the 24px floor. */
  density?: "comfortable" | "regular" | "compact";
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
  start: { th: "zb-grid__th--start", td: "zb-grid__td--start" },
  end: { th: "zb-grid__th--end", td: "zb-grid__td--end" },
} as const;

const KIND_CLASS: Record<NonNullable<DataGridColumn<never>["kind"]>, string> = {
  text: "zb-grid__td--text",
  number: "zb-grid__td--number",
  measure: "zb-grid__td--measure",
  identifier: "zb-grid__td--identifier",
  instant: "zb-grid__td--instant",
  status: "zb-grid__td--status",
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
/**
 * How far below the last row the grid starts fetching, as an observer margin.
 *
 * About three rows. Far enough that the next batch is usually there before the
 * reader arrives, near enough that a list which overfills its window by one
 * screen does not fetch again the moment it paints — the defect that makes an
 * infinite list open in a loading state nobody asked for.
 */
const GRID_LOAD_LEAD = "120px";

/** One shared empty map, so `footer={false}` does not allocate a new one per render. */
const EMPTY_MARKS: ReadonlyMap<string, number> = new Map<string, number>();

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
  masthead = true,
  footer = true,
  empty,
  selectedKeys,
  onSelectionChange,
  bulkActions,
  pinnedColumns = 1,
  onReachEnd,
  loadingMore = false,
  exhausted = false,
  maxHeight,
  density = "regular",
  className,
  id,
}: DataGridProps<Row>) {
  const reactId = React.useId();
  const gridId = id ?? `zb-grid-${reactId}`;
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

  /*
   * The end of the list, watched rather than polled.
   *
   * An IntersectionObserver on a sentinel below the last row, with the root set
   * to the scroll container so it fires against the grid's own scrolling rather
   * than the page's. `shouldLoadMoreGridRows` is what stops a scroll that
   * crosses the sentinel twice from firing two requests — the defect every
   * hand-rolled infinite scroll ships with, and the one that turns a slow list
   * into a duplicated one.
   */
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  /*
   * Whether anything has scrolled under the pinned columns, for the seam.
   *
   * Written to the element rather than to state: scroll fires every frame, and
   * a stylesheet selector is the only thing that reads it.
   */
  const onScroll = React.useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const scrolled = Math.abs(node.scrollLeft) > 0 ? "true" : "false";
    if (node.dataset.zbScrolled !== scrolled) node.dataset.zbScrolled = scrolled;
  }, []);

  const selectable = Boolean(selectedKeys && onSelectionChange);
  /* More pinned columns than there are columns pins them all, not a phantom. */
  const pinned = Math.max(0, Math.min(pinnedColumns, columns.length));
  const selected = React.useMemo(() => selectedKeys ?? [], [selectedKeys]);

  /*
   * Pinned offsets, measured.
   *
   * A pinned column needs a `left`, and declaring one means every caller has to
   * give their identity column a fixed width — which is the column most likely
   * to want the slack. So the header cells are measured after layout and the
   * offsets written back, and a ResizeObserver keeps them true when the
   * container changes width or the density control moves.
   */
  const [pinOffsets, setPinOffsets] = React.useState<number[]>([]);
  React.useLayoutEffect(() => {
    const head = headRef.current;
    if (!head || pinned <= 0) {
      setPinOffsets([]);
      return;
    }
    const measure = () => {
      const cells = [...head.children] as HTMLElement[];
      const offsets: number[] = [];
      let running = 0;
      for (let i = 0; i < pinned + (selectable ? 1 : 0); i += 1) {
        offsets.push(running);
        running += cells[i]?.offsetWidth ?? 0;
      }
      setPinOffsets((current) =>
        current.length === offsets.length && current.every((v, i) => v === offsets[i])
          ? current
          : offsets,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(head);
    return () => observer.disconnect();
  }, [pinned, selectable, columns, density]);

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
    () => (footer ? collectFootnotes(columns, absenceNotes) : { marks: EMPTY_MARKS, notes: [] }),
    [absenceNotes, columns, footer],
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
          ? `[data-zb-cell][data-zb-col="${cursor.column}"]`
          : `[data-zb-row="${cursor.row}"] [data-zb-cell][data-zb-col="${cursor.column}"]`,
      )
      ?.focus();
  }, [cursor]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !onReachEnd) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (!shouldLoadMoreGridRows(coverage, loadingMore, exhausted)) return;
        onReachEnd();
      },
      // Ahead of the fold, so the next batch is in flight before the reader
      // hits the bottom and sees a stall.
      { root, rootMargin: GRID_LOAD_LEAD },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [coverage, exhausted, loadingMore, onReachEnd]);

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

  /*
   * How the grid says its own name.
   *
   * `aria-labelledby` points at the masthead title, so with the masthead off it
   * would point at an element that is not on the page — and a `role="grid"`
   * with a dangling label is an unnamed grid, which is the exact wall this
   * component exists to avoid. `caption` is required and is a string, so it is
   * always available as the fallback.
   */
  const labelling = masthead
    ? ({ "aria-labelledby": titleId } as const)
    : ({ "aria-label": caption } as const);

  if (refusal) {
    return (
      <section
        className={cn("zb-grid zb-grid--refused", className)}
        data-zb-grid=""
        data-zb-density={density}
        {...labelling}
        id={gridId}
      >
        <div className="zb-grid__masthead">
          <p className="zb-grid__title" id={titleId}>
            {title ?? caption}
          </p>
        </div>
        <p className="zb-grid__refusal" role="status">
          {refusal}
        </p>
      </section>
    );
  }

  const footVisible =
    footer && (Boolean(identify) || Boolean(sortColumn?.derived) || notes.length > 0);
  const held = arrivals?.length ?? 0;
  const heldLine = describeGridArrivals(held, arrivalsAt);

  const selectState = gridSelectionState(selected, keys);
  const selectedRows = ordered.filter((row) => selected.includes(rowKey(row)));
  const bulkVisible = Boolean(selectable && bulkActions && selectedRows.length > 0);
  /* The slot exists if either occupant could ever appear, so neither arriving
     changes the height of anything below it. */
  const stripVisible = held > 0 || Boolean(selectable && bulkActions);
  const pinnedCount = pinned + (selectable ? 1 : 0);
  const pinStyle = (index: number) =>
    index < pinOffsets.length ? { left: pinOffsets[index] } : undefined;

  return (
    <section
      className={cn("zb-grid", className)}
      data-zb-grid=""
      data-zb-density={density}
      {...labelling}
      id={gridId}
    >
      {/*
        The masthead.

        Coverage sits above the data because the reader has to meet the claim
        before they meet the rows it is about. Below the table it is a
        disclaimer; above it, it is the heading of the thing they are reading.
      */}
      {masthead ? (
        <header className="zb-grid__masthead">
          <div className="zb-grid__mastline">
            <p className="zb-grid__title" id={titleId}>
              {title ?? caption}
            </p>
            {note ? <p className="zb-grid__note">{note}</p> : null}
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
          <p className="zb-grid__coverage">{describeGridCoverage(coverage)}</p>
          {coverage.predicate || coverage.asOf ? (
            <p className="zb-grid__predicate">
              {coverage.predicate}
              {coverage.asOf ? <> As of {coverage.asOf}.</> : null}
            </p>
          ) : null}
        </header>
      ) : null}

      {/*
        One strip above the header, with two things that can occupy it.

        Held arrivals and the selection bar were separate conditional blocks,
        and the second one appearing on the first click pushed every row down
        by its own height — under a pointer that was mid-checkbox, so the next
        click landed on the wrong client. That is the exact error a worklist
        cannot make.

        So both are always laid out, stacked in a single grid cell. The slot is
        as tall as the taller of the two whatever is showing, and swapping
        between them moves nothing. The inactive one is `visibility: hidden`,
        which keeps its box, keeps it out of the accessibility tree, and stops
        its live region announcing; `inert` keeps its buttons off the tab ring.

        The reserved height is the cost, and it is paid once at load rather
        than on every click.
      */}
      {stripVisible ? (
        <div className="zb-grid__strip">
          {arrivals ? (
            <div className="zb-grid__held" data-zb-on={bulkVisible ? "false" : "true"}>
              <p className="zb-grid__heldline" aria-live="polite">
                {heldLine}
              </p>
              {onAdmitArrivals ? (
                <button
                  type="button"
                  className="zb-grid__admit"
                  onClick={() => onAdmitArrivals(arrivals)}
                >
                  Let them in
                </button>
              ) : null}
            </div>
          ) : null}

          {/*
            A region rather than a toolbar, with the count in a polite live
            region: a screen-reader user selecting rows one at a time otherwise
            learns only that a checkbox changed, never that a bar of verbs has
            appeared above them.
          */}
          {selectable && bulkActions ? (
            <div
              className="zb-grid__bulk"
              role="region"
              aria-label="Selection actions"
              data-zb-on={bulkVisible ? "true" : "false"}
              inert={!bulkVisible}
            >
              <p className="zb-grid__bulkcount" aria-live="polite">
                {describeGridSelection(selectedRows.length)}
              </p>
              <button
                type="button"
                className="zb-grid__bulkclear"
                onClick={() => onSelectionChange?.([])}
              >
                Clear
              </button>
              <div className="zb-grid__bulkactions">{bulkActions(selectedRows)}</div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className="zb-grid__scroll"
        ref={scrollRef}
        onScroll={onScroll}
        style={maxHeight ? { maxBlockSize: maxHeight } : undefined}
      >
        <table
          className="zb-grid__table"
          role="grid"
          {...labelling}
          /* Against the cohort, not the page. A reader on row 3 of 24 in a
             cohort of 1,438 is told exactly that; -1 is ARIA's "the total is
             not known", which is the honest value when the source will not
             say. */
          aria-rowcount={coverage.total === "unknown" ? -1 : coverage.total + 1}
          aria-colcount={columns.length + (selectable ? 1 : 0)}
          aria-multiselectable={selectable ? true : undefined}
          onKeyDown={onKeyDown}
        >
          <caption className="zb-grid__caption">{caption}</caption>

          <thead role="rowgroup">
            <tr role="row" aria-rowindex={1} ref={headRef} className="zb-grid__headrow">
              {/*
                Select-all covers the page, not the cohort.
                
                A checkbox that silently meant 312 rows nobody has looked at is
                how a bulk action reaches a chart by accident. `aria-label` says
                which, and selecting beyond the page is left to the host as a
                second, explicit act with its own sentence.
              */}
              {selectable ? (
                <th
                  scope="col"
                  className={cn("zb-grid__th zb-grid__th--select", pinnedCount && "zb-grid__pin")}
                  style={pinStyle(0)}
                >
                  <label className="zb-grid__hit">
                    <input
                      type="checkbox"
                      className="zb-grid__check"
                      checked={selectState === "all"}
                      ref={(node) => {
                        if (node) node.indeterminate = selectState === "some";
                      }}
                      aria-label={`Select all ${keys.length} rows on this page`}
                      onChange={() => onSelectionChange?.(toggleAllGridSelection(selected, keys))}
                    />
                  </label>
                </th>
              ) : null}
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
                      "zb-grid__th",
                      ALIGN_CLASS[defaultAlign(column)].th,
                      active && "zb-grid__th--sorted",
                      index < pinned && "zb-grid__pin",
                      index === pinned - 1 && "zb-grid__pin--edge",
                    )}
                    style={{
                      ...(column.width ? { width: column.width } : null),
                      ...pinStyle(index + (selectable ? 1 : 0)),
                    }}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        data-zb-cell=""
                        data-zb-col={index}
                        tabIndex={tab}
                        className="zb-grid__sort"
                        onClick={() => {
                          place({ row: HEADER_ROW, column: index });
                          applySort(column);
                        }}
                      >
                        <span className="zb-grid__label">{column.header}</span>
                        {mark ? <sup className="zb-grid__mark">{mark}</sup> : null}
                        {/* A glyph, not a colour, and it is absent rather than
                            dimmed when the column is not the sorted one — an
                            arrow on every header teaches nothing. */}
                        <span aria-hidden="true" className="zb-grid__arrow">
                          {active ? (sort?.direction === "ascending" ? "↑" : "↓") : ""}
                        </span>
                      </button>
                    ) : (
                      <span
                        data-zb-cell=""
                        data-zb-col={index}
                        tabIndex={tab}
                        className="zb-grid__static"
                      >
                        <span className="zb-grid__label">{column.header}</span>
                        {mark ? <sup className="zb-grid__mark">{mark}</sup> : null}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody role="rowgroup" ref={bodyRef}>
            {/*
              Nothing matched.

              One row spanning the table, inside the grid rather than replacing
              it, so the headers stay on screen — a reader who filtered their
              way to nothing usually wants to undo a sort or a column, and
              swapping the whole table for a panel takes those controls away
              at the exact moment they are needed.
            */}
            {ordered.length === 0 ? (
              <tr role="row" aria-rowindex={2}>
                <td className="zb-grid__emptycell" colSpan={columns.length + (selectable ? 1 : 0)}>
                  <p className="zb-grid__empty" role="status">
                    {empty ?? `No ${coverage.noun ?? "rows"} match.`}
                  </p>
                </td>
              </tr>
            ) : null}
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
                  data-zb-row={rowIndex}
                  aria-selected={selectable ? selected.includes(key) : undefined}
                  className={cn(
                    "zb-grid__tr",
                    current && "zb-grid__tr--current",
                    selectable && selected.includes(key) && "zb-grid__tr--selected",
                  )}
                >
                  {selectable ? (
                    <td
                      role="gridcell"
                      className={cn("zb-grid__td zb-grid__td--select", "zb-grid__pin")}
                      style={pinStyle(0)}
                    >
                      <label className="zb-grid__hit">
                        <input
                          type="checkbox"
                          className="zb-grid__check"
                          checked={selected.includes(key)}
                          aria-label={
                            identify
                              ? `Select ${identify(row).primary}`
                              : `Select row ${rowIndex + 1}`
                          }
                          onChange={() => onSelectionChange?.(toggleGridSelection(selected, key))}
                        />
                      </label>
                    </td>
                  ) : null}
                  {columns.map((column, index) => {
                    const value = column.value(row);
                    const tab = current && cursor.column === index ? 0 : -1;
                    return (
                      <td
                        key={column.key}
                        role="gridcell"
                        aria-colindex={index + 1}
                        data-zb-cell=""
                        data-zb-col={index}
                        tabIndex={tab}
                        onFocus={() => setCursorKey({ row: key, column: column.key })}
                        onClick={() => place({ row: rowIndex, column: index })}
                        className={cn(
                          "zb-grid__td",
                          ALIGN_CLASS[defaultAlign(column)].td,
                          column.kind && KIND_CLASS[column.kind],
                          index < pinned && "zb-grid__pin",
                          index === pinned - 1 && "zb-grid__pin--edge",
                        )}
                        style={pinStyle(index + (selectable ? 1 : 0))}
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
        {/*
          The sentinel, and what it says while it waits.

          Inside the scroll container and after the table, because that is the
          only place a browser can tell you the reader has reached the end.
          `role="status"` rather than a spinner: "Loading more clients…" is a
          sentence a screen reader announces, and a spinner is not.

          Not drawn over an empty list: "All 0 clients loaded" is a sentence
          about nothing, and the empty row is already saying the true thing in
          the one live region this table should have.
        */}
        {onReachEnd && ordered.length > 0 ? (
          <div className="zb-grid__more" ref={sentinelRef}>
            <p className="zb-grid__moreline" role="status">
              {describeGridLoaded(
                coverage,
                loadingMore ? "loading" : exhausted ? "exhausted" : "idle",
              )}
            </p>
          </div>
        ) : null}
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
        <footer className="zb-grid__foot">
          {/*
          Rendered whenever `identify` is supplied, selected or not.

          The empty case has a line of its own rather than nothing at all: a
          footer that appears on the first click moves every row above it by
          its own height, under a pointer that is already travelling. The
          layout has to be the same before and after the reader arrives.
        */}
          {identity ? (
            <p className="zb-grid__reading">
              <span className="zb-grid__readinglabel">Reading</span>
              <span className="zb-grid__readingline">
                {describeGridIdentity(identity, { row: cursor.row + 1, of: coverage.total })}
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
            <p className="zb-grid__sorted">
              Sorted by a prediction — see note {marks.get(sortColumn.key) ?? 1}.
            </p>
          ) : null}

          {notes.length ? (
            <ol className="zb-grid__notes">
              {notes.map((text, index) => (
                <li key={text} className="zb-grid__noteitem">
                  <span className="zb-grid__notemark" aria-hidden="true">
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
  marks: ReadonlyMap<string, number>;
  children?: React.ReactNode;
}) {
  if (isGridAbsent(value)) {
    const label = gridAbsenceLabel(value);
    const mark = marks.get(`absence:“${label}” — ${gridAbsenceDetail(value)}`);
    return (
      <span className="zb-grid__absent" data-zb-absence={value.absent}>
        {label}
        {mark ? <sup className="zb-grid__mark">{mark}</sup> : null}
      </span>
    );
  }

  if (children !== undefined && children !== null) return <>{children}</>;
  return <>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</>;
}

"use client";

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
import {
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  EyeOff,
  Filter,
  Layers,
  Pin,
  PinOff,
  RotateCcw,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
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
  type GridSortDirection,
  type GridValue,
} from "@/lib/zoblocks-grid";

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
} from "@/lib/zoblocks-grid";

/**
 * A column.
 *
 * Extends the engine's spec with the presentational half. Columns are typed
 * objects rather than JSX children on purpose: `<Grid.Column>` makes a column
 * set unserialisable, and an unserialisable column set makes a saved view
 * impossible — which is the feature every worklist product is eventually
 * asked for.
 */
export type DataGridGroup = {
  key: string;
  direction: GridSortDirection;
};

export type DataGridColumnPinning = Readonly<Record<string, "left" | "right">>;
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
  /** Whether the host can open filtering for this column. */
  filterable?: boolean;
  /** Whether the host supports categorical grouping for this column. */
  groupable?: boolean;
  /** Whether the host allows this column to be pinned left or right. */
  pinnable?: boolean;
  /** Whether the host allows this column to be hidden. */
  hideable?: boolean;
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
  /**
   * Optional status row inside the table body, displayed alongside existing
   * rows. Useful when a refresh fails but the previous results are retained.
   */
  bodyStatus?: React.ReactNode;
  /** The right-hand side of the masthead: a window, a source, a role. */
  note?: React.ReactNode;

  /**
   * Optional layout slots above the grid.
   *
   * These are presentation-only: the caller supplies the controls and owns
   * their state and behavior. The grid provides their placement and styling.
   */
  toolbar?: React.ReactNode;
  criteria?: React.ReactNode;
  filterPanel?: React.ReactNode;

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
   * Ordered, committed sort rules. Used to show multi-sort precedence;
   * the grid continues to own only its existing single-sort behavior.
   */
  sortRanks?: readonly GridSort[];
  /** Clear one committed sort field by column key. */
  onClearSort?: (columnKey: string) => void;
  /** Open the host's filter UI for one column. */
  onFilterColumn?: (columnKey: string) => void;

  /** The currently grouped column and its direction. */
  group?: DataGridGroup | null;
  /** Change or clear the grouped column. */
  onGroupChange?: (group: DataGridGroup | null) => void;

  /** Per-column pin placement. Omit to retain legacy pinnedColumns behavior. */
  columnPinning?: DataGridColumnPinning;
  /** Change per-column pin placement. */
  onColumnPinningChange?: (pinning: DataGridColumnPinning) => void;

  /** Hide one column; the host removes it from the displayed column list. */
  onHideColumn?: (columnKey: string) => void;

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
  toolbar,
  criteria,
  filterPanel,
  columns,
  rows,
  rowKey,
  coverage,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  sortRanks = [],
  onClearSort,
  onFilterColumn,
  group,
  onGroupChange,
  columnPinning,
  onColumnPinningChange,
  onHideColumn,
  arrivals,
  arrivalsAt,
  onAdmitArrivals,
  identify,
  onRowActivate,
  ceiling,
  masthead = true,
  footer = true,
  empty,
  bodyStatus,
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
  const [truncatedHeaders, setTruncatedHeaders] = React.useState<Set<string>>(() => new Set());
  const [sortMenu, setSortMenu] = React.useState<{
    columnKey: string;
    x: number;
    y: number;
  } | null>(null);

  const [activeSubmenu, setActiveSubmenu] = React.useState<{
    type: "group" | "sort" | "pin";
    x: number;
    y: number;
  } | null>(null);

  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const sortSubmenuRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (!activeSubmenu || !sortSubmenuRef.current) return;

    const submenu = sortSubmenuRef.current;
    const rect = submenu.getBoundingClientRect();
    const triggerRect = submenuTriggerRef.current?.getBoundingClientRect();

    if (!triggerRect) return;

    const viewportPadding = 8;
    const openLeft = triggerRect.right + rect.width > window.innerWidth - viewportPadding;

    const maxLeft = window.innerWidth - rect.width - viewportPadding;
    const nextLeft = Math.max(
      viewportPadding,
      Math.min(openLeft ? triggerRect.left - rect.width : triggerRect.right, maxLeft),
    );

    const maxTop = window.innerHeight - rect.height - viewportPadding;
    const nextTop = Math.max(viewportPadding, Math.min(triggerRect.top, maxTop));

    if (nextLeft !== activeSubmenu.x || nextTop !== activeSubmenu.y) {
      setActiveSubmenu((current) => (current ? { ...current, x: nextLeft, y: nextTop } : current));
    }
  }, [activeSubmenu]);
  const submenuTriggerRef = React.useRef<HTMLElement | null>(null);
  const sortMenuTriggerRef = React.useRef<HTMLElement | null>(null);
  const sortMenuOpenedByKeyboard = React.useRef(false);

  const sortRankByKey = new Map(
    sortRanks.map((rule, index) => [rule.key, { rank: index + 1, direction: rule.direction }]),
  );

  const openSortMenu = (
    columnKey: string,
    trigger: HTMLElement,
    x: number,
    y: number,
    fromKeyboard = false,
  ) => {
    sortMenuTriggerRef.current = trigger;
    sortMenuOpenedByKeyboard.current = fromKeyboard;
    setSortMenu({ columnKey, x, y });
  };

  const closeSortMenu = (restoreFocus = false) => {
    setSortMenu(null);
    setActiveSubmenu(null);
    sortMenuOpenedByKeyboard.current = false;

    if (restoreFocus) {
      requestAnimationFrame(() => sortMenuTriggerRef.current?.focus());
    }
  };
  React.useEffect(() => {
    if (!sortMenu) return;

    sortMenuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;

      const insideMainMenu = sortMenuRef.current?.contains(target);
      const insideSubmenu = sortSubmenuRef.current?.contains(target);

      if (!insideMainMenu && !insideSubmenu) {
        closeSortMenu(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointer);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [sortMenu]);

  const handleSortMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const activeMenu = (event.target as HTMLElement).closest<HTMLElement>('[role="menu"]');

    const items = activeMenu
      ? Array.from(
          activeMenu.querySelectorAll<HTMLButtonElement>(
            '[role="menuitem"], [role="menuitemradio"]',
          ),
        ).filter((item) => !item.disabled)
      : [];

    if (event.key === "Escape") {
      event.preventDefault();

      if (activeSubmenu) {
        setActiveSubmenu(null);
        requestAnimationFrame(() => submenuTriggerRef.current?.focus());
        return;
      }

      closeSortMenu(true);
      return;
    }

    if (!items.length) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      const trigger = document.activeElement as HTMLButtonElement;
      const submenuType = trigger.dataset.submenu as "group" | "sort" | "pin" | undefined;

      if (submenuType) {
        event.preventDefault();
        openSubmenu(submenuType, trigger);

        requestAnimationFrame(() => {
          sortSubmenuRef.current
            ?.querySelector<HTMLButtonElement>('[role="menuitem"], [role="menuitemradio"]')
            ?.focus();
        });
      }

      return;
    } else if (event.key === "ArrowLeft" && activeSubmenu) {
      event.preventDefault();
      setActiveSubmenu(null);
      requestAnimationFrame(() => submenuTriggerRef.current?.focus());
      return;
    } else if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  };

  React.useLayoutEffect(() => {
    const head = headRef.current;
    if (!head) return;

    const labels = [...head.querySelectorAll<HTMLElement>("[data-zb-grid-label]")];

    const measure = () => {
      const next = new Set(
        labels
          .filter((label) => label.scrollWidth > label.clientWidth)
          .map((label) => label.dataset.zbGridLabel)
          .filter((key): key is string => Boolean(key)),
      );

      setTruncatedHeaders((current) => {
        if (current.size === next.size && [...current].every((key) => next.has(key))) {
          return current;
        }
        return next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    labels.forEach((label) => observer.observe(label));

    return () => observer.disconnect();
  }, [columns, density]);
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
    const maxScroll = node.scrollWidth - node.clientWidth;
    const scrollLeft = Math.abs(node.scrollLeft);

    const scrolled = scrollLeft > 0 ? "true" : "false";
    const scrolledLeft = scrollLeft > 0 ? "true" : "false";
    const scrolledRight = scrollLeft < maxScroll ? "true" : "false";

    if (node.dataset.zbScrolled !== scrolled) {
      node.dataset.zbScrolled = scrolled;
    }
    if (node.dataset.zbScrolledLeft !== scrolledLeft) {
      node.dataset.zbScrolledLeft = scrolledLeft;
    }
    if (node.dataset.zbScrolledRight !== scrolledRight) {
      node.dataset.zbScrolledRight = scrolledRight;
    }
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
  const [columnPinStyles, setColumnPinStyles] = React.useState<Record<string, React.CSSProperties>>(
    {},
  );

  React.useLayoutEffect(() => {
    const head = headRef.current;

    if (!head) {
      setPinOffsets([]);
      setColumnPinStyles({});
      return;
    }

    const measure = () => {
      const cells = [...head.children] as HTMLElement[];

      // Legacy leading-column pinning.
      const legacyOffsets: number[] = [];
      let legacyRunning = 0;

      if (columnPinning === undefined) {
        for (let i = 0; i < pinned + (selectable ? 1 : 0); i += 1) {
          legacyOffsets.push(legacyRunning);
          legacyRunning += cells[i]?.offsetWidth ?? 0;
        }
      }

      // Explicit per-column pinning.
      const nextStyles: Record<string, React.CSSProperties> = {};

      if (columnPinning !== undefined) {
        let leftRunning = selectable ? (cells[0]?.offsetWidth ?? 0) : 0;

        for (let index = 0; index < columns.length; index += 1) {
          const column = columns[index];
          if (!column) continue;

          if (columnPinning[column.key] !== "left") continue;

          nextStyles[column.key] = { left: leftRunning };
          leftRunning += cells[index + (selectable ? 1 : 0)]?.offsetWidth ?? 0;
        }
        let rightRunning = 0;

        for (let index = columns.length - 1; index >= 0; index -= 1) {
          const column = columns[index];
          if (!column) continue;

          if (columnPinning[column.key] !== "right") continue;

          nextStyles[column.key] = { right: rightRunning };
          rightRunning += cells[index + (selectable ? 1 : 0)]?.offsetWidth ?? 0;
        }
      }

      setPinOffsets((current) =>
        current.length === legacyOffsets.length &&
        current.every((value, index) => value === legacyOffsets[index])
          ? current
          : legacyOffsets,
      );

      setColumnPinStyles((current) => {
        const keys = Object.keys(nextStyles);
        if (
          keys.length === Object.keys(current).length &&
          keys.every(
            (key) =>
              current[key]?.left === nextStyles[key]?.left &&
              current[key]?.right === nextStyles[key]?.right,
          )
        ) {
          return current;
        }

        return nextStyles;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(head);

    return () => observer.disconnect();
  }, [pinned, selectable, columns, density, columnPinning]);

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
      const multiSortEnabled = Boolean(onClearSort);
      const current = multiSortEnabled
        ? (sortRanks.find((rule) => rule.key === column.key) ?? null)
        : sort;

      const next = nextGridSort(current, column);

      if (multiSortEnabled && current && !next) {
        onClearSort?.(column.key);
        return;
      }

      if (sortProp === undefined) setUncontrolledSort(next);
      onSortChange?.(next);
    },
    [onClearSort, onSortChange, sort, sortProp, sortRanks],
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

  const isColumnPinned = (column: DataGridColumn<Row>, index: number) =>
    columnPinning === undefined
      ? index < pinned
      : columnPinning[column.key] === "left" || columnPinning[column.key] === "right";

  const columnPinStyle = (column: DataGridColumn<Row>, index: number) =>
    columnPinning === undefined
      ? pinOffsets[index + (selectable ? 1 : 0)] !== undefined
        ? { left: pinOffsets[index + (selectable ? 1 : 0)] }
        : undefined
      : columnPinStyles[column.key];

  const pinStyle = (index: number): React.CSSProperties | undefined => {
    if (columnPinning !== undefined) {
      return selectable && index === 0 ? { left: 0 } : undefined;
    }

    const left = pinOffsets[index];
    return left === undefined ? undefined : { left };
  };

  const leftPinnedKeys =
    columnPinning === undefined
      ? columns.slice(0, pinned).map((column) => column.key)
      : columns
          .filter((column) => columnPinning[column.key] === "left")
          .map((column) => column.key);

  const rightPinnedKeys =
    columnPinning === undefined
      ? []
      : columns
          .filter((column) => columnPinning[column.key] === "right")
          .map((column) => column.key);

  const leftPinEdgeKey = leftPinnedKeys.at(-1);
  const rightPinEdgeKey = rightPinnedKeys[0];

  const openSubmenu = (type: "group" | "sort" | "pin", trigger: HTMLElement) => {
    submenuTriggerRef.current = trigger;

    const rect = trigger.getBoundingClientRect();

    setActiveSubmenu({
      type,
      x: rect.right,
      y: rect.top,
    });
  };
  const menuColumn = sortMenu
    ? columns.find((column) => column.key === sortMenu.columnKey)
    : undefined;

  const menuSort = sortMenu ? sortRankByKey.get(sortMenu.columnKey) : undefined;

  const canFilter = Boolean(menuColumn?.filterable);
  const canGroup = Boolean(menuColumn?.groupable);

  const canSort = Boolean(
    menuColumn &&
    menuColumn.sortable !== false &&
    typeof menuColumn.value === "function" &&
    (onSortChange || sortProp === undefined),
  );

  const canPin = Boolean(menuColumn?.pinnable);

  const canHide = Boolean(menuColumn?.hideable);
  const menuSortDirection =
    menuSort?.direction ?? (sort?.key === menuColumn?.key ? sort?.direction : undefined);

  const canClearSort = Boolean(
    menuSortDirection && (onClearSort || onSortChange || sortProp === undefined),
  );

  const canClearGroup = Boolean(menuColumn && group?.key === menuColumn.key);

  const currentPin = menuColumn ? columnPinning?.[menuColumn.key] : undefined;
  const setMenuSortDirection = (direction: GridSortDirection) => {
    if (!menuColumn) return;

    const next: GridSort = {
      key: menuColumn.key,
      direction,
    };

    if (sortProp === undefined) {
      setUncontrolledSort(next);
    }

    onSortChange?.(next);
    closeSortMenu(true);
  };

  const clearMenuSort = () => {
    if (!menuColumn) return;

    if (onClearSort) {
      onClearSort(menuColumn.key);
    } else {
      if (sortProp === undefined) {
        setUncontrolledSort(null);
      }

      onSortChange?.(null);
    }

    closeSortMenu(true);
  };

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

      {toolbar != null ? <div className="zb-grid__toolbar">{toolbar}</div> : null}

      {filterPanel != null ? <div className="zb-grid__filter-panel">{filterPanel}</div> : null}

      {criteria != null ? <div className="zb-grid__criteria">{criteria}</div> : null}

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
                  className={cn(
                    "zb-grid__th zb-grid__th--select",
                    (columnPinning !== undefined || pinnedCount > 0) && "zb-grid__pin",
                  )}
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
                const committedRank = sortRankByKey.get(column.key);

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
                      isColumnPinned(column, index) && "zb-grid__pin",
                      column.key === leftPinEdgeKey && "zb-grid__pin--edge",
                      column.key === rightPinEdgeKey && "zb-grid__pin--edge--right",
                    )}
                    style={{
                      ...(column.width ? { width: column.width } : null),
                      ...columnPinStyle(column, index),
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      if (sortMenuOpenedByKeyboard.current) return;
                      const trigger =
                        event.currentTarget.querySelector<HTMLButtonElement>(".zb-grid__sort") ??
                        event.currentTarget;

                      openSortMenu(column.key, trigger, event.clientX, event.clientY);
                    }}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;

                      if (
                        target.closest(".zb-grid__sort") ||
                        target.closest("[data-zb-grid-resize]")
                      ) {
                        return;
                      }

                      const rect = event.currentTarget.getBoundingClientRect();
                      openSortMenu(column.key, event.currentTarget, rect.left, rect.bottom);
                    }}
                    onKeyDown={(event) => {
                      if ((event.shiftKey && event.key === "F10") || event.key === "ContextMenu") {
                        event.preventDefault();

                        const rect = event.currentTarget.getBoundingClientRect();

                        const trigger =
                          event.currentTarget.querySelector<HTMLButtonElement>(".zb-grid__sort") ??
                          event.currentTarget;

                        openSortMenu(column.key, trigger, rect.left, rect.bottom, true);
                      }
                    }}
                  >
                    <div className="zb-grid__header-content">
                      {sortable ? (
                        <>
                          {defaultAlign(column) === "end" ? (
                            <button
                              type="button"
                              data-zb-cell=""
                              data-zb-col={index}
                              tabIndex={tab}
                              className="zb-grid__sort"
                              aria-label="Sort"
                              title="Sort"
                              onClick={() => {
                                place({ row: HEADER_ROW, column: index });
                                applySort(column);
                              }}
                            >
                              <span aria-hidden="true" className="zb-grid__sort-icon">
                                {active ? (sort?.direction === "ascending" ? "↑" : "↓") : "↕"}
                              </span>
                            </button>
                          ) : null}

                          <span className="zb-grid__label">
                            <span
                              className="zb-grid__label-text"
                              data-zb-grid-label={column.key}
                              title={truncatedHeaders.has(column.key) ? column.header : undefined}
                            >
                              {column.header}
                            </span>

                            {committedRank ? (
                              <sup
                                className="zb-grid__sort-rank"
                                aria-label={`Sort rank ${committedRank.rank}, ${committedRank.direction}`}
                                title={`Sort rank ${committedRank.rank}`}
                              >
                                {committedRank.rank}
                              </sup>
                            ) : null}

                            {mark ? <sup className="zb-grid__mark">{mark}</sup> : null}
                          </span>

                          {defaultAlign(column) === "start" ? (
                            <button
                              type="button"
                              data-zb-cell=""
                              data-zb-col={index}
                              tabIndex={tab}
                              className="zb-grid__sort"
                              aria-label="Sort"
                              title="Sort"
                              onClick={() => {
                                place({ row: HEADER_ROW, column: index });
                                applySort(column);
                              }}
                            >
                              <span aria-hidden="true" className="zb-grid__sort-icon">
                                {active ? (sort?.direction === "ascending" ? "↑" : "↓") : "↕"}
                              </span>
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <span
                          data-zb-cell=""
                          data-zb-col={index}
                          tabIndex={tab}
                          className="zb-grid__static"
                        >
                          <span className="zb-grid__static-label">{column.header}</span>
                          {mark ? <sup className="zb-grid__mark">{mark}</sup> : null}
                        </span>
                      )}
                    </div>
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
                  {empty !== undefined && empty !== null ? (
                    <div
                      className="zb-grid__emptycontent"
                      role={
                        React.isValidElement(empty) && (empty.props as { role?: string }).role
                          ? undefined
                          : "status"
                      }
                    >
                      {empty}
                    </div>
                  ) : (
                    <p className="zb-grid__empty" role="status">
                      No {coverage.noun ?? "rows"} match.
                    </p>
                  )}
                </td>
              </tr>
            ) : null}
            {bodyStatus !== undefined && bodyStatus !== null ? (
              <tr role="row">
                <td className="zb-grid__emptycell" colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div className="zb-grid__emptycontent">{bodyStatus}</div>
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
                          isColumnPinned(column, index) && "zb-grid__pin",
                          column.key === leftPinEdgeKey && "zb-grid__pin--edge",
                          column.key === rightPinEdgeKey && "zb-grid__pin--edge--right",
                        )}
                        style={columnPinStyle(column, index)}
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

      {sortMenu
        ? createPortal(
            <div
              ref={sortMenuRef}
              className="zb-menu zb-menu--anchored"
              role="menu"
              tabIndex={-1}
              aria-label="Column actions"
              aria-orientation="vertical"
              onKeyDown={handleSortMenuKeyDown}
              style={{
                position: "fixed",
                left: sortMenu.x,
                top: sortMenu.y,
              }}
            >
              <div className="zb-menu__list">
                {canFilter && (
                  <button
                    type="button"
                    role="menuitem"
                    className="zb-menu__item"
                    onClick={() => {
                      if (!menuColumn) return;
                      closeSortMenu(false);
                      onFilterColumn?.(menuColumn.key);
                    }}
                  >
                    <span className="zb-menu__icon" aria-hidden="true">
                      <Filter size={16} strokeWidth={1.8} />
                    </span>
                    <span className="zb-menu__label">Filter</span>
                    <span className="zb-menu__shortcut" />
                  </button>
                )}

                {canGroup && (
                  <button
                    type="button"
                    role="menuitem"
                    data-submenu="group"
                    aria-haspopup="menu"
                    aria-expanded={activeSubmenu?.type === "group"}
                    className="zb-menu__item"
                    onClick={(event) => openSubmenu("group", event.currentTarget)}
                  >
                    <Layers size={16} strokeWidth={1.8} />
                    <span className="zb-menu__label">Group</span>
                    <span className="zb-menu__chevron" aria-hidden="true">
                      <ChevronRight size={16} strokeWidth={2} />
                    </span>
                  </button>
                )}

                {canSort && (
                  <button
                    type="button"
                    role="menuitem"
                    data-submenu="sort"
                    aria-haspopup="menu"
                    aria-expanded={activeSubmenu?.type === "sort"}
                    className="zb-menu__item"
                    onClick={(event) => openSubmenu("sort", event.currentTarget)}
                  >
                    <ArrowDownUp size={16} strokeWidth={1.8} />
                    <span className="zb-menu__label">Sort</span>
                    <span className="zb-menu__chevron" aria-hidden="true">
                      <ChevronRight size={16} strokeWidth={2} />
                    </span>
                  </button>
                )}

                {canPin && (
                  <button
                    type="button"
                    role="menuitem"
                    data-submenu="pin"
                    aria-haspopup="menu"
                    aria-expanded={activeSubmenu?.type === "pin"}
                    className="zb-menu__item"
                    onClick={(event) => openSubmenu("pin", event.currentTarget)}
                  >
                    <Pin size={16} strokeWidth={1.8} />
                    <span className="zb-menu__label">Pin column</span>
                    <span className="zb-menu__chevron" aria-hidden="true">
                      <ChevronRight size={16} strokeWidth={2} />
                    </span>
                  </button>
                )}

                {canHide && <div className="zb-menu__separator" role="separator" />}

                <button type="button" role="menuitem" className="zb-menu__item">
                  <RotateCcw size={16} strokeWidth={1.8} />
                  <span className="zb-menu__label">Reset column width</span>
                  <span className="zb-menu__shortcut" />
                </button>

                {canHide && (
                  <button
                    type="button"
                    role="menuitem"
                    className="zb-menu__item"
                    onClick={() => {
                      if (menuColumn) {
                        onHideColumn?.(menuColumn.key);
                      }
                    }}
                  >
                    <EyeOff size={16} strokeWidth={1.8} />
                    <span className="zb-menu__label">Hide column</span>
                    <span className="zb-menu__shortcut" />
                  </button>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
      {activeSubmenu && menuColumn
        ? createPortal(
            <div
              ref={sortSubmenuRef}
              className="zb-menu zb-menu--sub"
              role="menu"
              tabIndex={-1}
              onKeyDown={handleSortMenuKeyDown}
              aria-label={`${activeSubmenu.type} options`}
              aria-orientation="vertical"
              style={{
                position: "fixed",
                left: activeSubmenu.x,
                top: activeSubmenu.y,
              }}
            >
              <div className="zb-menu__list">
                {activeSubmenu.type === "sort" && canSort && (
                  <>
                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitem"
                      onClick={() => setMenuSortDirection("ascending")}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowUp size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">Low to high</span>
                      <span className="zb-menu__shortcut">
                        {menuSortDirection === "ascending" ? "✓" : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitem"
                      onClick={() => setMenuSortDirection("descending")}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowDown size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">High to low</span>
                      <span className="zb-menu__shortcut">
                        {menuSortDirection === "descending" ? "✓" : ""}
                      </span>
                    </button>
                    {canClearSort && (
                      <>
                        <div className="zb-menu__separator" role="separator" />

                        <button
                          type="button"
                          className="zb-menu__item"
                          role="menuitem"
                          onClick={clearMenuSort}
                        >
                          <span className="zb-menu__icon" aria-hidden="true">
                            <X size={16} strokeWidth={1.8} />
                          </span>
                          <span className="zb-menu__label">Clear sort</span>
                          <span className="zb-menu__shortcut" />
                        </button>
                      </>
                    )}
                  </>
                )}
                {activeSubmenu.type === "group" && canGroup && (
                  <>
                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitemradio"
                      aria-checked={
                        group?.key === menuColumn?.key && group.direction === "ascending"
                      }
                      onClick={() => {
                        if (menuColumn) {
                          onGroupChange?.({ key: menuColumn.key, direction: "ascending" });
                        }
                      }}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowDown size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">A to Z</span>
                      <span className="zb-menu__shortcut">
                        {group?.key === menuColumn?.key && group.direction === "ascending"
                          ? "✓"
                          : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitemradio"
                      aria-checked={
                        group?.key === menuColumn?.key && group.direction === "descending"
                      }
                      onClick={() => {
                        if (menuColumn) {
                          onGroupChange?.({ key: menuColumn.key, direction: "descending" });
                        }
                      }}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowUp size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">Z to A</span>
                      <span className="zb-menu__shortcut">
                        {group?.key === menuColumn?.key && group.direction === "descending"
                          ? "✓"
                          : ""}
                      </span>
                    </button>

                    {canClearGroup && (
                      <>
                        <div className="zb-menu__separator" role="separator" />
                        <button
                          type="button"
                          className="zb-menu__item"
                          role="menuitem"
                          onClick={() => onGroupChange?.(null)}
                        >
                          <span className="zb-menu__icon" aria-hidden="true">
                            <X size={16} strokeWidth={1.8} />
                          </span>
                          <span className="zb-menu__label">Clear group</span>
                          <span className="zb-menu__shortcut" />
                        </button>
                      </>
                    )}
                  </>
                )}
                {activeSubmenu.type === "pin" && canPin && (
                  <>
                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitemradio"
                      aria-checked={currentPin === "left"}
                      onClick={() => {
                        if (menuColumn) {
                          onColumnPinningChange?.({
                            ...columnPinning,
                            [menuColumn.key]: "left",
                          });
                        }
                      }}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowLeft size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">Pin left</span>
                      <span className="zb-menu__shortcut">{currentPin === "left" ? "✓" : ""}</span>
                    </button>

                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitemradio"
                      aria-checked={currentPin === "right"}
                      onClick={() => {
                        if (menuColumn) {
                          onColumnPinningChange?.({
                            ...columnPinning,
                            [menuColumn.key]: "right",
                          });
                        }
                      }}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <ArrowRight size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">Pin right</span>
                      <span className="zb-menu__shortcut">{currentPin === "right" ? "✓" : ""}</span>
                    </button>

                    <div className="zb-menu__separator" role="separator" />

                    <button
                      type="button"
                      className="zb-menu__item"
                      role="menuitem"
                      onClick={() => {
                        if (menuColumn) {
                          const nextPinning = { ...columnPinning };
                          delete nextPinning[menuColumn.key];
                          onColumnPinningChange?.(nextPinning);
                        }
                      }}
                    >
                      <span className="zb-menu__icon" aria-hidden="true">
                        <PinOff size={16} strokeWidth={1.8} />
                      </span>
                      <span className="zb-menu__label">Unpin column</span>
                      <span className="zb-menu__shortcut" />
                    </button>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
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

"use client";

/**
 * Live examples for DataGrid, one per claim the grid makes.
 *
 * Every example is the shipped component over the same synthetic caseload the
 * home page uses — invented names and MRNs, no PHI. What changes between them
 * is one prop, or one state of the data, so each shows the single thing its
 * description says and nothing has to be read past to find it.
 *
 * The grids are interactive where the claim is about interaction: sorting,
 * selection, held arrivals and loading more all work, and the examples that
 * hand something to the host say what it was handed.
 */

import * as React from "react";
import {
  ArrowDownUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  DataGrid,
  type DataGridProps,
  type GridSort,
} from "@/registry/zoblocks/data-grid/data-grid";
import {
  ARRIVALS,
  CASELOAD,
  CASELOAD_COLUMNS,
  CASELOAD_COVERAGE,
  CASELOAD_FULL,
  CASELOAD_WITH_EVERY_ABSENCE,
  UNKNOWN_TOTAL_COVERAGE,
  type CaseloadRow,
} from "@/registry/zoblocks/data-grid/data-grid.fixtures";
import { toGridDelimited } from "@/lib/zoblocks-grid";
import { CASELOAD_COLUMNS_DOC, CASELOAD_COLUMNS_WIDE } from "./caseload-columns";

const CAPTION = "Clients on this team's caseload with a raised PHQ-9 or a recent risk screen";
const TITLE = "Caseload · adult outpatient";
const rowKey = (row: CaseloadRow) => row.mrn;
const identify = (row: CaseloadRow) => ({ primary: row.name, secondary: `MRN ${row.mrn}` });

type GridProps = DataGridProps<CaseloadRow>;

/** The props every example shares; each overrides only what it is about. */
const BASE = {
  caption: CAPTION,
  title: TITLE,
  columns: CASELOAD_COLUMNS_DOC,
  rows: CASELOAD,
  rowKey,
  coverage: CASELOAD_COVERAGE,
} satisfies Partial<GridProps>;

function Grid(props: Partial<GridProps>) {
  return (
    <div className="w-full min-w-0">
      <DataGrid<CaseloadRow> {...BASE} {...props} />
    </div>
  );
}

/** A line under the grid saying what the host was told. */
function HostLine({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="m-0 mt-2 min-h-5 text-xs text-graphite">
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Coverage                                                           */
/* ------------------------------------------------------------------ */

export function CoverageAbove() {
  return <Grid />;
}

export function UnknownTotal() {
  return <Grid coverage={UNKNOWN_TOTAL_COVERAGE} />;
}

export function Everything() {
  return <Grid coverage={{ shown: CASELOAD.length, total: CASELOAD.length, noun: "referrals" }} />;
}

export function MatchedNobody() {
  return <Grid rows={[]} coverage={{ shown: 0, total: 0, noun: "clients" }} />;
}

export function Refused() {
  return <Grid ceiling={4} coverage={{ shown: CASELOAD.length, total: 1438, noun: "patients" }} />;
}

/* ------------------------------------------------------------------ */
/* What a cell says                                                   */
/* ------------------------------------------------------------------ */

export function AbsenceSortsLast() {
  return (
    <Grid
      rows={CASELOAD_WITH_EVERY_ABSENCE}
      coverage={{ shown: CASELOAD_WITH_EVERY_ABSENCE.length, total: 312, noun: "clients" }}
      defaultSort={{ key: "phq9", direction: "ascending" }}
    />
  );
}

export function SortedByDerived() {
  return <Grid defaultSort={{ key: "risk", direction: "descending" }} />;
}

/** Held until the reader asks; admitting replaces the rows the arrivals are for. */
export function HeldArrivals() {
  const [rows, setRows] = React.useState<readonly CaseloadRow[]>(CASELOAD);
  const [held, setHeld] = React.useState<readonly CaseloadRow[]>(ARRIVALS);
  return (
    <>
      <Grid
        rows={rows}
        arrivals={held}
        arrivalsAt="11:47"
        onAdmitArrivals={(arrived) => {
          const byMrn = new Map(arrived.map((row) => [row.mrn, row]));
          setRows((current) => current.map((row) => byMrn.get(row.mrn) ?? row));
          setHeld([]);
        }}
      />
      <HostLine>
        {held.length
          ? "Nothing has moved. Show the results when you are ready to."
          : "onAdmitArrivals — the host merged 3 results into the rows."}
      </HostLine>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Reading and acting                                                 */
/* ------------------------------------------------------------------ */

export function RowReaderIsOn() {
  const [activated, setActivated] = React.useState<string | null>(null);
  return (
    <>
      <Grid identify={identify} onRowActivate={(row) => setActivated(row.name)} />
      <HostLine>
        {activated
          ? `onRowActivate — ${activated}`
          : "Click a cell, then use the arrow keys. Enter opens the row."}
      </HostLine>
    </>
  );
}

export function Selection() {
  const [selected, setSelected] = React.useState<readonly string[]>(["4471902", "3320145"]);
  return (
    <Grid
      identify={identify}
      selectedKeys={selected}
      onSelectionChange={setSelected}
      bulkActions={(rows) => (
        <>
          <button type="button" className="oxw__btn">
            Assign clinician
          </button>
          <button type="button" className="oxw__btn">
            Schedule contact · {rows.length}
          </button>
        </>
      )}
    />
  );
}

export function PinnedIdentity() {
  return (
    <Grid
      columns={CASELOAD_COLUMNS_WIDE}
      rows={CASELOAD_FULL.slice(0, 10)}
      coverage={{ shown: 10, total: CASELOAD_FULL.length, noun: "clients" }}
      pinnedColumns={1}
      maxHeight="18rem"
    />
  );
}

/** Scroll the grid: it asks at the end, the host appends, and it says when there is no more. */
export function LoadingMore() {
  const [loaded, setLoaded] = React.useState(8);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const total = 22;
  return (
    <Grid
      rows={CASELOAD_FULL.slice(0, loaded)}
      coverage={{ shown: loaded, total: "unknown", noun: "clients" }}
      maxHeight="16rem"
      loadingMore={loading}
      exhausted={loaded >= total}
      onReachEnd={() => {
        setLoading(true);
        timer.current = setTimeout(() => {
          setLoaded((current) => Math.min(current + 7, total));
          setLoading(false);
        }, 600);
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Framing and export                                                 */
/* ------------------------------------------------------------------ */

export function HostFramed() {
  return <Grid masthead={false} footer={false} />;
}

/**
 * The real export, run on a row whose preferred name is a formula. The cell
 * is neutralised and the coverage sentence is row 1.
 */
export function ExportSurface() {
  const rows = React.useMemo<CaseloadRow[]>(
    () => [{ ...CASELOAD[0]!, name: '=HYPERLINK("http://x.example","Ade")' }, CASELOAD[1]!],
    [],
  );
  const csv = React.useMemo(
    () => toGridDelimited(rows, CASELOAD_COLUMNS, { coverage: CASELOAD_COVERAGE }),
    [rows],
  );
  return (
    <div className="grid w-full min-w-0 gap-3">
      <Grid rows={rows} coverage={{ shown: 2, total: 312, noun: "clients" }} />
      <div className="grid gap-1">
        <span id="grid-export-label" className="text-xs font-medium text-ink">
          toGridDelimited(rows, columns)
        </span>
        {/* It scrolls, so it takes focus: a keyboard has no other way to read
            the lines past the fold. */}
        <pre
          role="region"
          aria-labelledby="grid-export-label"
          tabIndex={0}
          className="scroll-thin m-0 max-h-48 overflow-auto rounded-lg border border-rule bg-paper-sunk p-3 font-mono text-[0.6875rem] leading-relaxed text-ink"
        >
          {csv}
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Playground                                                         */
/* ------------------------------------------------------------------ */

/**
 * The worklist with every interaction live, and the knobs applied on top.
 * Wide columns, so pinning has something to scroll past; held arrivals and a
 * selection, so every event has something to fire on.
 */

type SavedViewName = "Overview" | "Patients" | "Appointments";

type SavedViewConfig = {
  filter: string;
  sort: readonly string[];
  groupBy: string;
  columns: string;
  density: string;
};

const SAVED_VIEW_CONFIGS: Record<SavedViewName, SavedViewConfig> = {
  Overview: {
    filter: "Active clients",
    sort: ["Priority · High to Low"],
    groupBy: "Status",
    columns: "Wide",
    density: "Comfortable",
  },
  Patients: {
    filter: "All patients",
    sort: ["Name · A to Z"],
    groupBy: "None",
    columns: "All",
    density: "Compact",
  },
  Appointments: {
    filter: "Upcoming",
    sort: ["Next Contact · Soonest first"],
    groupBy: "Date",
    columns: "Standard",
    density: "Comfortable",
  },
};

export function DataGridPlayground(props: Partial<GridProps>) {
  const { onSelectionChange, onSortChange, onAdmitArrivals, onReachEnd, ...rest } = props;
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [sort, setSort] = React.useState<GridSort | null>({ key: "risk", direction: "descending" });
  const [held, setHeld] = React.useState<readonly CaseloadRow[]>(ARRIVALS);
  const [toolbarExpanded, setToolbarExpanded] = React.useState(true);
  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<SavedViewName>("Overview");
  const [savedViewConfigs, setSavedViewConfigs] = React.useState<
    Record<SavedViewName, SavedViewConfig>
  >(() => ({ ...SAVED_VIEW_CONFIGS }));

  const [viewConfig, setViewConfig] = React.useState<SavedViewConfig>({
    ...SAVED_VIEW_CONFIGS.Overview,
  });
  // Criteria Area visibility and Editor state
  const [criteriaVisible, setCriteriaVisible] = React.useState(true);
  const [editorOpen, setEditorOpen] = React.useState(false);

  // Previously committed Sort configuration
  const [committedSort, setCommittedSort] = React.useState(["Priority · High to Low"]);

  // Current Editor draft
  const [draftSort, setDraftSort] = React.useState(["Priority · High to Low"]);

  // The pending action determines what happens after confirmation.
  const [pendingExit, setPendingExit] = React.useState<"hide" | "cancel" | null>(null);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);
  const discardChangesRef = React.useRef<HTMLButtonElement>(null);
  const exitTriggerRef = React.useRef<HTMLElement | null>(null);
  const sortButtonRef = React.useRef<HTMLButtonElement>(null);

  const draftModified = JSON.stringify(draftSort) !== JSON.stringify(committedSort);
  const savedBaseline = savedViewConfigs[selectedView];

  const viewModified = JSON.stringify(viewConfig) !== JSON.stringify(savedBaseline);

  const isProtectedView = selectedView === "Overview";
  React.useEffect(() => {
    if (pendingExit) {
      keepEditingRef.current?.focus();
    } else if (exitTriggerRef.current) {
      exitTriggerRef.current.focus();
      exitTriggerRef.current = null;
    }
  }, [pendingExit]);
  const handleShowCriteria = () => {
    setCriteriaVisible(true);
    setEditorOpen(false);
  };

  const handleSelectView = (view: SavedViewName) => {
    setSelectedView(view);

    const nextConfig = savedViewConfigs[view];

    setViewConfig({ ...nextConfig });
    setCommittedSort([...nextConfig.sort]);
    setDraftSort([...nextConfig.sort]);
  };

  const handleOpenEditor = () => {
    setCriteriaVisible(true);
    setDraftSort([...committedSort]);
    setEditorOpen(true);
  };

  const handleHideCriteria = () => {
    if (editorOpen && draftModified) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingExit("hide");
      return;
    }

    setEditorOpen(false);
    setCriteriaVisible(false);
  };

  const handleCancelEditor = () => {
    if (draftModified) {
      exitTriggerRef.current = sortButtonRef.current;
      setPendingExit("cancel");
      return;
    }

    setEditorOpen(false);
  };

  const handleKeepEditing = () => {
    setPendingExit(null);
  };

  const handleDismissConfirmation = () => {
    setPendingExit(null);
  };

  const handleDiscardChanges = () => {
    const exitAction = pendingExit;

    setDraftSort([...committedSort]);
    setPendingExit(null);

    if (exitAction === "hide") {
      setEditorOpen(false);
      setCriteriaVisible(false);
    } else if (exitAction === "cancel") {
      setEditorOpen(false);
    }
  };

  const handleApplyCriteria = () => {
    setCommittedSort([...draftSort]);
    setViewConfig((current) => ({
      ...current,
      sort: [...draftSort],
    }));
    setEditorOpen(false);
    setPendingExit(null);
  };

  const handleSaveView = () => {
    if (isProtectedView || !viewModified) return;

    setSavedViewConfigs((current) => ({
      ...current,
      [selectedView]: { ...viewConfig, sort: [...viewConfig.sort] },
    }));
    setSaveMenuOpen(false);
  };

  const handleRevertView = () => {
    const baseline = savedViewConfigs[selectedView];

    setViewConfig({ ...baseline, sort: [...baseline.sort] });
    setCommittedSort([...baseline.sort]);
    setDraftSort([...baseline.sort]);
    setSaveMenuOpen(false);
  };

  const rows = CASELOAD_FULL.slice(0, 12);
  return (
    <>
      <div
        className={
          isFullScreen
            ? "fixed inset-0 z-40 h-dvh w-screen overflow-auto bg-paper p-4 sm:p-6"
            : "w-full"
        }
        onKeyDown={(event) => {
          if (event.key === "Escape" && isFullScreen) {
            event.preventDefault();
            setIsFullScreen(false);
          }
        }}
      >
        <Grid
          columns={CASELOAD_COLUMNS_WIDE}
          rows={rows}
          coverage={{ shown: rows.length, total: CASELOAD_FULL.length, noun: "clients" }}

          toolbar={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              {/* Saved views */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={`cursor-pointer rounded-2xl border px-3 py-2 text-xs font-semibold ${
                    selectedView === "Overview"
                      ? "border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)]"
                      : "border-[var(--zb-grid-rule)] text-[var(--zb-grid-muted)]"
                  }`}
                  aria-pressed={selectedView === "Overview"}
                  onClick={() => handleSelectView("Overview")}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-2xl border px-3 py-2 text-xs ${
                    selectedView === "Patients"
                      ? "border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] font-semibold"
                      : "border-[var(--zb-grid-rule)] text-[var(--zb-grid-muted)]"
                  }`}
                  aria-pressed={selectedView === "Patients"}
                  onClick={() => handleSelectView("Patients")}
                >
                  Patients
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-2xl border px-3 py-2 text-xs ${
                    selectedView === "Appointments"
                      ? "border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] font-semibold"
                      : "border-[var(--zb-grid-rule)] text-[var(--zb-grid-muted)]"
                  }`}
                  aria-pressed={selectedView === "Appointments"}
                  onClick={() => handleSelectView("Appointments")}
                >
                  Appointments
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 cursor-pointer rounded-2xl border border-[var(--zb-grid-rule)] px-2 py-2 text-xs text-[var(--zb-grid-muted)]"
                >
                  <Ellipsis size={16} />
                  More
                </button>
              </div>

              {/* Actions and view controls */}
              <div className="group flex min-w-0 max-w-full flex-nowrap items-center justify-start gap-3 overflow-x-auto [&>*]:shrink-0 sm:flex-wrap sm:justify-end sm:overflow-visible">
                {/* Collapse/Expand toolbar */}
                <button
                  type="button"
                  aria-label={toolbarExpanded ? "Collapse toolbar" : "Expand toolbar"}
                  title={toolbarExpanded ? "Collapse toolbar" : "Expand toolbar"}
                  onClick={() => setToolbarExpanded((expanded) => !expanded)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[var(--zb-grid-rule)] p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--zb-grid-ink)]"
                >
                  {toolbarExpanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
                </button>

                {/* Separator after Collapse/Expand */}
                <span aria-hidden="true" className="h-6 border-l border-[var(--zb-grid-rule)]" />

                {toolbarExpanded && (
                  <>
                    {viewModified && (
                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={handleSaveView}
                          disabled={isProtectedView}
                          className="cursor-pointer rounded-l-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save Changes
                        </button>

                        <button
                          type="button"
                          aria-label="More save options"
                          aria-expanded={saveMenuOpen}
                          title="More save options"
                          onClick={() => setSaveMenuOpen((open) => !open)}
                          className="cursor-pointer rounded-r-md border border-l-0 border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] p-2"
                        >
                          <ChevronDown size={14} aria-hidden="true" />
                        </button>
                        {saveMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-md border border-[var(--zb-grid-rule)] bg-paper p-1 shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleRevertView}
                              className="w-full cursor-pointer rounded px-3 py-2 text-left text-xs text-ink transition-colors hover:bg-[var(--zb-grid-sunk)]"
                            >
                              Revert changes
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Filter */}
                    <button
                      type="button"
                      aria-label="Filter"
                      title="Toggle filter"
                      onClick={() =>
                        setViewConfig((current) => ({
                          ...current,
                          filter:
                            current.filter === savedBaseline.filter
                              ? "Changed filter"
                              : savedBaseline.filter,
                        }))
                      }
                      className={`cursor-pointer rounded-md border p-2 ${
                        viewConfig.filter !== savedBaseline.filter
                          ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)]"
                          : "border-[var(--zb-grid-rule)]"
                      }`}
                    >
                      <Filter size={16} />
                    </button>

                    {/* Sort */}
                    <button
                      ref={sortButtonRef}
                      type="button"
                      aria-label="Sort"
                      title="Sort"
                      onClick={handleOpenEditor}
                      className={`cursor-pointer rounded-md border p-2 transition-colors ${
                        editorOpen
                          ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)] text-[var(--zb-grid-ink)]"
                          : "border-[var(--zb-grid-rule)]"
                      }`}
                    >
                      <ArrowDownUp size={16} />
                    </button>
                  </>
                )}

                {/* Search remains visible in both states */}
                <button
                  type="button"
                  aria-label="Search"
                  title="Search"
                  className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] p-2"
                >
                  <Search size={16} />
                </button>

                {/* Separator after Search in both states */}
                <span aria-hidden="true" className="h-6 border-l border-[var(--zb-grid-rule)]" />

                {toolbarExpanded && (
                  <>
                    {/* Full screen */}
                    <button
                      type="button"
                      aria-label={isFullScreen ? "Exit full screen" : "Full screen"}
                      title={isFullScreen ? "Exit full screen" : "Full screen"}
                      aria-pressed={isFullScreen}
                      onClick={() => setIsFullScreen((current) => !current)}
                      className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] p-2"
                    >
                      {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </button>
                  </>
                )}

                {/* View settings remains visible in both states */}
                <button
                  type="button"
                  aria-label="Toggle display density"
                  title={`Density: ${viewConfig.density}`}
                  onClick={() =>
                    setViewConfig((current) => ({
                      ...current,
                      density:
                        current.density === savedBaseline.density
                          ? current.density === "Compact"
                            ? "Comfortable"
                            : "Compact"
                          : savedBaseline.density,
                    }))
                  }
                  className={`cursor-pointer rounded-md border p-2 ${
                    viewConfig.density !== savedBaseline.density
                      ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)]"
                      : "border-[var(--zb-grid-rule)]"
                  }`}
                >
                  <SlidersHorizontal size={15} />
                </button>

                {/* Show criteria remains visible in both states */}
                <button
                  type="button"
                  aria-label={criteriaVisible ? "Hide criteria" : "Show criteria"}
                  title={criteriaVisible ? "Hide criteria" : "Show criteria"}
                  onClick={criteriaVisible ? handleHideCriteria : handleShowCriteria}
                  className="inline-flex cursor-pointer items-center justify-center rounded-md border border-[var(--zb-grid-rule)] p-2"
                >
                  {criteriaVisible ? (
                    <ChevronDown size={15} aria-hidden="true" />
                  ) : (
                    <ChevronUp size={15} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          }

          filterPanel={
            criteriaVisible && editorOpen ? (
              <div className="rounded-lg border border-[var(--zb-grid-rule)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold">Sort configuration</span>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleCancelEditor}
                      className="cursor-pointer rounded-md px-3 py-1.5 text-[var(--zb-grid-muted)] transition-colors hover:bg-[var(--zb-grid-sunk)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCriteria}
                      className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold transition-colors hover:opacity-80"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[var(--zb-grid-muted)]">
                  Sorts are applied from top to bottom.
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {draftSort.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-[var(--zb-grid-rule)] p-3 text-xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${item}`}
                        title="Remove sort"
                        onClick={() =>
                          setDraftSort((current) => current.filter((_, i) => i !== index))
                        }
                        className="cursor-pointer text-[var(--zb-grid-muted)] hover:text-[var(--zb-grid-ink)]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftSort((current) =>
                        current.includes("Next Contact · Newest to Oldest")
                          ? current
                          : [...current, "Next Contact · Newest to Oldest"],
                      )
                    }
                    className="cursor-pointer font-medium text-[var(--zb-grid-muted)] transition-colors hover:text-[var(--zb-grid-ink)]"
                  >
                    + Add Sort
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer text-[var(--zb-grid-muted)] transition-colors hover:text-[var(--zb-grid-ink)]"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            ) : null
          }
          criteria={
            criteriaVisible && !editorOpen ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setViewConfig((current) => ({
                      ...current,
                      groupBy:
                        current.groupBy === savedBaseline.groupBy
                          ? "Priority"
                          : savedBaseline.groupBy,
                    }))
                  }
                  className="cursor-pointer rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2"
                >
                  Group by: {viewConfig.groupBy}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setViewConfig((current) => ({
                      ...current,
                      columns:
                        current.columns === savedBaseline.columns
                          ? current.columns === "Wide"
                            ? "Compact"
                            : "Wide"
                          : savedBaseline.columns,
                    }))
                  }
                  className={`cursor-pointer rounded-md border px-3 py-2 ${
                    viewConfig.columns !== savedBaseline.columns
                      ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)] text-[var(--zb-grid-ink)]"
                      : "border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)]"
                  }`}
                >
                  Columns: {viewConfig.columns}
                </button>
                <span className="rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2">
                  Sort: {committedSort.length} field{committedSort.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2">
                  Advanced filter: 3 rules
                </span>
                <span className="rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2">
                  Status: Active
                </span>
              </div>
            ) : null
          }

          maxHeight={isFullScreen ? "calc(100dvh - 16rem)" : "20rem"}
          identify={identify}
          sort={sort}
          onSortChange={(next) => {
            setSort(next);
            onSortChange?.(next);
          }}
          selectedKeys={selected}
          onSelectionChange={(keys) => {
            setSelected(keys);
            onSelectionChange?.(keys);
          }}
          bulkActions={(picked) => (
            <button type="button" className="oxw__btn">
              Assign clinician · {picked.length}
            </button>
          )}
          arrivals={held}
          arrivalsAt="11:47"
          onAdmitArrivals={(arrived) => {
            setHeld([]);
            onAdmitArrivals?.(arrived);
          }}
          onReachEnd={onReachEnd}
          exhausted
          {...rest}
        />
      </div>

      {pendingExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-dialog-title"
            aria-describedby="discard-dialog-description"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                handleDismissConfirmation();
                return;
              }

              if (event.key === "Tab") {
                const first = keepEditingRef.current;
                const last = discardChangesRef.current;

                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
            className="w-full max-w-md rounded-xl border border-rule bg-paper p-5 text-ink shadow-xl"
          >
            <h2 id="discard-dialog-title" className="text-base font-semibold">
              Discard Unsaved Changes?
            </h2>

            <p id="discard-dialog-description" className="mt-2 text-sm text-[var(--zb-grid-muted)]">
              You have unsaved Sort changes. Do you want to discard them?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={keepEditingRef}
                type="button"
                onClick={handleKeepEditing}
                className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-2 text-sm"
              >
                Keep Editing
              </button>

              <button
                ref={discardChangesRef}
                type="button"
                onClick={handleDiscardChanges}
                className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2 text-sm font-semibold text-ink transition-colors hover:opacity-80"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

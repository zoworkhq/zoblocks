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
  sortGridRows,
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
export type SearchableFieldKey =
  "name" | "mrn" | "program" | "cssrs" | "risk" | "due" | "clinician";

type SearchScopeField = {
  key: SearchableFieldKey;
  label: string;
  disabled?: boolean;
};

export type SearchScopeConfig = {
  fields: readonly SearchScopeField[];
  selected: readonly SearchableFieldKey[];
  zeroSelectedBehavior: "allow" | "block" | "default";
  rerunOnSelectionChange?: boolean;
  defaultSelected?: readonly SearchableFieldKey[];
  onSelectionChange: (selected: readonly SearchableFieldKey[]) => void;
  onSearch?: (query: string, selected: readonly SearchableFieldKey[]) => void | Promise<void>;
};

const SEARCHABLE_FIELD_VALUES: Record<SearchableFieldKey, (row: CaseloadRow) => string> = {
  name: (row) => row.name,
  mrn: (row) => row.mrn,
  program: (row) => row.program,
  cssrs: (row) => (typeof row.cssrs === "string" ? row.cssrs : ""),
  risk: (row) => String(row.risk),
  due: (row) => row.due,
  clinician: (row) => row.clinician,
};

const DEFAULT_SEARCH_SCOPE: readonly SearchableFieldKey[] = [
  "name",
  "mrn",
  "program",
  "cssrs",
  "risk",
  "due",
  "clinician",
];

function getEffectiveSearchScope(config?: SearchScopeConfig) {
  if (!config) {
    return { fields: DEFAULT_SEARCH_SCOPE, blocked: false };
  }

  const eligibleFields = config.fields.filter((field) => !field.disabled);
  const eligibleKeys = new Set(eligibleFields.map((field) => field.key));

  const selected = config.selected.filter((key) => eligibleKeys.has(key));

  if (selected.length > 0) {
    return { fields: selected, blocked: false };
  }

  if (config.zeroSelectedBehavior === "block") {
    return { fields: [], blocked: true };
  }

  if (config.zeroSelectedBehavior === "default") {
    const defaults = (config.defaultSelected ?? []).filter((key) => eligibleKeys.has(key));

    return { fields: defaults, blocked: defaults.length === 0 };
  }

  return { fields: [], blocked: false };
}

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

type DataGridPlaygroundProps = Partial<GridProps> & {
  searchScope?: SearchScopeConfig;
};

export function DataGridPlayground(props: DataGridPlaygroundProps) {
  const { searchScope, onSelectionChange, onSortChange, onAdmitArrivals, onReachEnd, ...rest } =
    props;
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
  const [pendingExit, setPendingExit] = React.useState<"hide" | "cancel" | "view" | null>(null);
  const [pendingView, setPendingView] = React.useState<SavedViewName | null>(null);
  const [viewAnnouncement, setViewAnnouncement] = React.useState("");
  const viewButtonRefs = React.useRef<Record<SavedViewName, HTMLButtonElement | null>>({
    Overview: null,
    Patients: null,
    Appointments: null,
  });
  const focusSelectedViewRef = React.useRef(false);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);
  const discardChangesRef = React.useRef<HTMLButtonElement>(null);
  const exitTriggerRef = React.useRef<HTMLElement | null>(null);
  const sortButtonRef = React.useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchSettingsOpen, setSearchSettingsOpen] = React.useState(false);
  const [searchScopeAnnouncement, setSearchScopeAnnouncement] = React.useState("");
  const searchSettingsTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<CaseloadRow[] | null>(null);
  const [searchPending, setSearchPending] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searchRetryCount, setSearchRetryCount] = React.useState(0);
  const [searchResultCount, setSearchResultCount] = React.useState<number | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchRequestRef = React.useRef(0);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchTriggerRef = React.useRef<HTMLButtonElement>(null);
  const shouldRestoreSearchFocusRef = React.useRef(true);

  const draftModified = JSON.stringify(draftSort) !== JSON.stringify(committedSort);
  const getPrimarySort = (rules: readonly string[]): GridSort | null => {
    switch (rules[0]) {
      case "Priority · High to Low":
        return { key: "risk", direction: "descending" };
      case "Name · A to Z":
        return { key: "name", direction: "ascending" };
      case "Next Contact · Soonest first":
        return { key: "due", direction: "ascending" };
      case "Next Contact · Newest to Oldest":
        return { key: "due", direction: "descending" };
      default:
        return null;
    }
  };
  const savedBaseline = savedViewConfigs[selectedView];

  const viewModified = JSON.stringify(viewConfig) !== JSON.stringify(savedBaseline);

  const isProtectedView = selectedView === "Overview";
  React.useEffect(() => {
    if (pendingExit) {
      keepEditingRef.current?.focus();
      return;
    }

    if (focusSelectedViewRef.current) {
      viewButtonRefs.current[selectedView]?.focus();
      focusSelectedViewRef.current = false;
      return;
    }

    if (exitTriggerRef.current) {
      exitTriggerRef.current.focus();
      exitTriggerRef.current = null;
    }
  }, [pendingExit, selectedView]);

  React.useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (searchContainerRef.current?.contains(event.target as Node)) {
        return;
      }
      setSearchSettingsOpen(false);

      // Preserve an active query when the user clicks elsewhere.
      if (searchQuery.trim() !== "") {
        return;
      }

      // Collapse only when the query is empty.
      shouldRestoreSearchFocusRef.current = false;
      setSearchOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [searchOpen, searchQuery]);

  React.useEffect(() => {
    if (!searchSettingsOpen) return;

    const handleSettingsKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setSearchSettingsOpen(false);
        searchSettingsTriggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleSettingsKeyDown);

    return () => {
      document.removeEventListener("keydown", handleSettingsKeyDown);
    };
  }, [searchSettingsOpen]);

  const wasSearchOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (wasSearchOpenRef.current && !searchOpen) {
      if (shouldRestoreSearchFocusRef.current) {
        searchTriggerRef.current?.focus();
      }

      shouldRestoreSearchFocusRef.current = true;
    }

    wasSearchOpenRef.current = searchOpen;
  }, [searchOpen]);

  const effectiveSearchScope = getEffectiveSearchScope(searchScope);
  const effectiveScopeKey = JSON.stringify(effectiveSearchScope.fields);

  const searchAuthorizationKey = JSON.stringify(
    searchScope?.fields.filter((field) => !field.disabled).map((field) => field.key) ?? [],
  );

  const searchEffectScopeKey = searchScope?.rerunOnSelectionChange ? effectiveScopeKey : "";
  const selectableSearchFields = searchScope?.fields ?? [];
  const showSearchSettings = selectableSearchFields.filter((field) => !field.disabled).length > 1;
  React.useEffect(() => {
    if (!showSearchSettings) {
      setSearchSettingsOpen(false);
    }
  }, [showSearchSettings]);
  const handleSearchScopeToggle = (key: SearchableFieldKey, checked: boolean) => {
    if (!searchScope) return;

    const eligibleKeys = new Set(
      searchScope.fields.filter((field) => !field.disabled).map((field) => field.key),
    );

    if (!eligibleKeys.has(key)) return;

    const nextSelected = new Set(
      searchScope.selected.filter((selectedKey) => eligibleKeys.has(selectedKey)),
    );

    if (checked) {
      nextSelected.add(key);
    } else {
      nextSelected.delete(key);
    }

    if (nextSelected.size === 0 && searchScope.zeroSelectedBehavior === "block") {
      return;
    }

    searchScope.onSelectionChange([...nextSelected]);
    setSearchScopeAnnouncement("Search scope updated.");
  };
  React.useEffect(() => {
    const requestId = ++searchRequestRef.current;
    const query = searchQuery.trim().toLocaleLowerCase();

    setSearchPending(false);

    if (!query) {
      setSearchResults(null);
      setSearchResultCount(null);
      setSearchError(null);

      return () => {
        if (searchRequestRef.current === requestId) {
          searchRequestRef.current++;
        }
      };
    }

    let requestTimer: ReturnType<typeof setTimeout> | undefined;

    const debounceTimer = setTimeout(() => {
      if (requestId !== searchRequestRef.current) return;

      setSearchPending(true);
      setSearchError(null);

      requestTimer = setTimeout(async () => {
        if (requestId !== searchRequestRef.current) return;

        try {
          if (effectiveSearchScope.blocked) {
            throw new Error("No permitted search fields are available.");
          }

          // Await the host request. A rejection represents an incomplete search.
          await searchScope?.onSearch?.(searchQuery.trim(), effectiveSearchScope.fields);

          if (requestId !== searchRequestRef.current) return;

          const matches = CASELOAD_FULL.filter((row) =>
            effectiveSearchScope.fields.some((key) =>
              SEARCHABLE_FIELD_VALUES[key](row).toLocaleLowerCase().includes(query),
            ),
          );

          setSearchResults(matches);
          setSearchResultCount(matches.length);
          setSearchError(null);
        } catch {
          if (requestId !== searchRequestRef.current) return;

          setSearchError("Search could not be completed. Please try again.");
        } finally {
          if (requestId === searchRequestRef.current) {
            setSearchPending(false);
          }
        }
      }, 350);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);

      if (requestTimer !== undefined) {
        clearTimeout(requestTimer);
      }

      if (searchRequestRef.current === requestId) {
        searchRequestRef.current++;
      }
    };
  }, [searchQuery, searchEffectScopeKey, searchAuthorizationKey, searchRetryCount]);
  const handleShowCriteria = () => {
    setCriteriaVisible(true);
    setEditorOpen(false);
  };

  const applyViewSelection = (view: SavedViewName) => {
    const nextConfig = savedViewConfigs[view];

    // Invalidate any outstanding request from the outgoing view immediately.
    searchRequestRef.current++;

    // Temporary Search state is not part of the Saved View.
    shouldRestoreSearchFocusRef.current = false;
    setSearchSettingsOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    setSearchResultCount(null);
    setSearchError(null);
    setSearchPending(false);
    setSearchOpen(false);

    // Load the destination view's saved configuration.
    setSelectedView(view);
    setViewConfig({ ...nextConfig });
    setCommittedSort([...nextConfig.sort]);
    setDraftSort([...nextConfig.sort]);
    setSort(getPrimarySort(nextConfig.sort));
    setSaveMenuOpen(false);
    setEditorOpen(false);
    setCriteriaVisible(true);

    setPendingView(null);
    setViewAnnouncement(`${view} view selected. Saved settings loaded.`);
    focusSelectedViewRef.current = true;
  };

  const handleSelectView = (view: SavedViewName) => {
    if (view === selectedView) return;

    // Protect both unapplied editor changes and unsaved view-owned settings.
    if (draftModified || viewModified) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingView(view);
      setPendingExit("view");
      return;
    }

    applyViewSelection(view);
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
    setPendingView(null);
    setPendingExit(null);
  };

  const handleDismissConfirmation = () => {
    setPendingView(null);
    setPendingExit(null);
  };
  const handleDiscardChanges = () => {
    const exitAction = pendingExit;
    const destination = pendingView;

    setDraftSort([...committedSort]);
    setPendingExit(null);

    if (exitAction === "hide") {
      setEditorOpen(false);
      setCriteriaVisible(false);
    } else if (exitAction === "cancel") {
      setEditorOpen(false);
    } else if (exitAction === "view" && destination) {
      applyViewSelection(destination);
    }
  };

  const handleApplyCriteria = () => {
    setCommittedSort([...draftSort]);
    setSort(getPrimarySort(draftSort));
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
    setSort(getPrimarySort(baseline.sort));
    setSaveMenuOpen(false);
  };

  const sortRules: GridSort[] = committedSort.flatMap((label): GridSort[] => {
    switch (label) {
      case "Priority · High to Low":
        return [{ key: "risk", direction: "descending" }];
      case "Name · A to Z":
        return [{ key: "name", direction: "ascending" }];
      case "Next Contact · Soonest first":
        return [{ key: "due", direction: "ascending" }];
      case "Next Contact · Newest to Oldest":
        return [{ key: "due", direction: "descending" }];
      default:
        return [];
    }
  });

  const hasSearchQuery = searchQuery.trim().length > 0;

  const showInitialSearchLoading = hasSearchQuery && searchPending && searchResults === null;

  const showSearchError = hasSearchQuery && searchError !== null;

  const showNoSearchResults =
    hasSearchQuery &&
    !searchPending &&
    searchError === null &&
    searchResults !== null &&
    searchResults.length === 0;

  const sortedRows = sortRules.reduceRight((currentRows, rule) => {
    const column = CASELOAD_COLUMNS.find((candidate) => candidate.key === rule.key);
    return sortGridRows(currentRows, column, rule.direction);
  }, searchResults ?? CASELOAD_FULL);

  const rows = showInitialSearchLoading ? [] : sortedRows.slice(0, 12);

  const coverage = {
    shown: rows.length,
    total: searchResultCount ?? (hasSearchQuery ? ("unknown" as const) : CASELOAD_FULL.length),
    noun: "clients",
  };
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
          coverage={coverage}
          empty={
            showInitialSearchLoading ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-2 py-5"
              >
                <span
                  aria-hidden="true"
                  className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--zb-grid-rule)] border-t-[var(--zb-grid-ink)]"
                />
                <h3 className="text-sm font-semibold text-ink">Searching Records...</h3>
                <p className="text-xs text-[var(--zb-grid-muted)]">
                  Searching the permitted fields. Please wait.
                </p>
              </div>
            ) : showSearchError ? (
              <div role="alert" className="flex flex-col items-center gap-2 py-5">
                <span aria-hidden="true" className="text-lg text-red-600">
                  !
                </span>
                <h3 className="text-sm font-semibold text-ink">Search Could Not Be Completed</h3>
                <p className="max-w-sm text-xs text-[var(--zb-grid-muted)]">
                  The search did not finish successfully. Check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchRetryCount((count) => count + 1)}
                  className="mt-1 cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--zb-grid-sunk)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                >
                  Retry
                </button>
              </div>
            ) : showNoSearchResults ? (
              <div role="status" className="flex flex-col items-center gap-2 py-5">
                <h3 className="text-sm font-semibold text-ink">No Matching Records</h3>
                <p className="text-xs text-[var(--zb-grid-muted)]">
                  Try a different search term or broaden your search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="mt-1 cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--zb-grid-sunk)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                >
                  Clear Search
                </button>
              </div>
            ) : undefined
          }

          bodyStatus={
            showSearchError && searchResults && searchResults.length > 0 ? (
              <div className="flex items-center justify-between gap-3 py-3">
                <div role="alert" className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-lg text-red-600">
                    !
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Search Could Not Be Completed
                    </h3>
                    <p className="text-xs text-[var(--zb-grid-muted)]">
                      Previous results are still shown. Check your connection and try again.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchRetryCount((count) => count + 1)}
                  className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--zb-grid-sunk)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                >
                  Retry
                </button>
              </div>
            ) : undefined
          }

          toolbar={
            <div className="flex w-full flex-nowrap items-center justify-between gap-3">
              {/* Saved views */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  ref={(node) => {
                    viewButtonRefs.current.Overview = node;
                  }}
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
                  ref={(node) => {
                    viewButtonRefs.current.Patients = node;
                  }}
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
                  ref={(node) => {
                    viewButtonRefs.current.Appointments = node;
                  }}
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

              {viewAnnouncement && (
                <span className="sr-only" role="status" aria-live="polite">
                  {viewAnnouncement}
                </span>
              )}

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
                {searchOpen ? (
                  <div
                    ref={searchContainerRef}
                    className="group relative flex h-8 w-56 items-center"
                  >
                    <Search
                      size={16}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-2 text-[var(--zb-grid-muted)]"
                    />
                    <label htmlFor="data-grid-search-input" className="sr-only">
                      Search records
                    </label>
                    <input
                      ref={searchInputRef}
                      id="data-grid-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search records..."
                      className="h-8 w-full rounded-md border border-[var(--zb-grid-rule)] bg-paper pl-8 pr-16 text-xs text-ink outline-none focus-visible:border-[var(--zb-grid-ink)] focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]/20"
                    />
                    {showSearchSettings && (
                      <>
                        <button
                          ref={searchSettingsTriggerRef}
                          type="button"
                          aria-label="Search settings"
                          aria-expanded={searchSettingsOpen}
                          aria-controls="data-grid-search-settings"
                          title="Search settings"
                          onClick={() => setSearchSettingsOpen((open) => !open)}
                          className="absolute right-9 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--zb-grid-muted)] opacity-0 transition-opacity hover:bg-[var(--zb-grid-rule)] group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                        >
                          <Ellipsis size={14} aria-hidden="true" />
                        </button>

                        {searchSettingsOpen && (
                          <div
                            id="data-grid-search-settings"
                            className="absolute right-0 top-full z-30 mt-2 w-60 rounded-md border border-[var(--zb-grid-rule)] bg-paper p-3 shadow-lg"
                          >
                            <fieldset className="m-0 min-w-0 border-0 p-0">
                              <legend className="mb-2 text-xs font-semibold text-ink">
                                Search in
                              </legend>

                              <div className="flex flex-col gap-2">
                                {selectableSearchFields.map((field) => {
                                  const eligibleSelectedCount = searchScope!.selected.filter(
                                    (key) =>
                                      searchScope!.fields.some(
                                        (candidate) => candidate.key === key && !candidate.disabled,
                                      ),
                                  ).length;

                                  const preventsEmptySelection =
                                    searchScope!.zeroSelectedBehavior === "block" &&
                                    searchScope!.selected.includes(field.key) &&
                                    eligibleSelectedCount <= 1;

                                  return (
                                    <label
                                      key={field.key}
                                      className="flex min-h-7 items-center gap-2 text-xs text-ink"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={searchScope!.selected.includes(field.key)}
                                        disabled={field.disabled || preventsEmptySelection}
                                        onChange={(event) =>
                                          handleSearchScopeToggle(field.key, event.target.checked)
                                        }
                                        className="h-3.5 w-3.5 accent-[var(--zb-grid-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                                      />
                                      <span
                                        className={
                                          field.disabled ? "text-[var(--zb-grid-muted)]" : ""
                                        }
                                      >
                                        {field.label}
                                        {field.disabled ? " (unavailable)" : ""}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                          </div>
                        )}
                      </>
                    )}
                    {searchQuery.length > 0 && (
                      <button
                        type="button"
                        aria-label="Clear Search"
                        title="Clear Search"
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-2 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[var(--zb-grid-muted)] hover:bg-[var(--zb-grid-rule)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]"
                      >
                        ×
                      </button>
                    )}

                    {searchPending ? (
                      <span role="status" className="sr-only">
                        Searching records
                      </span>
                    ) : searchResultCount !== null ? (
                      <span role="status" className="sr-only">
                        {searchResultCount} matching clients found
                      </span>
                    ) : null}
                    <span role="status" aria-live="polite" className="sr-only">
                      {searchScopeAnnouncement}
                    </span>
                  </div>
                ) : (
                  <button
                    ref={searchTriggerRef}
                    type="button"
                    aria-label="Search"
                    title="Search"
                    onClick={() => setSearchOpen(true)}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-[var(--zb-grid-rule)]"
                  >
                    <Search size={16} aria-hidden="true" />
                  </button>
                )}

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
                      disabled={draftSort.length === 0}
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
            criteriaVisible ? (
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
              {pendingExit === "view"
                ? `Switching to ${pendingView ?? "another"} view will discard ${
                    draftModified && viewModified
                      ? "your unsaved Sort changes and view settings"
                      : draftModified
                        ? "your unsaved Sort changes"
                        : "your unsaved view settings"
                  }. Do you want to continue?`
                : "You have unsaved Sort changes. Do you want to discard them?"}
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

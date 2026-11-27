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
  Check,
  Ellipsis,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  DataGrid,
  sortGridRows,
  type DataGridProps,
  type DataGridGroup,
  type DataGridColumnPinning,
  type GridSort,
} from "@/registry/zoblocks/data-grid/data-grid";
import { DateRangeField } from "@/registry/zoblocks/date-picker/date-picker";
import { compareDates, plainDate, type ZbDate } from "@/lib/zoblocks-datetime";
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
type FilterFieldKey = "status" | "phq9" | "program" | "cssrs" | "risk" | "due";

type FilterCondition = {
  id: string;
  field: FilterFieldKey;
  operator?: "is" | "is-any-of" | "greater-than-or-equal" | "date-range";
  value?: string[];
  numericValue?: string;
  dateRange?: { start: ZbDate | null; end: ZbDate | null };
};

type FilterUsage = {
  simple: number;
  advanced: number;
};

const FILTER_FIELDS: readonly { key: FilterFieldKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "phq9", label: "PHQ-9" },
  { key: "program", label: "Program" },
  { key: "cssrs", label: "Risk Screen" },
  { key: "risk", label: "Disengagement" },
  { key: "due", label: "Next Contact" },
];

const STATUS_FILTER_VALUES = [
  "Active",
  "Pending",
  "On hold",
  "Completed",
  "Inactive",
  "Archived",
] as const;

const INITIAL_SIMPLE_CONDITIONS: readonly FilterCondition[] = [
  { id: "simple-status", field: "status" },
];

const INITIAL_ADVANCED_CONDITIONS: readonly FilterCondition[] = [
  { id: "advanced-phq9", field: "phq9" },
  { id: "advanced-status", field: "status" },
  { id: "advanced-program", field: "program" },
];

function getFilterUsage(
  simpleConditions: readonly FilterCondition[],
  advancedConditions: readonly FilterCondition[],
): Record<FilterFieldKey, FilterUsage> {
  const usage = Object.fromEntries(
    FILTER_FIELDS.map(({ key }) => [key, { simple: 0, advanced: 0 }]),
  ) as Record<FilterFieldKey, FilterUsage>;

  simpleConditions.forEach(({ field }) => {
    usage[field].simple += 1;
  });

  advancedConditions.forEach(({ field }) => {
    usage[field].advanced += 1;
  });

  return usage;
}

function getFilterUsageLabel(usage: FilterUsage): string {
  const total = usage.simple + usage.advanced;

  if (total === 0) return "Not currently used";

  const sources = [
    usage.simple > 0 ? "Simple" : null,
    usage.advanced > 0 ? "Advanced" : null,
  ].filter(Boolean);

  return `Used in ${sources.join(" and ")} (${total})`;
}

type FilterFieldPickerProps = {
  selectedField: FilterFieldKey | null;
  usage: Record<FilterFieldKey, FilterUsage>;
  onSelect: (field: FilterFieldKey) => void;
  label: string;
};

function FilterFieldPicker({ selectedField, usage, onSelect, label }: FilterFieldPickerProps) {
  const [query, setQuery] = React.useState("");

  const visibleFields = FILTER_FIELDS.filter((field) =>
    field.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const pickerId = React.useId().replace(/:/g, "");

  return (
    <section aria-label={label} className="mt-3">
      <label className="sr-only" htmlFor={`${pickerId}-field-search`}>
        Search filter fields
      </label>
      <input
        id={`${pickerId}-field-search`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search fields"
        className="mb-2 w-full rounded-md border border-[var(--zb-grid-rule)] bg-transparent px-3 py-2 text-sm"
      />

      <div className="grid gap-1">
        {visibleFields.map((field) => {
          const active = selectedField === field.key;
          const usageId = `${pickerId}-${field.key}-usage`;

          return (
            <button
              key={field.key}
              type="button"
              aria-pressed={active}
              aria-describedby={usageId}
              onClick={() => onSelect(field.key)}
              className="flex min-w-0 w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[var(--zb-grid-sunk)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block whitespace-normal break-words text-sm font-medium">
                  {field.label}
                </span>
                <span
                  id={usageId}
                  className="block whitespace-normal break-words text-xs text-[var(--zb-grid-muted)]"
                >
                  {getFilterUsageLabel(usage[field.key])}
                </span>
              </span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {active ? <Check size={16} aria-label="Selected" /> : null}
              </span>
            </button>
          );
        })}

        {visibleFields.length === 0 ? (
          <p className="px-3 py-2 text-sm text-[var(--zb-grid-muted)]">No matching fields.</p>
        ) : null}
      </div>
    </section>
  );
}

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
    sort: ["PHQ-9 · High to Low"],
    groupBy: "Status",
    columns: "Wide",
    density: "Comfortable",
  },
  Patients: {
    filter: "All patients",
    sort: ["Name · A to Z", "PHQ-9 · High to Low"],
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
  const [sort, setSort] = React.useState<GridSort | null>({
    key: "phq9",
    direction: "descending",
  });
  const [group, setGroup] = React.useState<DataGridGroup | null>(null);
  const [draftGroup, setDraftGroup] = React.useState<DataGridGroup | null>(null);
  const [groupEditorOpen, setGroupEditorOpen] = React.useState(false);
  const [groupAnnouncement, setGroupAnnouncement] = React.useState("");
  const [columnPinning, setColumnPinning] = React.useState<DataGridColumnPinning>({});
  const [hiddenColumns, setHiddenColumns] = React.useState<readonly string[]>([]);
  const [manageColumnsOpen, setManageColumnsOpen] = React.useState(false);
  const [columnSearch, setColumnSearch] = React.useState("");
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
  const [committedSort, setCommittedSort] = React.useState(["PHQ-9 · High to Low"]);

  // Current Editor draft
  const [draftSort, setDraftSort] = React.useState(["PHQ-9 · High to Low"]);

  // Risk Screen Simple Filter: committed value and independent editor draft
  const [committedRiskScreenValue, setCommittedRiskScreenValue] = React.useState<string | null>(
    null,
  );
  const [draftRiskScreenValue, setDraftRiskScreenValue] = React.useState<string | null>(null);
  const [riskScreenEditorOpen, setRiskScreenEditorOpen] = React.useState(false);

  // Shared Simple and Advanced filter usage; drafts remain independent.
  const [committedSimpleConditions, setCommittedSimpleConditions] =
    React.useState<readonly FilterCondition[]>(INITIAL_SIMPLE_CONDITIONS);
  const [draftSimpleConditions, setDraftSimpleConditions] =
    React.useState<readonly FilterCondition[]>(INITIAL_SIMPLE_CONDITIONS);

  const [committedAdvancedConditions, setCommittedAdvancedConditions] = React.useState<
    readonly FilterCondition[]
  >(INITIAL_ADVANCED_CONDITIONS);
  const [draftAdvancedConditions, setDraftAdvancedConditions] = React.useState<
    readonly FilterCondition[]
  >(INITIAL_ADVANCED_CONDITIONS);

  const [simplePickerOpen, setSimplePickerOpen] = React.useState(false);
  const [activeSimpleConditionId, setActiveSimpleConditionId] = React.useState<string | null>(null);
  const [statusValuePickerOpen, setStatusValuePickerOpen] = React.useState(false);
  const [simpleFilterUndo, setSimpleFilterUndo] = React.useState<FilterCondition | null>(null);
  const [simpleFilterPendingClear, setSimpleFilterPendingClear] =
    React.useState<FilterCondition | null>(null);
  const [advancedPickerConditionId, setAdvancedPickerConditionId] = React.useState<string | null>(
    null,
  );
  const [advancedEditorOpen, setAdvancedEditorOpen] = React.useState(false);
  const [pendingAdvancedSimpleTransfer, setPendingAdvancedSimpleTransfer] = React.useState<{
    simpleConditionId: string;
    advancedConditionId: string;
    sourceWasCommitted: boolean;
  } | null>(null);

  // The pending action determines what happens after confirmation.
  const [pendingExit, setPendingExit] = React.useState<
    "hide" | "cancel" | "simple-cancel" | "simple-sort" | "view" | "filter" | "sort" | null
  >(null);
  const [pendingView, setPendingView] = React.useState<SavedViewName | null>(null);
  const [pendingSortAction, setPendingSortAction] = React.useState<{
    sort: GridSort;
    label: string;
  } | null>(null);
  const [viewAnnouncement, setViewAnnouncement] = React.useState("");
  const [sortAnnouncement, setSortAnnouncement] = React.useState("");
  const viewButtonRefs = React.useRef<Record<SavedViewName, HTMLButtonElement | null>>({
    Overview: null,
    Patients: null,
    Appointments: null,
  });
  const focusSelectedViewRef = React.useRef(false);
  const keepEditingRef = React.useRef<HTMLButtonElement>(null);
  const discardChangesRef = React.useRef<HTMLButtonElement>(null);
  const exitTriggerRef = React.useRef<HTMLElement | null>(null);
  const statusValuePickerRef = React.useRef<HTMLDivElement>(null);
  const advancedConditionStackRef = React.useRef<HTMLDivElement>(null);
  const previousAdvancedConditionCountRef = React.useRef(draftAdvancedConditions.length);

  React.useEffect(() => {
    const previousCount = previousAdvancedConditionCountRef.current;
    const currentCount = draftAdvancedConditions.length;

    previousAdvancedConditionCountRef.current = currentCount;

    if (advancedEditorOpen && currentCount > previousCount) {
      const stack = advancedConditionStackRef.current;
      if (stack) {
        stack.scrollTop = stack.scrollHeight;
      }
    }
  }, [advancedEditorOpen, draftAdvancedConditions.length]);
  const sortButtonRef = React.useRef<HTMLButtonElement>(null);
  const riskScreenValueRef = React.useRef<HTMLSelectElement>(null);
  const manageColumnsTriggerRef = React.useRef<HTMLButtonElement>(null);
  const manageColumnsSearchRef = React.useRef<HTMLInputElement>(null);
  const manageColumnsDrawerRef = React.useRef<HTMLElement>(null);
  const wasManageColumnsOpenRef = React.useRef(false);
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

  const simpleDraftModified =
    JSON.stringify(draftSimpleConditions) !== JSON.stringify(committedSimpleConditions);

  const activeSimpleCondition = draftSimpleConditions.find(
    (condition) => condition.id === activeSimpleConditionId,
  );

  const simpleDraftValid = Boolean(
    activeSimpleCondition &&
    (activeSimpleCondition.field === "status"
      ? (activeSimpleCondition.value?.length ?? 0) > 0
      : activeSimpleCondition.field === "phq9"
        ? activeSimpleCondition.numericValue?.trim() !== "" &&
          activeSimpleCondition.numericValue !== undefined &&
          Number.isFinite(Number(activeSimpleCondition.numericValue))
        : activeSimpleCondition.field === "due"
          ? activeSimpleCondition.operator === "date-range" &&
            activeSimpleCondition.dateRange?.start !== null &&
            activeSimpleCondition.dateRange?.start !== undefined &&
            activeSimpleCondition.dateRange?.end !== null &&
            activeSimpleCondition.dateRange?.end !== undefined &&
            compareDates(
              activeSimpleCondition.dateRange.end,
              activeSimpleCondition.dateRange.start,
            ) >= 0
          : true),
  );

  const filterUsage = getFilterUsage(committedSimpleConditions, committedAdvancedConditions);

  const openSimpleFieldPicker = () => {
    setDraftSimpleConditions([...committedSimpleConditions]);
    setActiveSimpleConditionId(null);
    setSimplePickerOpen(true);
    setCriteriaVisible(true);
  };

  const openSimpleFilterEditor = (conditionId: string) => {
    setSimpleFilterPendingClear(null);
    setDraftSimpleConditions([...committedSimpleConditions]);
    setActiveSimpleConditionId(conditionId);
    setSimplePickerOpen(true);
    setStatusValuePickerOpen(false);
    setCriteriaVisible(true);
  };

  const openAdvancedEditor = () => {
    setDraftAdvancedConditions([...committedAdvancedConditions]);
    setAdvancedPickerConditionId(null);
    setAdvancedEditorOpen(true);
    setCriteriaVisible(true);
  };

  const selectSimpleField = (field: FilterFieldKey) => {
    const existing = draftSimpleConditions.find((condition) => condition.field === field);

    if (existing) {
      setDraftSimpleConditions((current) =>
        current.map((condition) =>
          condition.id === existing.id
            ? {
                ...condition,
                ...(field === "status" ? { operator: condition.operator ?? "is" } : {}),
                ...(field === "phq9"
                  ? {
                      operator: condition.operator ?? "greater-than-or-equal",
                    }
                  : {}),
              }
            : condition,
        ),
      );

      setStatusValuePickerOpen(field === "status");
      setActiveSimpleConditionId(existing.id);
      return;
    }

    const id = `simple-${field}`;
    setDraftSimpleConditions((current) => [
      ...current,
      {
        id,
        field,
        ...(field === "status" ? { operator: "is" as const } : {}),
        ...(field === "phq9"
          ? { operator: "greater-than-or-equal" as const, numericValue: "" }
          : {}),
      },
    ]);
    setStatusValuePickerOpen(field === "status");
    setActiveSimpleConditionId(id);
  };

  const openAdvancedFieldPicker = (conditionId: string) => {
    setAdvancedPickerConditionId(conditionId);
  };

  const selectAdvancedField = (field: FilterFieldKey) => {
    if (!advancedPickerConditionId) return;

    // Advanced conditions may reuse a field; only the owning draft changes.
    setDraftAdvancedConditions((current) =>
      current.map((condition) =>
        condition.id === advancedPickerConditionId ? { ...condition, field } : condition,
      ),
    );
  };

  const selectStatusValue = (value: string) => {
    if (!activeSimpleConditionId) return;

    setDraftSimpleConditions((current) =>
      current.map((condition) => {
        if (condition.id !== activeSimpleConditionId) return condition;

        const selectedValues = condition.value ?? [];
        const nextValues = selectedValues.includes(value)
          ? selectedValues.filter((item) => item !== value)
          : [...selectedValues, value];

        return {
          ...condition,
          value: nextValues,
          operator: nextValues.length > 1 ? "is-any-of" : "is",
        };
      }),
    );
  };

  const selectAllStatusValues = () => {
    if (!activeSimpleConditionId) return;

    setDraftSimpleConditions((current) =>
      current.map((condition) =>
        condition.id === activeSimpleConditionId
          ? {
              ...condition,
              value:
                condition.value?.length === STATUS_FILTER_VALUES.length
                  ? []
                  : [...STATUS_FILTER_VALUES],
            }
          : condition,
      ),
    );
  };

  const applySimpleConditions = () => {
    setCommittedSimpleConditions([...draftSimpleConditions]);
    setSimplePickerOpen(false);
    setStatusValuePickerOpen(false);
    setActiveSimpleConditionId(null);
  };

  const clearSimpleFilter = () => {
    if (!simpleFilterPendingClear) return;

    setSimpleFilterUndo(simpleFilterPendingClear);
    setCommittedSimpleConditions((current) =>
      current.filter((condition) => condition.id !== simpleFilterPendingClear.id),
    );
    setDraftSimpleConditions((current) =>
      current.filter((condition) => condition.id !== simpleFilterPendingClear.id),
    );
    setSimpleFilterPendingClear(null);
    setSimplePickerOpen(false);
    setStatusValuePickerOpen(false);
    setActiveSimpleConditionId(null);
  };

  const undoSimpleFilterClear = () => {
    if (!simpleFilterUndo) return;

    setCommittedSimpleConditions((current) => [...current, simpleFilterUndo]);
    setDraftSimpleConditions((current) => [...current, simpleFilterUndo]);
    setSimpleFilterUndo(null);
  };

  const handleCancelSimpleFilter = () => {
    if (simpleDraftModified) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingExit("simple-cancel");
      return;
    }

    setDraftSimpleConditions([...committedSimpleConditions]);
    setSimplePickerOpen(false);
    setStatusValuePickerOpen(false);
    setActiveSimpleConditionId(null);
  };

  const applyAdvancedConditions = () => {
    setCommittedAdvancedConditions([...draftAdvancedConditions]);

    if (
      pendingAdvancedSimpleTransfer &&
      draftAdvancedConditions.some(
        (condition) => condition.id === pendingAdvancedSimpleTransfer.advancedConditionId,
      )
    ) {
      setDraftSimpleConditions((current) =>
        current.filter(
          (condition) => condition.id !== pendingAdvancedSimpleTransfer.simpleConditionId,
        ),
      );

      if (pendingAdvancedSimpleTransfer.sourceWasCommitted) {
        setCommittedSimpleConditions((current) =>
          current.filter(
            (condition) => condition.id !== pendingAdvancedSimpleTransfer.simpleConditionId,
          ),
        );
      }
    }

    setPendingAdvancedSimpleTransfer(null);
    setAdvancedPickerConditionId(null);
    setAdvancedEditorOpen(false);
  };

  const addSimpleConditionToAdvanced = () => {
    if (!activeSimpleCondition || !simpleDraftValid) return;

    const id = `advanced-from-simple-${Date.now()}`;
    const sourceWasCommitted = committedSimpleConditions.some(
      (condition) => condition.id === activeSimpleCondition.id,
    );

    setDraftAdvancedConditions([...committedAdvancedConditions, { ...activeSimpleCondition, id }]);
    setPendingAdvancedSimpleTransfer({
      simpleConditionId: activeSimpleCondition.id,
      advancedConditionId: id,
      sourceWasCommitted,
    });
    setAdvancedPickerConditionId(null);
    setAdvancedEditorOpen(true);
    setSimplePickerOpen(false);
    setStatusValuePickerOpen(false);
    setActiveSimpleConditionId(null);
  };

  const getPrimarySort = (rules: readonly string[]): GridSort | null => {
    switch (rules[0]) {
      case "Priority · High to Low":
        return { key: "risk", direction: "descending" };
      case "Priority · Low to High":
        return { key: "risk", direction: "ascending" };
      case "Name · A to Z":
        return { key: "name", direction: "ascending" };
      case "Name · Z to A":
        return { key: "name", direction: "descending" };
      case "Next Contact · Soonest first":
        return { key: "due", direction: "ascending" };
      case "Next Contact · Newest to Oldest":
        return { key: "due", direction: "descending" };
      case "PHQ-9 · High to Low":
        return { key: "phq9", direction: "descending" };
      case "PHQ-9 · Low to High":
        return { key: "phq9", direction: "ascending" };
      case "Risk Screen · Declared order":
        return { key: "cssrs", direction: "ascending" };
      case "Risk Screen · Reverse declared order":
        return { key: "cssrs", direction: "descending" };
      default:
        return null;
    }
  };
  const savedBaseline = savedViewConfigs[selectedView];

  const getGroupFieldLabel = (key: string) => {
    switch (key) {
      case "cssrs":
        return "Risk Screen";
      case "program":
        return "Program";
      default:
        return key;
    }
  };

  const getGroupDirectionLabel = (direction: DataGridGroup["direction"]) =>
    direction === "ascending" ? "A to Z" : "Z to A";

  const handleCommitGroup = (nextGroup: DataGridGroup | null) => {
    setGroup(nextGroup);
    setGroupAnnouncement(
      nextGroup
        ? `Grouped by ${getGroupFieldLabel(nextGroup.key)}, ${getGroupDirectionLabel(nextGroup.direction)}.`
        : "Grouping cleared.",
    );
  };

  const handleOpenGroupEditor = () => {
    setDraftGroup(group);
    setGroupEditorOpen(true);
    setCriteriaVisible(true);
  };

  const handleApplyGroup = () => {
    handleCommitGroup(draftGroup);
    setGroupEditorOpen(false);
  };

  const handleCancelGroupEditor = () => {
    setDraftGroup(group);
    setGroupEditorOpen(false);
  };

  const handleOpenRiskScreenFilter = (columnKey: string) => {
    if (columnKey !== "cssrs") return;
    if (riskScreenEditorOpen) return;

    // Protect an unapplied Sort draft before switching editors.
    if (editorOpen && draftModified) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingExit("filter");
      return;
    }

    setEditorOpen(false);
    setCriteriaVisible(true);
    setDraftRiskScreenValue(committedRiskScreenValue);
    setRiskScreenEditorOpen(true);
  };

  const handleApplyRiskScreenFilter = () => {
    if (!draftRiskScreenValue) return;

    setCommittedRiskScreenValue(draftRiskScreenValue);
    setRiskScreenEditorOpen(false);
  };

  const viewModified = JSON.stringify(viewConfig) !== JSON.stringify(savedBaseline);

  const isProtectedView = selectedView === "Overview";
  React.useEffect(() => {
    if (pendingExit) {
      if (pendingExit === "sort") {
        requestAnimationFrame(() => {
          keepEditingRef.current?.focus();
        });
      } else {
        keepEditingRef.current?.focus();
      }
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
    if (riskScreenEditorOpen) {
      riskScreenValueRef.current?.focus();
    }
  }, [riskScreenEditorOpen]);

  React.useEffect(() => {
    if (!statusValuePickerOpen) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      if (statusValuePickerRef.current?.contains(event.target as Node)) {
        return;
      }

      setStatusValuePickerOpen(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
    };
  }, [statusValuePickerOpen]);

  React.useEffect(() => {
    if (manageColumnsOpen) {
      manageColumnsSearchRef.current?.focus();
      wasManageColumnsOpenRef.current = true;
    } else if (wasManageColumnsOpenRef.current) {
      manageColumnsTriggerRef.current?.focus();
      wasManageColumnsOpenRef.current = false;
    }
  }, [manageColumnsOpen]);

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
    if (simplePickerOpen && simpleDraftModified) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingExit("simple-sort");
      return;
    }

    setCriteriaVisible(true);
    setDraftSort([...committedSort]);
    setEditorOpen(true);
  };

  const handleHideCriteria = () => {
    const riskScreenDraftModified =
      riskScreenEditorOpen && draftRiskScreenValue !== committedRiskScreenValue;

    if (
      (editorOpen && draftModified) ||
      riskScreenDraftModified ||
      (simplePickerOpen && simpleDraftModified)
    ) {
      exitTriggerRef.current = document.activeElement as HTMLElement;
      setPendingExit("hide");
      return;
    }

    setEditorOpen(false);
    setRiskScreenEditorOpen(false);
    setDraftRiskScreenValue(committedRiskScreenValue);
    setDraftSimpleConditions([...committedSimpleConditions]);
    setSimplePickerOpen(false);
    setStatusValuePickerOpen(false);
    setActiveSimpleConditionId(null);
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
    setPendingSortAction(null);
    setPendingExit(null);
  };

  const handleDismissConfirmation = () => {
    setPendingView(null);
    setPendingSortAction(null);
    setPendingExit(null);
  };
  const handleDiscardChanges = () => {
    const exitAction = pendingExit;
    const destination = pendingView;
    const sortAction = pendingSortAction;

    if (exitAction === "sort" && sortAction) {
      onSortChange?.(sortAction.sort);

      setDraftSort([...committedSort]);
      setPendingExit(null);
      setCommittedSort([sortAction.label]);
      setSort(sortAction.sort);
      setViewConfig((current) => ({
        ...current,
        sort: [sortAction.label],
      }));
      setEditorOpen(false);
      setPendingSortAction(null);
      setSortAnnouncement(`Sort draft discarded. ${sortAction.label} applied.`);
      return;
    }

    setDraftSort([...committedSort]);
    setPendingExit(null);

    if (exitAction === "hide") {
      setEditorOpen(false);
      setRiskScreenEditorOpen(false);
      setDraftRiskScreenValue(committedRiskScreenValue);
      setDraftSimpleConditions([...committedSimpleConditions]);
      setSimplePickerOpen(false);
      setStatusValuePickerOpen(false);
      setActiveSimpleConditionId(null);
      setCriteriaVisible(false);
    } else if (exitAction === "cancel") {
      setEditorOpen(false);
    } else if (exitAction === "simple-cancel") {
      setDraftSimpleConditions([...committedSimpleConditions]);
      setSimpleFilterPendingClear(null);
      setSimplePickerOpen(false);
      setStatusValuePickerOpen(false);
      setActiveSimpleConditionId(null);
    } else if (exitAction === "simple-sort") {
      setDraftSimpleConditions([...committedSimpleConditions]);
      setSimpleFilterPendingClear(null);
      setSimplePickerOpen(false);
      setStatusValuePickerOpen(false);
      setActiveSimpleConditionId(null);
      setCriteriaVisible(true);
      setDraftSort([...committedSort]);
      setEditorOpen(true);
    } else if (exitAction === "filter") {
      setEditorOpen(false);
      setCriteriaVisible(true);
      setDraftRiskScreenValue(committedRiskScreenValue);
      setRiskScreenEditorOpen(true);
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

  const handleHeaderSortChange = (next: GridSort | null) => {
    if (!next) return;

    const labelByKey: Record<string, (direction: GridSort["direction"]) => string> = {
      name: (direction) => (direction === "ascending" ? "Name · A to Z" : "Name · Z to A"),
      phq9: (direction) =>
        direction === "descending" ? "PHQ-9 · High to Low" : "PHQ-9 · Low to High",
      cssrs: (direction) =>
        direction === "ascending"
          ? "Risk Screen · Declared order"
          : "Risk Screen · Reverse declared order",
      risk: (direction) =>
        direction === "descending" ? "Priority · High to Low" : "Priority · Low to High",
      due: (direction) =>
        direction === "ascending"
          ? "Next Contact · Soonest first"
          : "Next Contact · Newest to Oldest",
    };

    const nextLabel = labelByKey[next.key]?.(next.direction);
    if (!nextLabel) return;

    const nextCommittedSort = [nextLabel];
    const changesCommittedSort =
      JSON.stringify(nextCommittedSort) !== JSON.stringify(committedSort);

    if (editorOpen && draftModified && changesCommittedSort) {
      setPendingSortAction({ sort: next, label: nextLabel });
      setPendingExit("sort");
      return;
    }

    onSortChange?.(next);
    setCommittedSort(nextCommittedSort);
    setSort(getPrimarySort(nextCommittedSort));
    setViewConfig((current) => ({
      ...current,
      sort: nextCommittedSort,
    }));
    setSortAnnouncement(`Sorted by ${nextLabel}.`);
  };

  const sortRules: GridSort[] = committedSort.flatMap((label): GridSort[] => {
    switch (label) {
      case "Priority · High to Low":
        return [{ key: "risk", direction: "descending" }];
      case "Priority · Low to High":
        return [{ key: "risk", direction: "ascending" }];
      case "Name · A to Z":
        return [{ key: "name", direction: "ascending" }];
      case "Name · Z to A":
        return [{ key: "name", direction: "descending" }];
      case "Next Contact · Soonest first":
        return [{ key: "due", direction: "ascending" }];
      case "Next Contact · Newest to Oldest":
        return [{ key: "due", direction: "descending" }];
      case "PHQ-9 · High to Low":
        return [{ key: "phq9", direction: "descending" }];
      case "PHQ-9 · Low to High":
        return [{ key: "phq9", direction: "ascending" }];
      case "Risk Screen · Declared order":
        return [{ key: "cssrs", direction: "ascending" }];
      case "Risk Screen · Reverse declared order":
        return [{ key: "cssrs", direction: "descending" }];
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
          columns={(selectedView === "Patients"
            ? CASELOAD_COLUMNS_DOC
            : CASELOAD_COLUMNS_WIDE
          ).filter((column) => !hiddenColumns.includes(column.key))}
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
            <div
              className={
                isFullScreen
                  ? "flex w-full flex-nowrap items-center justify-between gap-3"
                  : "w-full min-w-0 overflow-x-auto"
              }
            >
              <div
                className={
                  isFullScreen
                    ? "contents"
                    : "flex w-max min-w-full flex-nowrap items-center justify-between gap-3"
                }
              >
                {/* Saved views */}
                <div
                  className={
                    isFullScreen
                      ? "flex flex-wrap items-center gap-3"
                      : "flex shrink-0 flex-nowrap items-center gap-3"
                  }
                >
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
                <div
                  className={
                    isFullScreen
                      ? "group flex min-w-0 max-w-full flex-nowrap items-center justify-start gap-3 overflow-x-auto [&>*]:shrink-0 sm:flex-wrap sm:justify-end sm:overflow-visible"
                      : "group flex shrink-0 flex-nowrap items-center justify-start gap-3 [&>*]:shrink-0"
                  }
                >
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
                        title="Add filter"
                        onClick={openSimpleFieldPicker}
                        className={`cursor-pointer rounded-md border p-2 ${
                          simplePickerOpen
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

                      {/* Manage columns */}
                      <button
                        ref={manageColumnsTriggerRef}
                        type="button"
                        aria-expanded={manageColumnsOpen}
                        onClick={() => setManageColumnsOpen(true)}
                        className={`cursor-pointer rounded-md border px-3 py-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)] focus-visible:ring-offset-2 ${
                          manageColumnsOpen
                            ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)]"
                            : "border-[var(--zb-grid-rule)]"
                        }`}
                      >
                        Manage columns
                      </button>

                      {/* Manage columns drawer */}
                      {manageColumnsOpen && (
                        <div className="fixed inset-0 z-[100]">
                          {/* Backdrop */}
                          <button
                            type="button"
                            aria-label="Close manage columns panel"
                            onClick={() => setManageColumnsOpen(false)}
                            className="absolute inset-0 bg-black/30"
                          />

                          {/* Drawer */}
                          <aside
                            ref={manageColumnsDrawerRef}
                            role="dialog"
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                setManageColumnsOpen(false);
                                return;
                              }

                              if (event.key !== "Tab") return;

                              const focusableElements =
                                event.currentTarget.querySelectorAll<HTMLElement>(
                                  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                                );

                              const firstElement = focusableElements[0];
                              const lastElement = focusableElements[focusableElements.length - 1];

                              if (!firstElement || !lastElement) {
                                event.preventDefault();
                                return;
                              }

                              if (event.shiftKey && document.activeElement === firstElement) {
                                event.preventDefault();
                                lastElement.focus();
                              } else if (
                                !event.shiftKey &&
                                document.activeElement === lastElement
                              ) {
                                event.preventDefault();
                                firstElement.focus();
                              }
                            }}
                            aria-modal="true"
                            aria-labelledby="manage-columns-title"
                            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-[var(--zb-grid-rule)] bg-paper shadow-2xl"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-[var(--zb-grid-rule)] px-5 py-4">
                              <div>
                                <h2
                                  id="manage-columns-title"
                                  className="text-sm font-semibold text-ink"
                                >
                                  Manage columns
                                </h2>
                                <p className="mt-1 text-xs text-[var(--zb-grid-muted)]">
                                  Choose which columns appear in the grid.
                                </p>
                              </div>

                              <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setManageColumnsOpen(false)}
                                className="rounded-md p-2 text-[var(--zb-grid-muted)] outline-none transition-colors hover:bg-[var(--zb-grid-sunk)] hover:text-ink focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)] focus-visible:ring-offset-2"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* Search columns */}
                            <div className="border-b border-[var(--zb-grid-rule)] px-5 py-3">
                              <div className="relative">
                                <Search
                                  size={16}
                                  aria-hidden="true"
                                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--zb-grid-muted)]"
                                />
                                <input
                                  ref={manageColumnsSearchRef}
                                  type="text"
                                  value={columnSearch}
                                  onChange={(event) => setColumnSearch(event.target.value)}
                                  placeholder="Search columns..."
                                  aria-label="Search columns"
                                  className="h-9 w-full rounded-md border border-[var(--zb-grid-rule)] bg-paper pl-9 pr-3 text-xs text-ink outline-none placeholder:text-[var(--zb-grid-muted)] focus-visible:border-[var(--zb-grid-ink)] focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)]/20"
                                />
                              </div>
                            </div>

                            {/* Column lists */}
                            <div className="flex-1 space-y-6 overflow-y-auto p-5">
                              {(() => {
                                const columns =
                                  selectedView === "Patients"
                                    ? CASELOAD_COLUMNS_DOC
                                    : CASELOAD_COLUMNS_WIDE;

                                const searchTerm = columnSearch.trim().toLowerCase();

                                const visibleColumns = columns.filter(
                                  (column) =>
                                    !hiddenColumns.includes(column.key) &&
                                    column.header.toLowerCase().includes(searchTerm),
                                );

                                const hidden = columns.filter(
                                  (column) =>
                                    hiddenColumns.includes(column.key) &&
                                    column.header.toLowerCase().includes(searchTerm),
                                );

                                return (
                                  <>
                                    {/* Visible columns */}
                                    <section>
                                      <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-ink">
                                          Visible columns
                                        </h3>
                                        <span className="text-xs text-[var(--zb-grid-muted)]">
                                          {visibleColumns.length}
                                        </span>
                                      </div>

                                      {visibleColumns.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                          {visibleColumns.map((column) => (
                                            <label
                                              key={column.key}
                                              className="flex cursor-pointer items-center gap-3 text-xs text-ink"
                                            >
                                              <input
                                                type="checkbox"
                                                checked
                                                onChange={() =>
                                                  setHiddenColumns((current) => [
                                                    ...current,
                                                    column.key,
                                                  ])
                                                }
                                                className="accent-[var(--zb-grid-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)] focus-visible:ring-offset-2"
                                              />
                                              <span>{column.header}</span>
                                            </label>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-[var(--zb-grid-muted)]">
                                          {columnSearch.trim()
                                            ? "No matching visible columns."
                                            : "No visible columns."}
                                        </p>
                                      )}
                                    </section>

                                    <div className="border-t border-[var(--zb-grid-rule)]" />

                                    {/* Hidden columns */}
                                    <section>
                                      <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-ink">
                                          Hidden columns
                                        </h3>
                                        <span className="text-xs text-[var(--zb-grid-muted)]">
                                          {hidden.length}
                                        </span>
                                      </div>

                                      {hidden.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                          {hidden.map((column) => (
                                            <label
                                              key={column.key}
                                              className="flex cursor-pointer items-center gap-3 text-xs text-ink"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={false}
                                                onChange={() =>
                                                  setHiddenColumns((current) =>
                                                    current.filter((key) => key !== column.key),
                                                  )
                                                }
                                                className="accent-[var(--zb-grid-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)] focus-visible:ring-offset-2"
                                              />
                                              <span>{column.header}</span>
                                            </label>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-[var(--zb-grid-muted)]">
                                          {columnSearch.trim()
                                            ? "No matching hidden columns."
                                            : "No hidden columns."}
                                        </p>
                                      )}
                                    </section>
                                  </>
                                );
                              })()}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-[var(--zb-grid-rule)] px-5 py-4">
                              <span className="text-xs text-[var(--zb-grid-muted)]">
                                {(() => {
                                  const columns =
                                    selectedView === "Patients"
                                      ? CASELOAD_COLUMNS_DOC
                                      : CASELOAD_COLUMNS_WIDE;

                                  return columns.filter((column) =>
                                    hiddenColumns.includes(column.key),
                                  ).length;
                                })()}{" "}
                                columns hidden
                              </span>

                              <button
                                type="button"
                                disabled={hiddenColumns.length === 0}
                                onClick={() => setHiddenColumns([])}
                                className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--zb-grid-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Restore all
                              </button>
                            </div>
                          </aside>
                        </div>
                      )}
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
                                          (candidate) =>
                                            candidate.key === key && !candidate.disabled,
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
            </div>
          }

          filterPanel={
            criteriaVisible ? (
              <>
                {editorOpen ? (
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
                          disabled={draftSort.length === 0 || !draftModified}
                          onClick={handleApplyCriteria}
                          className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-100"
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
                ) : null}

                {simplePickerOpen ? (
                  <div className="rounded-lg border border-[var(--zb-grid-rule)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Add Simple Filter</span>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleCancelSimpleFilter}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-[var(--zb-grid-muted)] hover:bg-[var(--zb-grid-sunk)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!simpleDraftValid}
                          onClick={addSimpleConditionToAdvanced}
                          className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {committedAdvancedConditions.length === 0
                            ? "Convert to Advanced Filter"
                            : "Add to Advanced Filter"}
                        </button>
                        {simpleFilterPendingClear ? (
                          <button
                            type="button"
                            onClick={clearSimpleFilter}
                            className="cursor-pointer rounded-md border border-red-300 bg-red-50 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-100"
                          >
                            Clear filter
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!simpleDraftValid || !simpleDraftModified}
                            onClick={applySimpleConditions}
                            className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                    </div>
                    <FilterFieldPicker
                      label="Simple filter fields"
                      selectedField={
                        draftSimpleConditions.find(
                          (condition) => condition.id === activeSimpleConditionId,
                        )?.field ?? null
                      }
                      usage={filterUsage}
                      onSelect={selectSimpleField}
                    />

                    {activeSimpleCondition?.field === "status" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-end">
                        <div className="grid min-w-0 gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Field</span>
                          <div className="rounded-md border px-3 py-2 text-sm">Status</div>
                        </div>

                        <div className="grid min-w-0 gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Operator
                          </span>
                          <div className="rounded-md border px-3 py-2 text-sm">
                            {activeSimpleCondition.operator === "is-any-of"
                              ? "is any of (illustrative)"
                              : "is"}
                          </div>
                        </div>

                        <div className="grid min-w-0 gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Value</span>
                          <div ref={statusValuePickerRef} className="relative min-w-0">
                            <button
                              type="button"
                              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm"
                              aria-expanded={statusValuePickerOpen}
                              onClick={() => setStatusValuePickerOpen((open) => !open)}
                            >
                              <span className="truncate">
                                {activeSimpleCondition.value?.length
                                  ? activeSimpleCondition.value.join(", ")
                                  : "Select a value"}
                              </span>
                              <span aria-hidden="true">⌄</span>
                            </button>

                            {statusValuePickerOpen ? (
                              <div className="absolute left-0 top-full z-20 mt-1 w-full rounded-md border bg-paper p-2 text-ink shadow-md">
                                <div className="flex items-center justify-between px-2 py-2">
                                  <span className="text-sm font-medium">Statuses</span>
                                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={
                                        activeSimpleCondition.value?.length ===
                                        STATUS_FILTER_VALUES.length
                                      }
                                      onChange={selectAllStatusValues}
                                    />
                                    Select all
                                  </label>
                                </div>

                                {STATUS_FILTER_VALUES.map((value) => (
                                  <label
                                    key={value}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        activeSimpleCondition.value?.includes(value) ?? false
                                      }
                                      onChange={() => selectStatusValue(value)}
                                    />
                                    {value}
                                  </label>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex justify-end sm:pb-0.5">
                          <button
                            type="button"
                            aria-label={`Delete ${activeSimpleCondition.field} filter`}
                            title="Delete filter"
                            onClick={() => {
                              const committedCondition = committedSimpleConditions.find(
                                (condition) => condition.id === activeSimpleCondition.id,
                              );

                              setSimpleFilterPendingClear(
                                committedCondition && (committedCondition.value?.length ?? 0) > 0
                                  ? committedCondition
                                  : null,
                              );

                              setDraftSimpleConditions([
                                {
                                  id: activeSimpleCondition.id,
                                  field: "status",
                                },
                              ]);
                              setActiveSimpleConditionId(null);
                              setStatusValuePickerOpen(false);
                            }}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border text-[var(--zb-grid-muted)] hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {activeSimpleCondition?.field === "phq9" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-start">
                        <label className="grid min-w-0 gap-1 text-xs">
                          <span className="font-medium text-muted-foreground">Field</span>
                          <input
                            aria-label="Filter field"
                            value="PHQ-9"
                            readOnly
                            className="rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2 text-sm"
                          />
                        </label>

                        <label className="grid min-w-0 gap-1 text-xs">
                          <span className="font-medium text-muted-foreground">Operator</span>
                          <input
                            aria-label="Filter operator"
                            value="Greater than or equal to (≥)"
                            readOnly
                            className="rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2 text-sm"
                          />
                          <span className="text-[var(--zb-grid-muted)]">
                            Illustrative operator — awaiting specification confirmation
                          </span>
                        </label>

                        <label className="grid min-w-0 gap-1 text-xs">
                          <span className="font-medium text-muted-foreground">Value</span>
                          <input
                            type="number"
                            aria-label="PHQ-9 numeric value"
                            value={activeSimpleCondition.numericValue ?? ""}
                            onChange={(event) => {
                              setDraftSimpleConditions((current) =>
                                current.map((condition) =>
                                  condition.id === activeSimpleCondition.id
                                    ? { ...condition, numericValue: event.target.value }
                                    : condition,
                                ),
                              );
                            }}
                            placeholder="Enter a number"
                            className="w-full rounded-md border border-[var(--zb-grid-rule)] bg-paper px-3 py-2 text-sm text-ink"
                          />
                        </label>

                        <div className="flex justify-end sm:pb-0.5">
                          <button
                            type="button"
                            aria-label="Delete PHQ-9 filter"
                            title="Delete filter"
                            onClick={() => {
                              setDraftSimpleConditions((current) =>
                                current.filter(
                                  (condition) => condition.id !== activeSimpleCondition.id,
                                ),
                              );
                              setActiveSimpleConditionId(null);
                            }}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border text-[var(--zb-grid-muted)] hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {activeSimpleCondition?.field === "due" ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-end">
                        <div className="grid min-w-0 gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Field</span>
                          <div className="rounded-md border px-3 py-2 text-sm">Next Contact</div>
                        </div>

                        <div className="grid min-w-0 gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Date selection
                          </span>
                          <button
                            type="button"
                            aria-pressed={activeSimpleCondition.operator === "date-range"}
                            onClick={() => {
                              setDraftSimpleConditions((current) =>
                                current.map((condition) =>
                                  condition.id === activeSimpleCondition.id
                                    ? {
                                        ...condition,
                                        operator: "date-range",
                                        dateRange: condition.dateRange ?? {
                                          start: null,
                                          end: null,
                                        },
                                      }
                                    : condition,
                                ),
                              );
                            }}
                            className="rounded-md border border-[var(--zb-grid-rule)] px-3 py-2 text-left text-sm hover:bg-[var(--zb-grid-sunk)]"
                          >
                            Date range
                          </button>
                        </div>

                        <div className="flex justify-end sm:pb-0.5">
                          <button
                            type="button"
                            aria-label="Delete Next Contact filter"
                            title="Delete filter"
                            onClick={() => {
                              setDraftSimpleConditions((current) =>
                                current.filter(
                                  (condition) => condition.id !== activeSimpleCondition.id,
                                ),
                              );
                              setActiveSimpleConditionId(null);
                            }}
                            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border text-[var(--zb-grid-muted)] hover:bg-muted hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>

                        {activeSimpleCondition.operator === "date-range" ? (
                          <div className="min-w-0 sm:col-start-2 sm:max-w-[420px]">
                            <DateRangeField
                              label="Next Contact date range"
                              startLabel="Start date"
                              endLabel="End date"
                              now={plainDate(2026, 10, 1)}
                              commit="explicit"
                              value={
                                activeSimpleCondition.dateRange ?? {
                                  start: null,
                                  end: null,
                                }
                              }
                              onChange={(dateRange) => {
                                setDraftSimpleConditions((current) =>
                                  current.map((condition) =>
                                    condition.id === activeSimpleCondition.id
                                      ? { ...condition, dateRange }
                                      : condition,
                                  ),
                                );
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {activeSimpleConditionId ? (
                      <p className="mt-2 text-xs text-[var(--zb-grid-muted)]">
                        {
                          FILTER_FIELDS.find(
                            (field) =>
                              field.key ===
                              draftSimpleConditions.find(
                                (condition) => condition.id === activeSimpleConditionId,
                              )?.field,
                          )?.label
                        }{" "}
                        is selected for this Simple condition.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {simpleFilterUndo ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-4 py-3 text-sm"
                  >
                    <span>Simple filter cleared.</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={undoSimpleFilterClear}
                        className="cursor-pointer font-semibold text-[var(--zb-grid-ink)] hover:underline"
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        aria-label="Close notification"
                        onClick={() => setSimpleFilterUndo(null)}
                        className="cursor-pointer text-[var(--zb-grid-muted)] hover:text-[var(--zb-grid-ink)]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : null}

                {advancedEditorOpen ? (
                  <div className="rounded-lg border border-[var(--zb-grid-rule)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Advanced Filter</span>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftAdvancedConditions([...committedAdvancedConditions]);
                            setAdvancedPickerConditionId(null);
                            setPendingAdvancedSimpleTransfer(null);
                            setAdvancedEditorOpen(false);
                          }}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-[var(--zb-grid-muted)] hover:bg-[var(--zb-grid-sunk)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={applyAdvancedConditions}
                          className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    <div
                      ref={advancedConditionStackRef}
                      className="mt-3 grid max-h-64 gap-2 overflow-y-auto"
                    >
                      {draftAdvancedConditions.map((condition, index) => {
                        const field = FILTER_FIELDS.find((item) => item.key === condition.field);

                        return (
                          <div
                            key={condition.id}
                            className="flex flex-wrap items-center gap-3 rounded-md bg-[var(--zb-grid-sunk)] p-3"
                          >
                            <span className="text-xs text-[var(--zb-grid-muted)]">
                              Condition {index + 1}
                            </span>
                            <button
                              type="button"
                              aria-label={`Change field for condition ${index + 1}: ${field?.label ?? condition.field}`}
                              aria-pressed={advancedPickerConditionId === condition.id}
                              onClick={() => openAdvancedFieldPicker(condition.id)}
                              className="min-w-0 flex-1 rounded-md border border-[var(--zb-grid-rule)] bg-paper px-3 py-2 text-left text-sm text-ink hover:opacity-80"
                            >
                              <span className="break-words">{field?.label ?? condition.field}</span>
                              {condition.operator === "is" ? (
                                <span className="ml-2 text-sm text-[var(--zb-grid-ink)]">Is</span>
                              ) : null}
                              {condition.value?.length ? (
                                <span className="ml-2 text-sm font-medium text-[var(--zb-grid-ink)]">
                                  {condition.value.join(", ")}
                                </span>
                              ) : null}
                              <span className="ml-2 text-xs text-[var(--zb-grid-muted)]">
                                Change field
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove condition ${index + 1}`}
                              onClick={() => {
                                setDraftAdvancedConditions((current) =>
                                  current.filter((item) => item.id !== condition.id),
                                );
                                if (advancedPickerConditionId === condition.id) {
                                  setAdvancedPickerConditionId(null);
                                }
                              }}
                              className="rounded-md border border-[var(--zb-grid-rule)] px-3 py-2 text-sm text-[var(--zb-grid-muted)] hover:bg-[var(--zb-grid-hover)]"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const id = `advanced-new-${draftAdvancedConditions.length + 1}`;
                        setDraftAdvancedConditions((current) => [
                          ...current,
                          { id, field: "program" },
                        ]);
                        setAdvancedPickerConditionId(id);
                      }}
                      className="mt-3 cursor-pointer text-sm font-medium text-[var(--zb-grid-muted)] hover:text-[var(--zb-grid-ink)]"
                    >
                      + Add condition
                    </button>

                    {advancedPickerConditionId ? (
                      <div className="mt-4 rounded-md border border-[var(--zb-grid-rule)] p-3">
                        <p className="text-sm font-medium">Select field for condition</p>
                        <FilterFieldPicker
                          label="Advanced filter fields"
                          selectedField={
                            draftAdvancedConditions.find(
                              (condition) => condition.id === advancedPickerConditionId,
                            )?.field ?? null
                          }
                          usage={filterUsage}
                          onSelect={selectAdvancedField}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {riskScreenEditorOpen ? (
                  <div className="rounded-lg border border-[var(--zb-grid-rule)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Simple Filter</span>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftRiskScreenValue(committedRiskScreenValue);
                            setRiskScreenEditorOpen(false);
                          }}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-[var(--zb-grid-muted)] transition-colors hover:bg-[var(--zb-grid-sunk)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!draftRiskScreenValue}
                          onClick={handleApplyRiskScreenFilter}
                          className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className="grid gap-1 text-xs">
                        <span className="font-medium">Field</span>
                        <input
                          aria-label="Filter field"
                          value="Risk Screen"
                          readOnly
                          className="rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2"
                        />
                      </label>

                      <label className="grid gap-1 text-xs">
                        <span className="font-medium">Operator</span>
                        <input
                          aria-label="Filter operator"
                          value="is"
                          readOnly
                          className="rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2"
                        />
                      </label>

                      <label className="grid gap-1 text-xs">
                        <span className="font-medium">Value</span>
                        <select
                          ref={riskScreenValueRef}
                          aria-label="Risk Screen value"
                          value={draftRiskScreenValue ?? ""}
                          onChange={(event) => setDraftRiskScreenValue(event.target.value || null)}
                          className="rounded-md border border-[var(--zb-grid-rule)] bg-paper px-3 py-2 text-ink"
                        >
                          <option value="">Select a value</option>
                          {[
                            "Ideation with plan",
                            "Ideation, no plan",
                            "Passive ideation",
                            "None reported",
                          ].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-[var(--zb-grid-muted)]">
                      Choose a Risk Screen value before applying this filter.
                    </p>
                  </div>
                ) : null}
                {groupEditorOpen ? (
                  <div className="rounded-lg border border-[var(--zb-grid-rule)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold">Group Editor</span>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={handleCancelGroupEditor}
                          className="cursor-pointer rounded-md px-3 py-1.5 text-[var(--zb-grid-muted)] hover:bg-[var(--zb-grid-sunk)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyGroup}
                          className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-1.5 font-semibold"
                        >
                          Apply
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1 text-xs">
                        <span className="font-medium">Field</span>
                        <select
                          aria-label="Group field"
                          value={draftGroup?.key ?? ""}
                          onChange={(event) =>
                            setDraftGroup(
                              event.target.value
                                ? {
                                    key: event.target.value,
                                    direction: draftGroup?.direction ?? "ascending",
                                  }
                                : null,
                            )
                          }
                          className="rounded-md border border-[var(--zb-grid-rule)] bg-paper px-3 py-2 text-ink"
                        >
                          <option value="">No grouping</option>
                          <option value="cssrs">Risk Screen</option>
                          <option value="program">Program</option>
                        </select>
                      </label>

                      <label className="grid gap-1 text-xs">
                        <span className="font-medium">Direction</span>
                        <select
                          aria-label="Group direction"
                          value={draftGroup?.direction ?? "ascending"}
                          disabled={!draftGroup}
                          onChange={(event) =>
                            setDraftGroup((current) =>
                              current
                                ? {
                                    ...current,
                                    direction: event.target.value as DataGridGroup["direction"],
                                  }
                                : current,
                            )
                          }
                          className="rounded-md border border-[var(--zb-grid-rule)] bg-paper px-3 py-2 text-ink disabled:opacity-50"
                        >
                          <option value="ascending">A to Z</option>
                          <option value="descending">Z to A</option>
                        </select>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-[var(--zb-grid-muted)]">
                      Grouping changes the committed criterion. The row hierarchy is not part of
                      this preview.
                    </p>
                  </div>
                ) : null}
              </>
            ) : null
          }
          criteria={
            criteriaVisible ? (
              <div
                className={
                  isFullScreen
                    ? "flex flex-wrap items-center gap-2 text-xs"
                    : "flex w-full flex-nowrap items-center gap-2 overflow-x-auto text-xs [&>*]:shrink-0"
                }
              >
                {group ? (
                  <button
                    type="button"
                    title={`Grouped by ${getGroupFieldLabel(group.key)}, ${getGroupDirectionLabel(group.direction)}. Activate to edit grouping.`}
                    aria-label={`Grouped by ${getGroupFieldLabel(group.key)}, ${getGroupDirectionLabel(group.direction)}. Activate to edit grouping.`}
                    onClick={handleOpenGroupEditor}
                    className="cursor-pointer rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2 hover:opacity-80"
                  >
                    Group by: {getGroupFieldLabel(group.key)}
                  </button>
                ) : null}
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
                <button
                  type="button"
                  onClick={handleOpenEditor}
                  aria-label={`Edit Sort criteria. ${committedSort.length} ${
                    committedSort.length === 1 ? "field" : "fields"
                  } currently applied.`}
                  className={`cursor-pointer rounded-md px-3 py-2 transition-colors ${
                    editorOpen
                      ? "border border-[var(--zb-grid-accent)] bg-[var(--zb-grid-sunk)] font-semibold"
                      : "bg-[var(--zb-grid-sunk)] hover:opacity-80"
                  }`}
                >
                  Sort: {committedSort.length} {committedSort.length === 1 ? "field" : "fields"}
                </button>
                {committedAdvancedConditions.length > 0 ? (
                  <button
                    type="button"
                    onClick={openAdvancedEditor}
                    className="cursor-pointer rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2 hover:opacity-80"
                  >
                    Advanced filter: {committedAdvancedConditions.length} rules
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={openSimpleFieldPicker}
                  className="cursor-pointer rounded-md border border-[var(--zb-grid-rule)] bg-[var(--zb-grid-sunk)] px-3 py-2 font-semibold hover:opacity-80"
                >
                  Add Filter
                </button>
                <span className="rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2">
                  Status: Archived
                </span>
                {committedSimpleConditions
                  .filter(
                    (condition) =>
                      condition.field === "status" && (condition.value?.length ?? 0) > 0,
                  )
                  .map((condition) => (
                    <button
                      key={condition.id}
                      type="button"
                      aria-label={`Edit Status filter: ${condition.value?.join(", ")}`}
                      onClick={() => openSimpleFilterEditor(condition.id)}
                      className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                        simplePickerOpen &&
                        (activeSimpleConditionId === condition.id ||
                          simpleFilterPendingClear?.id === condition.id)
                          ? "border-[var(--zb-grid-ink)] bg-[var(--zb-grid-sunk)] font-semibold"
                          : "border-[var(--zb-grid-ink)] hover:bg-[var(--zb-grid-sunk)]"
                      }`}
                    >
                      Status: {condition.value?.join(", ")}
                    </button>
                  ))}
                {committedRiskScreenValue && (
                  <span className="rounded-md bg-[var(--zb-grid-sunk)] px-3 py-2">
                    Risk Screen: {committedRiskScreenValue}
                  </span>
                )}
              </div>
            ) : null
          }

          maxHeight={isFullScreen ? "calc(100dvh - 16rem)" : "20rem"}
          identify={identify}
          sort={sort}
          group={group}
          onGroupChange={handleCommitGroup}
          onFilterColumn={handleOpenRiskScreenFilter}
          columnPinning={columnPinning}
          onColumnPinningChange={setColumnPinning}
          onHideColumn={(columnKey) => {
            setHiddenColumns((current) =>
              current.includes(columnKey) ? current : [...current, columnKey],
            );
          }}
          sortRanks={sortRules}
          onClearSort={(columnKey) => {
            const nextCommittedSort = committedSort.filter((label) => {
              switch (label) {
                case "Name · A to Z":
                case "Name · Z to A":
                  return columnKey !== "name";
                case "PHQ-9 · High to Low":
                case "PHQ-9 · Low to High":
                  return columnKey !== "phq9";
                case "Risk Screen · Declared order":
                case "Risk Screen · Reverse declared order":
                  return columnKey !== "cssrs";
                case "Priority · High to Low":
                case "Priority · Low to High":
                  return columnKey !== "risk";
                case "Next Contact · Soonest first":
                case "Next Contact · Newest to Oldest":
                  return columnKey !== "due";
                default:
                  return true;
              }
            });

            setCommittedSort(nextCommittedSort);
            setSort(getPrimarySort(nextCommittedSort));
            setViewConfig((current) => ({
              ...current,
              sort: nextCommittedSort,
            }));
          }}
          onSortChange={handleHeaderSortChange}
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

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {groupAnnouncement}
        </div>

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {sortAnnouncement}
        </div>
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
              {pendingExit === "sort"
                ? `Applying ${pendingSortAction?.label ?? "the selected Sort"} will discard your unsaved Sort changes. Do you want to continue?`
                : pendingExit === "view"
                  ? `Switching to ${pendingView ?? "another"} view will discard ${
                      draftModified && viewModified
                        ? "your unsaved Sort changes and view settings"
                        : draftModified
                          ? "your unsaved Sort changes"
                          : "your unsaved view settings"
                    }. Do you want to continue?`
                  : pendingExit === "hide" && simplePickerOpen && simpleDraftModified
                    ? "Hiding Criteria Summary will discard your unsaved Simple Filter changes. Do you want to continue?"
                    : pendingExit === "simple-cancel"
                      ? "You have unsaved Simple Filter changes. Do you want to discard them?"
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

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
export function DataGridPlayground(props: Partial<GridProps>) {
  const { onSelectionChange, onSortChange, onAdmitArrivals, onReachEnd, ...rest } = props;
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [sort, setSort] = React.useState<GridSort | null>({ key: "risk", direction: "descending" });
  const [held, setHeld] = React.useState<readonly CaseloadRow[]>(ARRIVALS);
  const rows = CASELOAD_FULL.slice(0, 12);
  return (
    <Grid
      columns={CASELOAD_COLUMNS_WIDE}
      rows={rows}
      coverage={{ shown: rows.length, total: CASELOAD_FULL.length, noun: "clients" }}
      maxHeight="20rem"
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
  );
}

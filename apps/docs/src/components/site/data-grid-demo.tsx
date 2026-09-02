"use client";

/**
 * The Data Grid on the home page, as the screen it is actually part of.
 *
 * This is the shipped component — `registry/oxygen/data-grid` — inside the
 * application chrome a caseload worklist has in a real product: saved views,
 * filter state with counts, a search field, a density control, and a page
 * header with the actions a supervisor reaches for. The nav, the views and the
 * filters belong to the *host*; the grid owns coverage, held arrivals,
 * selection, pinning, sorting, provenance and paging.
 *
 * That division is the point. The comparison an enterprise buyer makes is
 * against AG Grid inside myAvatar or CareFabric, and what they check is
 * whether the thing survives contact with a screen: does it have a selection
 * model, does the identity column survive a sideways scroll, is the pager
 * honest when the server withheld a total.
 *
 * Two earlier versions of this file were marketing figures — a table on a page
 * with a cycling caption. The distinction that turned out to matter is
 * decorative chrome versus functional chrome. A caption that cycles is
 * decoration. A filter bar that says how many rows each predicate removed is
 * the product.
 *
 * Nothing takes focus on load, and every control is real: the checkboxes drive
 * the bulk bar, the headers sort, the pager pages.
 *
 * Data is synthetic — invented names, invented MRNs, portraits of people who
 * do not exist — per the standing rule that no PHI enters this repository.
 */

import * as React from "react";
import { PatientPortrait } from "@/components/site/patient-portrait";
import {
  DataGrid,
  type DataGridColumn,
  type GridSort,
} from "@/registry/oxygen/data-grid/data-grid";
import {
  CASELOAD,
  CASELOAD_COVERAGE,
  CSSRS_ORDER,
  DISENGAGEMENT,
  phq9Band,
  type CaseloadRow,
} from "@/registry/oxygen/data-grid/data-grid.fixtures";

/**
 * Results waiting to come in.
 *
 * All three land on rows that already carry a score, so admitting them changes
 * numbers and order without changing the row count or the footnote list — the
 * constraint that keeps the panel from jumping while somebody is reading it.
 */
const HELD: readonly CaseloadRow[] = [
  { ...CASELOAD[3]!, phq9: 21, previousPhq9: 18, risk: 0.74 },
  { ...CASELOAD[0]!, phq9: 14, previousPhq9: 11, risk: 0.58 },
  { ...CASELOAD[2]!, phq9: 5, previousPhq9: 7, risk: 0.33 },
];

const SORT: GridSort = { key: "risk", direction: "descending" };

/* ------------------------------------------------------------------ */
/* Cells                                                               */
/* ------------------------------------------------------------------ */

function Client({ row }: { row: CaseloadRow }) {
  return (
    <span className="oxw__id">
      <PatientPortrait src={row.photo} size={30} />
      <span className="oxw__idtext">
        <b>{row.name}</b>
        <span className="numeric">{row.mrn}</span>
      </span>
    </span>
  );
}

/**
 * The move since the last assessment, beside the score.
 *
 * A stable 18 and a climbing 18 are different clients, and a worklist showing
 * only the latest total has left the reader to remember which.
 */
function Move({ row }: { row: CaseloadRow }) {
  if (typeof row.phq9 !== "number" || row.previousPhq9 === undefined) return null;
  const move = row.phq9 - row.previousPhq9;
  if (move === 0) return null;
  const rising = move > 0;
  return (
    <span className={rising ? "oxw__up" : "oxw__down"}>
      <span aria-hidden="true">{rising ? "▲" : "▼"}</span>
      {Math.abs(move)}
      <span className="sr-only">
        {rising ? "up" : "down"} {Math.abs(move)} since the last assessment
      </span>
    </span>
  );
}

/** The C-SSRS result as a chip. The word carries it; the tint is the second cue. */
function Screen({ row }: { row: CaseloadRow }) {
  const value = row.cssrs;
  if (typeof value !== "string") return null;
  const tone = value === "Ideation with plan" ? "sev" : value === "None reported" ? "ok" : "mod";
  return <span className={`oxw__chip oxw__chip--${tone}`}>{value}</span>;
}

const COLUMNS: DataGridColumn<CaseloadRow>[] = [
  {
    key: "name",
    header: "Client",
    kind: "text",
    value: (row) => row.name,
    width: "15rem",
    cell: (row) => <Client row={row} />,
  },
  {
    key: "program",
    header: "Program",
    kind: "status",
    // Sorted by intensity of care rather than alphabetically.
    order: ["ACT", "PHP", "IOP", "Outpatient"],
    value: (row) => row.program,
    width: "8rem",
    cell: (row) => <span className="oxw__chip oxw__chip--plain">{row.program}</span>,
  },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    /*
     * Left-aligned though the sort is numeric.
     *
     * The value carries a band word and a delta beside it, and right-aligning
     * the group lines up the *words* while leaving the numbers ragged — which
     * defeats the one thing a ruled column is for.
     */
    align: "start",
    width: "10rem",
    value: (row) => row.phq9,
    cell: (row) => {
      const band = phq9Band(row.phq9);
      return (
        <span className="oxw__measure">
          <span className={band === "severe" ? "oxw__score oxw__score--hot" : "oxw__score"}>
            {String(row.phq9)}
          </span>
          <span className="oxw__band">{band}</span>
          <Move row={row} />
        </span>
      );
    },
  },
  {
    key: "cssrs",
    header: "Risk screen",
    kind: "status",
    order: CSSRS_ORDER,
    value: (row) => row.cssrs,
    width: "12rem",
    cell: (row) => <Screen row={row} />,
  },
  {
    key: "risk",
    header: "Disengagement",
    kind: "number",
    width: "10rem",
    value: (row) => row.risk,
    derived: DISENGAGEMENT,
    cell: (row) => (
      <span className="oxw__meter">
        <span className="oxw__track" aria-hidden="true">
          <span
            className={row.risk >= 0.7 ? "oxw__fill oxw__fill--hot" : "oxw__fill"}
            style={{ width: `${Math.round(row.risk * 100)}%` }}
          />
        </span>
        <span className="numeric">{row.risk.toFixed(2)}</span>
      </span>
    ),
  },
  {
    key: "due",
    header: "Next contact",
    kind: "instant",
    align: "end",
    width: "9rem",
    value: (row) => row.due,
    cell: (row) => (
      <span className={row.due.startsWith("Today") ? "oxw__due oxw__due--now" : "oxw__due"}>
        {row.due}
      </span>
    ),
  },
  {
    key: "clinician",
    header: "Clinician",
    kind: "text",
    width: "8.5rem",
    value: (row) => row.clinician,
  },
];

/** The saved views a team keeps, with the counts that make them worth keeping. */
const VIEWS = [
  { id: "mine", label: "My caseload", n: 42 },
  { id: "team", label: "Team", n: 312 },
  { id: "risk", label: "High risk", n: 23 },
  { id: "overdue", label: "Overdue contact", n: 27 },
  { id: "awaiting", label: "Awaiting assessment", n: 11 },
] as const;

/** The active predicates. Each is removable, which is what makes them state. */
const FILTERS = [
  { id: "program", label: "Program", value: "IOP, PHP" },
  { id: "phq9", label: "PHQ-9", value: "≥ 10" },
  { id: "screen", label: "Risk screen", value: "last 14 days" },
] as const;

const DENSITIES = ["compact", "regular", "comfortable"] as const;
const DENSITY_LABEL = { compact: "Compact", regular: "Standard", comfortable: "Comfortable" };

export function DataGridDemo() {
  const [rows, setRows] = React.useState<readonly CaseloadRow[]>(CASELOAD);
  const [held, setHeld] = React.useState<readonly CaseloadRow[]>(HELD);
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [sort, setSort] = React.useState<GridSort | null>(SORT);
  const [view, setView] = React.useState("team");
  const [density, setDensity] = React.useState<(typeof DENSITIES)[number]>("regular");
  const [page, setPage] = React.useState(0);

  return (
    <div className="oxw">
      <header className="oxw__head">
        <div className="oxw__headtext">
          <h3 className="oxw__title">Caseload worklist</h3>
          <p className="oxw__sub">Adult outpatient · Team 4 · updated 11:47</p>
        </div>
        <div className="oxw__headactions">
          <button type="button" className="oxw__btn">
            Columns
          </button>
          <button type="button" className="oxw__btn">
            Export
          </button>
          <button type="button" className="oxw__btn oxw__btn--primary">
            New contact note
          </button>
        </div>
      </header>

      {/*
        Saved views: a group of buttons, not a tablist.

        They look like tabs and they are not — `role="tablist"` promises
        `tabpanel` children, and there are none: every view drives the same
        grid below. axe rates that critical, correctly, because a screen reader
        then tells somebody to look for panels that do not exist. A group with
        `aria-current` says the true thing, which is that one of several
        equivalent options is the one in force.

        Still buttons rather than a dropdown: the counts are the point, and a
        count nobody can see until they open a menu is a count nobody uses.
      */}
      <div className="oxw__views" role="group" aria-label="Saved views">
        {VIEWS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-current={view === entry.id ? "true" : undefined}
            className="oxw__view"
            onClick={() => setView(entry.id)}
          >
            {entry.label}
            <span className="oxw__viewn numeric">{entry.n}</span>
          </button>
        ))}
        <button type="button" className="oxw__save">
          + Save this view
        </button>
      </div>

      <div className="oxw__filters">
        <span className="oxw__search">
          <span aria-hidden="true">⌕</span> Search clients, MRN, clinician…
        </span>
        {FILTERS.map((filter) => (
          <span key={filter.id} className="oxw__pill">
            {filter.label} <b>{filter.value}</b>
            <button type="button" aria-label={`Remove the ${filter.label} filter`}>
              ×
            </button>
          </span>
        ))}
        <button type="button" className="oxw__btn oxw__btn--ghost">
          + Filter
        </button>
        <div className="oxw__seg" role="group" aria-label="Row density">
          {DENSITIES.map((entry) => (
            <button
              key={entry}
              type="button"
              aria-pressed={density === entry}
              onClick={() => setDensity(entry)}
            >
              {DENSITY_LABEL[entry]}
            </button>
          ))}
        </div>
      </div>

      <DataGrid
        caption="Clients on this team's caseload with a raised PHQ-9 or a recent risk screen"
        title="Caseload · adult outpatient"
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row.mrn}
        coverage={{ ...CASELOAD_COVERAGE, shown: rows.length }}
        // The identity column stays put while the measures scroll sideways.
        pinnedColumns={1}
        density={density}
        sort={sort}
        onSortChange={setSort}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(picked) => (
          <>
            <button type="button" className="oxw__btn">
              Assign clinician
            </button>
            <button type="button" className="oxw__btn">
              Schedule contact
            </button>
            <button type="button" className="oxw__btn">
              Export {picked.length}
            </button>
          </>
        )}
        arrivals={held}
        arrivalsAt="11:47"
        onAdmitArrivals={(arriving) => {
          const byMrn = new Map(arriving.map((row) => [row.mrn, row]));
          setRows((current) => current.map((row) => ({ ...row, ...(byMrn.get(row.mrn) ?? {}) })));
          setHeld([]);
        }}
        identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
        page={{ index: page, size: 50 }}
        onPageChange={setPage}
        onRowActivate={() => {}}
      />
    </div>
  );
}

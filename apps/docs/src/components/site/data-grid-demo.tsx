"use client";

/**
 * The Data Grid on the home page, as the screen it is actually part of.
 *
 * This is the shipped component — `registry/oxygen/data-grid` — inside the
 * application chrome a caseload worklist has in a real product: saved views,
 * filter state with counts, a search field, a density control, and the
 * header with the actions a supervisor reaches for. The nav, the views and the
 * filters belong to the *host*; the grid owns coverage, held arrivals,
 * selection, pinning, sorting, provenance and the end of the list.
 *
 * That division is the point. The comparison an enterprise buyer makes is
 * against AG Grid inside myAvatar or CareFabric, and what they check is
 * whether the thing survives contact with a screen: does it have a selection
 * model, does the identity column survive a sideways scroll, does the list
 * keep loading as it is scrolled, is it honest when the server withheld a
 * total.
 *
 * Two earlier versions of this file were marketing figures — a table on a page
 * with a cycling caption. The distinction that turned out to matter is
 * decorative chrome versus functional chrome. A caption that cycles is
 * decoration. A filter bar that says how many rows each predicate removed is
 * the product.
 *
 * Nothing takes focus on load, and every control is real: the checkboxes drive
 * the bulk bar, the headers sort, the list loads as it is scrolled.
 *
 * Data is synthetic — invented names, invented MRNs, portraits of people who
 * do not exist — per the standing rule that no PHI enters this repository.
 */

import * as React from "react";
import { CASELOAD_COLUMNS_WIDE } from "@/components/site/caseload-columns";
import { DataGrid, type GridSort } from "@/registry/oxygen/data-grid/data-grid";
import { isGridAbsent } from "@/lib/oxygen-grid";
import { CASELOAD_FULL, type CaseloadRow } from "@/registry/oxygen/data-grid/data-grid.fixtures";

/**
 * Results waiting to come in.
 *
 * All three land on rows that already carry a score, so admitting them changes
 * numbers and order without changing the row count or the footnote list — the
 * constraint that keeps the panel from jumping while somebody is reading it.
 */
const HELD: readonly CaseloadRow[] = CASELOAD_FULL.slice(0, 3).map((row, i) => ({
  ...row,
  phq9: [21, 14, 5][i]!,
  previousPhq9: [18, 11, 7][i]!,
  risk: [0.74, 0.58, 0.33][i]!,
}));

/**
 * What the first request returned, and what each scroll adds.
 *
 * The first is larger than the window on purpose. A list that fires its second
 * request before the reader has touched anything is the standard infinite-
 * scroll defect — the sentinel starts inside the viewport, so the first paint
 * is already a loading state. Fourteen rows overfill 26rem by more than the
 * 240px lead the observer watches, so nothing happens until somebody scrolls.
 */
const FIRST = 15;
const BATCH = 7;

const SORT: GridSort = { key: "risk", direction: "descending" };

/* ------------------------------------------------------------------ */
/* The predicates, which belong to the host                            */
/* ------------------------------------------------------------------ */

/**
 * Every control on this screen runs against the same 28 synthetic rows.
 *
 * The counts on the saved views are computed from the data rather than typed
 * in, which is the only version worth shipping: a chip that says 23 and then
 * shows 19 when you click it teaches a reader to stop trusting the chrome, and
 * a worklist is a surface where that distrust is expensive.
 */
interface Predicate {
  id: string;
  label: string;
  test: (row: CaseloadRow) => boolean;
}

/** Whose caseload "mine" is, on the demo's fiction. */
const ME = "A. Vance";

const VIEWS: readonly Predicate[] = [
  { id: "mine", label: "My caseload", test: (row) => row.clinician === ME },
  { id: "team", label: "Team", test: () => true },
  { id: "risk", label: "High risk", test: (row) => row.risk >= 0.6 },
  { id: "overdue", label: "Overdue contact", test: (row) => row.due.startsWith("Today") },
  {
    id: "awaiting",
    label: "Awaiting assessment",
    test: (row) => isGridAbsent(row.phq9) || isGridAbsent(row.cssrs),
  },
];

/** The removable predicates. Each is real, and removing one widens the list. */
const FILTERS: readonly (Predicate & { value: string })[] = [
  {
    id: "program",
    label: "Program",
    value: "IOP, PHP",
    test: (row) => row.program === "IOP" || row.program === "PHP",
  },
  {
    id: "phq9",
    label: "PHQ-9",
    value: "≥ 10",
    test: (row) => typeof row.phq9 === "number" && row.phq9 >= 10,
  },
  {
    id: "screen",
    label: "Risk screen",
    value: "on file",
    test: (row) => !isGridAbsent(row.cssrs),
  },
];

/**
 * What each view would show *right now*, filters and search included.
 *
 * Not the view's own size. A chip that says 28 and then shows 10 when you click
 * it teaches a reader to stop trusting the chrome, and a worklist is a surface
 * where that distrust is expensive. Every number here is the number you get.
 */
function viewCounts(applied: readonly string[], query: string): ReadonlyMap<string, number> {
  const rest = FILTERS.filter((f) => applied.includes(f.id));
  return new Map(
    VIEWS.map((v) => [
      v.id,
      CASELOAD_FULL.filter(
        (row) => v.test(row) && rest.every((f) => f.test(row)) && matchesQuery(row, query),
      ).length,
    ]),
  );
}

/** Name, MRN or clinician. The three things somebody types into a worklist. */
function matchesQuery(row: CaseloadRow, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return (
    row.name.toLowerCase().includes(term) ||
    row.mrn.includes(term) ||
    row.clinician.toLowerCase().includes(term)
  );
}

export function DataGridDemo() {
  /*
   * Infinite scroll, driven by the grid's sentinel.
   *
   * The caller appends; the grid only says when the reader reached the end. A
   * real host would follow `Bundle.link.next` here — which is the reason this
   * is a scroll and not a pager: the spec forbids constructing paging URLs, so
   * a numbered control has no addressable target to jump to.
   */
  const [view, setView] = React.useState("team");
  /* Two of the three on by default. The third is the sharpest — adding it from
     the + Filter menu is the clearest way to watch every count on the screen
     move together. */
  const [applied, setApplied] = React.useState<readonly string[]>(["program", "screen"]);
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [sort, setSort] = React.useState<GridSort | null>(SORT);

  /*
   * The predicate, assembled from the three controls above the table.
   *
   * One list, filtered by everything at once, so the count under the table and
   * the count on the view chip can never disagree.
   */
  const counts = React.useMemo(() => viewCounts(applied, query), [applied, query]);

  const matched = React.useMemo(() => {
    const current = VIEWS.find((v) => v.id === view);
    const tests = [
      current?.test ?? (() => true),
      ...FILTERS.filter((f) => applied.includes(f.id)).map((f) => f.test),
    ];
    return CASELOAD_FULL.filter((row) => tests.every((t) => t(row)) && matchesQuery(row, query));
  }, [applied, query, view]);

  const [loaded, setLoaded] = React.useState(FIRST);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const rows = React.useMemo(() => matched.slice(0, loaded), [loaded, matched]);

  /* A new predicate is a new list. Keeping the old depth would show forty rows
     of a set the reader has just narrowed to four. */
  React.useEffect(() => {
    setLoaded(FIRST);
  }, [matched]);

  const loadMore = React.useCallback(() => {
    setLoadingMore(true);
    // A held beat, so the waiting line is something a reader can actually see.
    window.setTimeout(() => {
      setLoaded((current) => current + BATCH);
      setLoadingMore(false);
    }, 550);
  }, []);

  /* Escape and a click outside close the add-a-filter menu, which is the whole
     contract a popover has to meet before it is allowed on a page. */
  React.useEffect(() => {
    if (!adding) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      setAdding(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [adding]);

  const unapplied = FILTERS.filter((f) => !applied.includes(f.id));

  return (
    <div className="oxw">
      <header className="oxw__head">
        <div className="oxw__headtext">
          <h3 className="oxw__title">Caseload worklist</h3>
          <p className="oxw__sub">Adult outpatient · Team 4 · updated 11:47</p>
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
            <span className="oxw__viewn numeric">{counts.get(entry.id)}</span>
          </button>
        ))}
      </div>

      <div className="oxw__filters">
        <label className="oxw__search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients, MRN, clinician…"
            aria-label="Search clients, MRN or clinician"
          />
        </label>
        {FILTERS.filter((f) => applied.includes(f.id)).map((filter) => (
          <span key={filter.id} className="oxw__pill">
            {filter.label} <b>{filter.value}</b>
            <button
              type="button"
              aria-label={`Remove the ${filter.label} filter`}
              onClick={() => setApplied((current) => current.filter((id) => id !== filter.id))}
            >
              ×
            </button>
          </span>
        ))}
        {/*
          Add back what was removed.

          Not a `role="menu"`: that promises arrow-key roving between
          `menuitem`s, and this is three buttons in a box. A labelled group
          says what it is and behaves the way it looks.
        */}
        {unapplied.length > 0 ? (
          <span className="oxw__add">
            <button
              type="button"
              className="oxw__btn oxw__btn--ghost"
              aria-expanded={adding}
              onClick={(event) => {
                event.stopPropagation();
                setAdding((open) => !open);
              }}
            >
              + Filter
            </button>
            {adding ? (
              <span
                className="oxw__addmenu"
                role="group"
                aria-label="Add a filter"
                onPointerDown={(event) => event.stopPropagation()}
              >
                {unapplied.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setApplied((current) => [...current, filter.id]);
                      setAdding(false);
                    }}
                  >
                    {filter.label} <b>{filter.value}</b>
                  </button>
                ))}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      {/*
        Held results are stated, with no control inside the grid.

        `onAdmitArrivals` is optional and this deliberately does not pass it, so
        the strip renders as a sentence rather than as a button. Admitting new
        results is a page-level act and its affordance belongs with the other
        page-level ones in the header above — not inline between the coverage
        claim and the column headers, where an outlined button read as a shout.

        The claim is unchanged and is the whole reason the strip exists: three
        results have landed and not one row has moved.
      */}
      <DataGrid
        caption="Clients on this team's caseload with a raised PHQ-9 or a recent risk screen"
        title="Caseload · adult outpatient"
        columns={CASELOAD_COLUMNS_WIDE}
        rows={rows}
        rowKey={(row) => row.mrn}
        /*
          A total the source will not give.

          Not a hedge — it is the common case against a FHIR search, where
          `Bundle.total` is optional, and it is the reason this list scrolls
          rather than pages: with no denominator there is no "page 4 of 7" to
          build. The saved view above still counts, because that count is the
          host's own and it has the query that produced it.
        */
        coverage={{ shown: rows.length, total: matched.length, noun: "clients" }}
        // The identity column stays put while the measures scroll sideways.
        pinnedColumns={1}
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
        arrivals={HELD}
        arrivalsAt="11:47"
        maxHeight="26rem"
        onReachEnd={loadMore}
        loadingMore={loadingMore}
        exhausted={loaded >= matched.length}
        // The host header names the list and the pills name the predicate, so
        // the grid drawing both again is the same claim twice.
        masthead={false}
        // Same argument for the foot. The absence words stay in the cells;
        // only the note apparatus goes, and this screen is not the place a
        // reader meets the model's provenance for the first time.
        footer={false}
        onRowActivate={() => {}}
      />
    </div>
  );
}

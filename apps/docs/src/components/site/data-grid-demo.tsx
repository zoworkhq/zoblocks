"use client";

/**
 * The Data Grid, on the home page, doing the thing it is for.
 *
 * This is the shipped component — `registry/oxygen/data-grid` — driven through
 * four beats, not a picture of one. Everything on screen is produced by the
 * same props a consumer passes, which is the only version of this section
 * worth having: a marketing mock of a grid is the easiest thing in the world
 * to draw and proves nothing about whether it was built.
 *
 * The beats are the four claims, in the order they cost the most:
 *
 *   0  coverage   Six rows on screen, 1,438 in the cohort, and the filter that
 *                 produced the difference written as a sentence you can print.
 *   1  arrivals   Three results land. The count appears on a ruled strip and
 *                 not one row moves — live data that reorders under a pointer
 *                 is how the wrong row gets actioned.
 *   2  admitted   The reader lets them in. Now the order changes, because now
 *                 somebody asked. The coverage line counts up with it.
 *   3  provenance Sorted by the model column, which cites the footnote naming
 *                 the model, its version and the population it was validated
 *                 in. Sorting is a clinical act; no other grid treats it as one.
 *
 * Nothing here takes focus. A section that stole the caret to demonstrate its
 * keyboard model would be scrolling the page out from under a reader — so the
 * cursor and the "Reading" line are left for the visitor to drive, and the
 * caption says so.
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
  ARRIVALS,
  EARLY_WARNING,
  WARD,
  WARD_COVERAGE,
  potassiumQualifier,
  type WardRow,
} from "@/registry/oxygen/data-grid/data-grid.fixtures";

/** Beats, in order. `HOLD` is how long each one stays on screen. */
const BEATS = 4;
const HOLD = 3600;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);
  return reduced;
}

/**
 * The patient cell, composed by the caller.
 *
 * The grid renders whatever `cell` returns and holds no opinion about
 * photographs — the whole "the grid does not own the cells" claim, shown
 * rather than stated.
 */
function Patient({ row }: { row: WardRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <PatientPortrait src={row.photo} size={26} />
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-medium leading-tight">{row.name}</span>
        {/*
          The identifier under the name, not in a column of its own.

          A name is not an identifier — two patients on one ward sharing a
          surname is in every study of wrong-patient documentation — so the MRN
          has to be visible on the row rather than one column away. Under the
          name it is read as part of the same fact, and the column it vacates
          goes to the values somebody is actually scanning.
        */}
        <span className="numeric block text-[0.625rem] leading-tight text-graphite-soft">
          {row.mrn}
        </span>
      </span>
    </span>
  );
}

const COLUMNS: DataGridColumn<WardRow>[] = [
  {
    key: "name",
    header: "Patient",
    kind: "text",
    value: (row) => row.name,
    cell: (row) => <Patient row={row} />,
  },
  {
    key: "potassium",
    header: "Potassium",
    kind: "measure",
    value: (row) => row.potassium,
    /*
     * Left-aligned, though the sort is numeric.
     *
     * `align` is separate from `kind` for exactly this cell: the value carries
     * a qualifier word beside it, and right-aligning the pair lines up the
     * *words* while leaving the numbers ragged — which defeats the one thing a
     * ruled column is for. Aligned from the left with tabular figures, 3.2 and
     * 6.8 stack, and the qualifier trails.
     */
    align: "start",
    width: "9rem",
    footnote: "Serum potassium, mmol/L. Reference range 3.5–5.1.",
    /*
     * The qualifier is a word, and it is the caller's.
     *
     * The grid holds no reference ranges: a component library that shipped one
     * would be asserting a threshold somebody else's laboratory disagrees
     * with. Only the critical value takes colour, and it keeps the word beside
     * it — the site's own rule is that status is never colour alone.
     */
    cell: (row) => {
      const word = potassiumQualifier(row.potassium);
      return (
        <span className="inline-flex items-baseline gap-1.5">
          <span className={word === "critical" ? "font-semibold text-critical" : undefined}>
            {String(row.potassium)}
          </span>
          {word ? <span className="text-[0.6875rem] text-graphite-soft">{word}</span> : null}
        </span>
      );
    },
  },
  {
    key: "risk",
    header: "Deterioration risk",
    kind: "number",
    width: "11rem",
    value: (row) => row.risk,
    derived: EARLY_WARNING,
    cell: (row) => row.risk.toFixed(2),
  },
  { key: "due", header: "Next due", kind: "instant", value: (row) => row.due, width: "6rem" },
];

/** Arrivals merged into the ward, by MRN. The host's job, never the grid's. */
function merge(rows: readonly WardRow[], arriving: readonly WardRow[]): WardRow[] {
  const byMrn = new Map(rows.map((row) => [row.mrn, row]));
  for (const row of arriving) byMrn.set(row.mrn, { ...byMrn.get(row.mrn), ...row });
  return [...byMrn.values()];
}

export function DataGridDemo() {
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = React.useState(0);
  /*
   * The loop stops the moment a visitor touches it.
   *
   * A demo that keeps re-sorting under somebody who has just clicked a header
   * is the exact behaviour the component argues against, performed on its own
   * marketing page. Interaction wins, permanently.
   */
  const [taken, setTaken] = React.useState(false);

  const [rows, setRows] = React.useState<readonly WardRow[]>(WARD);
  const [held, setHeld] = React.useState<readonly WardRow[]>([]);
  const [sort, setSort] = React.useState<GridSort | null>(null);

  React.useEffect(() => {
    /*
     * Reduced motion gets the composed state, not a faster loop.
     *
     * The final beat carries the most information — merged, sorted, with the
     * provenance cited — so it is the honest still frame. SC 2.3.3: the
     * movement conveys nothing this does not.
     */
    if (reduced) {
      setRows(merge(WARD, ARRIVALS));
      setHeld([]);
      setSort({ key: "risk", direction: "descending" });
      return;
    }
    if (taken) return;
    const timer = setInterval(() => setBeat((current) => (current + 1) % BEATS), HOLD);
    return () => clearInterval(timer);
  }, [reduced, taken]);

  React.useEffect(() => {
    if (reduced || taken) return;
    if (beat === 0) {
      setRows(WARD);
      setHeld([]);
      setSort(null);
    } else if (beat === 1) {
      setHeld(ARRIVALS);
    } else if (beat === 2) {
      setRows(merge(WARD, ARRIVALS));
      setHeld([]);
    } else {
      setSort({ key: "risk", direction: "descending" });
    }
  }, [beat, reduced, taken]);

  const take = React.useCallback(() => setTaken(true), []);

  /*
   * Any contact stops the loop, not just a sort.
   *
   * Wiring `take` only to the sort and admit handlers left the worst version
   * of this: a visitor clicks a cell to read the identity line, and three
   * seconds later the grid re-sorts under their pointer — the exact failure
   * the component exists to prevent, performed on the page arguing against it.
   * Captured on the wrapper so it fires for a click, a tab, or an arrow key,
   * including the ones the grid handles itself.
   */
  return (
    <div onPointerDownCapture={take} onKeyDownCapture={take} onFocusCapture={take}>
      <DataGrid
        caption="Patients on 4-West with a potassium outside the reference range"
        title="Worklist · 4-West · potassium out of range"
        note='role="grid" · 24h window'
        /*
        Capped and centred rather than stretched to the section.

        Five columns across 1,150px leaves the name column absorbing four
        hundred pixels of nothing, and a ledger that airy reads as a web table
        rather than as a document. The cap is what makes the rules do their
        job: hairlines only organise a page when the columns are close enough
        to scan in one movement.
      */
        className="mx-auto max-w-4xl rounded-xl shadow-[0_1px_2px_-1px_rgb(2_20_17/0.06),0_18px_40px_-28px_rgb(2_20_17/0.25)]"
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row.mrn}
        coverage={{ ...WARD_COVERAGE, shown: rows.length }}
        arrivals={held}
        arrivalsAt="11:47"
        onAdmitArrivals={(arriving) => {
          take();
          setRows((current) => merge(current, arriving));
          setHeld([]);
        }}
        sort={sort}
        onSortChange={(next) => {
          take();
          setSort(next);
        }}
        identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
        onRowActivate={take}
      />
    </div>
  );
}

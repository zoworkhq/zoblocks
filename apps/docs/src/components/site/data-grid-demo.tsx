"use client";

/**
 * The Data Grid, on the home page, arguing for itself.
 *
 * This is the shipped component — `registry/oxygen/data-grid` — inside an
 * instrument frame, with the four claims the section makes lit one at a time
 * against the part of the grid that carries each. Everything on screen is
 * produced by the same props a consumer passes. A marketing mock of a grid is
 * the easiest thing in the world to draw and proves nothing about whether it
 * was built.
 *
 * **Nothing changes height, ever.** That is the design constraint, not a nice
 * property: the first version cycled the row count 6 → 8, gained and lost the
 * held-arrivals strip, and grew and shrank its footnote list — so the panel
 * jumped about ninety pixels four times a minute, which on a scrolling page is
 * indistinguishable from a rendering fault. It was also, precisely, the failure
 * the component exists to prevent, performed on the page arguing against it.
 *
 * So the loop moves only what a real worklist moves:
 *
 *   · the row set is fixed at eight, and arrivals *update* rows rather than
 *     adding them, so the table's height is constant;
 *   · the grid is sorted by the derived column from the first paint, so the
 *     provenance line is always there rather than appearing on beat three;
 *   · results are always arriving, so the held strip is never absent — the
 *     count ticks 1 → 2 → 3, and admitting them re-orders rows that were
 *     already on screen;
 *   · the footnotes never change, because the two absences are never resolved.
 *
 * Nothing here takes focus, and the loop stops permanently the moment anybody
 * touches it.
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
  CSSRS_ORDER,
  DISENGAGEMENT,
  CASELOAD,
  CASELOAD_COVERAGE,
  phq9Band,
  type CaseloadRow,
} from "@/registry/oxygen/data-grid/data-grid.fixtures";

/**
 * What is lit, and the four words for it.
 *
 * These were four paragraphs in a rail under the grid, which made the panel a
 * piece of marketing copy with a table in it. The component is the argument;
 * the label only has to name which part of it is currently ringed, so it is a
 * label. `part` is what lights up — the frame carries `data-part` and the
 * stylesheet rings the matching region.
 */
const BEATS = [
  { part: "coverage", label: "States its coverage" },
  { part: "held", label: "Holds arriving results" },
  { part: "derived", label: "Cites the model it sorted by" },
  { part: "absence", label: "Says which kind of missing" },
] as const;

const PATCHES = [
  { mrn: "3320145", phq9: 21, previousPhq9: 18, risk: 0.74 },
  { mrn: "5518203", phq9: 14, previousPhq9: 11, risk: 0.58 },
  { mrn: "6690321", phq9: 5, previousPhq9: 7, risk: 0.33 },
] as const;

/** The patches resolved against the ward, so `arrivals` is a row set like any other. */
const HELD: readonly CaseloadRow[] = PATCHES.map((patch) => ({
  ...CASELOAD.find((row) => row.mrn === patch.mrn)!,
  ...patch,
}));

const HOLD = 4200;

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
 * The identity cell, composed by the caller.
 *
 * The grid renders whatever `cell` returns and holds no opinion about
 * photographs — the "the grid does not own the cells" claim, shown rather than
 * stated. The MRN sits under the name rather than in a column of its own: a
 * name is not an identifier, and the row somebody acts on has to carry both.
 */
function Patient({ row }: { row: CaseloadRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <PatientPortrait src={row.photo} size={26} />
      <span className="min-w-0">
        <span className="block truncate font-medium leading-tight">{row.name}</span>
        <span className="numeric block text-[0.625rem] leading-tight opacity-60">{row.mrn}</span>
      </span>
    </span>
  );
}

/**
 * The 24-hour move, beside the value rather than in a column of its own.
 *
 * A stable 5.9 and a climbing 5.9 are different patients, and a worklist that
 * shows only the latest value has left the reader to remember which. It sits
 * inline because as a column it was absent on half the rows — a row with no
 * current score has no delta either — and a column that is mostly the word
 * "Not recorded" is a column arguing against itself. Typographic rather than a
 * sparkline: this direction is a ledger, and a chart in a ruled column is a
 * different component.
 */
function Delta({ row }: { row: CaseloadRow }) {
  if (typeof row.phq9 !== "number" || row.previousPhq9 === undefined) return null;
  const move = row.phq9 - row.previousPhq9;
  if (move === 0) return null;
  const rising = move > 0;
  return (
    <span className={rising ? "oxdg__crit" : "opacity-55"}>
      <span aria-hidden="true">{rising ? "▲" : "▼"}</span>
      {Math.abs(move)}
      <span className="sr-only">
        {rising ? "up" : "down"} {Math.abs(move)} since the last assessment
      </span>
    </span>
  );
}

const COLUMNS: DataGridColumn<CaseloadRow>[] = [
  {
    key: "name",
    header: "Patient",
    kind: "text",
    value: (row) => row.name,
    cell: (row) => <Patient row={row} />,
  },
  // An identifier, not a number: 4W-07 does not sort as seven.
  // A term from a small vocabulary, so it sorts by care intensity rather than
  // alphabetically — ACT above PHP above IOP above Outpatient.
  {
    key: "program",
    header: "Program",
    kind: "status",
    order: ["ACT", "PHP", "IOP", "Outpatient"],
    value: (row) => row.program,
    width: "7rem",
  },
  {
    key: "phq9",
    header: "PHQ-9",
    kind: "measure",
    value: (row) => row.phq9,
    /*
     * Left-aligned, though the sort is numeric.
     *
     * `align` is separate from `kind` for exactly this cell: the value carries
     * a qualifier word beside it, and right-aligning the pair lines up the
     * *words* while leaving the numbers ragged — which defeats the one thing a
     * ruled column is for.
     */
    align: "start",
    width: "11rem",
    /*
     * The qualifier is a word, and it is the caller's. The grid holds no
     * reference ranges: a library that shipped one would be asserting a
     * threshold somebody else's laboratory disagrees with. Only the critical
     * value takes colour, and it keeps the word beside it — the site's rule is
     * that status is never colour alone.
     */
    cell: (row) => {
      const word = phq9Band(row.phq9);
      return (
        <span className="inline-flex items-baseline gap-1.5">
          <span className={word === "severe" ? "oxdg__crit font-semibold" : undefined}>
            {String(row.phq9)}
          </span>
          {word ? <span className="text-[0.6875rem] opacity-65">{word}</span> : null}
          <Delta row={row} />
        </span>
      );
    },
  },
  /*
   * The C-SSRS screen, sorted by the declared order rather than alphabetically.
   *
   * This is the column the domain turns on, and the one that makes `status`
   * worth having as a kind: sorted A–Z, "None reported" lands above "Ideation
   * with plan" because N precedes I, which is how a caseload list buries the
   * row it was built to surface.
   */
  {
    key: "cssrs",
    header: "Risk screen",
    kind: "status",
    order: CSSRS_ORDER,
    value: (row) => row.cssrs,
    width: "11rem",
  },
  {
    key: "risk",
    header: "Disengagement risk",
    kind: "number",
    width: "10.5rem",
    value: (row) => row.risk,
    derived: DISENGAGEMENT,
    cell: (row) => row.risk.toFixed(2),
  },
  { key: "due", header: "Next contact", kind: "instant", value: (row) => row.due, width: "8rem" },
  // Always populated, deliberately. A queue that says what is owed and not who
  // owes it is a list somebody else will action.
];

/** Held results applied to the rows already on screen. Never adds one. */
function apply(rows: readonly CaseloadRow[], arriving: readonly CaseloadRow[]): CaseloadRow[] {
  const byMrn = new Map(arriving.map((row) => [row.mrn, row]));
  return rows.map((row) => ({ ...row, ...(byMrn.get(row.mrn) ?? {}) }));
}

const SORT: GridSort = { key: "risk", direction: "descending" };

export function DataGridDemo() {
  const reduced = usePrefersReducedMotion();

  const [rows, setRows] = React.useState<readonly CaseloadRow[]>(CASELOAD);
  const [waiting, setWaiting] = React.useState(1);
  const [beat, setBeat] = React.useState(0);
  /*
   * Any contact stops the loop, permanently.
   *
   * Wiring this only to the sort and admit handlers left the worst version of
   * it: a visitor clicks a cell to read the identity line, and four seconds
   * later the grid re-sorts under their pointer.
   */
  const [taken, setTaken] = React.useState(false);
  const take = React.useCallback(() => setTaken(true), []);

  const admit = React.useCallback(() => {
    setRows((current) => apply(current, HELD.slice(0, waiting)));
    setWaiting(1);
  }, [waiting]);

  React.useEffect(() => {
    // Reduced motion gets the composed frame, not a faster loop. SC 2.3.3: the
    // movement conveys nothing this does not.
    if (reduced || taken) return;
    const timer = setInterval(() => {
      setBeat((current) => (current + 1) % BEATS.length);
      setWaiting((current) => {
        if (current < HELD.length) return current + 1;
        setRows((rowsNow) => apply(rowsNow, HELD));
        return 1;
      });
    }, HOLD);
    return () => clearInterval(timer);
  }, [reduced, taken]);

  const active = BEATS[beat]!;

  return (
    <figure className="oxdg" data-part={taken ? "none" : active.part}>
      {/*
        The bar carries the beat, so the panel needs no caption strip of its
        own. What was here — `role="grid" · 8 rows · aria-rowcount 1439` — is
        developer jargon on a marketing page, and the beat label is the thing a
        reader actually needs: which part of the grid is currently ringed.
      */}
      <figcaption className="oxdg__bar">
        <span className="oxdg__live" aria-hidden="true" />
        <span className="oxdg__title">Caseload · adult outpatient</span>
        <span className="oxdg__beat">
          <span className="oxdg__beatnum numeric">{String(beat + 1).padStart(2, "0")}</span>
          {taken ? "Yours now — arrow keys move the cursor" : active.label}
        </span>
      </figcaption>

      {/*
        No theme forced.

        This was pinned to the dark token set, on the reasoning that the home
        page's instrument slot is hardware rather than document. That reasoning
        was wrong twice over: the site's own rule in globals.css is that a live
        preview follows the page theme, and pinning it meant the theme toggle
        did nothing to the one component on the page a visitor is looking at.
      */}
      <div className="oxdg__stage" onPointerDownCapture={take}>
        <DataGrid
          caption="Clients on this team's caseload with a raised PHQ-9 or a recent risk screen"
          title="PHQ-9 raised, or risk screened in 14 days"
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.mrn}
          coverage={{ ...CASELOAD_COVERAGE, asOf: undefined, shown: rows.length }}
          arrivals={HELD.slice(0, waiting)}
          arrivalsAt="11:47"
          onAdmitArrivals={() => {
            take();
            admit();
          }}
          sort={SORT}
          onSortChange={take}
          identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
          onRowActivate={take}
        />
      </div>
    </figure>
  );
}

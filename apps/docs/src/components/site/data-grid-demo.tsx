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
  EARLY_WARNING,
  WARD_WITH_EVERY_ABSENCE,
  WARD_COVERAGE,
  potassiumQualifier,
  type WardRow,
} from "@/registry/oxygen/data-grid/data-grid.fixtures";

/**
 * The four claims, each pointing at the thing that carries it.
 *
 * `part` is what lights up in the grid — the frame carries `data-part` and the
 * stylesheet rings the matching region. A claim beside a component is an
 * assertion; a claim wired to the pixel making it is a demonstration.
 */
const CLAIMS = [
  {
    part: "coverage",
    title: "It states its coverage",
    body: "Eight rows, 1,438 in the cohort, and the filter written as a sentence. Most grids render the eight and say nothing about the other 1,430.",
  },
  {
    part: "held",
    title: "Nothing moves under your hand",
    body: "Results are arriving now and the table has not moved. They wait behind the line until you ask, because a grid that reorders under a pointer is how the wrong row gets actioned.",
  },
  {
    part: "derived",
    title: "Sorting is a clinical act",
    body: "This is ranked by model output, so the column cites the model, its version and the population it was validated in. No other grid treats a sort as something to declare.",
  },
  {
    part: "absence",
    title: "Absence is a word, never a dash",
    body: "A specimen with the lab and a record you are not entitled to are different facts with different next actions. The type has no null to collapse them into.",
  },
] as const;

/**
 * The results waiting to come in — three, and every one of them lands on a row
 * that already has a value.
 *
 * The shared `ARRIVALS` fixture resolves two of the ward's absences, which is
 * exactly right for the stories and wrong here: resolving an absence removes
 * its footnote, and two footnotes are forty pixels of panel height. Measured,
 * after the row count had already been pinned — it was the last thing still
 * moving.
 *
 * They are also chosen to make the re-order worth watching. Haddad goes from
 * seventh to fourth when these land, which is the whole point of the beat: the
 * order changed because new data arrived *and somebody asked for it*.
 */
const PATCHES = [
  { mrn: "3320145", potassium: 5.9, previous: 5.4, risk: 0.68 },
  { mrn: "5518203", potassium: 4.6, previous: 4.1, risk: 0.52 },
  { mrn: "6690321", potassium: 2.9, previous: 3.2, risk: 0.41 },
] as const;

/** The patches resolved against the ward, so `arrivals` is a row set like any other. */
const HELD: readonly WardRow[] = PATCHES.map((patch) => ({
  ...WARD_WITH_EVERY_ABSENCE.find((row) => row.mrn === patch.mrn)!,
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
function Patient({ row }: { row: WardRow }) {
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
 * current potassium has no delta either — and a column that is mostly the word
 * "Not recorded" is a column arguing against itself. Typographic rather than a
 * sparkline: this direction is a ledger, and a chart in a ruled column is a
 * different component.
 */
function Delta({ row }: { row: WardRow }) {
  if (typeof row.potassium !== "number" || row.previous === undefined) return null;
  const move = Number((row.potassium - row.previous).toFixed(1));
  if (Math.abs(move) < 0.05) return null;
  const rising = move > 0;
  return (
    <span className={rising ? "oxdg__crit" : "opacity-55"}>
      <span aria-hidden="true">{rising ? "▲" : "▼"}</span>
      {Math.abs(move).toFixed(1)}
      <span className="sr-only">
        {rising ? "up" : "down"} {Math.abs(move).toFixed(1)} on 24 hours
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
  // An identifier, not a number: 4W-07 does not sort as seven.
  { key: "bed", header: "Bed", kind: "identifier", value: (row) => row.bed, width: "5.5rem" },
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
     * ruled column is for.
     */
    align: "start",
    width: "11rem",
    footnote: "Serum potassium, mmol/L. Reference range 3.5–5.1. Δ is the move on 24 hours.",
    /*
     * The qualifier is a word, and it is the caller's. The grid holds no
     * reference ranges: a library that shipped one would be asserting a
     * threshold somebody else's laboratory disagrees with. Only the critical
     * value takes colour, and it keeps the word beside it — the site's rule is
     * that status is never colour alone.
     */
    cell: (row) => {
      const word = potassiumQualifier(row.potassium);
      return (
        <span className="inline-flex items-baseline gap-1.5">
          <span className={word === "critical" ? "oxdg__crit font-semibold" : undefined}>
            {String(row.potassium)}
          </span>
          {word ? <span className="text-[0.6875rem] opacity-65">{word}</span> : null}
          <Delta row={row} />
        </span>
      );
    },
  },
  {
    key: "risk",
    header: "Deterioration risk",
    kind: "number",
    width: "10.5rem",
    value: (row) => row.risk,
    derived: EARLY_WARNING,
    cell: (row) => row.risk.toFixed(2),
  },
  { key: "due", header: "Next due", kind: "instant", value: (row) => row.due, width: "6.5rem" },
  // Always populated, deliberately. A queue that says what is owed and not who
  // owes it is a list somebody else will action.
  { key: "owner", header: "Reviewed by", kind: "text", value: (row) => row.owner, width: "8rem" },
];

/** Held results applied to the rows already on screen. Never adds one. */
function apply(rows: readonly WardRow[], arriving: readonly WardRow[]): WardRow[] {
  const byMrn = new Map(arriving.map((row) => [row.mrn, row]));
  return rows.map((row) => ({ ...row, ...(byMrn.get(row.mrn) ?? {}) }));
}

const SORT: GridSort = { key: "risk", direction: "descending" };

export function DataGridDemo() {
  const reduced = usePrefersReducedMotion();

  const [rows, setRows] = React.useState<readonly WardRow[]>(WARD_WITH_EVERY_ABSENCE);
  const [waiting, setWaiting] = React.useState(1);
  const [claim, setClaim] = React.useState(0);
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
      setClaim((current) => (current + 1) % CLAIMS.length);
      setWaiting((current) => {
        if (current < HELD.length) return current + 1;
        setRows((rowsNow) => apply(rowsNow, HELD));
        return 1;
      });
    }, HOLD);
    return () => clearInterval(timer);
  }, [reduced, taken]);

  const active = CLAIMS[claim]!;

  return (
    <figure className="oxdg" data-part={taken ? "none" : active.part}>
      <figcaption className="oxdg__bar">
        <span className="oxdg__live" aria-hidden="true" />
        <span className="oxdg__title">Worklist · 4-West</span>
        <span className="oxdg__meta numeric">
          role=&quot;grid&quot; · {rows.length} rows · aria-rowcount 1439
        </span>
      </figcaption>

      {/*
        The component's own tokens forced to their dark set.

        The site's rule is that live previews follow the page theme — right for
        a docs page showing a component in context. This is the home page's
        instrument slot, where the panel is hardware rather than document, and
        the previous preview in this position was dark for the same reason.
      */}
      <div className="oxdg__stage" data-ox-theme="dark" onPointerDownCapture={take}>
        <DataGrid
          caption="Patients on 4-West with a potassium outside the reference range"
          title="Potassium out of range · last 24 hours"
          note="live"
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.mrn}
          coverage={{ ...WARD_COVERAGE, shown: rows.length }}
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

      {/*
        The claims, lit one at a time against the part of the grid that carries
        each. A list rather than a carousel: all four are readable at once on a
        wide screen, and the highlight is the only thing that moves.
      */}
      <ol className="oxdg__claims">
        {CLAIMS.map((entry, index) => (
          <li
            key={entry.part}
            className="oxdg__claim"
            data-on={!taken && index === claim ? "true" : "false"}
          >
            <span className="oxdg__claimnum numeric">{String(index + 1).padStart(2, "0")}</span>
            <span className="oxdg__claimtitle">{entry.title}</span>
            <span className="oxdg__claimbody">{entry.body}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

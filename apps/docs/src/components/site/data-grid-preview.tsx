"use client";

/**
 * The Data Grid, before there is a Data Grid.
 *
 * This is a preview of unbuilt work, so the first obligation is not to lie
 * about it: the header says "in development", the caption says the code is not
 * written, and nothing here is presented as installable. What *is* real is the
 * research — a 32-section brief and an architecture review — and the four
 * behaviours the animation walks through are the four load-bearing claims from
 * it, not invented capabilities.
 *
 * The animation is an argument rather than an ornament. Each beat shows one
 * thing that separates a clinical grid from a table:
 *
 *   0  coverage    24 rows on screen, 1,438 in the cohort, and the filter that
 *                  produced the difference written as a sentence you can print.
 *   1  arrivals    Three results land and nothing moves. The queue sits behind
 *                  a divider until the reader asks for it, because live data
 *                  that reorders under a pointer is how the wrong row gets
 *                  actioned.
 *   2  provenance  Sorting by a model-derived column raises a banner naming the
 *                  model, its version, what it was validated on and in whom.
 *                  Sorting is a clinical act; no other grid treats it as one.
 *   3  identity    Row identity re-stated at the point of action. Acting on the
 *                  wrong row is the NQF #2723 retract-and-reorder error, and
 *                  ID-reentry interventions cut it by 30–41%.
 *
 * Data is synthetic — invented names, invented MRNs — per the standing rule
 * that no PHI enters this repository.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/** Beats, in order. `HOLD` is how long each one stays on screen. */
const BEATS = 4;
const HOLD = 3200;

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

interface Row {
  name: string;
  mrn: string;
  /** Latest potassium, or the reason there isn't one. */
  potassium: { value: string; tone: "critical" | "high" | "low" | "normal" } | { absent: string };
  /** The model-derived column — the one whose sort raises the banner. */
  risk: number;
  due: string;
}

/*
 * Six rows, ordered as they arrive rather than by risk, so that beat 2 has
 * something to actually reorder. Deliberately not sorted at rest: a grid that
 * boots pre-sorted by a model column has made the clinical act before anyone
 * asked for it.
 */
const ROWS: readonly Row[] = [
  {
    name: "Mensah, K.",
    mrn: "5518203",
    potassium: { value: "4.1", tone: "normal" },
    risk: 0.44,
    due: "16:00",
  },
  {
    name: "Adeyemi, R.",
    mrn: "4471902",
    potassium: { value: "6.8", tone: "critical" },
    risk: 0.82,
    due: "14:00",
  },
  {
    name: "Haddad, N.",
    mrn: "6690321",
    potassium: { value: "3.2", tone: "low" },
    risk: 0.28,
    due: "18:20",
  },
  {
    name: "Okonkwo, A.",
    mrn: "3320145",
    potassium: { value: "5.4", tone: "high" },
    risk: 0.61,
    due: "15:30",
  },
  {
    name: "Vasquez, I.",
    mrn: "2214870",
    potassium: { absent: "Awaiting" },
    risk: 0.39,
    due: "17:10",
  },
  {
    name: "Lindqvist, S.",
    mrn: "7745012",
    potassium: { absent: "Restricted" },
    risk: 0.19,
    due: "19:00",
  },
];

/*
 * Only critical takes colour, and every qualifier is a word.
 *
 * There is no amber in the site's panel palette — panel-fg, panel-muted, trace
 * and critical-lum are the whole vocabulary, and inventing a sixth token to sit
 * beside them is how a design system quietly acquires a severity nobody
 * defined. It is also the rule this page states two sections further down:
 * status is never colour alone. So "high" and "low" are said rather than hued,
 * and the one value worth a colour gets one.
 */
const TONE: Record<string, string> = {
  critical: "text-critical-lum",
  high: "text-panel-fg",
  low: "text-panel-fg",
  normal: "text-panel-fg",
};

/** The word beside the number. Empty for an ordinary result. */
const QUALIFIER: Record<string, string> = {
  critical: "critical",
  high: "high",
  low: "low",
  normal: "",
};

export function DataGridPreview() {
  const reduced = usePrefersReducedMotion();
  const [beat, setBeat] = React.useState(0);

  React.useEffect(() => {
    /*
     * Reduced motion gets the composed state, not a faster loop.
     *
     * The final beat is the one carrying the most information — sorted, with
     * the provenance banner up and identity re-stated — so it is the honest
     * still frame. SC 2.3.3: the movement conveys nothing this does not.
     */
    if (reduced) {
      setBeat(BEATS - 1);
      return;
    }
    const timer = setInterval(() => setBeat((n) => (n + 1) % BEATS), HOLD);
    return () => clearInterval(timer);
  }, [reduced]);

  const sorted = beat >= 2;
  const arrivals = beat >= 1;
  const identified = beat >= 3;

  // Sorting is presentation-only here, so the fixture stays in arrival order
  // and the demo can show both without holding two copies of the data.
  const rows = sorted ? [...ROWS].sort((a, b) => b.risk - a.risk) : ROWS;

  return (
    <div className="instrument instrument-demo" data-ox-datagrid="" data-beat={beat}>
      <div className="flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace" aria-hidden="true" />
          <span className="eyebrow text-panel-muted">Data Grid · in development</span>
        </div>
        <span className="numeric hidden text-[0.6875rem] text-panel-muted sm:block">
          role=&quot;grid&quot;
        </span>
      </div>

      {/*
        Coverage, first and always.

        Not a footer note: the brief makes `coverage` a required prop precisely
        because a filtered grid is a worse liar than a paginated one — the
        filter was set by a human who has since forgotten it. So the predicate
        is written out, in words, above the data it produced.
      */}
      <div className="border-b border-panel-rule bg-panel-raised/40 px-4 py-3 sm:px-5">
        <p className="text-xs leading-relaxed text-panel-fg">
          <span className="numeric text-trace">24</span> of{" "}
          <span className="numeric text-trace">1,438</span> patients in the cohort
        </p>
        <p className="mt-1 text-xs leading-relaxed text-panel-muted">
          Filtered by: unit is 4-West, and potassium outside the reference range in the last 24
          hours.
        </p>
      </div>

      {/*
        The provenance banner.

        `grid-rows-[0fr]` → `[1fr]` rather than a height transition, so the
        banner animates open without anybody hard-coding its height — the text
        inside is what decides.
      */}
      <div
        className={cn(
          "grid overflow-hidden border-panel-rule transition-all duration-700 ease-[var(--ease-out-expo)] motion-reduce:transition-none",
          sorted ? "grid-rows-[1fr] border-b" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0">
          <div className="border-l-2 border-trace bg-trace/8 px-4 py-3 sm:px-5">
            <p className="eyebrow text-trace">Sorted by a derived column</p>
            <p className="mt-1.5 text-xs leading-relaxed text-panel-fg">
              Deterioration risk is model output, not an observation.{" "}
              <span className="numeric">early-warning v2.4</span> · validated on 12,410 med-surg
              admissions · adults only.
            </p>
          </div>
        </div>
      </div>

      {/* The grid. A real table element, because this is tabular data and the
          brief's whole complaint about the incumbent is that it is not one. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <caption className="sr-only">
            Patients on 4-West with a potassium outside the reference range
          </caption>
          <thead>
            <tr className="border-b border-panel-rule">
              <Th>Patient</Th>
              <Th>MRN</Th>
              <Th>Potassium</Th>
              <Th active={sorted}>Deterioration risk</Th>
              <Th>Next due</Th>
            </tr>
          </thead>
          <tbody>
            {/*
              Arrivals queue behind a divider.

              This is the claim that costs the most to build and is the easiest
              to skip: three results have landed and not one row has moved.
              A grid that reorders under a pointer is how somebody actions the
              row that used to be there.
            */}
            <tr
              className={cn(
                "transition-opacity duration-500 motion-reduce:transition-none",
                arrivals ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!arrivals}
            >
              <td colSpan={5} className="px-4 py-2 sm:px-5">
                <span className="flex items-center gap-2.5">
                  <span className="h-px flex-1 bg-trace/40" aria-hidden="true" />
                  <span className="numeric text-[0.6875rem] text-trace">
                    3 results arrived · nothing moved
                  </span>
                  <span className="h-px flex-1 bg-trace/40" aria-hidden="true" />
                </span>
              </td>
            </tr>

            {rows.map((row) => {
              const focused = identified && row.mrn === "4471902";
              return (
                <tr
                  key={row.mrn}
                  data-ox-row={row.mrn}
                  className={cn(
                    "border-b border-panel-rule/60 transition-colors duration-500 last:border-b-0 motion-reduce:transition-none",
                    focused && "bg-trace/8",
                  )}
                >
                  <td className="px-4 py-2.5 text-sm text-panel-fg sm:px-5">
                    <span
                      className={cn(
                        "rounded-sm px-1 py-0.5 transition-shadow duration-500 motion-reduce:transition-none",
                        focused && "shadow-[inset_0_0_0_1.5px_var(--color-trace)]",
                      )}
                    >
                      {row.name}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "numeric px-4 py-2.5 text-xs transition-colors duration-500 sm:px-5 motion-reduce:transition-none",
                      focused ? "text-trace" : "text-panel-muted",
                    )}
                  >
                    {row.mrn}
                  </td>
                  <td className="numeric px-4 py-2.5 text-sm sm:px-5">
                    {"absent" in row.potassium ? (
                      <span className="text-xs italic text-panel-muted">
                        {row.potassium.absent}
                      </span>
                    ) : (
                      <span className="inline-flex items-baseline gap-1.5">
                        <span className={TONE[row.potassium.tone]}>{row.potassium.value}</span>
                        {QUALIFIER[row.potassium.tone] ? (
                          <span
                            className={cn(
                              "text-[0.6875rem]",
                              row.potassium.tone === "critical"
                                ? "text-critical-lum"
                                : "text-panel-muted",
                            )}
                          >
                            {QUALIFIER[row.potassium.tone]}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 sm:px-5">
                    {/* A bar, not just a number: the sort is by this column, and
                        a reader needs to see the ordering it produced without
                        reading six decimals. */}
                    <span className="flex items-center gap-2">
                      <span
                        className="h-1 w-16 overflow-hidden rounded-full bg-panel-muted/25"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-full bg-trace transition-[width] duration-700 ease-[var(--ease-out-expo)] motion-reduce:transition-none"
                          style={{ width: `${Math.round(row.risk * 100)}%` }}
                        />
                      </span>
                      <span className="numeric text-xs text-panel-muted">
                        {row.risk.toFixed(2)}
                      </span>
                    </span>
                  </td>
                  <td className="numeric px-4 py-2.5 text-xs text-panel-muted sm:px-5">
                    {row.due}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="border-t border-panel-rule px-4 py-3 text-xs leading-relaxed text-panel-muted sm:px-5">
        A preview of work in progress. The research is written and public; the component is not
        built yet, and nothing above is installable today.
      </p>
    </div>
  );
}

function Th({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <th
      scope="col"
      aria-sort={active ? "descending" : undefined}
      className={cn(
        "px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors duration-500 sm:px-5 motion-reduce:transition-none",
        active ? "text-trace" : "text-panel-muted",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {active ? <span aria-hidden="true">↓</span> : null}
      </span>
    </th>
  );
}

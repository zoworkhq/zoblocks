"use client";

/**
 * The difference, demonstrated instead of claimed.
 *
 * This section used to be two code blocks and two bullet lists — "crashes when
 * valueQuantity is absent", "calls an uninterpreted result normal". On a site
 * whose entire thesis is that it SHOWS the states other libraries skip, that
 * was a page describing rather than showing, and it read like every other
 * marketing page.
 *
 * Now both panels render THE SAME FHIR fixtures through two different
 * renderers, side by side. The left one is written the way the hand-rolled
 * snippet in the docs is written; it is not exaggerated for effect, and every
 * failure it produces is a direct consequence of that code. The right one is
 * the shipped component.
 *
 * The naive panel is aria-hidden and its failures are described in adjacent
 * text, so assistive-technology users get the point without being made to
 * parse a deliberately broken table.
 */

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { observations } from "@oxygenui-design/fixtures";
import type { Observation } from "@oxygenui-design/fhir";
import { ObservationPanel } from "@/registry/oxygen/vitals-panel/vitals-panel";
import { InstrumentGlow } from "@/components/site/interactions";

/** The same set both renderers receive. Nothing is withheld from either. */
const DATA: Observation[] = [
  observations.potassiumCritical, // stated critical
  observations.bloodPressure, // value lives in components
  observations.uninterpreted, // no range, no interpretation
  observations.absent, // dataAbsentReason, no value
  observations.preliminary, // not final
];

/**
 * Written exactly the way the hand-rolled example is written: read
 * valueQuantity, concatenate unit, compare against referenceRange[0].
 * Everything it gets wrong follows from those three decisions.
 */
function NaivePanel() {
  return (
    <table className="w-full min-w-[26rem] border-collapse text-[0.8125rem]">
      <tbody>
        {DATA.map((o, i) => {
          const value = `${o.valueQuantity?.value} ${o.valueQuantity?.unit}`;
          const high = o.referenceRange?.[0]?.high?.value;
          const status =
            typeof o.valueQuantity?.value === "number" && typeof high === "number"
              ? o.valueQuantity.value > high
                ? "High"
                : "Normal"
              : "Normal";
          return (
            <tr key={i} className="border-b border-panel-rule/70 last:border-b-0">
              <td className="py-2.5 pr-3 text-panel-fg/80">{o.code?.text}</td>
              <td className="py-2.5 pr-3 text-right font-mono text-panel-fg/90">{value}</td>
              <td className="py-2.5 text-right font-mono text-panel-muted">{status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const FAILURES = [
  "Blood pressure reads “undefined undefined” — its value lives in Observation.component, not on the parent.",
  "A hemolysed specimen renders as Normal instead of stating its dataAbsentReason.",
  "Ferritin has no reference range, so it is labelled Normal. Nothing interpreted it.",
  "A stated critical potassium is flattened to “High”, with no escalation at all.",
  "A preliminary TSH is presented as though it were final.",
];

export function FailureDemo() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="min-w-0" data-reveal="left">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="eyebrow text-critical">Hand-rolled</span>
          <span className="axis-label">same data, both panels</span>
        </div>

        <div className="instrument instrument-demo relative">
          <InstrumentGlow />
          <div className="relative border-b border-panel-rule px-4 py-2.5">
            <span className="eyebrow text-critical">5 results · 5 defects</span>
          </div>
          {/* Deliberately broken output. Hidden from assistive tech — the
              failures are enumerated in text below instead. */}
          <div className="relative overflow-x-auto p-4" aria-hidden="true">
            <NaivePanel />
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {FAILURES.map((failure) => (
            <li key={failure} className="flex items-start gap-2.5 text-sm text-graphite">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-critical" />
              {failure}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="min-w-0"
        data-reveal="right"
        style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="eyebrow text-oxygen-deep">Oxygen</span>
          <span className="axis-label">one component</span>
        </div>

        <div className="instrument instrument-demo relative">
          <InstrumentGlow />
          <div className="relative border-b border-panel-rule px-4 py-2.5">
            <span className="eyebrow text-trace">5 results · 0 defects</span>
          </div>
          <div data-ox-density="standard" className="relative p-4">
            <ObservationPanel observations={DATA} label="Oxygen rendering of the same data" />
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-graphite">
          Blood pressure resolves to its components and escalates to the worst of them. The absent
          result states why. Ferritin reads <span className="text-ink">Not interpreted</span>, never
          Normal. The critical potassium carries a badge, a rule, and a live-region announcement —
          and preliminary stays labelled preliminary.
        </p>
      </div>
    </div>
  );
}

"use client";

/**
 * Live previews for documented examples, keyed by component and example id.
 *
 * An example's code lives in the component's metadata; what it looks like
 * running has to be written here, because the code is a string and this site
 * does not evaluate strings. An example with no entry renders as code alone —
 * the Preview tab is not drawn rather than drawn empty.
 *
 * Add one by mapping `examples[n].id` to a function that renders the same
 * thing the code does. Where the code names a part of the host application
 * (`ResultsTable`, `IntakeFields`), the preview draws a small stand-in for it,
 * because the point of the example is the loader, not the table.
 */

import * as React from "react";
import { PulseLoader } from "@/registry/zoblocks/pulse-loader/pulse-loader";
import { RhythmLoader } from "@/registry/zoblocks/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/zoblocks/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/zoblocks/helix-loader/helix-loader";
import { InfusionLoader } from "@/registry/zoblocks/infusion-loader/infusion-loader";
import * as TabsDemo from "../tabs-demos";
import * as SwitchDemo from "../switch-demos";
import * as AccordionDemo from "../accordion-demos";

/* ------------------------------------------------------------------ */
/* Stand-ins for the host application                                  */
/* ------------------------------------------------------------------ */

const ROWS = [
  ["Potassium", "5.9 mmol/L", "08:12"],
  ["Sodium", "138 mmol/L", "08:12"],
  ["Creatinine", "1.42 mg/dL", "07:40"],
  ["Hemoglobin", "10.8 g/dL", "06:55"],
] as const;

function ResultsTable() {
  return (
    <div className="divide-y divide-rule rounded-lg border border-rule bg-paper text-[13px]">
      {ROWS.map(([test, value, time]) => (
        <div key={test} className="grid grid-cols-3 gap-3 px-3 py-2">
          <span className="text-ink">{test}</span>
          <span className="font-mono text-graphite">{value}</span>
          <span className="text-right font-mono text-graphite-soft">{time}</span>
        </div>
      ))}
    </div>
  );
}

function IntakeFields() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-rule bg-paper p-4 text-[13px]">
      {["Preferred name", "Reason for visit"].map((field) => (
        <label key={field} className="flex flex-col gap-1 text-graphite">
          {field}
          <span className="h-8 rounded-md border border-rule bg-paper-sunk" />
        </label>
      ))}
    </div>
  );
}

function ClinicLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="11" y="3" width="6" height="22" rx="2" fill="currentColor" />
      <rect x="3" y="11" width="22" height="6" rx="2" fill="currentColor" />
    </svg>
  );
}

const ACTION =
  "rounded-lg border border-rule bg-paper px-3 py-1.5 text-[13px] text-ink transition-colors hover:border-rule-strong";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-center gap-8">{children}</div>;
}

/** Overlay mode covers its positioned ancestor; this is that ancestor. */
function Region({ children }: { children: React.ReactNode }) {
  return <div className="relative w-full max-w-md">{children}</div>;
}

/**
 * Remounts its child every `every` ms, so an example about something that
 * happens after a delay keeps happening rather than happening once, out of
 * sight, before the reader scrolled to it.
 */
function Replay({ every, children }: { every: number; children: React.ReactNode }) {
  const [run, setRun] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setRun((n) => n + 1), every);
    return () => clearInterval(id);
  }, [every]);
  return <React.Fragment key={run}>{children}</React.Fragment>;
}

function LiveImport() {
  const [done, setDone] = React.useState(0);
  const total = 240;
  React.useEffect(() => {
    const id = setInterval(() => setDone((n) => (n >= total ? 0 : n + 12)), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <InfusionLoader
      showLabel
      label={`Importing ${done} of ${total} records`}
      progress={(done / total) * 100}
    />
  );
}

/* ------------------------------------------------------------------ */

export const EXAMPLE_PREVIEWS: Readonly<
  Record<string, Readonly<Record<string, () => React.ReactNode>>>
> = {
  "pulse-loader": {
    "region-overlay": () => (
      <Region>
        <ResultsTable />
        <PulseLoader mode="overlay" label="Loading results" delay={200} minDuration={400} />
      </Region>
    ),
    "slow-wait": () => (
      <Replay every={9000}>
        <PulseLoader
          showLabel
          label="Loading your records"
          slowAfter={3000}
          actions={
            <button type="button" className={ACTION}>
              Go back
            </button>
          }
        />
      </Replay>
    ),
    "below-forty": () => (
      <Row>
        <PulseLoader size="sm" label="Loading" />
        <PulseLoader size="md" label="Loading" />
        <PulseLoader size="lg" label="Loading" />
        <PulseLoader size="xl" label="Loading" />
      </Row>
    ),
  },

  "rhythm-loader": {
    "in-a-button": () => (
      <button
        type="button"
        aria-busy="true"
        disabled
        className="inline-flex items-center gap-2 rounded-lg border border-rule bg-paper px-3.5 py-2 text-sm text-graphite"
      >
        <RhythmLoader size="sm" label="Saving the note" />
        Saving
      </button>
    ),
    cadence: () => (
      <Row>
        <RhythmLoader bpm={40} showLabel label="40 bpm" />
        <RhythmLoader bpm={60} showLabel label="60 bpm" />
        <RhythmLoader bpm={100} showLabel label="100 bpm" />
      </Row>
    ),
    "reduced-motion": () => (
      <Row>
        <RhythmLoader motion="full" showLabel label="Full motion" />
        <RhythmLoader motion="reduced" showLabel label="Reduced motion" />
      </Row>
    ),
  },

  "breath-loader": {
    "patient-facing": () => (
      <BreathLoader
        showLabel
        label="Loading your information"
        hint="This usually takes a few seconds."
      />
    ),
    "brand-mark": () => (
      <BreathLoader size="xl" showLabel label="Signing you in">
        <ClinicLogo />
      </BreathLoader>
    ),
    "over-a-form": () => (
      <Region>
        <IntakeFields />
        <BreathLoader mode="overlay" label="Saving your answers" />
      </Region>
    ),
  },

  "helix-loader": {
    "lab-panel": () => (
      <HelixLoader
        showLabel
        label="Running the panel"
        hint="Results usually arrive within a minute."
      />
    ),
    "slow-with-a-way-out": () => (
      <Replay every={9000}>
        <HelixLoader
          showLabel
          label="Running the panel"
          slowAfter={3000}
          slowHint="The analyser is slower than usual. You can leave this page; the result will be filed."
          actions={
            <button type="button" className={ACTION}>
              Leave this page
            </button>
          }
        />
      </Replay>
    ),
    sizes: () => (
      <Row>
        <HelixLoader size="sm" label="Running" />
        <HelixLoader size="md" label="Running" />
        <HelixLoader size="lg" label="Running" />
        <HelixLoader size="xl" label="Running" />
      </Row>
    ),
  },

  tabs: {
    "chart-sections": () => <TabsDemo.ChartSections />,
    "restricted-section": () => <TabsDemo.RestrictedSection />,
    segmented: () => <TabsDemo.Flagship />,
    "segmented-rich": () => <TabsDemo.RichSegmented />,
    underline: () => <TabsDemo.Underline />,
    "pill-filters": () => <TabsDemo.PillFilters />,
    "enclosed-editable": () => <TabsDemo.Editable />,
    rail: () => <TabsDemo.Rail />,
    ghost: () => <TabsDemo.GhostTabs />,
    command: () => <TabsDemo.CommandBar />,
    stepper: () => <TabsDemo.Stepper />,
    card: () => <TabsDemo.CardChoice />,
    stat: () => <TabsDemo.StatTiles />,
    "segmented-filter": () => <TabsDemo.DensityFilter />,
    "nav-links": () => <TabsDemo.NavTabs />,
    "overflow-scroll": () => <TabsDemo.OverflowDemo strategy="scroll" />,
    "overflow-menu": () => <TabsDemo.OverflowDemo strategy="menu" />,
    "overflow-collapse": () => <TabsDemo.OverflowDemo strategy="collapse" />,
    "unsaved-guard": () => <TabsDemo.GuardDemo />,
    "restricted-stale": () => <TabsDemo.RestrictedDemo />,
    severity: () => <TabsDemo.ChartHeader />,
    "every-variant": () => <TabsDemo.EveryVariant />,
    "theme-density": () => <TabsDemo.ThemeDensityMatrix />,
  },

  accordion: {
    "record-while-closed": () => <AccordionDemo.RecordWhileClosed />,
    pinned: () => <AccordionDemo.PinnedCrisisStep />,
    "single-open": () => <AccordionDemo.SingleOpen />,
    advisory: () => <AccordionDemo.AdvisoryGate />,
    reason: () => <AccordionDemo.ReasonGate />,
    consent: () => <AccordionDemo.ConsentGate />,
    "consent-refused": () => <AccordionDemo.ConsentRefused />,
    withheld: () => <AccordionDemo.Withheld />,
    nested: () => <AccordionDemo.Nested />,
    variants: () => <AccordionDemo.Variants />,
    density: () => <AccordionDemo.Density />,
    disclosure: () => <AccordionDemo.SingleDisclosure />,
  },

  switch: {
    "anatomy-matrix": () => <SwitchDemo.AnatomyMatrix />,
    "without-colour": () => <SwitchDemo.WithoutColour />,
    "labeled-track": () => <SwitchDemo.LabeledTrack />,
    "write-and-fail": () => <SwitchDemo.WriteAndFail />,
    "every-phase": () => <SwitchDemo.PhaseStepper />,
    "offline-and-overtaken": () => <SwitchDemo.SharedRecordSwitches />,
    "time-boxed": () => <SwitchDemo.TimeBoxedSwitch />,
    deferred: () => <SwitchDemo.DeferredInForm />,
    absence: () => <SwitchDemo.AbsenceReasons />,
    tones: () => <SwitchDemo.Tones />,
    locked: () => <SwitchDemo.LockedWithReason />,
    confirm: () => <SwitchDemo.Confirmations />,
    impact: () => <SwitchDemo.ImpactAndProvenance />,
    panel: () => <SwitchDemo.IsolationPanel />,
    appearances: () => <SwitchDemo.Appearances />,
    sizes: () => <SwitchDemo.FlowsheetToPhone />,
    "antd-surface": () => <SwitchDemo.AntdSurface />,
    restyled: () => <SwitchDemo.Restyled />,
    rtl: () => <SwitchDemo.RightToLeft />,
  },

  "infusion-loader": {
    "known-progress": () => <InfusionLoader showLabel label="Importing records" progress={62} />,
    "live-import": () => <LiveImport />,
    "before-the-total": () => <InfusionLoader showLabel label="Preparing the export" />,
  },
};

export function examplePreview(component: string, example: string) {
  return EXAMPLE_PREVIEWS[component]?.[example];
}

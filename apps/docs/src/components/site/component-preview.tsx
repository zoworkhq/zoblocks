"use client";

/**
 * ComponentPreview — the live demo on a component detail page.
 *
 * Real components, real states, switchable. A screenshot can show a component
 * working; only this can show it not-working gracefully, which is the actual
 * claim the product makes.
 *
 * Each entry is keyed by the component's registry name, so a new component
 * picks up its preview by existing in the catalog. Components with no entry
 * here fall back to a stated "coming with the next release" rather than an
 * empty frame.
 */

import * as React from "react";
import { PageLoader, PulseLoader } from "@/registry/oxygen/pulse-loader/pulse-loader";
import { RhythmLoader } from "@/registry/oxygen/rhythm-loader/rhythm-loader";
import { BreathLoader } from "@/registry/oxygen/breath-loader/breath-loader";
import { HelixLoader } from "@/registry/oxygen/helix-loader/helix-loader";
import { InfusionLoader } from "@/registry/oxygen/infusion-loader/infusion-loader";
import { InstrumentGlow } from "@/components/site/interactions";
import { SignatureMark } from "@/components/site/signature-mark";
import { cn } from "@/lib/utils";

type Density = "patient" | "standard" | "clinical";

interface Scenario {
  id: string;
  label: string;
  note: string;
  render: () => React.ReactNode;
}

/**
 * A stand-in for the application behind an overlay, so overlay and page modes
 * can be shown doing their actual job rather than floating on nothing.
 */
function AppBehind({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-xl border border-panel-rule bg-panel/40">
      <div className="space-y-3 p-5" aria-hidden="true">
        <div className="h-2.5 w-2/5 rounded-full bg-panel-fg/10" />
        <div className="h-2.5 w-4/5 rounded-full bg-panel-fg/10" />
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="h-16 rounded-lg bg-panel-fg/8" />
          <div className="h-16 rounded-lg bg-panel-fg/8" />
          <div className="h-16 rounded-lg bg-panel-fg/8" />
        </div>
        <div className="h-2.5 w-3/5 rounded-full bg-panel-fg/10" />
      </div>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[200px] items-center justify-center">{children}</div>;
}

/** A determinate loader that actually advances, so progress can be watched. */
function AdvancingInfusion() {
  const [progress, setProgress] = React.useState(8);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((current) => (current >= 100 ? 8 : current + 2));
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return (
    <InfusionLoader
      progress={progress}
      label="Importing records"
      showLabel
      hint="1,284 of 3,000 records"
    />
  );
}

const SCENARIOS: Record<string, Scenario[]> = {
  "pulse-loader": [
    {
      id: "page",
      label: "Page boot",
      note: "The signature wait. The heart draws itself once, then beats at a resting 60bpm while the sweep crosses the rhythm line — one pass per beat, over a faint static track that keeps the shape legible between them.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel />
        </Centered>
      ),
    },
    {
      id: "overlay",
      label: "Region overlay",
      note: "Covering one panel while it re-fetches. The rest of the record stays on screen and stays usable — a failure or a wait is contained to the section it belongs to.",
      render: () => (
        <AppBehind>
          <PulseLoader mode="overlay" size="lg" label="Loading results" />
        </AppBehind>
      ),
    },
    {
      id: "slow",
      label: "Slow wait",
      note: "After eight seconds the loader stops pretending everything is fine. It names the situation and says what is still possible — never “something went wrong”, and never silence.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel slowAfter={1200} />
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Not paused — designed. The heart completes, the track comes to full strength, and the whole mark breathes in opacity. Nothing scales and nothing travels, and it still reads as working.",
      render: () => (
        <Centered>
          <PulseLoader label="Loading your records" showLabel motion="reduced" />
        </Centered>
      ),
    },
    {
      id: "small",
      label: "Below 40px",
      note: "Asked to be small, it renders the rhythm line instead. That is the correct drawing of this mark at this size: the heart's detail collapses into a smudge, and a smudge is not a brand.",
      render: () => (
        <Centered>
          <div className="flex items-center gap-6">
            <PulseLoader size={88} label="Loading" />
            <PulseLoader size={56} label="Loading" />
            <PulseLoader size={24} label="Loading" />
            <PulseLoader size={20} label="Loading" />
          </div>
        </Centered>
      ),
    },
    {
      id: "preset",
      label: "PageLoader preset",
      note: "The full-page settings a boot screen needs, without every application rediscovering them: viewport cover, extra-large art, label shown.",
      render: () => (
        <AppBehind>
          <PageLoader mode="overlay" label="Loading your records" />
        </AppBehind>
      ),
    },
  ],

  "rhythm-loader": [
    {
      id: "default",
      label: "Default",
      note: "One PQRST complex on a baseline, swept by a bright head with a fading tail. Nothing scales — which is what makes it usable in a table row and at twenty pixels.",
      render: () => (
        <Centered>
          <RhythmLoader label="Loading results" showLabel />
        </Centered>
      ),
    },
    {
      id: "inline",
      label: "Inline",
      note: "At 20px beside a control. The stroke stops thinning below 28px, so the trace stays visible rather than fading to a hairline.",
      render: () => (
        <Centered>
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center gap-2.5 rounded-lg border border-panel-rule px-3 py-2 text-sm text-panel-fg">
              <RhythmLoader size="sm" label="Loading results" />
              Loading results…
            </span>
            <span className="inline-flex items-center gap-2.5 text-sm text-panel-muted">
              <RhythmLoader size="sm" label="Checking coverage" />
              Checking coverage
            </span>
          </div>
        </Centered>
      ),
    },
    {
      id: "bradycardia",
      label: "Slower cadence",
      note: "Clamped to 40–100bpm. The clamp is deliberate: this is decoration on a healthcare screen, and a loader beating at 180 would be read as a number by the only people qualified to read it.",
      render: () => (
        <Centered>
          <div className="flex items-center gap-10">
            <RhythmLoader bpm={48} label="48" showLabel />
            <RhythmLoader bpm={60} label="60" showLabel />
            <RhythmLoader bpm={100} label="100" showLabel />
          </div>
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "The full trace at strength, breathing in opacity. No sweep, and nothing frozen part-way along the path.",
      render: () => (
        <Centered>
          <RhythmLoader label="Loading results" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "breath-loader": [
    {
      id: "default",
      label: "Default",
      note: "Three rings on a four-second cycle, a third apart, so the field never empties. Roughly fifteen a minute — the rate of calm breathing rather than a spinner's tempo.",
      render: () => (
        <Centered>
          <BreathLoader label="Loading your information" showLabel />
        </Centered>
      ),
    },
    {
      id: "page",
      label: "Patient-facing page",
      note: "The safe default across specialties: it carries no clinical symbol at all, so nothing here reads as cardiac or oncological to someone about to receive news.",
      render: () => (
        <AppBehind>
          <BreathLoader mode="overlay" label="Loading your information" hint="Almost there." />
        </AppBehind>
      ),
    },
    {
      id: "slow",
      label: "Long wait",
      note: "Slowed to 0.7×. For waits measured in seconds rather than milliseconds, a slower cycle reads as patience instead of impatience.",
      render: () => (
        <Centered>
          <BreathLoader
            speed={0.7}
            label="Preparing your summary"
            showLabel
            hint="This can take a few seconds."
          />
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "One ring rests at partial scale beside the core, and the mark breathes in opacity.",
      render: () => (
        <Centered>
          <BreathLoader label="Loading your information" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "helix-loader": [
    {
      id: "default",
      label: "Default",
      note: "Eighteen dots, two strands, one keyframe. Depth is faked with scale and opacity rather than a 3D transform — so the strands cross convincingly and render identically in every browser.",
      render: () => (
        <Centered>
          <HelixLoader label="Running the panel" showLabel />
        </Centered>
      ),
    },
    {
      id: "overlay",
      label: "Analysis panel",
      note: "Says “analysis is running” the way the cardiac loaders say “a person is waiting”. The right mark for sequencing, pathology, and diagnostics.",
      render: () => (
        <AppBehind>
          <HelixLoader mode="overlay" label="Running the panel" hint="Sequencing 4 of 12 samples" />
        </AppBehind>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Both strands rest in place at full opacity. Nothing travels.",
      render: () => (
        <Centered>
          <HelixLoader label="Running the panel" showLabel motion="reduced" />
        </Centered>
      ),
    },
  ],

  "infusion-loader": [
    {
      id: "determinate",
      label: "Determinate",
      note: "A real measurement: role=progressbar, a spoken value, and a slug that only moves when the number does. This is the only loader that should ever carry a percentage — and only when the application genuinely knows it.",
      render: () => (
        <Centered>
          <AdvancingInfusion />
        </Centered>
      ),
    },
    {
      id: "indeterminate",
      label: "Indeterminate",
      note: "The honest unknown. The slug drifts end to end and claims no value at all, because a fabricated percentage parked at ninety is worse than a loader that never claimed to know.",
      render: () => (
        <Centered>
          <InfusionLoader label="Preparing the export" showLabel />
        </Centered>
      ),
    },
    {
      id: "ends",
      label: "Zero and full",
      note: "Zero still looks like a bar someone is watching rather than a component that failed to render, and full stays inside the capsule.",
      render: () => (
        <Centered>
          <div className="grid w-full max-w-sm gap-6">
            <InfusionLoader progress={0} label="Starting" showLabel />
            <InfusionLoader progress={100} label="Complete" showLabel />
          </div>
        </Centered>
      ),
    },
    {
      id: "reduced",
      label: "Reduced motion",
      note: "Determinate mode is already still and stays exact. Indeterminate mode stops drifting and breathes instead.",
      render: () => (
        <Centered>
          <div className="grid w-full max-w-sm gap-6">
            <InfusionLoader progress={42} label="Importing records" showLabel motion="reduced" />
            <InfusionLoader label="Preparing the export" showLabel motion="reduced" />
          </div>
        </Centered>
      ),
    },
  ],
};

const DENSITIES: Density[] = ["patient", "standard", "clinical"];

export function ComponentPreview({ name }: { name: string }) {
  const scenarios = SCENARIOS[name];
  const [scenarioId, setScenarioId] = React.useState(scenarios?.[0]?.id ?? "");
  const [density, setDensity] = React.useState<Density>("standard");

  /*
   * Signature is shipped, so "coming with the next release" would be false —
   * but it wraps Ant Design, which this site does not carry, so it cannot be
   * mounted here either. It gets the engine's own output and a straight
   * explanation instead of a placeholder that misstates its status.
   */
  if (name === "signature") {
    return (
      <div className="instrument instrument-demo">
        <InstrumentGlow />
        <div className="relative flex items-center gap-2.5 border-b border-panel-rule px-4 py-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Drawn by the real capture engine</span>
        </div>
        <div className="relative flex flex-col items-center gap-5 px-6 py-10 text-panel-fg">
          <SignatureMark size={140} />
          <p className="max-w-lg text-center text-[0.8125rem] leading-relaxed text-panel-muted">
            The geometry above is <code className="font-mono">toInkPaths()</code> from{" "}
            <code className="font-mono">@oxygenui-design/signature-core</code> — the same function
            the live pad calls on every pointer move. The interactive component needs Ant Design,
            which this site does not ship, so run it from the package instead.
          </p>
        </div>
      </div>
    );
  }

  if (!scenarios?.length) {
    return (
      <div className="instrument instrument-demo flex items-center justify-center px-6 py-16">
        <p className="text-sm text-panel-muted">Live preview coming with the next release.</p>
      </div>
    );
  }

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]!;

  return (
    <div className="instrument instrument-demo">
      <InstrumentGlow />

      <div className="relative flex items-center justify-between gap-4 border-b border-panel-rule px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-1.5 rounded-full bg-trace shadow-[0_0_8px_var(--color-trace)]" />
          <span className="eyebrow text-panel-muted">Live · real component</span>
        </div>
        <div className="flex items-center gap-1">
          {DENSITIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setDensity(item)}
              aria-pressed={density === item}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[0.625rem] uppercase tracking-wider transition-colors duration-200",
                density === item
                  ? "bg-panel-fg/10 text-panel-fg"
                  : "text-panel-muted hover:text-panel-fg/80",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/*
        Keyed by scenario so switching tabs remounts the demo. Without it React
        reconciles two different scenarios as the same component and their state
        bleeds across — which for a loader means an advancing progress bar
        carrying its value into a scenario that never set one.
      */}
      <div key={scenario.id} data-ox-density={density} className="relative p-4 sm:p-6">
        {scenario.render()}
      </div>

      <div className="relative border-t border-panel-rule bg-panel/60 px-3 py-3 sm:px-4">
        <div role="tablist" aria-label="Component state" className="flex flex-wrap gap-1.5">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === scenario.id}
              onClick={() => setScenarioId(item.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-wider",
                "transition-all duration-200 ease-[var(--ease-out-expo)]",
                item.id === scenario.id
                  ? "bg-trace/12 text-trace ring-1 ring-trace/35"
                  : "text-panel-muted hover:bg-panel-fg/6 hover:text-panel-fg/85",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p
          key={scenario.id}
          className="animate-rail-settle mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-panel-muted"
        >
          {scenario.note}
        </p>
      </div>
    </div>
  );
}

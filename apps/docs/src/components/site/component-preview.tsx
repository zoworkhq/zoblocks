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
import { Switch, SwitchField, SwitchList } from "@/registry/oxygen/switch/switch";
import { InstrumentGlow } from "@/components/site/interactions";
import { SignatureDemo } from "@/components/site/signature-demo";
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

/**
 * The Switch demo has to be driven, because the whole argument is that a
 * switch is a request rather than a change. A static one would show the
 * component's least interesting claim.
 *
 * `flaky` fails every other write, which is the state nobody builds a demo
 * for and the one this component exists for.
 */
function LiveSwitch({
  flaky = false,
  ...props
}: { flaky?: boolean } & React.ComponentProps<typeof Switch>) {
  const [value, setValue] = React.useState<boolean | "unknown">(
    (props.checked as boolean | "unknown" | undefined) ?? false,
  );
  const attempts = React.useRef(0);

  return (
    <Switch
      {...props}
      checked={value}
      onCommit={async (next) => {
        await new Promise((resolve) => setTimeout(resolve, 700));
        attempts.current += 1;
        if (flaky && attempts.current % 2 === 1) {
          throw new Error("Could not reach the record.");
        }
        setValue(next);
      }}
    />
  );
}

const SCENARIOS: Record<string, Scenario[]> = {
  switch: [
    {
      id: "commit",
      label: "The write, and the write that fails",
      note: "A switch is a request, not a change. The first control saves; the second fails every other attempt — watch it animate back to the value the record actually holds and say so, rather than snapping back while nobody is looking.",
      render: () => (
        <Centered>
          <div className="flex flex-col gap-7">
            <LiveSwitch
              label="Contact precautions"
              stateLabels="in-effect"
              tone="caution"
              size="large"
            />
            <LiveSwitch
              label="Falls risk"
              stateLabels="in-effect"
              size="large"
              flaky
              description="This one fails every other write, on purpose."
            />
          </div>
        </Centered>
      ),
    },
    {
      id: "absence",
      label: "Off, and never asked",
      note: "The clinical difference a two-state control cannot hold. Four switches in the same visual state saying four different things — and the word changes, not the colour.",
      render: () => (
        <Centered>
          <div className="grid gap-6 sm:grid-cols-2">
            <Switch
              label="Advance directive"
              checked="unknown"
              absentReason="not-collected"
              stateLabels="yes-no"
            />
            <Switch
              label="Interpreter needed"
              checked="unknown"
              absentReason="declined"
              stateLabels="yes-no"
            />
            <Switch
              label="Substance use screen"
              checked="unknown"
              absentReason="masked"
              readOnly
              stateLabels="yes-no"
            />
            <Switch
              label="MRSA screen"
              checked="unknown"
              absentReason="pending"
              stateLabels="yes-no"
            />
          </div>
        </Centered>
      ),
    },
    {
      id: "panel",
      label: "A real panel",
      note: "Five rows, five different situations, and not one of them rendered as an ordinary off. The count says two of four — “not asked” is reported apart, because folding it into off is the failure this component exists to prevent.",
      render: () => (
        <SwitchList
          title="Isolation precautions"
          counts={{ on: 2, total: 4, unknown: 1 }}
          provenance={{ by: "S. Mehta", at: "2026-08-16T14:07:00.000Z" }}
        >
          <SwitchField
            label="Contact"
            description="Gown and gloves on entry."
            stateLabels="in-effect"
            tone="caution"
            checked
          />
          <SwitchField
            label="Droplet"
            description="Surgical mask within two metres."
            stateLabels="in-effect"
            tone="caution"
            checked
          />
          <SwitchField
            label="Airborne"
            description="Negative-pressure room and N95."
            stateLabels="in-effect"
            checked={false}
            readOnly
            lockedReason="No negative-pressure room available on this unit."
          />
          <SwitchField
            label="Enteric"
            description="Dedicated commode; soap and water, not alcohol gel."
            stateLabels="in-effect"
            checked="unknown"
            absentReason="not-collected"
          />
        </SwitchList>
      ),
    },
    {
      id: "appearances",
      label: "One value, five renderings",
      note: "The same state model behind every one. Segmented is the only appearance that changes the ARIA role — two labelled cells that both look pressable are a radiogroup, and calling them a switch would be a lie to a screen reader.",
      render: () => (
        <Centered>
          <div className="flex w-full max-w-md flex-col gap-6">
            <Switch label="Interpreter required" stateLabels="yes-no" checked />
            <Switch
              label="Interpreter required"
              appearance="labeled"
              stateLabels="active-inactive"
              checked
            />
            <Switch
              label="Latex allergy"
              appearance="segmented"
              stateLabels="yes-no"
              checked="unknown"
              absentReason="not-collected"
            />
            <div className="flex flex-wrap gap-2">
              <Switch label="My patients" appearance="chip" checked />
              <Switch label="Unacknowledged" appearance="chip" checked={false} />
              <Switch label="Discharge today" appearance="chip" checked />
            </div>
            <Switch
              label="Text me when my results are ready"
              description="To the mobile ending 4471. Standard rates apply."
              appearance="row"
              audience="patient"
              checked
            />
          </div>
        </Centered>
      ),
    },
    {
      id: "tone",
      label: "When on is the dangerous state",
      note: "Half the switches in a clinical system are suppressions. All four here are on; only the middle two are situations anyone needs to know about — and the colour, the glyph and the word all say so.",
      render: () => (
        <Centered>
          <div className="flex flex-col gap-6">
            <Switch label="Allergy interaction checking" stateLabels="enabled-disabled" checked />
            <Switch
              label="Suppress duplicate-therapy alerts"
              tone="caution"
              stateLabels="in-effect"
              checked
            />
            <Switch
              label="Bypass allergy check for this order"
              tone="critical"
              stateLabels="allowed-blocked"
              checked
            />
            <Switch label="Show archived encounters" tone="neutral" checked />
          </div>
        </Centered>
      ),
    },
  ],
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

  // Signature is the one component the site loads Ant Design for. Showing a
  // static mark instead would undercut its entire argument: the only way to
  // demonstrate that a decline is recordable is to let someone record one.
  if (name === "signature") return <SignatureDemo />;

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

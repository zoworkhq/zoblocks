import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "rhythm-loader",
  title: "Rhythm Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "One rhythm strip, swept like a monitor. The quietest way for an interface to say it is still there.",

  tagline: "One rhythm strip, swept like a monitor. The quiet wait.",
  description:
    "Loader drawn as a single PQRST complex on a baseline, swept once per beat by a bright head with a fading tail. Nothing scales and nothing grows, and it stays legible down to 20px.",
  rationale:
    "The clinical default, and the loader to reach for when a beating heart would be the wrong thing to put in front of someone. It carries no symbol, only the artifact a clinician already reads all day: P wave, QRS complex, T wave, in those proportions rather than the decorative zig-zag that generic ECG graphics use. Because it never scales, it is also the only cardiac loader that survives at twenty pixels — so it is what Pulse Loader renders when it is asked to be small, and what belongs beside a button label or in a table row.",

  categories: ["Loaders", "Feedback"],
  fhir: [],

  states: ["Indeterminate", "Delayed (not yet shown)", "Slow wait", "Reduced motion", "Inline"],

  a11y: [
    {
      label: "Announced once, in words",
      detail:
        "role=status with aria-live=polite. The label is always in the DOM, visually hidden when showLabel is false, so the wait is announced even when it is not written.",
    },
    {
      label: "Legible at 20px",
      detail:
        "Stroke width stops scaling below 28px, so the trace stays visible at inline sizes rather than thinning to nothing.",
    },
    {
      label: "Reduced motion is a designed state",
      detail:
        "The full trace is shown at strength and breathes in opacity. No sweep, no travel, nothing frozen mid-path.",
    },
  ],

  guidance: {
    use: [
      "Clinical density: worklists, results tables, monitoring dashboards.",
      "Inline, beside a control or in a row, where a full loader would be too large.",
      "Anywhere Pulse Loader's heart would be the wrong tone — cardiac, resuscitation, bereavement.",
    ],
    avoid: [
      "As a live rhythm display. It is a fixed loop and shows no patient data whatsoever.",
      "On patient-facing screens where an ECG could be read as a result about them. Breath Loader is the calmer choice.",
      "Layouts you already know the shape of — a matching skeleton says more.",
    ],
  },

  limitations: [
    "Not a progress source. Use Infusion Loader when the remaining time is genuinely known.",
    "Requires styles/zoblocks-loader.css, installed with loader-core.",
    "A single fixed complex. It does not vary, and it is not clinical data.",
  ],
  related: ["pulse-loader", "breath-loader", "infusion-loader", "helix-loader", "recorder"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core"],

  controls: [
    {
      prop: "size",
      control: "segmented",
      label: "size",
      options: ["sm", "md", "lg", "xl"],
      defaultValue: "lg",
    },
    { prop: "bpm", control: "slider", label: "bpm", min: 40, max: 100, step: 5, defaultValue: 60 },
    {
      prop: "speed",
      control: "slider",
      label: "speed",
      min: 0.5,
      max: 2,
      step: 0.25,
      defaultValue: 1,
    },
    {
      prop: "motion",
      control: "segmented",
      label: "motion",
      options: ["auto", "reduced", "full"],
      defaultValue: "auto",
    },
    { prop: "showLabel", control: "switch", label: "showLabel", defaultValue: true },
    { prop: "label", control: "text", label: "label", defaultValue: "Loading results" },
  ],

  examples: [
    {
      id: "in-a-button",
      title: "Inside a button",
      description:
        "At sm the strip fits a line of text. The button keeps its own label and sets aria-busy; the loader's label stays visually hidden so the wait is announced once.",
      code: `import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function Example() {
  return (
    <button type="button" aria-busy="true" disabled>
      <RhythmLoader size="sm" label="Saving the note" />
      Saving
    </button>
  );
}`,
    },
    {
      id: "cadence",
      title: "Cadence is a prop, and clamped",
      description:
        "bpm runs from 40 to 100 and anything outside is clamped, so the fastest sweep stays well under the three-flash limit. The rate is decorative: it is never a patient's.",
      code: `import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function Example() {
  return (
    <div style={{ display: "flex", gap: 40 }}>
      <RhythmLoader bpm={40} showLabel label="40 bpm" />
      <RhythmLoader bpm={60} showLabel label="60 bpm" />
      <RhythmLoader bpm={100} showLabel label="100 bpm" />
    </div>
  );
}`,
    },
    {
      id: "reduced-motion",
      title: "Reduced motion is a designed state",
      description:
        "The default follows the operating system. Reduced draws the full strip and breathes it in opacity; nothing travels. Full opts out of the preference and should be rare.",
      code: `import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

export default function Example() {
  return (
    <div style={{ display: "flex", gap: 40 }}>
      <RhythmLoader motion="full" showLabel label="Full motion" />
      <RhythmLoader motion="reduced" showLabel label="Reduced motion" />
    </div>
  );
}`,
    },
  ],

  usage: `import { RhythmLoader } from "@/components/zoblocks/rhythm-loader";

// Inline, beside a control
<RhythmLoader size="sm" label="Loading results" />

// Clinical dashboard panel, slower cadence
<RhythmLoader mode="overlay" bpm={52} label="Loading the worklist" delay={200} />`,
});

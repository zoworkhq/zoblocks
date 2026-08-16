import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "rhythm-loader",
  title: "Rhythm Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "One rhythm strip, swept like a monitor. The quietest way for an interface to say it is still there.",
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
    "Requires styles/oxygen-loader.css, installed with loader-core.",
    "A single fixed complex. It does not vary, and it is not clinical data.",
  ],
  related: ["pulse-loader", "breath-loader", "infusion-loader"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core"],

  usage: `import { RhythmLoader } from "@/components/oxygen/rhythm-loader";

// Inline, beside a control
<RhythmLoader size="sm" label="Loading results" />

// Clinical dashboard panel, slower cadence
<RhythmLoader mode="overlay" bpm={52} label="Loading the worklist" delay={200} />`,
});

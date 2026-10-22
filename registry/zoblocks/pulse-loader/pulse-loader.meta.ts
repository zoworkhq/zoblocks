import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "pulse-loader",
  title: "Pulse Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "An open heart with a rhythm line running through it, beating at a resting sixty. The library's signature wait.",

  tagline: "An open heart at a resting sixty. The signature wait.",
  description:
    "Page and region loader: an open heart that draws itself once, then beats at a resting 60bpm while a monitor sweep crosses the rhythm line. Renders as Rhythm Loader below 40px, where the heart's detail would collapse.",
  rationale:
    "A page loader is the first thing a clinician or a patient sees, it plays while the system is at its most fragile, and it is judged in the first three hundred milliseconds. This one is built from measured cardiac timing rather than from a spinner's tempo: sixty beats a minute is a resting sinus rhythm, the beat scales by seven percent so it is noticed peripherally and never tracked, and the heart draws in once rather than once per loop so the animation has no seam. Every colour is a semantic token and the whole thing is SVG and CSS, which means it renders before any JavaScript bundle has loaded — the one requirement a page loader has that a component loader does not.",

  categories: ["Loaders", "Feedback"],
  fhir: [],

  states: [
    "Indeterminate",
    "Delayed (not yet shown)",
    "Slow wait",
    "Reduced motion",
    "Below 40px (renders as Rhythm Loader)",
  ],

  a11y: [
    {
      label: "Announced once, in words",
      detail:
        "role=status with aria-live=polite. The label is always in the DOM — visually hidden when showLabel is false — because an empty live region announces nothing at all.",
    },
    {
      label: "Art is hidden from assistive technology",
      detail:
        "The SVG is aria-hidden. A decorative mark that announces itself becomes a second, meaningless label on every wait in the product.",
    },
    {
      label: "Reduced motion is a designed state",
      detail:
        "Under prefers-reduced-motion the heart completes, the track comes to full strength, and the mark breathes in opacity. Nothing scales and nothing travels. Pausing mid-sweep would look like a component that failed.",
    },
    {
      label: "Below the flash threshold",
      detail:
        "Clamped to 40–100bpm, so the fastest cadence is 1.67Hz against WCAG 2.3.1's three-flash limit, and the beat changes scale by seven percent rather than luminance.",
    },
  ],

  guidance: {
    use: [
      "Application boot and full-page route changes, where the brand moment is worth the space.",
      "Waits of unknown length over about 300ms. Pair with delay so a fast response never flashes it.",
      "At 56px or larger. Below 40px it deliberately renders the rhythm line instead.",
    ],
    avoid: [
      "Resuscitation, cardiac arrest, oncology, and bereavement workflows — a beating heart reads as glib there. Use Rhythm Loader or Breath Loader.",
      "Layouts you already know the shape of. A skeleton that matches the content is better than a spinner over it.",
      "As a progress indicator. It never claims to know how long is left; use Infusion Loader when the answer is known.",
    ],
  },

  limitations: [
    "Not a progress source. The application supplies progress; the loader only renders it.",
    "Requires styles/zoblocks-loader.css, installed with loader-core. Without it the loader renders as a static mark rather than an animated one.",
    "One cardiac rhythm. It does not depict arrhythmia, and it must never be read as a patient's actual rate.",
  ],
  related: ["rhythm-loader", "breath-loader", "infusion-loader", "helix-loader", "recorder"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core", "rhythm-loader"],

  controls: [
    {
      prop: "size",
      control: "segmented",
      label: "size",
      options: ["sm", "md", "lg", "xl"],
      defaultValue: "xl",
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
    { prop: "label", control: "text", label: "label", defaultValue: "Loading your records" },
  ],

  examples: [
    {
      id: "region-overlay",
      title: "Over a region, never flashing",
      description:
        "Overlay covers its positioned ancestor, not the page. With delay a response that lands inside 200ms never shows the loader at all, and minDuration keeps one that did appear from blinking out.",
      code: `import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function Example() {
  return (
    <section style={{ position: "relative", minHeight: 220 }}>
      <ResultsTable />
      <PulseLoader mode="overlay" label="Loading results" delay={200} minDuration={400} />
    </section>
  );
}`,
    },
    {
      id: "slow-wait",
      title: "A wait that admits it stalled",
      description:
        "After slowAfter the hint changes to a plain statement that the wait is long, and actions gives the reader a way out. onSlow fires once, so the stall can be reported as well as shown.",
      code: `import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function Example() {
  return (
    <PulseLoader
      showLabel
      label="Loading your records"
      slowAfter={3000}
      onSlow={() => reportSlowWait("records")}
      actions={<button type="button">Go back</button>}
    />
  );
}`,
    },
    {
      id: "below-forty",
      title: "Below 40px it becomes the rhythm line",
      description:
        "The heart's detail collapses under 40px, so the loader renders Rhythm Loader instead rather than a smudge. Same props, same announcement.",
      code: `import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function Example() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      <PulseLoader size="sm" label="Loading" />
      <PulseLoader size="md" label="Loading" />
      <PulseLoader size="lg" label="Loading" />
      <PulseLoader size="xl" label="Loading" />
    </div>
  );
}`,
    },
  ],

  usage: `import { PageLoader, PulseLoader } from "@/components/zoblocks/pulse-loader";

// Full-page wait, e.g. Next.js app/loading.tsx
<PageLoader label="Loading your records" />

// Region overlay that never flashes and admits a stall
<PulseLoader
  mode="overlay"
  label="Loading results"
  delay={200}
  slowAfter={8000}
  onSlow={reportSlowWait}
/>`,
});

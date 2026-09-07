import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "breath-loader",
  title: "Breath Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "Three rings expanding and fading from a soft core, paced at a resting breath rather than a spinner's tempo.",

  tagline: "Three rings at a resting breath, not a spinner's tempo.",
  description:
    "Symbol-free loader cycling at roughly fifteen a minute, the rate of calm breathing. Carries no clinical imagery, so it suits any specialty, and its core accepts a customer's logo mark.",
  rationale:
    "A spinner's tempo tells a reader the system is working hard; breathing tells them they can wait. On a patient-facing screen — a results page, a portal sign-in, a check-in kiosk — the second is almost always what the product means to say. It is also the one loader in the set with no clinical symbol at all, which is what makes it safe across specialties: nothing here reads as cardiac, oncological, or obstetric to someone who is about to receive news. That neutrality is a feature, not an absence of one.",

  categories: ["Loaders", "Feedback"],
  fhir: [],

  states: [
    "Indeterminate",
    "Delayed (not yet shown)",
    "Slow wait",
    "Reduced motion",
    "With a brand mark in the core",
  ],

  a11y: [
    {
      label: "Announced once, in words",
      detail:
        "role=status with aria-live=polite, and the label always present in the DOM so the wait is announced whether or not it is written on screen.",
    },
    {
      label: "Calm by construction",
      detail:
        "One cycle every four seconds is 0.25Hz, an order of magnitude below WCAG 2.3.1's three-flash threshold, and the rings fade before they reach full size.",
    },
    {
      label: "Reduced motion is a designed state",
      detail:
        "A single static ring and the core remain, breathing in opacity. No expansion, no travel.",
    },
  ],

  guidance: {
    use: [
      "Patient-facing surfaces: portals, results pages, check-in, onboarding.",
      "Long or open-ended waits, where a faster cadence would read as impatience.",
      "White-label products — it is the least branded of the five, and the core is a slot.",
    ],
    avoid: [
      "Dense clinical tables, where its size and slow cadence waste space. Use Rhythm Loader.",
      "As a progress indicator. Use Infusion Loader when the remaining time is known.",
      "Layouts you already know the shape of — a matching skeleton says more.",
    ],
  },

  limitations: [
    "Not a progress source. The application supplies progress; this loader cannot show it.",
    "Requires styles/zoblocks-loader.css, installed with loader-core.",
    "Needs about 40px to read as three distinct rings rather than one soft pulse.",
  ],
  related: ["pulse-loader", "rhythm-loader", "infusion-loader", "helix-loader"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core"],

  usage: `import { BreathLoader } from "@/components/zoblocks/breath-loader";

// Patient-facing page wait
<BreathLoader mode="page" label="Loading your information" />

// Slower still, for a long wait
<BreathLoader speed={0.7} label="Preparing your summary" hint="This can take a few seconds." />`,
});

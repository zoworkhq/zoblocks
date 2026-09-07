import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "helix-loader",
  title: "Helix Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "Two strands of dots turning on a slow sine. For the parts of a product that are laboratory rather than bedside.",

  tagline: "Two strands on a slow sine. For the laboratory.",
  description:
    "Loader for genomics, pathology, and diagnostics surfaces. Depth comes from scale and opacity rather than a 3D transform, so the strands cross convincingly while staying cheap to composite.",
  rationale:
    "The most specific loader in the set, and deliberately so. Sequencing, pathology, and diagnostics screens are waiting on analysis rather than on a person, and a cardiac mark says the wrong thing there — as does a generic ring, which says nothing at all. Depth is faked with scale and opacity rather than a 3D transform because a rotateY helix renders differently across browsers and costs a layer per dot; eighteen phase-offset dots on one keyframe read as a rotation and cost nothing.",

  categories: ["Loaders", "Feedback"],
  fhir: [],

  states: ["Indeterminate", "Delayed (not yet shown)", "Slow wait", "Reduced motion"],

  a11y: [
    {
      label: "Announced once, in words",
      detail:
        "role=status with aria-live=polite, and the label always present in the DOM so the wait is announced whether or not it is written on screen.",
    },
    {
      label: "Motion stays under the threshold",
      detail:
        "One turn every 2.6 seconds, with travel of twelve units and no luminance flash — well inside WCAG 2.3.1.",
    },
    {
      label: "Reduced motion is a designed state",
      detail: "Both strands rest in place at full opacity and the mark breathes. Nothing travels.",
    },
  ],

  guidance: {
    use: [
      "Laboratory, genomics, pathology, and research surfaces where analysis is the thing being waited on.",
      "Wide containers — it is a landscape mark and wants at least 48px of width.",
      "Waits long enough to be worth a domain mark. Under about 400ms the strands never complete a rotation, and an animation cut off mid-cycle reads as a stall rather than as progress.",
    ],
    avoid: [
      "General application waits. It is domain-specific by design; Breath Loader is the neutral choice.",
      "Small or square containers — the strands collapse into a row of dots.",
      "Older tablets under load: eighteen animated nodes is the heaviest loader in the set.",
    ],
  },

  limitations: [
    "Not a progress source. Use Infusion Loader when the remaining time is known.",
    "Requires styles/zoblocks-loader.css, installed with loader-core.",
    "Eighteen animated nodes — the heaviest of the five, though still compositor-only.",
    "Depicts no real sequence data. It is a mark, not a visualisation.",
  ],
  related: ["breath-loader", "rhythm-loader", "infusion-loader", "pulse-loader"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core"],

  usage: `import { HelixLoader } from "@/components/zoblocks/helix-loader";

<HelixLoader mode="overlay" label="Running the panel" delay={200} />`,
});

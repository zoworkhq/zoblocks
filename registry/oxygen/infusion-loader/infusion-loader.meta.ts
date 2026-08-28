import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "infusion-loader",
  title: "Infusion Loader",
  tier: "free",
  status: "beta",
  since: "0.2.0",
  layer: "primitive",

  summary:
    "A capsule with a soft slug — the only loader in the set that can tell the truth about how much is left.",

  tagline: "The only loader here that can honestly show progress.",
  description:
    "Determinate and indeterminate progress in one component. Pass progress for a real 0–100 measurement with role=progressbar; omit it and the slug drifts as an honest unknown.",
  rationale:
    "Named for the one device in a hospital that displays a percentage and means it. The two modes are deliberately different animations rather than one animation with a value bolted on: a determinate bar that also drifts tells a reader a measurement is moving when it is not, and on an import, a batch upload, or a records transfer, movement is exactly the fact being watched. It is the only loader here that should ever carry a number, and only when the application genuinely knows it — a fabricated percentage parked at ninety is worse than a loader that never claimed to know.",

  categories: ["Loaders", "Feedback"],
  fhir: [],

  states: [
    "Indeterminate",
    "Determinate (0–100)",
    "Delayed (not yet shown)",
    "Slow wait",
    "Reduced motion",
  ],

  a11y: [
    {
      label: "Two roles, chosen by the data",
      detail:
        "Indeterminate is role=status in a polite live region. Determinate is role=progressbar with aria-valuemin, aria-valuemax, aria-valuenow, and a spoken aria-valuetext.",
    },
    {
      label: "Named from the visible label",
      detail:
        "In determinate mode the progressbar takes its accessible name from the same label element a sighted reader sees, so the two cannot disagree.",
    },
    {
      label: "Reduced motion is a designed state",
      detail:
        "Determinate mode is already still and stays exact. Indeterminate mode stops drifting and breathes in opacity instead.",
    },
  ],

  guidance: {
    use: [
      "Multi-step work whose progress is genuinely known: imports, uploads, record transfers, batch exports.",
      "Anywhere a reader needs to decide whether to keep waiting or come back later.",
      "Indeterminate, as a compact neutral loader in a wide container.",
    ],
    avoid: [
      "Invented percentages. If the number is a guess, leave progress off and let the slug drift.",
      "Narrow containers — the capsule needs about 64px of width to read.",
      "Clinical severity. This is a measurement of work, never of a patient.",
    ],
  },

  limitations: [
    "Does not compute progress. The application supplies the number and owns its truthfulness.",
    "Requires styles/oxygen-loader.css, installed with loader-core.",
    "Percentage only. It shows no time estimate and no per-step breakdown.",
  ],
  related: ["pulse-loader", "rhythm-loader", "breath-loader", "helix-loader"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "loader-core"],

  usage: `import { InfusionLoader } from "@/components/oxygen/infusion-loader";

// Determinate: the application knows how much is left
<InfusionLoader progress={42} label="Importing records" showLabel />

// Indeterminate: it does not, and says so by drifting
<InfusionLoader label="Preparing the export" />`,
});

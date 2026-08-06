import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "precautions-bar",
  title: "Precautions Bar",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "What staff must do before entering the room, ordered by required action.",
  description: "What staff must do before entering the room, ordered by required action. Lapsed precautions are dropped rather than greyed, and behavioral flags describe the approach, not the person.",
  rationale: "This is read on the way through a door, so it is ordered by the action required rather than alphabetically, and required PPE is named rather than implied by a category — “contact precautions” is a label, “gown and gloves” is an instruction. Lapsed precautions are dropped rather than greyed, because a stale precaution on screen is how staff learn to ignore all of them. Behavioral flags describe the approach, not the person: “two staff for personal care” is actionable and carries no judgement.",

  categories: [
    "Patient identity",
    "Clinical",
  ],
  fhir: [
    {
      name: "Flag",
      url: "https://hl7.org/fhir/R4/flag.html",
    },
  ],

  states: [
    "Airborne",
    "Contact isolation",
    "Behavioral approach",
    "Fall risk",
    "Mobility",
    "No active precautions",
    "Lapsed and dropped",
  ],

  a11y: [
    {
      label: "Icon, text, and colour",
      detail: "All three, always. These are read at distance and often in monochrome.",
    },
    {
      label: "Ordered by action",
      detail: "Reading order follows urgency of required action, not the source order of the flags.",
    },
    {
      label: "Empty is stated",
      detail: "No active precautions renders as a sentence rather than an empty bar.",
    },
  ],

  guidance: {
    use: [
      "At the top of any chart, room display, or transport handover.",
      "With actionFor supplying the specific PPE or approach required.",
      "On ward and corridor displays, where it is read at distance.",
    ],
    avoid: [
      "Rendering lapsed precautions greyed out rather than removing them.",
      "Behavioral labels that characterise a person rather than an approach.",
      "Relying on the icon alone \\u2014 these are read on poor displays at distance.",
    ],
  },

  limitations: [
    "PPE mapping is caller-supplied; there is no built-in infection-control catalogue.",
    "Category mapping covers common codes and falls back to a neutral kind.",
    "Does not model precaution ordering rules beyond urgency of action.",
  ],
  related: [
    "patient-banner",
    "code-status",
    "alert-banner",
  ],

  dependencies: [
    "@oxygenui-design/fhir@^0.1.0",
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { PrecautionsBar } from "@/components/oxygen/precautions-bar";

<PrecautionsBar
  flags={flags}
  actionFor={(flag) => PPE_BY_CODE[flag.code?.coding?.[0]?.code ?? ""]}
/>`,
});

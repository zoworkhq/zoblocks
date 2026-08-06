import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "density-provider",
  title: "Density Provider",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary:
    "Sets the spacing and target-size contract for a subtree. Density changes spacing, never which facts appear.",
  description:
    "Sets the spacing and target-size contract for a subtree. Three modes, nestable, and clamped to the WCAG 2.2 target-size floor so clinical density can never shrink a control below the accessible minimum.",
  rationale:
    "Density is a contract, not a preference. The same component serves a patient reading on a phone and a nurse scanning ninety rows, and the difference is spacing and target size — never which clinical facts appear. Hiding a fact to save a row is a defect, not a density mode. The provider also clamps to the WCAG 2.2 target-size floor rather than trusting every component to remember, and nests so a patient-facing card inside a clinical worklist keeps its own density.",

  categories: ["Primitive", "System"],
  fhir: [],

  states: [
    "Patient density",
    "Standard density",
    "Clinical density",
    "Nested providers",
    "Target-size floor enforced",
  ],

  a11y: [
    {
      label: "Target-size floor",
      detail:
        "Clinical density cannot shrink an interactive target below the WCAG 2.2 minimum of 24 CSS pixels. DensityTarget enforces it around any control.",
    },
    {
      label: "Independent of zoom",
      detail:
        "Density is an author decision; user text scaling and zoom apply on top and are not overridden.",
    },
    {
      label: "No content hidden",
      detail:
        "Spacing changes only. Nothing that is visible at patient density disappears at clinical density.",
    },
  ],

  guidance: {
    use: [
      "At the root of a worklist, flowsheet, or patient-facing surface.",
      "Nested, when a patient-facing card sits inside a clinical screen.",
      "With asChild inside table rows and other layout-sensitive containers.",
    ],
    avoid: [
      "Deriving density from the viewport. Density and breakpoint are independent axes.",
      "Using clinical density to fit more facts by hiding some. That is a defect.",
      "Assuming the floor makes any spacing safe \\u2014 it clamps targets, not text size.",
    ],
  },

  limitations: [
    "Does not read OS accessibility preferences \\u2014 wire those into the density you pass.",
    "The floor applies to controls wrapped in DensityTarget, not automatically to every descendant.",
    "Token values come from @oxygenui-design/tokens; this sets the attribute and context, not the spacing scale.",
  ],
  related: ["vitals-panel", "clinical-skeleton"],

  dependencies: ["lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: `import { DensityProvider, useDensity } from "@/components/oxygen/density-provider";

<DensityProvider density="clinical">
  <ObservationPanel observations={observations} />
</DensityProvider>

// Components can adapt behaviour, not just spacing.
const density = useDensity();`,
});

import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "density-provider",
  title: "Density Provider",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary:
    "Sets the surface contract for a subtree — spacing, target size, vocabulary and disclosure. Never which facts appear.",
  description:
    "Sets the surface profile for a subtree: spacing, WCAG 2.2 target-size floor, which vocabulary the surface speaks, and how much is disclosed before asking. Three profiles, nestable, and clamped so clinical density can never shrink a control below the accessible minimum.",
  rationale:
    "Density began as a spacing axis and is not one. The same component serves a patient reading on a phone and a nurse scanning ninety rows, and the difference between those surfaces is spacing, target size, disclosure, and which words are used. A surface that gives the patient a nurse's row height and the nurse's vocabulary has solved a quarter of the problem. Patient-facing and clinician-facing strings are different catalogs, not different tones of the same string — \\u201cpotassium\\u201d and \\u201cK+\\u201d are not a formality setting. Binding the catalog to the profile now means the translation layer has somewhere to plug in; binding it afterwards is a migration across every component. The provider also clamps to the WCAG 2.2 target-size floor rather than trusting every component to remember, and nests so a patient-facing card inside a clinical worklist keeps its own profile.",

  categories: ["Primitive", "System"],
  fhir: [],

  states: [
    "Patient profile (roomy, patient vocabulary, progressive disclosure)",
    "Standard profile (clinician vocabulary)",
    "Clinical profile (dense, clinician vocabulary, full disclosure)",
    "Register overridden independently of density",
    "Disclosure overridden independently of density",
    "Nested providers",
    "Target-size floor enforced",
  ],

  a11y: [
    {
      label: "Target-size floor",
      detail:
        "Clinical density cannot shrink an interactive target below the WCAG 2.2 minimum of 24 CSS pixels. DensityTarget clamps against --ox-density-target-floor around any control.",
    },
    {
      label: "Independent of zoom",
      detail:
        "Density is an author decision; user text scaling and zoom apply on top and are not overridden.",
    },
    {
      label: "No content hidden",
      detail:
        "Spacing and wording change. Nothing that is visible at patient density disappears at clinical density — full disclosure means fewer interactions in front of the same facts, not more facts.",
    },
    {
      label: "Register is on the DOM",
      detail:
        "data-ox-register mirrors the vocabulary in force, so a test can assert that a patient-facing subtree is actually speaking the patient catalog.",
    },
  ],

  guidance: {
    use: [
      "At the root of a worklist, flowsheet, or patient-facing surface.",
      "Nested, when a patient-facing card sits inside a clinical screen.",
      "With useTerm to select wording, so a component reads correctly on both kinds of surface.",
      "With register overridden when a clinician needs to preview exactly what the patient will see.",
      "With asChild inside table rows and other layout-sensitive containers.",
    ],
    avoid: [
      "Deriving density from the viewport. Density and breakpoint are independent axes.",
      "Using clinical density to fit more facts by hiding some. That is a defect.",
      "Treating register as a tone setting. The two catalogs are different words, not different politeness.",
      "Assuming the floor makes any spacing safe \\u2014 it clamps targets, not text size.",
    ],
  },

  limitations: [
    "Does not read OS accessibility preferences \\u2014 wire those into the density you pass.",
    "The floor applies to controls wrapped in DensityTarget, not automatically to every descendant.",
    "useTerm takes both wordings inline. It is the binding point for a message catalog, not the catalog itself \\u2014 see ADR 0008.",
    "Token values come from @oxygenui-design/tokens; this sets the attributes and context, not the spacing scale.",
  ],
  related: ["vitals-panel", "clinical-skeleton"],

  dependencies: ["lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: `import {
  DensityProvider,
  useDensity,
  useTerm,
} from "@/components/oxygen/density-provider";

<DensityProvider density="clinical">
  <ObservationPanel observations={observations} />
</DensityProvider>

// A clinician previewing the patient's own view: dense layout, patient words.
<DensityProvider density="clinical" register="patient">
  <PatientSnapshot patient={patient} />
</DensityProvider>

// Components select wording rather than assuming an audience.
const label = useTerm({ clinician: "K+", patient: "Potassium" });`,
});

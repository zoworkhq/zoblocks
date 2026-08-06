import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "clinical-skeleton",
  title: "Clinical Skeleton",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary:
    "Loading shaped like layout, never like a value — plus progressive sections that keep partial failure visible.",
  description:
    "Loading placeholders shaped like layout, never like a value, plus a progressive section that keeps partial failure and stale cache visible instead of silently omitting content.",
  rationale:
    "A skeleton shaped like a lab result invites the reader to fill in the blank, so these are shaped like layout: neutral bars of varying width, never like a number. The more important export is ProgressiveSection. Six source systems behind one screen is normal in healthcare and partial failure is the normal case, so the dangerous outcome is a screen that renders five sections and silently omits the sixth. A section is always in exactly one of four honest states, and failed and stale are visible facts rather than the absence of a fact.",

  categories: ["Primitive", "System"],
  fhir: [],

  states: ["Loading", "Loaded", "Failed with retry", "Stale while revalidating", "Reduced motion"],

  a11y: [
    {
      label: "Announced once",
      detail: "The skeleton is marked busy and announces once, not on every frame.",
    },
    {
      label: "Failure is assertive",
      detail:
        "A failed section uses role=alert, because it changes what the reader can conclude from the screen.",
    },
    {
      label: "Reduced motion respected",
      detail: "Shimmer is motion-safe only; reduced-motion users get a static placeholder.",
    },
  ],

  guidance: {
    use: [
      "Around every independently-fetched section on a composed clinical screen.",
      "With one section per source system, so one slow service does not block the rest.",
      "With state=\\u201cstale\\u201d whenever cached content is shown during revalidation.",
    ],
    avoid: [
      "Skeletons shaped like specific values \\u2014 that is the failure this prevents.",
      "A single page-level spinner for a screen backed by several sources.",
      "Rendering a failed section as empty. That is the harm ProgressiveSection exists to stop.",
    ],
  },

  limitations: [
    "Does not fetch or retry on its own \\u2014 it renders the state you pass.",
    "No automatic timeout detection; decide when slow becomes failed.",
    "Skeleton shapes approximate layout and will not perfectly prevent shift in every composition.",
  ],
  related: ["empty-state", "density-provider", "vitals-panel"],

  dependencies: ["lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: `import { ClinicalSkeleton, ProgressiveSection } from "@/components/oxygen/clinical-skeleton";

<ProgressiveSection
  state={medications.state}
  label="Medications"
  failureDetail="The pharmacy system did not respond."
  onRetry={medications.refetch}
>
  <MedicationList requests={medications.data} />
</ProgressiveSection>`,
});

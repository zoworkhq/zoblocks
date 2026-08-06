import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "error-boundary",
  title: "Error Boundary",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Contains a failure to one section and never renders a partial record as a complete one.",
  description: "Contains a failure to one section and never renders a partial record as a complete one. Reports without PHI, and marks boundaries whose failure invalidates the surrounding screen.",
  rationale: "The dangerous case is not a blank screen but a chart rendering five of a patient's eight medications with nothing to indicate the other three failed. A blank screen is obviously broken; a partial render looks complete and gets acted on. Critical boundaries — a patient banner, a code-status display — are marked as such because their absence changes what the reader can safely conclude from everything around them. PHI never leaves in a report: React error messages routinely embed props, and props here are patient data.",

  categories: [
    "Primitive",
    "System",
  ],
  fhir: [
    {
      name: "OperationOutcome",
      url: "https://hl7.org/fhir/R4/operationoutcome.html",
    },
  ],

  states: [
    "Healthy",
    "Section failed",
    "Critical boundary failed",
    "Retried",
  ],

  a11y: [
    {
      label: "Assertive",
      detail: "Failures use role=alert, because they change what the reader can conclude from the screen.",
    },
    {
      label: "Quotable reference",
      detail: "A short reference id the user can read aloud to support, with no stack trace or PHI.",
    },
    {
      label: "Retry is a real control",
      detail: "Recovery is a labelled button, not a page reload instruction.",
    },
  ],

  guidance: {
    use: [
      "Around every independently-rendered clinical section.",
      "With critical on identity, code status, and allergy surfaces.",
      "With onError wired to monitoring that you have confirmed scrubs PHI.",
    ],
    avoid: [
      "One boundary around the whole page \\u2014 that is the blank screen this avoids.",
      "Rendering null on error. There is deliberately no silent path.",
      "Passing the raw error to a logger without checking what it contains.",
    ],
  },

  limitations: [
    "React error boundaries do not catch errors in event handlers or async code.",
    "PHI scrubbing covers what this sends; your monitoring pipeline is still yours to verify.",
    "Reset re-mounts children; it does not re-fetch unless onRetry does.",
  ],
  related: [
    "clinical-skeleton",
    "empty-state",
  ],

  dependencies: [
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { ClinicalErrorBoundary } from "@/components/oxygen/error-boundary";

<ClinicalErrorBoundary label="Medications" onError={report}>
  <MedicationList requests={medications} />
</ClinicalErrorBoundary>

<ClinicalErrorBoundary label="Patient banner" critical>
  <PatientBanner patient={patient} />
</ClinicalErrorBoundary>`,
});

import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "patient-banner",
  title: "Patient Banner",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Persistent identity header for a clinical screen, driven by a FHIR Patient resource.",
  description: "Persistent patient identity header driven by a FHIR R4 Patient resource. Handles restricted records, deceased status, masked identifiers, and missing demographics.",
  rationale: "Renders who the chart belongs to and keeps it reachable at any point on the screen. Wrong-patient error is one of the highest-consequence failures in clinical software, so this component never invents a name, never renders absence as blankness, and announces deceased and restricted status to assistive technology rather than conveying it through styling alone.",

  categories: [
    "Patient identity",
    "Clinical",
  ],
  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
    },
  ],

  states: [
    "Complete demographics",
    "Name not recorded",
    "Restricted record",
    "Deceased",
    "Masked identifiers",
    "Loading",
  ],

  a11y: [
    {
      label: "Landmark",
      detail: "Renders as a labelled region so the patient context is reachable from anywhere on the page.",
    },
    {
      label: "Status flags",
      detail: "Deceased and restricted are text and icon, not color. Both are inside the region's accessible name.",
    },
    {
      label: "Masked identifiers",
      detail: "Screen readers receive the last four characters and an explicit statement that the value is masked.",
    },
    {
      label: "Loading",
      detail: "Skeleton carries aria-busy and an accessible label so the wait is announced.",
    },
    {
      label: "Heading level",
      detail: "The patient name renders at a configurable heading level so a nested banner does not corrupt the page outline.",
    },
  ],

  guidance: {
    use: [
      "At the top of any screen showing a single patient's data.",
      "Anywhere a user could plausibly act on the wrong record.",
      "With maskIdentifiers on shared workstations, waiting-room displays, and screen shares.",
    ],
    avoid: [
      "As a list row — it is a page-level landmark, not a repeating item.",
      "As your only access control. The restricted flag changes what is displayed; it does not stop data reaching the browser.",
      "For patient selection. Use a search or worklist component instead.",
    ],
  },

  limitations: [
    "Does not render address, telecom, or managing organization — compose those alongside it.",
    "Age is computed in whole years only. Neonatal and paediatric age display (days, weeks, months) is not yet handled.",
    "No built-in patient-photo slot.",
  ],
  related: [
    "vitals-panel",
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

  usage: `import { PatientBanner } from "@/components/oxygen/patient-banner";

export function ChartHeader({ patient }: { patient: Patient }) {
  return (
    <PatientBanner
      patient={patient}
      identifierSystem="http://your-org.example/fhir/sid/mrn"
      maskIdentifiers={isSharedWorkstation}
    />
  );
}`,
});

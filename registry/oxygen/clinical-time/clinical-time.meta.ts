import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "clinical-time",
  title: "Clinical Time",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "A clinical instant with a required time zone, honouring FHIR partial-date precision.",
  description: "A clinical instant with a required time zone. Preserves FHIR partial-date precision, keeps absolute time always available, and flags future timestamps as the data errors they usually are.",
  rationale: "timeZone is a required prop with no default, because the browser's zone is the wrong answer often enough to be dangerous. Relative time is an addition, never a replacement — “two hours ago” is useless in a handover and wrong in a medication record. Partial precision is preserved: rendering a year-only value as 1 January invents a day nobody recorded.",

  categories: [
    "Primitive",
    "Clinical",
  ],
  fhir: [
    {
      name: "dateTime · instant",
      url: "https://hl7.org/fhir/R4/datatypes.html#dateTime",
    },
  ],

  states: [
    "Full instant",
    "Day precision",
    "Month precision",
    "Year precision",
    "Future timestamp",
    "Event vs recorded time",
    "No date",
  ],

  a11y: [
    {
      label: "Absolute always announced",
      detail: "The accessible name carries the absolute date, time, and zone even when the visible text is relative.",
    },
    {
      label: "Real time element",
      detail: "Renders a <time> element with a machine-readable dateTime attribute.",
    },
    {
      label: "Future flagged in text",
      detail: "A future timestamp is labelled in words, not by colour alone.",
    },
  ],

  guidance: {
    use: [
      "Every clinical timestamp, with the facility or patient zone passed explicitly.",
      "With recorded set wherever charting time can differ from event time.",
      "With showZone on any surface where participants can be in different zones.",
    ],
    avoid: [
      "Relying on the browser zone. There is no default here on purpose.",
      "display=\\u201crelative\\u201d in handovers or medication records, where the absolute time is the point.",
      "Passing a pre-formatted string \\u2014 pass the raw FHIR value so precision survives.",
    ],
  },

  limitations: [
    "Relative phrasing is coarse by design and stops at 30 days.",
    "Daylight-saving ambiguity is not resolved \\u2014 the zone is applied as given.",
    "Relative display is ignored for year and month precision, which have no instant.",
  ],
  related: [
    "appointment-card",
    "vitals-panel",
    "patient-banner",
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

  usage: `import { ClinicalTime } from "@/components/oxygen/clinical-time";

<ClinicalTime value="2026-08-03T07:40:00Z" timeZone="America/New_York" showZone />
<ClinicalTime value="2026" timeZone="UTC" />  {/* renders "2026", not 1 January */}
<ClinicalTime value={given} recorded={charted} timeZone={facilityZone} />`,
});

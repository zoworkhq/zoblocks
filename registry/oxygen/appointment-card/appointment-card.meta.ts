import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "appointment-card",
  title: "Appointment Card",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Booked, pending, cancelled, no-show. Time zone is a required prop, not a guess.",
  description:
    "Scheduled appointment from a FHIR Appointment resource. Time zone is a required prop rather than inferred from the browser, and no-show is treated as distinct from cancelled.",
  rationale:
    "Renders a scheduled appointment with participants, timing, and status. Time zone is a required prop rather than an optional one, because defaulting to the browser's zone is how a clinic in one region books a patient in another for the wrong hour — and it is invisible in testing, since the developer and the test runner usually sit in the same zone as the clinic. Making the caller state the zone turns a silent class of bug into a compile error.",

  categories: ["Scheduling"],
  fhir: [
    {
      name: "Appointment",
      url: "https://hl7.org/fhir/R4/appointment.html",
    },
  ],

  states: [
    "Booked",
    "Pending",
    "Arrived",
    "Checked in",
    "Completed",
    "Cancelled",
    "No-show",
    "Waitlisted",
    "Virtual",
    "In person",
  ],

  a11y: [
    {
      label: "Zone always visible",
      detail:
        "The time-zone label renders next to the time. A time without one is an assumption the reader cannot check.",
    },
    {
      label: "Modality is text",
      detail: "Virtual and in-person are labelled, not signalled by icon alone.",
    },
    {
      label: "Invalid zones degrade",
      detail:
        "An unrecognised IANA zone falls back to locale formatting rather than throwing and blanking the screen.",
    },
  ],

  guidance: {
    use: [
      "On patient portals, provider schedules, and check-in flows.",
      "With the clinic's time zone on staff-facing screens, and the patient's on patient-facing ones.",
      "Keeping no-show entries visible — follow-up usually depends on them.",
    ],
    avoid: [
      "Passing the browser's zone as a shortcut. If you do not know the correct zone, that is a data problem to fix, not to paper over.",
      "As a booking control. This renders an appointment; it does not schedule one.",
      "Treating no-show as a cancellation. They differ operationally and the component keeps them apart.",
    ],
  },

  limitations: [
    "Renders start time and duration; recurring appointment rules are not expanded.",
    "Shows the first practitioner participant only.",
    "Location is not resolved from the participant reference.",
  ],
  related: ["patient-banner", "coverage-card"],

  dependencies: ["@oxygenui-design/fhir@^0.1.0", "lucide-react", "clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "status-badge"],

  usage: `import { AppointmentCard } from "@/components/oxygen/appointment-card";

<AppointmentCard
  appointment={appointment}
  timeZone={clinic.timeZone}   // required — never inferred
  locale="en-IN"
/>`,
});

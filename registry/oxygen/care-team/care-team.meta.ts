import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "care-team",
  title: "Care Team Panel",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Everyone involved, and who is actually reachable now.",
  description: "Everyone involved and who is actually reachable now. Coverage sits beside the assignment rather than replacing it, and non-clinical members are first-class.",
  rationale: "The gap this closes is that the person on the record is frequently not the person to contact. A panel listing the assigned consultant at 2am with no indication they are off call is worse than no panel — it produces a confident call to a phone nobody is holding. So coverage sits beside the assignment rather than replacing it. Past members are kept as history, and caregivers, peer supports, and community health workers render with the same weight as clinicians, because in behavioral health and complex care they frequently are the team.",

  categories: [
    "Patient identity",
    "Clinical",
  ],
  fhir: [
    {
      name: "CareTeam",
      url: "https://hl7.org/fhir/R4/careteam.html",
    },
  ],

  states: [
    "Current team",
    "Covered member",
    "Past members",
    "Non-clinical members",
    "No team recorded",
    "Role not recorded",
  ],

  a11y: [
    {
      label: "Named actions",
      detail: "Contact buttons say the action and the person, not just an icon.",
    },
    {
      label: "Avatars decorative",
      detail: "Initials are hidden from assistive technology; the name carries meaning.",
    },
    {
      label: "Coverage is text",
      detail: "Off-call status is a sentence, not a colour or a dimmed row.",
    },
  ],

  guidance: {
    use: [
      "On any chart where someone might need to contact the team.",
      "With coverage supplied from the on-call schedule, not the assignment record.",
      "With community and caregiver members passed through extraMembers.",
    ],
    avoid: [
      "Replacing the assigned clinician with the covering one. Both facts are needed.",
      "Deleting past members \\u2014 reviews ask who was involved and when.",
      "Demoting non-clinical members to a footnote.",
    ],
  },

  limitations: [
    "Coverage is caller-supplied \\u2014 there is no on-call schedule resolution here.",
    "Participants without a display name are skipped rather than shown as unknown.",
    "Does not model team hierarchy; order is source order with the responsible clinician pinned.",
  ],
  related: [
    "identity-token",
    "patient-snapshot",
    "app-shell",
  ],

  dependencies: [
    "@oxygenui/fhir",
    "lucide-react",
    "clsx",
    "tailwind-merge",
  ],
  registryDependencies: [
    "utils",
    "tokens",
  ],

  usage: `import { CareTeamPanel } from "@/components/oxygen/care-team";

<CareTeamPanel
  team={careTeam}
  responsibleRef="Practitioner/bensouda"
  coverage={{ "Practitioner/bensouda": { coveringName: "P. Ramanathan", until: "07:00" } }}
  contacts={{ "Practitioner/bensouda": { phone: "+15551234567" } }}
/>`,
});

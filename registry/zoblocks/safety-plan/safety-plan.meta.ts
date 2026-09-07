import { defineComponentMeta } from "@zoblocks/component-meta";

export default defineComponentMeta({
  name: "safety-plan",
  title: "Safety Plan",
  tier: "free",
  status: "beta",
  since: "0.3.0",
  layer: "block",

  summary:
    "The six steps of the Stanley-Brown Safety Planning Intervention, in order, with the crisis step rendered open and uncloseable.",

  tagline: "Stanley-Brown, six steps, with the crisis step always open.",
  description:
    "A patient-facing safety plan: warning signs, coping, distraction, people to ask, professionals and agencies, and means restriction. The crisis step cannot be collapsed, empty steps say they are unfinished rather than disappearing, and the wording is a patient catalog throughout.",
  rationale:
    "A safety plan is written collaboratively in a room and read alone, often on a phone, often at the worst hour of someone's week. That reading context is the whole design. The crisis step holds the phone numbers, so it renders open and its trigger reports itself disabled — a person in crisis does not scroll, does not scan, and should not have to make a correct decision about a chevron to reach a number. The step order is the intervention rather than a layout: the escalation from what someone can do alone to who they call is the clinical content, so nothing here sorts or filters. And a step nobody has filled in says so instead of vanishing, because a five-step plan numbered one to five claims the sixth was never part of the instrument.",

  categories: ["Disclosure", "Clinical"],
  fhir: [],

  states: [
    "Complete plan",
    "Crisis step pinned open",
    "Unfinished step",
    "Empty plan",
    "Clinician editing view, nothing pinned",
  ],

  a11y: [
    {
      label: "The crisis step is reachable without an interaction",
      detail:
        "It renders expanded and its trigger carries aria-disabled=true, which is the case APG defines: the panel is visible and the accordion prevents collapsing it. The trigger stays focusable, so a keyboard or screen-reader user lands on it and hears the label rather than tabbing past it.",
    },
    {
      label: "Pinning is stated in words",
      detail:
        'The header shows an "Always open" summary and the panel repeats the reason in a sentence, so the behaviour reads as intentional rather than as a stuck control — including in forced-colors mode, where the tint on the crisis panel is discarded.',
    },
    {
      label: "Steps keep their numbers in text",
      detail:
        "The step number is part of the heading string rather than a separate element, so it survives being announced, copied, and printed.",
    },
    {
      label: "Contacts are a description list",
      detail:
        "Names and how to reach them are marked up as dt/dd pairs, so a screen reader can navigate them as pairs instead of a run of text.",
    },
  ],

  guidance: {
    use: [
      "Patient-facing portals and apps, which is what the default patient density and second-person wording are for.",
      "A clinician's read-only view of a plan someone else wrote.",
      "Printed copies — the crisis step prints expanded whatever else is closed.",
    ],
    avoid: [
      "As the editor. This renders a plan; writing one is a form, with its own validation and consent.",
      "With pinCrisisStep off on any surface a person in crisis might open. That switch is for an editing view.",
      "As a substitute for a risk assessment. A plan is an intervention someone agreed to, not a score.",
    ],
  },

  limitations: [
    "Renders a plan; it does not create or edit one.",
    "The six steps are fixed. Labels are replaceable, order is not — reordering would change the instrument.",
    "Not a crisis-service integration. Numbers are rendered as the plan records them; the component does not dial, verify, or geolocate.",
    "Default wording is English and patient-facing. A clinician-facing surface needs its own catalog, not a tone change.",
    "No expiry logic. Whether a plan is stale is a clinical judgement, so revisedAt is displayed rather than interpreted.",
  ],
  related: ["accordion", "chart-accordion", "signature"],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens", "accordion-core", "accordion"],

  usage: `import { SafetyPlan } from "@/components/zoblocks/safety-plan";

<SafetyPlan
  revisedAt="2026-08-11"
  headingLevel={2}
  steps={{
    warningSigns: { entries: ["Sleeping less than four hours", "Not answering messages for two days"] },
    internalCoping: { entries: ["Walk to the end of the road and back", "Four in, six out, ten times"] },
    distractions: { entries: ["The cafe on Bell Street before 11am"] },
    supportContacts: { contacts: [{ name: "Priya", detail: "Sister", availability: "Any time" }] },
    professionals: {
      contacts: [
        { name: "988", detail: "Suicide & Crisis Lifeline", availability: "24 hours" },
        { name: "County crisis team", detail: "555 0148", availability: "24 hours" },
      ],
    },
    environment: { entries: ["Priya is holding the spare keys to the garage"] },
  }}
/>`,
});

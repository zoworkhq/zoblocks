import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "app-shell",
  title: "App Shell",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Navigation composed from permissions, patient context as a landmark, and guarded context changes.",
  description: "Outermost frame composed from the user's permissions rather than rendered-then-disabled. Patient context is a landmark, context changes are guarded, and session expiry warns before it acts.",
  rationale: "A prescriber, a scheduler, and a billing analyst need genuinely different products out of one codebase, so navigation is derived from permissions rather than rendered-then-disabled — a greyed-out “Prescribe” teaches a nurse the system is broken and teaches an auditor nothing. Patient context is a landmark rather than a breadcrumb, because which chart is open is a safety fact. Session expiry warns before it acts, because expiring a session under a half-written note is how documentation is lost to a policy timer.",

  categories: [
    "Navigation",
    "System",
  ],
  fhir: [
    {
      name: "PractitionerRole",
      url: "https://hl7.org/fhir/R4/practitionerrole.html",
    },
  ],

  states: [
    "Role with full access",
    "Role with limited access",
    "No features enabled",
    "Session expiring",
    "Break-glass active",
    "Mobile navigation",
  ],

  a11y: [
    {
      label: "Correct landmarks",
      detail: "Primary navigation, patient context, and main content are separate labelled landmarks.",
    },
    {
      label: "Counts in the name",
      detail: "Badge counts are part of each link's accessible name, with urgent distinguished from unread.",
    },
    {
      label: "Provisioning failure is visible",
      detail: "A role with nothing permitted says so rather than rendering an empty product.",
    },
  ],

  guidance: {
    use: [
      "As the single outermost frame of a clinical application.",
      "With onNavigate wired to the unsaved-work guard.",
      "With requires set on every destination that is permission-gated.",
    ],
    avoid: [
      "Treating hidden navigation as access control. The server remains the authority.",
      "Dropping patient context on narrow screens \\u2014 it compresses, never disappears.",
      "Rendering permitted-but-disabled items. Absent is clearer and more auditable.",
    ],
  },

  limitations: [
    "Does not implement routing \\u2014 it renders links and delegates to onNavigate.",
    "Session countdown is driven by the prop; the timer itself is yours.",
    "Multi-patient tab management is a separate component.",
  ],
  related: [
    "unsaved-guard",
    "patient-banner",
    "restricted-shield",
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

  usage: `import { AppShell } from "@/components/oxygen/app-shell";

<AppShell
  scopes={user.scopes}
  items={navItems}
  currentId="worklist"
  patientContext={<PatientBanner patient={patient} />}
  onNavigate={(item) => confirmLeave("Moving to " + item.label)}
  sessionSecondsRemaining={secondsLeft}
>
  {children}
</AppShell>`,
});

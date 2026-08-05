import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "restricted-shield",
  title: "Restricted Shield",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "pattern",

  summary: "Redacted by default. Discloses only with a stated reason, on a timer, and can conceal that content exists.",
  description: "Wraps content restricted by sensitivity policy. Redacted by default, discloses only with a stated reason, re-hides on a timer, and can conceal that content exists at all.",
  rationale: "Behavioral health, substance use under 42 CFR Part 2, reproductive care, HIV status, and minor confidentiality can each be restricted independently of the rest of the chart. The redacted state is the default render, not the fallback, and every path fails closed. The subtle requirement is the middle ground — stating that restricted content exists without revealing what it is — with a concealExistence variant for the narrower case where even that acknowledgement is not permitted.",

  categories: [
    "Primitive",
    "System",
    "Clinical",
  ],
  fhir: [
    {
      name: "Consent · meta.security",
      url: "https://hl7.org/fhir/R4/consent.html",
    },
  ],

  states: [
    "Restricted, disclosure permitted",
    "Restricted, disclosure not permitted",
    "Existence concealed",
    "Disclosed with countdown",
    "Auto re-redacted",
    "Not restricted",
  ],

  a11y: [
    {
      label: "Announced as withheld",
      detail: "The redacted state reads as restricted content with an available action, never as an empty section.",
    },
    {
      label: "Polite countdown",
      detail: "The re-hide timer uses a polite live region. A countdown that interrupts every second is worse than the risk it mitigates.",
    },
    {
      label: "Real form controls",
      detail: "The reason is a labelled select, not a free-text box, so the disclosure record is auditable.",
    },
  ],

  guidance: {
    use: [
      "Around any content subject to a sensitivity policy, at field, section, or record level.",
      "With onDisclose wired to your audit store \\u2014 the event is emitted, not saved.",
      "With concealExistence only where the existence of the record is itself sensitive.",
    ],
    avoid: [
      "Treating it as access control. Restricted data still reached the browser; enforce server-side.",
      "Long durationSeconds values. A disclosure that lasts until logout is not time-boxed.",
      "Putting the sensitive category name in a category string that itself reveals the content.",
    ],
  },

  limitations: [
    "Renders policy outcomes; it does not evaluate consent, security labels, or role.",
    "The audit event is emitted only. Persistence, retention, and review are yours.",
    "Timer state is per-instance and resets on remount.",
  ],
  related: [
    "absent-value",
    "empty-state",
    "action-gate",
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

  usage: `import { RestrictedShield } from "@/components/oxygen/restricted-shield";

<RestrictedShield
  restricted={isPart2Protected}
  category="Substance use — 42 CFR Part 2"
  onDisclose={(event) => auditLog.record(event)}
>
  <ObservationPanel observations={toxicology} />
</RestrictedShield>`,
});

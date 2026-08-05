import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "code-status",
  title: "Code Status",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "clinical",

  summary: "Resuscitation status and directives. Unknown is loud, never a silent default to full code.",
  description: "Resuscitation status, advance directives, and healthcare proxy. Unknown is a loud state, never a silent default to full code, and conflicting directives are surfaced rather than resolved.",
  rationale: "The highest-consequence display in the library. A DNR order that is not visible during a code is a catastrophic failure of information design, and the failure mode is never a crash — it is a directive on file, one click away, that nobody found in eleven seconds. So unknown is a loud state rather than a default to full code, verification age is part of the status, and conflicting directives are surfaced as a question rather than resolved by silently picking the newer one.",

  categories: [
    "Patient identity",
    "Clinical",
  ],
  fhir: [
    {
      name: "Consent",
      url: "https://hl7.org/fhir/R4/consent.html",
    },
  ],

  states: [
    "Full code",
    "DNR",
    "DNR / DNI",
    "Comfort measures",
    "Not on file",
    "Verification stale",
    "Conflicting directives",
  ],

  a11y: [
    {
      label: "First in reading order",
      detail: "A labelled section placed early, so it is reached before the content it governs.",
    },
    {
      label: "Never colour alone",
      detail: "Status is a full phrase; the DNR states are spelled out rather than abbreviated to a badge.",
    },
    {
      label: "Reachable proxy",
      detail: "The proxy phone is a tel: link, usable one-handed during an arrest.",
    },
  ],

  guidance: {
    use: [
      "High in the reading order of any summary, admission, or emergency surface.",
      "With verifiedAt always supplied \\u2014 an unverified directive is a different claim.",
      "With conflicting set when more than one directive exists and they disagree.",
    ],
    avoid: [
      "Defaulting status to full-code when nothing is found. That is a clinical decision.",
      "Hiding it behind a tab or a disclosure.",
      "Resolving conflicting directives programmatically.",
    ],
  },

  limitations: [
    "Does not resolve conflicts or rank directives \\u2014 it surfaces them.",
    "Does not verify document validity across organisations.",
    "Status vocabulary is a fixed set; jurisdictional variants need mapping upstream.",
  ],
  related: [
    "patient-banner",
    "precautions-bar",
    "patient-snapshot",
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

  usage: `import { CodeStatus } from "@/components/oxygen/code-status";

<CodeStatus
  status="dnr-dni"
  verifiedAt="2026-07-12T09:00:00Z"
  verifiedBy="A. Bensouda, MD"
  timeZone="America/New_York"
  proxy={proxy}
  proxyPhone="+15551234567"
/>`,
});

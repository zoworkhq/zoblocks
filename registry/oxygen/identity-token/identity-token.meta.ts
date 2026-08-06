import { defineComponentMeta } from "@oxygenui-design/component-meta";

export default defineComponentMeta({
  name: "identity-token",
  title: "Identity Token",
  tier: "free",
  status: "stable",
  since: "0.1.0",
  layer: "primitive",

  summary: "Compact, privacy-aware representation of a person, built around confirming rather than labelling.",
  description: "Compact, privacy-aware representation of a person. Photos require asserted consent, deceased and restricted are text, and initials infer nothing demographic.",
  rationale: "Wrong-patient error begins with an identity affordance that looked close enough. A photo renders only when consent is explicitly asserted — the component will not infer consent from a photo being present in the resource. A secondary identifier shows by default, because a name alone does not distinguish two people called J. Patel. Initials and colour derive from the characters of the name only; an avatar is not a classifier.",

  categories: [
    "Primitive",
    "Patient identity",
  ],
  fhir: [
    {
      name: "Patient",
      url: "https://hl7.org/fhir/R4/patient.html",
    },
  ],

  states: [
    "Complete identity",
    "Name not recorded",
    "Restricted record",
    "Deceased",
    "Photo without consent",
    "Name-alike collision",
    "Masked identifiers",
  ],

  a11y: [
    {
      label: "Full name never truncated",
      detail: "The visible name may truncate; the accessible name carries the whole identity, age, identifier, and flags as one phrase.",
    },
    {
      label: "Flags as text",
      detail: "Restricted and deceased are words, not icons a reader has to know. Photos carry empty alt because the adjacent name is the label.",
    },
    {
      label: "Name-alike announced",
      detail: "The collision warning is in the accessible name, not conveyed by styling alone.",
    },
  ],

  guidance: {
    use: [
      "Worklists, care-team panels, search results, and anywhere a person is named.",
      "With nameAlike set by the list when two entries are confusable.",
      "With maskIdentifiers on shared workstations and public-facing screens.",
    ],
    avoid: [
      "Passing photoConsent as a constant true. It is an assertion about the patient, not a display preference.",
      "Using the avatar colour to mean anything. It is decorative and stable, nothing more.",
      "Omitting the identifier in a list where two patients could share a name.",
    ],
  },

  limitations: [
    "Name-alike detection is list-level; the component renders the warning but cannot detect the collision itself.",
    "Age precision uses birthDate only \\u2014 sub-day precision for neonates needs a birth time the resource rarely carries.",
    "Initial derivation is Latin-script-biased for multi-word names, though single tokens work in any script.",
  ],
  related: [
    "patient-banner",
    "absent-value",
    "restricted-shield",
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

  usage: `import { IdentityToken } from "@/components/oxygen/identity-token";

<IdentityToken patient={patient} identifierSystem={MRN_SYSTEM} />
<IdentityToken patient={patient} maskIdentifiers avatarOnly />
<IdentityToken patient={patient} nameAlike />`,
});

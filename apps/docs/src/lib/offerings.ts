/**
 * Commercial offerings and showcase entries.
 *
 * Pricing here mirrors the figures in the strategy report. It is deliberately
 * kept in one place because it is still an open business decision — the
 * volume-priced individual tier is anchored on a comparable with a far larger
 * addressable market, and the weight may need to shift toward team, enterprise,
 * and services.
 */

export interface Template {
  slug: string;
  title: string;
  role: string;
  summary: string;
  /** Screens the kit ships with. */
  screens: string[];
  /** Registry items the kit composes. */
  uses: string[];
  status: "available" | "building" | "planned";
  tier: "pro" | "team";
}

export const TEMPLATES: Template[] = [
  {
    slug: "patient-portal",
    title: "Patient Portal",
    role: "Patient",
    summary:
      "Appointments, results, medications, messages, documents, and billing — in plain language, at patient density, with save-and-resume on every form.",
    screens: [
      "Dashboard",
      "Appointments",
      "Results",
      "Medications",
      "Documents",
      "Billing",
      "Profile",
    ],
    uses: [
      "patient-banner",
      "appointment-card",
      "vitals-panel",
      "medication-card",
      "coverage-card",
    ],
    status: "building",
    tier: "pro",
  },
  {
    slug: "provider-workspace",
    title: "Provider Workspace",
    role: "Clinician",
    summary:
      "Schedule, patient list, visit prep, results inbox, and handoffs at clinical density. Built for a keyboard, not a mouse.",
    screens: ["Today", "Patient list", "Chart summary", "Results inbox", "Orders", "Handoff"],
    uses: ["patient-banner", "vitals-panel", "condition-list", "allergy-list", "medication-card"],
    status: "building",
    tier: "pro",
  },
  {
    slug: "clinic-operations",
    title: "Clinic Operations",
    role: "Operations",
    summary:
      "Capacity, room and resource scheduling, queues, referrals, no-shows, and a daily command view for the front desk.",
    screens: ["Command centre", "Schedule", "Queues", "Referrals", "Roster", "Reports"],
    uses: ["appointment-card", "coverage-card", "patient-banner", "status-badge"],
    status: "planned",
    tier: "pro",
  },
  {
    slug: "telehealth",
    title: "Telehealth",
    role: "Patient + clinician",
    summary:
      "Pre-visit check-in, device test, waiting room, consent, call controls, and structured post-visit follow-up.",
    screens: ["Check-in", "Device test", "Waiting room", "Consent", "In call", "Follow-up"],
    uses: ["appointment-card", "patient-banner", "condition-list"],
    status: "planned",
    tier: "pro",
  },
  {
    slug: "health-tech-saas",
    title: "Health-Tech SaaS",
    role: "Product team",
    summary:
      "Marketing site plus an authenticated dashboard: organisations, roles, audit log, integrations, and API keys.",
    screens: ["Marketing", "Dashboard", "Organisation", "Members", "Audit log", "API keys"],
    uses: ["status-badge", "patient-banner", "vitals-panel"],
    status: "planned",
    tier: "team",
  },
  {
    slug: "medication-reconciliation",
    title: "Medication Reconciliation",
    role: "Pharmacist",
    summary:
      "Side-by-side home and inpatient lists, allergy cross-check, and a structured resolve step with an audit trail.",
    screens: ["Compare", "Resolve", "Allergies", "Sign-off", "History"],
    uses: ["medication-card", "allergy-list", "patient-banner", "status-badge"],
    status: "planned",
    tier: "team",
  },
];

export const STATUS_COPY: Record<Template["status"], string> = {
  available: "Available",
  building: "In build",
  planned: "Planned",
};

// ---------------------------------------------------------------------------
// Tiers
// ---------------------------------------------------------------------------

export interface Tier {
  name: string;
  price: string;
  cadence?: string;
  summary: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
  note?: string;
}

export const TIERS: Tier[] = [
  {
    name: "Core",
    price: "Free",
    summary: "Every component in the public catalog, MIT licensed, forever.",
    features: [
      "All 8 shipping components",
      "FHIR R4 types and helpers",
      "Design tokens and density modes",
      "Public registry and docs",
      "Commercial use permitted",
    ],
    cta: "Install a component",
    href: "/components",
  },
  {
    name: "Pro",
    price: "$199",
    cadence: "one-time",
    summary: "Workflow blocks and starter kits for one developer.",
    features: [
      "Everything in Core",
      "Premium workflow blocks",
      "Starter kits as they ship",
      "Figma library",
      "12 months of updates",
      "Unlimited personal and client projects",
    ],
    cta: "Join the waitlist",
    href: "#waitlist",
    featured: true,
    note: "Pre-launch. Nothing is charged until the first kit ships.",
  },
  {
    name: "Team",
    price: "$799",
    cadence: "per year",
    summary: "Five seats, shared design assets, and priority support.",
    features: [
      "Everything in Pro",
      "5 seats, add more anytime",
      "Shared Figma library",
      "Design token export",
      "Priority support",
      "Internal tools and products",
    ],
    cta: "Join the waitlist",
    href: "#waitlist",
  },
  {
    name: "Enterprise",
    price: "Custom",
    summary: "Private registry, procurement, and implementation support.",
    features: [
      "Everything in Team",
      "Private registry and SSO",
      "Version pinning and support SLA",
      "Security questionnaire support",
      "Custom components and accessibility review",
      "Design-system setup and migration",
    ],
    cta: "Talk to us",
    href: "mailto:hello@zowork.com?subject=Oxygen%20UI%20Enterprise",
  },
];

export const FAQ: Array<{ q: string; a: string }> = [
  {
    /*
     * Asked here because a reader who sees both pages will ask it, and the
     * honest answer is not "they are the same thing at two prices".
     *
     * The overlap between a $199 bundle and a $290 pack is real and unresolved
     * — see the note at the top of this file. What this answer must not do is
     * invent an inclusion promise nobody has made, so it states the two
     * properties that are actually true and leaves the choice with the reader.
     */
    q: "How does the marketplace relate to these tiers?",
    a: "The marketplace sells one thing at a time — an icon set, an empty-state system, a theme pack, a component — licensed to your whole organisation and perpetual. These tiers bundle work that is still being built. If you need a specific pack today, buy that one; if you want the starter kits as they land, the tiers are the way in. Nothing bought in the marketplace stops working when a subscription does.",
  },
  {
    q: "Is any of this a compliance boundary?",
    a: "No. Installing Oxygen does not make an application HIPAA, GDPR, or DPDP compliant, and nothing here is a medical device or clinical decision support. Access control, audit, data residency, and clinical validation remain yours. We would rather lose a sale than imply otherwise.",
  },
  {
    q: "What exactly do I own?",
    a: "The source. Components are copied into your repository by the shadcn CLI — there is no runtime package between you and the render, and you can read, audit, fork, and change every line. Core is MIT. Pro adds a commercial licence for the premium catalog; it does not restrict what you build with it.",
  },
  {
    q: "Can I use it for client work?",
    a: "Yes, on every paid tier, for unlimited client projects. What you cannot do is redistribute the catalog itself — reselling the components as a competing kit, or publishing them as your own registry.",
  },
  {
    q: "What happens when a licence lapses?",
    a: "Nothing you already installed stops working, and nothing is revoked. You keep every version released during your term and can keep shipping it commercially. You stop receiving new components and updates until you renew.",
  },
  {
    q: "Do the components work outside FHIR?",
    a: "Yes. The prop types are plain interfaces with optional fields that happen to match FHIR R4 shapes, so any object of the right shape works. You get the most value if your server already speaks FHIR, but nothing requires it.",
  },
  {
    q: "Which frameworks are supported?",
    a: "React 19 with Tailwind CSS v4 today, verified against Next.js App Router. The output is plain React with no framework-specific APIs, so Vite and Remix work; we simply have not added them to the tested matrix yet.",
  },
  {
    q: "Why is the pricing marked pre-launch?",
    a: "Because it is. The catalog is 8 components and the first starter kit is still in build. Charging before a kit ships would be charging for a promise, so the waitlist is free and nothing bills until there is something to bill for.",
  },
];

// ---------------------------------------------------------------------------
// Showcase
// ---------------------------------------------------------------------------

export interface ShowcaseEntry {
  slug: string;
  title: string;
  role: string;
  blurb: string;
  /** What the composition demonstrates. */
  demonstrates: string;
  density: "patient" | "standard" | "clinical";
  uses: string[];
}

/**
 * Reference implementations, not customers.
 *
 * There are no customers yet, and a showcase padded with invented logos is the
 * fastest way to lose a healthcare buyer — they check. Every entry here is an
 * Oxygen-built composition on synthetic data, labelled as such on the page.
 */
export const SHOWCASE: ShowcaseEntry[] = [
  {
    slug: "patient-results",
    title: "Patient results view",
    role: "Patient-facing",
    blurb:
      "How a result reads when the person looking at it is the patient. Reference ranges hidden, patient density, plain-language status.",
    demonstrates:
      "The same ObservationPanel as the clinical view, with hideReferenceRange and patient density — one component, two audiences.",
    density: "patient",
    uses: ["patient-banner", "vitals-panel"],
  },
  {
    slug: "chart-summary",
    title: "Chart summary",
    role: "Clinician",
    blurb:
      "The first screen of a visit: who, what is active, what they react to, and what they are taking.",
    demonstrates:
      "Clinical density across four components, with a critical result and a high-risk allergy both escalating without colour alone.",
    density: "clinical",
    uses: ["patient-banner", "condition-list", "allergy-list", "medication-card"],
  },
  {
    slug: "front-desk",
    title: "Front desk check-in",
    role: "Operations",
    blurb:
      "Appointment plus coverage at the moment someone walks in — including the lapsed-coverage case that produces a surprise bill.",
    demonstrates:
      "Masked identifiers for a screen the public can see, and coverage state derived from period rather than status.",
    density: "standard",
    uses: ["patient-banner", "appointment-card", "coverage-card"],
  },
  {
    slug: "medication-review",
    title: "Medication review",
    role: "Pharmacist",
    blurb: "Active, held, expired, and stopped in one list, with the allergy list beside it.",
    demonstrates:
      "Four medication statuses that most implementations flatten into one grey style, and a refuted allergy that must not read as active.",
    density: "standard",
    uses: ["medication-card", "allergy-list"],
  },
];

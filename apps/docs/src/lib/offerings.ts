/**
 * Commercial offerings and showcase entries.
 *
 * Kept in one place because it moves. The volume-priced individual tier that
 * used to sit here was anchored on a comparable with a far larger addressable
 * market, which is the reservation this comment carried for months before
 * anything was done about it — it has now been retired in favour of the
 * marketplace, where the unit is a pack rather than a promise, and the weight
 * sits on team, enterprise and services.
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
      /*
       * No count here.
       *
       * It said "All 8 shipping components" for long enough that the catalogue
       * reached twenty-six with the table still claiming eight — a number in
       * prose is a number nobody updates. The catalogue page derives its own
       * from `CATALOG`; this line simply stops asserting one.
       */
      "Every component in the public catalog",
      "FHIR R4 types and helpers",
      "Design tokens and density modes",
      "Public registry and docs",
      "Commercial use permitted",
    ],
    cta: "Install a component",
    href: "/components",
  },
  {
    /*
     * This slot used to be "Pro, $199 one-time", and retiring it is the point
     * of this table's current shape.
     *
     * That price was anchored on a comparable — a general-purpose React
     * component library — whose addressable market is two orders of magnitude
     * larger than healthcare-FHIR frontend work. The note at the top of this
     * file said as much from the day it was written, and the tier never left a
     * waitlist, so nobody has paid it and nothing has to be refunded.
     *
     * What replaces it is the thing that can actually be bought today: packs,
     * priced individually, delivered by the app. A tier that bundles work
     * still in build is a promise; a pack is a file.
     */
    name: "Marketplace",
    price: "From $120",
    cadence: "per pack",
    summary: "Icon sets, illustration systems, theme packs and components — bought one at a time.",
    features: [
      "Everything in Core",
      "Licensed to the whole organisation",
      "Perpetual — it does not expire",
      "Every item states what was checked",
      "Installs into a theme draft",
      "Components install with the Oxygen CLI",
    ],
    cta: "Browse the marketplace",
    href: "/marketplace",
    featured: true,
    note: "Bought in the app, because a purchase belongs to an organisation rather than a person.",
  },
  {
    name: "Team",
    price: "$799",
    cadence: "per year",
    summary: "Starter kits, shared design assets, and priority support.",
    features: [
      "Everything in Core and the marketplace",
      "Starter kits as they ship",
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
    q: "How does the marketplace relate to these tiers?",
    a: "The marketplace is the paid tier that exists today. You buy one thing — an icon set, an empty-state system, a theme pack, a component — licensed to your whole organisation and perpetual, and it does not stop working when anything lapses. Team and Enterprise add the starter kits, the shared design assets and the support around them. There used to be a $199 bundle in between; it was priced against a far larger market than this one and never left its waitlist, so it is gone rather than quietly still on the page.",
  },
  {
    q: "Is any of this a compliance boundary?",
    a: "No. Installing Oxygen does not make an application HIPAA, GDPR, or DPDP compliant, and nothing here is a medical device or clinical decision support. Access control, audit, data residency, and clinical validation remain yours. We would rather lose a sale than imply otherwise.",
  },
  {
    q: "What exactly do I own?",
    a: "The source. Components are copied into your repository by the Oxygen CLI — there is no runtime package between you and the render, and you can read, audit, fork, and change every line. Core is MIT. Pro adds a commercial licence for the premium catalog; it does not restrict what you build with it.",
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
    q: "Is any of this actually buyable yet?",
    a: "The marketplace is. Those packs exist, they are delivered by the app, and buying one charges you today. The starter kits are not — the first is still in build, and charging before a kit ships would be charging for a promise, so that half stays a free waitlist until there is something to bill for.",
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

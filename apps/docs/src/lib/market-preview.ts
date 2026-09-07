/**
 * The catalogue the public site can show on its own.
 *
 * `catalogue()` reads the console, which owns what is for sale — and the
 * console is not deployed: `app.zoblocks.design` has no DNS record, so the
 * fetch has always failed and the marketplace page has always rendered its
 * empty state. A storefront that cannot list anything until a separate service
 * exists is a storefront that does not work, and "The catalogue is loading" is
 * a worse answer than the catalogue.
 *
 * So this is the floor. The console still wins the moment it answers — see
 * `catalogue()` — and nothing here is a second opinion about price or contents:
 * every field is lifted verbatim from `apps/app/scripts/seed-market.mjs`, which
 * is what publishes these items, and `test/marketplace-catalogue.test.ts`
 * fails if the two disagree about a slug, a title, a kind or a price.
 *
 * Two things are deliberately absent.
 *
 * The clinical review block. The seed carries
 * `reviewedBy: "SEED DATA — nobody has reviewed this"` and says exactly why:
 * a plausible seeded name is indistinguishable from a real review the moment a
 * screenshot leaves a laptop. Nobody has reviewed these packs, so the public
 * page says that rather than rendering a field whose whole purpose is being
 * checkable.
 *
 * And any measurement for an announced item. Eighteen of these are roadmap:
 * no version, no files, and no pass rate, because inventing one for an unwritten
 * pack is the single lie this product cannot afford. They carry a price and a
 * motif, and every purchase path refuses them.
 */

export interface PreviewArt {
  viewBox: string;
  label: string;
  /** The inner SVG, drawn in `currentColor` so it inherits the theme. */
  body: string;
}

export interface PreviewItem {
  slug: string;
  kind: "icons" | "illustration" | "theme" | "component" | "fixtures";
  title: string;
  blurb: string;
  /** Minor units, as the console stores them. `0` is genuinely free. */
  priceMinor: number;
  currency: string;
  version: number;
  /** Announced rather than published: priced, not purchasable. */
  comingSoon: boolean;
  frameworks?: string[];
  /** Every path the pack ships, so a reader can see what they are buying. */
  files?: string[];
  checked?: {
    contrastPairs: number;
    floor: string;
    forcedColors: string;
    nonColourChannel: string;
  };
  authorship?: string;
  fhir?: { maps: string[]; release: string };
  /** A real sample of the pack's own artwork, where it ships any. */
  art?: PreviewArt[];
  /**
   * The pack's own tokens, for a theme pack.
   *
   * A palette is the only thing a theme pack is; showing its README instead
   * described the product rather than showing it.
   */
  swatches?: { step: string; hex: string }[];
}

/**
 * What no pack claims, whoever ends up reviewing them.
 *
 * These are limitations rather than review findings — a pack is not a medical
 * device regardless of who looked at it — so they survive the absence of the
 * clinical block and belong to every item rather than to one. The safety
 * officer reads this first, and it is the part that must not go missing
 * because a neighbouring field was not ready.
 */
export const DOES_NOT_CLAIM = [
  "Not medical advice",
  "Not a medical device or clinical decision support",
  "Not validated for use in diagnosis or treatment selection",
] as const;

/** The licence every pack is sold under. One grant, stated once. */
export const PACK_LICENCE = {
  id: "zoblocks-pack-1.0",
  grant: "Perpetual, for every member of this organisation and every product it ships",
  derivatives: "permitted for the licensee's own products",
  resale: "prohibited, including inside a template or theme",
} as const;

export const PREVIEW_CATALOGUE: PreviewItem[] = [
  {
    slug: "empty-state-system",
    kind: "illustration",
    title: "Empty-state system",
    blurb:
      "Every empty region drawn in three meanings — not asked, asked and none found, withheld — because confusing them is a patient-safety defect rather than a design preference.",
    priceMinor: 29000,
    currency: "usd",
    version: 2,
    comingSoon: false,
    files: [
      "allergies/masked.svg",
      "allergies/none-found.svg",
      "allergies/not-asked.svg",
      "meanings.json",
    ],
    checked: {
      contrastPairs: 17,
      floor: "4.5:1",
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: "hand-drawn",
    fhir: {
      maps: ["AllergyIntolerance", "Observation.dataAbsentReason"],
      release: "R4",
    },
    art: [
      {
        viewBox: "0 0 120 90",
        label: "No allergy history has been taken",
        body: '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><path d="M38 34h44" stroke-dasharray="6 6"/><path d="M38 48h32" stroke-dasharray="6 6"/><path d="M55 66c0-4 6-4 6-8 0-3-2.5-4.5-5-4.5"/><circle cx="58.5" cy="72" r="1.2"/>',
      },
      {
        viewBox: "0 0 120 90",
        label: "Recorded as no known allergies",
        body: '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><path d="M38 40l8 8 16-18"/><path d="M38 60h44"/><path d="M38 70h28"/>',
      },
      {
        viewBox: "0 0 120 90",
        label: "This record is restricted",
        body: '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><rect x="44" y="46" width="32" height="24" rx="4"/><path d="M50 46v-7a10 10 0 0 1 20 0v7"/><circle cx="60" cy="57" r="2"/><path d="M38 32h44"/>',
      },
    ],
  },
  {
    slug: "clinical-icons",
    kind: "icons",
    title: "Clinical icon set",
    blurb:
      "Glyphs for the vocabularies a generic set gets wrong: routes of administration, devices, sample containers, and the states a record can be in.",
    priceMinor: 18000,
    currency: "usd",
    version: 1,
    comingSoon: false,
    files: [
      "icons/alert.svg",
      "icons/book.svg",
      "icons/flag.svg",
      "icons/history.svg",
      "icons/lock.svg",
      "icons/person.svg",
    ],
    checked: {
      contrastPairs: 9,
      floor: "4.5:1",
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: "hand-drawn",
    art: [
      {
        viewBox: "0 0 24 24",
        label: "alert",
        body: '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17.5" r=".6"/>',
      },
      {
        viewBox: "0 0 24 24",
        label: "lock",
        body: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      },
      {
        viewBox: "0 0 24 24",
        label: "person",
        body: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
      },
      {
        viewBox: "0 0 24 24",
        label: "history",
        body: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>',
      },
      {
        viewBox: "0 0 24 24",
        label: "book",
        body: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17h14"/>',
      },
      {
        viewBox: "0 0 24 24",
        label: "flag",
        body: '<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>',
      },
    ],
  },
  {
    slug: "severity-ramp-cvd",
    kind: "theme",
    title: "Severity ramp — colour-vision safe",
    blurb:
      "A palette whose severity steps stay distinguishable under deuteranopia and in forced-colors mode, because severity carried by hue alone is severity nobody can read.",
    priceMinor: 12000,
    currency: "usd",
    version: 1,
    comingSoon: false,
    frameworks: ["antd", "mui"],
    files: ["README.md"],
    swatches: [
      { step: "50", hex: "#e8f7f2" },
      { step: "100", hex: "#c6ece0" },
      { step: "200", hex: "#93dcc7" },
      { step: "300", hex: "#5ec8ab" },
      { step: "400", hex: "#2fb08e" },
      { step: "500", hex: "#149275" },
      { step: "600", hex: "#0f766e" },
      { step: "700", hex: "#0c5d58" },
      { step: "800", hex: "#0a4a46" },
      { step: "900", hex: "#073431" },
    ],
    checked: {
      contrastPairs: 24,
      floor: "4.5:1",
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: "generated from tokens",
  },
  {
    slug: "vitals-flowsheet",
    kind: "component",
    title: "Vitals flowsheet",
    blurb:
      "A time-by-observation grid that renders what was measured and says so when nothing was — an empty cell and an unrecorded observation are not the same fact.",
    priceMinor: 45000,
    currency: "usd",
    version: 1,
    comingSoon: false,
    frameworks: ["antd"],
    files: ["components/zoblocks/vitals-flowsheet.tsx"],
    checked: {
      contrastPairs: 12,
      floor: "4.5:1",
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: "hand-drawn",
    fhir: {
      maps: ["Observation", "Encounter"],
      release: "R4",
    },
  },
  {
    slug: "messy-fixtures",
    kind: "fixtures",
    title: "Synthetic patients — the messy ones",
    blurb:
      "PHI-free FHIR bundles that are deliberately awkward: units that disagree, a result amended twice, a name with no surname. Demos work on clean data; pilots do not.",
    priceMinor: 35000,
    currency: "usd",
    version: 1,
    comingSoon: false,
    files: ["bundles/no-surname.json", "bundles/units-disagree.json"],
    checked: {
      contrastPairs: 0,
      floor: "4.5:1",
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: "generated from tokens",
    fhir: {
      maps: ["Patient", "Observation", "AllergyIntolerance"],
      release: "R4",
    },
  },
  {
    slug: "measurement-based-care",
    kind: "component",
    title: "Measurement-based care instruments",
    blurb:
      "PHQ-9, GAD-7, AUDIT-C and PCL-5 in the published wording, scored and banded. Item 9 asks about self-harm, so it gets a route out of the form rather than a score.",
    priceMinor: 60000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "cssrs-screener",
    kind: "component",
    title: "C-SSRS risk screener",
    blurb:
      "The Columbia protocol, branching as published — later questions appear only on particular answers, because the branching is the instrument rather than a convenience.",
    priceMinor: 70000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "safety-plan-patient-copy",
    kind: "illustration",
    title: "Safety plan — the patient's copy",
    blurb:
      "The artefact somebody leaves the room with. A5, legible without the app, and readable at the worst moment of their year.",
    priceMinor: 25000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "part-2-consent",
    kind: "component",
    title: "42 CFR Part 2 consent and disclosure",
    blurb:
      "US substance-use records are governed more strictly than HIPAA: consent names the recipient, redisclosure is prohibited, and the prohibition travels with the record.",
    priceMinor: 80000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "caseload-dashboard",
    kind: "component",
    title: "Caseload dashboard",
    blurb:
      "A panel of clients by next-contact-due, missed appointments and assessments falling out of date. Sorted by who is overdue, because the clinician already knows who is sickest.",
    priceMinor: 55000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "crisis-resources",
    kind: "component",
    title: "Crisis resources block",
    blurb:
      "Localised hotline and warmline details that state plainly the app is not a crisis service. Free, because charging for this is the wrong look.",
    priceMinor: 0,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "results-grid",
    kind: "component",
    title: "Results grid",
    blurb:
      "Reference ranges that vary by age and sex, results amended twice, units that disagree between labs, and the difference between pending, cancelled and never ordered.",
    priceMinor: 65000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "clinical-date-entry",
    kind: "component",
    title: "Clinical date entry",
    blurb:
      "Partial dates, because FHIR permits them and patients say “around 2019”. Relative dates for post-op days, and administration times that survive a time zone.",
    priceMinor: 30000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "dictation-note-editor",
    kind: "component",
    title: "Dictation-aware note editor",
    blurb:
      "Coded autocomplete for SNOMED and ICD, and the legal difference between an addendum and an amendment — a signed note cannot be edited, only appended to.",
    priceMinor: 90000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "patient-identity-header",
    kind: "component",
    title: "Patient identity header",
    blurb:
      "The band at the top of every clinical screen: preferred name against legal name, pronouns, allergy flags, and the identifiers a ward actually uses.",
    priceMinor: 22000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "low-arousal-palette",
    kind: "theme",
    title: "Low-arousal palette",
    blurb:
      "Clinical palettes are built around alarm. A behavioural-health surface is used by people in distress, and red for a non-urgent state is an unkind default.",
    priceMinor: 18000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "print-and-fax-palette",
    kind: "theme",
    title: "Print and fax palette",
    blurb:
      "Healthcare still faxes. A palette whose meaning survives one-bit monochrome, which is harder than greyscale and the case nobody tests.",
    priceMinor: 15000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "behavioural-health-icons",
    kind: "icons",
    title: "Behavioural-health iconography",
    blurb:
      "Therapy modality, group against individual, telehealth, medication-assisted treatment, peer support. Generic sets offer a brain or a puzzle piece, both of which mean something else.",
    priceMinor: 22000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "trauma-informed-imagery",
    kind: "illustration",
    title: "Trauma-informed imagery guidance",
    blurb:
      "Partly a set and partly a document: what not to draw. Restraints, seclusion, pills in a hand, a figure alone behind glass. The prohibitions are the product.",
    priceMinor: 28000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "behavioural-health-caseload",
    kind: "fixtures",
    title: "Behavioural-health caseload",
    blurb:
      "Forty synthetic clients with the awkward cases built in: a no-show streak, a half-finished PHQ-9, somebody who declined item 9, a client whose insurer has a different name.",
    priceMinor: 40000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "adversarial-palettes",
    kind: "fixtures",
    title: "Adversarial accessibility fixtures",
    blurb:
      "Palettes that pass in isolation and fail in place — an ordinary brand teal whose derived accent puts white at 2.98:1. A test suite nobody else has to discover.",
    priceMinor: 20000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "figma-library",
    kind: "component",
    title: "Figma library — the whole system",
    blurb:
      "Variables for three tiers and three themes, every component published, with Code Connect so Dev Mode shows the real import. Needs a named owner before it starts.",
    priceMinor: 150000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
  {
    slug: "vpat-and-acr",
    kind: "fixtures",
    title: "VPAT and conformance report",
    blurb:
      "Pre-filled from the gate's own measurements rather than written from memory the week before a deadline. Every healthcare procurement asks for one.",
    priceMinor: 90000,
    currency: "usd",
    version: 0,
    comingSoon: true,
  },
];

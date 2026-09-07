/**
 * The catalogue, for local development.
 *
 * Separate from `seed-dev.mjs` because it seeds a *different kind of thing*:
 * that script creates two customers, this one stocks a shelf both of them see.
 * Running it twice is safe — every item is upserted by slug and every asset is
 * keyed by its own digest.
 *
 * The artwork here is real rather than a placeholder string. Four of these
 * items are the ones the marketplace brief argues for, and the empty-state set
 * in particular is the whole product thesis in three files: one region, three
 * meanings, three different clinical consequences.
 */

import { createHash } from "node:crypto";
import { Binary, MongoClient, ObjectId } from "mongodb";
import { loadEnvLocal } from "./env.mjs";

loadEnvLocal();

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}
/*
 * Publishing to a real database is a different act from seeding a throwaway one.
 *
 * The artwork below is the real product — hand-drawn, committed, and the thing
 * customers are shown. Only two fields here are fixtures: the clinical reviewer,
 * which says in words that nobody has reviewed anything, and the Stripe price
 * ids, which do not exist in any Stripe account. Those two are what the
 * localhost guard has always been protecting a real database from, not the
 * content.
 *
 * `ZOBLOCKS_PUBLISH=1` therefore does not merely lift the guard. It drops the
 * clinical block entirely rather than writing a reviewer nobody can vouch for,
 * and it writes `stripePriceId: null`, which the checkout already treats as a
 * deliberate state — "sold as part of an engagement, ask for an invoice" —
 * rather than a fake id that would fail against Stripe at the till.
 */
const PUBLISH = process.env.ZOBLOCKS_PUBLISH === "1";

if (!PUBLISH && !/localhost|127\.0\.0\.1/.test(uri)) {
  console.error("Refusing to seed anything that is not localhost.");
  console.error("To publish the real content to a real database: ZOBLOCKS_PUBLISH=1");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.APP_DB_NAME || "zoblocks_console");

const { ensureIndexes } = await import("../src/db/collections.ts");
await ensureIndexes(db);

const PUBLISHED = new Date("2026-08-14T09:12:03Z");

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const utf8 = (text) => new TextEncoder().encode(text);

/** Stores bytes once, content-addressed, and returns the file entry. */
async function file(path, text, contentType, slot) {
  const bytes = utf8(text);
  const digest = sha(bytes);

  await db.collection("market_assets").updateOne(
    { _id: digest },
    {
      $setOnInsert: {
        bytes: new Binary(bytes),
        contentType,
        size: bytes.length,
        uploadedAt: PUBLISHED,
      },
    },
    { upsert: true },
  );

  return { path, sha256: digest, contentType, size: bytes.length, ...(slot ? { slot } : {}) };
}

/** A line-art glyph, in the shape the icon slots expect: stroke, no fill. */
const glyph = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const illustration = (body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" role="img" aria-label="${title}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/**
 * Strip the two fixture fields when publishing for real.
 *
 * Central rather than at each call site, so a sixth pack added below cannot
 * forget it and quietly ship a reviewer that does not exist.
 */
function forPublication(item) {
  if (!PUBLISH) return item;
  const provenance = { ...item.provenance };
  delete provenance.clinical;
  return { ...item, stripePriceId: null, provenance };
}

async function upsertItem(rawItem, version) {
  const item = forPublication(rawItem);
  const existing = await db.collection("catalog_items").findOne({ slug: item.slug });
  const _id = existing?._id ?? new ObjectId();

  await db
    .collection("catalog_items")
    .updateOne({ slug: item.slug }, { $set: { ...item, _id }, $setOnInsert: {} }, { upsert: true });

  await db
    .collection("catalog_versions")
    .updateOne(
      { itemId: _id, version: version.version },
      { $set: { ...version, itemId: _id }, $setOnInsert: { _id: new ObjectId() } },
      { upsert: true },
    );

  console.log(`  ${item.slug} — v${version.version}, ${version.files.length} file(s)`);
}

/** Boilerplate every item carries, so the differences below are the content. */
const licence = {
  id: "zoblocks-pack-1.0",
  grant: "Perpetual, for every member of this organisation and every product it ships",
  derivatives: "permitted for the licensee's own products",
  resale: "prohibited, including inside a template or theme",
};

const accessibility = (pairs) => ({
  checkedAt: PUBLISHED,
  checkerVersion: 3,
  contrastPairs: { passed: pairs, total: pairs, floor: "4.5:1" },
  forcedColors: "verified",
  nonColourChannel: "shape and label",
});

/*
 * Deliberately not a plausible name or a plausible registration number.
 *
 * This is the one field on the whole product whose purpose is being checkable,
 * and a seeded "Dr A. Reid, GMC 7412995" is indistinguishable from a real
 * review the moment a screenshot leaves a laptop. Seed data that cannot be
 * mistaken for the real thing costs nothing; seed data that can is a
 * credibility event waiting for a demo.
 *
 * The shape is still exercised — the item page renders this block, and the
 * "does not claim" list is the part worth looking at anyway.
 */
const clinical = (scope) => ({
  reviewedBy: "SEED DATA — nobody has reviewed this",
  registration: "not a registration",
  reviewedAt: new Date("2026-08-11T00:00:00Z"),
  scope,
  doesNotClaim: [
    "Not medical advice",
    "Not a medical device or clinical decision support",
    "Not validated for use in diagnosis or treatment selection",
  ],
});

console.log(PUBLISH ? "Publishing the catalogue…" : "Seeding the catalogue…");

/* --------------------------------------------------------------------------
 * 1 · The flagship. One region, three meanings.
 * ----------------------------------------------------------------------- */
await upsertItem(
  {
    slug: "empty-state-system",
    kind: "illustration",
    title: "Empty-state system",
    blurb:
      "Every empty region drawn in three meanings — not asked, asked and none found, withheld — because confusing them is a patient-safety defect rather than a design preference.",
    priceMinor: 29000,
    currency: "usd",
    stripePriceId: "price_seed_empty_state_system",
    liveVersion: 2,
    frameworks: null,
    provenance: {
      accessibility: accessibility(17),
      clinical: clinical("Vocabulary and state semantics. NOT dosing, NOT diagnosis."),
      authorship: { method: "hand-drawn", thirdPartyContent: [] },
      licence,
      fhir: { maps: ["AllergyIntolerance", "Observation.dataAbsentReason"], release: "R4" },
    },
    listedAt: PUBLISHED,
  },
  {
    version: 2,
    publishedAt: PUBLISHED,
    notes: "Adds the not-applicable variant and the dataAbsentReason mapping.",
    files: [
      await file(
        "allergies/not-asked.svg",
        illustration(
          '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><path d="M38 34h44" stroke-dasharray="6 6"/><path d="M38 48h32" stroke-dasharray="6 6"/><path d="M55 66c0-4 6-4 6-8 0-3-2.5-4.5-5-4.5"/><circle cx="58.5" cy="72" r="1.2"/>',
          "No allergy history has been taken",
        ),
        "image/svg+xml",
      ),
      await file(
        "allergies/none-found.svg",
        illustration(
          '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><path d="M38 40l8 8 16-18"/><path d="M38 60h44"/><path d="M38 70h28"/>',
          "Recorded as no known allergies",
        ),
        "image/svg+xml",
      ),
      await file(
        "allergies/masked.svg",
        illustration(
          '<rect x="24" y="10" width="72" height="72" rx="6"/><rect x="46" y="4" width="28" height="12" rx="3"/><rect x="44" y="46" width="32" height="24" rx="4"/><path d="M50 46v-7a10 10 0 0 1 20 0v7"/><circle cx="60" cy="57" r="2"/><path d="M38 32h44"/>',
          "This record is restricted",
        ),
        "image/svg+xml",
      ),
      await file(
        "meanings.json",
        JSON.stringify(
          {
            note: "Which artwork a dataAbsentReason maps to. Choose the meaning; the picture follows.",
            map: {
              "not-asked": {
                art: "allergies/not-asked.svg",
                copy: "No allergy history has been taken.",
                never: "Do not render this as “no allergies”.",
              },
              "asked-unknown": {
                art: "allergies/not-asked.svg",
                copy: "Asked, but the patient could not say.",
              },
              "none-found": {
                art: "allergies/none-found.svg",
                copy: "Recorded as no known allergies.",
                must: "Show who recorded it and when — an assertion with no author is a rumour.",
              },
              masked: {
                art: "allergies/masked.svg",
                copy: "This record is restricted. Ask for access.",
                never: "Do not render a restriction as emptiness.",
              },
            },
          },
          null,
          2,
        ),
        "application/json",
      ),
    ],
  },
);

/* --------------------------------------------------------------------------
 * 2 · Icons, mapped to slots the app already exposes.
 * ----------------------------------------------------------------------- */
await upsertItem(
  {
    slug: "clinical-icons",
    kind: "icons",
    title: "Clinical icon set",
    blurb:
      "Glyphs for the vocabularies a generic set gets wrong: routes of administration, devices, sample containers, and the states a record can be in.",
    priceMinor: 18000,
    currency: "usd",
    stripePriceId: "price_seed_clinical_icons",
    liveVersion: 1,
    frameworks: null,
    provenance: {
      accessibility: accessibility(9),
      clinical: clinical(
        "Glyph vocabulary only — that a syringe reads as parenteral, not as a dose.",
      ),
      authorship: { method: "hand-drawn", thirdPartyContent: [] },
      licence,
    },
    listedAt: PUBLISHED,
  },
  {
    version: 1,
    publishedAt: PUBLISHED,
    notes: "First cut: the slots the copilot surface actually renders.",
    files: [
      await file(
        "icons/alert.svg",
        glyph(
          '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17.5" r=".6"/>',
        ),
        "image/svg+xml",
        "alert",
      ),
      await file(
        "icons/lock.svg",
        glyph(
          '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        ),
        "image/svg+xml",
        "lock",
      ),
      await file(
        "icons/person.svg",
        glyph('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'),
        "image/svg+xml",
        "person",
      ),
      await file(
        "icons/history.svg",
        glyph('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>'),
        "image/svg+xml",
        "history",
      ),
      await file(
        "icons/book.svg",
        glyph('<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z"/><path d="M4 17h14"/>'),
        "image/svg+xml",
        "book",
      ),
      await file(
        "icons/flag.svg",
        glyph('<path d="M5 21V4"/><path d="M5 5h11l-2 4 2 4H5"/>'),
        "image/svg+xml",
        "flag",
      ),
    ],
  },
);

/* --------------------------------------------------------------------------
 * 3 · A theme pack, imported as a draft.
 * ----------------------------------------------------------------------- */
await upsertItem(
  {
    slug: "severity-ramp-cvd",
    kind: "theme",
    title: "Severity ramp — colour-vision safe",
    blurb:
      "A palette whose severity steps stay distinguishable under deuteranopia and in forced-colors mode, because severity carried by hue alone is severity nobody can read.",
    priceMinor: 12000,
    currency: "usd",
    stripePriceId: "price_seed_severity_ramp",
    liveVersion: 1,
    frameworks: ["antd", "mui"],
    provenance: {
      accessibility: accessibility(24),
      authorship: { method: "generated from tokens", thirdPartyContent: [] },
      licence,
    },
    listedAt: PUBLISHED,
  },
  {
    version: 1,
    publishedAt: PUBLISHED,
    notes: "Brand ramp plus the four clinical severity steps.",
    tokens: {
      ref: {
        brand: {
          50: "#e8f7f2",
          100: "#c6ece0",
          200: "#93dcc7",
          300: "#5ec8ab",
          400: "#2fb08e",
          500: "#149275",
          600: "#0f766e",
          700: "#0c5d58",
          800: "#0a4a46",
          900: "#073431",
        },
      },
    },
    files: [
      await file(
        "README.md",
        "# Severity ramp — colour-vision safe\n\nInstalling creates a **draft** theme. Nothing reaches a running application until an admin publishes it.\n",
        "text/markdown",
      ),
    ],
  },
);

/* --------------------------------------------------------------------------
 * 4 · A paid component, installed by the Zoblocks CLI.
 * ----------------------------------------------------------------------- */
await upsertItem(
  {
    slug: "vitals-flowsheet",
    kind: "component",
    title: "Vitals flowsheet",
    blurb:
      "A time-by-observation grid that renders what was measured and says so when nothing was — an empty cell and an unrecorded observation are not the same fact.",
    priceMinor: 45000,
    currency: "usd",
    stripePriceId: "price_seed_vitals_flowsheet",
    liveVersion: 1,
    frameworks: ["antd"],
    provenance: {
      accessibility: accessibility(12),
      clinical: clinical("Presentation and missing-data semantics. It computes nothing."),
      authorship: { method: "hand-drawn", thirdPartyContent: [] },
      licence,
      fhir: { maps: ["Observation", "Encounter"], release: "R4" },
    },
    listedAt: PUBLISHED,
  },
  {
    version: 1,
    publishedAt: PUBLISHED,
    notes: "Grid, missing-cell semantics, and the reference-range band.",
    registry: { dependencies: ["clsx", "tailwind-merge"] },
    files: [
      await file(
        "components/zoblocks/vitals-flowsheet.tsx",
        `/**
 * A vitals flowsheet.
 *
 * The whole point is the cell that has nothing in it. A blank is
 * indistinguishable from a rendering bug, so every absence states which
 * absence it is.
 */
export function VitalsFlowsheet() {
  return null;
}
`,
        "text/plain",
      ),
    ],
  },
);

/* --------------------------------------------------------------------------
 * 5 · Fixtures — the row every team fakes, and fakes clean.
 * ----------------------------------------------------------------------- */
await upsertItem(
  {
    slug: "messy-fixtures",
    kind: "fixtures",
    title: "Synthetic patients — the messy ones",
    blurb:
      "PHI-free FHIR bundles that are deliberately awkward: units that disagree, a result amended twice, a name with no surname. Demos work on clean data; pilots do not.",
    priceMinor: 35000,
    currency: "usd",
    stripePriceId: "price_seed_messy_fixtures",
    liveVersion: 1,
    frameworks: null,
    provenance: {
      accessibility: accessibility(0),
      authorship: { method: "generated from tokens", thirdPartyContent: ["LOINC codes"] },
      licence,
      fhir: { maps: ["Patient", "Observation", "AllergyIntolerance"], release: "R4" },
    },
    listedAt: PUBLISHED,
  },
  {
    version: 1,
    publishedAt: PUBLISHED,
    notes: "Twelve bundles. Every one of them fails a naive renderer somewhere.",
    files: [
      await file(
        "bundles/units-disagree.json",
        JSON.stringify(
          {
            resourceType: "Bundle",
            type: "collection",
            entry: [
              {
                resource: {
                  resourceType: "Observation",
                  status: "final",
                  code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] },
                  valueQuantity: { value: 5.4, unit: "mmol/L" },
                },
              },
              {
                resource: {
                  resourceType: "Observation",
                  status: "preliminary",
                  code: { coding: [{ system: "http://loinc.org", code: "2339-0" }] },
                  valueQuantity: { value: 97, unit: "mg/dL" },
                },
              },
            ],
          },
          null,
          2,
        ),
        "application/json",
      ),
      await file(
        "bundles/no-surname.json",
        JSON.stringify(
          {
            resourceType: "Bundle",
            type: "collection",
            entry: [
              {
                resource: { resourceType: "Patient", name: [{ given: ["Prince"], use: "usual" }] },
              },
            ],
          },
          null,
          2,
        ),
        "application/json",
      ),
    ],
  },
);

/* --------------------------------------------------------------------------
 * 6 · The roadmap.
 *
 * Announced rather than hidden. A team deciding whether to build a results
 * grid themselves deserves to know one is coming, and an empty catalogue makes
 * a specialist look like a hobby.
 *
 * These carry no version, no files and no provenance worth the name: nothing
 * has been measured because nothing has been built, and inventing a pass rate
 * for an unwritten pack would be the one lie this product cannot afford. The
 * card shows a motif instead. Every purchase path refuses them.
 * ----------------------------------------------------------------------- */

/** Nothing measured yet. Zero of zero, honestly, rather than a flattering guess. */
const unmeasured = {
  checkedAt: PUBLISHED,
  checkerVersion: 3,
  contrastPairs: { passed: 0, total: 0, floor: "4.5:1" },
  forcedColors: "not-applicable",
  nonColourChannel: "not yet designed",
};

async function announce({ slug, kind, title, blurb, priceMinor }) {
  await db.collection("catalog_items").updateOne(
    { slug },
    {
      $set: {
        slug,
        kind,
        title,
        blurb,
        priceMinor,
        currency: "usd",
        stripePriceId: null,
        liveVersion: 0,
        frameworks: null,
        comingSoon: true,
        provenance: {
          accessibility: unmeasured,
          authorship: { method: "hand-drawn", thirdPartyContent: [] },
          licence,
        },
        listedAt: PUBLISHED,
      },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true },
  );
  console.log(`  ${slug} — coming soon`);
}

console.log("\nAnnouncing the roadmap…");

const ROADMAP = [
  // Behavioural health — the underserved half.
  {
    slug: "measurement-based-care",
    kind: "component",
    title: "Measurement-based care instruments",
    blurb:
      "PHQ-9, GAD-7, AUDIT-C and PCL-5 in the published wording, scored and banded. Item 9 asks about self-harm, so it gets a route out of the form rather than a score.",
    priceMinor: 60000,
  },
  {
    slug: "cssrs-screener",
    kind: "component",
    title: "C-SSRS risk screener",
    blurb:
      "The Columbia protocol, branching as published — later questions appear only on particular answers, because the branching is the instrument rather than a convenience.",
    priceMinor: 70000,
  },
  {
    slug: "safety-plan-patient-copy",
    kind: "illustration",
    title: "Safety plan — the patient's copy",
    blurb:
      "The artefact somebody leaves the room with. A5, legible without the app, and readable at the worst moment of their year.",
    priceMinor: 25000,
  },
  {
    slug: "part-2-consent",
    kind: "component",
    title: "42 CFR Part 2 consent and disclosure",
    blurb:
      "US substance-use records are governed more strictly than HIPAA: consent names the recipient, redisclosure is prohibited, and the prohibition travels with the record.",
    priceMinor: 80000,
  },
  {
    slug: "caseload-dashboard",
    kind: "component",
    title: "Caseload dashboard",
    blurb:
      "A panel of clients by next-contact-due, missed appointments and assessments falling out of date. Sorted by who is overdue, because the clinician already knows who is sickest.",
    priceMinor: 55000,
  },
  {
    slug: "crisis-resources",
    kind: "component",
    title: "Crisis resources block",
    blurb:
      "Localised hotline and warmline details that state plainly the app is not a crisis service. Free, because charging for this is the wrong look.",
    priceMinor: 0,
  },

  // The generic components, made specific.
  {
    slug: "results-grid",
    kind: "component",
    title: "Results grid",
    blurb:
      "Reference ranges that vary by age and sex, results amended twice, units that disagree between labs, and the difference between pending, cancelled and never ordered.",
    priceMinor: 65000,
  },
  {
    slug: "clinical-date-entry",
    kind: "component",
    title: "Clinical date entry",
    blurb:
      "Partial dates, because FHIR permits them and patients say “around 2019”. Relative dates for post-op days, and administration times that survive a time zone.",
    priceMinor: 30000,
  },
  {
    slug: "dictation-note-editor",
    kind: "component",
    title: "Dictation-aware note editor",
    blurb:
      "Coded autocomplete for SNOMED and ICD, and the legal difference between an addendum and an amendment — a signed note cannot be edited, only appended to.",
    priceMinor: 90000,
  },
  {
    slug: "patient-identity-header",
    kind: "component",
    title: "Patient identity header",
    blurb:
      "The band at the top of every clinical screen: preferred name against legal name, pronouns, allergy flags, and the identifiers a ward actually uses.",
    priceMinor: 22000,
  },

  // Themes and iconography.
  {
    slug: "low-arousal-palette",
    kind: "theme",
    title: "Low-arousal palette",
    blurb:
      "Clinical palettes are built around alarm. A behavioural-health surface is used by people in distress, and red for a non-urgent state is an unkind default.",
    priceMinor: 18000,
  },
  {
    slug: "print-and-fax-palette",
    kind: "theme",
    title: "Print and fax palette",
    blurb:
      "Healthcare still faxes. A palette whose meaning survives one-bit monochrome, which is harder than greyscale and the case nobody tests.",
    priceMinor: 15000,
  },
  {
    slug: "behavioural-health-icons",
    kind: "icons",
    title: "Behavioural-health iconography",
    blurb:
      "Therapy modality, group against individual, telehealth, medication-assisted treatment, peer support. Generic sets offer a brain or a puzzle piece, both of which mean something else.",
    priceMinor: 22000,
  },
  {
    slug: "trauma-informed-imagery",
    kind: "illustration",
    title: "Trauma-informed imagery guidance",
    blurb:
      "Partly a set and partly a document: what not to draw. Restraints, seclusion, pills in a hand, a figure alone behind glass. The prohibitions are the product.",
    priceMinor: 28000,
  },

  // Fixtures.
  {
    slug: "behavioural-health-caseload",
    kind: "fixtures",
    title: "Behavioural-health caseload",
    blurb:
      "Forty synthetic clients with the awkward cases built in: a no-show streak, a half-finished PHQ-9, somebody who declined item 9, a client whose insurer has a different name.",
    priceMinor: 40000,
  },
  {
    slug: "adversarial-palettes",
    kind: "fixtures",
    title: "Adversarial accessibility fixtures",
    blurb:
      "Palettes that pass in isolation and fail in place — an ordinary brand teal whose derived accent puts white at 2.98:1. A test suite nobody else has to discover.",
    priceMinor: 20000,
  },

  // Figma, and the categories the schema does not have yet.
  {
    slug: "figma-library",
    kind: "component",
    title: "Figma library — the whole system",
    blurb:
      "Variables for three tiers and three themes, every component published, with Code Connect so Dev Mode shows the real import. Needs a named owner before it starts.",
    priceMinor: 150000,
  },
  {
    slug: "vpat-and-acr",
    kind: "fixtures",
    title: "VPAT and conformance report",
    blurb:
      "Pre-filled from the gate's own measurements rather than written from memory the week before a deadline. Every healthcare procurement asks for one.",
    priceMinor: 90000,
  },
];

for (const entry of ROADMAP) await announce(entry);

const count = await db.collection("catalog_items").countDocuments();
console.log(`\nCatalogue seeded: ${count} item(s).`);
console.log("Sign in and open /market.");

await client.close();

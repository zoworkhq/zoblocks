/**
 * A worked organisation, for local development.
 *
 * Seeds two customers rather than one, deliberately — the app's central
 * guarantee is that neither can see the other's themes, and a single-tenant
 * seed makes that impossible to eyeball.
 *
 * Refuses to run against anything that is not local, matching hq's seed.
 */

import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { VALIDATOR_VERSION } from "@zoblocks/theme";
import { loadEnvLocal } from "./env.mjs";

// Next reads `.env.local`; a tsx script does not. Do it before touching env.
loadEnvLocal();

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local first.");
  process.exit(1);
}
if (!/localhost|127\.0\.0\.1/.test(uri)) {
  console.error("Refusing to seed anything that is not localhost.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.APP_DB_NAME || "zoblocks_console");

const { ensureIndexes } = await import("../src/db/collections.ts");
await ensureIndexes(db);

for (const name of ["organisations", "members", "themes", "themeVersions", "audit"]) {
  await db.collection(name).deleteMany({});
}

const password = await bcrypt.hash("correct-horse-battery-staple", 12);

async function org(name, slug, brand) {
  const orgId = new ObjectId();
  await db.collection("organisations").insertOne({
    _id: orgId,
    name,
    slug,
    frameworks: ["antd"],
    defaultThemeId: null,
    createdAt: new Date(),
  });

  const memberId = new ObjectId();
  const email = `admin@${slug}.example`;
  await db.collection("members").insertOne({
    _id: memberId,
    orgId,
    name: `${name} Admin`,
    email,
    emailLower: email,
    passwordHash: password,
    role: "admin",
    status: "active",
    createdAt: new Date(),
    approvedAt: new Date(),
    approvedBy: null,
  });

  // An eleven-step ramp, the shape createTheme produces.
  const { generateRamp } = await import("@zoblocks/theme");
  const tokens = { ref: { brand: generateRamp(brand) } };

  const themeId = new ObjectId();
  await db.collection("themes").insertOne({
    _id: themeId,
    orgId,
    name: `${name} Clinical`,
    slug: `${slug}-clinical`,
    status: "published",
    tokens,
    liveVersion: 1,
    createdAt: new Date(),
    createdBy: memberId,
    updatedAt: new Date(),
    updatedBy: memberId,
  });

  await db.collection("themeVersions").insertOne({
    _id: new ObjectId(),
    orgId,
    themeId,
    version: 1,
    tokens,
    validation: {
      validatedAt: new Date().toISOString(),
      /*
       * The *current* validator, not a literal.
       *
       * `isServable` refuses a version stamped by an older validator — that is
       * the guard that stops a tightened rule leaving old palettes live. A
       * hardcoded number here means every seeded theme is born unservable: the
       * app shows "v1 live" and the stylesheet 404s, which reads as a
       * broken route rather than as the gate doing its job.
       */
      validatorVersion: VALIDATOR_VERSION,
      contrastPairs: { checked: 78, failed: 0 },
      themes: ["light", "dark", "high-contrast"],
    },
    publishedAt: new Date(),
    publishedBy: memberId,
  });

  return { email, slug };
}

const a = await org("Northwind Health", "northwind", "#1d63c9");
const b = await org("Southmere Trust", "southmere", "#7a1fa2");

console.log("✓ seeded two organisations");
console.log(`  ${a.email} / correct-horse-battery-staple`);
console.log(`  ${b.email} / correct-horse-battery-staple`);
console.log("  stylesheet: /t/northwind/northwind-clinical@1.css");

await client.close();

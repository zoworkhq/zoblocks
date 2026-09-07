/**
 * Create the first organisation, and make the first person an administrator.
 *
 * The console has a deliberate chicken-and-egg at the very start, and it is
 * only visible on an empty database. `/signup` joins an organisation that
 * already exists — `unscopedSignUp` looks the slug up and returns `no-org`
 * rather than creating one, because a stranger who guesses a slug must not be
 * able to invent a tenant. And the member it creates is `status: "pending"`,
 * which grants nothing until an administrator inside that organisation approves
 * it. On a fresh production database there is no organisation to join and no
 * administrator to approve anybody, so every sign-up fails at the org address
 * and the console looks broken when it is behaving exactly as designed.
 *
 * `seed-dev.mjs` resolves this for development by inventing Northwind and
 * Southmere with a password printed in its own source. That is correct for a
 * throwaway database and wrong for a real one, which is why this exists
 * separately rather than as a flag on that script.
 *
 * This never sets a password. Run it once to create the organisation, sign up
 * through the real form so the password is yours and is hashed by the same code
 * path as everybody else's, then run it again with your address to be approved
 * and promoted. Idempotent at every step: safe to re-run, and it will tell you
 * what it did rather than what it intended.
 *
 *   node scripts/bootstrap-org.mjs "Zowork" zowork
 *   … sign up at /signup with organisation address "zowork" …
 *   node scripts/bootstrap-org.mjs "Zowork" zowork rahul@zowork.com
 */

import { MongoClient, ObjectId } from "mongodb";
import { loadEnvLocal } from "./env.mjs";

// Next reads `.env.local`; a tsx script does not. Do it before touching env.
loadEnvLocal();

const [name, slug, email] = process.argv.slice(2);

if (!name || !slug) {
  console.error('Usage: node scripts/bootstrap-org.mjs "<Organisation name>" <slug> [admin-email]');
  console.error('  e.g. node scripts/bootstrap-org.mjs "Zowork" zowork');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  // The slug appears in app URLs and is what a person types into the sign-up
  // form. Rejecting it here beats discovering it in a URL that will not route.
  console.error(
    `"${slug}" is not a valid organisation address: lower-case letters, digits and hyphens only.`,
  );
  process.exit(1);
}

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.APP_DB_NAME || "zoblocks_console");

// The same indexes the app relies on. Creating a member before the unique index
// on `emailLower` exists would let a duplicate through and the constraint would
// then refuse to build.
const { ensureIndexes } = await import("../src/db/collections.ts");
await ensureIndexes(db);

/* ------------------------------------------------------------------ */
/* The organisation                                                    */
/* ------------------------------------------------------------------ */

let organisation = await db.collection("organisations").findOne({ slug });

if (organisation) {
  console.log(`· organisation "${slug}" already exists — leaving it alone`);
} else {
  const orgId = new ObjectId();
  await db.collection("organisations").insertOne({
    _id: orgId,
    name,
    slug,
    frameworks: ["antd"],
    defaultThemeId: null,
    createdAt: new Date(),
  });
  organisation = { _id: orgId, name, slug };
  console.log(`✓ created organisation "${name}" at address "${slug}"`);
}

/* ------------------------------------------------------------------ */
/* The first administrator                                             */
/* ------------------------------------------------------------------ */

if (!email) {
  console.log("");
  console.log(`Next: sign up at /signup with organisation address "${slug}".`);
  console.log("Then re-run this with your email address to approve and promote yourself:");
  console.log(`  node scripts/bootstrap-org.mjs "${name}" ${slug} you@example.com`);
  await client.close();
  process.exit(0);
}

const emailLower = email.toLowerCase();
const member = await db.collection("members").findOne({ orgId: organisation._id, emailLower });

if (!member) {
  // Deliberately not created here. A member row needs a password hash, and a
  // password this script chose would be one that has been written down
  // somewhere — in a shell history at minimum. Signing up through the form
  // keeps it between the person and bcrypt.
  console.error("");
  console.error(`✗ no member "${email}" in "${slug}" yet.`);
  console.error(`  Sign up at /signup first — organisation address "${slug}" — then re-run this.`);
  await client.close();
  process.exit(1);
}

if (member.role === "admin" && member.status === "active") {
  console.log(`· ${email} is already an active administrator — nothing to do`);
} else {
  await db.collection("members").updateOne(
    { _id: member._id },
    {
      $set: {
        role: "admin",
        status: "active",
        approvedAt: new Date(),
        // Nobody approved this one: it is the bootstrap, and recording a
        // fictitious approver would be worse than recording none.
        approvedBy: null,
      },
    },
  );
  console.log(`✓ ${email} is now an active administrator of "${slug}"`);
}

console.log("");
console.log(`Sign in at /login. Every later member signs up and is approved from inside the app.`);

await client.close();

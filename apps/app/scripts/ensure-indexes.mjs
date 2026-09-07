/**
 * Apply indexes. Idempotent, and safe to run against production.
 *
 * The unique indexes here are not housekeeping: `{ orgId, slug }` is what makes
 * two themes of the same name in one organisation impossible, and
 * `{ themeId, version }` is what makes a double publish an error rather than
 * two documents both claiming to be version 7.
 */

import { MongoClient } from "mongodb";
import { loadEnvLocal } from "./env.mjs";

// Next reads `.env.local`; a tsx script does not. Do it before touching env.
loadEnvLocal();

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.APP_DB_NAME || "zoblocks_console");

const { ensureIndexes } = await import("../src/db/collections.ts");
await ensureIndexes(db);

console.log("✓ indexes applied");
await client.close();

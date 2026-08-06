import { MongoClient, type Db } from "mongodb";
import { collections, type Collections } from "./collections";

/**
 * Lazily constructed. `next build` runs in CI with no DATABASE_URL, and a
 * module-scope connection would fail the build of a repo whose other packages
 * have nothing to do with this app. Nothing connects until a request asks it to.
 *
 * The client is cached across invocations because serverless reuses warm
 * instances, and a fresh connection per request exhausts the cluster's
 * connection limit long before it exhausts anything else.
 */
declare global {
  // `var` on purpose: the declaration has to attach to globalThis so the cached
  // client survives module reload in dev.
  var __hqMongo: { client: MongoClient; db: Db; cols: Collections } | undefined;
}

/**
 * The database name is fixed here rather than taken from the connection string.
 *
 * The string is shared with the marketing site, and its path segment points at
 * that site's Payload database. Honouring it would write hq's users and tasks
 * into the CMS. Naming the database explicitly makes that impossible, whatever
 * URL is supplied.
 */
const DB_NAME = process.env.HQ_DB_NAME || "hq";

function connect() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "DATABASE_URL is not set. Copy apps/hq/.env.example to .env.local and point it at your MongoDB cluster.",
    );
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    retryWrites: true,
  });
  const db = client.db(DB_NAME);
  return { client, db, cols: collections(db) };
}

export function mongo() {
  globalThis.__hqMongo ??= connect();
  return globalThis.__hqMongo;
}

/** Shorthand — `const { users } = db();` reads better than the alternative. */
export function db(): Collections {
  return mongo().cols;
}

export function database(): Db {
  return mongo().db;
}

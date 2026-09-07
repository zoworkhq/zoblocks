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
  var __appMongo: { client: MongoClient; db: Db; cols: Collections } | undefined;
}

/**
 * The database name is fixed here rather than taken from the connection string.
 *
 * The string is shared with the marketing site, and its path segment points at
 * that site's Payload database. Honouring it would write the app's organisations and themes
 * into the CMS. Naming the database explicitly makes that impossible, whatever
 * URL is supplied.
 */
const DB_NAME = process.env.APP_DB_NAME || "zoblocks_console";

function connect() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "DATABASE_URL is not set. Copy apps/app/.env.example to .env.local and point it at your MongoDB cluster.",
    );
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    retryWrites: true,
  });

  /*
   * A closed topology is permanent, so the cache has to let go of it.
   *
   * The driver reconnects on its own through blips, elections and failovers —
   * but not once the topology is *closed*. That is terminal for a `MongoClient`,
   * and because this one is cached on `globalThis` it was cached for the life of
   * the process: every request after it threw `MongoTopologyClosedError` and the
   * only cure was restarting the server. In development that is the ephemeral
   * mongod being restarted; in production it is anything that closes the client
   * once, after which the application never serves again without a redeploy.
   *
   * `topologyClosed` is a standard SDAM event. Dropping the cache when it fires
   * means the next caller builds a fresh client and the process recovers by
   * itself. The identity check matters: a client replaced earlier must not
   * evict the one that replaced it.
   */
  client.on("topologyClosed", () => {
    if (globalThis.__appMongo?.client === client) globalThis.__appMongo = undefined;
  });

  const db = client.db(DB_NAME);
  return { client, db, cols: collections(db) };
}

export function mongo() {
  globalThis.__appMongo ??= connect();
  return globalThis.__appMongo;
}

/** Shorthand — `const { users } = db();` reads better than the alternative. */
export function db(): Collections {
  return mongo().cols;
}

export function database(): Db {
  return mongo().db;
}

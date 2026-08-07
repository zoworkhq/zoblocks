import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "vitest";
import { __resetHttp } from "./stubs/next-headers";

let server: MongoMemoryServer;

/**
 * At module scope, not inside `beforeAll`.
 *
 * `DB_NAME` in db/client.ts is a module-level constant, so it is fixed the
 * first time that module is imported — which happens while test files are being
 * collected, before any hook runs. Setting this in `beforeAll` is too late and
 * silently leaves every test on the default name.
 */
process.env.HQ_DB_NAME = "hq_test";

beforeAll(async () => {
  server = await MongoMemoryServer.create();
  // Read lazily inside connect(), so beforeAll is early enough for this one.
  process.env.DATABASE_URL = server.getUri();

  // Indexes are part of the behaviour under test: the unique index on
  // emailLower is what decides a duplicate signup, not any check in the code.
  const { database } = await import("@/db/client");
  const { ensureIndexes } = await import("@/db/collections");
  await ensureIndexes(database());
});

afterEach(async () => {
  __resetHttp();

  // Delete documents rather than dropping collections: dropping would take the
  // indexes with it, and a suite that silently lost its unique index would pass
  // the very tests written to prove the index works.
  const { database } = await import("@/db/client");
  const db = database();
  const names = await db.listCollections({}, { nameOnly: true }).toArray();
  await Promise.all(names.map((c) => db.collection(c.name).deleteMany({})));
});

afterAll(async () => {
  const { mongo } = await import("@/db/client");
  await mongo().client.close();
  await server?.stop();
});

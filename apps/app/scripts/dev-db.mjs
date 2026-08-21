/**
 * A throwaway MongoDB for local development.
 *
 * The app needs a database and most machines do not have `mongod`
 * installed. `mongodb-memory-server` is already a devDependency because the
 * test suite runs against a real mongod rather than a mocked driver — this
 * reuses the same binary so `pnpm dev` works on a clean checkout without
 * anyone provisioning a cluster.
 *
 *     pnpm --filter @oxygenui-design/app db:dev     # leave running
 *     pnpm --filter @oxygenui-design/app db:seed
 *     pnpm --filter @oxygenui-design/app dev
 *
 * **The data is gone when this process stops.** That is the point: a
 * development database that survives is a development database people start
 * treating as real, and this one has seeded passwords in it.
 */

import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * A fixed port, not whichever one happened to be free.
 *
 * This used to print a fresh random port on every start and ask the reader to
 * copy it into `.env.local`. That makes the instruction correct exactly once:
 * restart the database — after a reboot, after a test run, after a laptop
 * sleeps — and the file points at a port nothing is listening on. The failure
 * surfaces much later, as `MongoTopologyClosedError` on the first sign-in,
 * which reads like an application bug rather than a stale line in a dotfile.
 *
 * Pinning it means `.env.local` is written once and stays true. If something
 * else holds the port the failure is immediate and says so, which is a better
 * trade than a URL that looks right and fails at the far end of a request.
 *
 * `APP_DEV_DB_PORT` overrides it, for the one case the fixed port cannot
 * serve: a second git worktree. Two checkouts of this repo both run
 * `db:dev` and the second dies with "Port 59789 already in use" — correct, and
 * unhelpful, because the answer is a different port rather than stopping the
 * other one and losing its data.
 */
const PORT = Number(process.env.APP_DEV_DB_PORT || 59789);

const server = await MongoMemoryServer.create({
  instance: { port: PORT, dbName: "oxygen_console" },
});
const uri = server.getUri();

console.log("");
console.log("  Ephemeral MongoDB running on a fixed port.");
console.log("");
console.log(`    DATABASE_URL=${uri}`);
console.log("    APP_DB_NAME=oxygen_console");
console.log("");
console.log("  That URL is stable across restarts, so apps/app/.env.local only");
console.log("  ever needs writing once.");
console.log("");
console.log("  Ctrl-C to stop. Everything in it disappears with the process.");
console.log("");

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

// Hold the process open; the server runs in a child.
await new Promise(() => {});

/**
 * The app, served against a throwaway database, for Playwright.
 *
 * One process rather than three, because Playwright's `webServer` owns exactly
 * one command and the three steps are not independent: the database has to
 * exist before the seed runs, and the seed has to finish before the server
 * accepts a request that assumes a member exists. Three entries would race, and
 * the failure would look like a flaky login.
 *
 * **Everything in this database disappears when the process stops**, which is
 * what makes it safe to seed with a known password and to let tests mutate
 * freely — no cleanup step to forget, and no possibility of a suite passing
 * because of what the previous run left behind.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

const mongo = await MongoMemoryServer.create({ instance: { dbName: "zoblocks_console" } });
const env = {
  ...process.env,
  DATABASE_URL: mongo.getUri(),
  APP_DB_NAME: "zoblocks_console",
  // The fixture the specs assert against. Absolute, because `fontFaceSchema`
  // validates `src` as a URL and a relative path is not one.
  CONSOLE_ASSET_ORIGIN: "http://localhost:6003",
  /*
   * Obviously fake, and present so the webhook route reaches its signature
   * check at all. Without a secret it answers 500 "not configured", which
   * would let a suite assert a refusal it never actually tested.
   */
  STRIPE_SECRET_KEY: "sk_test_e2e_not_a_real_key",
  STRIPE_WEBHOOK_SECRET: "whsec_e2e_not_a_real_secret",
};

/** Run one command to completion, inheriting stdio so failures are visible. */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: app, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)),
    );
  });
}

await run("pnpm", ["exec", "tsx", "scripts/seed-dev.mjs"]);

/*
 * The catalogue as well, and it is not optional decoration.
 *
 * Without it every marketplace screen renders its empty state — which passes an
 * accessibility sweep and a "does it 404" check while covering none of the
 * things those screens are actually made of: the card grid, the evidence
 * panel, the licence, the install controls.
 */
await run("pnpm", ["exec", "tsx", "scripts/seed-market.mjs"]);

const server = spawn("pnpm", ["exec", "next", "start", "--port", "6003"], {
  cwd: app,
  env,
  stdio: "inherit",
});

const stop = async () => {
  server.kill("SIGTERM");
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => {
  void mongo.stop().then(() => process.exit(code ?? 0));
});

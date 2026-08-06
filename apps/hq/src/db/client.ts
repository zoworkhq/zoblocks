import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Lazily constructed. `next build` runs in CI with no DATABASE_URL, and a
 * module-scope connection would fail the build of a repo whose other packages
 * have nothing to do with this app. Nothing connects until a request asks it to.
 */
let cached: ReturnType<typeof create> | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy apps/hq/.env.example to .env.local and point it at your Postgres instance.",
    );
  }

  // max: 1 — every serverless invocation is its own process, so a pool per
  // invocation exhausts Postgres connections fast. Use the pooled connection
  // string from your provider and keep one socket per instance.
  const sql = postgres(url, { max: 1, prepare: false });
  return drizzle(sql, { schema });
}

export function db() {
  cached ??= create();
  return cached;
}

export { schema };

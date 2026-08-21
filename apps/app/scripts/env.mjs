/**
 * Read `.env.local` the way the app does, for the scripts that are not the app.
 *
 * Next loads `.env.local` itself, so every route in the app sees
 * `DATABASE_URL` without anyone thinking about it. A `tsx` script does not —
 * which made the documented sequence in `dev-db.mjs` wrong at its second step:
 * write the URL into `.env.local`, then run `db:seed`, and be told
 * `DATABASE_URL is not set` by a file that plainly sets it.
 *
 * Hand-parsed rather than pulled from Next's internals. This app's `AGENTS.md`
 * is explicit that the Next version here differs from what is widely known, so
 * reaching into `next/dist` for an env loader would be borrowing a private path
 * to save twelve lines. `dotenv` would be a dependency for the same twelve.
 *
 * Deliberately small: `KEY=value`, `#` comments, blank lines, and one layer of
 * surrounding quotes. No interpolation, no multi-line values, no `export`
 * prefixes — anything richer than this belongs in a real secret store rather
 * than in a file next to the source.
 *
 * Existing environment always wins, matching Next and matching the shape of
 * `e2e-server.mjs`, which passes its own ephemeral URL down to the seed.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Loads `.env.local` if it is there. Silent when it is not — that is a valid state. */
export function loadEnvLocal() {
  let raw;
  try {
    raw = readFileSync(path.join(app, ".env.local"), "utf8");
  } catch {
    return;
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;

    const key = trimmed.slice(0, eq).trim();
    if (key in process.env) continue;

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

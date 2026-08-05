/**
 * Development seed. Never run this against production.
 *
 * Creates a small team and a spread of tasks so every state on the board has
 * something in it — overdue, unassigned, blocked, urgent, and a pending signup
 * waiting for approval. Testing a task tracker against an empty database only
 * ever exercises the empty states.
 *
 *   node scripts/seed-dev.mjs
 *
 * Passwords here are obvious placeholders and the accounts are disposable.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  readFileSync(path.join(process.cwd(), ".env.local"), "utf8")
    .split("\n")
    .find((l) => l.trim().startsWith("DATABASE_URL="))
    ?.split("=")
    .slice(1)
    .join("=")
    .trim()
    .replace(/^["']|["']$/g, "");

if (!url) throw new Error("DATABASE_URL not found in env or .env.local");
if (!/localhost|127\.0\.0\.1/.test(url)) {
  throw new Error("Refusing to seed a non-local database.");
}

const sql = postgres(url, { max: 1 });
const hash = await bcrypt.hash("dev-placeholder-passphrase", 12);
const day = 86_400_000;
const now = Date.now();

const team = [
  ["Ada Okafor", "ada@example.com", "admin", "active"],
  ["Ravi Menon", "ravi@example.com", "member", "active"],
  ["Lina Costa", "lina@example.com", "member", "active"],
  ["Sam Iyer", "sam@example.com", "member", "active"],
  ["Jo Bello", "jo@example.com", "member", "pending"],
];

const ids = {};
for (const [name, email, role, status] of team) {
  const [row] = await sql`
    insert into users (name, email, password_hash, role, status, approved_at)
    values (${name}, ${email}, ${hash}, ${role}, ${status},
            ${status === "active" ? new Date() : null})
    on conflict do nothing
    returning id
  `;
  if (row) ids[email] = row.id;
}

const admin = ids["ada@example.com"];
if (!admin) {
  console.log("Users already seeded — skipping tasks.");
  await sql.end();
  process.exit(0);
}

const tasks = [
  ["Publish @oxygenui-design/fhir 0.1.1", "in_progress", "urgent", ids["ada@example.com"], -1],
  ["Deprecate the broken 0.1.0 release", "todo", "high", ids["ada@example.com"], 1],
  ["Wire trusted publishing for npm", "todo", "normal", ids["ravi@example.com"], 5],
  ["Add format:check to CI", "todo", "low", ids["ravi@example.com"], null],
  ["Fix the 'eight components' copy on /pro", "review", "high", ids["lina@example.com"], 0],
  ["Merge the favicon branch", "blocked", "normal", ids["lina@example.com"], -3],
  ["Draft B-01 Assessment Renderer spec", "in_progress", "normal", ids["sam@example.com"], 12],
  ["Find a named clinical reviewer", "todo", "high", null, 21],
  ["Write the sitemap and robots routes", "todo", "low", null, null],
  ["Ship the OG image", "done", "normal", ids["sam@example.com"], -6],
];

for (const [title, status, priority, assignee, dueInDays] of tasks) {
  await sql`
    insert into tasks (title, status, priority, assignee_id, creator_id, due_date, completed_at)
    values (${title}, ${status}, ${priority}, ${assignee ?? null}, ${admin},
            ${dueInDays === null ? null : new Date(now + dueInDays * day)},
            ${status === "done" ? new Date() : null})
  `;
}

console.log(`Seeded ${team.length} people and ${tasks.length} tasks.`);
await sql.end();

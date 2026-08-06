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
import { MongoClient, ObjectId } from "mongodb";

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const line = file.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  return line
    ? line
        .slice(line.indexOf("=") + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
    : "";
}

const uri = connectionString();
if (!uri) throw new Error("DATABASE_URL not found in env or .env.local");
if (!/localhost|127\.0\.0\.1|mongodb:\/\/127/.test(uri)) {
  throw new Error("Refusing to seed a non-local database.");
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.HQ_DB_NAME || "hq");

const hash = await bcrypt.hash("dev-placeholder-passphrase", 12);
const day = 86_400_000;
const now = Date.now();

if ((await db.collection("users").countDocuments()) > 0) {
  console.log("Users already seeded — nothing to do.");
  await client.close();
  process.exit(0);
}

const team = [
  ["Ada Okafor", "ada@example.com", "admin", "active"],
  ["Ravi Menon", "ravi@example.com", "member", "active"],
  ["Lina Costa", "lina@example.com", "member", "active"],
  ["Sam Iyer", "sam@example.com", "member", "active"],
  ["Jo Bello", "jo@example.com", "member", "pending"],
];

const ids = {};
for (const [name, email, role, status] of team) {
  const _id = new ObjectId();
  ids[email] = _id;
  await db.collection("users").insertOne({
    _id,
    name,
    email,
    emailLower: email.toLowerCase(),
    passwordHash: hash,
    role,
    status,
    createdAt: new Date(),
    approvedAt: status === "active" ? new Date() : null,
    approvedBy: null,
  });
}

const admin = ids["ada@example.com"];

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

let seq = 0;
for (const [title, status, priority, assigneeId, dueInDays] of tasks) {
  seq += 1;
  await db.collection("tasks").insertOne({
    _id: new ObjectId(),
    ref: seq,
    title,
    description: null,
    status,
    priority,
    assigneeId: assigneeId ?? null,
    creatorId: admin,
    dueDate: dueInDays === null ? null : new Date(now + dueInDays * day),
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: status === "done" ? new Date() : null,
  });
}

// Keep the counter ahead of what was seeded, or the next task created through
// the UI collides with an existing ref and the unique index rejects it.
await db.collection("counters").updateOne({ _id: "tasks" }, { $set: { seq } }, { upsert: true });

console.log(`Seeded ${team.length} people and ${tasks.length} tasks.`);
await client.close();

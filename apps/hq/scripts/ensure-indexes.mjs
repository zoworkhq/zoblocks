/**
 * Applies hq's indexes. Replaces the SQL migration step.
 *
 * Mongo creates collections on first write, so there is no schema to migrate.
 * What does have to be applied deliberately is the indexes — and two of them
 * are correctness, not speed:
 *
 *   users.emailLower (unique)  stops "Ada@" and "ada@" becoming two accounts
 *   tasks.ref        (unique)  stops two tasks both being called HQ-42
 *
 * Idempotent: safe to run against a live database, and safe to run twice.
 *
 *   pnpm --filter @oxygenui-design/hq db:indexes
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const file = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const line = file.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (!line) return "";
    return line
      .slice(line.indexOf("=") + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
}

const uri = connectionString();
if (!uri) {
  console.error("DATABASE_URL is not set. Pass it in the environment or put it in .env.local.");
  process.exit(1);
}

// Named explicitly, never taken from the connection string. That string is
// shared with the marketing site and its path points at the site's Payload
// database — honouring it would write hq's users into the CMS.
const dbName = process.env.HQ_DB_NAME || "hq";

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const applied = [];

await db
  .collection("users")
  .createIndex({ emailLower: 1 }, { unique: true, name: "users_email_unique" });
applied.push("users.emailLower (unique)");

await db.collection("sessions").createIndex({ userId: 1 }, { name: "sessions_user" });
await db
  .collection("sessions")
  .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "sessions_ttl" });
applied.push("sessions.userId, sessions.expiresAt (TTL)");

await db.collection("tasks").createIndex({ ref: 1 }, { unique: true, name: "tasks_ref_unique" });
await db.collection("tasks").createIndex({ assigneeId: 1 }, { name: "tasks_assignee" });
await db.collection("tasks").createIndex({ status: 1 }, { name: "tasks_status" });
await db.collection("tasks").createIndex({ dueDate: 1, ref: 1 }, { name: "tasks_due_ref" });
applied.push("tasks.ref (unique), tasks.assigneeId, tasks.status, tasks.dueDate+ref");

await db.collection("comments").createIndex({ taskId: 1, createdAt: 1 }, { name: "comments_task" });
applied.push("comments.taskId+createdAt");

await db
  .collection("activity")
  .createIndex({ taskId: 1, createdAt: -1 }, { name: "activity_task" });
applied.push("activity.taskId+createdAt");

await db.collection("password_resets").createIndex({ userId: 1 }, { name: "resets_user" });
await db
  .collection("password_resets")
  .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "resets_ttl" });
applied.push("password_resets.userId, password_resets.expiresAt (TTL)");

await db
  .collection("login_attempts")
  .createIndex({ key: 1, createdAt: -1 }, { name: "attempts_key" });
await db
  .collection("login_attempts")
  .createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600, name: "attempts_ttl" });
applied.push("login_attempts.key+createdAt, login_attempts.createdAt (TTL 1h)");

console.log(`Indexes applied to "${dbName}":`);
for (const line of applied) console.log(`  ${line}`);

await client.close();

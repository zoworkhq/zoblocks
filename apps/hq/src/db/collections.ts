/**
 * hq document shapes and indexes.
 *
 * MongoDB, sharing the cluster the marketing site already uses — one database
 * technology for the company rather than two. hq gets its own *database* inside
 * that cluster, never the site's, so nothing here can collide with Payload's
 * collections.
 *
 * Mongo does not enforce relationships, so two things that were guarantees
 * under Postgres are now conventions this file has to state plainly:
 *
 *   - **Nothing referenced is ever deleted.** Users are disabled, not removed,
 *     because tasks, comments, and activity point at them and there is no
 *     foreign key to stop an orphan. That was already the design; it is now
 *     load-bearing rather than merely tidy.
 *   - **Shapes are validated in the application**, by zod at every entry point.
 *     The types below describe what is written; they cannot enforce it.
 *
 * One thing genuinely better here than in the SQL version: sessions, reset
 * grants, and failed sign-in attempts expire through TTL indexes instead of
 * needing a sweep.
 */

import type { Collection, Db, ObjectId } from "mongodb";

export type UserRole = "admin" | "member";
export type UserStatus = "pending" | "active" | "disabled";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface UserDoc {
  _id: ObjectId;
  name: string;
  /** As entered, for display. */
  email: string;
  /**
   * Lowercased, and the only thing the unique index covers. Storing both keeps
   * "Ada@" readable on screen while making it impossible for "Ada@" and "ada@"
   * to become two accounts — the case that would silently split one person's
   * task list in two.
   */
  emailLower: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  approvedAt: Date | null;
  approvedBy: ObjectId | null;
}

export interface SessionDoc {
  /** SHA-256 of the cookie value. The value itself is never stored. */
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
  userAgent: string | null;
}

export interface TaskDoc {
  _id: ObjectId;
  /** Human reference — "HQ-42". Allocated by an atomic counter, see nextRef. */
  ref: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ObjectId | null;
  creatorId: ObjectId;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface CommentDoc {
  _id: ObjectId;
  taskId: ObjectId;
  authorId: ObjectId;
  body: string;
  createdAt: Date;
}

export interface ActivityDoc {
  _id: ObjectId;
  taskId: ObjectId;
  actorId: ObjectId | null;
  kind: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
}

export interface PasswordResetDoc {
  /** SHA-256 of the token. */
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
  usedAt: Date | null;
  createdBy: ObjectId | null;
  createdAt: Date;
}

export interface LoginAttemptDoc {
  _id: ObjectId;
  /** "email:someone@example.com" or "ip:1.2.3.4". */
  key: string;
  createdAt: Date;
}

/** Sequence allocator. One document per counted thing. */
export interface CounterDoc {
  _id: string;
  seq: number;
}

export interface Collections {
  users: Collection<UserDoc>;
  sessions: Collection<SessionDoc>;
  tasks: Collection<TaskDoc>;
  comments: Collection<CommentDoc>;
  activity: Collection<ActivityDoc>;
  passwordResets: Collection<PasswordResetDoc>;
  loginAttempts: Collection<LoginAttemptDoc>;
  counters: Collection<CounterDoc>;
}

export function collections(db: Db): Collections {
  return {
    users: db.collection<UserDoc>("users"),
    sessions: db.collection<SessionDoc>("sessions"),
    tasks: db.collection<TaskDoc>("tasks"),
    comments: db.collection<CommentDoc>("comments"),
    activity: db.collection<ActivityDoc>("activity"),
    passwordResets: db.collection<PasswordResetDoc>("password_resets"),
    loginAttempts: db.collection<LoginAttemptDoc>("login_attempts"),
    counters: db.collection<CounterDoc>("counters"),
  };
}

/**
 * Idempotent. This replaces the migration step: Mongo creates collections on
 * first write, so the only thing that has to be applied deliberately is the
 * indexes — and the two that are not merely performance.
 *
 *   `users.emailLower` unique  — the account-splitting guard above.
 *   `tasks.ref` unique         — two tasks called HQ-42 would be worse than
 *                                a gap in the sequence.
 */
export async function ensureIndexes(db: Db): Promise<string[]> {
  const c = collections(db);
  const created: string[] = [];
  const note = (what: string) => created.push(what);

  await c.users.createIndex({ emailLower: 1 }, { unique: true, name: "users_email_unique" });
  note("users.emailLower (unique)");

  await c.sessions.createIndex({ userId: 1 }, { name: "sessions_user" });
  // TTL: Mongo drops the row once expiresAt passes, so an abandoned session
  // stops being a row someone has to remember to clean up.
  await c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "sessions_ttl" });
  note("sessions.userId, sessions.expiresAt (TTL)");

  await c.tasks.createIndex({ ref: 1 }, { unique: true, name: "tasks_ref_unique" });
  await c.tasks.createIndex({ assigneeId: 1 }, { name: "tasks_assignee" });
  await c.tasks.createIndex({ status: 1 }, { name: "tasks_status" });
  await c.tasks.createIndex({ dueDate: 1, ref: 1 }, { name: "tasks_due_ref" });
  note("tasks.ref (unique), tasks.assigneeId, tasks.status, tasks.dueDate+ref");

  await c.comments.createIndex({ taskId: 1, createdAt: 1 }, { name: "comments_task" });
  note("comments.taskId+createdAt");

  await c.activity.createIndex({ taskId: 1, createdAt: -1 }, { name: "activity_task" });
  note("activity.taskId+createdAt");

  await c.passwordResets.createIndex({ userId: 1 }, { name: "resets_user" });
  await c.passwordResets.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "resets_ttl" },
  );
  note("password_resets.userId, password_resets.expiresAt (TTL)");

  await c.loginAttempts.createIndex({ key: 1, createdAt: -1 }, { name: "attempts_key" });
  // An hour after the fact a failed attempt is no longer evidence of anything
  // the throttle cares about — its window is fifteen minutes.
  await c.loginAttempts.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600, name: "attempts_ttl" },
  );
  note("login_attempts.key+createdAt, login_attempts.createdAt (TTL 1h)");

  return created;
}

/**
 * Allocates the next task reference.
 *
 * Postgres had `serial`; Mongo has no equivalent, and reading max(ref)+1 races
 * two people creating a task at once into the same number. `$inc` inside
 * findOneAndUpdate is atomic on a single document, which is exactly the
 * guarantee needed.
 */
export async function nextRef(db: Db, name = "tasks"): Promise<number> {
  const doc = await collections(db).counters.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("Could not allocate a task reference.");
  return doc.seq;
}

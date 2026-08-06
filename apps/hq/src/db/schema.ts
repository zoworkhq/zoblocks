/**
 * hq schema.
 *
 * Deliberately small. Five tables cover the daily loop for a team of this size;
 * estimates, sprints, custom fields, and attachments are all absent on purpose.
 * Each one is easy to add later and each one added now doubles the surface.
 */

import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "member"]);

/**
 * `pending` is the default for every self-signup. Nothing is readable until an
 * admin approves, so the open signup form grants no access on its own.
 * `disabled` is the offboarding state — it is kept rather than deleting the
 * row, because tasks and comments reference the author.
 */
export const userStatus = pgEnum("user_status", ["pending", "active", "disabled"]);

export const taskStatus = pgEnum("task_status", [
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
]);

export const taskPriority = pgEnum("task_priority", ["low", "normal", "high", "urgent"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("member"),
    status: userStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedBy: uuid("approved_by"),
  },
  (t) => [
    // Case-insensitive uniqueness: Ada@ and ada@ are one person, and letting
    // both exist would silently split someone's task list in two.
    uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
  ],
);

/**
 * Sessions live in the database rather than in a signed JWT, so that disabling
 * an account ends its sessions on the next request. A stateless token cannot be
 * revoked, which is the wrong trade for an internal tool where offboarding is
 * the security event that actually happens.
 *
 * `id` stores a SHA-256 hash of the cookie value, never the value itself — a
 * dump of this table does not hand anyone a working session.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/**
 * Single-use password reset grants, issued by an admin.
 *
 * There is no mail service here, so the usual "email me a link" flow does not
 * exist. An admin mints a link and hands it over in person or over whatever
 * channel they already trust — which for a team this size is a stronger
 * identity check than an email inbox anyway.
 *
 * `id` is a SHA-256 of the token, never the token itself. `usedAt` makes the
 * grant single-use rather than replayable for its whole lifetime.
 */
export const passwordResets = pgTable(
  "password_resets",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("password_resets_user_idx").on(t.userId)],
);

/**
 * Failed sign-in attempts, for throttling.
 *
 * Keyed by a string rather than a user id so the same table can hold both
 * "email:someone@example.com" and "ip:1.2.3.4". Throttling only by account
 * lets anyone lock a colleague out by guessing at their address; throttling
 * only by address lets a single attacker walk the whole user list from one
 * connection. Both keys are counted, and either one can trip.
 *
 * Rows are recorded for failures only, and cleared on success.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_key_idx").on(t.key, t.createdAt)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("projects_key_idx").on(t.key)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Human reference — "HQ-42" in conversation. A UUID is unusable out loud.
    ref: serial("ref").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatus("status").notNull().default("todo"),
    priority: taskPriority("priority").notNull().default("normal"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("tasks_assignee_idx").on(t.assigneeId),
    index("tasks_status_idx").on(t.status),
    uniqueIndex("tasks_ref_idx").on(t.ref),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("comments_task_idx").on(t.taskId)],
);

/**
 * Every state change is recorded. Who moved a task, when, and from what — the
 * question "why is this still open" is unanswerable without it.
 */
export const activity = pgTable(
  "activity",
  {
    id: serial("id").primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    kind: text("kind").notNull(),
    fromValue: text("from_value"),
    toValue: text("to_value"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_task_idx").on(t.taskId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  assigned: many(tasks, { relationName: "assignee" }),
  created: many(tasks, { relationName: "creator" }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  creator: one(users, {
    fields: [tasks.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  comments: many(comments),
  activity: many(activity),
}));

export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type TaskStatus = (typeof taskStatus.enumValues)[number];
export type TaskPriority = (typeof taskPriority.enumValues)[number];
export type UserRole = (typeof userRole.enumValues)[number];

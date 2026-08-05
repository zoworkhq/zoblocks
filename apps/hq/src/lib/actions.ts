"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { activity, comments, tasks, users } from "@/db/schema";
import { createSession, currentUser, destroySession, hashPassword, verifyPassword } from "./auth";

/** One message for every failure mode, so the form cannot enumerate accounts. */
const SIGNIN_FAILED = "That email and password combination is not recognised.";

/**
 * Sign-in accepts any non-empty password. Enforcing a minimum length here
 * would reject the credential before ever checking it, locking out anyone
 * whose password predates the rule — a policy about what you may *choose*
 * is not a policy about what you may *present*.
 */
const signInInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

/** Length is a signup-time rule, where it actually governs the choice. */
const signupInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters."),
  name: z.string().trim().min(2, "Enter your full name."),
});

export type FormState = { error?: string; notice?: string };

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signupInput.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { name, email, password } = parsed.data;

  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  // Same wording whether or not the address exists — an open signup form that
  // says "already registered" is an account-enumeration oracle.
  if (existing.length > 0) {
    return { notice: "If that address is new, an admin has been asked to approve it." };
  }

  // Bootstrap: the first account has to be an approved admin, or there is
  // nobody with the authority to approve anyone. Every later signup is pending.
  const totals = await db().select({ value: count() }).from(users);
  const first = (totals[0]?.value ?? 0) === 0;

  await db()
    .insert(users)
    .values({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: first ? "admin" : "member",
      status: first ? "active" : "pending",
      approvedAt: first ? new Date() : null,
    });

  if (first) redirect("/login?bootstrapped=1");
  return { notice: "If that address is new, an admin has been asked to approve it." };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signInInput.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: SIGNIN_FAILED };
  const { email, password } = parsed.data;

  const rows = await db()
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
  const user = rows[0];

  // Hash even when the user is missing, so a wrong address and a wrong password
  // take the same time and cannot be told apart by a stopwatch.
  const hash =
    user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const ok = await verifyPassword(password, hash);

  if (!user || !ok) return { error: SIGNIN_FAILED };
  if (user.status === "pending") {
    return { error: "This account is waiting for an admin to approve it." };
  }
  if (user.status === "disabled") return { error: SIGNIN_FAILED };

  await createSession(user.id);
  redirect("/tasks");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}

async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Admin only.");
  return user;
}

const taskInput = z.object({
  title: z.string().trim().min(3, "Give the task a title."),
  description: z.string().trim().max(5000).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  dueDate: z.string().optional(),
});

export async function createTask(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = taskInput.safeParse({
    title: form.get("title"),
    description: form.get("description") || undefined,
    assigneeId: form.get("assigneeId") || "",
    priority: form.get("priority") || "normal",
    dueDate: form.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { title, description, assigneeId, priority, dueDate } = parsed.data;

  const [task] = await db()
    .insert(tasks)
    .values({
      title,
      description: description ?? null,
      assigneeId: assigneeId ? assigneeId : null,
      creatorId: admin.id,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    })
    .returning({ id: tasks.id });

  if (task) {
    await db().insert(activity).values({
      taskId: task.id,
      actorId: admin.id,
      kind: "created",
      toValue: title,
    });
  }

  revalidatePath("/board");
  revalidatePath("/tasks");
  return { notice: "Task created." };
}

const statusInput = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "blocked", "review", "done"]),
});

/**
 * Members may move their own tasks; admins may move anyone's. Enforced here on
 * the server, not by hiding the control — a hidden button is not a permission.
 */
export async function setTaskStatus(form: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = statusInput.safeParse({
    taskId: form.get("taskId"),
    status: form.get("status"),
  });
  if (!parsed.success) throw new Error("Invalid status change.");
  const { taskId, status } = parsed.data;

  const rows = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId !== user.id) {
    throw new Error("You can only move tasks assigned to you.");
  }
  if (task.status === status) return;

  await db()
    .update(tasks)
    .set({
      status,
      updatedAt: new Date(),
      completedAt: status === "done" ? new Date() : null,
    })
    .where(eq(tasks.id, taskId));

  await db().insert(activity).values({
    taskId,
    actorId: user.id,
    kind: "status",
    fromValue: task.status,
    toValue: status,
  });

  revalidatePath("/tasks");
  revalidatePath("/board");
}

/**
 * Inline add from a group header. Title only — the group supplies the status,
 * and anything else can be set from the row once it exists. Making people fill
 * a six-field form to capture a thought is how a backlog stops being current.
 */
export async function quickAddTask(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const title = z.string().trim().min(1).max(300).safeParse(form.get("title"));
  if (!title.success) return;

  const status = z
    .enum(["todo", "in_progress", "blocked", "review", "done"])
    .catch("todo")
    .parse(form.get("status"));

  const rawAssignee = form.get("assigneeId");
  const assigneeId =
    typeof rawAssignee === "string" && rawAssignee !== ""
      ? z.string().uuid().parse(rawAssignee)
      : null;

  const [task] = await db()
    .insert(tasks)
    .values({ title: title.data, status, creatorId: admin.id, assigneeId })
    .returning({ id: tasks.id });

  if (task) {
    await db()
      .insert(activity)
      .values({ taskId: task.id, actorId: admin.id, kind: "created", toValue: title.data });
  }

  revalidatePath("/board");
  revalidatePath("/tasks");
}

/** Checkbox on the row. Toggling back out of done returns it to `todo`. */
export async function toggleDone(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = z.string().uuid().parse(form.get("taskId"));

  const rows = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId !== user.id) {
    throw new Error("You can only complete tasks assigned to you.");
  }

  const next = task.status === "done" ? "todo" : "done";
  await db()
    .update(tasks)
    .set({
      status: next,
      updatedAt: new Date(),
      completedAt: next === "done" ? new Date() : null,
    })
    .where(eq(tasks.id, taskId));

  await db().insert(activity).values({
    taskId,
    actorId: user.id,
    kind: "status",
    fromValue: task.status,
    toValue: next,
  });

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function addComment(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = z.string().uuid().parse(form.get("taskId"));
  const body = z.string().trim().min(1).max(5000).safeParse(form.get("body"));
  if (!body.success) return;

  await db().insert(comments).values({ taskId, authorId: user.id, body: body.data });

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function setPriority(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = z.string().uuid().parse(form.get("taskId"));
  const priority = z.enum(["low", "normal", "high", "urgent"]).parse(form.get("priority"));

  const rows = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId !== user.id) {
    throw new Error("You can only change priority on tasks assigned to you.");
  }

  await db().update(tasks).set({ priority, updatedAt: new Date() }).where(eq(tasks.id, taskId));
  await db().insert(activity).values({
    taskId,
    actorId: user.id,
    kind: "priority",
    fromValue: task.priority,
    toValue: priority,
  });

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function assignTask(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const taskId = z.string().uuid().parse(form.get("taskId"));
  const raw = form.get("assigneeId");
  const assigneeId = raw && raw !== "" ? z.string().uuid().parse(raw) : null;

  const rows = await db().select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = rows[0];
  if (!task) throw new Error("Task not found.");

  await db().update(tasks).set({ assigneeId, updatedAt: new Date() }).where(eq(tasks.id, taskId));

  await db().insert(activity).values({
    taskId,
    actorId: admin.id,
    kind: "assigned",
    fromValue: task.assigneeId,
    toValue: assigneeId,
  });

  revalidatePath("/board");
  revalidatePath("/tasks");
}

/** Approve a pending signup and set their role in one step. */
export async function approveUser(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = z.string().uuid().parse(form.get("userId"));
  const role = z.enum(["admin", "member"]).parse(form.get("role") ?? "member");

  await db()
    .update(users)
    .set({ status: "active", role, approvedAt: new Date(), approvedBy: admin.id })
    .where(eq(users.id, userId));

  revalidatePath("/admin/people");
}

export async function setUserRole(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = z.string().uuid().parse(form.get("userId"));
  const role = z.enum(["admin", "member"]).parse(form.get("role"));

  // Guard against an admin demoting themselves into a system with no admins.
  if (userId === admin.id && role !== "admin") {
    const adminRows = await db()
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.status, "active")));
    if ((adminRows[0]?.value ?? 0) <= 1) {
      throw new Error("You are the only admin — promote someone else first.");
    }
  }

  await db().update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin/people");
}

/**
 * Disabling rather than deleting: tasks, comments, and activity reference the
 * author, and the record of who did what has to survive someone leaving.
 */
export async function setUserStatus(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = z.string().uuid().parse(form.get("userId"));
  const status = z.enum(["active", "disabled"]).parse(form.get("status"));

  if (userId === admin.id && status === "disabled") {
    throw new Error("You cannot disable your own account.");
  }

  await db().update(users).set({ status }).where(eq(users.id, userId));
  revalidatePath("/admin/people");
}

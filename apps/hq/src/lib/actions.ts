"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { database, db } from "@/db/client";
import { claimFirstAdmin, nextRef, type TaskPriority, type TaskStatus } from "@/db/collections";
import { objectId } from "./ids";
import {
  changePassword,
  clearFailures,
  consumePasswordReset,
  createPasswordReset,
  createSession,
  currentSessionToken,
  currentUser,
  destroySession,
  hashPassword,
  isThrottled,
  recordFailure,
  verifyPassword,
} from "./auth";

/** One message for every failure mode, so the form cannot enumerate accounts. */
const SIGNIN_FAILED = "That email and password combination is not recognised.";

const STATUSES = ["todo", "in_progress", "blocked", "review", "done"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

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
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters."),
  name: z.string().trim().min(2, "Enter your full name."),
});

export type FormState = { error?: string; notice?: string; link?: string };

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
  const emailLower = email.toLowerCase();

  const { users } = db();
  const _id = new ObjectId();

  // Is this plausibly the first account? Read before the insert, deliberately:
  // afterwards, two simultaneous signups each see the other and both conclude a
  // team already exists, which leaves an instance with no administrator at all.
  //
  // Exact rather than estimated. `estimatedDocumentCount` reads collection
  // metadata, which is allowed to be stale, and wrong in the low direction it
  // would hand an established team a brand-new administrator.
  const couldBeFirst = (await users.countDocuments({}, { limit: 1 })) === 0;

  // Everyone is inserted pending. Admin is granted afterwards, and only to the
  // account that wins the claim below — so a failure here can never consume the
  // one-time bootstrap, and a signup is never admin merely because it was fast.
  try {
    await users.insertOne({
      _id,
      name,
      email,
      emailLower,
      passwordHash: await hashPassword(password),
      role: "member",
      status: "pending",
      createdAt: new Date(),
      approvedAt: null,
      approvedBy: null,
    });
  } catch (error) {
    // The unique index on emailLower is what decides, not a prior read: two
    // signups racing on the same address would both pass a check-then-insert.
    // Duplicate and success return the same message either way, so the form
    // never reveals whether an address is already registered.
    if ((error as { code?: number }).code === 11000) {
      return { notice: "If that address is new, an admin has been asked to approve it." };
    }
    throw error;
  }

  // Bootstrap: the first account has to be an approved admin, or there is
  // nobody with the authority to approve anyone.
  //
  // Eligibility above is not sufficient on its own — it is a read, and two
  // people signing up in the same moment both pass it. That is not a hypothetical
  // ordering: it is what happens when a team is told the tool is ready. The
  // claim is atomic and has exactly one winner, so it, not the read, is what
  // decides who holds administrative power over the instance.
  if (couldBeFirst && (await claimFirstAdmin(database()))) {
    await users.updateOne(
      { _id },
      { $set: { role: "admin", status: "active", approvedAt: new Date() } },
    );
    redirect("/login?bootstrapped=1");
  }

  return { notice: "If that address is new, an admin has been asked to approve it." };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signInInput.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: SIGNIN_FAILED };
  const { email, password } = parsed.data;

  // Checked before the password, so a guessing run costs nothing to refuse.
  if (await isThrottled(email)) {
    return { error: "Too many failed attempts. Wait a few minutes and try again." };
  }

  const user = await db().users.findOne({ emailLower: email });

  // Hash even when the user is missing, so a wrong address and a wrong password
  // take the same time and cannot be told apart by a stopwatch.
  const hash =
    user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const ok = await verifyPassword(password, hash);

  if (!user || !ok) {
    await recordFailure(email);
    return { error: SIGNIN_FAILED };
  }
  if (user.status === "pending") {
    return { error: "This account is waiting for an admin to approve it." };
  }
  if (user.status === "disabled") {
    await recordFailure(email);
    return { error: SIGNIN_FAILED };
  }

  await clearFailures(email);
  await createSession(user._id);
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

async function logActivity(
  taskId: ObjectId,
  actorId: ObjectId | null,
  kind: string,
  fromValue: string | null,
  toValue: string | null,
): Promise<void> {
  await db().activity.insertOne({
    _id: new ObjectId(),
    taskId,
    actorId,
    kind,
    fromValue,
    toValue,
    createdAt: new Date(),
  });
}

const taskInput = z.object({
  title: z.string().trim().min(3, "Give the task a title."),
  description: z.string().trim().max(5000).optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(PRIORITIES).default("normal"),
  dueDate: z.string().optional(),
});

export async function createTask(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = taskInput.safeParse({
    title: form.get("title"),
    description: form.get("description") || undefined,
    assigneeId: form.get("assigneeId") || undefined,
    priority: form.get("priority") || "normal",
    dueDate: form.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const { title, description, assigneeId, priority, dueDate } = parsed.data;

  const _id = new ObjectId();
  await db().tasks.insertOne({
    _id,
    ref: await nextRef(database()),
    title,
    description: description ?? null,
    status: "todo",
    priority,
    assigneeId: assigneeId ? objectId.parse(assigneeId) : null,
    creatorId: new ObjectId(admin.id),
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  });

  await logActivity(_id, new ObjectId(admin.id), "created", null, title);

  revalidatePath("/board");
  revalidatePath("/tasks");
  return { notice: "Task created." };
}

/**
 * Members may move their own tasks; admins may move anyone's. Enforced here on
 * the server, not by hiding the control — a hidden button is not a permission.
 */
export async function setTaskStatus(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = objectId.parse(form.get("taskId"));
  const status = z.enum(STATUSES).parse(form.get("status"));

  const task = await db().tasks.findOne({ _id: taskId });
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId?.toHexString() !== user.id) {
    throw new Error("You can only move tasks assigned to you.");
  }
  if (task.status === status) return;

  await db().tasks.updateOne(
    { _id: taskId },
    {
      $set: {
        status,
        updatedAt: new Date(),
        completedAt: status === "done" ? new Date() : null,
      },
    },
  );

  await logActivity(taskId, new ObjectId(user.id), "status", task.status, status);

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
    .enum(STATUSES)
    .catch("todo" as TaskStatus)
    .parse(form.get("status"));
  const rawAssignee = form.get("assigneeId");
  const assigneeId =
    typeof rawAssignee === "string" && rawAssignee !== "" ? objectId.parse(rawAssignee) : null;

  const _id = new ObjectId();
  await db().tasks.insertOne({
    _id,
    ref: await nextRef(database()),
    title: title.data,
    description: null,
    status,
    priority: "normal",
    assigneeId,
    creatorId: new ObjectId(admin.id),
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  });

  await logActivity(_id, new ObjectId(admin.id), "created", null, title.data);

  revalidatePath("/board");
  revalidatePath("/tasks");
}

/** Checkbox on the row. Toggling back out of done returns it to `todo`. */
export async function toggleDone(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = objectId.parse(form.get("taskId"));

  const task = await db().tasks.findOne({ _id: taskId });
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId?.toHexString() !== user.id) {
    throw new Error("You can only complete tasks assigned to you.");
  }

  const next: TaskStatus = task.status === "done" ? "todo" : "done";
  await db().tasks.updateOne(
    { _id: taskId },
    {
      $set: {
        status: next,
        updatedAt: new Date(),
        completedAt: next === "done" ? new Date() : null,
      },
    },
  );

  await logActivity(taskId, new ObjectId(user.id), "status", task.status, next);

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function addComment(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = objectId.parse(form.get("taskId"));
  const body = z.string().trim().min(1).max(5000).safeParse(form.get("body"));
  if (!body.success) return;

  // A well-formed id is not a task. Any member may comment, so no owner check.
  const task = await db().tasks.findOne({ _id: taskId }, { projection: { _id: 1 } });
  if (!task) throw new Error("Task not found.");

  await db().comments.insertOne({
    _id: new ObjectId(),
    taskId,
    authorId: new ObjectId(user.id),
    body: body.data,
    createdAt: new Date(),
  });

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function setPriority(form: FormData): Promise<void> {
  const user = await requireUser();
  const taskId = objectId.parse(form.get("taskId"));
  const priority = z.enum(PRIORITIES).parse(form.get("priority")) as TaskPriority;

  const task = await db().tasks.findOne({ _id: taskId });
  if (!task) throw new Error("Task not found.");
  if (user.role !== "admin" && task.assigneeId?.toHexString() !== user.id) {
    throw new Error("You can only change priority on tasks assigned to you.");
  }

  await db().tasks.updateOne({ _id: taskId }, { $set: { priority, updatedAt: new Date() } });
  await logActivity(taskId, new ObjectId(user.id), "priority", task.priority, priority);

  revalidatePath("/board");
  revalidatePath("/tasks");
}

export async function assignTask(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const taskId = objectId.parse(form.get("taskId"));
  const raw = form.get("assigneeId");
  const assigneeId = raw && raw !== "" ? objectId.parse(raw) : null;

  const task = await db().tasks.findOne({ _id: taskId });
  if (!task) throw new Error("Task not found.");

  await db().tasks.updateOne({ _id: taskId }, { $set: { assigneeId, updatedAt: new Date() } });
  await logActivity(
    taskId,
    new ObjectId(admin.id),
    "assigned",
    task.assigneeId?.toHexString() ?? null,
    assigneeId?.toHexString() ?? null,
  );

  revalidatePath("/board");
  revalidatePath("/tasks");
}

/** Approve a pending signup and set their role in one step. */
export async function approveUser(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = objectId.parse(form.get("userId"));
  const role = z.enum(["admin", "member"]).parse(form.get("role") ?? "member");

  await db().users.updateOne(
    { _id: userId },
    {
      $set: {
        status: "active",
        role,
        approvedAt: new Date(),
        approvedBy: new ObjectId(admin.id),
      },
    },
  );

  revalidatePath("/admin/people");
}

/**
 * Mint a reset link for someone who is locked out.
 *
 * The link is returned to the admin's screen and never sent anywhere — there
 * is no mail service, and for a team this size handing it over on a channel you
 * already trust is a stronger identity check than an inbox. It is shown once;
 * only its hash is stored, so it cannot be looked up later.
 */
export async function issuePasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const userId = objectId.parse(form.get("userId"));

  const target = await db().users.findOne({ _id: userId });
  if (!target) return { error: "That account no longer exists." };
  if (target.status !== "active") {
    return { error: "Approve or re-enable the account first — a reset cannot revive it." };
  }

  const { token } = await createPasswordReset(userId, new ObjectId(admin.id));
  // Relative on purpose: the admin's own origin is the right one, and building
  // an absolute URL would need a base that differs per environment.
  return {
    link: `/reset/${token}`,
    notice: `One-time link for ${target.name}, valid for 1 hour. It is shown once.`,
  };
}

/** Public: spends a reset grant. Rejects a spent, expired, or unknown token. */
export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const token = z.string().min(1).safeParse(form.get("token"));
  const password = z
    .string()
    .min(12, "Use at least 12 characters.")
    .safeParse(form.get("password"));
  const confirm = form.get("confirm");

  if (!token.success) return { error: "This link is not valid." };
  if (!password.success) {
    return { error: password.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (password.data !== confirm) return { error: "The two passwords do not match." };

  const ok = await consumePasswordReset(token.data, password.data);
  if (!ok) {
    return { error: "This link has expired or has already been used. Ask an admin for a new one." };
  }

  redirect("/login?reset=1");
}

/** Signed-in change. Requires the current password, so a borrowed screen is not enough. */
export async function changeOwnPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const current = z.string().min(1).safeParse(form.get("current"));
  const next = z.string().min(12, "Use at least 12 characters.").safeParse(form.get("password"));
  if (!current.success) return { error: "Enter your current password." };
  if (!next.success) {
    return { error: next.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (next.data !== form.get("confirm")) return { error: "The two passwords do not match." };

  const keep = await currentSessionToken();
  const ok = await changePassword(new ObjectId(user.id), current.data, next.data, keep);
  if (!ok) return { error: "That current password is not right." };

  await clearFailures(user.email.toLowerCase());
  return { notice: "Password changed. Any other devices have been signed out." };
}

export async function setUserRole(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = objectId.parse(form.get("userId"));
  const role = z.enum(["admin", "member"]).parse(form.get("role"));

  // Guard against an admin demoting themselves into a system with no admins.
  if (userId.toHexString() === admin.id && role !== "admin") {
    const admins = await db().users.countDocuments({ role: "admin", status: "active" });
    if (admins <= 1) throw new Error("You are the only admin — promote someone else first.");
  }

  await db().users.updateOne({ _id: userId }, { $set: { role } });
  revalidatePath("/admin/people");
}

/**
 * Disabling rather than deleting: tasks, comments, and activity reference the
 * author, and the record of who did what has to survive someone leaving. Mongo
 * would not stop a delete from orphaning all three, which makes this choice
 * load-bearing rather than merely tidy.
 */
export async function setUserStatus(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = objectId.parse(form.get("userId"));
  const status = z.enum(["active", "disabled"]).parse(form.get("status"));

  if (userId.toHexString() === admin.id && status === "disabled") {
    throw new Error("You cannot disable your own account.");
  }

  await db().users.updateOne({ _id: userId }, { $set: { status } });
  revalidatePath("/admin/people");
}

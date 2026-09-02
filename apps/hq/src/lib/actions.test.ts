import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { form, PASSWORD, seedUser } from "../../test/harness";
import { captureRedirect } from "../../test/stubs/next-navigation";
import { __setRequestHeader } from "../../test/stubs/next-headers";
import { createSession } from "./auth";
import {
  addComment,
  approveUser,
  assignTask,
  changeOwnPassword,
  createTask,
  issuePasswordReset,
  quickAddTask,
  resetPassword,
  setPriority,
  setTaskStatus,
  setUserRole,
  setUserStatus,
  signIn,
  signUp,
  toggleDone,
} from "./actions";

const STRONG = "a-sufficiently-long-passphrase";

async function signedInAs(overrides: Parameters<typeof seedUser>[0] = {}) {
  const user = await seedUser(overrides);
  await createSession(user._id);
  return user;
}

async function makeTask(creator: ObjectId, assigneeId: ObjectId | null) {
  const _id = new ObjectId();
  await db().tasks.insertOne({
    _id,
    ref: 1,
    title: "Write the thing",
    description: null,
    status: "todo",
    priority: "normal",
    assigneeId,
    creatorId: creator,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  });
  return _id;
}

describe("signUp", () => {
  it("makes the very first account an approved admin", async () => {
    const url = await captureRedirect(() =>
      signUp({}, form({ name: "First Person", email: "first@example.org", password: STRONG })),
    );

    expect(url).toBe("/login?bootstrapped=1");
    const user = await db().users.findOne({ emailLower: "first@example.org" });
    expect(user).toMatchObject({ role: "admin", status: "active" });
    expect(user?.approvedAt).toBeInstanceOf(Date);
  });

  it("leaves every later signup pending, as a member", async () => {
    await seedUser({ role: "admin" });

    const result = await signUp(
      {},
      form({ name: "Second Person", email: "second@example.org", password: STRONG }),
    );

    expect(result.notice).toBeTruthy();
    expect(await db().users.findOne({ emailLower: "second@example.org" })).toMatchObject({
      role: "member",
      status: "pending",
    });
  });

  /**
   * The bootstrap decides who is an administrator, so it must be decided once.
   * Two people signing up in the same moment is exactly what happens when a
   * team is told "the tool is up, go sign in".
   */
  it("hands admin to exactly one of a crowd signing up at the same moment", async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        captureRedirect(() =>
          signUp(
            {},
            form({ name: `Racer ${i}`, email: `racer${i}@example.org`, password: STRONG }),
          ),
        ),
      ),
    );

    expect(await db().users.countDocuments({})).toBe(8);
    expect(await db().users.countDocuments({ role: "admin" })).toBe(1);
    expect(await db().users.countDocuments({ status: "active" })).toBe(1);
    expect(await db().users.countDocuments({ status: "pending" })).toBe(7);
  });

  /**
   * The winner is a real account, not a half-written one: it is the same
   * document that was inserted, promoted in place.
   */
  it("promotes the account that won, not some other row", async () => {
    await Promise.all([
      captureRedirect(() =>
        signUp({}, form({ name: "Ada Racer", email: "a@example.org", password: STRONG })),
      ),
      captureRedirect(() =>
        signUp({}, form({ name: "Bo Racer", email: "b@example.org", password: STRONG })),
      ),
    ]);

    /*
     * Scoped to this test's own two accounts.
     *
     * It used to ask the collection for "the admin", full stop, and when the
     * eight-way race above timed out its in-flight inserts landed after the
     * afterEach cleanup — so this test failed reporting `racer1@example.org`,
     * naming a row it had never created and a test that was not this one. The
     * timeout is fixed by the bcrypt cost; this makes the assertion answer for
     * its own subject either way.
     */
    const racers = ["a@example.org", "b@example.org"];
    const admin = await db().users.findOne({ role: "admin", emailLower: { $in: racers } });
    expect(admin?.approvedAt).toBeInstanceOf(Date);
    expect(racers).toContain(admin?.emailLower);
    expect(await db().users.findOne({ role: "member" })).toMatchObject({
      status: "pending",
      approvedAt: null,
    });
  });

  /**
   * The claim is spent once and never re-armed, so emptying the users
   * collection does not re-open the bootstrap. That is the safe direction — but
   * it means a wiped instance has no route back to an admin through the UI, and
   * recovery is an operator deleting the `bootstrap` counter document.
   */
  it("does not re-open the bootstrap after the users collection is emptied", async () => {
    await captureRedirect(() =>
      signUp({}, form({ name: "First", email: "first@example.org", password: STRONG })),
    );
    await db().users.deleteMany({});

    await captureRedirect(() =>
      signUp({}, form({ name: "After", email: "after@example.org", password: STRONG })),
    );

    expect(await db().users.findOne({ emailLower: "after@example.org" })).toMatchObject({
      role: "member",
      status: "pending",
    });
  });

  it("never bootstraps a second admin once a team exists", async () => {
    await seedUser({ role: "member", status: "active" });

    await captureRedirect(() =>
      signUp({}, form({ name: "Latecomer", email: "late@example.org", password: STRONG })),
    );

    expect(await db().users.findOne({ emailLower: "late@example.org" })).toMatchObject({
      role: "member",
      status: "pending",
    });
  });

  /** The unique index decides, so a race cannot produce two of the same address. */
  it("refuses a duplicate address without revealing that it is taken", async () => {
    await seedUser({ email: "taken@example.org" });

    const result = await signUp(
      {},
      form({ name: "Impostor", email: "taken@example.org", password: STRONG }),
    );

    expect(result.error).toBeUndefined();
    expect(result.notice).toBeTruthy();
    expect(await db().users.countDocuments({ emailLower: "taken@example.org" })).toBe(1);
  });

  it("gives the same answer for a new address as for a taken one", async () => {
    await seedUser({ role: "admin" });
    await seedUser({ email: "taken@example.org" });

    const taken = await signUp(
      {},
      form({ name: "Taken Person", email: "taken@example.org", password: STRONG }),
    );
    const fresh = await signUp(
      {},
      form({ name: "Fresh Person", email: "fresh@example.org", password: STRONG }),
    );

    // Both must be the *notice*, not two matching undefineds — an assertion
    // that only compares them would pass when both were rejected outright.
    expect(taken.notice).toBeTruthy();
    expect(taken.notice).toEqual(fresh.notice);
    expect(taken.error).toBeUndefined();
  });

  it("requires a full name", async () => {
    const result = await signUp({}, form({ name: "A", email: "a@example.org", password: STRONG }));
    expect(result.error).toMatch(/full name/i);
    expect(await db().users.countDocuments({})).toBe(0);
  });

  it("requires a password of at least twelve characters", async () => {
    const result = await signUp(
      {},
      form({ name: "Short", email: "s@example.org", password: "abc" }),
    );
    expect(result.error).toMatch(/12 characters/i);
    expect(await db().users.countDocuments({})).toBe(0);
  });

  it("rejects an address that is not one", async () => {
    const result = await signUp({}, form({ name: "Bad", email: "not-an-email", password: STRONG }));
    expect(result.error).toBeTruthy();
  });

  it("matches an existing address case-insensitively", async () => {
    await seedUser({ role: "admin" });
    await seedUser({ email: "Mixed.Case@example.org" });

    await signUp({}, form({ name: "Dup", email: "mixed.case@example.org", password: STRONG }));
    expect(await db().users.countDocuments({ emailLower: "mixed.case@example.org" })).toBe(1);
  });
});

describe("signIn", () => {
  it("signs in an active account and lands on the task list", async () => {
    await seedUser({ email: "ada@example.org" });
    const url = await captureRedirect(() =>
      signIn({}, form({ email: "ada@example.org", password: PASSWORD })),
    );
    expect(url).toBe("/tasks");
  });

  /**
   * Sign-in must accept any non-empty password: a minimum length here would
   * reject a credential before checking it, locking out anyone whose password
   * predates the rule.
   */
  it("checks a short password rather than refusing to look at it", async () => {
    await seedUser({ email: "old@example.org", password: "short" });
    const url = await captureRedirect(() =>
      signIn({}, form({ email: "old@example.org", password: "short" })),
    );
    expect(url).toBe("/tasks");
  });

  it("gives one message for a wrong password and an unknown address", async () => {
    await seedUser({ email: "real@example.org" });

    const wrongPassword = await signIn(
      {},
      form({ email: "real@example.org", password: "not-the-password" }),
    );
    const unknownAddress = await signIn(
      {},
      form({ email: "nobody@example.org", password: PASSWORD }),
    );

    expect(wrongPassword.error).toBe(unknownAddress.error);
  });

  it("does not confirm that a disabled account exists", async () => {
    await seedUser({ email: "gone@example.org", status: "disabled" });

    const disabled = await signIn({}, form({ email: "gone@example.org", password: PASSWORD }));
    const unknown = await signIn({}, form({ email: "nobody@example.org", password: PASSWORD }));

    expect(disabled.error).toBe(unknown.error);
  });

  it("refuses a disabled account holding the correct password", async () => {
    await seedUser({ email: "gone@example.org", status: "disabled" });
    const result = await signIn({}, form({ email: "gone@example.org", password: PASSWORD }));
    expect(result.error).toBeTruthy();
    expect(await db().sessions.countDocuments({})).toBe(0);
  });

  it("tells a pending account it is waiting, and issues no session", async () => {
    await seedUser({ email: "new@example.org", status: "pending" });
    const result = await signIn({}, form({ email: "new@example.org", password: PASSWORD }));

    expect(result.error).toMatch(/approve/i);
    expect(await db().sessions.countDocuments({})).toBe(0);
  });

  it("refuses once throttled, before checking the password", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.20");
    await seedUser({ email: "target@example.org" });

    for (let i = 0; i < 8; i++) {
      await signIn({}, form({ email: "target@example.org", password: "wrong" }));
    }

    const result = await signIn({}, form({ email: "target@example.org", password: PASSWORD }));
    expect(result.error).toMatch(/too many/i);
    expect(await db().sessions.countDocuments({})).toBe(0);
  });

  it("clears the failure count on a successful sign-in", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.21");
    await seedUser({ email: "typo@example.org" });

    await signIn({}, form({ email: "typo@example.org", password: "wrong" }));
    await captureRedirect(() =>
      signIn({}, form({ email: "typo@example.org", password: PASSWORD })),
    );

    expect(await db().loginAttempts.countDocuments({ key: "email:typo@example.org" })).toBe(0);
  });

  it("is case-insensitive about the address", async () => {
    await seedUser({ email: "Mixed@example.org" });
    const url = await captureRedirect(() =>
      signIn({}, form({ email: "MIXED@EXAMPLE.ORG", password: PASSWORD })),
    );
    expect(url).toBe("/tasks");
  });
});

describe("who may do what", () => {
  it("sends a signed-out visitor to the login page", async () => {
    expect(await captureRedirect(() => createTask({}, form({ title: "x" })))).toBe("/login");
    expect(
      await captureRedirect(() =>
        addComment(form({ taskId: new ObjectId().toHexString(), body: "x" })),
      ),
    ).toBe("/login");
  });

  /**
   * "Enforced here on the server, not by hiding the control — a hidden button is
   * not a permission." Each of these is reachable by anyone who can post a form.
   */
  it.each([
    ["createTask", () => createTask({}, form({ title: "Sneaky" }))],
    ["quickAddTask", () => quickAddTask(form({ title: "Sneaky" }))],
    [
      "assignTask",
      () => assignTask(form({ taskId: new ObjectId().toHexString(), assigneeId: "" })),
    ],
    [
      "approveUser",
      () => approveUser(form({ userId: new ObjectId().toHexString(), role: "admin" })),
    ],
    [
      "issuePasswordReset",
      () => issuePasswordReset({}, form({ userId: new ObjectId().toHexString() })),
    ],
    [
      "setUserRole",
      () => setUserRole(form({ userId: new ObjectId().toHexString(), role: "admin" })),
    ],
    [
      "setUserStatus",
      () => setUserStatus(form({ userId: new ObjectId().toHexString(), status: "disabled" })),
    ],
  ])("refuses %s to a member", async (_name, call) => {
    await signedInAs({ role: "member" });
    await expect(call()).rejects.toThrow(/admin only/i);
  });

  it("lets an admin create a task", async () => {
    await signedInAs({ role: "admin" });
    const result = await createTask({}, form({ title: "Real work", priority: "high" }));

    expect(result.notice).toBeTruthy();
    expect(await db().tasks.countDocuments({ title: "Real work" })).toBe(1);
  });

  it("gives each task a distinct reference", async () => {
    await signedInAs({ role: "admin" });
    await createTask({}, form({ title: "One" }));
    await createTask({}, form({ title: "Two" }));

    const refs = (await db().tasks.find({}).toArray()).map((t) => t.ref);
    expect(new Set(refs).size).toBe(2);
  });
});

describe("task ownership", () => {
  it("lets a member move a task assigned to them", async () => {
    const member = await signedInAs({ role: "member" });
    const taskId = await makeTask(member._id, member._id);

    await setTaskStatus(form({ taskId: taskId.toHexString(), status: "in_progress" }));
    expect(await db().tasks.findOne({ _id: taskId })).toMatchObject({ status: "in_progress" });
  });

  it("refuses to let a member move someone else's task", async () => {
    const other = await seedUser();
    await signedInAs({ role: "member" });
    const taskId = await makeTask(other._id, other._id);

    await expect(
      setTaskStatus(form({ taskId: taskId.toHexString(), status: "done" })),
    ).rejects.toThrow(/only move tasks assigned to you/i);
    expect(await db().tasks.findOne({ _id: taskId })).toMatchObject({ status: "todo" });
  });

  it("refuses to let a member move an unassigned task", async () => {
    const admin = await seedUser({ role: "admin" });
    await signedInAs({ role: "member" });
    const taskId = await makeTask(admin._id, null);

    await expect(
      setTaskStatus(form({ taskId: taskId.toHexString(), status: "done" })),
    ).rejects.toThrow(/only move tasks/i);
  });

  it("lets an admin move anyone's task", async () => {
    const other = await seedUser();
    await signedInAs({ role: "admin" });
    const taskId = await makeTask(other._id, other._id);

    await setTaskStatus(form({ taskId: taskId.toHexString(), status: "review" }));
    expect(await db().tasks.findOne({ _id: taskId })).toMatchObject({ status: "review" });
  });

  it("refuses toggleDone and setPriority on someone else's task", async () => {
    const other = await seedUser();
    await signedInAs({ role: "member" });
    const taskId = await makeTask(other._id, other._id);

    await expect(toggleDone(form({ taskId: taskId.toHexString() }))).rejects.toThrow(
      /only complete/i,
    );
    await expect(
      setPriority(form({ taskId: taskId.toHexString(), priority: "urgent" })),
    ).rejects.toThrow(/only/i);
  });

  it("stamps completedAt on done and clears it on the way back", async () => {
    const member = await signedInAs({ role: "member" });
    const taskId = await makeTask(member._id, member._id);

    await setTaskStatus(form({ taskId: taskId.toHexString(), status: "done" }));
    expect((await db().tasks.findOne({ _id: taskId }))?.completedAt).toBeInstanceOf(Date);

    await setTaskStatus(form({ taskId: taskId.toHexString(), status: "todo" }));
    expect((await db().tasks.findOne({ _id: taskId }))?.completedAt).toBeNull();
  });

  it("records who changed a status, for the activity trail", async () => {
    const member = await signedInAs({ role: "member" });
    const taskId = await makeTask(member._id, member._id);

    await setTaskStatus(form({ taskId: taskId.toHexString(), status: "blocked" }));
    const entry = await db().activity.findOne({ taskId, kind: "status" });
    expect(entry).toMatchObject({ fromValue: "todo", toValue: "blocked" });
    expect(entry?.actorId?.toHexString()).toBe(member.id);
  });

  /** Anyone on the team may comment — discussion is not an ownership question. */
  it("lets any signed-in member comment on any task", async () => {
    const other = await seedUser();
    await signedInAs({ role: "member" });
    const taskId = await makeTask(other._id, other._id);

    await addComment(form({ taskId: taskId.toHexString(), body: "Looks stuck — need help?" }));
    expect(await db().comments.countDocuments({ taskId })).toBe(1);
  });
});

describe("administering people", () => {
  it("approves a pending signup into an active member", async () => {
    await signedInAs({ role: "admin" });
    const pending = await seedUser({ status: "pending", role: "member" });

    await approveUser(form({ userId: pending.id, role: "member" }));
    expect(await db().users.findOne({ _id: pending._id })).toMatchObject({
      status: "active",
      role: "member",
    });
  });

  /**
   * The last admin must not be able to strand the system with nobody able to
   * approve, promote, or reset anyone.
   */
  it("stops the only admin from demoting themselves", async () => {
    const admin = await signedInAs({ role: "admin" });
    await expect(setUserRole(form({ userId: admin.id, role: "member" }))).rejects.toThrow(
      /only admin/i,
    );
    expect(await db().users.findOne({ _id: admin._id })).toMatchObject({ role: "admin" });
  });

  it("allows self-demotion once someone else is an admin", async () => {
    const admin = await signedInAs({ role: "admin" });
    await seedUser({ role: "admin", status: "active" });

    await setUserRole(form({ userId: admin.id, role: "member" }));
    expect(await db().users.findOne({ _id: admin._id })).toMatchObject({ role: "member" });
  });

  /** A disabled admin is not a working admin, so it must not count as cover. */
  it("does not count a disabled admin as the other admin", async () => {
    const admin = await signedInAs({ role: "admin" });
    await seedUser({ role: "admin", status: "disabled" });

    await expect(setUserRole(form({ userId: admin.id, role: "member" }))).rejects.toThrow(
      /only admin/i,
    );
  });

  it("stops an admin from disabling their own account", async () => {
    const admin = await signedInAs({ role: "admin" });
    await expect(setUserStatus(form({ userId: admin.id, status: "disabled" }))).rejects.toThrow(
      /your own account/i,
    );
  });

  it("disables someone else, ending their access on the next request", async () => {
    await signedInAs({ role: "admin" });
    const victim = await seedUser();

    await setUserStatus(form({ userId: victim.id, status: "disabled" }));
    expect(await db().users.findOne({ _id: victim._id })).toMatchObject({ status: "disabled" });
  });

  it("mints a reset link for an active account and shows it once", async () => {
    await signedInAs({ role: "admin" });
    const locked = await seedUser({ name: "Locked Out" });

    const result = await issuePasswordReset({}, form({ userId: locked.id }));
    expect(result.link).toMatch(/^\/reset\/.+/);
    expect(result.notice).toMatch(/Locked Out/);

    // Only the hash is kept, so the link cannot be recovered from the database.
    const token = result.link!.replace("/reset/", "");
    const stored = await db().passwordResets.findOne({ userId: locked._id });
    expect(stored?._id).not.toBe(token);
  });

  it("refuses to revive a disabled account with a reset link", async () => {
    await signedInAs({ role: "admin" });
    const gone = await seedUser({ status: "disabled" });

    const result = await issuePasswordReset({}, form({ userId: gone.id }));
    expect(result.error).toMatch(/cannot revive/i);
    expect(await db().passwordResets.countDocuments({})).toBe(0);
  });

  it("reports an account that no longer exists", async () => {
    await signedInAs({ role: "admin" });
    const result = await issuePasswordReset({}, form({ userId: new ObjectId().toHexString() }));
    expect(result.error).toMatch(/no longer exists/i);
  });
});

describe("resetting and changing passwords", () => {
  it("spends a link and lands on the login page", async () => {
    await signedInAs({ role: "admin" });
    const locked = await seedUser();
    const { link } = await issuePasswordReset({}, form({ userId: locked.id }));
    const token = link!.replace("/reset/", "");

    const url = await captureRedirect(() =>
      resetPassword({}, form({ token, password: STRONG, confirm: STRONG })),
    );
    expect(url).toBe("/login?reset=1");
  });

  it("requires the two new passwords to match", async () => {
    await signedInAs({ role: "admin" });
    const locked = await seedUser();
    const { link } = await issuePasswordReset({}, form({ userId: locked.id }));

    const result = await resetPassword(
      {},
      form({ token: link!.replace("/reset/", ""), password: STRONG, confirm: "something-else-ok" }),
    );
    expect(result.error).toMatch(/do not match/i);
  });

  it("rejects a link that has already been spent", async () => {
    await signedInAs({ role: "admin" });
    const locked = await seedUser();
    const { link } = await issuePasswordReset({}, form({ userId: locked.id }));
    const token = link!.replace("/reset/", "");

    await captureRedirect(() =>
      resetPassword({}, form({ token, password: STRONG, confirm: STRONG })),
    );
    const second = await resetPassword({}, form({ token, password: STRONG, confirm: STRONG }));
    expect(second.error).toMatch(/expired or has already been used/i);
  });

  it("rejects a made-up token", async () => {
    const result = await resetPassword(
      {},
      form({ token: "invented", password: STRONG, confirm: STRONG }),
    );
    expect(result.error).toBeTruthy();
  });

  it("changes your own password when the current one is right", async () => {
    await signedInAs({ role: "member" });
    const result = await changeOwnPassword(
      {},
      form({ current: PASSWORD, password: STRONG, confirm: STRONG }),
    );
    expect(result.notice).toMatch(/changed/i);
  });

  it("refuses without the current password", async () => {
    await signedInAs({ role: "member" });
    const result = await changeOwnPassword(
      {},
      form({ current: "wrong-one", password: STRONG, confirm: STRONG }),
    );
    expect(result.error).toMatch(/not right/i);
  });

  it("keeps you signed in on the device that made the change", async () => {
    await signedInAs({ role: "member" });
    await changeOwnPassword({}, form({ current: PASSWORD, password: STRONG, confirm: STRONG }));

    const { currentUser } = await import("./auth");
    expect(await currentUser()).not.toBeNull();
  });
});

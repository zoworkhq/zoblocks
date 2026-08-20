/**
 * Changing your own password, which is not the same act as recovering it.
 *
 * The distinction is the whole design. A reset exists because control of the
 * account is in doubt, so it destroys every session. A change is somebody who
 * already knows the password doing routine hygiene, so it keeps the session in
 * front of them and drops the rest — signing yourself out of the machine you
 * are typing on would be a bug, not a precaution.
 *
 * These properties live in an excluded file (`src/lib/auth.ts`, see the note in
 * `vitest.config.ts`), so nothing here moves the coverage numbers. They are
 * tested because getting one of them wrong locks somebody out of their own
 * account or leaves a stolen session alive.
 */

import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { db } from "@/db/client";
import { changePassword, verifyPassword } from "@/lib/auth";
import { PASSWORD, seedMember, twoOrgs } from "./harness";

const NEW_PASSWORD = "a-different-correct-horse";

async function seedSession(userId: ObjectId, id = new ObjectId().toHexString()) {
  await db().sessions.insertOne({
    _id: id,
    userId,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: new Date(),
    userAgent: null,
  });
  return id;
}

async function passwordOf(userId: ObjectId) {
  const member = await db().members.findOne({ _id: userId });
  return member!.passwordHash;
}

describe("changing your own password", () => {
  it("replaces the password when the current one is right", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind);

    expect(await changePassword(user, PASSWORD, NEW_PASSWORD, undefined)).toBe(true);

    const hash = await passwordOf(user);
    expect(await verifyPassword(NEW_PASSWORD, hash)).toBe(true);
    expect(await verifyPassword(PASSWORD, hash)).toBe(false);
  });

  it("refuses a wrong current password and changes nothing", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind);
    const before = await passwordOf(user);

    expect(await changePassword(user, "not-the-password", NEW_PASSWORD, undefined)).toBe(false);
    expect(await passwordOf(user)).toBe(before);
  });

  /**
   * The one behaviour that separates this from a reset. Somebody changing their
   * password on their laptop expects the laptop to stay signed in — and expects
   * the phone they lost last week not to be.
   */
  it("keeps the session that made the change and drops the others", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind);

    const keep = await seedSession(user);
    await seedSession(user);
    await seedSession(user);

    // `changePassword` hashes the token it is given, so it takes the raw value
    // exactly as the cookie holds it.
    const { createHash } = await import("node:crypto");
    const raw = "raw-cookie-value";
    const hashed = createHash("sha256").update(raw).digest("hex");
    await db()
      .sessions.updateOne({ _id: keep }, { $set: { _id: hashed } as never })
      .catch(() => {});
    await db().sessions.deleteOne({ _id: keep });
    await seedSession(user, hashed);

    expect(await changePassword(user, PASSWORD, NEW_PASSWORD, raw)).toBe(true);

    const left = await db().sessions.find({ userId: user }).toArray();
    expect(left).toHaveLength(1);
    expect(left[0]!._id).toBe(hashed);
  });

  it("drops every session when no session token is given", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind);
    await seedSession(user);
    await seedSession(user);

    await changePassword(user, PASSWORD, NEW_PASSWORD, undefined);

    expect(await db().sessions.countDocuments({ userId: user })).toBe(0);
  });

  it("leaves other members' sessions alone", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind);
    const other = await seedMember(northwind, { role: "designer" });

    await seedSession(user);
    const theirs = await seedSession(other);

    await changePassword(user, PASSWORD, NEW_PASSWORD, undefined);

    // A password change is not a sign-out for the organisation.
    expect(await db().sessions.findOne({ _id: theirs })).not.toBeNull();
  });
});

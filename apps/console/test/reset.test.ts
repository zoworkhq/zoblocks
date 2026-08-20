/**
 * Password resets, which are the one place this console hands out a credential.
 *
 * There is no mailer here, so an administrator issues a link and passes it on
 * out of band. That makes the grant itself the entire security boundary: it is
 * the only artefact between "somebody says they lost their password" and a new
 * password on a real account. Everything asserted below is a property that, if
 * it broke, would turn a support workflow into a way in.
 */

import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { db } from "@/db/client";
import {
  consumePasswordReset,
  createPasswordReset,
  resolvePasswordReset,
  verifyPassword,
} from "@/lib/auth";
import { PASSWORD, seedMember, twoOrgs } from "./harness";

const NEW_PASSWORD = "a-different-correct-horse";

/** A session row, as `createSession` would leave one. It needs a request; this does not. */
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

describe("issuing a reset", () => {
  it("returns the token once and stores only its hash", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const { token, expiresAt } = await createPasswordReset(user, admin);

    expect(token).toMatch(/^[\w-]{20,}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    // The grant is findable, and the raw token appears nowhere in it. If it
    // did, a database read would be a password reset for every open grant.
    const grants = await db().passwordResets.find({ userId: user }).toArray();
    expect(grants).toHaveLength(1);
    expect(JSON.stringify(grants[0])).not.toContain(token);
  });

  it("voids an earlier unused grant, so only the newest link is live", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const first = await createPasswordReset(user, admin);
    const second = await createPasswordReset(user, admin);

    expect(await resolvePasswordReset(first.token)).toBeNull();
    expect(await resolvePasswordReset(second.token)).not.toBeNull();
  });

  it("records who issued it", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    await createPasswordReset(user, admin);

    const grant = await db().passwordResets.findOne({ userId: user });
    expect(grant?.createdBy?.toHexString()).toBe(admin.toHexString());
  });
});

describe("resolving a reset", () => {
  it("refuses a token that was never issued", async () => {
    await twoOrgs();
    expect(await resolvePasswordReset("not-a-real-token")).toBeNull();
  });

  it("refuses an empty token", async () => {
    await twoOrgs();
    // Worth its own case: an absent query parameter arrives as "", and a
    // falsy-token path that fell through to the database would match nothing
    // only by luck.
    expect(await resolvePasswordReset("")).toBeNull();
  });

  it("refuses an expired grant", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const { token } = await createPasswordReset(user, admin);
    await db().passwordResets.updateMany(
      { userId: user },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    expect(await resolvePasswordReset(token)).toBeNull();
  });

  /**
   * Offboarding must not have a back door. A link minted while somebody still
   * worked here is exactly the artefact that would reopen the account after
   * they left, and the expiry alone does not close it.
   */
  it("refuses a grant against an account disabled after it was issued", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const { token } = await createPasswordReset(user, admin);
    expect(await resolvePasswordReset(token)).not.toBeNull();

    await db().members.updateOne({ _id: user }, { $set: { status: "disabled" } });

    expect(await resolvePasswordReset(token)).toBeNull();
  });
});

describe("spending a reset", () => {
  it("sets the new password and leaves the old one invalid", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const { token } = await createPasswordReset(user, admin);
    expect(await consumePasswordReset(token, NEW_PASSWORD)).toBe(true);

    const hash = await passwordOf(user);
    expect(await verifyPassword(NEW_PASSWORD, hash)).toBe(true);
    expect(await verifyPassword(PASSWORD, hash)).toBe(false);
  });

  it("is single use", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    const { token } = await createPasswordReset(user, admin);
    expect(await consumePasswordReset(token, NEW_PASSWORD)).toBe(true);
    expect(await consumePasswordReset(token, "yet-another-password")).toBe(false);

    // And the second attempt left the first result standing.
    expect(await verifyPassword(NEW_PASSWORD, await passwordOf(user))).toBe(true);
  });

  /**
   * A reset exists because control of the account is in doubt. Leaving the
   * sessions that doubt is about signed in would defeat the entire point.
   */
  it("destroys every session that account holds", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const user = await seedMember(northwind, { role: "designer" });

    await seedSession(user);
    await seedSession(user);
    const adminSession = await seedSession(admin);

    const { token } = await createPasswordReset(user, admin);
    await consumePasswordReset(token, NEW_PASSWORD);

    expect(await db().sessions.countDocuments({ userId: user })).toBe(0);
    // And nobody else's. A reset is not a sign-out for the organisation.
    expect(await db().sessions.findOne({ _id: adminSession })).not.toBeNull();
  });

  it("clears the throttle, so the new password is usable immediately", async () => {
    const { northwind } = await twoOrgs();
    const admin = await seedMember(northwind);
    const email = "locked-out@northwind.example";
    const user = await seedMember(northwind, { role: "designer", email });

    // The failures that prompted the reset in the first place.
    await db().loginAttempts.insertMany(
      Array.from({ length: 6 }, () => ({
        _id: new ObjectId(),
        key: `email:${email}`,
        createdAt: new Date(),
      })),
    );

    const { token } = await createPasswordReset(user, admin);
    await consumePasswordReset(token, NEW_PASSWORD);

    expect(await db().loginAttempts.countDocuments({ key: `email:${email}` })).toBe(0);
  });

  it("refuses a bad token without touching any password", async () => {
    const { northwind } = await twoOrgs();
    const user = await seedMember(northwind, { role: "designer" });
    const before = await passwordOf(user);

    expect(await consumePasswordReset("not-a-real-token", NEW_PASSWORD)).toBe(false);
    expect(await passwordOf(user)).toBe(before);
  });
});

import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { PASSWORD, seedUser } from "../../test/harness";
import { __readCookie, __setRequestHeader, __writeCookie } from "../../test/stubs/next-headers";
import {
  changePassword,
  clearFailures,
  consumePasswordReset,
  createPasswordReset,
  createSession,
  currentUser,
  destroySession,
  hashPassword,
  isThrottled,
  recordFailure,
  resolvePasswordReset,
  safeEqual,
  scopesFor,
  verifyPassword,
} from "./auth";

const COOKIE = "hq_session";
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

describe("passwords", () => {
  it("never stores the password itself", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword("not the password", hash)).toBe(false);
  });

  it("salts, so the same password hashes differently each time", async () => {
    expect(await hashPassword(PASSWORD)).not.toEqual(await hashPassword(PASSWORD));
  });

  it("uses bcrypt at the stated cost", async () => {
    expect(await hashPassword(PASSWORD)).toMatch(/^\$2[aby]\$12\$/);
  });
});

describe("safeEqual", () => {
  it("matches identical strings and rejects different ones", () => {
    expect(safeEqual("abc123", "abc123")).toBe(true);
    expect(safeEqual("abc123", "abc124")).toBe(false);
  });

  /** Different lengths must return false rather than throw — timingSafeEqual does. */
  it("returns false for different lengths instead of throwing", () => {
    expect(safeEqual("short", "considerably longer")).toBe(false);
  });
});

describe("sessions", () => {
  /**
   * "The database stores only its SHA-256 hash, so a dump of the sessions
   * collection yields nothing usable." A stored raw token would mean a read-only
   * database leak is a full account takeover.
   */
  it("stores only the hash of the session token, never the token", async () => {
    const user = await seedUser();
    await createSession(user._id);

    const token = __readCookie(COOKIE);
    expect(token).toBeTruthy();

    const stored = await db().sessions.findOne({ userId: user._id });
    expect(stored?._id).not.toBe(token);
    expect(stored?._id).toBe(sha256(token!));
  });

  it("issues a different token every time", async () => {
    const user = await seedUser();
    await createSession(user._id);
    const first = __readCookie(COOKIE);
    await createSession(user._id);
    expect(__readCookie(COOKIE)).not.toBe(first);
  });

  it("resolves the signed-in user", async () => {
    const user = await seedUser({ name: "Ada Lovelace", role: "admin" });
    await createSession(user._id);

    const resolved = await currentUser();
    expect(resolved).toMatchObject({ id: user.id, name: "Ada Lovelace", role: "admin" });
  });

  it("never exposes the password hash to the caller", async () => {
    const user = await seedUser();
    await createSession(user._id);
    expect(JSON.stringify(await currentUser())).not.toMatch(/\$2[aby]\$/);
  });

  it("returns null with no cookie at all", async () => {
    expect(await currentUser()).toBeNull();
  });

  it("returns null for a token that was never issued", async () => {
    __writeCookie(COOKIE, "a-token-nobody-minted");
    expect(await currentUser()).toBeNull();
  });

  /**
   * A TTL index also removes these, but TTL is a background sweep that runs
   * about once a minute. Correctness has to come from the query.
   */
  it("rejects an expired session even while the document still exists", async () => {
    const user = await seedUser();
    const token = "expired-token";
    await db().sessions.insertOne({
      _id: sha256(token),
      userId: user._id,
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
      userAgent: null,
    });
    __writeCookie(COOKIE, token);

    expect(await currentUser()).toBeNull();
    expect(await db().sessions.countDocuments({ _id: sha256(token) })).toBe(1);
  });

  /**
   * "`status = 'disabled'` ends every session that account holds on its next
   * request." Offboarding is the security event that actually happens.
   */
  it("ends an active session the moment the account is disabled", async () => {
    const user = await seedUser();
    await createSession(user._id);
    expect(await currentUser()).not.toBeNull();

    await db().users.updateOne({ _id: user._id }, { $set: { status: "disabled" } });
    expect(await currentUser()).toBeNull();
  });

  it("does not resolve a session for a still-pending account", async () => {
    const user = await seedUser({ status: "pending" });
    await createSession(user._id);
    expect(await currentUser()).toBeNull();
  });

  it("does not resolve a session whose user has been removed", async () => {
    const user = await seedUser();
    await createSession(user._id);
    await db().users.deleteOne({ _id: user._id });
    expect(await currentUser()).toBeNull();
  });

  it("signing out drops both the cookie and the stored session", async () => {
    const user = await seedUser();
    await createSession(user._id);

    await destroySession();
    expect(__readCookie(COOKIE)).toBeUndefined();
    expect(await db().sessions.countDocuments({ userId: user._id })).toBe(0);
    expect(await currentUser()).toBeNull();
  });

  it("records the user agent for review, truncated", async () => {
    __setRequestHeader("user-agent", "x".repeat(900));
    const user = await seedUser();
    await createSession(user._id);

    const stored = await db().sessions.findOne({ userId: user._id });
    expect(stored?.userAgent?.length).toBe(400);
  });
});

describe("sign-in throttling", () => {
  const EMAIL = "target@example.org";

  it("permits a fresh account", async () => {
    expect(await isThrottled(EMAIL)).toBe(false);
  });

  it("throttles an account after enough failures", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.10");
    for (let i = 0; i < 8; i++) await recordFailure(EMAIL);
    expect(await isThrottled(EMAIL)).toBe(true);
  });

  it("does not throttle one account short of the limit", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.11");
    for (let i = 0; i < 7; i++) await recordFailure(EMAIL);
    expect(await isThrottled(EMAIL)).toBe(false);
  });

  /**
   * The per-account limit must not be reachable by attacking a *different*
   * account from the same address, or anyone could lock out a colleague by
   * failing against their own login.
   */
  it("keeps one account's failures from throttling another", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.12");
    for (let i = 0; i < 8; i++) await recordFailure("noisy@example.org");
    expect(await isThrottled("noisy@example.org")).toBe(true);
    expect(await isThrottled("quiet@example.org")).toBe(false);
  });

  /** A whole office shares one address, so the source limit is higher. */
  it("throttles a source that has failed across many accounts", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.13");
    for (let i = 0; i < 30; i++) await recordFailure(`user${i}@example.org`);
    expect(await isThrottled("someone-new@example.org")).toBe(true);
  });

  it("ignores failures older than the window", async () => {
    const stale = new Date(Date.now() - 16 * 60 * 1000);
    await db().loginAttempts.insertMany(
      Array.from({ length: 20 }, () => ({
        _id: new ObjectId(),
        key: `email:${EMAIL}`,
        createdAt: stale,
      })),
    );
    expect(await isThrottled(EMAIL)).toBe(false);
  });

  it("clears an account's failures on a correct password", async () => {
    __setRequestHeader("x-forwarded-for", "203.0.113.14");
    for (let i = 0; i < 8; i++) await recordFailure(EMAIL);
    await clearFailures(EMAIL);
    expect(await isThrottled(EMAIL)).toBe(false);
  });

  /** Reading the first hop only — the rest of x-forwarded-for is spoofable. */
  it("keys on the first forwarded hop, not the whole chain", async () => {
    __setRequestHeader("x-forwarded-for", "198.51.100.7, 10.0.0.1, 10.0.0.2");
    await recordFailure("a@example.org");
    expect(await db().loginAttempts.countDocuments({ key: "ip:198.51.100.7" })).toBe(1);
  });
});

describe("password resets", () => {
  it("returns the raw token once and stores only its hash", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });

    const { token } = await createPasswordReset(user._id, admin._id);
    const stored = await db().passwordResets.findOne({ userId: user._id });

    expect(stored?._id).toBe(sha256(token));
    expect(stored?._id).not.toBe(token);
  });

  it("resolves a fresh grant to its owner", async () => {
    const user = await seedUser({ name: "Grace" });
    const admin = await seedUser({ role: "admin" });
    const { token } = await createPasswordReset(user._id, admin._id);

    expect(await resolvePasswordReset(token)).toMatchObject({ name: "Grace" });
  });

  it("rejects an unknown or empty token", async () => {
    expect(await resolvePasswordReset("never-minted")).toBeNull();
    expect(await resolvePasswordReset("")).toBeNull();
  });

  /** "Issuing a new link cannot leave an older one live." */
  it("voids an earlier unused grant when a new one is issued", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });

    const first = await createPasswordReset(user._id, admin._id);
    const second = await createPasswordReset(user._id, admin._id);

    expect(await resolvePasswordReset(first.token)).toBeNull();
    expect(await resolvePasswordReset(second.token)).not.toBeNull();
  });

  it("spends a grant exactly once", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });
    const { token } = await createPasswordReset(user._id, admin._id);

    expect(await consumePasswordReset(token, "a-brand-new-passphrase")).toBe(true);
    expect(await consumePasswordReset(token, "another-passphrase-here")).toBe(false);
  });

  it("rejects an expired grant", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });
    const { token } = await createPasswordReset(user._id, admin._id);

    await db().passwordResets.updateOne(
      { _id: sha256(token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(await consumePasswordReset(token, "a-brand-new-passphrase")).toBe(false);
  });

  /**
   * "A disabled account must not be recoverable through a link minted before it
   * was disabled — otherwise offboarding has a back door."
   */
  it("refuses a grant minted before the account was disabled", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });
    const { token } = await createPasswordReset(user._id, admin._id);

    await db().users.updateOne({ _id: user._id }, { $set: { status: "disabled" } });

    expect(await resolvePasswordReset(token)).toBeNull();
    expect(await consumePasswordReset(token, "a-brand-new-passphrase")).toBe(false);
  });

  it("actually changes the password", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });
    const { token } = await createPasswordReset(user._id, admin._id);

    await consumePasswordReset(token, "a-brand-new-passphrase");

    const after = await db().users.findOne({ _id: user._id });
    expect(await verifyPassword("a-brand-new-passphrase", after!.passwordHash)).toBe(true);
    expect(await verifyPassword(PASSWORD, after!.passwordHash)).toBe(false);
  });

  /**
   * "A reset exists because control of the account is in doubt, so leaving old
   * sessions signed in would defeat the point."
   */
  it("destroys every existing session for that account", async () => {
    const user = await seedUser();
    const admin = await seedUser({ role: "admin" });
    await createSession(user._id);
    await createSession(user._id);
    expect(await db().sessions.countDocuments({ userId: user._id })).toBe(2);

    const { token } = await createPasswordReset(user._id, admin._id);
    await consumePasswordReset(token, "a-brand-new-passphrase");

    expect(await db().sessions.countDocuments({ userId: user._id })).toBe(0);
  });

  it("leaves other people's sessions alone", async () => {
    const user = await seedUser();
    const other = await seedUser();
    const admin = await seedUser({ role: "admin" });
    await createSession(other._id);

    const { token } = await createPasswordReset(user._id, admin._id);
    await consumePasswordReset(token, "a-brand-new-passphrase");

    expect(await db().sessions.countDocuments({ userId: other._id })).toBe(1);
  });
});

describe("changing your own password", () => {
  it("requires the current password", async () => {
    const user = await seedUser();
    expect(
      await changePassword(user._id, "wrong-current-password", "a-new-one-entirely", undefined),
    ).toBe(false);

    const after = await db().users.findOne({ _id: user._id });
    expect(await verifyPassword(PASSWORD, after!.passwordHash)).toBe(true);
  });

  it("changes the password when the current one is right", async () => {
    const user = await seedUser();
    expect(await changePassword(user._id, PASSWORD, "a-new-one-entirely", undefined)).toBe(true);

    const after = await db().users.findOne({ _id: user._id });
    expect(await verifyPassword("a-new-one-entirely", after!.passwordHash)).toBe(true);
  });

  /**
   * "Changing your password signs out the other devices without signing you out
   * of the one in your hand."
   */
  it("keeps the session that made the change and drops the rest", async () => {
    const user = await seedUser();
    await createSession(user._id);
    const otherDevice = __readCookie(COOKIE)!;
    await createSession(user._id);
    const thisDevice = __readCookie(COOKIE)!;

    await changePassword(user._id, PASSWORD, "a-new-one-entirely", thisDevice);

    const remaining = await db().sessions.find({ userId: user._id }).toArray();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?._id).toBe(sha256(thisDevice));
    expect(remaining[0]?._id).not.toBe(sha256(otherDevice));

    // And the one in your hand still works.
    expect(await currentUser()).not.toBeNull();
  });

  it("drops every session when no session is nominated", async () => {
    const user = await seedUser();
    await createSession(user._id);
    await createSession(user._id);

    await changePassword(user._id, PASSWORD, "a-new-one-entirely", undefined);
    expect(await db().sessions.countDocuments({ userId: user._id })).toBe(0);
  });
});

describe("scopes", () => {
  it("gives admins the admin scope and members none", () => {
    const base = { id: "x", email: "a@example.org", name: "A", status: "active" as const };
    expect(scopesFor({ ...base, role: "admin" })).toContain("admin");
    expect(scopesFor({ ...base, role: "member" })).not.toContain("admin");
  });

  it("lets members read and write tasks", () => {
    const scopes = scopesFor({
      id: "x",
      email: "a@example.org",
      name: "A",
      status: "active",
      role: "member",
    });
    expect(scopes).toEqual(expect.arrayContaining(["tasks:read", "tasks:write"]));
  });
});

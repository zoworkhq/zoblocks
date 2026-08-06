/**
 * Session and password handling.
 *
 * Design notes, because hand-rolled auth is where internal tools get breached:
 *
 * - Passwords are bcrypt-hashed at cost 12. Never stored, never logged, never
 *   returned from a query that reaches a component.
 * - The session cookie holds a 256-bit random token. The database stores only
 *   its SHA-256 hash, so a dump of the sessions collection yields nothing
 *   usable.
 * - Sessions are server-side documents, so `status = 'disabled'` ends every
 *   session that account holds on its next request. A stateless JWT cannot do
 *   that, and offboarding is the security event that actually happens on a
 *   small team.
 * - Login failures are deliberately indistinguishable: wrong password, unknown
 *   address, and not-yet-approved all return the same message, so the form
 *   cannot be used to enumerate who works here.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import type { UserDoc, UserRole, UserStatus } from "@/db/collections";

const COOKIE = "hq_session";
const SESSION_DAYS = 14;
const BCRYPT_COST = 12;

/** Reset links are short-lived: an admin mints one and hands it over now. */
const RESET_MINUTES = 60;

const THROTTLE_WINDOW_MINUTES = 15;
/** Per-account. Low, because a real person does not miss eight times. */
const MAX_FAILURES_PER_EMAIL = 8;
/** Per-source. Higher, since a whole office can share one address. */
const MAX_FAILURES_PER_IP = 30;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time compare, used where a token is checked outside bcrypt. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function createSession(userId: ObjectId): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const agent = (await headers()).get("user-agent")?.slice(0, 400) ?? null;

  await db().sessions.insertOne({
    _id: hashToken(token),
    userId,
    expiresAt,
    createdAt: new Date(),
    userAgent: agent,
  });

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db().sessions.deleteOne({ _id: hashToken(token) });
  }
  jar.delete(COOKIE);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

function toSessionUser(doc: UserDoc): SessionUser {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    name: doc.name,
    role: doc.role,
    status: doc.status,
  };
}

/**
 * Resolves the current user, or null. Re-reads `status` on every call rather
 * than trusting anything in the cookie, so an admin disabling someone takes
 * effect immediately rather than at token expiry.
 *
 * The expiry is still compared here even though a TTL index also removes the
 * document: TTL runs on a background sweep, roughly once a minute, so a lapsed
 * session can briefly still exist. Correctness comes from the comparison; the
 * index is only housekeeping.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const { sessions, users } = db();
  const session = await sessions.findOne({
    _id: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const user = await users.findOne({ _id: session.userId });
  if (!user || user.status !== "active") return null;
  return toSessionUser(user);
}

// ---------------------------------------------------------------------------
// Sign-in throttling
// ---------------------------------------------------------------------------

/**
 * Best-effort client address. Behind Vercel the useful value is the first hop
 * in x-forwarded-for; everything after it is proxy chain. Falls back to a
 * constant, which degrades to a global limit rather than to no limit.
 */
async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || h.get("x-real-ip") || "unknown"}`;
}

function windowStart(): Date {
  return new Date(Date.now() - THROTTLE_WINDOW_MINUTES * 60 * 1000);
}

async function failuresFor(key: string): Promise<number> {
  return db().loginAttempts.countDocuments({ key, createdAt: { $gt: windowStart() } });
}

/**
 * True when this attempt should be refused before the password is even checked.
 * Both keys are consulted so that neither an account nor a source can be
 * hammered, and neither can be used to lock out the other on its own.
 */
export async function isThrottled(email: string): Promise<boolean> {
  const [byEmail, byIp] = await Promise.all([
    failuresFor(`email:${email}`),
    failuresFor(await clientKey()),
  ]);
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordFailure(email: string): Promise<void> {
  const ip = await clientKey();
  const createdAt = new Date();
  // The sweep the SQL version needed is gone: a TTL index on createdAt drops
  // these an hour later without anyone asking.
  await db().loginAttempts.insertMany([
    { _id: new ObjectId(), key: `email:${email}`, createdAt },
    { _id: new ObjectId(), key: ip, createdAt },
  ]);
}

/** A correct password clears that account's failures, so one typo is not sticky. */
export async function clearFailures(email: string): Promise<void> {
  await db().loginAttempts.deleteMany({ key: `email:${email}` });
}

// ---------------------------------------------------------------------------
// Password resets
// ---------------------------------------------------------------------------

/**
 * Mints a single-use grant and returns the raw token exactly once — it is never
 * recoverable afterwards, because only its hash is stored. Any earlier unused
 * grant for the same person is voided, so issuing a new link cannot leave an
 * older one live.
 */
export async function createPasswordReset(
  userId: ObjectId,
  adminId: ObjectId,
): Promise<{ token: string; expiresAt: Date }> {
  const { passwordResets } = db();

  await passwordResets.updateMany({ userId, usedAt: null }, { $set: { usedAt: new Date() } });

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

  await passwordResets.insertOne({
    _id: hashToken(token),
    userId,
    expiresAt,
    usedAt: null,
    createdBy: adminId,
    createdAt: new Date(),
  });

  return { token, expiresAt };
}

export async function resolvePasswordReset(
  token: string,
): Promise<{ userId: ObjectId; name: string } | null> {
  if (!token) return null;

  const { passwordResets, users } = db();
  const grant = await passwordResets.findOne({
    _id: hashToken(token),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!grant) return null;

  const user = await users.findOne({ _id: grant.userId });
  // A disabled account must not be recoverable through a link minted before it
  // was disabled — otherwise offboarding has a back door.
  if (!user || user.status === "disabled") return null;

  return { userId: grant.userId, name: user.name };
}

/**
 * Sets the new password, spends the grant, and destroys every session that
 * account holds. A reset exists because control of the account is in doubt, so
 * leaving old sessions signed in would defeat the point.
 */
export async function consumePasswordReset(token: string, newPassword: string): Promise<boolean> {
  const grant = await resolvePasswordReset(token);
  if (!grant) return false;

  const { users, passwordResets, sessions } = db();
  const hash = await hashPassword(newPassword);

  await users.updateOne({ _id: grant.userId }, { $set: { passwordHash: hash } });
  await passwordResets.updateOne({ _id: hashToken(token) }, { $set: { usedAt: new Date() } });
  await sessions.deleteMany({ userId: grant.userId });

  const user = await users.findOne({ _id: grant.userId });
  if (user) await clearFailures(user.emailLower);

  return true;
}

/**
 * Self-service change, for someone who knows their current password. Keeps the
 * session that made the change and drops the rest, so changing your password
 * signs out the other devices without signing you out of the one in your hand.
 */
export async function changePassword(
  userId: ObjectId,
  currentPassword: string,
  newPassword: string,
  keepSessionToken: string | undefined,
): Promise<boolean> {
  const { users, sessions } = db();

  const user = await users.findOne({ _id: userId });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) return false;

  await users.updateOne(
    { _id: userId },
    { $set: { passwordHash: await hashPassword(newPassword) } },
  );

  const keep = keepSessionToken ? hashToken(keepSessionToken) : null;
  await sessions.deleteMany(keep ? { userId, _id: { $ne: keep } } : { userId });

  return true;
}

export async function currentSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value;
}

/** Scopes drive AppShell's nav filtering — the same mechanism a customer uses. */
export function scopesFor(user: SessionUser): string[] {
  return user.role === "admin"
    ? ["tasks:read", "tasks:write", "admin"]
    : ["tasks:read", "tasks:write"];
}

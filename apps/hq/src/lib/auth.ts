/**
 * Session and password handling.
 *
 * Design notes, because hand-rolled auth is where internal tools get breached:
 *
 * - Passwords are bcrypt-hashed at cost 12. Never stored, never logged, never
 *   returned from a query that reaches a component.
 * - The session cookie holds a 256-bit random token. The database stores only
 *   its SHA-256 hash, so a dump of the sessions table yields nothing usable.
 * - Sessions are server-side rows, so `status = 'disabled'` ends every session
 *   that account holds on its next request. A stateless JWT cannot do that, and
 *   offboarding is the security event that actually happens on a small team.
 * - Login failures are deliberately indistinguishable: wrong password, unknown
 *   address, and not-yet-approved all return the same message, so the form
 *   cannot be used to enumerate who works here.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, count, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { loginAttempts, passwordResets, sessions, users, type User } from "@/db/schema";

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

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const agent = (await headers()).get("user-agent")?.slice(0, 400) ?? null;

  await db()
    .insert(sessions)
    .values({
      id: hashToken(token),
      userId,
      expiresAt,
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
    await db()
      .delete(sessions)
      .where(eq(sessions.id, hashToken(token)));
  }
  jar.delete(COOKIE);
}

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "status">;

/**
 * Resolves the current user, or null. Re-reads `status` on every call rather
 * than trusting anything in the cookie, so an admin disabling someone takes
 * effect immediately rather than at token expiry.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const rows = await db()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0];
  if (!user || user.status !== "active") return null;
  return user;
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
  const rows = await db()
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, key), gt(loginAttempts.createdAt, windowStart())));
  return rows[0]?.value ?? 0;
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
  await db()
    .insert(loginAttempts)
    .values([{ key: `email:${email}` }, { key: ip }]);

  // Opportunistic sweep so the table cannot grow without bound. Cheap, and it
  // avoids needing a scheduled job for a table only written to on failure.
  await db()
    .delete(loginAttempts)
    .where(lt(loginAttempts.createdAt, new Date(Date.now() - 3_600_000)));
}

/** A correct password clears that account's failures, so one typo is not sticky. */
export async function clearFailures(email: string): Promise<void> {
  await db()
    .delete(loginAttempts)
    .where(eq(loginAttempts.key, `email:${email}`));
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
  userId: string,
  adminId: string,
): Promise<{ token: string; expiresAt: Date }> {
  await db()
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResets.userId, userId), isNull(passwordResets.usedAt)));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000);

  await db()
    .insert(passwordResets)
    .values({
      id: hashToken(token),
      userId,
      expiresAt,
      createdBy: adminId,
    });

  return { token, expiresAt };
}

export async function resolvePasswordReset(
  token: string,
): Promise<{ userId: string; name: string } | null> {
  if (!token) return null;

  const rows = await db()
    .select({ userId: passwordResets.userId, name: users.name, status: users.status })
    .from(passwordResets)
    .innerJoin(users, eq(users.id, passwordResets.userId))
    .where(
      and(
        eq(passwordResets.id, hashToken(token)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  // A disabled account must not be recoverable through a link minted before it
  // was disabled — otherwise offboarding has a back door.
  if (!row || row.status === "disabled") return null;
  return { userId: row.userId, name: row.name };
}

/**
 * Sets the new password, spends the grant, and destroys every session that
 * account holds. A reset exists because control of the account is in doubt, so
 * leaving old sessions signed in would defeat the point.
 */
export async function consumePasswordReset(token: string, newPassword: string): Promise<boolean> {
  const grant = await resolvePasswordReset(token);
  if (!grant) return false;

  const hash = await hashPassword(newPassword);

  await db().update(users).set({ passwordHash: hash }).where(eq(users.id, grant.userId));
  await db()
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.id, hashToken(token)));
  await db().delete(sessions).where(eq(sessions.userId, grant.userId));

  const email = await db()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, grant.userId))
    .limit(1);
  if (email[0]) await clearFailures(email[0].email.toLowerCase());

  return true;
}

/**
 * Self-service change, for someone who knows their current password. Keeps the
 * session that made the change and drops the rest, so changing your password
 * signs out the other devices without signing you out of the one in your hand.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  keepSessionToken: string | undefined,
): Promise<boolean> {
  const rows = await db()
    .select({ hash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const existing = rows[0];
  if (!existing || !(await verifyPassword(currentPassword, existing.hash))) return false;

  await db()
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, userId));

  const keep = keepSessionToken ? hashToken(keepSessionToken) : null;
  await db()
    .delete(sessions)
    .where(
      keep
        ? and(eq(sessions.userId, userId), sql`${sessions.id} <> ${keep}`)
        : eq(sessions.userId, userId),
    );

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

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
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { sessions, users, type User } from "@/db/schema";

const COOKIE = "hq_session";
const SESSION_DAYS = 14;
const BCRYPT_COST = 12;

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

/** Scopes drive AppShell's nav filtering — the same mechanism a customer uses. */
export function scopesFor(user: SessionUser): string[] {
  return user.role === "admin"
    ? ["tasks:read", "tasks:write", "admin"]
    : ["tasks:read", "tasks:write"];
}

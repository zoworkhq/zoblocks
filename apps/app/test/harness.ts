/**
 * Two organisations, always.
 *
 * Every fixture here seeds a second customer alongside the first, because the
 * failure this suite exists to catch is a query that returns someone else's
 * theme — and a single-tenant fixture cannot express it. A test that seeds one
 * organisation and passes proves nothing about isolation.
 */

import { ObjectId } from "mongodb";
import { db } from "@/db/client";
import type { MemberRole, MemberStatus } from "@/db/collections";
import { withTierDefaults, type ThemeTokens, type ThemeTokensInput } from "@zoblocks/theme";
import { hashPassword } from "@/lib/auth";
import { scoped } from "@/db/scope";
import type { Authorized } from "@/lib/authorize";

/** Obviously fake, for a disposable in-memory database. */
export const PASSWORD = "correct-horse-battery-staple";

export async function seedOrg(name: string, slug: string): Promise<ObjectId> {
  const _id = new ObjectId();
  await db().organisations.insertOne({
    _id,
    name,
    slug,
    frameworks: ["antd"],
    defaultThemeId: null,
    createdAt: new Date(),
  });
  return _id;
}

export async function seedMember(
  orgId: ObjectId,
  overrides: { role?: MemberRole; status?: MemberStatus; email?: string } = {},
): Promise<ObjectId> {
  const _id = new ObjectId();
  const email = overrides.email ?? `person-${_id.toHexString()}@example.org`;
  await db().members.insertOne({
    _id,
    orgId,
    name: "Test Person",
    email,
    emailLower: email.toLowerCase(),
    passwordHash: await hashPassword(PASSWORD),
    role: overrides.role ?? "admin",
    status: overrides.status ?? "active",
    createdAt: new Date(),
    approvedAt: new Date(),
    approvedBy: null,
  });
  return _id;
}

/**
 * An `Authorized` without a session.
 *
 * `authorize()` resolves a cookie, which needs a request. The lifecycle under
 * test is the same either way, and the authorisation boundary itself is tested
 * separately with a real session.
 */
export async function actingAs(orgId: ObjectId, role: MemberRole = "admin"): Promise<Authorized> {
  const id = await seedMember(orgId, { role });
  return {
    member: {
      id: id.toHexString(),
      orgId,
      email: "test@example.org",
      name: "Test Person",
      role,
      status: "active",
    },
    data: scoped(orgId),
  };
}

/** Two customers, so isolation is checkable. */
export async function twoOrgs() {
  const northwind = await seedOrg("Northwind Health", "northwind");
  const southmere = await seedOrg("Southmere Trust", "southmere");
  return {
    northwind,
    southmere,
    asNorthwind: (role: MemberRole = "admin") => actingAs(northwind, role),
    asSouthmere: (role: MemberRole = "admin") => actingAs(southmere, role),
  };
}

/**
 * A stored theme's tokens, normalised the way every screen normalises them.
 *
 * `findOne` returns raw BSON: the tiers exist only if something wrote to them,
 * so `theme.tokens.semantic` is genuinely optional and the type now says so.
 * Assertions want the complete shape, and reaching for `!` at each one would
 * re-assert exactly the promise that was false in the first place — the
 * fixture claiming a completeness the database never provides is what let the
 * original bug through a green suite.
 */
export function storedTokens(theme: { tokens: ThemeTokensInput } | null): ThemeTokens {
  if (!theme) throw new Error("No such theme — the test's own setup is wrong.");
  return withTierDefaults(theme.tokens);
}

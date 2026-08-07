import { ObjectId } from "mongodb";
import { db } from "@/db/client";
import type { UserRole, UserStatus } from "@/db/collections";
import { hashPassword } from "@/lib/auth";

/**
 * Obviously-fake credentials for a disposable in-memory database. Never a value
 * anyone could mistake for a real one, and never reused outside tests.
 */
export const PASSWORD = "correct-horse-battery-staple";

export async function seedUser(
  overrides: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    status?: UserStatus;
  } = {},
) {
  const email = overrides.email ?? `person-${new ObjectId().toHexString()}@example.org`;
  const _id = new ObjectId();

  await db().users.insertOne({
    _id,
    name: overrides.name ?? "Test Person",
    email,
    emailLower: email.toLowerCase(),
    passwordHash: await hashPassword(overrides.password ?? PASSWORD),
    role: overrides.role ?? "member",
    status: overrides.status ?? "active",
    createdAt: new Date(),
    approvedAt: new Date(),
    approvedBy: null,
  });

  return { _id, id: _id.toHexString(), email, name: overrides.name ?? "Test Person" };
}

export function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

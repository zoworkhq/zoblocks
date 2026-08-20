/**
 * Who is in an organisation, and what they may do.
 *
 * Three rules, and the third is the one that turns an inconvenience into an
 * incident if it is missing:
 *
 *   **Approve before access.** Signing up creates a person; an administrator
 *   decides what they may do. Carried over from hq unchanged.
 *
 *   **Nothing is deleted.** A member is disabled, never removed. Versions and
 *   audit entries point at member ids and there is no foreign key to stop an
 *   orphan, so a delete would leave "published by ⟨missing⟩" in a trail a
 *   regulator may read.
 *
 *   **The last admin cannot be removed.** Not demoted, not disabled. An
 *   organisation with no admin cannot approve anyone, cannot change a role, and
 *   cannot publish — it is locked out of its own account with no path back that
 *   does not involve us touching their database.
 */

import { ObjectId } from "mongodb";
import type { MemberRole, MemberStatus } from "@/db/collections";
import type { Authorized } from "./authorize";

export class MemberError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = "MemberError";
  }
}

const ROLES: readonly MemberRole[] = ["admin", "designer", "developer", "viewer"];

/**
 * How many active admins the organisation would have left.
 *
 * Counted rather than assumed, and counted *excluding* the member being
 * changed, so the check reads the same whether the change is a demotion or a
 * disable.
 */
async function activeAdminsBesides(auth: Authorized, memberId: ObjectId): Promise<number> {
  return auth.data.members.countDocuments({
    role: "admin",
    status: "active",
    _id: { $ne: memberId },
  });
}

async function load(auth: Authorized, memberId: ObjectId) {
  const member = await auth.data.members.findOne({ _id: memberId });
  if (!member) throw new MemberError("No such member.");
  return member;
}

/** Approve a pending account and give it a role. */
export async function approveMember(
  auth: Authorized,
  memberId: ObjectId,
  role: MemberRole,
): Promise<string> {
  if (!ROLES.includes(role)) throw new MemberError(`"${role}" is not a role.`);

  const member = await load(auth, memberId);
  if (member.status === "active") return `${member.name} is already active.`;

  const actor = new ObjectId(auth.member.id);
  await auth.data.members.updateOne(
    { _id: memberId },
    { $set: { status: "active", role, approvedAt: new Date(), approvedBy: actor } },
  );

  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: actor,
    action: "member.approved",
    subject: member.email,
    detail: `as ${role}`,
    at: new Date(),
  });

  return `${member.name} is now an active ${role}.`;
}

/** Change a role. Refuses to remove the last admin. */
export async function changeRole(
  auth: Authorized,
  memberId: ObjectId,
  role: MemberRole,
): Promise<string> {
  if (!ROLES.includes(role)) throw new MemberError(`"${role}" is not a role.`);

  const member = await load(auth, memberId);
  if (member.role === role) return "No change.";

  if (member.role === "admin" && role !== "admin" && member.status === "active") {
    const remaining = await activeAdminsBesides(auth, memberId);
    if (remaining === 0) {
      throw new MemberError("That is the only administrator.", [
        "An organisation with no administrator cannot approve members, change roles, or publish a theme — and nobody inside it could undo this.",
        "Promote somebody else first, then change this role.",
      ]);
    }
  }

  await auth.data.members.updateOne({ _id: memberId }, { $set: { role } });
  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "member.role-changed",
    subject: member.email,
    detail: `${member.role} → ${role}`,
    at: new Date(),
  });

  return `${member.name} is now a ${role}.`;
}

/**
 * Disable or re-enable an account.
 *
 * Disabling is how somebody leaves. Their sessions stop working on the next
 * request — `currentMember` re-reads `status` every time rather than trusting
 * the cookie — and everything they published stays attributable.
 */
export async function setMemberStatus(
  auth: Authorized,
  memberId: ObjectId,
  status: Extract<MemberStatus, "active" | "disabled">,
): Promise<string> {
  const member = await load(auth, memberId);
  if (member.status === status) return "No change.";

  if (status === "disabled") {
    if (member._id.equals(new ObjectId(auth.member.id))) {
      throw new MemberError("You cannot disable your own account.", [
        "Ask another administrator to do it, so there is always somebody who can undo it.",
      ]);
    }
    /*
     * Unreachable today, and kept on purpose.
     *
     * `member.manage` belongs to admins alone, so an actor who is an active
     * admin proves there are at least two whenever the target is somebody else
     * — which means the only way to reach "the sole admin" here is to target
     * yourself, and the check above catches that first with a better message.
     *
     * It stays because it is the *rule*, not the coincidence. Granting
     * `member.manage` to a fifth role makes it reachable immediately, and that
     * is precisely the change that would otherwise remove the protection
     * without anyone noticing. `test/members.test.ts` records why it cannot
     * currently fire.
     */
    if (member.role === "admin" && (await activeAdminsBesides(auth, memberId)) === 0) {
      throw new MemberError("That is the only administrator.", [
        "Promote somebody else first, then disable this account.",
      ]);
    }
  }

  await auth.data.members.updateOne({ _id: memberId }, { $set: { status } });
  await auth.data.audit.insertOne({
    _id: new ObjectId(),
    actorId: new ObjectId(auth.member.id),
    action: "member.role-changed",
    subject: member.email,
    detail: `${member.status} → ${status}`,
    at: new Date(),
  });

  return status === "disabled"
    ? `${member.name} is disabled. Their sessions stop working on the next request.`
    : `${member.name} is active again.`;
}

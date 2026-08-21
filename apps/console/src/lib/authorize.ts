/**
 * The authorisation boundary.
 *
 * Every server action starts here. It resolves the session, refuses anything
 * that is not an active member, checks the capability, and hands back a
 * data view already scoped to that member's organisation — so an action
 * physically cannot reach another customer's documents, because it never holds
 * an unscoped handle to reach them with.
 *
 * The alternative — `const user = await currentUser(); if (!user) …` at the top
 * of twenty actions — is one forgotten line away from a cross-tenant read, and
 * that line is invisible in review because the code around it looks identical
 * either way.
 */

import { scoped, type Scoped } from "@/db/scope";
import { currentMember, type SessionMember } from "./auth";
import { can, whyNot, type Capability } from "./roles";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Sign in to continue.");
    this.name = "NotAuthenticatedError";
  }
}

export class NotPermittedError extends Error {
  constructor(
    readonly capability: Capability,
    message: string,
  ) {
    super(message);
    this.name = "NotPermittedError";
  }
}

export interface Authorized {
  member: SessionMember;
  /** Already restricted to this member's organisation. */
  data: Scoped;
  /**
   * The credential this request arrived on, when it was not a browser session.
   *
   * Absent for someone signed in; set to a token's label for the Figma plugin.
   * It lands in the audit detail, which is what makes "a draft authored by that
   * key" answerable — without it, a change made from a design file is recorded
   * as the person who minted the key sitting at the console, which is a true
   * statement about the actor and a misleading one about what happened.
   */
  via?: string;
}

/**
 * Resolve the caller and assert a capability.
 *
 * Throws rather than returning a result: an action that forgets to check a
 * returned boolean is the failure this exists to prevent, and a throw cannot
 * be forgotten.
 */
export async function authorize(capability: Capability): Promise<Authorized> {
  const member = await currentMember();
  if (!member) throw new NotAuthenticatedError();

  if (!can(member.role, capability)) {
    throw new NotPermittedError(
      capability,
      whyNot(member.role, capability) ?? "You do not have permission to do that.",
    );
  }

  return { member, data: scoped(member.orgId) };
}

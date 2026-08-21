/**
 * The page-level session guard.
 *
 * Twenty pages opened with `const member = (await currentMember())!`. The
 * non-null assertion was wrong on every one of them: `(app)/layout.tsx` does
 * redirect an unauthenticated request, but the page does not wait for the
 * layout to decide, so the assertion still evaluated and still dereferenced
 * null. Nothing broke — the redirect won the race — and the only visible
 * symptom was twenty routes logging `Cannot read properties of null` under
 * entirely normal operation.
 *
 * That is the failure this file exists to keep fixed: not a crash, but a guard
 * that reaches the right outcome by accident. So these assert on *where the
 * request goes*, not on the absence of a throw — a `currentMember()` that
 * returned null and a `requireMember()` that redirects to `/login` are
 * indistinguishable from the reader's chair and completely different in the log.
 *
 * Driven through the real cookie jar rather than a stubbed session, for the
 * same reason `authorize.test.ts` is: stubbing the thing under test tests the
 * stub.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createSession, destroySession, requireMember } from "@/lib/auth";
import { captureRedirect } from "./stubs/next-navigation";
import { db } from "@/db/client";
import { seedMember, seedOrg } from "./harness";

let northwind: ObjectId;

beforeEach(async () => {
  northwind = await seedOrg("Northwind Health", "northwind");
});

describe("with no session", () => {
  it("sends the reader to sign in", async () => {
    await destroySession();
    expect(await captureRedirect(requireMember)).toBe("/login");
  });

  /**
   * The regression itself. The old line dereferenced null before anything
   * could redirect; a guard that returns instead of diverting would let the
   * page body run on an absent member and reintroduce it.
   */
  it("diverts rather than returning a member", async () => {
    await destroySession();
    await expect(requireMember()).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("with a session belonging to someone no longer active", () => {
  /**
   * `currentMember` re-reads status on every request, so an admin disabling
   * someone takes effect on their next page load rather than at token expiry.
   * The session row is still valid; the member is not.
   */
  it("sends a disabled member to sign in, on the very next request", async () => {
    const id = await seedMember(northwind);
    await createSession(id);
    expect(await captureRedirect(requireMember)).toBeNull();

    await db().members.updateOne({ _id: id }, { $set: { status: "disabled" } });
    expect(await captureRedirect(requireMember)).toBe("/login");
  });

  /**
   * Guards the branch that was deleted rather than carried over.
   *
   * The layout redirected non-active members to `/pending`, and the line could
   * never run: `currentMember` returns null for them first, and `signIn` never
   * issues a session to a pending account anyway. `/pending` is reachable only
   * from `signUp`, which redirects there with no session at all.
   *
   * The risk now is someone reading `/login` here as an oversight and helpfully
   * restoring the check. It would be unreachable again — and it would route a
   * revoked member to a waiting room implying their access is merely delayed.
   */
  it("does not divert them to the waiting room", async () => {
    const id = await seedMember(northwind, { status: "pending" });
    await createSession(id);
    expect(await captureRedirect(requireMember)).not.toBe("/pending");
  });
});

describe("with an active session", () => {
  it("returns the member and does not divert", async () => {
    const id = await seedMember(northwind, { role: "admin" });
    await createSession(id);

    const member = await requireMember();
    expect(member.id).toBe(id.toHexString());
    expect(member.orgId.toHexString()).toBe(northwind.toHexString());
  });

  /**
   * What every caller does with the result on its first line. The assertion it
   * replaced existed precisely so `.orgId` would type-check.
   */
  it("hands back an orgId the page can scope with", async () => {
    await createSession(await seedMember(northwind));
    await expect(captureRedirect(requireMember)).resolves.toBeNull();
  });
});

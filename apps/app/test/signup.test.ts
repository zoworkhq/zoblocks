/**
 * Sign-up, which is the one write that happens without a session.
 *
 * `scoped()` cannot express this: the person has no organisation yet, so there
 * is nothing to scope by. That makes it one of three deliberate `unscoped*`
 * exceptions, and the reason it is safe is not the absence of a session — it is
 * that the account created grants nothing until somebody inside the
 * organisation approves it.
 */

import { describe, expect, it } from "vitest";
import { unscopedMemberByEmail, unscopedSignUp } from "@/db/scope";
import { signUpAction } from "@/lib/actions";
import { hashPassword } from "@/lib/auth";
import { twoOrgs } from "./harness";

async function applicant(email = "new@northwind.example") {
  return {
    name: "A Newcomer",
    email,
    emailLower: email.toLowerCase(),
    passwordHash: await hashPassword("correct-horse-battery-staple"),
    role: "viewer" as const,
    status: "pending" as const,
    createdAt: new Date(),
    approvedAt: null,
    approvedBy: null,
  };
}

describe("signing up", () => {
  it("creates a pending member in the named organisation", async () => {
    const { northwind } = await twoOrgs();

    expect(await unscopedSignUp("northwind", await applicant())).toEqual({ ok: true });

    const member = await unscopedMemberByEmail("new@northwind.example");
    expect(member?.status).toBe("pending");
    expect(member?.orgId.toHexString()).toBe(northwind.toHexString());
  });

  /**
   * Pending grants nothing. That is the whole safety argument for a public
   * write: the worst a stranger with a known org slug can do is create a row
   * somebody has to decline.
   */
  it("grants nothing until approved", async () => {
    await twoOrgs();
    await unscopedSignUp("northwind", await applicant());

    const member = await unscopedMemberByEmail("new@northwind.example");
    expect(member?.status).toBe("pending");
    expect(member?.approvedAt).toBeNull();
    expect(member?.approvedBy).toBeNull();
  });

  it("refuses an organisation that does not exist", async () => {
    await twoOrgs();
    expect(await unscopedSignUp("not-a-tenant", await applicant())).toEqual({
      ok: false,
      reason: "no-org",
    });
    expect(await unscopedMemberByEmail("new@northwind.example")).toBeNull();
  });

  /**
   * Decided by the unique index, not by a prior read. Two simultaneous sign-ups
   * with the same address would both pass a check-then-insert and one would win
   * silently.
   */
  it("refuses an address that is already taken", async () => {
    await twoOrgs();
    await unscopedSignUp("northwind", await applicant());

    expect(await unscopedSignUp("northwind", await applicant())).toEqual({
      ok: false,
      reason: "taken",
    });
  });

  it("refuses an address taken in a different organisation", async () => {
    await twoOrgs();
    await unscopedSignUp("northwind", await applicant("shared@example.org"));

    // One address is one person, across the whole system — the email index is
    // global, which is what makes sign-in able to find somebody without a scope.
    expect(await unscopedSignUp("southmere", await applicant("shared@example.org"))).toEqual({
      ok: false,
      reason: "taken",
    });
  });
});

/*
 * The form, not just the write beneath it.
 *
 * `unscopedSignUp` takes whatever slug it is handed and looks it up exactly,
 * which is correct — normalising belongs at the edge, with the other input.
 * The edge was not doing it: `email` was lower-cased and `organisation` was
 * not, so somebody typing their own company's name with a capital letter was
 * told to check the address with an administrator who, on a brand-new
 * organisation, is themselves. Found in production on the first real sign-up.
 */
describe("the organisation address a person actually types", () => {
  function form(organisation: string, email = "capitals@northwind.example") {
    const data = new FormData();
    data.set("name", "A Newcomer");
    data.set("email", email);
    data.set("password", "correct-horse-battery-staple");
    data.set("organisation", organisation);
    return data;
  }

  it.each(["Northwind", "NORTHWIND", "  northwind  "])(
    "accepts %j for the organisation whose slug is northwind",
    async (typed) => {
      await twoOrgs();

      // `redirect()` throws in the stub, which is how the success path ends.
      await expect(signUpAction(form(typed, `${typed.trim()}@example.test`))).rejects.toThrow();

      const member = await unscopedMemberByEmail(`${typed.trim().toLowerCase()}@example.test`);
      expect(member?.status).toBe("pending");
    },
  );

  it("still refuses an organisation that does not exist", async () => {
    await twoOrgs();

    const result = await signUpAction(form("nowhere"));

    expect(result.ok).toBe(false);
    expect(await unscopedMemberByEmail("capitals@northwind.example")).toBeNull();
  });
});

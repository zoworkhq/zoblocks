/**
 * The authorisation boundary.
 *
 * Every server action starts here, and it was at 0% coverage — which is the
 * worst place in this application for that to be true. It does three things
 * and each has a failure mode that looks like success: it resolves a session,
 * it refuses anyone who is not an active member, and it hands back a data view
 * *already scoped* to that member's organisation.
 *
 * That last one is the structural guarantee. An action cannot reach another
 * customer's documents because it never holds an unscoped handle to reach them
 * with — so these drive a real session through the real cookie jar rather than
 * stubbing `currentMember`, which would test the mock.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { ObjectId } from "mongodb";
import { createSession, destroySession } from "@/lib/auth";
import { NotAuthenticatedError, NotPermittedError, authorize } from "@/lib/authorize";
import { createTheme } from "@/lib/themes";
import { seedMember, seedOrg } from "./harness";

let northwind: ObjectId;
let southmere: ObjectId;

beforeEach(async () => {
  northwind = await seedOrg("Northwind Health", "northwind");
  southmere = await seedOrg("Southmere Trust", "southmere");
});

describe("without a session", () => {
  it("refuses", async () => {
    await destroySession();
    await expect(authorize("theme.read")).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("says what to do rather than only that it failed", async () => {
    await destroySession();
    await expect(authorize("theme.read")).rejects.toThrow("Sign in to continue.");
  });
});

describe("with a session", () => {
  it("resolves the member and a scoped view", async () => {
    const id = await seedMember(northwind, { role: "admin" });
    await createSession(id);

    const auth = await authorize("theme.read");
    expect(auth.member.id).toBe(id.toHexString());
    expect(auth.data.orgId.toHexString()).toBe(northwind.toHexString());
  });

  /**
   * The guarantee, end to end. The action never chose an organisation — it was
   * handed one, and the one it was handed is the only one it can read.
   */
  it("hands back a view that cannot see another organisation", async () => {
    const nwAdmin = await seedMember(northwind, { role: "admin" });
    await createSession(nwAdmin);
    const nw = await authorize("theme.write");
    await createTheme(nw, { name: "Clinical", brandColour: "#1d63c9" });

    const smAdmin = await seedMember(southmere, { role: "admin" });
    await createSession(smAdmin);
    const sm = await authorize("theme.read");

    expect(await nw.data.themes.countDocuments()).toBe(1);
    expect(await sm.data.themes.countDocuments()).toBe(0);
    expect(await sm.data.themes.findOne({ slug: "clinical" })).toBeNull();
  });
});

describe("capability gating", () => {
  it("lets an admin publish", async () => {
    await createSession(await seedMember(northwind, { role: "admin" }));
    await expect(authorize("theme.publish")).resolves.toBeTruthy();
  });

  it("refuses a designer the publish capability", async () => {
    await createSession(await seedMember(northwind, { role: "designer" }));
    await expect(authorize("theme.publish")).rejects.toBeInstanceOf(NotPermittedError);
  });

  it("lets a designer write", async () => {
    await createSession(await seedMember(northwind, { role: "designer" }));
    await expect(authorize("theme.write")).resolves.toBeTruthy();
  });

  it("refuses a viewer anything but reading", async () => {
    await createSession(await seedMember(northwind, { role: "viewer" }));
    await expect(authorize("theme.read")).resolves.toBeTruthy();
    for (const capability of ["theme.write", "theme.publish", "member.manage"] as const) {
      await expect(authorize(capability), capability).rejects.toBeInstanceOf(NotPermittedError);
    }
  });

  /**
   * A wall with a route out. Hiding the reason teaches the reader the feature
   * does not exist; naming who *can* do it turns a dead end into a next step.
   */
  it("names the role that can, in the error", async () => {
    await createSession(await seedMember(northwind, { role: "designer" }));
    await expect(authorize("theme.publish")).rejects.toThrow(/admin/);
  });

  it("carries the capability on the error, for a caller that wants to branch", async () => {
    await createSession(await seedMember(northwind, { role: "viewer" }));
    try {
      await authorize("theme.publish");
      expect.unreachable("should have refused");
    } catch (error) {
      expect((error as NotPermittedError).capability).toBe("theme.publish");
    }
  });
});

describe("account status", () => {
  /**
   * hq's rule, carried over: an account grants nothing until an administrator
   * approves it. A pending member with a valid session must still be refused,
   * or approval is decoration.
   */
  it("refuses a member awaiting approval", async () => {
    await createSession(await seedMember(northwind, { role: "admin", status: "pending" }));
    await expect(authorize("theme.read")).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("refuses a disabled member", async () => {
    await createSession(await seedMember(northwind, { role: "admin", status: "disabled" }));
    await expect(authorize("theme.read")).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

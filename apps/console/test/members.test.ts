/**
 * Who can be changed, and the one change nobody may make.
 *
 * The last-admin guard is the reason this file exists. Everything else here is
 * ordinary CRUD with an audit entry; that one rule is the difference between an
 * inconvenience and an organisation locked out of its own account with no path
 * back that does not involve somebody touching their database by hand.
 */

import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { MemberError, approveMember, changeRole, setMemberStatus } from "@/lib/members";
import { seedMember, twoOrgs } from "./harness";

async function org() {
  const { northwind, southmere, asNorthwind, asSouthmere } = await twoOrgs();
  return { northwind, southmere, nw: await asNorthwind(), sm: await asSouthmere() };
}

describe("approving", () => {
  it("activates a pending account with the chosen role", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { status: "pending", role: "viewer" });

    const message = await approveMember(nw, id, "designer");

    expect(message).toContain("designer");
    const member = await nw.data.members.findOne({ _id: id });
    expect(member?.status).toBe("active");
    expect(member?.role).toBe("designer");
    expect(member?.approvedBy).toBeInstanceOf(ObjectId);
  });

  it("records who approved it", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { status: "pending" });
    await approveMember(nw, id, "viewer");

    const entries = await nw.data.audit.find({ action: "member.approved" }).toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.detail).toBe("as viewer");
  });

  it("is idempotent for an account that is already active", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { status: "active", role: "designer" });

    expect(await approveMember(nw, id, "admin")).toContain("already active");
    expect((await nw.data.members.findOne({ _id: id }))?.role).toBe("designer");
  });

  it("refuses a role that does not exist", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { status: "pending" });
    await expect(approveMember(nw, id, "superuser" as never)).rejects.toThrow(MemberError);
  });
});

describe("the last administrator", () => {
  /**
   * `twoOrgs` seeds exactly one admin per organisation, so the acting member is
   * the only one — which is precisely the state the guard defends.
   */
  it("cannot be demoted", async () => {
    const { nw } = await org();
    const self = new ObjectId(nw.member.id);

    await expect(changeRole(nw, self, "viewer")).rejects.toThrow(/only administrator/);
    expect((await nw.data.members.findOne({ _id: self }))?.role).toBe("admin");
  });

  /**
   * The reachable half of the disable guard.
   *
   * Trying to disable the sole administrator can, today, only ever mean trying
   * to disable *yourself* — `member.manage` belongs to admins alone, so an
   * actor who is an active admin proves there are at least two whenever the
   * target is somebody else. The self-check therefore fires first, and its
   * message is the more useful one.
   *
   * The `only administrator` branch in `setMemberStatus` is deliberately kept
   * as the rule rather than the coincidence: it becomes reachable the moment
   * `member.manage` is granted to a fifth role, which is exactly the change
   * that would otherwise remove the protection without anyone noticing.
   */
  it("cannot disable itself, and says why", async () => {
    const { northwind, nw } = await org();
    await seedMember(northwind, { role: "designer", status: "active" });
    const self = new ObjectId(nw.member.id);

    await expect(setMemberStatus(nw, self, "disabled")).rejects.toThrow(/your own account/);
    expect((await nw.data.members.findOne({ _id: self }))?.status).toBe("active");
  });

  it("allows disabling another admin while one remains", async () => {
    const { northwind, nw } = await org();
    const other = await seedMember(northwind, { role: "admin", status: "active" });

    await expect(setMemberStatus(nw, other, "disabled")).resolves.toContain("disabled");
    expect(await nw.data.members.countDocuments({ role: "admin", status: "active" })).toBe(1);
  });

  it("can be demoted once somebody else is an admin", async () => {
    const { northwind, nw } = await org();
    const other = await seedMember(northwind, { role: "designer", status: "active" });
    const self = new ObjectId(nw.member.id);

    await changeRole(nw, other, "admin");
    await expect(changeRole(nw, self, "viewer")).resolves.toContain("viewer");
  });

  /** A pending or disabled admin is not an admin who can undo anything. */
  it("does not count a pending admin as cover", async () => {
    const { northwind, nw } = await org();
    await seedMember(northwind, { role: "admin", status: "pending" });
    const self = new ObjectId(nw.member.id);

    await expect(changeRole(nw, self, "viewer")).rejects.toThrow(/only administrator/);
  });
});

describe("disabling", () => {
  it("stops access without deleting anything", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { role: "designer", status: "active" });

    await setMemberStatus(nw, id, "disabled");

    const member = await nw.data.members.findOne({ _id: id });
    expect(member).not.toBeNull();
    expect(member?.status).toBe("disabled");
  });

  it("can be undone", async () => {
    const { northwind, nw } = await org();
    const id = await seedMember(northwind, { role: "designer", status: "disabled" });

    await setMemberStatus(nw, id, "active");
    expect((await nw.data.members.findOne({ _id: id }))?.status).toBe("active");
  });

  /**
   * Refused so there is always somebody left who can undo it — a person who
   * disables themselves has locked a door they are on the wrong side of.
   */
  it("refuses your own account", async () => {
    const { northwind, nw } = await org();
    await seedMember(northwind, { role: "admin", status: "active" });

    await expect(setMemberStatus(nw, new ObjectId(nw.member.id), "disabled")).rejects.toThrow(
      /your own account/,
    );
  });
});

describe("across organisations", () => {
  it("cannot change another organisation's member", async () => {
    const { northwind, sm } = await org();
    const theirs = await seedMember(northwind, { role: "designer", status: "active" });

    await expect(changeRole(sm, theirs, "admin")).rejects.toThrow("No such member");
    await expect(setMemberStatus(sm, theirs, "disabled")).rejects.toThrow("No such member");
    await expect(approveMember(sm, theirs, "admin")).rejects.toThrow("No such member");
  });

  it("counts admins within one organisation only", async () => {
    const { northwind, nw } = await org();
    // Southmere has its own admin; it must not count as cover for Northwind.
    const self = new ObjectId(nw.member.id);
    expect(await nw.data.members.countDocuments({ role: "admin", status: "active" })).toBe(1);
    await expect(changeRole(nw, self, "viewer")).rejects.toThrow(/only administrator/);
    expect(northwind).toBeDefined();
  });
});

/**
 * Who may do what.
 *
 * Capabilities rather than role checks at call sites: `can(role, "theme.publish")`
 * survives a fifth role being added, where `role === "admin" || role === "owner"`
 * scattered across twenty actions does not.
 *
 * The split that carries weight is Designer / Admin. A designer edits and
 * previews; an admin publishes, because publishing reaches a customer's
 * production application and is the action worth a second person.
 */

import { describe, expect, it } from "vitest";
import { can, capabilitiesFor, whyNot } from "@/lib/roles";
import type { Capability } from "@/lib/roles";
import type { MemberRole } from "@/db/collections";

const ROLES: MemberRole[] = ["admin", "designer", "developer", "viewer"];

describe("the grant table", () => {
  it("lets every role read", () => {
    for (const role of ROLES) expect(can(role, "theme.read"), role).toBe(true);
  });

  it("lets only an admin publish", () => {
    expect(can("admin", "theme.publish")).toBe(true);
    for (const role of ["designer", "developer", "viewer"] as const) {
      expect(can(role, "theme.publish"), role).toBe(false);
    }
  });

  it("lets a designer edit but not publish — the split that matters", () => {
    expect(can("designer", "theme.write")).toBe(true);
    expect(can("designer", "theme.publish")).toBe(false);
  });

  it("lets a developer export but not edit", () => {
    expect(can("developer", "theme.export")).toBe(true);
    expect(can("developer", "theme.write")).toBe(false);
  });

  it("gives a viewer nothing but reading", () => {
    /*
     * `market.browse` joined this list when the marketplace shipped, and it
     * belongs here rather than being an exception to the sentence above:
     * browsing a catalogue *is* reading. Nothing behind it spends money,
     * changes a theme or mints a credential — and a viewer who spots a pack
     * and tells an admin is the only marketing channel that exists inside the
     * product.
     */
    expect(capabilitiesFor("viewer")).toEqual(["theme.read", "market.browse"]);
  });

  it("reserves member and organisation management for an admin", () => {
    for (const capability of ["member.manage", "org.configure"] as const) {
      expect(can("admin", capability)).toBe(true);
      for (const role of ["designer", "developer", "viewer"] as const) {
        expect(can(role, capability), `${role}/${capability}`).toBe(false);
      }
    }
  });

  /**
   * A rollback puts a palette live. Anything that reaches production sits
   * behind the same gate as publishing, or the gate has a side door.
   */
  it("gates rollback exactly as it gates publish", () => {
    for (const role of ROLES) {
      expect(can(role, "theme.rollback"), role).toBe(can(role, "theme.publish"));
    }
  });

  it("grants strictly more the more senior the role", () => {
    const size = (r: MemberRole) => capabilitiesFor(r).length;
    expect(size("admin")).toBeGreaterThan(size("designer"));
    expect(size("designer")).toBeGreaterThan(size("developer"));
    expect(size("developer")).toBeGreaterThan(size("viewer"));
  });

  it("nests cleanly — a junior role holds a subset of a senior one's", () => {
    const pairs: [MemberRole, MemberRole][] = [
      ["viewer", "developer"],
      ["developer", "designer"],
      ["designer", "admin"],
    ];
    for (const [junior, senior] of pairs) {
      for (const capability of capabilitiesFor(junior)) {
        expect(can(senior, capability), `${senior} lacks ${capability}`).toBe(true);
      }
    }
  });
});

describe("the reason a control is disabled", () => {
  /**
   * Shown rather than hidden, per the mockups: hiding a control teaches the
   * user the feature does not exist, and the next thing they do is ask support
   * for something they already have.
   */
  it("says nothing when the role can do it", () => {
    expect(whyNot("admin", "theme.publish")).toBeUndefined();
  });

  it("names who can, so the message is a route rather than a wall", () => {
    const reason = whyNot("designer", "theme.publish");
    expect(reason).toContain("admin");
    expect(reason).toContain("edit and preview themes");
  });

  it("describes a viewer accurately", () => {
    expect(whyNot("viewer", "theme.write")).toContain("view themes");
  });

  it("has something to say for every role and capability it refuses", () => {
    const all: Capability[] = [
      "theme.read",
      "theme.write",
      "theme.publish",
      "theme.rollback",
      "theme.archive",
      "theme.export",
      "member.manage",
      "org.configure",
    ];
    for (const role of ROLES) {
      for (const capability of all) {
        const reason = whyNot(role, capability);
        if (can(role, capability)) expect(reason, `${role}/${capability}`).toBeUndefined();
        else expect(reason, `${role}/${capability}`).toBeTruthy();
      }
    }
  });
});

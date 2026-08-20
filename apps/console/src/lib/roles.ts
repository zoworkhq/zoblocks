/**
 * What each role may do.
 *
 * Four roles rather than hq's two, and the split that carries weight is
 * Designer / Admin. A designer edits and previews; an admin publishes.
 * Publishing is the action that reaches a customer's production application,
 * so it is the one worth a second person — and separating the two is cheaper
 * and clearer than an approval workflow bolted onto one role.
 *
 * Capabilities rather than role checks at call sites. `can(user, "theme.publish")`
 * survives a fifth role being added; `user.role === "admin" || user.role === "owner"`
 * scattered across twenty actions does not.
 */

import type { MemberRole } from "@/db/collections";

export type Capability =
  | "theme.read"
  | "theme.write"
  | "theme.publish"
  | "theme.rollback"
  | "theme.archive"
  | "theme.export"
  | "member.manage"
  | "org.configure";

const GRANTS: Record<MemberRole, readonly Capability[]> = {
  admin: [
    "theme.read",
    "theme.write",
    "theme.publish",
    "theme.rollback",
    "theme.archive",
    "theme.export",
    "member.manage",
    "org.configure",
  ],
  designer: ["theme.read", "theme.write", "theme.export"],
  developer: ["theme.read", "theme.export"],
  viewer: ["theme.read"],
};

/**
 * One sentence per role, in the words a member reads.
 *
 * Here rather than in a screen because it was in three: the role picker on a
 * member row, the reference table under it, and now the account page. Three
 * copies of the same sentence is three chances for a role to be granted one
 * thing and described as another, and the description is what somebody chooses
 * from.
 */
export const ROLE_SUMMARY: Record<MemberRole, string> = {
  admin: "Publishes, manages members, configures the organisation",
  designer: "Edits and previews themes — cannot publish",
  developer: "Reads and exports",
  viewer: "Reads",
};

/**
 * A note on `theme.read`, which is checked nowhere.
 *
 * Every role holds it, so a check could never reject anybody — it is a
 * statement that reading requires *some* role, not a gate. It stays in the
 * table because removing it would make the table lie by omission: a viewer can
 * read, and the grants are what a customer is shown when they choose a role.
 *
 * `theme.export` is the opposite and was the real gap: three roles hold it, a
 * viewer does not, and until the transfer screen consulted it a viewer could
 * download the entire design system.
 */
export function can(role: MemberRole, capability: Capability): boolean {
  return GRANTS[role].includes(capability);
}

export function capabilitiesFor(role: MemberRole): readonly Capability[] {
  return GRANTS[role];
}

/**
 * The message a disabled control carries.
 *
 * Shown rather than hidden, per the mockups: hiding a control teaches the user
 * the feature does not exist, and the next thing they do is ask support for
 * something they already have. Naming the role that can do it turns a dead end
 * into a route.
 */
export function whyNot(role: MemberRole, capability: Capability): string | undefined {
  if (can(role, capability)) return undefined;

  const holders = (Object.keys(GRANTS) as MemberRole[]).filter((r) => can(r, capability));
  const list =
    holders.length === 1
      ? `an ${holders[0]}`
      : `${holders.slice(0, -1).join(", ")} or ${holders.at(-1)}`;

  return `Your role can ${capabilitiesFor(role).includes("theme.write") ? "edit and preview themes" : "view themes"}. This needs ${list}.`;
}

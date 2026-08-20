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
  | "org.configure"
  | "market.browse"
  | "market.purchase"
  | "market.install"
  | "market.token";

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
    "market.browse",
    "market.purchase",
    "market.install",
    "market.token",
  ],
  designer: [
    "theme.read",
    "theme.write",
    "theme.export",
    "market.browse",
    "market.install",
    "market.token",
  ],
  developer: ["theme.read", "theme.export", "market.browse", "market.token"],
  viewer: ["theme.read", "market.browse"],
};

/**
 * Why the marketplace grants split the way they do.
 *
 * **`market.purchase` is admin-only, and it is the same argument as
 * `theme.publish`.** Publishing is separated from editing because it reaches a
 * customer's production application — the action whose consequences land
 * outside the console gets the narrower grant. Spending the organisation's
 * money is that action with a currency symbol on it. A designer asks; an admin
 * answers by buying, which is a one-click approval rather than a workflow.
 *
 * **`market.install` follows `theme.write`**, because installing a pack edits
 * a theme draft and nothing more. It cannot publish, so a purchase is never a
 * back door around the designer/admin split.
 *
 * **`market.token` starts at developer**, who needs a CLI credential every time
 * they set up a machine and should not have to book an admin for it. That is
 * only safe because a token is labelled, expiring, revocable and audited —
 * without those four it would be a permanent bearer credential handed to the
 * role with the least reason to think about credentials.
 *
 * A designer holds it too, and not because a designer wants one: **this table
 * nests**, and `test/roles.test.ts` asserts it. Every capability a junior role
 * has, the senior role has as well. A first draft gave `market.token` to
 * developers and withheld it from designers on the reasoning that a designer
 * has no CLI — which reads sensibly and quietly makes the grants a lattice
 * rather than a ladder, so "more senior" stops meaning "can do more". The
 * invariant is worth more than the distinction.
 *
 * **`market.browse` is universal.** Seeing the shelf costs nothing and a
 * viewer who spots a pack tells the admin, which is the only marketing channel
 * inside the product.
 */

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

  /*
   * A separate sentence for the marketplace, and the theme wording left alone.
   *
   * "Your role can edit and preview themes. This needs an admin." is right in
   * front of a publish button and a non-sequitur in front of a Buy button —
   * but rewriting it for both would change a message that is deliberate where
   * it already appears. So the marketplace gets its own clause and the
   * existing one is untouched.
   */
  if (capability.startsWith("market.")) {
    return `Your role cannot do this in the marketplace. It needs ${list}.`;
  }

  return `Your role can ${capabilitiesFor(role).includes("theme.write") ? "edit and preview themes" : "view themes"}. This needs ${list}.`;
}

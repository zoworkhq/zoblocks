/**
 * What an organisation may fetch, and why.
 *
 * The one idea worth holding on to: **an entitlement is a record, not a
 * flag.** It names what was granted, when, by whom or by which order, and — if
 * it was withdrawn — when and why. That shape is what makes a refund, a
 * contract that ended, and a dispute all the same operation, and it is why
 * this exists before any payment code does.
 *
 * Granting takes an `orgId` rather than an `Authorized`, because the caller
 * that matters most has no session: a Stripe webhook arrives with a verified
 * payload and no cookie. It resolves the organisation from the payload and
 * builds a scope from it, which is the same `scoped()` every other path uses —
 * so the webhook is not an exception to tenancy, only to authentication.
 */

import { ObjectId } from "mongodb";
import { scoped } from "@/db/scope";
import type { EntitlementDoc } from "@/db/collections";

export class MarketError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = "MarketError";
  }
}

export interface GrantInput {
  /** An order `_id`, or `contract:<reason>` when it came with an engagement. */
  via: string;
  /** The member who acted, when one did. A webhook has none. */
  by?: ObjectId | null;
  versionLine: number;
}

/**
 * Grant one item to one organisation, idempotently.
 *
 * An upsert rather than an insert, and the unique index on
 * `{ orgId, itemId }` is what makes it safe: two concurrent grants produce one
 * row, and the second is a no-op instead of a duplicate that a later revoke
 * would only half undo.
 *
 * Re-granting something previously revoked clears the revocation rather than
 * leaving a contradictory row — that is a genuine case (a refund reversed, a
 * contract renewed), and the alternative is a document that says both.
 */
export async function grant(orgId: ObjectId, itemId: ObjectId, input: GrantInput): Promise<void> {
  const data = scoped(orgId);
  await data.entitlements.updateOne(
    { itemId },
    {
      $set: {
        versionLine: input.versionLine,
        grantedAt: new Date(),
        grantedBy: input.by ?? null,
        grantedVia: input.via,
        revokedAt: null,
        revokedReason: null,
      },
      $setOnInsert: { _id: new ObjectId(), itemId },
    },
    { upsert: true },
  );
}

/**
 * Withdraw access, keeping the row.
 *
 * What this cannot do is unsend bytes. A pack already downloaded stays on the
 * laptop it was downloaded to, and an icon installed into a theme is in that
 * organisation's own asset store by design — the customer's published
 * stylesheet points at it. Revocation stops *future* fetches, and the licence
 * says so in words rather than implying a power the software does not have.
 */
export async function revoke(orgId: ObjectId, itemId: ObjectId, reason: string): Promise<void> {
  const data = scoped(orgId);
  await data.entitlements.updateOne(
    { itemId },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  );
}

/** The live entitlement for one item, or nothing. Revoked rows are not live. */
export async function entitlementFor(
  orgId: ObjectId,
  itemId: ObjectId,
): Promise<EntitlementDoc | undefined> {
  const found = await scoped(orgId).entitlements.findOne({ itemId, revokedAt: null });
  return found ?? undefined;
}

/**
 * The single question every delivery route asks.
 *
 * A boolean rather than a document, and a *throwing* helper beside it, because
 * the failure this guards against is a route that checks and then forgets to
 * act on the answer.
 */
export async function isEntitled(orgId: ObjectId, itemId: ObjectId): Promise<boolean> {
  return (await entitlementFor(orgId, itemId)) !== undefined;
}

export async function assertEntitled(orgId: ObjectId, itemId: ObjectId): Promise<EntitlementDoc> {
  const entitlement = await entitlementFor(orgId, itemId);
  if (!entitlement) throw new MarketError("This organisation has not bought that.");
  return entitlement;
}

/** Everything this organisation currently holds, newest first. */
export async function held(orgId: ObjectId): Promise<EntitlementDoc[]> {
  return scoped(orgId).entitlements.find({ revokedAt: null }).sort({ grantedAt: -1 }).toArray();
}

/** Including withdrawn ones — the Purchases screen shows both, and says which. */
export async function heldIncludingRevoked(orgId: ObjectId): Promise<EntitlementDoc[]> {
  return scoped(orgId).entitlements.find().sort({ grantedAt: -1 }).toArray();
}

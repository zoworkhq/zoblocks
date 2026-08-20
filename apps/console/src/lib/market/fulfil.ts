/**
 * Turning a payment into an entitlement, exactly once.
 *
 * Stripe is explicit that this function will be called more than once, and
 * possibly twice at the same instant: the webhook guarantees fulfilment
 * happens at all, and the success page calls it too so the customer is not
 * left watching a spinner while a webhook is queued. Both are recommended.
 * Both together are only safe if the granting step is a claim rather than a
 * check.
 *
 * So it is written the way `claimFirstAdmin` is written in hq. A count is a
 * read: several simultaneous sign-ups all read zero and all become
 * administrators. A "have we fulfilled this yet" read is the same shape, and
 * gets the same treatment — one atomic write decides, and the loser is told it
 * lost rather than being handed an error.
 */

import { ObjectId } from "mongodb";
import { scoped } from "@/db/scope";
import { itemBySlug, itemsByIds } from "./catalogue";
import { grant, revoke } from "./entitlements";
import { stripeGateway, type CheckoutSession, type PaymentGateway } from "./stripe";

export type FulfilmentReason =
  /** Entitlements were written by this call. */
  | "granted"
  /** Somebody else won the claim; the purchase is already delivered. */
  | "already"
  /** A delayed payment method that has not settled. Not an error. */
  | "unpaid"
  /** The session names an organisation or items we cannot resolve. */
  | "unresolvable"
  /** Paid less than the catalogue price. Held for a human. */
  | "underpaid";

export interface Fulfilment {
  reason: FulfilmentReason;
  granted: string[];
  orderId?: string;
}

/**
 * Safe to call many times, concurrently, from the webhook and from the
 * success page, for the same session.
 */
export async function fulfil(
  sessionId: string,
  gateway: PaymentGateway = stripeGateway(),
): Promise<Fulfilment> {
  const session = await gateway.retrieveCheckoutSession(sessionId);
  return fulfilSession(session);
}

/** The half that needs no network, so a test can drive it with a literal. */
export async function fulfilSession(session: CheckoutSession): Promise<Fulfilment> {
  /*
   * `unpaid` is a normal state, not a failure.
   *
   * Bank debits and other delayed methods complete the Checkout Session first
   * and settle days later, arriving as `checkout.session.async_payment_succeeded`.
   * Treating this as an error would mean the customers who pay the most are the
   * ones we silently never deliver to.
   */
  if (session.payment_status === "unpaid") {
    return { reason: "unpaid", granted: [] };
  }

  const orgId = readObjectId(session.metadata?.orgId ?? session.client_reference_id);
  const slugs = (session.metadata?.items ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!orgId || slugs.length === 0) {
    return { reason: "unresolvable", granted: [] };
  }

  const items = await Promise.all(slugs.map((slug) => itemBySlug(slug).catch(() => undefined)));
  const resolved = items.filter((item) => item !== undefined);
  if (resolved.length !== slugs.length) {
    return { reason: "unresolvable", granted: [] };
  }

  /*
   * What we charged against what the catalogue says.
   *
   * Tax is added on top, so the total can legitimately exceed the list price —
   * but it can never be *below* it. A shortfall means a Stripe Price drifted
   * from the catalogue row, and delivering against it would turn a
   * configuration mistake into free stock. Held rather than refused outright:
   * the order is recorded, and a person decides.
   */
  const expected = resolved.reduce((total, item) => total + (item.priceMinor ?? 0), 0);
  if (session.amount_total !== null && session.amount_total < expected) {
    await scoped(orgId).orders.updateOne(
      { _id: session.id },
      { $set: { status: "open", amountMinor: session.amount_total } },
    );
    return { reason: "underpaid", granted: [], orderId: session.id };
  }

  /*
   * The claim.
   *
   * `_id` is the Stripe session id and `fulfilledAt: null` is in the filter, so
   * exactly one caller can transition it. `returnDocument: "before"` is what
   * makes the winner distinguishable: the winner sees `null` (or no document
   * at all, on the upsert), the loser sees a date.
   *
   * The upsert matters for the case where the order row is missing entirely —
   * a session created before this deployment, or a customer who paid through a
   * Payment Link. Fulfilment must not depend on our own bookkeeping having run
   * first.
   */
  let before;
  try {
    before = await scoped(orgId).orders.findOneAndUpdate(
      { _id: session.id, fulfilledAt: null },
      {
        $set: {
          status: "paid" as const,
          fulfilledAt: new Date(),
          amountMinor: session.amount_total,
          currency: session.currency,
          ...(session.payment_intent ? { paymentIntent: session.payment_intent } : {}),
        },
        $setOnInsert: {
          memberId: readObjectId(session.metadata?.memberId),
          items: slugs,
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "before" },
    );
  } catch (error) {
    /*
     * A duplicate key here *is* the answer, and it took a concurrency test to
     * see it.
     *
     * An upsert whose filter does not match tries to insert — and when the row
     * exists with `fulfilledAt` already set, the filter cannot match, so Mongo
     * attempts an insert against an `_id` that is taken and raises E11000.
     * That is not a failure: it is the database telling us somebody else won
     * the claim, decided by the unique index rather than by a read this code
     * performed.
     *
     * The same idiom `unscopedSignUp` uses for two simultaneous sign-ups with
     * one email. Letting it throw would surface a 500 to Stripe, which would
     * retry, which would raise it again.
     */
    if ((error as { code?: number }).code !== 11000) throw error;
    const existing = await scoped(orgId).orders.findOne({ _id: session.id });
    return { reason: "already", granted: existing?.items ?? slugs, orderId: session.id };
  }

  if (before?.fulfilledAt) {
    return { reason: "already", granted: before.items, orderId: session.id };
  }

  for (const item of resolved) {
    await grant(orgId, item._id, {
      via: session.id,
      by: readObjectId(session.metadata?.memberId),
      versionLine: item.liveVersion,
    });
  }

  await scoped(orgId).audit.insertOne({
    _id: new ObjectId(),
    // A webhook has no member. `actorId` is the buyer when the session named
    // one, and a zero id when it did not — an audit row with a fabricated
    // actor would be worse than one that admits the actor is unknown.
    actorId: readObjectId(session.metadata?.memberId) ?? new ObjectId("000000000000000000000000"),
    action: "market.purchased",
    subject: slugs.join(", "),
    detail: `order ${session.id}`,
    at: new Date(),
  });

  return { reason: "granted", granted: slugs, orderId: session.id };
}

/**
 * A refund withdraws access.
 *
 * Driven from the charge's metadata rather than from a lookup, because the
 * charge is the only thing this event carries and searching for it would mean
 * a query across every organisation's orders.
 */
export async function revokeForCharge(charge: {
  payment_intent?: string | null;
  metadata?: Record<string, string> | null;
}): Promise<{ revoked: string[] }> {
  const orgId = readObjectId(charge.metadata?.orgId);
  const slugs = (charge.metadata?.items ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!orgId || slugs.length === 0) return { revoked: [] };

  const items = await Promise.all(slugs.map((slug) => itemBySlug(slug).catch(() => undefined)));
  const resolved = items.filter((item) => item !== undefined);

  for (const item of resolved) {
    await revoke(orgId, item._id, "refunded");
  }

  if (charge.payment_intent) {
    await scoped(orgId).orders.updateOne(
      { paymentIntent: charge.payment_intent },
      { $set: { status: "refunded" as const, refundedAt: new Date() } },
    );
  }

  if (resolved.length > 0) {
    await scoped(orgId).audit.insertOne({
      _id: new ObjectId(),
      actorId: new ObjectId("000000000000000000000000"),
      action: "market.revoked",
      subject: resolved.map((item) => item.slug).join(", "),
      detail: "refunded",
      at: new Date(),
    });
  }

  return { revoked: resolved.map((item) => item.slug) };
}

/** An expired session is a fact worth keeping, not a row to delete. */
export async function markExpired(
  session: Pick<CheckoutSession, "id" | "metadata">,
): Promise<void> {
  const orgId = readObjectId(session.metadata?.orgId);
  if (!orgId) return;
  await scoped(orgId).orders.updateOne(
    { _id: session.id, fulfilledAt: null },
    { $set: { status: "expired" as const } },
  );
}

/** Names the items behind an order, for the success page. */
export async function orderItems(orgId: ObjectId, orderId: string) {
  const order = await scoped(orgId).orders.findOne({ _id: orderId });
  if (!order) return undefined;
  const items = await Promise.all(
    order.items.map((slug) => itemBySlug(slug).catch(() => undefined)),
  );
  return { order, items: items.filter((item) => item !== undefined) };
}

export { itemsByIds };

/** Never throws on a malformed id: a webhook payload is untrusted input. */
function readObjectId(value: string | null | undefined): ObjectId | null {
  if (!value || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

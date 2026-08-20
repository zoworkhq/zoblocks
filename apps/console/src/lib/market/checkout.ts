/**
 * Starting a purchase.
 *
 * One rule dominates this file, and it is the most commonly-missed thing in
 * the whole category: **the browser sends a slug; the server decides the
 * price.** An endpoint that accepts `{ priceId }` — never mind `{ amount }` —
 * sells a $450 component for whatever the caller says it costs, and it does so
 * silently, with a valid Stripe receipt.
 *
 * So the only client input here is a catalogue slug. Everything a payment is
 * made of comes out of `catalogItems`.
 */

import { ObjectId } from "mongodb";
import { scoped } from "@/db/scope";
import type { Authorized } from "@/lib/authorize";
import { itemBySlug } from "./catalogue";
import { entitlementFor, MarketError } from "./entitlements";
import { stripeGateway, type PaymentGateway } from "./stripe";

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

/**
 * Create a Checkout Session for one catalogue item.
 *
 * Refuses four things before Stripe is called at all, because every one of
 * them is cheaper to explain here than after money has moved:
 * an unlisted item, an item with no price, an item this organisation already
 * owns, and — implicitly, through `authorize` at the call site — a member
 * without `market.purchase`.
 */
export async function createCheckout(
  auth: Authorized,
  slug: string,
  origin: string,
  gateway: PaymentGateway = stripeGateway(),
): Promise<CheckoutResult> {
  const item = await itemBySlug(slug);

  if (!item.listedAt) {
    throw new MarketError(`${item.title} is not currently for sale.`);
  }
  if (item.priceMinor === null || !item.stripePriceId) {
    throw new MarketError(`${item.title} is sold as part of an engagement.`, [
      "Ask for an invoice and it will be granted to this organisation directly.",
    ]);
  }

  const already = await entitlementFor(auth.member.orgId, item._id);
  if (already) {
    throw new MarketError(`Your organisation already owns ${item.title}.`, [
      "Purchases belong to the organisation, so a colleague may have bought it.",
    ]);
  }

  /*
   * The same metadata on the session *and* on the PaymentIntent.
   *
   * A refund arrives as `charge.refunded`, which carries a charge and no
   * session — and a charge inherits its PaymentIntent's metadata. Without this
   * the webhook would have to search every organisation's orders for a payment
   * intent, which is precisely the unscoped query this codebase is built to
   * make impossible.
   */
  const metadata = {
    orgId: auth.member.orgId.toHexString(),
    itemId: item._id.toHexString(),
    items: item.slug,
    memberId: auth.member.id,
  };

  const session = await gateway.createCheckoutSession({
    lineItems: [{ price: item.stripePriceId, quantity: 1 }],
    successUrl: `${origin}/market/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/market/${item.slug}`,
    clientReferenceId: metadata.orgId,
    metadata,
    customerEmail: auth.member.email,
    automaticTax: true,
    /*
     * Keyed on the organisation, the item and the day.
     *
     * A double-clicked Buy button creates one session rather than two, and a
     * genuine second attempt tomorrow is still allowed — an idempotency key
     * with no time component would leave a customer who abandoned checkout
     * unable to try again.
     */
    idempotencyKey: `checkout:${metadata.orgId}:${item.slug}:${new Date().toISOString().slice(0, 10)}`,
  });

  if (!session.url) throw new MarketError("Stripe did not return a checkout URL.");

  /*
   * The order is written *before* the customer is redirected, and its `_id` is
   * the session id. Two reasons, both learned the hard way in this category:
   * an abandoned checkout is a fact worth having (a spike in expired orders is
   * a pricing or tax-surprise signal, not a bug), and fulfilment's atomic claim
   * needs a document to claim.
   */
  await scoped(auth.member.orgId).orders.findOneAndUpdate(
    { _id: session.id },
    {
      $setOnInsert: {
        memberId: new ObjectId(auth.member.id),
        items: [item.slug],
        amountMinor: item.priceMinor,
        currency: item.currency,
        status: "open" as const,
        fulfilledAt: null,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { url: session.url, sessionId: session.id };
}

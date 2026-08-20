/**
 * Money.
 *
 * Two properties carry this whole area, and both are invisible from outside:
 *
 *   **The price comes from the catalogue, never from the caller.** An endpoint
 *   that accepts a price sells a $450 component for a cent, with a valid Stripe
 *   receipt to show for it. The fake gateway records what it was asked for, so
 *   that is assertable here rather than only reviewable.
 *
 *   **Fulfilment happens exactly once.** It is called by the webhook *and* by
 *   the success page, possibly at the same instant, and Stripe retries. The
 *   claim is an atomic write for the same reason `claimFirstAdmin` is: a
 *   check-then-act grants twice.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { scoped } from "@/db/scope";
import { createCheckout } from "@/lib/market/checkout";
import { grant, isEntitled } from "@/lib/market/entitlements";
import {
  fulfil,
  fulfilInvoice,
  fulfilSession,
  markExpired,
  orderItems,
  revokeForCharge,
} from "@/lib/market/fulfil";
import { actingAs, twoOrgs } from "./harness";
import { checkoutSession, fakeGateway, seedItem } from "./market-harness";

describe("starting a purchase", () => {
  it("sends Stripe the catalogue's price, not the caller's", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ slug: "clinical-icons", priceMinor: 18000 });
    const gateway = fakeGateway();

    await createCheckout(auth, item.slug, "https://console.test", gateway);

    // The only thing that reached Stripe is the price id stored on the item.
    expect(gateway.created[0]?.lineItems).toEqual([{ price: item.stripePriceId, quantity: 1 }]);
  });

  it("stamps the organisation on the session and on the payment intent", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();
    const gateway = fakeGateway();

    await createCheckout(auth, item.slug, "https://console.test", gateway);

    const input = gateway.created[0]!;
    expect(input.clientReferenceId).toBe(northwind.toHexString());
    expect(input.metadata.orgId).toBe(northwind.toHexString());
    expect(input.metadata.items).toBe(item.slug);
    // Without this a refund has no organisation to resolve, and finding one
    // would mean a query across every customer's orders.
    expect(input.metadata.itemId).toBe(item._id.toHexString());
  });

  it("turns tax on, because digital goods are taxed where the customer is", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();
    const gateway = fakeGateway();

    await createCheckout(auth, item.slug, "https://console.test", gateway);
    expect(gateway.created[0]?.automaticTax).toBe(true);
  });

  it("records the order before the customer leaves for Stripe", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();
    const gateway = fakeGateway();

    const { sessionId } = await createCheckout(auth, item.slug, "https://console.test", gateway);

    const order = await scoped(northwind).orders.findOne({ _id: sessionId });
    expect(order).toMatchObject({ status: "open", fulfilledAt: null, items: [item.slug] });
  });

  it("refuses an item that is not for sale", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ listed: false });

    await expect(
      createCheckout(auth, item.slug, "https://console.test", fakeGateway()),
    ).rejects.toThrow("not currently for sale");
  });

  it("refuses an item that is only granted by contract", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ priceMinor: null, stripePriceId: null });

    await expect(
      createCheckout(auth, item.slug, "https://console.test", fakeGateway()),
    ).rejects.toThrow("sold as part of an engagement");
  });

  it("refuses to sell the same organisation something twice", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_earlier", versionLine: 1 });

    // The message names the reason a buyer will not have thought of: somebody
    // else in their organisation bought it.
    await expect(
      createCheckout(auth, item.slug, "https://console.test", fakeGateway()),
    ).rejects.toThrow("already owns");
  });

  it("refuses an unknown slug", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");

    await expect(
      createCheckout(auth, "nope", "https://console.test", fakeGateway()),
    ).rejects.toThrow("No such item");
  });
});

describe("fulfilment happens once", () => {
  it("grants on the first call and reports the second as already done", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const session = checkoutSession(northwind, [item.slug]);

    const first = await fulfilSession(session);
    const second = await fulfilSession(session);

    expect(first.reason).toBe("granted");
    expect(second.reason).toBe("already");
    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
  });

  it("survives the webhook and the success page arriving together", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const session = checkoutSession(northwind, [item.slug]);

    const outcomes = await Promise.all(Array.from({ length: 6 }, () => fulfilSession(session)));

    // Exactly one caller wins the claim; every other is told it lost, and
    // none of them produces a second entitlement.
    expect(outcomes.filter((o) => o.reason === "granted")).toHaveLength(1);
    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
    expect(await scoped(northwind).orders.countDocuments()).toBe(1);
  });

  it("grants without a pre-existing order row", async () => {
    // A Payment Link, or a session created before this deployment. Fulfilment
    // must not depend on our own bookkeeping having run first.
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilSession(checkoutSession(northwind, [item.slug]));

    expect(result.reason).toBe("granted");
    expect(await isEntitled(northwind, item._id)).toBe(true);
  });

  it("writes an audit row naming the order", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    const [entry] = await scoped(northwind).audit.find({ action: "market.purchased" }).toArray();
    expect(entry?.subject).toBe(item.slug);
    expect(entry?.detail).toContain("cs_test_webhook");
  });

  it("goes through the gateway when given only a session id", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem();
    const gateway = fakeGateway({ metadata: null });

    const { sessionId } = await createCheckout(auth, item.slug, "https://console.test", gateway);
    const result = await fulfil(sessionId, gateway);

    // `client_reference_id` alone is enough to resolve the organisation, but
    // without `items` there is nothing to grant — so it refuses rather than
    // guessing.
    expect(result.reason).toBe("unresolvable");
  });
});

describe("fulfilment refuses the states it should", () => {
  it("treats an unsettled payment as normal, not as a failure", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], { payment_status: "unpaid" }),
    );

    // Bank debits settle days later as `async_payment_succeeded`. Treating
    // this as an error would mean never delivering to the customers who pay
    // the most.
    expect(result.reason).toBe("unpaid");
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("holds a payment below the catalogue price for a human", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ priceMinor: 29000 });

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], { amount_total: 100 }),
    );

    expect(result.reason).toBe("underpaid");
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("accepts a total above the price, because tax is added on top", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ priceMinor: 29000 });

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], { amount_total: 34800 }),
    );

    expect(result.reason).toBe("granted");
  });

  it("refuses a session naming an item that does not exist", async () => {
    const { northwind } = await twoOrgs();
    const result = await fulfilSession(checkoutSession(northwind, ["ghost-pack"]));
    expect(result.reason).toBe("unresolvable");
  });

  it("refuses a session with a malformed organisation id", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], {
        client_reference_id: "not-an-object-id",
        metadata: { orgId: "not-an-object-id", items: item.slug },
      }),
    );

    expect(result.reason).toBe("unresolvable");
  });
});

describe("refunds and expiries", () => {
  it("withdraws access and marks the order refunded", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    const { revoked } = await revokeForCharge({
      payment_intent: "pi_test_webhook",
      metadata: { orgId: northwind.toHexString(), items: item.slug },
    });

    expect(revoked).toEqual([item.slug]);
    expect(await isEntitled(northwind, item._id)).toBe(false);

    const order = await scoped(northwind).orders.findOne({ _id: "cs_test_webhook" });
    expect(order?.status).toBe("refunded");
  });

  it("ignores a charge carrying no organisation", async () => {
    expect(await revokeForCharge({ metadata: null })).toEqual({ revoked: [] });
    expect(await revokeForCharge({ metadata: { items: "x" } })).toEqual({ revoked: [] });
  });

  it("records an abandoned checkout without touching a fulfilled one", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const session = checkoutSession(northwind, [item.slug]);

    await markExpired(session);
    expect((await scoped(northwind).orders.findOne({ _id: session.id }))?.status).toBeUndefined();

    // Now fulfil it, then let a late `expired` event arrive: the filter carries
    // `fulfilledAt: null`, so a delivered purchase cannot be un-delivered by an
    // out-of-order webhook.
    await fulfilSession(session);
    await markExpired(session);
    expect((await scoped(northwind).orders.findOne({ _id: session.id }))?.status).toBe("paid");
  });

  it("ignores an expiry with no organisation", async () => {
    await expect(markExpired({ id: "cs_x", metadata: null })).resolves.toBeUndefined();
  });
});

describe("reading an order back", () => {
  it("names the items behind it", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    const found = await orderItems(northwind, "cs_test_webhook");
    expect(found?.items.map((i) => i.slug)).toEqual([item.slug]);
  });

  it("returns nothing for another organisation's order", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    expect(await orderItems(southmere, "cs_test_webhook")).toBeUndefined();
  });

  it("returns nothing for an unknown order", async () => {
    const { northwind } = await twoOrgs();
    expect(await orderItems(northwind, new ObjectId().toHexString())).toBeUndefined();
  });
});

describe("the paths a webhook reaches and a happy path does not", () => {
  it("reports 'already' when the claim loses to an existing fulfilled order", async () => {
    /*
     * The duplicate-key branch, reached directly.
     *
     * An upsert whose filter no longer matches attempts an insert against a
     * taken `_id`, and E11000 is the answer rather than an error. The
     * concurrency test above hits this by racing; this one hits it
     * deterministically, because a branch that only a race reaches is a branch
     * that only sometimes runs.
     */
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const session = checkoutSession(northwind, [item.slug]);

    await fulfilSession(session);
    const again = await fulfilSession(session);

    expect(again.reason).toBe("already");
    expect(again.granted).toEqual([item.slug]);
  });

  it("resolves the organisation from client_reference_id when metadata omits it", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], {
        metadata: { items: item.slug },
      }),
    );

    expect(result.reason).toBe("granted");
  });

  it("grants without a member when the session names none", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], {
        metadata: { orgId: northwind.toHexString(), items: item.slug },
      }),
    );

    expect(result.reason).toBe("granted");
    // The audit row admits the actor is unknown rather than inventing one.
    const [entry] = await scoped(northwind).audit.find({ action: "market.purchased" }).toArray();
    expect(entry?.actorId.toHexString()).toBe("000000000000000000000000");
  });

  it("treats a free item as paid rather than as unpaid", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ priceMinor: 0, stripePriceId: "price_free" });

    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], {
        payment_status: "no_payment_required",
        amount_total: 0,
      }),
    );

    expect(result.reason).toBe("granted");
  });

  it("skips a refund for an item that has left the catalogue", async () => {
    const { northwind } = await twoOrgs();
    const result = await revokeForCharge({
      payment_intent: "pi_gone",
      metadata: { orgId: northwind.toHexString(), items: "ghost-pack" },
    });
    expect(result.revoked).toEqual([]);
  });
});

describe("the enterprise route: an invoice", () => {
  const invoice = (
    orgId: import("mongodb").ObjectId,
    slugs: string[],
    overrides: Partial<import("@/lib/market/stripe").StripeInvoice> = {},
  ): import("@/lib/market/stripe").StripeInvoice => ({
    id: "in_test_1",
    status: "paid",
    amount_paid: 29000,
    currency: "usd",
    customer: "cus_test",
    metadata: { orgId: orgId.toHexString(), items: slugs.join(",") },
    ...overrides,
  });

  it("grants against a paid invoice", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const result = await fulfilInvoice(invoice(northwind, [item.slug]));

    expect(result.reason).toBe("granted");
    expect(await isEntitled(northwind, item._id)).toBe(true);
    // The order is keyed on the invoice id, exactly as a checkout is keyed on
    // its session — one claim, whichever instrument paid.
    expect(await scoped(northwind).orders.findOne({ _id: "in_test_1" })).toMatchObject({
      status: "paid",
    });
  });

  it("delivers once however many times the webhook arrives", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const paid = invoice(northwind, [item.slug]);

    const outcomes = await Promise.all(Array.from({ length: 4 }, () => fulfilInvoice(paid)));
    await fulfilInvoice(paid);

    expect(outcomes.filter((o) => o.reason === "granted")).toHaveLength(1);
    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
    expect(await scoped(northwind).orders.countDocuments()).toBe(1);
  });

  it("waits rather than delivering while the invoice is open", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    for (const status of ["draft", "open", "void", "uncollectible"] as const) {
      const result = await fulfilInvoice(invoice(northwind, [item.slug], { status }));
      expect(result.reason, status).toBe("unpaid");
    }
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("refuses an invoice that names no organisation", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    // Whoever raises the invoice has to carry the metadata. Guessing from the
    // Stripe customer would attribute a payment to an organisation on the
    // strength of an email address.
    const result = await fulfilInvoice(
      invoice(northwind, [item.slug], { metadata: { items: item.slug } }),
    );
    expect(result.reason).toBe("unresolvable");
  });

  it("holds an invoice paid below the catalogue price", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ priceMinor: 29000 });

    const result = await fulfilInvoice(invoice(northwind, [item.slug], { amount_paid: 500 }));
    expect(result.reason).toBe("underpaid");
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("delivers several items on one invoice", async () => {
    const { northwind } = await twoOrgs();
    const a = await seedItem({ slug: "pack-a", priceMinor: 10000 });
    const b = await seedItem({ slug: "pack-b", priceMinor: 15000 });

    const result = await fulfilInvoice(
      invoice(northwind, ["pack-a", "pack-b"], { amount_paid: 25000 }),
    );

    expect(result.reason).toBe("granted");
    expect(await isEntitled(northwind, a._id)).toBe(true);
    expect(await isEntitled(northwind, b._id)).toBe(true);
  });

  it("keeps an invoice-granted entitlement out of the other organisation", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();
    await fulfilInvoice(invoice(northwind, [item.slug]));

    expect(await isEntitled(southmere, item._id)).toBe(false);
    expect(await scoped(southmere).orders.countDocuments()).toBe(0);
  });
});

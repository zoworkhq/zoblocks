/**
 * The webhook route, from signature to entitlement.
 *
 * The pieces are tested separately — `constructEvent` verifies, `fulfilSession`
 * grants — but the route is where they are wired to each other, and a wiring
 * mistake here is silent in exactly the way that matters: Stripe keeps
 * answering 200, the customer is charged, and nothing is ever delivered.
 *
 * So this drives the real handler with real signed bodies. No mocks: the HMAC
 * is computed the way Stripe computes it, and the database afterwards is the
 * assertion.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { POST } from "@/app/api/stripe/webhook/route";
import { scoped } from "@/db/scope";
import { isEntitled, grant } from "@/lib/market/entitlements";
import { signPayload } from "@/lib/market/stripe";
import { twoOrgs } from "./harness";
import { checkoutSession, seedItem } from "./market-harness";

const SECRET = "whsec_test_route";

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

/** A request shaped the way Stripe sends one: raw body, signed. */
function webhook(event: unknown, { secret = SECRET, signed = true } = {}) {
  const payload = JSON.stringify(event);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signed) {
    headers["stripe-signature"] = signPayload(payload, secret, Math.floor(Date.now() / 1000));
  }
  return new Request("https://console.test/api/stripe/webhook", {
    method: "POST",
    headers,
    body: payload,
  });
}

const send = async (event: unknown, options?: { secret?: string; signed?: boolean }) => {
  const response = await POST(webhook(event, options));
  return { status: response.status, body: await response.json().catch(() => null) };
};

describe("what it refuses before reading anything", () => {
  it("refuses an unsigned body", async () => {
    // Everything in the payload — organisation ids included — is
    // attacker-controlled until the signature checks out.
    const { status } = await send({ type: "checkout.session.completed" }, { signed: false });
    expect(status).toBe(400);
  });

  it("refuses a body signed with the wrong secret", async () => {
    const { status } = await send(
      { type: "checkout.session.completed", data: { object: {} } },
      { secret: "whsec_someone_elses" },
    );
    expect(status).toBe(400);
  });

  it("answers 500 when no secret is configured, rather than trusting the body", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(webhook({ type: "checkout.session.completed" }));
    // Configuration, not a client error — and a 400 here would look like
    // Stripe's fault in a dashboard that is trying to tell us it is ours.
    expect(response.status).toBe(500);
  });

  it("grants nothing on a refused request", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await send(
      {
        type: "checkout.session.completed",
        data: { object: checkoutSession(northwind, [item.slug]) },
      },
      { signed: false },
    );

    expect(await isEntitled(northwind, item._id)).toBe(false);
  });
});

describe("the events that deliver", () => {
  it("grants on checkout.session.completed", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const { status, body } = await send({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: checkoutSession(northwind, [item.slug]) },
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({ received: true, outcome: "granted" });
    expect(await isEntitled(northwind, item._id)).toBe(true);
  });

  it("grants on async_payment_succeeded, which is where bank debits land", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    // The event a handler listening only for `completed` silently drops — and
    // it belongs to the customers paying the most.
    const { body } = await send({
      id: "evt_2",
      type: "checkout.session.async_payment_succeeded",
      data: { object: checkoutSession(northwind, [item.slug]) },
    });

    expect(body).toMatchObject({ outcome: "granted" });
    expect(await isEntitled(northwind, item._id)).toBe(true);
  });

  it("grants on invoice.paid, for the enterprise route", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    const { body } = await send({
      id: "evt_3",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_route_1",
          status: "paid",
          amount_paid: 29000,
          currency: "usd",
          metadata: { orgId: northwind.toHexString(), items: item.slug },
        },
      },
    });

    expect(body).toMatchObject({ outcome: "granted" });
    expect(await isEntitled(northwind, item._id)).toBe(true);
  });

  it("delivers once when Stripe retries the same event", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const event = {
      id: "evt_retry",
      type: "checkout.session.completed",
      data: { object: checkoutSession(northwind, [item.slug]) },
    };

    const first = await send(event);
    const second = await send(event);

    expect(first.body).toMatchObject({ outcome: "granted" });
    // A retry must be a no-op, not a second entitlement — and not a 500, which
    // would teach Stripe to retry it again.
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ outcome: "already" });
    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
  });
});

describe("the events that take access away", () => {
  it("revokes on charge.refunded", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_x", versionLine: 1 });

    const { body } = await send({
      id: "evt_4",
      type: "charge.refunded",
      data: {
        object: {
          payment_intent: "pi_x",
          metadata: { orgId: northwind.toHexString(), items: item.slug },
        },
      },
    });

    expect(body).toMatchObject({ revoked: [item.slug] });
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("revokes on a dispute, which also needs a person", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_x", versionLine: 1 });

    await send({
      id: "evt_5",
      type: "charge.dispute.created",
      data: {
        object: { metadata: { orgId: northwind.toHexString(), items: item.slug } },
      },
    });

    expect(await isEntitled(northwind, item._id)).toBe(false);
  });
});

describe("the events that change nothing", () => {
  it("leaves an entitlement alone when an invoice payment fails", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "in_1", versionLine: 1 });

    const { status, body } = await send({
      id: "evt_6",
      type: "invoice.payment_failed",
      data: { object: { id: "in_1", metadata: { orgId: northwind.toHexString() } } },
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({ outcome: "awaiting-payment" });
    // A retry, an expired card, or a finance department that has not run its
    // batch — none of them a reason to take back something delivered.
    expect(await isEntitled(northwind, item._id)).toBe(true);
  });

  it("records an abandoned checkout without granting", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const session = checkoutSession(northwind, [item.slug]);
    await scoped(northwind).orders.findOneAndUpdate(
      { _id: session.id },
      {
        $setOnInsert: {
          memberId: null,
          items: [item.slug],
          amountMinor: 29000,
          currency: "usd",
          status: "open" as const,
          fulfilledAt: null,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    await send({ id: "evt_7", type: "checkout.session.expired", data: { object: session } });

    expect((await scoped(northwind).orders.findOne({ _id: session.id }))?.status).toBe("expired");
    expect(await isEntitled(northwind, item._id)).toBe(false);
  });

  it("acknowledges an event it does not handle", async () => {
    // Returning an error for these teaches Stripe to retry something that will
    // never succeed, and eventually to disable the endpoint.
    const { status, body } = await send({
      id: "evt_8",
      type: "customer.subscription.trial_will_end",
      data: { object: {} },
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({ ignored: "customer.subscription.trial_will_end" });
  });

  it("does not grant across organisations, whatever the payload says", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();

    await send({
      id: "evt_9",
      type: "checkout.session.completed",
      data: { object: checkoutSession(northwind, [item.slug]) },
    });

    // The signature proves Stripe sent it; the metadata decides whose it is.
    // Nobody else's organisation is touched.
    expect(await isEntitled(southmere, item._id)).toBe(false);
    expect(await scoped(southmere).orders.countDocuments()).toBe(0);
  });

  it("refuses a session naming an organisation that is not an id", async () => {
    const item = await seedItem();
    const { body } = await send({
      id: "evt_10",
      type: "checkout.session.completed",
      data: {
        object: {
          ...checkoutSession(new ObjectId(), [item.slug]),
          client_reference_id: "../etc/passwd",
          metadata: { orgId: "../etc/passwd", items: item.slug },
        },
      },
    });

    expect(body).toMatchObject({ outcome: "unresolvable" });
  });
});

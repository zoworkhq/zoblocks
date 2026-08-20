/**
 * Stripe's side of the purchase.
 *
 *     POST /api/stripe/webhook
 *
 * Required, not optional. A customer can pay and lose their connection before
 * the success page loads, and delayed payment methods settle days after
 * checkout completes — so this endpoint, not the redirect, is what guarantees
 * anybody ever receives what they bought.
 *
 * Four things this route must get right, in order:
 *
 *   - **Read the raw body.** `constructEvent` verifies a signature over the
 *     exact bytes Stripe sent. Parsing to JSON and re-serialising compares a
 *     signature against different bytes, and fails in a way that looks like a
 *     configuration problem rather than a bug.
 *   - **Verify before trusting anything.** Everything in the payload —
 *     organisation ids included — is attacker-controlled until the signature
 *     checks out. An unverified body is a 400 and nothing else happens.
 *   - **Answer quickly.** Checkout waits up to ten seconds for a
 *     `checkout.session.completed` response before redirecting the customer,
 *     so slow fulfilment is a visible stall on a paid purchase.
 *   - **Be safe to call twice.** Stripe retries. `fulfil()` claims the order
 *     atomically, so a retry is a no-op rather than a second entitlement.
 *
 * A 200 is returned for events we do not handle. Returning an error for those
 * teaches Stripe to retry something that will never succeed, and eventually to
 * disable the endpoint.
 */

import { NextResponse } from "next/server";
import { fulfilSession, markExpired, revokeForCharge } from "@/lib/market/fulfil";
import { SignatureError, constructEvent, type CheckoutSession } from "@/lib/market/stripe";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    // Configuration, not a client error: a 500 is honest and gets noticed.
    return new NextResponse("Webhook secret is not configured.", { status: 500 });
  }

  const payload = await request.text();

  let event;
  try {
    event = constructEvent(payload, request.headers.get("stripe-signature"), secret);
  } catch (error) {
    if (error instanceof SignatureError) {
      return new NextResponse(error.message, { status: 400 });
    }
    throw error;
  }

  switch (event.type) {
    /*
     * Both of these fulfil, and leaving the second one out is the quiet failure
     * in this integration: bank debits and other delayed methods complete the
     * session first and succeed later, so a handler that listens only for
     * `completed` silently never delivers to the customers paying the most.
     */
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const result = await fulfilSession(event.data.object as unknown as CheckoutSession);
      return NextResponse.json({ received: true, outcome: result.reason });
    }

    case "checkout.session.expired": {
      await markExpired(event.data.object as unknown as CheckoutSession);
      return NextResponse.json({ received: true, outcome: "expired" });
    }

    /*
     * A refund and a dispute both withdraw access. They differ in what happens
     * next — a dispute needs a person — but the entitlement change is the same,
     * and doing it immediately is the point.
     */
    case "charge.refunded":
    case "charge.dispute.created": {
      const charge = event.data.object as {
        payment_intent?: string | null;
        metadata?: Record<string, string> | null;
      };
      const { revoked } = await revokeForCharge(charge);
      return NextResponse.json({ received: true, revoked });
    }

    default:
      return NextResponse.json({ received: true, ignored: event.type });
  }
}

export const dynamic = "force-dynamic";

/**
 * Stripe, over `fetch`, with no SDK.
 *
 * A deliberate choice and an unusual one, so the reasoning is here rather than
 * in a commit message.
 *
 * The console needs exactly three things from Stripe: create a Checkout
 * Session, read one back, and verify a webhook signature. That is one POST,
 * one GET and forty lines of HMAC. Against it, adding the SDK means a
 * dependency in a workspace whose lockfile has twice been the thing that
 * turned `main` red, and a test suite that either mocks the SDK's surface
 * anyway or reaches the network.
 *
 * What this file must therefore get right, because there is no SDK to get it
 * right for us:
 *
 *   - **Form encoding.** Stripe's API is `application/x-www-form-urlencoded`
 *     with bracketed paths — `line_items[0][price]`, `metadata[orgId]`. The
 *     encoder below is the whole reason this is one file and not three.
 *   - **Signature verification.** Timing-safe, with a timestamp tolerance, and
 *     rejecting rather than throwing something a route might mistake for a
 *     server error.
 *   - **Idempotency keys** on writes, so a retried checkout creation does not
 *     produce two sessions.
 *
 * Swapping to `stripe` later is a small, mechanical change: `PaymentGateway`
 * below is the seam, and nothing outside this file knows how the calls are
 * made.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.stripe.com/v1";

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

/* -------------------------------------------------------------------------
 * Encoding
 * ---------------------------------------------------------------------- */

/**
 * `{ metadata: { orgId: "1" }, line_items: [{ price: "p" }] }`
 *   → `metadata[orgId]=1&line_items[0][price]=p`
 *
 * `undefined` is dropped rather than sent as the string "undefined", which is
 * the failure mode that produces a Stripe error naming a parameter you did not
 * think you had set.
 */
export function encodeForm(value: unknown, prefix = ""): string {
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => encodeForm(entry, `${prefix}[${index}]`))
      .filter(Boolean)
      .join("&");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => encodeForm(entry, prefix ? `${prefix}[${key}]` : key))
      .filter(Boolean)
      .join("&");
  }

  return `${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`;
}

/* -------------------------------------------------------------------------
 * The shapes we actually read
 * ---------------------------------------------------------------------- */

export interface CheckoutSession {
  id: string;
  url: string | null;
  /** `paid`, `unpaid` or `no_payment_required`. The gate for fulfilment. */
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string> | null;
  customer_details?: { email: string | null } | null;
  payment_intent?: string | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

/**
 * The seam.
 *
 * Everything above the transport takes one of these, so a test drives the
 * whole purchase lifecycle — create, complete, fulfil, refund — without a
 * network, an API key, or a mocked module registry.
 */
export interface PaymentGateway {
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutSession>;
  retrieveCheckoutSession(id: string): Promise<CheckoutSession>;
}

export interface CheckoutInput {
  /** Resolved server-side from the catalogue. Never supplied by a browser. */
  lineItems: readonly { price: string; quantity: number }[];
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
  metadata: Record<string, string>;
  customerEmail?: string;
  /**
   * Stripe Tax. On from the first sale rather than the hundredth, because
   * digital goods are taxed where the customer is and the registration
   * thresholds arrive well before the revenue does.
   */
  automaticTax?: boolean;
  /** Retry-safe creation. Same key, same session. */
  idempotencyKey?: string;
}

/* -------------------------------------------------------------------------
 * Transport
 * ---------------------------------------------------------------------- */

async function call<T>(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  body?: string,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Stripe-Version": "2025-08-27.basil",
  };
  if (body !== undefined) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const response = await fetch(`${API}${path}`, { method, headers, body });
  const payload = (await response.json()) as { error?: { message?: string } };

  if (!response.ok) {
    throw new StripeError(
      payload.error?.message ?? `Stripe returned ${response.status}.`,
      response.status,
    );
  }
  return payload as T;
}

/**
 * A gateway bound to a secret key.
 *
 * Refuses a live-looking key in development and a test key in production. One
 * line, and it prevents the two mistakes that are only ever noticed by an
 * accountant: real charges against a dev database, and a launch that takes no
 * money at all.
 */
export function stripeGateway(secretKey = process.env.STRIPE_SECRET_KEY): PaymentGateway {
  if (!secretKey) {
    throw new StripeError(
      "STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and add your Stripe keys.",
    );
  }
  if (process.env.NODE_ENV === "production" && secretKey.startsWith("sk_test_")) {
    throw new StripeError("Refusing to run in production with a Stripe test key.");
  }

  return {
    async createCheckoutSession(input) {
      const body = encodeForm({
        mode: "payment",
        line_items: input.lineItems.map((item) => ({ price: item.price, quantity: item.quantity })),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.clientReferenceId,
        metadata: input.metadata,
        // Copied onto the PaymentIntent, and from there onto the charge, so a
        // `charge.refunded` event can name the organisation it belongs to
        // without a search across every customer's orders.
        payment_intent_data: { metadata: input.metadata },
        customer_email: input.customerEmail,
        ...(input.automaticTax ? { automatic_tax: { enabled: true } } : {}),
      });
      return call<CheckoutSession>(
        secretKey,
        "POST",
        "/checkout/sessions",
        body,
        input.idempotencyKey,
      );
    },

    // `line_items` expanded, because fulfilment reconciles what was bought
    // against what was ordered rather than trusting the metadata it wrote.
    retrieveCheckoutSession(id) {
      return call<CheckoutSession>(
        secretKey,
        "GET",
        `/checkout/sessions/${encodeURIComponent(id)}?expand[0]=line_items`,
      );
    },
  };
}

/* -------------------------------------------------------------------------
 * Webhook signatures
 * ---------------------------------------------------------------------- */

/** Five minutes, Stripe's own default. Replay protection, not clock pedantry. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export class SignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignatureError";
  }
}

/**
 * Verify `Stripe-Signature` and parse the event.
 *
 * The header is `t=<unix>,v1=<hex>[,v1=<hex>]` — more than one `v1` while a
 * secret is being rotated, which is exactly when a naive parser that reads the
 * first one starts rejecting real events.
 *
 * `payload` must be the **raw** body. Verifying a re-serialised object
 * compares a signature against bytes Stripe never sent, and it fails in a way
 * that looks like a configuration problem rather than a bug.
 */
export function constructEvent(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): StripeEvent {
  if (!header) throw new SignatureError("Missing Stripe-Signature header.");

  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) {
    throw new SignatureError("Malformed Stripe-Signature header.");
  }

  const age = nowSeconds - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > SIGNATURE_TOLERANCE_SECONDS) {
    throw new SignatureError("Signature timestamp is outside the tolerance window.");
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();

  // Timing-safe, and length-checked first because `timingSafeEqual` throws on a
  // length mismatch — which would turn a wrong-length forgery into a 500.
  const matched = signatures.some((candidate) => {
    const given = Buffer.from(candidate, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!matched) throw new SignatureError("Signature does not match.");

  try {
    return JSON.parse(payload) as StripeEvent;
  } catch {
    throw new SignatureError("Event body is not JSON.");
  }
}

/** Sign a payload the way Stripe does. Used by the tests, and by nothing else. */
export function signPayload(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

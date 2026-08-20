/**
 * The half of Stripe we wrote ourselves.
 *
 * There is no SDK behind this, which means the form encoder and the signature
 * check are ours to be right about. Both fail quietly when they are wrong: a
 * mis-encoded nested parameter produces a Stripe error naming a field nobody
 * set, and a signature check that is subtly wrong either rejects every real
 * event or accepts forged ones.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SIGNATURE_TOLERANCE_SECONDS,
  SignatureError,
  StripeError,
  constructEvent,
  encodeForm,
  signPayload,
  stripeGateway,
} from "@/lib/market/stripe";

const SECRET = "whsec_test_secret";

describe("form encoding", () => {
  it("brackets nested objects and arrays the way Stripe expects", () => {
    /*
     * Percent-encoded brackets, not literal ones.
     *
     * `application/x-www-form-urlencoded` requires it and Stripe's own
     * libraries send them this way; the server decodes before it parses. The
     * readable form — `line_items[0][price]` — is what this becomes on
     * Stripe's side, which is why the comments elsewhere spell it that way.
     */
    expect(
      encodeForm({
        mode: "payment",
        line_items: [{ price: "price_1", quantity: 1 }],
        metadata: { orgId: "abc" },
      }),
    ).toBe(
      "mode=payment&line_items%5B0%5D%5Bprice%5D=price_1" +
        "&line_items%5B0%5D%5Bquantity%5D=1&metadata%5BorgId%5D=abc",
    );

    // And it round-trips: what Stripe parses is the readable shape.
    const parsed = new URLSearchParams(encodeForm({ line_items: [{ price: "p" }] }));
    expect(parsed.get("line_items[0][price]")).toBe("p");
  });

  it("drops undefined rather than sending the string", () => {
    // The failure this prevents: Stripe rejecting a request because
    // `customer_email=undefined` is not an email address.
    expect(encodeForm({ a: 1, b: undefined, c: null })).toBe("a=1");
  });

  it("escapes values", () => {
    expect(encodeForm({ url: "https://x.test/a?b=c&d=e" })).toBe(
      "url=https%3A%2F%2Fx.test%2Fa%3Fb%3Dc%26d%3De",
    );
  });
});

describe("webhook signatures", () => {
  const payload = JSON.stringify({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: {} },
  });
  const now = 1_800_000_000;

  it("accepts a signature Stripe would have produced", () => {
    const event = constructEvent(payload, signPayload(payload, SECRET, now), SECRET, now);
    expect(event.type).toBe("checkout.session.completed");
  });

  it("rejects a tampered body", () => {
    const header = signPayload(payload, SECRET, now);
    expect(() => constructEvent(payload.replace("evt_1", "evt_2"), header, SECRET, now)).toThrow(
      SignatureError,
    );
  });

  it("rejects a signature made with a different secret", () => {
    const header = signPayload(payload, "whsec_other", now);
    expect(() => constructEvent(payload, header, SECRET, now)).toThrow("does not match");
  });

  it("rejects a replayed event outside the tolerance window", () => {
    const header = signPayload(payload, SECRET, now - SIGNATURE_TOLERANCE_SECONDS - 1);
    expect(() => constructEvent(payload, header, SECRET, now)).toThrow("tolerance window");
  });

  it("accepts one inside it", () => {
    const header = signPayload(payload, SECRET, now - SIGNATURE_TOLERANCE_SECONDS + 5);
    expect(() => constructEvent(payload, header, SECRET, now)).not.toThrow();
  });

  it("accepts the second v1 during a secret rotation", () => {
    // Stripe sends more than one `v1` while a secret is being rotated, which is
    // exactly when a parser that reads only the first starts rejecting real
    // events.
    const good = signPayload(payload, SECRET, now).split("v1=")[1];
    const header = `t=${now},v1=0000000000000000000000000000000000000000000000000000000000000000,v1=${good}`;
    expect(() => constructEvent(payload, header, SECRET, now)).not.toThrow();
  });

  it("rejects a wrong-length signature without throwing something else", () => {
    // `timingSafeEqual` throws on a length mismatch, which would turn a
    // forgery into a 500 rather than a 400.
    expect(() => constructEvent(payload, `t=${now},v1=abcd`, SECRET, now)).toThrow(SignatureError);
  });

  it("rejects a missing or malformed header", () => {
    expect(() => constructEvent(payload, null, SECRET, now)).toThrow("Missing");
    expect(() => constructEvent(payload, "nonsense", SECRET, now)).toThrow("Malformed");
    expect(() => constructEvent(payload, `t=${now}`, SECRET, now)).toThrow("Malformed");
    expect(() => constructEvent(payload, `t=abc,v1=${"0".repeat(64)}`, SECRET, now)).toThrow(
      "tolerance",
    );
  });

  it("rejects a correctly-signed body that is not JSON", () => {
    const body = "not json";
    expect(() => constructEvent(body, signPayload(body, SECRET, now), SECRET, now)).toThrow(
      "not JSON",
    );
  });
});

describe("the gateway", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("refuses to start without a key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(() => stripeGateway(undefined)).toThrow("STRIPE_SECRET_KEY is not set");
  });

  it("refuses a test key in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    // The two mistakes only an accountant notices: real charges against a dev
    // database, and a launch that takes no money at all.
    expect(() => stripeGateway("sk_test_123")).toThrow("test key");
  });

  it("posts a form-encoded session and returns it", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.headers).toMatchObject({
        Authorization: "Bearer sk_test_123",
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": "key-1",
      });
      // Read through URLSearchParams rather than matched as a substring, so
      // the assertion is about what Stripe receives rather than about our
      // escaping.
      const body = new URLSearchParams(String(init.body));
      expect(body.get("line_items[0][price]")).toBe("price_1");
      expect(body.get("automatic_tax[enabled]")).toBe("true");
      expect(body.get("payment_intent_data[metadata][orgId]")).toBe("org");
      return { ok: true, json: async () => ({ id: "cs_1", url: "https://stripe.test" }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const session = await stripeGateway("sk_test_123").createCheckoutSession({
      lineItems: [{ price: "price_1", quantity: 1 }],
      successUrl: "https://console.test/ok",
      cancelUrl: "https://console.test/no",
      clientReferenceId: "org",
      metadata: { orgId: "org" },
      automaticTax: true,
      idempotencyKey: "key-1",
    });

    expect(session.id).toBe("cs_1");
  });

  it("expands line items when reading a session back", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("expand[0]=line_items");
      return { ok: true, json: async () => ({ id: "cs_1" }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    await stripeGateway("sk_test_123").retrieveCheckoutSession("cs_1");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("surfaces Stripe's own message on a failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ error: { message: "Your card was declined." } }),
      })),
    );

    await expect(stripeGateway("sk_test_123").retrieveCheckoutSession("cs_1")).rejects.toThrow(
      "Your card was declined.",
    );
  });

  it("falls back to the status when there is no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    );
    await expect(stripeGateway("sk_test_123").retrieveCheckoutSession("x")).rejects.toThrow(
      StripeError,
    );
  });
});

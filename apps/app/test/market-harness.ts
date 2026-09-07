/**
 * Catalogue fixtures.
 *
 * Separate from `harness.ts` because it seeds a different kind of thing: that
 * file creates two customers, this one stocks the shelf they both see. Which is
 * the whole reason the marketplace tests are worth writing — the catalogue is
 * the first global collection in this app, and "global" and "leaked" look
 * identical in a query.
 */

import { Binary, ObjectId } from "mongodb";
import { createHash } from "node:crypto";
import { db } from "@/db/client";
import type { CatalogItemDoc, CatalogKind, CatalogVersionDoc } from "@/db/collections";
import type { CheckoutInput, CheckoutSession, PaymentGateway } from "@/lib/market/stripe";

export const PUBLISHED = new Date("2026-08-14T09:12:03Z");

const provenance = () => ({
  accessibility: {
    checkedAt: PUBLISHED,
    checkerVersion: 3,
    contrastPairs: { passed: 17, total: 17, floor: "4.5:1" },
    forcedColors: "verified" as const,
    nonColourChannel: "shape and label",
  },
  authorship: { method: "hand-drawn" as const, thirdPartyContent: [] },
  licence: {
    id: "zoblocks-pack-1.0",
    grant: "per-organisation, perpetual",
    derivatives: "permitted",
    resale: "prohibited",
  },
});

export interface SeedItemInput {
  slug?: string;
  kind?: CatalogKind;
  priceMinor?: number | null;
  stripePriceId?: string | null;
  listed?: boolean;
  liveVersion?: number;
  files?: { path: string; text: string; contentType?: string; slot?: string }[];
  tokens?: CatalogVersionDoc["tokens"];
  registry?: Record<string, unknown>;
}

/** One catalogue item with one published version, and its bytes stored. */
export async function seedItem(input: SeedItemInput = {}): Promise<CatalogItemDoc> {
  const slug = input.slug ?? "empty-state-system";
  const version = input.liveVersion ?? 1;

  const item: CatalogItemDoc = {
    _id: new ObjectId(),
    slug,
    kind: input.kind ?? "illustration",
    title: `Item ${slug}`,
    blurb: "A pack, for tests.",
    priceMinor: input.priceMinor === undefined ? 29000 : input.priceMinor,
    currency: "usd",
    stripePriceId:
      input.stripePriceId === undefined ? `price_${slug.replace(/-/g, "_")}` : input.stripePriceId,
    liveVersion: version,
    frameworks: null,
    provenance: provenance(),
    listedAt: input.listed === false ? null : PUBLISHED,
  };
  await db().catalogItems.insertOne(item);

  const files = [];
  for (const file of input.files ?? [{ path: "art/one.svg", text: "<svg/>" }]) {
    const bytes = new TextEncoder().encode(file.text);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    await db().marketAssets.updateOne(
      { _id: sha256 },
      {
        $setOnInsert: {
          bytes: new Binary(bytes),
          contentType: file.contentType ?? "image/svg+xml",
          size: bytes.length,
          uploadedAt: PUBLISHED,
        },
      },
      { upsert: true },
    );
    files.push({
      path: file.path,
      sha256,
      contentType: file.contentType ?? "image/svg+xml",
      size: bytes.length,
      ...(file.slot ? { slot: file.slot } : {}),
    });
  }

  await db().catalogVersions.insertOne({
    _id: new ObjectId(),
    itemId: item._id,
    version,
    files,
    ...(input.tokens ? { tokens: input.tokens } : {}),
    ...(input.registry ? { registry: input.registry } : {}),
    notes: "seeded",
    publishedAt: PUBLISHED,
  });

  return item;
}

/**
 * Stripe, without Stripe.
 *
 * Records what it was asked for, so a test can assert the price came from the
 * catalogue rather than from its caller — which is the single most important
 * property of the checkout path and impossible to see from the outside.
 */
export function fakeGateway(overrides: Partial<CheckoutSession> = {}): PaymentGateway & {
  created: CheckoutInput[];
} {
  const created: CheckoutInput[] = [];
  let counter = 0;

  const session = (input?: CheckoutInput): CheckoutSession => ({
    id: `cs_test_${counter}`,
    url: "https://checkout.stripe.test/session",
    payment_status: "paid",
    status: "complete",
    amount_total: 29000,
    currency: "usd",
    client_reference_id: input?.clientReferenceId ?? null,
    metadata: input?.metadata ?? null,
    payment_intent: "pi_test_1",
    ...overrides,
  });

  const sessions = new Map<string, CheckoutSession>();

  return {
    created,
    async createCheckoutSession(input) {
      counter += 1;
      created.push(input);
      const made = session(input);
      sessions.set(made.id, made);
      return made;
    },
    async retrieveCheckoutSession(id) {
      const found = sessions.get(id);
      if (!found) throw new Error(`No such session ${id}`);
      return found;
    },
  };
}

/** A completed Checkout Session, as the webhook would receive it. */
export function checkoutSession(
  orgId: ObjectId,
  slugs: string[],
  overrides: Partial<CheckoutSession> = {},
): CheckoutSession {
  return {
    id: "cs_test_webhook",
    url: null,
    payment_status: "paid",
    status: "complete",
    amount_total: 29000,
    currency: "usd",
    client_reference_id: orgId.toHexString(),
    metadata: {
      orgId: orgId.toHexString(),
      items: slugs.join(","),
      memberId: new ObjectId().toHexString(),
    },
    payment_intent: "pi_test_webhook",
    ...overrides,
  };
}

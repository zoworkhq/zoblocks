/**
 * Create the Stripe Products and Prices the catalogue refers to.
 *
 *     pnpm --filter @oxygenui-design/console stripe:sync            # dry run
 *     pnpm --filter @oxygenui-design/console stripe:sync -- --apply
 *
 * The catalogue is the source of truth for what is sold and at what price;
 * Stripe is the source of truth for how it is charged. Something has to keep
 * the two in step, and doing it by hand in the dashboard means the first thing
 * anybody does with this feature is twenty minutes of careful typing where a
 * transposed digit sells a $450 component for $45.
 *
 * Three safety properties, because this writes to a payment processor:
 *
 *   - **Dry run by default.** It prints what it would do and exits. Nothing
 *     reaches Stripe without `--apply`.
 *   - **A live key needs `--live` as well.** The two mistakes worth preventing
 *     are creating test junk in a live account and, far worse, believing you
 *     are in test mode while you are not.
 *   - **Idempotent.** Products carry a deterministic id derived from the
 *     catalogue slug, and a Price is reused when one already exists at the same
 *     amount and currency. Running it twice changes nothing.
 *
 * Stripe Prices are immutable, so changing a price in the catalogue creates a
 * *new* Price and repoints the item at it. The old one is deactivated rather
 * than deleted — anybody mid-checkout against it should not have the ground
 * moved, and a receipt has to stay explicable afterwards.
 */

import { MongoClient } from "mongodb";
import { loadEnvLocal } from "./env.mjs";
import { encodeForm } from "../src/lib/market/stripe.ts";

loadEnvLocal();

const apply = process.argv.includes("--apply");
const allowLive = process.argv.includes("--live");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is not set. Copy .env.example to .env.local and add it.");
  process.exit(1);
}
if (key.startsWith("sk_live_") && !allowLive) {
  console.error("That is a live key. Re-run with --live if you really mean it.");
  process.exit(1);
}

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function stripe(method, path, body) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": "2025-08-27.basil",
      ...(body === undefined ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    ...(body === undefined ? {} : { body }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `${method} ${path} → ${response.status}: ${payload.error?.message ?? "failed"}`,
    );
  }
  return payload;
}

/** `empty-state-system` → `oxygen_empty_state_system`. Stable, and readable in the dashboard. */
const productId = (slug) => `oxygen_${slug.replace(/-/g, "_")}`;

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.CONSOLE_DB_NAME || "oxygen_console");

const items = await db
  .collection("catalog_items")
  .find({ priceMinor: { $ne: null } })
  .sort({ slug: 1 })
  .toArray();

if (items.length === 0) {
  console.log("Nothing priced in the catalogue. Run db:seed:market first.");
  await client.close();
  process.exit(0);
}

console.log(
  `${apply ? "Syncing" : "Dry run —"} ${items.length} priced item(s) against ${
    key.startsWith("sk_live_") ? "a LIVE account" : "test mode"
  }.\n`,
);

let changed = 0;

for (const item of items) {
  const id = productId(item.slug);
  const amount = item.priceMinor;
  const currency = item.currency;

  if (!apply) {
    console.log(`  ${item.slug}`);
    console.log(`    product ${id} — "${item.title}"`);
    console.log(`    price   ${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`);
    console.log(`    current ${item.stripePriceId ?? "(none)"}\n`);
    continue;
  }

  /* The product, created once and updated thereafter. */
  let product;
  try {
    product = await stripe("GET", `/products/${id}`);
    await stripe(
      "POST",
      `/products/${id}`,
      encodeForm({
        name: item.title,
        description: item.blurb.slice(0, 350),
        metadata: { oxygenSlug: item.slug, oxygenKind: item.kind },
      }),
    );
  } catch {
    product = await stripe(
      "POST",
      "/products",
      encodeForm({
        id,
        name: item.title,
        description: item.blurb.slice(0, 350),
        metadata: { oxygenSlug: item.slug, oxygenKind: item.kind },
      }),
    );
  }

  /*
   * Reuse a Price at the same amount, or make one.
   *
   * Prices are immutable in Stripe, so "change the price" is always "create a
   * new one". Searching first is what keeps a re-run from littering the account
   * with identical Prices.
   */
  const existing = await stripe("GET", `/prices?product=${product.id}&active=true&limit=100`);
  let price = existing.data.find((p) => p.unit_amount === amount && p.currency === currency);

  if (!price) {
    price = await stripe(
      "POST",
      "/prices",
      encodeForm({
        product: product.id,
        unit_amount: amount,
        currency,
        metadata: { oxygenSlug: item.slug },
      }),
    );

    // Retire anything at a different amount, so the dashboard shows one live
    // price per product and a stale one cannot be linked to by accident.
    for (const stale of existing.data) {
      if (stale.id !== price.id) {
        await stripe("POST", `/prices/${stale.id}`, encodeForm({ active: false }));
      }
    }
  }

  if (item.stripePriceId !== price.id) {
    await db
      .collection("catalog_items")
      .updateOne({ _id: item._id }, { $set: { stripePriceId: price.id } });
    changed += 1;
    console.log(`  ${item.slug} → ${price.id}  (was ${item.stripePriceId ?? "none"})`);
  } else {
    console.log(`  ${item.slug} → ${price.id}  (unchanged)`);
  }
}

if (!apply) {
  console.log("Nothing was sent to Stripe. Re-run with --apply to create these.");
} else {
  console.log(`\nDone. ${changed} item(s) repointed.`);
  console.log("Register the webhook next, if you have not:");
  console.log("  stripe listen --forward-to localhost:6003/api/stripe/webhook   (local)");
  console.log("  or add https://<host>/api/stripe/webhook in the Stripe dashboard, sending");
  console.log("  checkout.session.completed, checkout.session.async_payment_succeeded,");
  console.log("  checkout.session.expired, invoice.paid, invoice.payment_failed,");
  console.log("  charge.refunded and charge.dispute.created.");
}

await client.close();

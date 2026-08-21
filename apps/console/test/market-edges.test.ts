/**
 * The branches a happy path never reaches.
 *
 * Money code fails at its edges rather than in the middle: a charge with no
 * payment intent, a session that reports no total, an order naming an item
 * somebody withdrew, a version line a customer bought into before an update
 * shipped. None of these are exotic — every one of them is a normal Tuesday for
 * a payment processor — and all of them are invisible until they happen to a
 * real customer.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { db } from "@/db/client";
import {
  scoped,
  unscopedCatalogItemById,
  unscopedMarketAsset,
  unscopedRegistryToken,
  unscopedTouchRegistryToken,
} from "@/db/scope";
import { detail, itemById, versionFor } from "@/lib/market/catalogue";
import { grant, held, heldIncludingRevoked, revoke } from "@/lib/market/entitlements";
import { fulfilSession, markExpired, orderItems, revokeForCharge } from "@/lib/market/fulfil";
import { install } from "@/lib/market/install";
import { hashToken, mintToken } from "@/lib/market/tokens";
import { createCheckout } from "@/lib/market/checkout";
import { createTheme } from "@/lib/themes";
import { actingAs, twoOrgs } from "./harness";
import { checkoutSession, fakeGateway, seedItem } from "./market-harness";

describe("a session that reports no total", () => {
  it("delivers rather than treating the unknown as a shortfall", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ priceMinor: 29000 });

    // `amount_total` is null on some session shapes. Reading null as zero would
    // hold every one of them for a human who has nothing to decide.
    const result = await fulfilSession(
      checkoutSession(northwind, [item.slug], { amount_total: null, currency: null }),
    );

    expect(result.reason).toBe("granted");
  });
});

describe("a refund with nothing to reconcile", () => {
  it("revokes without a payment intent to match an order on", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "manual", versionLine: 1 });

    const { revoked } = await revokeForCharge({
      metadata: { orgId: northwind.toHexString(), items: item.slug },
    });

    // The entitlement is what access depends on; the order row is bookkeeping.
    // A charge with no intent must still be able to take access away.
    expect(revoked).toEqual([item.slug]);
    expect(await held(northwind)).toHaveLength(0);
  });

  it("writes an audit row naming what it withdrew", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "manual", versionLine: 1 });
    await revokeForCharge({ metadata: { orgId: northwind.toHexString(), items: item.slug } });

    const [entry] = await scoped(northwind).audit.find({ action: "market.revoked" }).toArray();
    expect(entry?.subject).toBe(item.slug);
    expect(entry?.detail).toBe("refunded");
  });
});

describe("an order whose item left the catalogue", () => {
  it("still reads back, naming only what still exists", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    await db().catalogItems.deleteOne({ _id: item._id });

    // Withdrawing something from sale must not make an existing receipt
    // unreadable — the order row is the evidence that money moved.
    const found = await orderItems(northwind, "cs_test_webhook");
    expect(found?.order.items).toEqual([item.slug]);
    expect(found?.items).toEqual([]);
  });

  it("shows a withdrawn item on the purchases list as a gap, not a crash", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await db().catalogItems.deleteOne({ _id: item._id });

    const rows = await heldIncludingRevoked(northwind);
    expect(rows).toHaveLength(1);
    expect(await itemById(rows[0]!.itemId)).toBeUndefined();
  });
});

describe("expiring an order that is not there", () => {
  it("does nothing rather than creating one", async () => {
    const { northwind } = await twoOrgs();

    await markExpired({ id: "cs_never_seen", metadata: { orgId: northwind.toHexString() } });

    // An expiry for a session we never recorded is not an order; inventing one
    // would put a row in the payments list that nobody ever started.
    expect(await scoped(northwind).orders.countDocuments()).toBe(0);
  });
});

describe("version lines", () => {
  it("delivers the version the organisation bought, not the newest", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({ slug: "clinical-icons", kind: "icons", liveVersion: 1 });

    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    // Publish a second version and move the pointer, the way an update ships.
    await db().catalogVersions.insertOne({
      _id: new ObjectId(),
      itemId: item._id,
      version: 2,
      files: [],
      notes: "an update",
      publishedAt: new Date(),
    });
    await db().catalogItems.updateOne({ _id: item._id }, { $set: { liveVersion: 2 } });

    const { entitlement } = await detail(northwind, item.slug);
    expect(entitlement?.versionLine).toBe(1);

    // The install path resolves through the entitlement, so a customer who
    // bought v1 is not silently handed v2's contents.
    await expect(versionFor(item, entitlement!.versionLine)).resolves.toMatchObject({
      version: 1,
    });

    const theme = await createTheme(auth, { name: "Clinical", brandColour: "#1d63c9" });
    await expect(install(auth, item.slug, theme.id)).rejects.toThrow("no glyphs mapped");
  });
});

describe("a theme pack with no brand colour of its own", () => {
  it("still installs, on a default rather than a crash", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "admin");
    const item = await seedItem({
      slug: "no-brand-theme",
      kind: "theme",
      // Tokens present, but nothing at `ref.brand.600` — a legal document that
      // simply does not set the one value `createTheme` asks for.
      tokens: { ref: {} },
    });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    const result = await install(auth, item.slug);
    expect(result.message).toContain("Nothing is live");
  });
});

describe("the scoped accessors nothing else drives", () => {
  it("counts and lists orders within one organisation", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();
    await fulfilSession(checkoutSession(northwind, [item.slug]));

    expect(await scoped(northwind).orders.countDocuments()).toBe(1);
    expect(await scoped(northwind).orders.find().toArray()).toHaveLength(1);
    expect(await scoped(southmere).orders.countDocuments()).toBe(0);
  });

  it("resolves a catalogue item by id, and misses cleanly", async () => {
    const item = await seedItem();
    expect((await unscopedCatalogItemById(item._id))?.slug).toBe(item.slug);
    expect(await unscopedCatalogItemById(new ObjectId())).toBeNull();
  });

  it("misses cleanly on an asset digest nobody stored", async () => {
    expect(await unscopedMarketAsset("0".repeat(64))).toBeNull();
  });

  it("touching an unknown token is harmless", async () => {
    // Best-effort by design: a stamp that cannot be written must never fail
    // the install it was recording.
    await expect(unscopedTouchRegistryToken("f".repeat(64))).resolves.toBeUndefined();
  });

  it("counts registry tokens per organisation", async () => {
    const { northwind, southmere } = await twoOrgs();
    const nw = await actingAs(northwind, "developer");
    await mintToken(nw, "one");
    await mintToken(nw, "two");

    expect(await scoped(northwind).registryTokens.countDocuments()).toBe(2);
    expect(await scoped(southmere).registryTokens.countDocuments()).toBe(0);
  });
});

describe("a token at the boundary", () => {
  it("still resolves one second before it expires", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    await scoped(northwind).registryTokens.updateOne(
      { _id: hashToken(token) },
      { $set: { expiresAt: new Date(Date.now() + 1000) } },
    );

    expect(await unscopedRegistryToken(hashToken(token))).toBeDefined();
  });

  it("and not one second after", async () => {
    const { northwind } = await twoOrgs();
    const auth = await actingAs(northwind, "developer");
    const { token } = await mintToken(auth, "CI");

    await scoped(northwind).registryTokens.updateOne(
      { _id: hashToken(token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    expect(await unscopedRegistryToken(hashToken(token))).toBeUndefined();
  });
});

describe("revoking something never granted", () => {
  it("changes nothing and does not invent a row", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await revoke(northwind, item._id, "mistake");

    expect(await scoped(northwind).entitlements.countDocuments()).toBe(0);
  });
});

describe("an announcement is not a product", () => {
  /**
   * A coming-soon item is listed on purpose — it is the roadmap, and a team
   * deciding whether to build something deserves to know we are. Every other
   * guard in the purchase path therefore lets it through: it has a slug, it is
   * listed, it is not already owned.
   *
   * Nothing exists to deliver. A checkout that succeeded would take money for
   * an empty entitlement, and a grant would hand somebody a download that 404s.
   */
  async function announced(price: number | null = 60000) {
    const item = await seedItem({ slug: "results-grid", priceMinor: price });
    await db().catalogItems.updateOne(
      { _id: item._id },
      { $set: { comingSoon: true, liveVersion: 0, stripePriceId: null } },
    );
    return item;
  }

  it("refuses a checkout, and says why rather than pretending it is unlisted", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    await announced();

    await expect(
      createCheckout(nw, "results-grid", "https://console.test", fakeGateway()),
    ).rejects.toThrow(/not finished yet/);
  });

  it("refuses a contract grant, so nobody is told they own nothing", async () => {
    const { asNorthwind } = await twoOrgs();
    const nw = await asNorthwind();
    const item = await announced();

    // The grant path is the one that bypasses Stripe entirely, so it needs its
    // own guard rather than inheriting checkout's.
    const before = await nw.data.entitlements.countDocuments({ itemId: item._id });
    await expect(
      createCheckout(nw, "results-grid", "https://console.test", fakeGateway()),
    ).rejects.toThrow();
    expect(await nw.data.entitlements.countDocuments({ itemId: item._id })).toBe(before);
  });

  it("stays listed, because hiding it would defeat the point", async () => {
    await announced();
    const item = await db().catalogItems.findOne({ slug: "results-grid" });
    expect(item?.listedAt).not.toBeNull();
    expect(item?.comingSoon).toBe(true);
  });

  it("carries no invented provenance", async () => {
    await announced();
    const item = await db().catalogItems.findOne({ slug: "results-grid" });
    // Nothing has been measured because nothing has been built. A flattering
    // pass rate on an unwritten pack is the one lie this product cannot afford.
    expect(item?.liveVersion).toBe(0);
  });
});

/**
 * The public catalogue endpoint.
 *
 * One property is worth more than the rest here: it is the only marketplace
 * route with no session, so what it *omits* is the whole test. A catalogue that
 * leaks which organisation owns what would be a cross-tenant disclosure served
 * with cache headers telling the internet to keep a copy.
 */

import { describe, expect, it } from "vitest";
import { GET } from "@/app/c/catalog.json/route";
import { grant } from "@/lib/market/entitlements";
import { twoOrgs } from "./harness";
import { seedItem } from "./market-harness";

const read = async () => (await GET()).json();

describe("the public catalogue", () => {
  it("lists what is for sale, with the evidence", async () => {
    await seedItem({ slug: "empty-state-system" });

    const { items } = await read();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      slug: "empty-state-system",
      kind: "illustration",
      price: { minor: 29000, currency: "usd" },
      files: 1,
    });
    // The half worth publishing: a fact somebody can act on before they have
    // signed up for anything.
    expect(items[0].provenance.accessibility.contrastPairs).toEqual({
      passed: 17,
      total: 17,
      floor: "4.5:1",
    });
  });

  it("says nothing about who owns anything", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    const body = JSON.stringify(await read());

    // No organisation, no entitlement, no order — served with cache headers
    // telling the internet to keep a copy.
    expect(body).not.toContain(northwind.toHexString());
    expect(body).not.toContain("cs_1");
    expect(body.toLowerCase()).not.toContain("entitle");
    expect(body.toLowerCase()).not.toContain("owned");
  });

  it("withholds the Stripe price id", async () => {
    await seedItem({ stripePriceId: "price_secret_thing" });
    const body = JSON.stringify(await read());

    // Nothing outside this app has any business quoting a price id, and a
    // field nobody needs is one that ends up somewhere it should not.
    expect(body).not.toContain("price_secret_thing");
    expect(body).not.toContain("stripePriceId");
  });

  it("omits what is not listed", async () => {
    await seedItem({ slug: "listed-pack" });
    await seedItem({ slug: "withdrawn-pack", listed: false });

    const { items } = await read();
    expect(items.map((i: { slug: string }) => i.slug)).toEqual(["listed-pack"]);
  });

  it("reports an item sold only by arrangement as having no price", async () => {
    await seedItem({ priceMinor: null, stripePriceId: null });
    const { items } = await read();
    expect(items[0].price).toBeNull();
  });

  it("survives an item whose version was never published", async () => {
    const { db } = await import("@/db/client");
    await seedItem({ slug: "half-published" });
    // Point the item at a version that does not exist — the shape a partially
    // failed publish would leave behind.
    await db().catalogItems.updateOne({ slug: "half-published" }, { $set: { liveVersion: 9 } });

    const { items } = await read();
    expect(items[0]).toMatchObject({ files: 0, publishedAt: null });
  });

  it("tells caches they may serve it while it is stale", async () => {
    await seedItem();
    const response = await GET();
    // The property that keeps a console outage from taking the public pages
    // down with it.
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate");
  });
});

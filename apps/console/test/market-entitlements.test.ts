/**
 * Who owns what, and who cannot see it.
 *
 * Every test seeds two organisations, for the reason the isolation suite
 * already states: the failure worth catching is a query that returns somebody
 * else's row, and a single-tenant fixture cannot express it. The catalogue is
 * the first deliberately global collection in this app, which makes the
 * boundary between "everyone sees the shelf" and "only you see your receipts"
 * the thing most worth asserting.
 */

import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { scoped } from "@/db/scope";
import { can, whyNot } from "@/lib/roles";
import {
  detail,
  listing,
  priceLabel,
  versionFor,
  itemsByIds,
  KIND_LABEL,
} from "@/lib/market/catalogue";
import {
  assertEntitled,
  entitlementFor,
  grant,
  held,
  isEntitled,
  MarketError,
  revoke,
} from "@/lib/market/entitlements";
import { twoOrgs } from "./harness";
import { seedItem } from "./market-harness";

describe("the shelf is shared, the receipts are not", () => {
  it("shows both organisations the same catalogue", async () => {
    const { northwind, southmere } = await twoOrgs();
    await seedItem({ slug: "empty-state-system" });
    await seedItem({ slug: "clinical-icons", kind: "icons" });

    expect(await listing(northwind)).toHaveLength(2);
    expect(await listing(southmere)).toHaveLength(2);
  });

  it("does not show one organisation's purchase to the other", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();

    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    expect((await listing(northwind))[0]?.owned).toBe(true);
    expect((await listing(southmere))[0]?.owned).toBe(false);
    expect(await isEntitled(southmere, item._id)).toBe(false);
  });

  it("refuses delivery to an organisation that did not buy it", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    await expect(assertEntitled(southmere, item._id)).rejects.toThrow(MarketError);
    await expect(assertEntitled(northwind, item._id)).resolves.toMatchObject({ versionLine: 1 });
  });

  it("keeps entitlement rows apart even when the item id is known", async () => {
    const { northwind, southmere } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    // The strongest form: the id is correct and known, and the scoped view
    // still returns nothing, because the filter carries an orgId no caller
    // can remove.
    expect(await scoped(southmere).entitlements.findOne({ itemId: item._id })).toBeNull();
    expect(await scoped(southmere).entitlements.countDocuments()).toBe(0);
  });

  it("unlisted items stay deliverable to whoever already bought them", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem({ listed: false });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    // Off the shelf...
    expect(await listing(northwind)).toHaveLength(0);
    // ...but still theirs. Withdrawing something from sale must not take it
    // away from the customers who paid for it.
    expect(await isEntitled(northwind, item._id)).toBe(true);
    await expect(detail(northwind, item.slug)).resolves.toMatchObject({ owned: true });
  });
});

describe("granting", () => {
  it("is idempotent — two grants leave one entitlement", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
  });

  it("survives concurrent grants, because the unique index decides", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await Promise.all(
      Array.from({ length: 5 }, () => grant(northwind, item._id, { via: "cs_1", versionLine: 1 })),
    );

    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
  });

  it("records who granted it, and via what", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    const actor = new ObjectId();

    await grant(northwind, item._id, { via: "contract:pilot", by: actor, versionLine: 2 });

    const entitlement = await entitlementFor(northwind, item._id);
    expect(entitlement).toMatchObject({ grantedVia: "contract:pilot", versionLine: 2 });
    expect(entitlement?.grantedBy?.toHexString()).toBe(actor.toHexString());
  });

  it("has no member to name when a webhook grants it", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    expect((await entitlementFor(northwind, item._id))?.grantedBy).toBeNull();
  });
});

describe("revoking", () => {
  it("keeps the row and records the reason", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });

    await revoke(northwind, item._id, "refunded");

    // Not deleted. A deleted entitlement is indistinguishable from one that
    // never existed, and "what happened to the pack we bought" is exactly the
    // question a customer arrives with after a refund.
    expect(await scoped(northwind).entitlements.countDocuments()).toBe(1);
    expect(await isEntitled(northwind, item._id)).toBe(false);
    expect(await held(northwind)).toHaveLength(0);

    const [row] = await scoped(northwind).entitlements.find().toArray();
    expect(row?.revokedReason).toBe("refunded");
  });

  it("is undone by a re-grant rather than left contradictory", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();

    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await revoke(northwind, item._id, "refunded");
    await grant(northwind, item._id, { via: "cs_2", versionLine: 1 });

    const entitlement = await entitlementFor(northwind, item._id);
    expect(entitlement?.revokedAt).toBeNull();
    expect(entitlement?.revokedReason).toBeNull();
  });

  it("shows a withdrawn purchase on the listing rather than hiding it", async () => {
    const { northwind } = await twoOrgs();
    const item = await seedItem();
    await grant(northwind, item._id, { via: "cs_1", versionLine: 1 });
    await revoke(northwind, item._id, "refunded");

    const [row] = await listing(northwind);
    expect(row?.owned).toBe(false);
    expect(row?.entitlement?.revokedReason).toBe("refunded");
  });
});

describe("capabilities", () => {
  it("lets every role browse and only an admin buy", () => {
    for (const role of ["admin", "designer", "developer", "viewer"] as const) {
      expect(can(role, "market.browse")).toBe(true);
    }

    expect(can("admin", "market.purchase")).toBe(true);
    expect(can("designer", "market.purchase")).toBe(false);
    expect(can("developer", "market.purchase")).toBe(false);
    expect(can("viewer", "market.purchase")).toBe(false);
  });

  it("lets designers install and developers mint tokens, without breaking the ladder", () => {
    expect(can("designer", "market.install")).toBe(true);
    expect(can("developer", "market.install")).toBe(false);
    expect(can("developer", "market.token")).toBe(true);

    /*
     * A designer holds `market.token` as well, and that is the role table's
     * existing invariant rather than a marketplace decision: the grants nest,
     * so a senior role can do everything a junior one can. Withholding it from
     * designers would make the table a lattice, and `roles.test.ts` fails on
     * exactly that.
     */
    expect(can("designer", "market.token")).toBe(true);
  });

  it("explains a refusal in terms of the thing refused", () => {
    // The sentence used to describe what the role could do with *themes*,
    // which read as a non-sequitur on a refused purchase.
    const reason = whyNot("designer", "market.purchase");
    expect(reason).toContain("marketplace");
    expect(reason).toContain("admin");
    expect(whyNot("admin", "market.purchase")).toBeUndefined();
  });
});

describe("reading the catalogue", () => {
  it("refuses an unknown slug rather than returning nothing", async () => {
    const { northwind } = await twoOrgs();
    await expect(detail(northwind, "no-such-pack")).rejects.toThrow("No such item");
  });

  it("refuses a version that was never published", async () => {
    const item = await seedItem();
    await expect(versionFor(item, 99)).rejects.toThrow("no published version 99");
  });

  it("returns nothing for an empty id list without querying", async () => {
    expect(await itemsByIds([])).toEqual([]);
  });

  it("formats prices from minor units, and names what is not for sale", () => {
    expect(priceLabel({ priceMinor: 29000, currency: "usd" })).toBe("$290");
    expect(priceLabel({ priceMinor: 29050, currency: "usd" })).toBe("$290.50");
    expect(priceLabel({ priceMinor: null, currency: "usd" })).toBe("By arrangement");
  });

  it("names every kind", () => {
    expect(Object.keys(KIND_LABEL)).toEqual([
      "icons",
      "illustration",
      "theme",
      "component",
      "fixtures",
    ]);
  });
});

describe("resolving items by id", () => {
  it("finds one, and returns nothing for an id that is not there", async () => {
    // `itemById` is what a purchases screen joins on, and it deliberately
    // resolves unlisted items — withdrawing something from sale must not make
    // an existing purchase unreadable.
    const item = await seedItem({ listed: false });
    const { itemById } = await import("@/lib/market/catalogue");

    expect((await itemById(item._id))?.slug).toBe(item.slug);
    expect(await itemById(new ObjectId())).toBeUndefined();
  });

  it("returns several at once, for the purchases list", async () => {
    const a = await seedItem({ slug: "a-pack" });
    const b = await seedItem({ slug: "b-pack" });
    const found = await itemsByIds([a._id, b._id]);
    expect(found.map((i) => i.slug).sort()).toEqual(["a-pack", "b-pack"]);
  });
});

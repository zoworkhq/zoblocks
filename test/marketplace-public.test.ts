/**
 * The docs site's view of the catalogue.
 *
 * One property carries this file, and it is the reason the public shelf is an
 * HTTP read rather than a database one: **the marketing site must survive the
 * app being unreachable.** A page somebody arrived at from a search result
 * cannot 500 because a private service is restarting, and a CI build cannot
 * fail because one was.
 *
 * So every failure mode here has to end in an empty list rather than a throw,
 * and there are more of them than the happy path suggests — a refused request,
 * a dead socket, a body that parses but is not what we asked for. Each one is
 * cheap to get wrong and invisible until the day it matters.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  APP,
  KIND_LABEL,
  buyHref,
  catalogue,
  findItem,
  priceLabel,
  shelf,
  type MarketItem,
} from "../apps/docs/src/lib/marketplace";

const ITEM: MarketItem = {
  slug: "empty-state-system",
  kind: "illustration",
  title: "Empty-state system",
  blurb: "Three meanings, not one.",
  price: { minor: 29000, currency: "usd" },
  version: 2,
  frameworks: null,
  provenance: {
    accessibility: {
      checkedAt: "2026-08-14T09:12:03.000Z",
      checkerVersion: 3,
      contrastPairs: { passed: 17, total: 17, floor: "4.5:1" },
      forcedColors: "verified",
      nonColourChannel: "shape and label",
    },
    authorship: { method: "hand-drawn", thirdPartyContent: [] },
    licence: {
      id: "oxygen-pack-1.0",
      grant: "per-organisation, perpetual",
      derivatives: "permitted",
      resale: "prohibited",
    },
  },
  files: 4,
  publishedAt: "2026-08-14T09:12:03.000Z",
};

const respondWith = (body: unknown, ok = true) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, json: async () => body })),
  );

afterEach(() => vi.unstubAllGlobals());

describe("reading the catalogue", () => {
  it("returns what the app published", async () => {
    respondWith({ items: [ITEM] });
    await expect(catalogue()).resolves.toEqual([ITEM]);
  });

  it("asks the app, and lets Next cache the answer", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
    vi.stubGlobal("fetch", fetchMock);

    await catalogue();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${APP}/c/catalog.json`);
    // Ten minutes. A catalogue changes when somebody publishes a pack, which is
    // rare; hammering the app on every request is not free.
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(600);
  });
});

describe("what happens when the app is not there", () => {
  it("returns nothing when the request is refused", async () => {
    respondWith({ error: "nope" }, false);
    await expect(catalogue()).resolves.toEqual([]);
  });

  it("returns nothing when the socket dies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    // The CI case: a build must not fail because a separate service was
    // restarting. It will fail again at the worst possible time.
    await expect(catalogue()).resolves.toEqual([]);
  });

  it("returns nothing when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        },
      })),
    );
    // A proxy or an error page answering 200 with HTML, which is the shape
    // this fails in far more often than a genuine outage.
    await expect(catalogue()).resolves.toEqual([]);
  });

  it("returns nothing when the body parses but says nothing", async () => {
    respondWith({});
    await expect(catalogue()).resolves.toEqual([]);
  });

  /*
   * `catalogue()` still reports the console honestly — empty is empty. What
   * changed is what the *page* does with that: `shelf()` falls back, because a
   * storefront that cannot list anything until a separate service exists is a
   * storefront that does not work, and the console has never been deployed.
   */
  it("falls back to the local catalogue rather than showing nothing", async () => {
    respondWith({ items: [] });

    await expect(catalogue()).resolves.toEqual([]);

    const items = await shelf();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.source === "preview")).toBe(true);
  });

  it("still finds nothing for a slug that is in neither", async () => {
    respondWith({ items: [] });
    await expect(findItem("no-such-pack")).resolves.toBeUndefined();
  });

  it("never publishes a clinical review nobody performed", async () => {
    respondWith({ items: [] });
    // The seed carries `reviewedBy: "SEED DATA — nobody has reviewed this"`,
    // and a plausible substitute would be worse than the seed. The public
    // shelf omits the block entirely, so the page renders nothing rather than
    // a claim.
    for (const item of await shelf()) {
      expect(item.provenance.clinical).toBeUndefined();
    }
  });

  it("refuses a purchase path for anything announced", async () => {
    respondWith({ items: [] });
    const announced = (await shelf()).filter((item) => item.comingSoon);

    expect(announced.length).toBeGreaterThan(0);
    // No version, no files, and nothing measured — because nothing has been
    // built to measure.
    for (const item of announced) {
      expect(item.version).toBe(0);
      expect(item.files).toBe(0);
      expect(item.provenance.accessibility.contrastPairs.total).toBe(0);
    }
  });

  it("lets the console win outright the moment it answers", async () => {
    respondWith({ items: [ITEM] });
    const items = await shelf();

    // One live item replaces the whole local list rather than merging: a
    // half-live catalogue is one nobody can reason about.
    expect(items).toHaveLength(1);
    expect(items[0]?.source).toBe("console");
  });
});

describe("finding one item", () => {
  it("matches by slug", async () => {
    respondWith({ items: [ITEM, { ...ITEM, slug: "clinical-icons" }] });
    expect((await findItem("clinical-icons"))?.slug).toBe("clinical-icons");
  });

  it("returns nothing for a slug that is not there", async () => {
    respondWith({ items: [ITEM] });
    // The page turns this into a 404 rather than rendering a blank item.
    await expect(findItem("no-such-pack")).resolves.toBeUndefined();
  });
});

describe("presenting a price", () => {
  it("drops the decimals when there are none", () => {
    expect(priceLabel({ minor: 29000, currency: "usd" })).toBe("$290");
  });

  it("keeps them when there are", () => {
    expect(priceLabel({ minor: 29050, currency: "usd" })).toBe("$290.50");
  });

  it("names what is not priced rather than showing zero", () => {
    // An item sold inside an engagement has no price, and "$0" would be a lie
    // a reader could act on.
    expect(priceLabel(null)).toBe("By arrangement");
  });

  it("respects the currency it was given", () => {
    expect(priceLabel({ minor: 12000, currency: "eur" })).toContain("120");
  });
});

describe("sending a buyer to the app", () => {
  it("links at the item, not the catalogue", () => {
    // Buying needs an organisation, which this site knows nothing about.
    expect(buyHref("empty-state-system")).toBe(`${APP}/market/empty-state-system`);
  });

  it("defaults to the deployed app rather than localhost", () => {
    expect(APP).toMatch(/^https?:\/\//);
  });
});

describe("naming a kind", () => {
  it("has a word for every kind the app can publish", () => {
    // Kept in step with `KIND_LABEL` in the app by this assertion — a kind
    // added there and forgotten here renders as `undefined` on a public page.
    expect(Object.keys(KIND_LABEL).sort()).toEqual([
      "component",
      "fixtures",
      "icons",
      "illustration",
      "theme",
    ]);
  });
});

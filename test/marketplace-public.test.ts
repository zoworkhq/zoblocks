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
  SELLING_OPEN,
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
      id: "zoblocks-pack-1.0",
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

  /*
   * `comingSoon` came to mean two things, and this test was asserting the one
   * it no longer means.
   *
   * It used to mean "never built", and the version, file-count and
   * contrast-pair assertions that lived here followed from that. `SELLING_OPEN`
   * gave it a second meaning — "not purchasable" — and set it on *every* item,
   * so five packs that are built, versioned and merely unbuyable started
   * reading as packs claiming measurements they had not earned. The suite went
   * red on a change that was correct.
   *
   * The unbuilt claim has a better home and already lives there:
   * `marketplace-catalogue.test.ts` asserts it in both directions against the
   * raw preview data, where `comingSoon` still means only the one thing —
   * "measures nothing on a pack nobody has built" and "ships a version and
   * files for everything it calls published". Repeating half of that here was
   * always redundant; what was missing is the claim the switch actually makes.
   *
   * The two meanings have since been given two fields, because sharing one was
   * not only a test problem: `PackPreview` reads `comingSoon` to choose between
   * a pack's file manifest and a "nothing built yet" motif, so forcing it true
   * made two shipped packs advertise themselves as unbuilt on the open shelf.
   * `purchasable` carries the shop's answer now, and the assertion below asks
   * it rather than asking the field that describes the pack.
   */
  it("offers no purchase path at all while selling is closed", async () => {
    respondWith({ items: [] });
    const items = await shelf();
    expect(items.length).toBeGreaterThan(0);

    if (SELLING_OPEN) {
      // The switch's own promise for the day it flips: every path goes back to
      // reading each item's `publishedAt`. Asserted rather than assumed, so
      // flipping it cannot quietly leave the shelf announcing everything.
      for (const item of items) {
        expect(item.comingSoon, `${item.slug} disagrees with its publishedAt`).toBe(
          item.publishedAt === null,
        );
        expect(item.purchasable, `${item.slug} is built but still unbuyable`).toBe(
          !item.comingSoon,
        );
      }
      return;
    }

    // Named rather than counted: one buy control on a shop that cannot take
    // money is the whole defect, and the slug is what makes it findable.
    expect(items.filter((item) => item.purchasable).map((item) => item.slug)).toEqual([]);
  });

  it("still announces a pack the console has never published", async () => {
    respondWith({ items: [] });
    // `publishedAt` is the field the switch does not touch, so it stays the
    // honest record of what exists. This is the half of the old assertion that
    // survives both settings.
    const items = await shelf();
    const unpublished = items.filter((item) => item.publishedAt === null);

    expect(unpublished.length).toBeGreaterThan(0);
    for (const item of unpublished) {
      expect(item.comingSoon, `${item.slug} is unpublished but not announced`).toBe(true);
    }
  });

  /*
   * Closing the till must not make the shelf lie about the stock.
   *
   * `PackPreview` asks `comingSoon` to choose between a pack's file manifest
   * and a "nothing built yet" motif, and it asks *after* artwork and swatches.
   * So while the switch forced that field true, it downgraded exactly the built
   * packs that ship neither — `vitals-flowsheet` and `messy-fixtures` — and both
   * advertised themselves on the open shelf as unbuilt while their files sat in
   * this repository.
   */
  it("still says what a built pack contains while the shop is shut", async () => {
    respondWith({ items: [] });
    const built = (await shelf()).filter((item) => !item.comingSoon);

    expect(built.length).toBeGreaterThan(0);
    for (const item of built) {
      expect(item.version, `${item.slug} is built at v0`).toBeGreaterThan(0);
      expect(item.filePaths.length, `${item.slug} shows no manifest`).toBeGreaterThan(0);
      // And still not for sale. That is the half the switch gets to decide.
      expect(item.purchasable, `${item.slug} is purchasable`).toBe(false);
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

  /*
   * The regression this file did not have.
   *
   * `ITEM` above carries no clinical block, so every assertion here passed
   * while the real console — whose seed fills `reviewedBy` with the string
   * "SEED DATA — nobody has reviewed this" — would have had the detail page
   * render "Clinically reviewed 2026-08-11 — SEED DATA — nobody has reviewed
   * this" on the open web. It was reproduced against a seeded console before
   * this test was written, not imagined from reading the code.
   *
   * Nobody has reviewed any pack. Until a named clinician has, and until the
   * console can tell a verified review from a row somebody typed, the public
   * site renders no reviewer from any source.
   */
  it("never republishes a clinical review the console sent", async () => {
    respondWith({
      items: [
        {
          ...ITEM,
          provenance: {
            ...ITEM.provenance,
            clinical: {
              reviewedBy: "SEED DATA — nobody has reviewed this",
              registration: "not a registration",
              reviewedAt: "2026-08-11T00:00:00.000Z",
              scope: "Vocabulary and state semantics.",
              doesNotClaim: ["Not medical advice"],
            },
          },
        },
      ],
    });

    const [item] = await shelf();

    expect(item?.source).toBe("console");
    expect(item?.provenance.clinical).toBeUndefined();

    // The rest of the record survives: this drops one field, it does not
    // discard the provenance a buyer is paying for.
    expect(item?.provenance.accessibility.contrastPairs.passed).toBe(17);
    expect(item?.provenance.licence.id).toBe("zoblocks-pack-1.0");
  });

  /*
   * The console must not make the shelf worse.
   *
   * `catalog.json` sends `files: 4` — a count, with no paths and no SVG —
   * because serving artwork is not its job. Spreading it verbatim replaced the
   * empty-state drawings, the severity ramp and the file manifests with the
   * string "4 files · v2" on every published pack, so switching the backend on
   * downgraded the storefront. The artwork is committed in this repository; it
   * is attached by slug.
   */
  it("keeps the pack's own artwork when the console answers", async () => {
    respondWith({ items: [ITEM] });

    const [item] = await shelf();

    expect(item?.source).toBe("console");
    expect(item?.art.length, "empty-state-system ships drawings").toBeGreaterThan(0);
    expect(item?.filePaths.length, "and a manifest").toBeGreaterThan(0);

    // The console still wins on everything it actually owns.
    expect(item?.price?.minor).toBe(29000);
    expect(item?.version).toBe(2);
  });

  it("shows a file count for a pack this repository has never seen", async () => {
    respondWith({ items: [{ ...ITEM, slug: "published-straight-to-the-console" }] });

    const [item] = await shelf();

    // No invented artwork: a picture of a pack nobody here has seen would be
    // worse than the honest count the card falls back to.
    expect(item?.art).toEqual([]);
    expect(item?.swatches).toEqual([]);
    expect(item?.filePaths).toEqual([]);
    expect(item?.files).toBe(4);
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

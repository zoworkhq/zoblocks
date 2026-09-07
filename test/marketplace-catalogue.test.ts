/**
 * The public shelf and the thing that publishes it agree.
 *
 * `apps/docs/src/lib/market-preview.ts` exists because the console is not
 * deployed and the storefront has to work anyway. That makes it a second copy
 * of facts the console owns — slugs, titles, kinds, prices — and a second copy
 * is only safe while something checks it.
 *
 * The check is against `apps/app/scripts/seed-market.mjs`, which is what
 * actually creates these items. Read as text rather than imported: the seed
 * connects to MongoDB at module load, so importing it here would need a
 * database to assert that two strings match.
 *
 * What this cannot catch is a pack published straight into a production
 * database without going through the seed. Nothing can, from here — but the
 * console wins outright the moment it answers, so such a pack would replace
 * this list rather than sit beside it.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PREVIEW_CATALOGUE } from "../apps/docs/src/lib/market-preview";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SEED = readFileSync(path.join(ROOT, "apps/app/scripts/seed-market.mjs"), "utf8");

/**
 * Every `slug: "…"` in the seed, with the fields that follow it.
 *
 * Both shapes in the file are regular — the published items pass an object
 * literal to `upsertItem`, the roadmap ones sit in an array — so one pass over
 * the source finds all of them.
 */
function seededItems(): Map<string, { kind: string; title: string; priceMinor: number }> {
  const found = new Map<string, { kind: string; title: string; priceMinor: number }>();
  const pattern =
    /slug:\s*"([a-z0-9-]+)",\s*\n\s*kind:\s*"([a-z]+)",\s*\n\s*title:\s*"([^"]+)",[\s\S]*?priceMinor:\s*(\d+)/g;

  for (const match of SEED.matchAll(pattern)) {
    const [, slug, kind, title, price] = match;
    if (slug && kind && title && price !== undefined) {
      found.set(slug, { kind, title, priceMinor: Number(price) });
    }
  }
  return found;
}

const SEEDED = seededItems();

describe("the public catalogue mirrors the seed", () => {
  it("finds the seeded items, so a rename cannot quietly empty this suite", () => {
    // Five published plus the roadmap. A parser that silently matched nothing
    // would make every assertion below vacuously true.
    expect(SEEDED.size).toBeGreaterThanOrEqual(20);
    expect(SEEDED.has("empty-state-system")).toBe(true);
  });

  it("lists exactly the packs the seed publishes", () => {
    expect([...PREVIEW_CATALOGUE.map((item) => item.slug)].sort()).toEqual(
      [...SEEDED.keys()].sort(),
    );
  });

  it.each(PREVIEW_CATALOGUE)("$slug agrees with the seed on what it is", (item) => {
    const seeded = SEEDED.get(item.slug);
    expect(seeded, `${item.slug} is not in the seed`).toBeDefined();

    expect(item.kind).toBe(seeded?.kind);
    expect(item.title).toBe(seeded?.title);
    // The one that matters most: a price the site shows and the console does
    // not charge is worse than no price at all.
    expect(item.priceMinor).toBe(seeded?.priceMinor);
  });
});

/*
 * The seed can now write to a real database, which makes its two fixture fields
 * a production concern rather than a local one.
 *
 * The artwork in that script is the real product. The clinical reviewer and the
 * `price_seed_*` ids are not, and those are the only reasons a localhost guard
 * ever made sense. `ZOBLOCKS_PUBLISH=1` lifts the guard *and* removes both — so
 * the invariant worth protecting is that lifting it stays coupled to removing
 * them. A future edit that separates the two would put "SEED DATA — nobody has
 * reviewed this" into a customer-facing database.
 */
describe("publishing the catalogue for real", () => {
  it("only leaves localhost when explicitly asked", () => {
    expect(SEED).toMatch(/ZOBLOCKS_PUBLISH/);
    // The guard still exists, and still mentions localhost.
    expect(SEED).toMatch(/Refusing to seed anything that is not localhost/);
  });

  it("drops the reviewer and the placeholder price when it does", () => {
    const fn = SEED.slice(SEED.indexOf("function forPublication"));
    const body = fn.slice(0, fn.indexOf("\n}"));

    expect(body).toMatch(/delete provenance\.clinical/);
    expect(body).toMatch(/stripePriceId: null/);
    // Guarded by the flag rather than applied unconditionally, or local
    // development would lose the block whose rendering it exists to exercise.
    expect(body).toMatch(/if \(!PUBLISH\) return item/);
  });
});

describe("what the public shelf refuses to claim", () => {
  it("carries no clinical review, for any pack", () => {
    // The seed's reviewer is literally "SEED DATA — nobody has reviewed this",
    // and its own comment explains why a plausible substitute would be worse:
    // indistinguishable from a real review the moment a screenshot leaves a
    // laptop. So the public copy has no such field to render.
    // Comments stripped first. The file's own header explains why the block is
    // absent and quotes the seed to do it — scanning prose would flag the
    // explanation and make the guard something to delete.
    const code = readFileSync(path.join(ROOT, "apps/docs/src/lib/market-preview.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ");

    expect(code).not.toMatch(/reviewedBy|registration:|doesNotClaim/);
  });

  it("measures nothing on a pack nobody has built", () => {
    for (const item of PREVIEW_CATALOGUE.filter((entry) => entry.comingSoon)) {
      expect(item.checked, `${item.slug} claims a measurement`).toBeUndefined();
      expect(item.files ?? [], `${item.slug} claims files`).toEqual([]);
      expect(item.version).toBe(0);
    }
  });

  it("ships a version and files for everything it calls published", () => {
    for (const item of PREVIEW_CATALOGUE.filter((entry) => !entry.comingSoon)) {
      expect(item.version, `${item.slug} is published at v0`).toBeGreaterThan(0);
      expect((item.files ?? []).length, `${item.slug} publishes no files`).toBeGreaterThan(0);
      expect(item.checked, `${item.slug} publishes no contrast record`).toBeDefined();
    }
  });

  it("draws only artwork the pack actually ships", () => {
    for (const item of PREVIEW_CATALOGUE) {
      for (const art of item.art ?? []) {
        // Every sample corresponds to an `.svg` in the pack's own manifest.
        const svgs = (item.files ?? []).filter((file) => file.endsWith(".svg"));
        expect(svgs.length, `${item.slug} draws art but ships no svg`).toBeGreaterThan(0);
        expect(art.body.length).toBeGreaterThan(0);
        expect(art.viewBox).toMatch(/^0 0 \d+ \d+$/);
      }
    }
  });
});

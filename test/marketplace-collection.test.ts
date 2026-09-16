/**
 * The curated shelf: at most five packs, each named and previewed once.
 *
 * Rahul asked for five, under plain product names, on 16 Sep 2026. The card
 * rules the shelf already keeps — no price, no status — apply to this copy
 * too, because the card renders it.
 */

import { describe, expect, it } from "vitest";
import {
  COLLECTION,
  MAX_SHELF,
  collectionEntry,
  inCollection,
} from "../apps/docs/src/lib/market-collection";
import { PREVIEW_CATALOGUE } from "../apps/docs/src/lib/market-preview";

/** Packs the seed has not announced yet. Adding one here is a decision. */
const NEW_PACKS = ["behavioural-health-system"];

describe("the curated shelf", () => {
  it("holds at most five packs", () => {
    expect(COLLECTION.length).toBeGreaterThan(0);
    expect(COLLECTION.length).toBeLessThanOrEqual(MAX_SHELF);
    expect(MAX_SHELF).toBe(5);
  });

  it("names, slugs and previews each pack once", () => {
    for (const key of ["slug", "name", "scene"] as const) {
      const values = COLLECTION.map((entry) => entry[key]);
      expect(new Set(values).size, `duplicate ${key}`).toBe(values.length);
    }
  });

  it("points at packs the catalogue knows, or says it is new", () => {
    const known = new Set(PREVIEW_CATALOGUE.map((item) => item.slug));
    for (const entry of COLLECTION) {
      expect(
        known.has(entry.slug) || NEW_PACKS.includes(entry.slug),
        `${entry.slug} is in neither the catalogue nor NEW_PACKS`,
      ).toBe(true);
    }
  });

  it.each(COLLECTION)("$name keeps its card copy short and says nothing about sale", (entry) => {
    const copy = [entry.name, entry.kind, entry.blurb, ...entry.tags].join(" ");

    expect(entry.blurb.length).toBeLessThanOrEqual(140);
    expect(entry.preview.length).toBeGreaterThan(0);
    expect(copy).not.toMatch(/\$\d/);
    expect(copy).not.toMatch(/coming soon|not built yet|not for sale/i);
  });

  it("looks packs up by slug", () => {
    expect(collectionEntry("empty-state-system")?.name).toBe("Empty State Illustrations");
    expect(inCollection("cssrs-screener")).toBe(false);
  });
});

/**
 * Premium: Marketplace and Pro merged into one page (16 Sep 2026).
 *
 * Rahul's one condition was that no component from either page goes missing.
 * The browser specs check the rendered page; this checks the wiring that is
 * cheap to break quietly — the contents list, the redirects and the nav.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextConfig from "../apps/docs/next.config";
import { COLLECTION } from "../apps/docs/src/lib/market-collection";
import {
  CONSOLE_ALSO,
  CONSOLE_FEATURES,
  CONSOLE_TILES,
  PACKS_ID,
  PREMIUM_HREF,
} from "../apps/docs/src/lib/premium";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

describe("the Premium page carries both halves", () => {
  const page = read("apps/docs/src/app/premium/page.tsx");

  it("renders the whole console and every design pack", () => {
    expect(page).toMatch(/<ProConsole \/>/);
    expect(page).toMatch(/<DesignPacks \/>/);
    expect(page).toMatch(/<ZoworkDesk \/>/);
    expect(COLLECTION.length).toBeGreaterThan(0);
  });

  it("lists every console capability in its contents", () => {
    for (const name of Object.values(CONSOLE_TILES)) expect(CONSOLE_FEATURES).toContain(name);
    for (const item of CONSOLE_ALSO) expect(CONSOLE_FEATURES).toContain(item.name);
    expect(new Set(CONSOLE_FEATURES).size).toBe(CONSOLE_FEATURES.length);
  });

  it("names every tile from the shared list, not a literal", () => {
    const tiles = read("apps/docs/src/components/site/pro-console.tsx");
    for (const key of Object.keys(CONSOLE_TILES)) {
      expect(tiles).toContain(`{CONSOLE_TILES.${key}}`);
    }
  });
});

describe("the old addresses", () => {
  it("move permanently to Premium", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "/pro", destination: PREMIUM_HREF, permanent: true }),
        expect.objectContaining({
          source: "/marketplace",
          destination: `${PREMIUM_HREF}#${PACKS_ID}`,
          permanent: true,
        }),
      ]),
    );
  });

  it("no longer have pages of their own", () => {
    expect(existsSync(path.join(ROOT, "apps/docs/src/app/pro/page.tsx"))).toBe(false);
    expect(existsSync(path.join(ROOT, "apps/docs/src/app/marketplace/page.tsx"))).toBe(false);
  });

  it("are not linked from the site chrome", () => {
    for (const file of [
      "apps/docs/src/components/site/chrome.tsx",
      "apps/docs/src/components/site/site-menu.tsx",
      "apps/docs/src/components/site/command-menu.tsx",
      "apps/docs/src/app/sitemap.ts",
    ]) {
      // Link targets only: comments may still mention the old pages.
      const source = read(file);
      expect(source, file).not.toMatch(/(?:href|path)[=:]\s*["'`]\/(?:pro|marketplace)["'`]/);
      expect(source, file).toMatch(/(?:href|path)[=:]\s*["'`]\/premium["'`]/);
    }
  });
});

/**
 * The Pro page describes the product, so its claims are checked like claims.
 *
 * Each feature names the file or route whose behaviour it asserts. That field
 * is the whole point of this file: a marketing page saying "a failing theme
 * cannot be published" is making a statement about `apps/app`, and if the gate
 * is ever moved or removed the page keeps saying it. Here, the page fails a
 * test instead.
 *
 * This does not verify the behaviour — only that the thing being cited still
 * exists. That is a much weaker guarantee than it sounds and still catches the
 * failure that actually happens, which is a path going stale during a refactor.
 */

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRO_FEATURES } from "../apps/docs/src/lib/pro-features";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("every Pro feature cites something that exists", () => {
  for (const feature of PRO_FEATURES) {
    it(`${feature.id} → ${feature.where}`, () => {
      expect(existsSync(path.join(REPO, feature.where)), `${feature.where} is gone`).toBe(true);
    });
  }
});

describe("the copy holds its shape", () => {
  it("has a unique id and tab per feature", () => {
    expect(new Set(PRO_FEATURES.map((f) => f.id)).size).toBe(PRO_FEATURES.length);
    expect(new Set(PRO_FEATURES.map((f) => f.tab)).size).toBe(PRO_FEATURES.length);
  });

  /**
   * A tab label longer than this wraps the strip onto two lines on a phone,
   * and the strip is the only navigation the feature browser has.
   */
  it("keeps tab labels short enough for one line", () => {
    const long = PRO_FEATURES.filter((f) => f.tab.length > 14).map((f) => f.tab);
    expect(long).toEqual([]);
  });

  it("gives every feature a reason, not just a description", () => {
    const thin = PRO_FEATURES.filter((f) => f.why.length < 40).map((f) => f.id);
    expect(thin).toEqual([]);
  });
});

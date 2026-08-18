/**
 * The stigma list is duplicated in two places on purpose. This is the test that
 * makes the duplication safe.
 *
 * `packages/eslint-plugin/rules/no-stigmatising-language.js` cannot import from
 * this package: the plugin is plain ESM with no build step, and a lint rule that
 * needs a compiled workspace package to load is a lint rule that breaks the
 * first time somebody runs eslint before build. So the list is copied, and the
 * copy is asserted rather than trusted.
 *
 * Reading the rule file as text rather than importing it keeps this test free
 * of any assumption about the plugin's module format.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { STIGMA_TERMS } from "../src/language.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RULE_PATH = path.resolve(
  HERE,
  "..",
  "..",
  "eslint-plugin",
  "rules",
  "no-stigmatising-language.js",
);

function termsInRule(): string[] {
  const source = readFileSync(RULE_PATH, "utf8");
  const block = /const TERMS = \[([\s\S]*?)\n\];/.exec(source);
  if (!block?.[1]) throw new Error("Could not find the TERMS array in the lint rule.");
  return [...block[1].matchAll(/\[\s*"([^"]+)"\s*,/g)].map((m) => m[1] as string);
}

describe("stigma term list", () => {
  it("covers the same terms in the lint rule and the runtime check", () => {
    const runtime = STIGMA_TERMS.map((t) => t.term).sort();
    const lint = termsInRule().sort();
    expect(lint).toEqual(runtime);
  });

  it("offers an alternative for every term, never a bare prohibition", () => {
    for (const entry of STIGMA_TERMS) {
      expect(entry.prefer.trim().length).toBeGreaterThan(3);
      expect(entry.prefer).not.toBe(entry.term);
    }
  });

  it("has no duplicate terms", () => {
    const terms = STIGMA_TERMS.map((t) => t.term);
    expect(new Set(terms).size).toBe(terms.length);
  });
});

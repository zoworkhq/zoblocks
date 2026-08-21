/**
 * The property the whole package layout exists for.
 *
 * A Figma plugin runs across two isolated contexts: a sandbox that has the
 * `figma` API and no networking, and an iframe that has networking and no
 * `figma` API. Neither is pleasant to test, and the entire design goal here is
 * to make that irrelevant by keeping every rule in a package that runs under
 * vitest instead.
 *
 * That only holds while this package stays pure, and purity is exactly the kind
 * of property that erodes one convenient import at a time. So it is asserted
 * against the source rather than promised in a comment.
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
/**
 * Comments stripped before checking.
 *
 * These files talk *about* `figma.*` and the network at length — explaining why
 * they contain neither is most of what the comments here are for — so matching
 * the raw text flagged the documentation as the violation. The property is
 * about what the code does, so the prose has to go before the check.
 */
const strip = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const files = readdirSync(src)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => [f, strip(readFileSync(path.join(src, f), "utf8"))] as const);

describe("this package can run inside a plugin sandbox", () => {
  it("has source files to check, so a rename cannot empty this suite", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it.each(files)("%s imports nothing from node:", (_name, source) => {
    expect(source).not.toMatch(/from ["']node:/);
  });

  /**
   * The sandbox has `figma.*` and the core must not.
   *
   * The moment one function here reaches for it, this package stops being
   * testable outside Figma and the adapter stops being the thin thing that
   * makes the split worthwhile.
   */
  it.each(files)("%s never touches the figma API", (_name, source) => {
    expect(source).not.toMatch(/\bfigma\./);
    expect(source).not.toMatch(/@figma\/plugin-typings/);
  });

  it.each(files)("%s does not reach the network", (_name, source) => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/XMLHttpRequest|WebSocket/);
  });

  it.each(files)("%s does not touch the DOM", (_name, source) => {
    expect(source).not.toMatch(/\bdocument\.|\bwindow\./);
  });
});

describe("its dependencies stay pure too", () => {
  /**
   * One runtime dependency, and it is the validator.
   *
   * That is the point: the plugin, the app and the publish gate give one
   * answer for one palette because they run the same code. A second dependency
   * arriving here is how that stops being true.
   */
  it("depends on the token package and nothing else at runtime", () => {
    const manifest = JSON.parse(readFileSync(path.join(src, "..", "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(Object.keys(manifest.dependencies ?? {})).toEqual(["@oxygenui-design/tokens"]);
  });
});

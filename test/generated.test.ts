/**
 * The generated artifacts, checked for the things that make them unstable or
 * unsafe to publish.
 *
 * This file exists because of a defect that shipped and was only caught when
 * CI and a laptop disagreed: TypeScript prints an imported type as
 * `import("/abs/path/to/module").LoaderAnnounce`, with the path absolute and
 * machine-specific, and that string went straight into the docs catalog.
 *
 * Three consequences, and the third is the one that stops it being a cosmetic
 * problem:
 *
 *   1. The catalog differed on every machine, so "no stale generated files"
 *      failed for anyone whose checkout was not at the same path.
 *   2. The props table read `import("/Users/…/loader").LoaderAnnounce` instead
 *      of `LoaderAnnounce`.
 *   3. The catalog is rendered on the public docs site, so it published the
 *      author's home directory.
 *
 * A regression here is invisible in review — the diff looks like a normal
 * regeneration — so it needs a test rather than a comment.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Every committed generated artifact. */
const ARTIFACTS = [
  "apps/docs/src/lib/generated/catalog.ts",
  "packages/tokens/src/tokens.json",
  "packages/tokens/src/oxygen-tokens.css",
  "packages/tokens/src/tailwind.css",
  "packages/tokens/src/contrast.json",
  "registry.json",
];

const read = (relative: string) => readFileSync(path.join(ROOT, relative), "utf8");

describe("generated artifacts are machine-independent", () => {
  it.each(ARTIFACTS)("%s contains no absolute filesystem path", (relative) => {
    const text = read(relative);

    // Anything rooted at a real filesystem location is machine-specific by
    // definition. Covers macOS, Linux and the Windows drive form.
    const paths = [
      ...text.matchAll(/["'(](\/(?:Users|home|var|tmp|opt|private)\/[^"')\s]+)/g),
      ...text.matchAll(/["'(]([A-Za-z]:\\\\[^"')\s]+)/g),
    ].map((match) => match[1]);

    expect(paths).toEqual([]);
  });

  it.each(ARTIFACTS)("%s does not name this checkout", (relative) => {
    // A relative path that happens to match is fine; the repository's own
    // absolute location never is.
    expect(read(relative)).not.toContain(ROOT);
  });
});

describe("the docs catalog", () => {
  const catalog = read("apps/docs/src/lib/generated/catalog.ts");

  it("prints imported types by name, not by module path", () => {
    // `import("…").Foo` is what tsc emits when a type has no local alias in
    // scope. It is correct TypeScript and useless documentation.
    expect(catalog).not.toMatch(/import\(["'][^"']*["']\)\./);
  });

  it("still resolves those types to something nameable", () => {
    // Guards the fix from over-reaching: stripping the wrapper must leave the
    // type name, not an empty string or a bare `.`.
    expect(catalog).toContain('"type": "LoaderAnnounce | undefined"');
    expect(catalog).not.toMatch(/"type": "\s*\.\s*/);
    expect(catalog).not.toMatch(/"type": ""/);
  });

  it("keeps every prop type on one line", () => {
    // The props table renders these directly; a multi-line union breaks the
    // layout and the horizontal-scroll affordance around it.
    const types = [...catalog.matchAll(/"type": "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1] ?? "");
    expect(types.length).toBeGreaterThan(50);
    expect(types.filter((t) => t.includes("\\n"))).toEqual([]);
  });
});

describe("the published registry", () => {
  const registryDir = path.join(ROOT, "apps/docs/public/r");

  it("serves no file containing an absolute path", () => {
    // These are fetched by the shadcn CLI and written into a customer's repo,
    // so anything machine-specific here ends up in their source tree.
    const offenders: string[] = [];
    for (const name of readdirSync(registryDir).filter((f) => f.endsWith(".json"))) {
      const text = readFileSync(path.join(registryDir, name), "utf8");
      if (text.includes(ROOT)) offenders.push(name);
    }
    expect(offenders).toEqual([]);
  });
});

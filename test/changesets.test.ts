/**
 * The release cannot be blocked by a changeset again.
 *
 * `changeset version` refuses to run when one changeset names both an ignored
 * package and a released one, and the refusal is total: no version PR, no
 * publish, and a red release workflow that says nothing about which file is at
 * fault. It has happened three times, each time by the same route — someone
 * adds a lint rule alongside a component and lists `eslint-plugin` in the
 * changeset, because they did change it.
 *
 * They did, and it does not matter: `eslint-plugin` is `private: true` and in
 * the `ignore` list, so naming it can never publish anything. The line has no
 * effect except to stop the release.
 *
 * These checks are here rather than in a CI step because a broken release is
 * discovered days later, by which point several more merges have landed on
 * top. `pnpm test` runs before any of them.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANGESET_DIR = path.join(ROOT, ".changeset");

/** `ignore` from the changesets config, with its comments stripped. */
function ignoredPackages(): string[] {
  const raw = readFileSync(path.join(CHANGESET_DIR, "config.json"), "utf8");
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, "")) as { ignore?: string[] };
  return config.ignore ?? [];
}

/** Every workspace package, by name, with whether it is publishable. */
function workspacePackages(): Map<string, { private: boolean }> {
  const out = new Map<string, { private: boolean }>();
  for (const dir of ["packages", "apps"]) {
    const base = path.join(ROOT, dir);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = path.join(base, entry.name, "package.json");
      if (!existsSync(manifest)) continue;
      const parsed = JSON.parse(readFileSync(manifest, "utf8")) as {
        name?: string;
        private?: boolean;
      };
      if (parsed.name) out.set(parsed.name, { private: parsed.private === true });
    }
  }
  return out;
}

interface Changeset {
  file: string;
  packages: string[];
}

/** The package names in each changeset's frontmatter. */
function changesets(): Changeset[] {
  return readdirSync(CHANGESET_DIR)
    .filter((name) => name.endsWith(".md") && name.toLowerCase() !== "readme.md")
    .map((name) => {
      const body = readFileSync(path.join(CHANGESET_DIR, name), "utf8");
      // Frontmatter is the block between the first two `---` fences.
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(body)?.[1] ?? "";
      const packages = [...frontmatter.matchAll(/^"([^"]+)":\s*\S+/gm)].map((m) => m[1] ?? "");
      return { file: name, packages };
    });
}

describe("the changesets that gate the next release", () => {
  const ignored = new Set(ignoredPackages());
  const workspace = workspacePackages();
  const all = changesets();

  it("reads every changeset it finds", () => {
    // Guards the parser: a frontmatter format change would otherwise make
    // every assertion below pass against empty arrays.
    //
    // It used to require at least one changeset. Merging a Version PR consumes
    // them all, so on 14 Sept that turned main red straight after the first
    // release and failed the release job's own Test step before it could
    // publish. An empty directory is a release that just happened; a file that
    // parses to no packages is the parser failure this test exists to catch.
    const unparsed = all.filter((c) => c.packages.length === 0).map((c) => c.file);
    expect(unparsed, `no packages parsed from: ${unparsed.join(", ")}`).toEqual([]);
  });

  it("never mixes an ignored package with a released one", () => {
    const mixed = all
      .filter((c) => {
        const isIgnored = c.packages.filter((p) => ignored.has(p));
        const isReleased = c.packages.filter((p) => !ignored.has(p));
        return isIgnored.length > 0 && isReleased.length > 0;
      })
      .map(
        (c) =>
          `${c.file} mixes ignored [${c.packages.filter((p) => ignored.has(p)).join(", ")}] ` +
          `with released [${c.packages.filter((p) => !ignored.has(p)).join(", ")}] — ` +
          `drop the ignored name; it cannot publish anything`,
      );

    expect(mixed, mixed.join("\n")).toEqual([]);
  });

  it("never names a package that is not published", () => {
    // The mistake underneath the one above. A private package in a changeset
    // is at best a no-op and at worst the release blocker; either way the
    // note belongs in the changeset's prose, not its frontmatter.
    const unpublishable = all.flatMap((c) =>
      c.packages
        .filter((p) => workspace.get(p)?.private)
        .map((p) => `${c.file} names ${p}, which is private and can never be published`),
    );

    expect(unpublishable, unpublishable.join("\n")).toEqual([]);
  });

  it("never names a package that does not exist", () => {
    // A typo here fails silently: changesets releases nothing for it and says
    // nothing about it, so the package everyone believed shipped simply did
    // not.
    const unknown = all.flatMap((c) =>
      c.packages
        .filter((p) => !workspace.has(p))
        .map((p) => `${c.file} names ${p}, which is not a package in this workspace`),
    );

    expect(unknown, unknown.join("\n")).toEqual([]);
  });
});

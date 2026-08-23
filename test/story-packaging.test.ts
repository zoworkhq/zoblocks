/**
 * A story must never reach a published tarball.
 *
 * Package stories live in `src/`, because that is where the generator looks
 * for them and where they sit beside what they demonstrate. `src/` is also
 * what `tsc` compiles and what `files` publishes — so the default outcome is a
 * `dist/*.stories.js` that imports the shared test harness and a
 * devDependency, neither of which is in the tarball. The consumer's bundler
 * walks the directory, resolves nothing, and fails on a file they never asked
 * for.
 *
 * Nothing else catches it. Every test passes, the build succeeds, and the
 * defect exists only for whoever installs the package.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = path.join(ROOT, "packages");

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));

/** Packages that keep at least one story under `src/`. */
const withStories = readdirSync(PACKAGES, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => {
    const src = path.join(PACKAGES, name, "src");
    return existsSync(src) && readdirSync(src).some((file) => file.endsWith(".stories.tsx"));
  })
  .sort();

describe("package stories stay out of the build", () => {
  it("finds the packages that have them", () => {
    // Not a fixed list: a new package with stories should be covered the day
    // it lands, not the day someone remembers this file.
    expect(withStories.length).toBeGreaterThan(0);
  });

  it.each(withStories)("%s builds through a config that excludes them", (name) => {
    const pkg = read(path.join(PACKAGES, name, "package.json"));
    const build: string = pkg.scripts?.build ?? "";
    const match = build.match(/tsc -p (\S+)/);
    expect(match?.[1], `${name}: build does not run tsc against a named config`).toBeTruthy();

    const config = read(path.join(PACKAGES, name, match![1]!));
    expect(
      (config.exclude ?? []).some((pattern: string) => pattern.includes("stories")),
      `${name}: ${match![1]} does not exclude stories, so tsc will emit them into dist`,
    ).toBe(true);
  });

  it.each(withStories)("%s excludes them from the published tarball", (name) => {
    const pkg = read(path.join(PACKAGES, name, "package.json"));
    expect(
      (pkg.files ?? []).some((entry: string) => entry.startsWith("!") && entry.includes("stories")),
      `${name}: "files" publishes src without negating *.stories.tsx`,
    ).toBe(true);
  });

  it.each(withStories)("%s has no story in dist", (name) => {
    const dist = path.join(PACKAGES, name, "dist");
    if (!existsSync(dist)) return; // Not built in this checkout; the config checks above still hold.
    const leaked = readdirSync(dist).filter((file) => file.includes(".stories."));
    expect(leaked, `${name}: dist contains story output`).toEqual([]);
  });

  it.each(withStories)("%s still typechecks its stories", (name) => {
    const pkg = read(path.join(PACKAGES, name, "package.json"));
    const typecheck: string = pkg.scripts?.typecheck ?? "";
    const build: string = pkg.scripts?.build ?? "";
    const typecheckConfig = typecheck.match(/tsc -p (\S+)/)?.[1];
    const buildConfig = build.match(/tsc -p (\S+)/)?.[1];
    // Excluding stories from the build is correct; excluding them from the
    // typecheck too would mean a story that does not compile ships as a
    // fixture nobody can run.
    expect(
      typecheckConfig,
      `${name}: typecheck must use a different config from build, or stories go unchecked`,
    ).not.toBe(buildConfig);
  });
});

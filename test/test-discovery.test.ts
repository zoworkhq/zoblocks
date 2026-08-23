/**
 * Every test file a package contains is a test file that package runs.
 *
 * A `.ts` test added to a package whose `include` names only `.test.tsx` is
 * not an error anywhere: vitest collects nothing, reports the files it did
 * find, and exits green. The file sits in the repository looking like
 * coverage. This was found by writing exactly that file into
 * `packages/signature`, whose include was `["src/**\/*.test.tsx",
 * "test/**\/*.test.tsx"]` — the new suite simply never ran.
 *
 * Checked against the configs rather than by collecting for real: running
 * `vitest list` in thirty packages takes half a minute, and the cause is the
 * glob, not the collection.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Project {
  name: string;
  dir: string;
  include: string[];
}

/**
 * The `include` from a config's `test` block.
 *
 * A coverage block has its own `include` naming source files, and it usually
 * comes first — so the one that matters is identified by naming test files,
 * not by position.
 */
function testInclude(source: string): string[] | null {
  const candidates = [...source.matchAll(/include:\s*\[([^\]]*)\]/g)]
    .map((m) => m[1] ?? "")
    .filter((body) => body.includes(".test."));
  const chosen = candidates.at(-1);
  if (chosen === undefined) return null;
  return [...chosen.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
}

const projects: Project[] = [];
for (const base of ["packages", "apps"]) {
  const dir = path.join(ROOT, base);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const config = path.join(dir, entry.name, "vitest.config.ts");
    if (!existsSync(config)) continue;
    const include = testInclude(readFileSync(config, "utf8"));
    if (include === null) continue;
    projects.push({ name: `${base}/${entry.name}`, dir: path.join(dir, entry.name), include });
  }
}

/** Test files on disk, ignoring build output and dependencies. */
function testFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (at: string) => {
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith("."))
        continue;
      const full = path.join(at, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.test\.[cm]?[jt]sx?$/.test(entry.name)) out.push(path.relative(dir, full));
    }
  };
  walk(dir);
  return out.sort();
}

/**
 * Whether one vitest glob would collect one path.
 *
 * Written out rather than reached for from a library because the generator
 * runs in plain Node and picomatch is not a direct dependency. The two rules
 * that matter, and that a naive implementation gets wrong:
 *
 *   `**\/`  matches zero or more directories, so `test/**\/*.test.ts` collects
 *           `test/a.test.ts` as well as `test/deep/a.test.ts`
 *   `*`     never crosses a `/`
 *
 * Brace groups are expanded first, into alternatives matched separately, so
 * the regex builder never has to escape a group it just wrote — which is the
 * mistake the first version of this function made.
 */
function expandBraces(pattern: string): string[] {
  const match = pattern.match(/\{([^}]+)\}/);
  if (!match) return [pattern];
  return match[1]!
    .split(",")
    .flatMap((option) => expandBraces(pattern.replace(match[0], option.trim())));
}

function matchesOne(pattern: string, file: string): boolean {
  const source = pattern
    .split("**/")
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"))
    .join("(?:[^/]+/)*");
  return new RegExp(`^${source}$`).test(file);
}

function matches(pattern: string, file: string): boolean {
  return expandBraces(pattern).some((expanded) => matchesOne(expanded, file));
}

describe("test discovery", () => {
  it("finds the workspace's vitest projects", () => {
    expect(projects.length).toBeGreaterThan(20);
  });

  it.each(projects.map((p) => [p.name, p] as const))(
    "%s collects every test it contains",
    (_name, project) => {
      const orphans = testFiles(project.dir).filter(
        (file) => !project.include.some((pattern) => matches(pattern, file)),
      );
      expect(
        orphans,
        `${project.name}: these exist and no include matches them, so they never run — ${project.include.join(", ")}`,
      ).toEqual([]);
    },
  );
});

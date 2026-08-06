/**
 * Pre-publish assertions on the actual tarball.
 *
 * Every check here corresponds to a defect that shipped in 0.1.0 and that the
 * build, the typecheck, and `npm publish --dry-run` all passed over. They were
 * only found by publishing to a throwaway registry and installing the result.
 * This is that rehearsal, as a gate.
 *
 *   node scripts/check-tarball.mjs
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

const packed = JSON.parse(
  execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: pkgDir, encoding: "utf8" }),
)[0];
const files = packed.files.map((f) => f.path);

for (const required of ["dist/index.js", "dist/index.d.ts", "README.md", "LICENSE"]) {
  if (!files.includes(required)) {
    problems.push(
      required === "README.md"
        ? "README.md is missing — npm would publish this with an empty page."
        : `${required} is missing from the tarball.`,
    );
  }
}

const tests = files.filter((f) => /\.test\.|__tests__/.test(f));
if (tests.length > 0) {
  problems.push(`Test files are in the tarball: ${tests.join(", ")}`);
}

/**
 * Node's ESM resolver will not guess an extension, so `export * from "./types"`
 * throws ERR_MODULE_NOT_FOUND for anyone importing outside a bundler.
 *
 * Parsed rather than grepped. The first version of this check was a regex that
 * excluded specifiers ending in `s`, which silently exempted "./types" — the
 * exact specifier that broke 0.1.0. A guard that misses the bug it was written
 * for is worse than no guard, because it reads like coverage.
 */
const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;
const HAS_EXTENSION = /\.(js|mjs|cjs|json|node|css)$/;

for (const file of files.filter((f) => /\.(js|mjs|d\.ts|d\.mts)$/.test(f))) {
  const source = readFileSync(path.join(pkgDir, file), "utf8");
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!HAS_EXTENSION.test(specifier)) {
      problems.push(`${file}: relative import "${specifier}" has no file extension.`);
    }
  }
}

const manifest = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
const published = { ...manifest, ...(manifest.publishConfig ?? {}) };
for (const [field, value] of [
  ["main", published.main],
  ["types", published.types],
]) {
  if (typeof value === "string" && value.startsWith("./src/")) {
    problems.push(
      `publishConfig did not take effect: ${field} still points at ${value}. ` +
        "That rewrite is a pnpm feature — publishing with npm ships raw TypeScript.",
    );
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`::error::${p}`);
  console.error(`\n${problems.length} problem(s). Not publishable.`);
  process.exit(1);
}

console.log(`Tarball OK — ${files.length} files, ${packed.size} bytes packed.`);

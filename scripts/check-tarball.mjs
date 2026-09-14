/**
 * Pre-publish assertions on the real tarball of every publishable package.
 *
 *   node scripts/check-tarball.mjs              # every non-private package
 *   node scripts/check-tarball.mjs tokens cli   # just these (directory names)
 *
 * Run after `pnpm build`. Each package is packed with `pnpm pack` — the same
 * code path `changeset publish` takes — and the manifest *inside the tarball*
 * is inspected. Reading package.json from disk and merging publishConfig by
 * hand only guesses at what pnpm will emit; it cannot see an unresolved
 * `workspace:` range, which is a broken install for every consumer.
 *
 * The release workflow used to run a per-package script only where one
 * existed. Five of 27 packages had one, so 22 would have published unchecked.
 * A package's own `scripts/check-tarball.mjs` still runs after these shared
 * checks, for assertions only it can make (tokens checks its stylesheet).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY = "github.com/zoworkhq/zoblocks";

const only = process.argv.slice(2);
const dirs = readdirSync(path.join(root, "packages"))
  .map((name) => path.join(root, "packages", name))
  .filter((dir) => existsSync(path.join(dir, "package.json")))
  .filter((dir) => !JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8")).private)
  .filter((dir) => only.length === 0 || only.includes(path.basename(dir)));

if (only.length > 0 && dirs.length !== only.length) {
  console.error(`::error::Unknown or private package in: ${only.join(", ")}`);
  process.exit(1);
}

/** Every string a conditional export can resolve to, at any depth. */
function targets(value) {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(targets);
  return [];
}

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full, base) : [path.relative(base, full)];
  });
}

/**
 * Node's ESM resolver will not guess an extension, so `export * from "./types"`
 * throws ERR_MODULE_NOT_FOUND outside a bundler. That shipped once.
 */
const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;
const HAS_EXTENSION = /\.(js|mjs|cjs|json|node|css)$/;

function check(dir) {
  const problems = [];
  const out = mkdtempSync(path.join(tmpdir(), "zb-pack-"));
  try {
    execFileSync("pnpm", ["pack", "--pack-destination", out], { cwd: dir, stdio: "pipe" });
    const tarball = readdirSync(out).find((f) => f.endsWith(".tgz"));
    execFileSync("tar", ["-xzf", tarball], { cwd: out });
    const pkgRoot = path.join(out, "package");
    const files = walk(pkgRoot).map((f) => f.split(path.sep).join("/"));
    const has = (rel) => files.includes(rel.replace(/^\.\//, ""));
    const manifest = JSON.parse(readFileSync(path.join(pkgRoot, "package.json"), "utf8"));

    for (const required of ["README.md", "LICENSE"]) {
      if (!has(required)) problems.push(`${required} is missing from the tarball.`);
    }
    if (!manifest.license) problems.push("No license field.");
    if (!manifest.files) problems.push("No files field — the tarball takes whatever is on disk.");

    // Provenance is rejected unless repository.url names the repo that built it.
    if (!String(manifest.repository?.url ?? "").includes(REPOSITORY)) {
      problems.push(`repository.url must name ${REPOSITORY}, or publishing with provenance fails.`);
    }

    for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      for (const [name, range] of Object.entries(manifest[field] ?? {})) {
        if (String(range).startsWith("workspace:")) {
          problems.push(`${field}.${name} is still "${range}" — pnpm did not rewrite it.`);
        }
      }
    }

    const entries = [
      ["main", manifest.main],
      ["types", manifest.types],
      ...Object.entries(manifest.exports ?? {}).flatMap(([subpath, target]) =>
        targets(target).map((t) => [`exports["${subpath}"]`, t]),
      ),
    ];
    for (const [field, target] of entries) {
      if (typeof target !== "string") continue;
      if (/^\.\/src\/.*\.tsx?$/.test(target)) {
        problems.push(
          `${field} points at TypeScript source (${target}); publishConfig did not apply.`,
        );
      } else if (!target.includes("*") && !has(target)) {
        problems.push(`${field} points at ${target}, which is not in the tarball.`);
      }
    }
    if (!manifest.types && !targets(manifest.exports?.["."]).some((t) => t.endsWith(".d.ts"))) {
      problems.push("No type declarations for the root entry point.");
    }

    const tests = files.filter((f) => /\.(test|spec)\.|__tests__\//.test(f));
    if (tests.length > 0) problems.push(`Test files are in the tarball: ${tests.join(", ")}`);

    for (const file of files.filter((f) => /^dist\/.*\.(js|mjs|d\.ts|d\.mts)$/.test(f))) {
      const source = readFileSync(path.join(pkgRoot, file), "utf8");
      for (const [, specifier] of source.matchAll(SPECIFIER)) {
        if (!HAS_EXTENSION.test(specifier)) {
          problems.push(`${file}: relative import "${specifier}" has no file extension.`);
        }
      }
    }

    return { name: manifest.name, version: manifest.version, files: files.length, problems };
  } catch (error) {
    const stderr = error.stderr?.toString().trim();
    return { name: path.basename(dir), problems: [`pnpm pack failed: ${stderr || error.message}`] };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

let failed = 0;
for (const dir of dirs) {
  const result = check(dir);
  const own = path.join(dir, "scripts", "check-tarball.mjs");
  if (result.problems.length === 0 && existsSync(own)) {
    try {
      execFileSync("node", [own], { cwd: dir, stdio: "pipe" });
    } catch (error) {
      result.problems.push(`scripts/check-tarball.mjs failed:\n${error.stderr?.toString().trim()}`);
    }
  }
  if (result.problems.length === 0) {
    console.log(`ok   ${result.name}@${result.version} — ${result.files} files`);
  } else {
    failed += 1;
    console.error(`FAIL ${result.name}`);
    for (const p of result.problems) console.error(`::error::${result.name}: ${p}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} of ${dirs.length} package(s) not publishable.`);
  process.exit(1);
}
console.log(`\nAll ${dirs.length} packages publishable.`);

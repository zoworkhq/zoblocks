/**
 * Pre-publish assertions on the actual React tarball.
 *
 * Every check corresponds to a way a component package breaks in someone else's
 * build rather than ours — the only place these failures are ever discovered.
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

for (const required of ["dist/index.js", "dist/index.d.ts", "dist/styles.css", "README.md", "LICENSE"]) {
  if (!files.includes(required)) problems.push(`${required} is missing from the tarball.`);
}

const tests = files.filter((f) => /\.test\.|\.stories\.|__tests__/.test(f));
if (tests.length > 0) problems.push(`Test or story files are in the tarball: ${tests.join(", ")}`);

/** Node's ESM resolver will not guess an extension. */
const SPECIFIER = /(?:\bfrom|\bimport)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;
const HAS_EXTENSION = /\.(js|mjs|cjs|json|node|css)$/;
for (const file of files.filter((f) => /\.(js|mjs|d\.ts)$/.test(f))) {
  const source = readFileSync(path.join(pkgDir, file), "utf8");
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!HAS_EXTENSION.test(specifier)) {
      problems.push(`${file}: relative import "${specifier}" has no file extension.`);
    }
  }
}

/** A consumer alias resolves only inside a shadcn project, never inside a package. */
for (const file of files.filter((f) => /\.(js|d\.ts)$/.test(f))) {
  const source = readFileSync(path.join(pkgDir, file), "utf8");
  if (/from\s+["']@\//.test(source)) {
    problems.push(`${file}: contains an unrewritten "@/..." consumer alias.`);
  }
}

/** React must be a peer. Bundling it hands the host two copies. */
const manifest = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8"));
if (manifest.dependencies?.react || manifest.dependencies?.["react-dom"]) {
  problems.push("react/react-dom must be peerDependencies, never dependencies.");
}
if (!manifest.peerDependencies?.react) problems.push("react is not declared as a peer dependency.");

const published = { ...manifest, ...(manifest.publishConfig ?? {}) };
for (const [field, value] of [["main", published.main], ["types", published.types]]) {
  if (typeof value === "string" && value.startsWith("./src/")) {
    problems.push(
      `publishConfig did not take effect: ${field} still points at ${value}. ` +
        "That rewrite is a pnpm feature — publishing with npm ships raw TypeScript.",
    );
  }
}

/**
 * A file that declares "use client" in source must still declare it in dist,
 * first in the file.
 *
 * Compared against source rather than asserted for every file: `lib/utils.ts`
 * is a pure helper and correctly has no directive. The failure this catches is
 * a build step that drops or displaces one, which turns a client component into
 * a server component and fails at the first hook — far from the cause.
 */
const hasDirective = (text) => {
  const t = text.trimStart();
  return t.startsWith('"use client"') || t.startsWith("'use client'");
};

for (const file of files.filter((f) => /^dist\/.*\.js$/.test(f))) {
  const srcCandidates = [
    file.replace(/^dist\//, "src/").replace(/\.js$/, ".tsx"),
    file.replace(/^dist\//, "src/").replace(/\.js$/, ".ts"),
  ];
  const srcPath = srcCandidates.find((c) => files.includes(c));
  if (!srcPath) continue;

  if (hasDirective(readFileSync(path.join(pkgDir, srcPath), "utf8"))) {
    if (!hasDirective(readFileSync(path.join(pkgDir, file), "utf8"))) {
      problems.push(`${file}: lost the "use client" directive that ${srcPath} declares.`);
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`::error::${p}`);
  console.error(`\n${problems.length} problem(s). Not publishable.`);
  process.exit(1);
}

console.log(`Tarball OK — ${files.length} files, ${packed.size} bytes packed.`);

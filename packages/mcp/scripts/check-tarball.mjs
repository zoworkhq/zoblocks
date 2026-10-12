/**
 * Pre-publish assertions on the @zoblocks/mcp tarball, after the shared ones.
 *
 * The bundled catalog is what `--offline` serves and what every install falls
 * back to when zoblocks.design is unreachable, so a stale one is a wrong
 * answer an agent cannot detect. It is copied at build time from a generated,
 * gitignored file outside the package — two ways to ship the wrong one: a
 * build that ran before `pnpm gen`, and a build cache restored over a catalog
 * that has since changed. Both end here, against the manifest this checkout
 * generates.
 *
 *   node scripts/check-tarball.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const problems = [];

let generated;
try {
  generated = read(path.join(pkgDir, "../../apps/docs/public/ai/manifest.json"));
} catch {
  problems.push("apps/docs/public/ai/manifest.json is missing — run `pnpm gen`, then build.");
}

let bundled;
try {
  bundled = read(path.join(pkgDir, "dist/manifest.json"));
} catch {
  problems.push("dist/manifest.json is missing — the build did not bundle a catalog.");
}

if (generated && bundled && bundled.contentHash !== generated.contentHash) {
  problems.push(
    `dist/manifest.json is stale: bundled ${bundled.contentHash}, generated ${generated.contentHash}. ` +
      "Rebuild @zoblocks/mcp after `pnpm gen`.",
  );
}

const pkg = read(path.join(pkgDir, "package.json"));
const server = read(path.join(pkgDir, "server.json"));
if (pkg.mcpName !== server.name) {
  problems.push(`mcpName ${pkg.mcpName} does not match server.json name ${server.name}.`);
}

if (problems.length) {
  for (const p of problems) console.error(p);
  process.exit(1);
}

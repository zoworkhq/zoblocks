/**
 * Bundles the catalog into the build: copies the manifest `pnpm gen` wrote to
 * `dist/manifest.json`, where the server falls back to it when the live one
 * cannot be read.
 *
 * Fails the build when there is nothing to copy. A package published without
 * its snapshot would start fine online and fail offline — the one case the
 * snapshot exists for — so that must not be discoverable only by a customer.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, "..", "..", "..", "apps", "docs", "public", "ai", "manifest.json");
const target = path.join(here, "..", "dist", "manifest.json");

if (!existsSync(source)) {
  console.error(
    `[mcp] no manifest at ${path.relative(process.cwd(), source)} — run \`pnpm gen\` first.`,
  );
  process.exit(1);
}

const { schemaVersion, contentHash, components } = JSON.parse(readFileSync(source, "utf8"));
mkdirSync(path.dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(
  `[mcp] bundled catalog snapshot: schema ${schemaVersion}, ${components.length} components, ${contentHash}`,
);

/**
 * The stylesheets are source, not compiled output — `tsc` will not carry them
 * into dist, and a published package whose `exports["./styles.css"]` points at a
 * file that is not there fails at import time in the consumer's build, not ours.
 *
 * Every sheet named in `exports` is copied, and the list is derived from
 * package.json rather than restated here. A new stylesheet that reached
 * `exports` and not this script would publish a broken subpath, and the failure
 * would surface as a module-not-found in someone else's CI.
 */
import { copyFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const sheets = Object.keys(pkg.exports).filter((key) => key.endsWith(".css"));
if (sheets.length === 0) throw new Error("[react] no stylesheet subpaths found in exports");

for (const subpath of sheets) {
  const relative = subpath.replace(/^\.\//, "");
  const from = path.join(root, "src", relative);
  const to = path.join(root, "dist", relative);

  if (!existsSync(from)) {
    throw new Error(`[react] exports declares "${subpath}" but src/${relative} does not exist`);
  }

  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
}

console.log(`[react] ${sheets.length} stylesheet(s) copied to dist`);

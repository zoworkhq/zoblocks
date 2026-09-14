/**
 * Append `.js` to extensionless relative specifiers in the emitted dist.
 *
 * Why this exists
 * ---------------
 * Node's ESM resolver will not guess a file extension. `export * from "./types"`
 * throws ERR_MODULE_NOT_FOUND at runtime, and the matching line in `index.d.ts`
 * fails TypeScript projects on `moduleResolution: NodeNext`. TypeScript never
 * rewrites specifiers, so `tsc` emits whatever the source said.
 *
 * The obvious fix — writing `./types.js` in `src` — is the documented TS ESM
 * convention, but it breaks this repo: `@zoblocks/fhir` is consumed
 * inside the workspace as raw TypeScript (`main: ./src/index.ts` plus
 * `transpilePackages`), and neither webpack nor Turbopack maps `.js` back to
 * `.ts` under `moduleResolution: Bundler`. Both the docs build and `next dev`
 * fail on a file called `types.js` that does not exist.
 *
 * So the source stays extensionless — correct for every bundler in the
 * monorepo — and only the published artifact is rewritten. The break was
 * always in the artifact, not the source.
 *
 * This ran because a local publish rehearsal installed the tarball into a
 * clean project and imported it. `tsc`, `next build`, and
 * `npm publish --dry-run` all passed while the package was unusable in Node.
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// The dist of the package *running* the script, not the one it lives in. Six
// packages call this as `node ../tokens/scripts/fix-esm-extensions.mjs`; while
// this was resolved from the script's own location, every one of those runs
// rewrote tokens' dist again and left its own untouched — which the build
// could not notice and only packing the tarball showed.
const dist = process.argv[2] ? path.resolve(process.argv[2]) : path.join(process.cwd(), "dist");
const label = path.basename(path.dirname(dist));

// A relative specifier in a from-clause or dynamic import that carries no
// extension. Anything already ending in a known extension is left alone.
const SPECIFIER = /(\bfrom\s*["']|\bimport\s*\(\s*["'])(\.{1,2}\/[^"']*?)(["'])/g;
const HAS_EXTENSION = /\.(js|mjs|cjs|json|node|css)$/;

let changed = 0;
const touched = [];

for (const entry of await readdir(dist, { withFileTypes: true, recursive: true })) {
  if (!entry.isFile()) continue;
  if (!/\.(js|mjs|d\.ts|d\.mts)$/.test(entry.name)) continue;

  const file = path.join(entry.parentPath ?? entry.path, entry.name);
  const before = await readFile(file, "utf8");
  const after = before.replace(SPECIFIER, (match, open, spec, close) =>
    HAS_EXTENSION.test(spec) ? match : `${open}${spec}.js${close}`,
  );

  if (after !== before) {
    await writeFile(file, after);
    changed += 1;
    touched.push(path.relative(dist, file));
  }
}

console.log(
  changed === 0
    ? `[${label}] esm extensions: nothing to rewrite`
    : `[${label}] esm extensions: rewrote ${changed} file(s) — ${touched.join(", ")}`,
);

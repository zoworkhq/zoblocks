/**
 * Pre-publish assertions on the actual tokens tarball.
 *
 * This package had no such check, and the release workflow gated on the script's
 * existence — so tokens was the one publishable package inspected by nothing.
 * The consequence shipped: the pre-rename tokens package (0.1.0) on npm predates the
 * token pipeline entirely, exports two paths where the source declares six, and
 * still contains the zero-alpha `surface-overlay` that renders every dialog and
 * popover fully transparent — a bug fixed in source and never republished.
 *
 * The checks below are the ones that would have caught it.
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

/** Everything a consumer can import must be in the tarball. */
const REQUIRED = [
  "dist/tokens.js",
  "dist/tokens.d.ts",
  "src/zoblocks-tokens.css",
  "src/tailwind.css",
  "src/tokens.json",
  "src/contrast.json",
  "README.md",
  "LICENSE",
];

for (const file of REQUIRED) {
  if (!files.includes(file)) problems.push(`${file} is missing from the tarball.`);
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

/** Every declared export subpath must resolve to a file that was packed. */
for (const [subpath, target] of Object.entries(published.exports ?? {})) {
  const resolved = typeof target === "string" ? target : (target?.default ?? target?.types);
  if (typeof resolved !== "string") continue;
  const rel = resolved.replace(/^\.\//, "");
  if (rel === "package.json") continue;
  if (!files.includes(rel)) {
    problems.push(`exports["${subpath}"] points at ${resolved}, which is not in the tarball.`);
  }
}

/**
 * The stylesheet is the whole product. Publishing an empty or truncated one is
 * indistinguishable from publishing nothing, and it is what makes every
 * component render unstyled.
 */
const css = readFileSync(path.join(pkgDir, "src/zoblocks-tokens.css"), "utf8");
for (const [marker, why] of [
  [":root", "no :root block — the light theme is the baseline every consumer gets"],
  ['[data-theme="dark"]', "no dark theme"],
  ['[data-zb-theme="high-contrast"]', "no high-contrast theme"],
  ['[data-zb-density="clinical"]', "no density profiles"],
  ["prefers-reduced-motion", "no reduced-motion handling"],
  ["forced-colors", "no forced-colors handling"],
]) {
  if (!css.includes(marker)) problems.push(`zoblocks-tokens.css: ${why} (missing "${marker}").`);
}

/**
 * The regression this file exists for. An eight-digit hex ending in 00 is a
 * fully transparent colour; on a surface token it means popovers and dialogs
 * render with the page showing through.
 */
const zeroAlpha = [...css.matchAll(/#[0-9a-fA-F]{6}00\b/g)].map((m) => m[0]);
if (zeroAlpha.length > 0) {
  problems.push(
    `zoblocks-tokens.css contains a fully transparent colour: ${zeroAlpha.join(", ")}. ` +
      "This shipped once as surface-overlay and made every dialog see-through.",
  );
}

/** Published contrast evidence must not contain a failing reading. */
const contrast = JSON.parse(readFileSync(path.join(pkgDir, "src/contrast.json"), "utf8"));
const failing = contrast.filter((r) => r.ratio < r.floor);
if (failing.length > 0) {
  problems.push(
    `contrast.json publishes ${failing.length} reading(s) below floor: ` +
      failing.map((r) => `${r.theme} ${r.token}/${r.against} ${r.ratio}:1`).join(", "),
  );
}

/** No DTCG alias may survive into the flat map external tooling reads. */
const tokens = JSON.parse(readFileSync(path.join(pkgDir, "src/tokens.json"), "utf8"));
const leaked = [];
for (const [group, map] of [
  ...Object.entries(tokens.themes ?? {}).map(([k, v]) => [`themes.${k}`, v]),
  ...Object.entries(tokens.density ?? {}).map(([k, v]) => [`density.${k}`, v]),
  ["component", tokens.component ?? {}],
]) {
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === "string" && /\{[^}]+\}/.test(value)) leaked.push(`${group}.${key}`);
  }
}
if (leaked.length > 0) {
  problems.push(`tokens.json contains unresolved DTCG aliases: ${leaked.join(", ")}`);
}

const tests = files.filter((f) => /\.test\.|__tests__/.test(f));
if (tests.length > 0) problems.push(`Test files are in the tarball: ${tests.join(", ")}`);

if (problems.length > 0) {
  for (const p of problems) console.error(`::error::${p}`);
  console.error(`\n${problems.length} problem(s). Not publishable.`);
  process.exit(1);
}

console.log(`Tarball OK — ${files.length} files, ${packed.size} bytes packed.`);

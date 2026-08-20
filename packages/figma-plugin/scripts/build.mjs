/**
 * Two bundles, because a Figma plugin is two programs.
 *
 * `code.js` runs in the sandbox — no DOM, no network, no ES modules, so it is
 * emitted as an IIFE. `ui.html` is a single file with the script and the
 * stylesheet inlined, because the iframe is given a string of HTML rather than
 * a directory and cannot fetch anything beside it.
 *
 * esbuild rather than a bundler config: two entry points with no shared
 * runtime, and the whole build is short enough to read.
 */

import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(here, "dist");

const shared = {
  bundle: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
  logLevel: "warning",
};

await mkdir(out, { recursive: true });

await build({
  ...shared,
  entryPoints: [resolve(here, "src/sandbox/main.ts")],
  outfile: resolve(out, "code.js"),
});

const ui = await build({
  ...shared,
  entryPoints: [resolve(here, "src/ui/main.ts")],
  write: false,
});

const script = ui.outputFiles[0]?.text ?? "";
const css = await readFile(resolve(here, "src/ui/panel.css"), "utf8");
const html = await readFile(resolve(here, "src/ui/index.html"), "utf8");

/*
 * The script goes last, after the markup it queries.
 *
 * `main.ts` reads `#controls` and `#report` at module scope and posts "ready"
 * on the same tick. Placed in the head it would find neither, send the message
 * anyway, and render a report into nothing — a panel that stays blank with no
 * error to explain it.
 */
await writeFile(
  resolve(out, "ui.html"),
  html.replace(
    "</main>",
    "</main>\n<style>\n" + css + "</style>\n<script>\n" + script + "</script>\n",
  ),
  "utf8",
);

console.log("figma-plugin: dist/code.js and dist/ui.html");

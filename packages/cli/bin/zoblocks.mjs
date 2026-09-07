#!/usr/bin/env node

/**
 * zoblocks — the ZoBlocks installer.
 *
 * A thin shell: read the version off package.json, hand argv to run(), exit
 * with what it returns. Everything testable lives in src/.
 *
 * The published package ships `dist`, and that is what this loads. Falling
 * back to `src` keeps the binary runnable straight from a checkout, where
 * there is no build yet — but only there. Loading TypeScript from the
 * published artifact would require every consumer to be on a Node new enough
 * to strip types, which is not a requirement an install tool gets to impose.
 */

import { existsSync, readFileSync } from "node:fs";
import { argv, cwd, env, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const built = path.join(root, "dist", "cli.js");
const entry = existsSync(built) ? built : path.join(root, "src", "cli.ts");

const { run } = await import(pathToFileURL(entry).href);

const code = await run({
  argv: argv.slice(2),
  cwd: cwd(),
  env,
  out: (line) => stdout.write(`${line}\n`),
  err: (line) => stderr.write(`${line}\n`),
  version,
});

exit(code);

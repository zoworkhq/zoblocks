#!/usr/bin/env node

/**
 * zoblocks-mcp — the ZoBlocks catalog for coding agents, over stdio.
 *
 * A thin shell, like the CLI's: read the version, hand argv to runStdio().
 *
 * It loads `dist` only. There is no fallback to `src`, unlike the CLI's
 * binary, because it could not work: the source imports `./manifest.js` (the
 * extension the compiled output needs) and Node's type stripping does not map
 * that to `manifest.ts`. In a checkout, build first — the error says how.
 */

import { existsSync, readFileSync } from "node:fs";
import { argv, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

const built = path.join(root, "dist", "stdio.js");
if (!existsSync(built)) {
  stderr.write("zoblocks-mcp is not built. Run: pnpm --filter @zoblocks/mcp build\n");
  exit(1);
}
const { runStdio } = await import(pathToFileURL(built).href);

const code = await runStdio({
  argv: argv.slice(2),
  version,
  out: (line) => stdout.write(`${line}\n`),
  err: (line) => stderr.write(`${line}\n`),
});

// `undefined` means the server is running: stay alive until the client closes stdin.
if (code !== undefined) exit(code);

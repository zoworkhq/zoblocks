#!/usr/bin/env node

/**
 * oxygen-codemod — run a migration over files you name.
 *
 * Dry by default. A codemod that writes on its first run is a codemod people
 * run once, in anger, on a dirty working tree; `--write` is one flag and it is
 * the difference between a reviewable diff and a bad afternoon.
 *
 * Exits non-zero when any note needs a human, so it composes into CI as a
 * "migration not finished" gate rather than only as a developer convenience.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { argv, exit, stdout } from "node:process";
import { transformAntdCollapse } from "../src/antd-collapse.ts";

const TRANSFORMS = {
  "antd-collapse": transformAntdCollapse,
};

const args = argv.slice(2);
const write = args.includes("--write");
const positional = args.filter((a) => !a.startsWith("--"));
const [name, ...files] = positional;

if (!name || !TRANSFORMS[name] || files.length === 0) {
  stdout.write(
    [
      "Usage: oxygen-codemod <transform> <file...> [--write]",
      "",
      "Transforms:",
      ...Object.keys(TRANSFORMS).map((t) => `  ${t}`),
      "",
      "Without --write nothing is modified; the diff summary and notes are printed.",
      "",
    ].join("\n"),
  );
  exit(name ? 1 : 0);
}

const transform = TRANSFORMS[name];
let changedCount = 0;
let actionCount = 0;

for (const file of files) {
  let source;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    stdout.write(`  skip  ${file} — ${error.message}\n`);
    continue;
  }

  const { code, notes, changed } = transform(source);

  if (changed) {
    changedCount += 1;
    if (write) writeFileSync(file, code, "utf8");
  }

  if (!changed && notes.length === 0) continue;

  stdout.write(`\n${changed ? (write ? "written" : "would change") : "unchanged"}  ${file}\n`);
  for (const note of notes) {
    if (note.severity === "action") actionCount += 1;
    stdout.write(`  ${note.severity === "action" ? "TODO" : "note"}  ${file}:${note.line}  ${note.message}\n`);
  }
}

stdout.write(
  `\n${changedCount} file(s) ${write ? "written" : "would change"}, ${actionCount} thing(s) to do by hand.\n`,
);

// A migration with outstanding manual work is not a finished migration.
exit(actionCount > 0 ? 1 : 0);

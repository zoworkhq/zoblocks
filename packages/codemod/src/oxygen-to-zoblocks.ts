/**
 * Oxygen UI → ZoBlocks.
 *
 * The project was renamed in September 2026. Everything a consumer's tree can
 * hold moved at once: the npm scope, the directory the CLI writes into, the
 * custom-property prefix, the DOM attribute prefix, the class prefix, and the
 * custom element tag names. None of it can be aliased away — a stylesheet can
 * forward a custom property but not a class name, and a package cannot answer
 * to two scopes — so this rewrites the tree instead.
 *
 * ## What it will not do
 *
 * Two things are left to a person, both for the same reason: the transform
 * cannot see enough to be sure, and being wrong is silent.
 *
 *   - **`oxygen.json`.** Renaming the file is one `git mv`, but the CLI still
 *     reads the old name and warns, so nothing breaks while it sits there. The
 *     codemod reports it rather than moving a file the caller did not name.
 *   - **Bare `oxygen` in prose and identifiers.** A variable called
 *     `oxygenTheme` or a comment about "the Oxygen registry" is the consumer's
 *     own writing. Rewriting someone's identifiers on a rename of ours is
 *     beyond what a migration should assume.
 *
 * ## Why `ox-` is matched by its left edge
 *
 * `box-shadow`, `box-sizing` and `checkbox-label` all contain `ox-`. Every
 * rule here anchors on the character before it — a quote, a dot, a space, a
 * bracket, an angle bracket, or the start of the line — which is what keeps a
 * stylesheet from being turned into `bzb-shadow`. That is not hypothetical:
 * the repo this came from carries 711 uses of `box-shadow`.
 */

export type NoteSeverity = "action" | "info";

export interface CodemodNote {
  /** 1-indexed, so it lines up with what an editor shows. */
  line: number;
  severity: NoteSeverity;
  message: string;
}

export interface CodemodResult {
  code: string;
  notes: CodemodNote[];
  /** True when the file was touched at all. */
  changed: boolean;
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/**
 * Ordered rewrites. Longest-first within each family, so a shorter pattern
 * never eats the prefix of a longer one.
 */
const RULES: Array<[RegExp, string]> = [
  // The npm scope. Both the current one and the short form that appeared in
  // early docs and in ESLint rule names.
  [/@oxygenui-design\//g, "@zoblocks/"],
  [/@oxygenui\//g, "@zoblocks/"],
  [/@oxygen-pro\b/g, "@zoblocks-pro"],

  // Where the CLI puts things, and what it calls the files it writes.
  [/(["'`/])components\/oxygen\//g, "$1components/zoblocks/"],
  [/(["'`/])lib\/oxygen-/g, "$1lib/zoblocks-"],
  [/(["'`/])styles\/oxygen-/g, "$1styles/zoblocks-"],

  // Custom properties and the Tailwind theme namespace built on them.
  [/--ox-/g, "--zb-"],
  [/--color-ox-/g, "--color-zb-"],
  [/--spacing-ox-/g, "--spacing-zb-"],
  [/--font-ox-/g, "--font-zb-"],

  // DOM attributes, in markup and in the camelCase form `dataset` exposes.
  [/data-ox-/g, "data-zb-"],
  [/\bdataset\.ox([A-Z])/g, "dataset.zb$1"],

  // Custom element tags, opening and closing.
  [/<(\/?)ox-/g, "<$1zb-"],

  // Class names. The left-edge anchor is what protects `box-shadow`.
  [/\.ox-([a-z0-9])/g, ".zb-$1"],
  [/(["'`( \t])ox-([a-z0-9])/g, "$1zb-$2"],
  [/^ox-([a-z0-9])/gm, "zb-$1"],

  // Animation names, which sit after a colon rather than a quote.
  [/(@keyframes\s+)ox-/g, "$1zb-"],
  [/(animation(?:-name)?:\s*)ox-/g, "$1zb-"],

  // The environment variable and the token prefix the console mints.
  [/\bOXYGEN_TOKEN\b/g, "ZOBLOCKS_TOKEN"],
  [/\boxy_(live|test)_/g, "zb_$1_"],
];

/** Constructs the transform will not touch, with the reason. */
function collectNotes(source: string, notes: CodemodNote[]): void {
  // The config file. Renaming it is a `git mv` the codemod is not being asked
  // to perform, and the CLI reads the old name and warns, so nothing is broken
  // in the meantime.
  for (const match of source.matchAll(/\boxygen\.json\b/g)) {
    notes.push({
      line: lineOf(source, match.index),
      severity: "action",
      message:
        "Rename oxygen.json to zoblocks.json and update this reference. The CLI still reads the old name and warns once, so this is not urgent — but the warning stays until the file moves.",
    });
  }

  // Anything left saying "oxygen" is either the consumer's own naming or a
  // string this transform deliberately avoided. Report it once per line.
  const seen = new Set<number>();
  for (const match of source.matchAll(/oxygen/gi)) {
    const line = lineOf(source, match.index);
    if (seen.has(line)) continue;
    if (/\boxygen\.json\b/i.test(source.split("\n")[line - 1] ?? "")) continue;
    seen.add(line);
    notes.push({
      line,
      severity: "info",
      message:
        'Still says "oxygen". If this is your own identifier or prose, it is yours to keep; if it names something of ours, it was missed and is worth reporting.',
    });
  }
}

export function transformOxygenToZoBlocks(source: string): CodemodResult {
  let code = source;
  for (const [pattern, replacement] of RULES) {
    code = code.replace(pattern, replacement);
  }

  const notes: CodemodNote[] = [];
  collectNotes(code, notes);
  notes.sort((a, b) => a.line - b.line);

  return { code, notes, changed: code !== source };
}

/**
 * antd `Collapse` → ZoBlocks `Accordion`.
 *
 * The two APIs are deliberately the same shape, so most of this is an import
 * rewrite and three v6 renames. What makes the codemod worth shipping is the
 * part it *refuses* to do automatically.
 *
 * `headingLevel` is the case. ZoBlocks wraps every trigger in a real heading, and
 * the correct level depends on the surrounding document outline — which a
 * transform cannot see. Guessing produces a page whose heading list is wrong in
 * a way nothing at runtime reports: the markup is valid, axe is quiet, and the
 * only reader who experiences the bug is the one navigating by heading. So the
 * codemod reports it instead, once per call site.
 *
 * Deliberately no parser dependency. ARCHITECTURE.md §9 makes every new runtime
 * dependency an architectural decision, and a full AST transform would pull in
 * jscodeshift and a Babel toolchain to do work that is textual. The trade is
 * stated rather than hidden: this operates on text, it is conservative, and
 * every construct it cannot analyse becomes a note rather than an edit.
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

/** antd v6 renames that apply to Collapse. */
const RENAMES: Array<[RegExp, string, string]> = [
  [
    /\bexpandIconPosition\b/g,
    "expandIconPlacement",
    "expandIconPosition was renamed to expandIconPlacement in antd v6.",
  ],
  [
    /\bdestroyOnClose\b/g,
    "destroyOnHidden",
    "destroyOnClose was renamed to destroyOnHidden in antd v6.",
  ],
];

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/**
 * Rewrites `import { Collapse, Button } from "antd"`.
 *
 * Collapse is removed from the antd specifier list rather than the whole import
 * being replaced, because a file importing Collapse almost always imports other
 * antd components beside it, and deleting those would break the build in a way
 * that looks like the codemod worked.
 */
function rewriteImports(source: string, notes: CodemodNote[]): string {
  const IMPORT = /import\s*\{([^}]*)\}\s*from\s*(["'])antd\2\s*;?/g;

  return source.replace(IMPORT, (match, specifiers: string, quote: string, offset: number) => {
    const parts = specifiers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const collapse = parts.filter((p) => /^Collapse(\s+as\s+\w+)?$/.test(p));
    if (collapse.length === 0) return match;

    const remaining = parts.filter((p) => !collapse.includes(p));
    const line = lineOf(source, offset);

    const aliased = collapse.find((p) => p.includes(" as "));
    if (aliased) {
      notes.push({
        line,
        severity: "action",
        message: `Collapse is imported as \`${aliased}\`. The import was rewritten, but the local name was left alone — rename it by hand if you want it to read as an Accordion.`,
      });
    }

    const zoblocks = `import { Accordion } from "@zoblocks/react";`;
    if (remaining.length === 0) return zoblocks;

    return `import { ${remaining.join(", ")} } from ${quote}antd${quote};\n${zoblocks}`;
  });
}

/** Flags constructs the transform will not touch, with the reason. */
function collectNotes(source: string, notes: CodemodNote[]): void {
  const PANEL = /<Collapse\.Panel\b/g;
  for (const match of source.matchAll(PANEL)) {
    notes.push({
      line: lineOf(source, match.index),
      severity: "action",
      message:
        "Collapse.Panel has no ZoBlocks equivalent and is deprecated in antd too. Move these panels into the `items` array; the panel's `header` becomes `label` and its children become `children`.",
    });
  }

  const OPENING = /<Accordion\b/g;
  for (const match of source.matchAll(OPENING)) {
    const index = match.index;
    const tail = source.slice(index, index + 4000);
    const end = tail.indexOf(">");
    const attributes = end === -1 ? tail : tail.slice(0, end);

    if (!/\bheadingLevel\b/.test(attributes) && !/\{\s*\.\.\./.test(attributes)) {
      notes.push({
        line: lineOf(source, index),
        severity: "action",
        message:
          "Set headingLevel to match the surrounding outline. ZoBlocks wraps every trigger in a real heading and defaults to 3; nested accordions and pages whose main heading is not an h2 need a different level, and nothing at runtime reports a wrong one.",
      });
    }

    if (/\baccordion\b/.test(attributes)) {
      notes.push({
        line: lineOf(source, index),
        severity: "info",
        message:
          "`accordion` keeps antd's meaning — one section open at a time — but no longer changes the emitted roles. antd switched to role=tablist/tab/tabpanel here; ZoBlocks stays a disclosure widget in every configuration. No code change needed.",
      });
    }
  }
}

export function transformAntdCollapse(source: string): CodemodResult {
  const notes: CodemodNote[] = [];

  if (!/\bCollapse\b/.test(source)) return { code: source, notes, changed: false };

  let code = rewriteImports(source, notes);

  // Element names. `Collapse.Panel` is handled as a note rather than a rewrite,
  // so it is masked here to keep the plain-element replacement from mangling it.
  const PANEL_TOKEN = "\u0000ZB_COLLAPSE_PANEL\u0000";
  code = code.replace(/<Collapse\.Panel\b/g, `<${PANEL_TOKEN}`);
  code = code.replace(/<\/Collapse\.Panel>/g, `</${PANEL_TOKEN}>`);

  code = code.replace(/<Collapse\b/g, "<Accordion").replace(/<\/Collapse>/g, "</Accordion>");

  code = code.split(`<${PANEL_TOKEN}`).join("<Collapse.Panel");
  code = code.split(`</${PANEL_TOKEN}>`).join("</Collapse.Panel>");

  for (const [pattern, replacement, why] of RENAMES) {
    if (pattern.test(code)) {
      pattern.lastIndex = 0;
      for (const match of code.matchAll(pattern)) {
        notes.push({ line: lineOf(code, match.index), severity: "info", message: why });
      }
      pattern.lastIndex = 0;
      code = code.replace(pattern, replacement);
    }
  }

  // antd v6 renamed the middle size; a stale value silently falls back.
  code = code.replace(/\bsize=(["'])middle\1/g, 'size="medium"');

  collectNotes(code, notes);

  notes.sort((a, b) => a.line - b.line || a.severity.localeCompare(b.severity));

  return { code, notes, changed: code !== source };
}

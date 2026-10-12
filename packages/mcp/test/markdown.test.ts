/**
 * One Markdown table cell, whatever the component metadata holds. Checked by
 * splitting the row the way GFM does, so a cell that would break the table
 * fails here rather than in what an agent reads.
 */

import { describe, expect, it } from "vitest";
import { tableCell } from "../src/markdown.js";

/** Splits a table row on unescaped pipes, honouring backslash escapes, as GFM does. */
function cells(row: string): string[] {
  const out: string[] = [];
  let cell = "";
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === "\\" && i + 1 < row.length) {
      cell += char + row[i + 1];
      i++;
    } else if (char === "|") {
      out.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  out.push(cell);
  return out.slice(1, -1).map((c) => c.trim());
}

describe("tableCell", () => {
  it("escapes the pipes in a union type", () => {
    expect(tableCell('"a" | "b"')).toBe('"a" \\| "b"');
  });

  it("escapes a backslash before it escapes pipes", () => {
    expect(tableCell("a\\|b")).toBe("a\\\\\\|b");
    expect(tableCell("ends with \\")).toBe("ends with \\\\");
  });

  it("keeps a row on one line", () => {
    expect(tableCell("one\ntwo\r\nthree")).toBe("one two three");
  });

  it.each(['"a" | "b"', "a\\|b", "trailing \\", "\\\\|", "multi\nline | value"])(
    "keeps %j in one cell of a three-column row",
    (value) => {
      const row = `| x | ${tableCell(value)} | y |`;
      expect(cells(row)).toHaveLength(3);
    },
  );

  it("is what an unescaped backslash would break", () => {
    // What the old escaping (pipes only) made of `a\|b`: `a\\|b`, an escaped
    // backslash and then a bare pipe — the row gains a column. Written out
    // rather than recomputed, so the broken escaper is not in the codebase.
    const pipesOnly = "a\\\\|b";
    expect(pipesOnly).toBe(String.raw`a\\|b`);
    expect(cells(`| x | ${pipesOnly} | y |`)).toHaveLength(4);
  });
});

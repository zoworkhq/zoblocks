/**
 * The catalog card's signature is really the engine's output.
 *
 * `apps/docs/src/components/site/signature-mark.tsx` claims, in its own doc
 * comment, that its path data is what `toInkPaths()` produces from the stroke
 * model beside it. That claim is the only reason the card is allowed to exist —
 * the catalog's rule is that a card shows the real component, and Signature
 * cannot be imported into the docs site because it wraps Ant Design.
 *
 * A claim in a comment decays. This re-runs the engine and compares, so if the
 * smoothing, the decimation epsilon, or the width curve is ever tuned, the
 * marketing site stops quietly showing a signature the component would no
 * longer draw.
 *
 * The test lives here rather than in the docs app because this is where the
 * engine is, and the docs app has no test runner. It reads the file as text
 * rather than importing it — the file is TSX, and this package's suite runs in
 * `node` with no JSX transform, which is a constraint worth keeping.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toInkPaths } from "../src/export.js";
import type { Stroke } from "../src/value.js";

const MARK = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/docs/src/components/site/signature-mark.tsx",
);

/** Pull an exported array literal out of the TSX source. */
function extractArray(source: string, name: string): string {
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) throw new Error(`${name} is not exported from signature-mark.tsx`);
  const open = source.indexOf("[", start);
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (char === "[") depth++;
    else if (char === "]") {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  throw new Error(`unbalanced brackets in ${name}`);
}

/** `[x, y, t]` triples → the Stroke[] the engine takes. */
function parseStrokes(literal: string): Stroke[] {
  const withoutComments = literal.replace(/\/\/.*$/gm, "");
  const groups = withoutComments.match(/\[\s*\[[\s\S]*?\]\s*,?\s*\]/g) ?? [];

  return groups.map((group) => ({
    pointerType: "pen" as const,
    points: [...group.matchAll(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g)].map(
      (match) => ({
        x: Number(match[1]),
        y: Number(match[2]),
        t: Number(match[3]),
        pressure: 0.5,
      }),
    ),
  }));
}

/** `{ d: "…", width: n }` objects → the shape toInkPaths returns. */
function parsePaths(literal: string): Array<{ d: string; width: number }> {
  return [...literal.matchAll(/\{\s*d:\s*"([^"]+)",\s*width:\s*([\d.]+)\s*\}/g)].map((match) => ({
    d: match[1] ?? "",
    width: Number(match[2]),
  }));
}

describe("the docs catalog mark", () => {
  const source = readFileSync(MARK, "utf8");
  const strokes = parseStrokes(extractArray(source, "SIGNATURE_STROKES"));
  const committed = parsePaths(extractArray(source, "SIGNATURE_PATHS"));

  it("parses the committed data at all", () => {
    // Guards the test itself: a silent parse failure would make every
    // assertion below vacuously pass.
    expect(strokes.length).toBe(2);
    expect(strokes[0]?.points.length).toBeGreaterThan(20);
    expect(committed.length).toBeGreaterThan(20);
  });

  it("still matches what the engine produces", () => {
    const fresh = toInkPaths(strokes);

    if (JSON.stringify(fresh) !== JSON.stringify(committed)) {
      // Printed rather than merely diffed: whoever changed the engine should be
      // able to paste the answer in rather than work out how to regenerate it.
      const regenerated = fresh.map((p) => `  { d: "${p.d}", width: ${p.width} },`).join("\n");
      throw new Error(
        "signature-mark.tsx has drifted from the engine.\n\n" +
          "Replace SIGNATURE_PATHS in apps/docs/src/components/site/signature-mark.tsx with:\n\n" +
          regenerated +
          "\n",
      );
    }

    expect(fresh).toEqual(committed);
  });

  it("carries no colour, so the card re-themes", () => {
    // The same rule the component follows. A literal here would make the mark
    // invisible in dark mode on the marketing site.
    expect(source).toContain('stroke="currentColor"');
    expect(source).not.toMatch(/stroke="#[0-9a-f]{3,6}"/i);
  });

  it("is decorative — the card's link already names it", () => {
    expect(source).toContain('aria-hidden="true"');
  });
});

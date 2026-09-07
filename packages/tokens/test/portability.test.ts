/**
 * The claim that makes this package worth extracting, asserted rather than
 * stated in a comment.
 *
 * `@zoblocks/tokens/validate` has to run in three places: the build,
 * a server action, and a browser. A single `import { readFile } from
 * "node:fs/promises"` anywhere in the graph breaks the third one — and it
 * breaks it at the customer's bundler, not here, unless something checks.
 *
 * Reading the source rather than importing it is deliberate: a bundler-shaped
 * test would prove only that *this* bundler coped.
 */

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "validate");

function sources(): { file: string; text: string }[] {
  return readdirSync(SRC)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ file: f, text: readFileSync(path.join(SRC, f), "utf8") }));
}

/** Import specifiers only — comments mentioning `node:` are fine and expected. */
function specifiers(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/^\s*(?:import|export)\b[^;]*?from\s+["']([^"']+)["']/gm)) {
    if (m[1]) out.push(m[1]);
  }
  for (const m of text.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

describe("the validator is portable", () => {
  it("has files to check", () => {
    expect(sources().length).toBeGreaterThan(4);
  });

  it("imports no Node built-in, anywhere in the graph", () => {
    const offenders = sources().flatMap(({ file, text }) =>
      specifiers(text)
        .filter((s) => s.startsWith("node:") || /^(fs|path|url|os|crypto|child_process)$/.test(s))
        .map((s) => `${file} imports ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it("imports nothing outside itself", () => {
    // A relative import that climbs out of `validate/` would reach the rest of
    // the package, which is CSS and generated constants — not browser-hostile
    // today, but the boundary is the thing being protected.
    const offenders = sources().flatMap(({ file, text }) =>
      specifiers(text)
        .filter((s) => s.startsWith("../"))
        .map((s) => `${file} imports ${s}`),
    );
    expect(offenders).toEqual([]);
  });

  it("touches no global that only exists in Node", () => {
    const offenders = sources().flatMap(({ file, text }) =>
      [...text.matchAll(/\b(process|__dirname|__filename|Buffer|globalThis\.process)\b/g)]
        .filter((m) => {
          // Ignore matches inside a comment line.
          const lineStart = text.lastIndexOf("\n", m.index) + 1;
          const line = text.slice(lineStart, text.indexOf("\n", m.index));
          return !/^\s*(\*|\/\/)/.test(line);
        })
        .map((m) => `${file} references ${m[1]}`),
    );
    expect(offenders).toEqual([]);
  });

  it("touches no DOM global either — it must run on a server too", () => {
    const offenders = sources().flatMap(({ file, text }) =>
      [...text.matchAll(/\b(window|document|localStorage|navigator)\b/g)]
        .filter((m) => {
          const lineStart = text.lastIndexOf("\n", m.index) + 1;
          const line = text.slice(lineStart, text.indexOf("\n", m.index));
          return !/^\s*(\*|\/\/)/.test(line);
        })
        .map((m) => `${file} references ${m[1]}`),
    );
    expect(offenders).toEqual([]);
  });
});

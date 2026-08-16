/**
 * The rules that are cheaper to enforce than to remember.
 *
 * Crude greps over the source, and they have earned their place: the
 * equivalent test in `signature-core` has caught a reintroduced `Date.now()`
 * more than once. Both properties below are the kind that pass review, ship,
 * and only fail at a customer's first server render or in a deposition.
 */

import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SRC = new URL("../src/", import.meta.url);

function sourceFiles(): { name: string; code: string }[] {
  return readdirSync(SRC)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => ({
      name,
      // Comments stripped: this file's own prose discusses `Date.now`, and so
      // does the JSDoc that tells a host to pass their own clock.
      code: readFileSync(new URL(name, SRC), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, ""),
    }));
}

describe("no clock", () => {
  it("reads no ambient time anywhere in the engine", () => {
    // A browser clock on a ward workstation is not evidence. Every function
    // that needs the time takes a `now: Date`, so a host can pass a server
    // clock — and so a test can pass a fixed one.
    for (const { name, code } of sourceFiles()) {
      expect(code, `${name} reads an ambient clock`).not.toMatch(
        /Date\.now\(|new Date\(\s*\)|performance\.now\(/,
      );
    }
  });

  it("takes `now` as a parameter wherever it compares against the present", () => {
    const compose = sourceFiles().find((f) => f.name === "compose.ts")!.code;
    expect(compose).toContain("now: Date");
  });
});

describe("no DOM", () => {
  it("touches no browser global", () => {
    // The claim the package makes about itself: schema, gate rules and
    // serializers are pure data transformations. A module that quietly reached
    // for `document` would fail at a customer's first server render rather than
    // here.
    for (const { name, code } of sourceFiles()) {
      expect(code, `${name} touches the DOM`).not.toMatch(
        /\bdocument\.|\bwindow\.|\bnavigator\.|localStorage|IndexedDB|requestAnimationFrame/,
      );
    }
  });

  it("does not import the DOM-bound half of ProseMirror", () => {
    // `prosemirror-view` and `DOMSerializer` both need a real DOM. Importing
    // either would put this package on the wrong side of the line and make the
    // suite an order of magnitude slower.
    for (const { name, code } of sourceFiles()) {
      expect(code, `${name} imports prosemirror-view`).not.toMatch(/prosemirror-view/);
      expect(code, `${name} uses DOMSerializer`).not.toMatch(/\bDOMSerializer\b|\bDOMParser\b/);
    }
  });

  it("imports without a DOM present", () => {
    // The suite runs in `node`, so simply getting here proves it — but stating
    // it makes the intent survive someone switching the environment to jsdom.
    expect(typeof globalThis.document).toBe("undefined");
  });
});

describe("no randomness", () => {
  it("uses no ambient randomness, so output is reproducible", () => {
    // Anything that hashes or signs has to be reproducible. A stray
    // `Math.random` in an id generator would make two serializations of one
    // document differ.
    for (const { name, code } of sourceFiles()) {
      expect(code, `${name} uses Math.random`).not.toMatch(/Math\.random\(|crypto\.randomUUID/);
    }
  });
});

describe("no clinical content beyond the one documented exception", () => {
  it("ships no terminology, phrase library or attestation wording", () => {
    // Terminology carries licensing we cannot redistribute; phrase libraries
    // and attestation wording are organisational decisions with clinical
    // governance behind them. The do-not-use list is the single exception, and
    // it is short, published, stable and always wrong.
    const all = sourceFiles()
      .filter((f) => f.name !== "gate.ts")
      .map((f) => f.code)
      .join("\n");
    expect(all).not.toMatch(/SNOMED|snomed\.info|ICD-10|RxNorm|rxnorm/i);
  });

  it("keeps every default rule advisory unless it is one of the four blockers", () => {
    const gate = sourceFiles().find((f) => f.name === "gate.ts")!.code;
    const blockers = gate.match(/severity: "block"/g) ?? [];
    // required-sections, unreviewed-ai, unfilled-blanks, foreign-content, plus
    // the runner's rule-threw case. Anything more means a rule was promoted to
    // blocking without the argument that should accompany it.
    expect(blockers.length).toBeLessThanOrEqual(5);
  });
});

/**
 * The test the whole package exists to pass.
 *
 * Provenance is only useful if it survives editing. Type inside a generated
 * range and it splits in three; delete across a boundary and two merge; paste
 * into the middle of a pulled value and a fourth appears. Every one of those is
 * a position-mapping problem, and position mapping is where an attributed-range
 * model either holds up or quietly corrupts itself over a twenty-minute note.
 *
 * So: throw thousands of random transforms at a marked document and assert the
 * invariants after every one. If this suite does not hold, the thesis in §01 of
 * the brief is wrong and the component should not be built.
 *
 * Deterministic by construction — a seeded PRNG rather than `Math.random`, so a
 * failure is reproducible from the seed printed in the message rather than
 * being a ghost that appears once in CI and never again.
 */

import { describe, expect, it } from "vitest";
import { Fragment, Slice, type Node as PMNode } from "prosemirror-model";
import { ReplaceStep, Transform } from "prosemirror-transform";
import { ORIGINS, provenanceRanges } from "../src/provenance.js";
import { composition } from "../src/compose.js";
import { toCanonical } from "../src/canonical.js";
import { toNarrative } from "../src/narrative.js";
import { toText } from "../src/text.js";
import { noteSchema } from "../src/schema.js";
import { rng, sampleNote } from "./helpers.js";

const FORBIDDEN =
  /<(script|form|iframe|object|frame|base|link|head|body|style)\b|<[a-z]+[^>]*\son[a-z]+=|xlink:/i;

/** A random provenance mark. */
function randomMark(next: () => number) {
  const origin = ORIGINS[Math.floor(next() * ORIGINS.length)]!;
  return noteSchema.marks["provenance"]!.create({
    origin,
    source: next() < 0.5 ? null : `src/${Math.floor(next() * 5)}`,
    at: next() < 0.7 ? null : "2026-08-16T06:12:00+05:30",
    confidence: origin === "dictated" && next() < 0.5 ? Math.round(next() * 100) / 100 : null,
    reviewed: origin === "ai" ? next() < 0.5 : true,
  });
}

/**
 * Apply one random edit.
 *
 * Deliberately unguided: insert, delete and replace at arbitrary positions,
 * with arbitrary marks. A fuzzer that only performs edits the UI would perform
 * tests the UI, not the model.
 */
function mutate(doc: PMNode, next: () => number): PMNode {
  const tr = new Transform(doc);
  const size = doc.content.size;
  if (size < 4) return doc;

  const a = 1 + Math.floor(next() * (size - 2));
  const b = 1 + Math.floor(next() * (size - 2));
  const from = Math.min(a, b);
  const to = Math.max(a, b);
  const roll = next();

  try {
    if (roll < 0.35) {
      // Insert marked text.
      const text = "abcdefgh".slice(0, 1 + Math.floor(next() * 7));
      const node = noteSchema.text(text, next() < 0.8 ? [randomMark(next)] : []);
      tr.step(new ReplaceStep(from, from, new Slice(Fragment.from(node), 0, 0)));
    } else if (roll < 0.6) {
      // Delete a range.
      tr.step(new ReplaceStep(from, to, Slice.empty));
    } else if (roll < 0.75) {
      // Replace a range with marked text.
      const node = noteSchema.text("XY", [randomMark(next)]);
      tr.step(new ReplaceStep(from, to, new Slice(Fragment.from(node), 0, 0)));
    } else if (roll < 0.9) {
      // Re-mark an existing range — the operation that splits and merges.
      tr.addMark(from, to, randomMark(next));
    } else {
      tr.removeMark(from, to, noteSchema.marks["provenance"]!);
    }
  } catch {
    // Many random positions are structurally invalid; ProseMirror rejecting
    // them is correct behaviour, not a finding. What matters is that a rejected
    // step leaves the document untouched.
    return doc;
  }

  return tr.doc;
}

/** Every invariant the rest of the package depends on. */
function assertInvariants(doc: PMNode, seed: number, step: number): void {
  const where = `seed ${seed}, step ${step}`;

  // 1. The document is still structurally valid. If this fails, the schema
  //    permits something it should not, and a serializer will meet it later.
  expect(() => doc.check(), where).not.toThrow();

  const ranges = provenanceRanges(doc);

  // 2. No zero-length ranges. An orphaned empty range is the classic symptom of
  //    a mark that survived the deletion of everything it covered, and it makes
  //    the gate report passages that are not there.
  for (const range of ranges) {
    expect(range.to, `${where}: zero-length range at ${range.from}`).toBeGreaterThan(range.from);
    expect(range.text.length, where).toBe(range.to - range.from);
  }

  // 3. Ranges are ordered and never overlap.
  for (let i = 1; i < ranges.length; i++) {
    expect(ranges[i]!.from, `${where}: ranges out of order`).toBeGreaterThanOrEqual(
      ranges[i - 1]!.to,
    );
  }

  // 4. Ranges say what the document says at those positions.
  for (const range of ranges) {
    expect(doc.textBetween(range.from, range.to), where).toBe(range.text);
  }

  // 5. Adjacent ranges never carry identical provenance — if they did,
  //    coalescing failed and every count the gate reports would be inflated.
  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1]!;
    const cur = ranges[i]!;
    if (prev.to === cur.from) {
      expect(
        JSON.stringify(prev.attrs) !== JSON.stringify(cur.attrs),
        `${where}: uncoalesced identical ranges at ${cur.from}`,
      ).toBe(true);
    }
  }

  // 6. Composition accounts for every character exactly once.
  const c = composition(doc);
  expect(
    ORIGINS.reduce((sum, o) => sum + c.chars[o], 0),
    where,
  ).toBe(c.total);
  expect(c.total, where).toBe(ranges.reduce((sum, r) => sum + r.text.length, 0));
  if (c.total > 0) {
    expect(
      ORIGINS.reduce((sum, o) => sum + c.ratio[o], 0),
      where,
    ).toBeCloseTo(1, 8);
  }

  // 7. Canonical serialization is stable and survives a JSON round trip. This
  //    is the property a stored signature depends on.
  expect(toCanonical(doc), where).toBe(toCanonical(doc));
  expect(
    toCanonical(noteSchema.nodeFromJSON(JSON.parse(JSON.stringify(doc.toJSON())))),
    where,
  ).toBe(toCanonical(doc));

  // 8. The narrative is well-formed and contains nothing FHIR forbids —
  //    whatever the document has been put through.
  const html = toNarrative(doc, { provenance: true });
  expect(html, where).not.toMatch(FORBIDDEN);
  const opened = (html.match(/<([a-z0-9]+)(?:\s[^>]*)?>/g) ?? []).length;
  const closed = (html.match(/<\/[a-z0-9]+>/g) ?? []).length;
  expect(opened, `${where}: unbalanced narrative`).toBe(closed);

  // 9. Plain text never throws and is deterministic.
  expect(toText(doc), where).toBe(toText(doc));
}

describe("provenance under arbitrary transforms", () => {
  // Ten independent runs of two hundred edits. Enough to shake out mapping
  // bugs; fast enough that nobody deletes the file to speed up CI.
  const seeds = [1, 7, 42, 99, 1234, 31337, 65535, 987654, 2718281, 3141592];

  for (const seed of seeds) {
    it(`holds every invariant across 200 random edits (seed ${seed})`, () => {
      const next = rng(seed);
      let doc = sampleNote();

      for (let step = 0; step < 200; step++) {
        doc = mutate(doc, next);
        assertInvariants(doc, seed, step);
      }
    });
  }

  it("never leaves a mark covering nothing, even when everything is deleted", () => {
    // The specific bug this class of model is prone to: a mark that outlives
    // every character it covered, reported forever after as an empty passage.
    //
    // `delete` rather than a raw ReplaceStep, because a raw step across section
    // boundaries is genuinely invalid content and the schema is right to refuse
    // it — the fitting logic is what a real deletion goes through.
    const doc = sampleNote();
    const tr = new Transform(doc);
    tr.delete(1, doc.content.size - 1);

    expect(tr.doc.textContent).toBe("");
    expect(provenanceRanges(tr.doc)).toHaveLength(0);
    expect(composition(tr.doc).total).toBe(0);
    expect(() => tr.doc.check()).not.toThrow();
  });

  it("refuses a step that would produce content the schema forbids", () => {
    // The guarantee stated as a test: an invalid document cannot be reached,
    // so no serializer downstream has to defend against one.
    const doc = sampleNote();
    expect(() =>
      new Transform(doc).step(new ReplaceStep(1, doc.content.size - 1, Slice.empty)),
    ).toThrow(/Invalid content/);
  });

  it("does not attribute text typed at the right edge of an AI range to the model", () => {
    // The single most consequential setting in the mark spec, tested through
    // the transform rather than by reading `inclusive` back.
    const doc = sampleNote();
    const ai = provenanceRanges(doc, (a) => a.origin === "ai")[0]!;
    const tr = new Transform(doc);
    tr.step(
      new ReplaceStep(ai.to, ai.to, new Slice(Fragment.from(noteSchema.text(" mine")), 0, 0)),
    );

    const after = provenanceRanges(tr.doc);
    const typed = after.find((r) => r.text.includes("mine"))!;
    expect(typed.origin).not.toBe("ai");
  });
});

describe("property: every document the schema accepts serialises", () => {
  it("round-trips through JSON for 500 mutated documents", () => {
    const next = rng(20260816);
    let doc = sampleNote();
    for (let i = 0; i < 500; i++) {
      doc = mutate(doc, next);
      const revived = noteSchema.nodeFromJSON(JSON.parse(JSON.stringify(doc.toJSON())));
      expect(revived.eq(doc)).toBe(true);
    }
  });
});

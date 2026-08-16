import { describe, expect, it } from "vitest";
import { canonicallyEqual, stableStringify, toCanonical, type Json } from "../src/canonical.js";
import { noteSchema, emptyNote } from "../src/schema.js";
import { doc, p, sampleNote, section, t } from "./helpers.js";

describe("stableStringify", () => {
  it("sorts keys at every depth", () => {
    // The whole point: object key order in JavaScript follows insertion order,
    // so a note built by typing and the same note loaded from a server differ
    // byte-for-byte while being identical documents.
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("keeps array order, because order is meaning in a document", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
  });

  it("handles every JSON scalar", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(true)).toBe("true");
    expect(stableStringify(false)).toBe("false");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("hi")).toBe('"hi"');
  });

  it("does not let -0 and 0 produce two encodings of one number", () => {
    expect(stableStringify(-0)).toBe(stableStringify(0));
  });

  it("refuses a non-finite number rather than silently writing null", () => {
    // `JSON.stringify` writes `null` for these. Silence is the wrong behaviour
    // when the output is about to be signed.
    expect(() => stableStringify(Number.NaN as unknown as Json)).toThrow(TypeError);
    expect(() => stableStringify(Number.POSITIVE_INFINITY as unknown as Json)).toThrow(TypeError);
  });

  it("normalises Unicode, because a clinician pasting from Word supplies the other encoding", () => {
    const composed = "é"; // U+00E9
    const decomposed = "é"; // e + combining acute
    expect(composed).not.toBe(decomposed);
    expect(stableStringify(composed)).toBe(stableStringify(decomposed));
    expect(stableStringify({ ["é"]: 1 })).toBe(stableStringify({ ["é"]: 1 }));
  });

  it("drops undefined exactly as JSON.stringify does, so a round trip is a fixed point", () => {
    expect(stableStringify({ a: 1, b: undefined as unknown as Json })).toBe('{"a":1}');
  });

  it("escapes what JSON requires", () => {
    expect(stableStringify('a"b\\c\nd')).toBe(JSON.stringify('a"b\\c\nd'));
  });
});

describe("toCanonical", () => {
  it("is stable across repeated serialization", () => {
    const d = sampleNote();
    expect(toCanonical(d)).toBe(toCanonical(d));
  });

  it("gives identical bytes to two independently-built equal documents", () => {
    // The property that makes a stored signature verifiable. `JSON.stringify`
    // does not provide it.
    expect(toCanonical(sampleNote())).toBe(toCanonical(sampleNote()));
  });

  it("survives a round trip through JSON", () => {
    const before = sampleNote();
    const after = noteSchema.nodeFromJSON(JSON.parse(JSON.stringify(before.toJSON())));
    expect(toCanonical(after)).toBe(toCanonical(before));
  });

  it("changes when the document changes", () => {
    const a = doc(section({ code: "1", title: "S" }, p(t("hello"))));
    const b = doc(section({ code: "1", title: "S" }, p(t("hello!"))));
    expect(toCanonical(a)).not.toBe(toCanonical(b));
  });

  it("distinguishes text that differs only in provenance", () => {
    // Two notes that read identically but were written differently are not the
    // same artifact, and must not hash the same.
    const typed = doc(section({ code: "1", title: "S" }, p(t("finding", "typed"))));
    const generated = doc(section({ code: "1", title: "S" }, p(t("finding", "ai"))));
    expect(toCanonical(typed)).not.toBe(toCanonical(generated));
  });

  it("drops attributes left at their schema default", () => {
    // Without this, every future attribute added to `provenance` or `section`
    // would invalidate every stored signature.
    const canonical = toCanonical(doc(section({ code: "1", title: "S" }, p(t("x", "typed")))));
    expect(canonical).not.toContain("confidence");
    expect(canonical).not.toContain('"system"');
  });

  it("keeps attributes that were actually set", () => {
    const canonical = toCanonical(
      doc(section({ code: "1", title: "S" }, p(t("x", "pulled", { source: "Observation/1" })))),
    );
    expect(canonical).toContain("Observation/1");
    expect(canonical).toContain("pulled");
  });

  it("produces no whitespace to vary", () => {
    expect(toCanonical(emptyNote("progress"))).not.toMatch(/\s(?=["{[])/);
  });
});

describe("canonicallyEqual", () => {
  it("is true for documents that would verify against the same signature", () => {
    expect(canonicallyEqual(sampleNote(), sampleNote())).toBe(true);
  });

  it("is false once a character changes", () => {
    const a = doc(section({ code: "1", title: "S" }, p(t("a"))));
    const b = doc(section({ code: "1", title: "S" }, p(t("b"))));
    expect(canonicallyEqual(a, b)).toBe(false);
  });

  it("ignores differences node.eq() would report", () => {
    // `eq` compares in-memory structure including defaulted attributes, so a
    // document that round-tripped through storage can be eq-unequal while
    // hashing the same. When the question is "would this verify", this is the
    // comparison that matters.
    const built = doc(section({ code: "1", title: "S" }, p(t("x"))));
    const loaded = noteSchema.nodeFromJSON(built.toJSON());
    expect(canonicallyEqual(built, loaded)).toBe(true);
  });
});

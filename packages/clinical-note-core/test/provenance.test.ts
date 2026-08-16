import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROVENANCE,
  ORIGINS,
  ageMs,
  isOrigin,
  originOf,
  provenance,
  provenanceMarkSpec,
  provenanceRanges,
  readProvenance,
  sameProvenance,
} from "../src/provenance.js";
import { noteSchema } from "../src/schema.js";
import { doc, p, section, t } from "./helpers.js";

/** A stand-in for a DOM element, since this package is tested without a DOM. */
function el(attrs: Record<string, string | null>) {
  return { getAttribute: (name: string) => attrs[name] ?? null };
}

const getAttrs = provenanceMarkSpec.parseDOM![0]!.getAttrs!;

describe("origins", () => {
  it("names six, in a stable order", () => {
    expect(ORIGINS).toEqual(["typed", "dictated", "template", "pulled", "copied", "ai"]);
  });

  it("guards against values arriving from a host", () => {
    expect(isOrigin("ai")).toBe(true);
    expect(isOrigin("hallucinated")).toBe(false);
    expect(isOrigin(7)).toBe(false);
    expect(isOrigin(null)).toBe(false);
    expect(isOrigin(undefined)).toBe(false);
  });
});

describe("provenance()", () => {
  it("normalises a partial record so equal marks compare equal", () => {
    // Load-bearing: ProseMirror decides whether two adjacent marks are the same
    // mark by comparing attributes. Two spellings of one record would leave
    // ranges permanently fragmented.
    expect(provenance({ origin: "ai" })).toEqual(provenance({ origin: "ai", source: null }));
  });

  it("treats everything that is not AI as reviewed", () => {
    // Text nobody generated cannot be unreviewed. Without this the gate would
    // have to special-case the origin at every call site.
    for (const origin of ORIGINS) {
      expect(provenance({ origin }).reviewed).toBe(origin !== "ai");
    }
  });

  it("keeps an explicit review decision on AI text", () => {
    expect(provenance({ origin: "ai", reviewed: true }).reviewed).toBe(true);
    expect(provenance({ origin: "ai", reviewed: false }).reviewed).toBe(false);
  });

  it("defaults to typed", () => {
    expect(DEFAULT_PROVENANCE.origin).toBe("typed");
  });
});

describe("the mark spec", () => {
  it("is not inclusive, so typing beside AI text is not attributed to the model", () => {
    // The single most consequential setting in the file. With ProseMirror's
    // default, typing at the right edge of a generated range extends the AI
    // mark over the clinician's own words.
    expect(provenanceMarkSpec.inclusive).toBe(false);
  });

  it("parses a provenance span", () => {
    expect(
      getAttrs(
        el({
          "data-ox-origin": "pulled",
          "data-ox-source": "Observation/1",
          "data-ox-at": "2026-08-16T06:12:00+05:30",
          "data-ox-confidence": "0.5",
        }),
      ),
    ).toEqual({
      origin: "pulled",
      source: "Observation/1",
      at: "2026-08-16T06:12:00+05:30",
      confidence: 0.5,
      reviewed: true,
    });
  });

  it("reads the review flag on AI spans", () => {
    expect(getAttrs(el({ "data-ox-origin": "ai", "data-ox-reviewed": "true" }))).toMatchObject({
      origin: "ai",
      reviewed: true,
    });
    expect(getAttrs(el({ "data-ox-origin": "ai" }))).toMatchObject({ reviewed: false });
  });

  it("rejects a span whose origin is not one of the six", () => {
    expect(getAttrs(el({ "data-ox-origin": "vibes" }))).toBe(false);
    expect(getAttrs(el({}))).toBe(false);
  });

  it("discards an unparseable confidence rather than storing NaN", () => {
    expect(getAttrs(el({ "data-ox-origin": "dictated", "data-ox-confidence": "wat" }))).toMatchObject({
      confidence: null,
    });
  });

  it("serialises only the attributes that are set", () => {
    const bare = provenanceMarkSpec.toDOM!(
      noteSchema.marks["provenance"]!.create(provenance({ origin: "typed" }) as never),
      false,
    ) as [string, Record<string, string>, number];
    expect(bare[1]).toEqual({ "data-ox-origin": "typed" });

    const full = provenanceMarkSpec.toDOM!(
      noteSchema.marks["provenance"]!.create(
        provenance({
          origin: "dictated",
          source: "deepgram",
          at: "2026-08-16T06:12:00+05:30",
          confidence: 0.62,
        }) as never,
      ),
      false,
    ) as [string, Record<string, string>, number];
    expect(full[1]).toEqual({
      "data-ox-origin": "dictated",
      "data-ox-source": "deepgram",
      "data-ox-at": "2026-08-16T06:12:00+05:30",
      "data-ox-confidence": "0.62",
    });
  });

  it("emits the review flag only for AI, where it is the thing that blocks signing", () => {
    const ai = provenanceMarkSpec.toDOM!(
      noteSchema.marks["provenance"]!.create(provenance({ origin: "ai" }) as never),
      false,
    ) as [string, Record<string, string>, number];
    expect(ai[1]["data-ox-reviewed"]).toBe("false");
  });
});

describe("reading provenance back", () => {
  it("returns null for unmarked text but reports it as typed", () => {
    const node = noteSchema.text("plain");
    expect(readProvenance(node)).toBeNull();
    // A host that adopts the schema before wiring provenance gets a note that
    // still signs, rather than one where every range reads as unattributed.
    expect(originOf(node)).toBe("typed");
  });

  it("reads the mark when present", () => {
    const node = t("x", "copied", { source: "Note/9" });
    expect(readProvenance(node)?.source).toBe("Note/9");
    expect(originOf(node)).toBe("copied");
  });
});

describe("provenanceRanges", () => {
  it("coalesces adjacent runs that say the same thing", () => {
    // Three text nodes, one logical range. Reporting "3 unreviewed passages"
    // when there is one is how a gate loses its credibility.
    const d = doc(section({ code: "1", title: "S" }, p(t("a", "ai"), t("b", "ai"), t("c", "ai"))));
    const ranges = provenanceRanges(d);
    expect(ranges).toHaveLength(1);
    expect(ranges[0]!.text).toBe("abc");
  });

  it("does not coalesce runs that differ in any attribute", () => {
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(t("a", "copied", { source: "Note/1" }), t("b", "copied", { source: "Note/2" })),
      ),
    );
    expect(provenanceRanges(d)).toHaveLength(2);
  });

  it("does not coalesce across a paragraph boundary", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("a", "ai")), p(t("b", "ai"))));
    expect(provenanceRanges(d)).toHaveLength(2);
  });

  it("reports positions that match the document", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("hello", "typed"))));
    const range = provenanceRanges(d)[0]!;
    expect(d.textBetween(range.from, range.to)).toBe("hello");
  });

  it("filters", () => {
    const ranges = provenanceRanges(
      doc(section({ code: "1", title: "S" }, p(t("a", "ai"), t("b", "typed")))),
      (a) => a.origin === "ai",
    );
    expect(ranges.map((r) => r.text)).toEqual(["a"]);
  });

  it("treats unmarked text as a typed range", () => {
    const d = doc(section({ code: "1", title: "S" }, p(noteSchema.text("bare"))));
    expect(provenanceRanges(d)[0]!.origin).toBe("typed");
  });
});

describe("sameProvenance", () => {
  it("compares every field", () => {
    const base = provenance({ origin: "pulled", source: "a", at: "b", confidence: 0.5 });
    expect(sameProvenance(base, { ...base })).toBe(true);
    expect(sameProvenance(base, { ...base, source: "z" })).toBe(false);
    expect(sameProvenance(base, { ...base, at: "z" })).toBe(false);
    expect(sameProvenance(base, { ...base, confidence: 0.6 })).toBe(false);
    expect(sameProvenance(base, { ...base, origin: "copied" })).toBe(false);
    expect(sameProvenance(base, { ...base, reviewed: false })).toBe(false);
  });
});

describe("ageMs", () => {
  const now = new Date("2026-08-16T14:38:00+05:30");

  it("measures from the instant the content was true", () => {
    const attrs = provenance({ origin: "pulled", at: "2026-08-16T06:12:00+05:30" });
    expect(ageMs(attrs, now)).toBe(8 * 3600_000 + 26 * 60_000);
  });

  it("returns null when there is nothing to measure", () => {
    expect(ageMs(provenance({ origin: "typed" }), now)).toBeNull();
    expect(ageMs(provenance({ origin: "pulled", at: "not a date" }), now)).toBeNull();
  });
});

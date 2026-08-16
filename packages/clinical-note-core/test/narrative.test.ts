import { describe, expect, it } from "vitest";
import { XHTML_NS, escapeXml, sectionNarrative, toNarrative } from "../src/narrative.js";
import { emptyNote, noteSchema, sections } from "../src/schema.js";
import { provenance } from "../src/provenance.js";

/** Text carrying provenance, strong and em at once, added in a jumbled order. */
function noteSchemaText() {
  return noteSchema.text("x", [
    noteSchema.marks["em"]!.create(),
    noteSchema.marks["strong"]!.create(),
    noteSchema.marks["provenance"]!.create(provenance({ origin: "ai" }) as never),
  ]);
}
import { b, blank, doc, i, li, ol, p, sampleNote, section, t, ul } from "./helpers.js";

/**
 * The elements FHIR forbids in a narrative: no head, body, external stylesheet
 * references, deprecated elements, scripts, forms, base, link, xlink, frames,
 * iframes, objects, or event attributes.
 */
const FORBIDDEN =
  /<(script|form|iframe|object|frame|base|link|head|body|style)\b|<[a-z]+[^>]*\son[a-z]+=|xlink:/i;

describe("escapeXml", () => {
  it("escapes ampersand first, so escapes are not double-escaped", () => {
    expect(escapeXml("a & b")).toBe("a &amp; b");
    expect(escapeXml("<b>")).toBe("&lt;b&gt;");
    expect(escapeXml(`"'`)).toBe("&quot;&apos;");
    expect(escapeXml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves ordinary clinical prose alone", () => {
    expect(escapeXml("Hemoglobin 7.1 g/dL — down from 11.8")).toBe(
      "Hemoglobin 7.1 g/dL — down from 11.8",
    );
  });
});

describe("sectionNarrative", () => {
  it("declares the XHTML namespace on the div FHIR actually stores", () => {
    // Not on some ancestor that will not survive a round trip through a server.
    const html = sectionNarrative(section({ code: "1", title: "S" }, p(t("x"))));
    expect(html.startsWith(`<div xmlns="${XHTML_NS}">`)).toBe(true);
    expect(html.endsWith("</div>")).toBe(true);
  });

  it("emits the two formatting marks as semantic elements", () => {
    const html = sectionNarrative(section({ code: "1", title: "S" }, p(b("bold"), i("italic"))));
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("emits lists", () => {
    const bullets = sectionNarrative(section({ code: "1", title: "S" }, ul(li(p(t("one"))), li(p(t("two"))))));
    expect(bullets).toContain("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
    const numbered = sectionNarrative(section({ code: "1", title: "S" }, ol(li(p(t("one"))))));
    expect(numbered).toContain("<ol><li><p>one</p></li></ol>");
  });

  it("drops empty paragraphs rather than rendering ragged whitespace", () => {
    expect(sectionNarrative(section({ code: "1", title: "S" }, p(), p(t("real"))))).toBe(
      `<div xmlns="${XHTML_NS}"><p>real</p></div>`,
    );
  });

  it("escapes text content", () => {
    expect(sectionNarrative(section({ code: "1", title: "S" }, p(t("a < b & c"))))).toContain(
      "a &lt; b &amp; c",
    );
  });

  it("renders an unfilled blank rather than silently dropping it", () => {
    // A draft narrative is a legitimate thing to produce, and a dropped blank
    // would make the draft look complete.
    expect(sectionNarrative(section({ code: "1", title: "S" }, p(blank("dose"))))).toContain("***dose***");
    expect(sectionNarrative(section({ code: "1", title: "S" }, p(blank())))).toContain("***");
  });

  it("takes a host rendering for blanks", () => {
    const html = sectionNarrative(section({ code: "1", title: "S" }, p(blank("dose"))), {
      wildcard: (hint) => `[${hint}]`,
    });
    expect(html).toContain("[dose]");
  });

  it("omits provenance by default", () => {
    // Per-range provenance is not standardised in FHIR; it travels as custom
    // attributes a conforming server may legitimately strip. Opting in is what
    // stops that being a surprise for someone else's integration engineer.
    expect(sectionNarrative(section({ code: "1", title: "S" }, p(t("x", "ai"))))).not.toContain("data-ox-");
  });

  it("emits provenance when asked, in a fixed attribute order", () => {
    const html = sectionNarrative(
      section(
        { code: "1", title: "S" },
        p(t("x", "pulled", { source: "Observation/1", at: "2026-08-16T06:12:00+05:30" })),
      ),
      { provenance: true },
    );
    expect(html).toContain(
      '<span data-ox-origin="pulled" data-ox-source="Observation/1" data-ox-at="2026-08-16T06:12:00+05:30">x</span>',
    );
  });

  it("emits the review flag only for AI ranges", () => {
    const ai = sectionNarrative(section({ code: "1", title: "S" }, p(t("x", "ai"))), { provenance: true });
    expect(ai).toContain('data-ox-reviewed="false"');
    const typed = sectionNarrative(section({ code: "1", title: "S" }, p(t("x", "typed"))), {
      provenance: true,
    });
    expect(typed).not.toContain("data-ox-reviewed");
  });

  it("emits dictation confidence", () => {
    const html = sectionNarrative(
      section({ code: "1", title: "S" }, p(t("x", "dictated", { confidence: 0.62 }))),
      { provenance: true },
    );
    expect(html).toContain('data-ox-confidence="0.62"');
  });

  it("nests marks in a fixed order, so the same document always hashes the same", () => {
    const html = sectionNarrative(
      section({ code: "1", title: "S" }, p(noteSchemaText())),
      { provenance: true },
    );
    // provenance outermost, then strong, then em.
    expect(html.indexOf("<span")).toBeLessThan(html.indexOf("<strong>"));
    expect(html.indexOf("<strong>")).toBeLessThan(html.indexOf("<em>"));
  });

  it("closes marks in the right order when a run ends", () => {
    const html = sectionNarrative(section({ code: "1", title: "S" }, p(b("bold"), t("plain"))));
    expect(html).toBe(`<div xmlns="${XHTML_NS}"><p><strong>bold</strong>plain</p></div>`);
  });

  it("keeps a shared outer mark open across adjacent runs", () => {
    // If the serializer closed and reopened per text node, the output would be
    // valid but would differ from the same document built a different way — and
    // the digest would differ with it.
    const html = sectionNarrative(
      section({ code: "1", title: "S" }, p(t("a", "copied"), t("b", "copied"))),
      { provenance: true },
    );
    expect(html.match(/<span/g)).toHaveLength(1);
  });
});

describe("recursing into unknown containers", () => {
  it("descends through a node it has no special rendering for", () => {
    // `sectionNarrative` given a whole document rather than one section: the
    // block serializer has no case for `section`, so it recurses. Worth
    // supporting because it is what a caller reaching for "just render this
    // subtree" will do.
    const d = doc(section({ code: "1", title: "A" }, p(t("one"))), section({ code: "2", title: "B" }, p(t("two"))));
    expect(sectionNarrative(d)).toBe(`<div xmlns="${XHTML_NS}"><p>one</p><p>two</p></div>`);
  });
});

describe("toNarrative", () => {
  it("titles each section", () => {
    const html = toNarrative(sampleNote());
    expect(html).toContain("<h2>Chief complaint</h2>");
    expect(html).toContain("<h2>History of present illness</h2>");
  });

  it("omits a heading for an untitled section", () => {
    expect(toNarrative(doc(section({ code: "1", title: "" }, p(t("x")))))).not.toContain("<h2>");
  });

  it("escapes section titles", () => {
    expect(toNarrative(doc(section({ code: "1", title: "A & B" }, p(t("x")))))).toContain("<h2>A &amp; B</h2>");
  });

  it("produces a well-formed, empty div for an empty note", () => {
    expect(toNarrative(emptyNote("progress"))).toMatch(/^<div xmlns="[^"]+">(<h2>[^<]*<\/h2>)*<\/div>$/);
  });
});

describe("the FHIR narrative constraint", () => {
  it("emits nothing FHIR forbids, for every section of a realistic note", () => {
    for (const { node } of sections(sampleNote())) {
      expect(sectionNarrative(node, { provenance: true })).not.toMatch(FORBIDDEN);
    }
    expect(toNarrative(sampleNote(), { provenance: true })).not.toMatch(FORBIDDEN);
  });

  it("cannot be made to emit active content, because the schema cannot hold it", () => {
    // This is the guarantee that makes the serializer a total function: a
    // document that could not be transmitted could not have been constructed.
    const hostile = doc(
      section(
        { code: "1", title: "<script>alert(1)</script>" },
        p(t('<img src=x onerror="alert(1)">'), p(t("javascript:void(0)"))),
      ),
    );
    const html = toNarrative(hostile, { provenance: true });
    expect(html).not.toMatch(FORBIDDEN);
    // Everything hostile survives as inert text rather than markup, which is
    // the correct outcome: it is what the clinician typed.
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain("<img");
  });

  it("balances every tag it opens", () => {
    const html = toNarrative(sampleNote(), { provenance: true });
    const opened = html.match(/<([a-z0-9]+)(?:\s[^>]*)?>/g) ?? [];
    const closed = html.match(/<\/([a-z0-9]+)>/g) ?? [];
    expect(opened).toHaveLength(closed.length);
  });
});

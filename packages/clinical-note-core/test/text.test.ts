import { describe, expect, it } from "vitest";
import { toText } from "../src/text.js";
import { emptyNote } from "../src/schema.js";
import { b, blank, doc, li, ol, p, sampleNote, section, t, ul } from "./helpers.js";

describe("toText", () => {
  it("keeps the section headings that make a note navigable", () => {
    // The reason this is a real serializer and not `doc.textContent`: that
    // would run every paragraph into one wall of prose with no headings.
    const text = toText(sampleNote());
    expect(text).toContain("CHIEF COMPLAINT");
    expect(text).toContain("HISTORY OF PRESENT ILLNESS");
  });

  it("separates paragraphs and sections", () => {
    const text = toText(
      doc(
        section({ code: "1", title: "A" }, p(t("one")), p(t("two"))),
        section({ code: "2", title: "B" }, p(t("three"))),
      ),
    );
    expect(text).toBe(["A", "one", "two", "", "B", "three"].join("\n"));
  });

  it("omits a section that has nothing in it", () => {
    // A heading with nothing under it reads as an assertion that there was
    // nothing to find, which is a different claim from not having looked.
    expect(toText(emptyNote("progress"))).toBe("");
  });

  it("drops empty paragraphs", () => {
    expect(toText(doc(section({ code: "1", title: "A" }, p(), p(t("real")), p())))).toBe("A\nreal");
  });

  it("renders bullets", () => {
    const text = toText(doc(section({ code: "1", title: "A" }, ul(li(p(t("one"))), li(p(t("two")))))));
    expect(text).toBe("A\n- one\n- two");
  });

  it("numbers ordered lists", () => {
    const text = toText(doc(section({ code: "1", title: "A" }, ol(li(p(t("one"))), li(p(t("two")))))));
    expect(text).toBe("A\n1. one\n2. two");
  });

  it("indents continuation paragraphs under their numbered item", () => {
    const text = toText(
      doc(section({ code: "1", title: "A" }, ol(li(p(t("first")), p(t("continued"))))),
      ),
    );
    expect(text).toBe("A\n1. first\n  continued");
  });

  it("nests lists", () => {
    const text = toText(
      doc(section({ code: "1", title: "A" }, ul(li(p(t("outer")), ul(li(p(t("inner")))))))),
    );
    expect(text).toContain("- outer");
    expect(text).toContain("- inner");
  });

  it("keeps blanks visible", () => {
    expect(toText(doc(section({ code: "1", title: "A" }, p(t("Dose "), blank("mg")))))).toContain(
      "***mg***",
    );
    expect(toText(doc(section({ code: "1", title: "A" }, p(blank()))))).toContain("***");
  });

  it("flattens formatting rather than inventing markup for it", () => {
    expect(toText(doc(section({ code: "1", title: "A" }, p(b("bold"), t(" plain")))))).toBe(
      "A\nbold plain",
    );
  });

  it("omits a heading for an untitled section but keeps its body", () => {
    expect(toText(doc(section({ code: "1", title: "" }, p(t("body")))))).toBe("body");
  });

  it("takes a host heading style", () => {
    const text = toText(doc(section({ code: "10164-2", title: "HPI" }, p(t("x")))), {
      heading: (title, code) => `[${code}] ${title}`,
    });
    expect(text.startsWith("[10164-2] HPI")).toBe(true);
  });

  it("takes a host bullet and blank rendering", () => {
    const text = toText(doc(section({ code: "1", title: "A" }, ul(li(p(t("x"), blank("y")))))), {
      bullet: "* ",
      wildcard: (hint) => `<${hint}>`,
    });
    expect(text).toContain("* x<y>");
  });

  it("takes a host line ending, because HL7 v2 uses \\r", () => {
    // An interface engine receiving \n inside OBX-5 does something technically
    // defensible and practically surprising.
    expect(toText(doc(section({ code: "1", title: "A" }, p(t("x")))), { eol: "\r" })).toBe("A\rx");
  });

  it("descends through a container it has no special rendering for", () => {
    // A list item holding a nested list rather than a paragraph exercises the
    // recursive arm; the same arm carries any block type added later.
    const text = toText(
      doc(section({ code: "1", title: "A" }, ul(li(p(t("outer")), ol(li(p(t("inner")))))))),
    );
    expect(text).toContain("- outer");
    expect(text).toContain("1. inner");
  });

  it("is deterministic", () => {
    expect(toText(sampleNote())).toBe(toText(sampleNote()));
  });
});

import { describe, expect, it } from "vitest";
import {
  LOINC,
  NOTE_TYPES,
  SECTIONS,
  emptyNote,
  hasWildcard,
  isSectionEmpty,
  noteSchema,
  noteType,
  sectionAttrs,
  sections,
  wildcardHint,
} from "../src/schema.js";
import { blank, doc, p, section, t } from "./helpers.js";

function el(attrs: Record<string, string | null>) {
  return { getAttribute: (name: string) => attrs[name] ?? null };
}

describe("the schema's refusals", () => {
  it("will not hold prose outside a coded section", () => {
    // The central guarantee. Text floating outside a section has nowhere to go
    // in a Composition, so the schema refuses to represent it rather than
    // letting a serializer discover the problem later.
    expect(() => noteSchema.nodes["doc"]!.createChecked(null, [p(t("orphan"))])).toThrow();
  });

  it("has no underline, strikethrough, alignment, link or image", () => {
    // Each of these was cut for a stated reason in §05 of the brief. A schema
    // that quietly regrows them breaks the narrative guarantee.
    for (const name of ["underline", "strike", "link", "align"]) {
      expect(noteSchema.marks[name]).toBeUndefined();
    }
    expect(noteSchema.nodes["image"]).toBeUndefined();
  });

  it("keeps only the two marks that survive every transport", () => {
    expect(Object.keys(noteSchema.marks).sort()).toEqual(["em", "provenance", "strong"]);
  });

  it("does not isolate sections, so a clinician can select across them", () => {
    // Refusing a cross-section selection would be the schema imposing a
    // workflow rather than a data contract.
    expect(noteSchema.nodes["section"]!.spec.isolating).toBeUndefined();
  });
});

describe("note types", () => {
  it("gives every built-in type a LOINC document code", () => {
    for (const def of Object.values(NOTE_TYPES)) {
      expect(def.code).toMatch(/^\d+-\d$/);
      expect(def.sections.length).toBeGreaterThan(0);
    }
  });

  it("requires a physical exam on an H&P but not on a progress note", () => {
    // The schema doing clinical work: an H&P without an exam is not an H&P.
    const hp = NOTE_TYPES.historyAndPhysical.sections.find(
      (s) => s.code === SECTIONS.physicalExam.code,
    );
    const progress = NOTE_TYPES.progress.sections.find(
      (s) => s.code === SECTIONS.physicalExam.code,
    );
    expect(hp?.required).toBe(true);
    expect(progress?.required).toBe(false);
  });

  it("resolves by name or by definition", () => {
    expect(noteType("progress")).toBe(NOTE_TYPES.progress);
    const bespoke = { code: "1-1", title: "Bespoke", sections: [SECTIONS.hpi] };
    expect(noteType(bespoke)).toBe(bespoke);
  });
});

describe("emptyNote", () => {
  it("creates every section up front, so the rail can show the gaps", () => {
    // A required section the clinician has not noticed is the defect the gate
    // exists to catch, and it cannot catch what is not there.
    const d = emptyNote("historyAndPhysical");
    expect(sections(d)).toHaveLength(NOTE_TYPES.historyAndPhysical.sections.length);
    expect(d.textContent).toBe("");
  });

  it("produces a structurally valid document for every built-in type", () => {
    for (const name of Object.keys(NOTE_TYPES) as (keyof typeof NOTE_TYPES)[]) {
      expect(() => emptyNote(name).check()).not.toThrow();
    }
  });

  it("carries the section code, system and requirement onto the node", () => {
    const first = sections(emptyNote("progress"))[0]!.node;
    expect(first.attrs["code"]).toBe(SECTIONS.chiefComplaint.code);
    expect(first.attrs["system"]).toBe(LOINC);
  });

  it("accepts a bespoke definition", () => {
    const d = emptyNote({ code: "9-9", title: "Custom", sections: [SECTIONS.hpi] });
    expect(sections(d)).toHaveLength(1);
  });
});

describe("emptiness", () => {
  it("treats whitespace as empty", () => {
    expect(isSectionEmpty(section({ code: "1", title: "S" }, p(t("   "))))).toBe(true);
    expect(isSectionEmpty(section({ code: "1", title: "S" }, p(t("x"))))).toBe(false);
  });

  it("does not treat a section holding only a blank as empty", () => {
    // An unfilled blank is content the clinician has to deal with; calling the
    // section empty would report the wrong problem.
    const s = section({ code: "1", title: "S" }, p(blank("severity")));
    expect(isSectionEmpty(s)).toBe(false);
    expect(hasWildcard(s)).toBe(true);
  });

  it("finds no blank where there is none", () => {
    expect(hasWildcard(section({ code: "1", title: "S" }, p(t("x"))))).toBe(false);
  });
});

describe("DOM round trip", () => {
  it("parses a section element", () => {
    const spec = noteSchema.nodes["section"]!.spec.parseDOM![0]!;
    expect(
      spec.getAttrs!(
        el({
          "data-zb-code": "10164-2",
          "data-zb-title": "HPI",
          "data-zb-required": "true",
        }),
      ),
    ).toEqual({ code: "10164-2", system: LOINC, title: "HPI", required: true });
  });

  it("falls back sensibly on a section element missing its attributes", () => {
    const spec = noteSchema.nodes["section"]!.spec.parseDOM![0]!;
    expect(spec.getAttrs!(el({}))).toEqual({ code: "", system: LOINC, title: "", required: false });
  });

  it("serialises a section without leaking the requirement flag into the DOM", () => {
    const node = section({ code: "1", title: "S", required: true });
    const out = noteSchema.nodes["section"]!.spec.toDOM!(node) as [
      string,
      Record<string, string>,
      number,
    ];
    expect(out[0]).toBe("section");
    expect(out[1]["data-zb-code"]).toBe("1");
    expect(out[1]["data-zb-required"]).toBeUndefined();
  });

  it("round-trips a blank, hinted and bare", () => {
    const spec = noteSchema.nodes["wildcard"]!.spec;
    expect(spec.parseDOM![0]!.getAttrs!(el({ "data-zb-wildcard": "dose" }))).toEqual({
      hint: "dose",
    });
    expect(spec.parseDOM![0]!.getAttrs!(el({}))).toEqual({ hint: "" });
    expect(spec.toDOM!(blank("dose"))).toEqual([
      "span",
      { "data-zb-wildcard": "dose" },
      "***dose***",
    ]);
    expect(spec.toDOM!(blank())).toEqual(["span", { "data-zb-wildcard": "" }, "***"]);
  });

  it("serialises every block node to the element FHIR narrative permits", () => {
    // Each of these is a real code path a host attaching a ProseMirror view
    // will execute on the first render, so leaving them untested means the
    // first person to mount the editor is the one who finds the typo.
    const cases: [string, unknown][] = [
      ["paragraph", ["p", 0]],
      ["bullet_list", ["ul", 0]],
      ["ordered_list", ["ol", 0]],
      ["list_item", ["li", 0]],
    ];
    for (const [name, expected] of cases) {
      const type = noteSchema.nodes[name]!;
      expect(type.spec.toDOM!(type.createAndFill()!), name).toEqual(expected);
    }
  });

  it("parses each block node from the element it serialises to", () => {
    for (const [name, tag] of [
      ["paragraph", "p"],
      ["bullet_list", "ul"],
      ["ordered_list", "ol"],
      ["list_item", "li"],
    ] as const) {
      expect(noteSchema.nodes[name]!.spec.parseDOM![0]!.tag, name).toBe(tag);
    }
  });

  it("parses bold and italic from both their spellings", () => {
    // Content pasted from another system uses <b>/<i> at least as often as the
    // semantic pair, and dropping the formatting silently would be worse than
    // refusing the paste.
    expect(noteSchema.marks["strong"]!.spec.parseDOM!.map((r) => r.tag)).toEqual(["strong", "b"]);
    expect(noteSchema.marks["em"]!.spec.parseDOM!.map((r) => r.tag)).toEqual(["em", "i"]);
  });

  it("serialises the formatting marks as semantic elements", () => {
    // Not styled spans: a screen reader cannot convey emphasis that is only a
    // font-weight declaration.
    expect(
      noteSchema.marks["strong"]!.spec.toDOM!(noteSchema.marks["strong"]!.create(), false),
    ).toEqual(["strong", 0]);
    expect(noteSchema.marks["em"]!.spec.toDOM!(noteSchema.marks["em"]!.create(), false)).toEqual([
      "em",
      0,
    ]);
  });
});

describe("attribute accessors", () => {
  it("reads a section's attributes without a fallback at every call site", () => {
    // ProseMirror fills every declared attribute from its default, so stating
    // that once here removes a `?? ""` from a dozen call sites — each of which
    // was a branch no test could reach.
    expect(sectionAttrs(section({ code: "10164-2", title: "HPI", required: true }))).toEqual({
      code: "10164-2",
      system: LOINC,
      title: "HPI",
      required: true,
    });
  });

  it("fills defaults for a section created with no attributes", () => {
    expect(sectionAttrs(noteSchema.nodes["section"]!.createAndFill()!)).toEqual({
      code: "",
      system: LOINC,
      title: "",
      required: false,
    });
  });

  it("reads a blank's hint", () => {
    expect(wildcardHint(blank("dose"))).toBe("dose");
    expect(wildcardHint(blank())).toBe("");
  });
});

describe("sections()", () => {
  it("returns sections with positions, ignoring anything else", () => {
    const d = doc(section({ code: "a", title: "A" }), section({ code: "b", title: "B" }));
    const found = sections(d);
    expect(found.map((s) => s.node.attrs["code"])).toEqual(["a", "b"]);
    expect(d.nodeAt(found[1]!.pos)?.attrs["code"]).toBe("b");
  });
});

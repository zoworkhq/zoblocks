/**
 * The document schema, and the reason this package is built on ProseMirror.
 *
 * A clinical note has to serialize to a valid FHIR `Composition` — a sequence
 * of LOINC-coded sections, each carrying an XHTML narrative drawn from a
 * restricted subset of HTML 4. Every editor that lacks a schema handles that by
 * validating *after* the fact, which means a clinician can type for twenty
 * minutes and then be told the note cannot be transmitted.
 *
 * Schema-first inverts it. The node types below are a subset of what the FHIR
 * narrative permits, so a document that cannot be transmitted cannot be
 * *constructed*, and `toNarrative()` becomes a total function with no failure
 * branch. That guarantee is the entire reason for the extra weight of
 * ProseMirror over a Delta-shaped model, and §04 of the brief is the long form
 * of the argument.
 *
 * What is deliberately absent is as load-bearing as what is here. No underline
 * (reads as a hyperlink in a clinical viewer), no strikethrough (silently
 * dropped by some renderers, which applied to a retraction is a safety defect),
 * no alignment (meaningless in clinical prose and does not round-trip), no
 * arbitrary hyperlinks (an exfiltration vector and a dead URL in five years),
 * no inline images (a wound photo inlined as base64 is a PHI incident — it
 * belongs in the imaging pipeline as a `Media` reference).
 */

import {
  Schema,
  type MarkType,
  type Node as PMNode,
  type NodeSpec,
  type NodeType,
} from "prosemirror-model";
import { provenanceMarkSpec } from "./provenance.js";

/* ------------------------------------------------------------------ */
/* Section codes                                                       */
/* ------------------------------------------------------------------ */

/** The coding system every section code in this file belongs to. */
export const LOINC = "http://loinc.org";

/** A LOINC-coded section of a note. */
export interface SectionDef {
  /** LOINC code, e.g. `10154-3`. */
  code: string;
  /** Human title. Shown in the rail and emitted as `Composition.section.title`. */
  title: string;
  /** Whether the note refuses to sign while this section is empty. */
  required: boolean;
}

/**
 * The section codes used by the built-in note types.
 *
 * Sourced from the common C-CDA section set. Codes are data rather than
 * literals scattered through the file so that a host replacing them for
 * another jurisdiction replaces one table.
 *
 * These have been checked against LOINC's published display names, but a
 * deployment must still confirm them — and their C-CDA cardinality — against
 * the implementation guide it is conforming to. A wrong section code is a
 * silent interoperability failure that surfaces at a customer's integration
 * rather than in this repository's tests.
 */
export const SECTIONS = {
  chiefComplaint: { code: "10154-3", title: "Chief complaint", required: false },
  hpi: { code: "10164-2", title: "History of present illness", required: true },
  pastMedicalHistory: { code: "11348-0", title: "Past medical history", required: false },
  medications: { code: "10160-0", title: "History of medication use", required: false },
  allergies: { code: "48765-2", title: "Allergies and adverse reactions", required: false },
  reviewOfSystems: { code: "10187-3", title: "Review of systems", required: false },
  physicalExam: { code: "29545-1", title: "Physical examination", required: true },
  results: {
    code: "30954-2",
    title: "Relevant diagnostic tests and laboratory data",
    required: false,
  },
  assessmentAndPlan: { code: "51847-2", title: "Assessment and plan", required: true },
  hospitalCourse: { code: "8648-8", title: "Hospital course", required: false },
  dischargeInstructions: { code: "8653-8", title: "Discharge instructions", required: false },
} as const satisfies Record<string, SectionDef>;

/* ------------------------------------------------------------------ */
/* Note types                                                          */
/* ------------------------------------------------------------------ */

/** A kind of note: its own LOINC code, and the sections it is made of. */
export interface NoteTypeDef {
  /** LOINC code for the document itself, e.g. `11506-3` for a progress note. */
  code: string;
  title: string;
  sections: readonly SectionDef[];
}

/**
 * The built-in note types.
 *
 * `required` differs by type on purpose, and this is where the schema starts
 * doing clinical work: an H&P without a physical examination is not an H&P, and
 * the gate refuses to sign one. A progress note has no such obligation.
 */
export const NOTE_TYPES = {
  progress: {
    code: "11506-3",
    title: "Progress note",
    sections: [
      SECTIONS.chiefComplaint,
      SECTIONS.hpi,
      SECTIONS.reviewOfSystems,
      { ...SECTIONS.physicalExam, required: false },
      SECTIONS.assessmentAndPlan,
    ],
  },
  historyAndPhysical: {
    code: "34117-2",
    title: "History and physical note",
    sections: [
      SECTIONS.chiefComplaint,
      SECTIONS.hpi,
      SECTIONS.pastMedicalHistory,
      SECTIONS.medications,
      SECTIONS.allergies,
      SECTIONS.reviewOfSystems,
      SECTIONS.physicalExam,
      SECTIONS.assessmentAndPlan,
    ],
  },
  consultation: {
    code: "11488-4",
    title: "Copilotation note",
    sections: [
      SECTIONS.chiefComplaint,
      SECTIONS.hpi,
      SECTIONS.physicalExam,
      SECTIONS.assessmentAndPlan,
    ],
  },
  dischargeSummary: {
    code: "18842-5",
    title: "Discharge summary",
    sections: [
      SECTIONS.hospitalCourse,
      SECTIONS.medications,
      { ...SECTIONS.assessmentAndPlan, required: true },
      SECTIONS.dischargeInstructions,
    ],
  },
} as const satisfies Record<string, NoteTypeDef>;

/** Name of a built-in note type. */
export type NoteTypeName = keyof typeof NOTE_TYPES;

/* ------------------------------------------------------------------ */
/* Nodes                                                               */
/* ------------------------------------------------------------------ */

const nodes: Record<string, NodeSpec> = {
  /**
   * A note is a sequence of sections and nothing else.
   *
   * Not `block+`. Prose floating outside a coded section has nowhere to go in a
   * `Composition`, so the schema refuses to represent it — which is the whole
   * point of having one.
   */
  doc: { content: "section+" },

  section: {
    content: "block+",
    attrs: {
      code: { default: "" },
      system: { default: LOINC },
      title: { default: "" },
      required: { default: false },
    },
    // Not `isolating`. A clinician must be able to select across two sections
    // and delete — refusing that would be the schema imposing a workflow rather
    // than a data contract, which is the failure mode of every EHR editor.
    defining: true,
    parseDOM: [
      {
        tag: "section[data-zb-code]",
        getAttrs(dom: unknown) {
          const el = dom as { getAttribute(name: string): string | null };
          return {
            code: el.getAttribute("data-zb-code") ?? "",
            system: el.getAttribute("data-zb-system") ?? LOINC,
            title: el.getAttribute("data-zb-title") ?? "",
            required: el.getAttribute("data-zb-required") === "true",
          };
        },
      },
    ],
    toDOM(node: PMNode) {
      const a = node.attrs as unknown as SectionAttrs;
      return [
        "section",
        { "data-zb-code": a.code, "data-zb-system": a.system, "data-zb-title": a.title },
        0,
      ];
    },
  },

  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return ["p", 0];
    },
  },

  bullet_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ul" }],
    toDOM() {
      return ["ul", 0];
    },
  },

  ordered_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ol" }],
    toDOM() {
      return ["ol", 0];
    },
  },

  list_item: {
    content: "paragraph+",
    defining: true,
    parseDOM: [{ tag: "li" }],
    toDOM() {
      return ["li", 0];
    },
  },

  /**
   * A template blank: Epic's `***`, as a node rather than a text convention.
   *
   * A real node because the text convention loses. Three asterisks can be
   * half-deleted into `**`, which then matches nothing, blocks nothing, and
   * ships inside a signed note as an invisible admission that the template was
   * never read. An atom either exists or does not.
   */
  wildcard: {
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,
    attrs: { hint: { default: "" } },
    parseDOM: [
      {
        tag: "span[data-zb-wildcard]",
        getAttrs(dom: unknown) {
          const el = dom as { getAttribute(name: string): string | null };
          return { hint: el.getAttribute("data-zb-wildcard") ?? "" };
        },
      },
    ],
    toDOM(node: PMNode) {
      const { hint } = node.attrs as unknown as { hint: string };
      return ["span", { "data-zb-wildcard": hint }, hint === "" ? "***" : `***${hint}***`];
    },
  },

  text: { group: "inline" },
};

/* ------------------------------------------------------------------ */
/* Marks                                                               */
/* ------------------------------------------------------------------ */

/**
 * Two formatting marks, and provenance.
 *
 * Bold and italic are here because they survive every downstream transport —
 * FHIR narrative, C-CDA, and the plain-text degradation an HL7 v2 `OBX` still
 * carries a great many notes through. That is the entire selection criterion,
 * and it is why the list is this short.
 */
const marks = {
  strong: {
    parseDOM: [{ tag: "strong" }, { tag: "b" }],
    toDOM(): readonly [string, number] {
      return ["strong", 0] as const;
    },
  },
  em: {
    parseDOM: [{ tag: "em" }, { tag: "i" }],
    toDOM(): readonly [string, number] {
      return ["em", 0] as const;
    },
  },
  provenance: provenanceMarkSpec,
};

/** The schema. One instance, shared — ProseMirror schemas are immutable. */
export const noteSchema = new Schema({ nodes, marks });

/* ------------------------------------------------------------------ */
/* Resolved types                                                      */
/* ------------------------------------------------------------------ */

/**
 * The node and mark types, narrowed once.
 *
 * `Schema.nodes` is a `Record<string, NodeType>`, so under
 * `noUncheckedIndexedAccess` every lookup is `NodeType | undefined` and every
 * call site would need an assertion. The schema is constructed from the object
 * literals above in this same module, so the names are present by
 * construction — narrowing here, once, with that reason stated, is honest;
 * scattering `!` through nine files is not.
 */
export const NODES = noteSchema.nodes as unknown as {
  doc: NodeType;
  section: NodeType;
  paragraph: NodeType;
  bullet_list: NodeType;
  ordered_list: NodeType;
  list_item: NodeType;
  wildcard: NodeType;
  text: NodeType;
};

export const MARKS = noteSchema.marks as unknown as {
  strong: MarkType;
  em: MarkType;
  provenance: MarkType;
};

/* ------------------------------------------------------------------ */
/* Attribute accessors                                                 */
/* ------------------------------------------------------------------ */

/** A section node's attributes. */
export interface SectionAttrs {
  code: string;
  system: string;
  title: string;
  required: boolean;
}

/**
 * Read a section's attributes.
 *
 * ProseMirror fills every declared attribute from its `default` when a node is
 * created, so all four are present on any node of this type. Stating that once,
 * here, replaces a `?? ""` at each of a dozen call sites — each of which was a
 * branch no test could ever reach, and which therefore made the coverage report
 * quietly less meaningful.
 */
export function sectionAttrs(node: PMNode): SectionAttrs {
  return node.attrs as unknown as SectionAttrs;
}

/** A blank's hint, for the same reason. */
export function wildcardHint(node: PMNode): string {
  return (node.attrs as unknown as { hint: string }).hint;
}

/* ------------------------------------------------------------------ */
/* Building an empty note                                              */
/* ------------------------------------------------------------------ */

/** Resolve a note type from its name or a bespoke definition. */
export function noteType(type: NoteTypeName | NoteTypeDef): NoteTypeDef {
  return typeof type === "string" ? NOTE_TYPES[type] : type;
}

/**
 * An empty note of the given type: every section present, each holding one
 * empty paragraph.
 *
 * Sections are created up front rather than on demand so the rail can show the
 * shape of the note — and its gaps — from the first keystroke. A required
 * section the clinician has not noticed is the defect the gate exists to catch,
 * and it cannot catch what is not there.
 */
export function emptyNote(type: NoteTypeName | NoteTypeDef): PMNode {
  const def = noteType(type);
  const sections = def.sections.map((s) =>
    NODES.section.create(
      { code: s.code, system: LOINC, title: s.title, required: s.required },
      NODES.paragraph.create(),
    ),
  );
  return NODES.doc.create(null, sections);
}

/** Whether a section node holds nothing but whitespace. */
export function isSectionEmpty(section: PMNode): boolean {
  return section.textContent.trim() === "" && !hasWildcard(section);
}

/** Whether a node contains at least one unfilled blank. */
export function hasWildcard(node: PMNode): boolean {
  let found = false;
  node.descendants((child) => {
    if (found) return false;
    if (child.type.name === "wildcard") {
      found = true;
      return false;
    }
    return true;
  });
  return found;
}

/** Every section in the document, with its position. */
export function sections(doc: PMNode): { node: PMNode; pos: number }[] {
  const out: { node: PMNode; pos: number }[] = [];
  doc.forEach((node, offset) => {
    if (node.type.name === "section") out.push({ node, pos: offset });
  });
  return out;
}

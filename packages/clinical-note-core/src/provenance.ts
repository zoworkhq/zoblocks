/**
 * Where every character came from.
 *
 * This is the whole thesis of the component expressed as a mark. In every EHR
 * shipping today, text the clinician typed, text a template fired, text pulled
 * from a lab result, text copied forward from a note three weeks old, and text
 * a model wrote all collapse into identical black glyphs the moment they land
 * on screen. The clinician then signs the note and attests to all of it
 * equally.
 *
 * Note bloat, copy-paste error and the AI-attribution problem are the same
 * missing data structure seen three times. Storing origin per range does not
 * solve any of them, but it makes all three *visible*, which is the
 * prerequisite for solving them and is the thing nobody else ships.
 *
 * A mark rather than a node, because provenance is a property of a *span of
 * text* and must survive arbitrary editing: typing inside an AI range splits it
 * in three, deleting across a boundary merges two, pasting into the middle of a
 * pulled value produces a fourth. ProseMirror's mark model plus position
 * mapping already solves exactly that problem, which is most of the engine
 * argument in §04 of the brief.
 */

import type { Mark, MarkSpec, Node as PMNode } from "prosemirror-model";

/* ------------------------------------------------------------------ */
/* Origins                                                             */
/* ------------------------------------------------------------------ */

/**
 * The six ways text gets into a clinical note.
 *
 * Deliberately closed. An open string would let a host invent a seventh that
 * no gate rule knows how to weigh, and the gate is the thing that makes any of
 * this matter. If a host genuinely has a seventh, it belongs in this union
 * with a rule to go with it.
 */
export type Origin =
  /** Entered at the keyboard by the signing author. The only unremarkable one. */
  | "typed"
  /** Spoken and transcribed. Carries a recognizer confidence where one is known. */
  | "dictated"
  /** Inserted by a dot phrase or note template. Boilerplate until edited. */
  | "template"
  /** Pulled from structured data — a lab, a vital, a medication list. */
  | "pulled"
  /** Copied from earlier documentation, on this patient or another. */
  | "copied"
  /** Drafted by a model. Unreviewed until a human has read it in place. */
  | "ai";

/** Every origin, in the order they are reported. Iteration order is stable. */
export const ORIGINS: readonly Origin[] = [
  "typed",
  "dictated",
  "template",
  "pulled",
  "copied",
  "ai",
] as const;

/** Type guard, for validating values arriving from a host or from JSON. */
export function isOrigin(value: unknown): value is Origin {
  return typeof value === "string" && (ORIGINS as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ */
/* Attributes                                                          */
/* ------------------------------------------------------------------ */

/**
 * What a provenance mark records.
 *
 * Every field beyond `origin` is nullable because it is meaningful for some
 * origins and not others: `confidence` belongs to dictation, `at` to a pull,
 * `reviewed` to AI. Modelling that as a discriminated union per origin was the
 * first attempt and it made the mark unusable — ProseMirror mark attributes are
 * a flat record, and forcing a union through it produced a worse type and a
 * pile of casts. Flat and nullable, with the rules enforced by the gate rather
 * than the type, is the honest trade here.
 */
export interface ProvenanceAttrs {
  origin: Origin;
  /**
   * Where it came from, when that is knowable and useful: `Observation/123`
   * for a pull, a note id for copied text, a phrase id for a template, a model
   * identifier for AI.
   */
  source: string | null;
  /**
   * The instant the content was true, as an ISO 8601 string *with offset*.
   *
   * Not the instant it was inserted — those differ, and it is the former that
   * matters. A potassium pulled at 06:12 and pasted at 14:38 is an eight-hour-
   * old fact whichever way it got there.
   */
  at: string | null;
  /** Recognizer confidence in [0, 1], for dictated ranges. */
  confidence: number | null;
  /**
   * Whether a human has read this range in place.
   *
   * Only consulted for `ai`. `false` here is what blocks the sign button, and
   * it is the single most valuable field in this file.
   */
  reviewed: boolean;
}

/** The neutral attribute set. Exported so callers never hand-build a partial. */
export const DEFAULT_PROVENANCE: ProvenanceAttrs = {
  origin: "typed",
  source: null,
  at: null,
  confidence: null,
  reviewed: false,
};

/**
 * Build a complete attribute record from a partial one.
 *
 * ProseMirror compares mark attributes by value to decide whether two adjacent
 * marks are the same mark. That makes normalisation load-bearing rather than
 * cosmetic: `{origin:"ai"}` and `{origin:"ai", source:null}` must produce
 * identical records, or two ranges that are semantically one will refuse to
 * merge and the document will accumulate fragmentation with every edit.
 */
export function provenance(attrs: Partial<ProvenanceAttrs> & { origin: Origin }): ProvenanceAttrs {
  return {
    origin: attrs.origin,
    source: attrs.source ?? null,
    at: attrs.at ?? null,
    confidence: attrs.confidence ?? null,
    // Text nobody generated cannot be unreviewed, so everything that is not
    // AI is reviewed by construction. Without this, `unreviewedAi` would have
    // to special-case the origin at every call site.
    reviewed: attrs.origin === "ai" ? (attrs.reviewed ?? false) : true,
  };
}

/* ------------------------------------------------------------------ */
/* The mark spec                                                       */
/* ------------------------------------------------------------------ */

/**
 * The ProseMirror mark spec.
 *
 * `inclusive: false` is the one setting here worth arguing about, and it is
 * correct: with the default (`true`), typing at the right edge of an AI range
 * extends the AI mark over what the clinician just wrote, quietly attributing
 * their words to a machine. Typing beside generated text must produce typed
 * text. The same reasoning applies to every other origin.
 *
 * `spanning: false` keeps a mark from being split across a node boundary in a
 * way that would let one logical range report as two in `composition()`.
 */
export const provenanceMarkSpec: MarkSpec = {
  inclusive: false,
  spanning: false,
  attrs: {
    origin: { default: DEFAULT_PROVENANCE.origin },
    source: { default: null },
    at: { default: null },
    confidence: { default: null },
    reviewed: { default: false },
  },
  parseDOM: [
    {
      tag: "span[data-ox-origin]",
      getAttrs(dom: unknown) {
        // Typed loosely because the DOM type is only present when a view is
        // attached, and this package must import without one.
        const el = dom as { getAttribute(name: string): string | null };
        const raw = el.getAttribute("data-ox-origin");
        if (!isOrigin(raw)) return false;
        const confidence = el.getAttribute("data-ox-confidence");
        const parsed = confidence === null ? null : Number.parseFloat(confidence);
        return provenance({
          origin: raw,
          source: el.getAttribute("data-ox-source"),
          at: el.getAttribute("data-ox-at"),
          confidence: parsed === null || Number.isNaN(parsed) ? null : parsed,
          reviewed: el.getAttribute("data-ox-reviewed") === "true",
        });
      },
    },
  ],
  toDOM(mark: Mark) {
    const a = mark.attrs as unknown as ProvenanceAttrs;
    // Attribute order is fixed rather than object-literal-incidental, because
    // `canonical.ts` hashes the serialized form and a reordering would change
    // the digest of an unchanged note.
    const attrs: Record<string, string> = { "data-ox-origin": a.origin };
    if (a.source !== null) attrs["data-ox-source"] = a.source;
    if (a.at !== null) attrs["data-ox-at"] = a.at;
    if (a.confidence !== null) attrs["data-ox-confidence"] = String(a.confidence);
    if (a.origin === "ai") attrs["data-ox-reviewed"] = String(a.reviewed);
    return ["span", attrs, 0];
  },
};

/* ------------------------------------------------------------------ */
/* Reading provenance back out                                         */
/* ------------------------------------------------------------------ */

/** The attributes of the provenance mark on a node, or null if unmarked. */
export function readProvenance(node: PMNode): ProvenanceAttrs | null {
  const mark = node.marks.find((m) => m.type.name === "provenance");
  return mark ? (mark.attrs as unknown as ProvenanceAttrs) : null;
}

/**
 * The effective origin of a text node.
 *
 * Unmarked text is `typed`. That default is deliberate and slightly generous:
 * it means a host that adopts the schema without wiring provenance yet gets a
 * document that still validates and still signs, rather than one where every
 * range reads as unattributed. The gate never blocks on `typed`, so the failure
 * mode of an unwired host is "no extra safety", not "cannot sign".
 */
export function originOf(node: PMNode): Origin {
  return readProvenance(node)?.origin ?? "typed";
}

/** A contiguous run of text sharing one provenance record. */
export interface ProvenanceRange {
  /** Document position of the first character. */
  from: number;
  /** Document position one past the last character. */
  to: number;
  origin: Origin;
  attrs: ProvenanceAttrs;
  text: string;
}

/**
 * Every provenance range in the document, in document order, with adjacent
 * equal runs coalesced.
 *
 * Coalescing matters for reporting: a range the clinician edited in the middle
 * and then undid is one range to a human and may be three text nodes to
 * ProseMirror. Reporting "5 unreviewed AI passages" when there is one is how a
 * gate loses its credibility.
 */
export function provenanceRanges(
  doc: PMNode,
  filter?: (attrs: ProvenanceAttrs) => boolean,
): ProvenanceRange[] {
  const out: ProvenanceRange[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const attrs = readProvenance(node) ?? DEFAULT_PROVENANCE;
    if (filter && !filter(attrs)) return true;

    const text = node.text ?? "";
    const last = out[out.length - 1];
    if (last && last.to === pos && sameProvenance(last.attrs, attrs)) {
      last.to = pos + text.length;
      last.text += text;
      return true;
    }
    out.push({ from: pos, to: pos + text.length, origin: attrs.origin, attrs, text });
    return true;
  });

  return out;
}

/** Value equality over provenance attributes. */
export function sameProvenance(a: ProvenanceAttrs, b: ProvenanceAttrs): boolean {
  return (
    a.origin === b.origin &&
    a.source === b.source &&
    a.at === b.at &&
    a.confidence === b.confidence &&
    a.reviewed === b.reviewed
  );
}

/**
 * Age of a range in milliseconds, or null when it carries no `at`.
 *
 * `now` is a parameter and has no default. There is no clock in this package —
 * a browser clock is not evidence, and a component that reads one silently
 * makes a claim about *when* that the host cannot override or test. The same
 * rule is enforced in `signature-core` by a test that greps the source, and the
 * equivalent test guards this package.
 */
export function ageMs(attrs: ProvenanceAttrs, now: Date): number | null {
  if (attrs.at === null) return null;
  const at = Date.parse(attrs.at);
  if (Number.isNaN(at)) return null;
  return now.getTime() - at;
}

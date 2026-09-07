/**
 * The document as FHIR narrative XHTML.
 *
 * FHIR constrains `Narrative.div` to an XHTML fragment built from the basic
 * formatting elements of HTML 4 — chapters 7 to 11 (excluding §4 of chapter 9)
 * and chapter 15 — plus anchors and images. It must not contain `head`, `body`,
 * external stylesheet references, deprecated elements, scripts, forms, `base`,
 * `link`, `xlink`, frames, iframes, objects, or event attributes such as
 * `onClick`, so that a narrative is self-contained and carries no active
 * content.
 *
 * Two consequences run through this file.
 *
 * **This is a total function.** The schema in `schema.ts` was chosen as a
 * subset of what the narrative permits, so there is no failure branch here and
 * no validation step: a document that could not be transmitted could not have
 * been constructed. That is the dividend of a schema-first engine and the
 * reason §04 of the brief argues for one.
 *
 * **It writes strings, not DOM.** `DOMSerializer` would need a browser or a
 * jsdom shim, would put this package's tests on the wrong side of the
 * DOM-free line, and — decisively — offers no guarantee about attribute
 * ordering. `canonical.ts` hashes this output, so ordering is a correctness
 * property here rather than a matter of taste.
 */

import type { Mark, Node as PMNode } from "prosemirror-model";
import { sectionAttrs, sections, wildcardHint } from "./schema.js";

/** The XHTML namespace every FHIR narrative div must declare. */
export const XHTML_NS = "http://www.w3.org/1999/xhtml";

/* ------------------------------------------------------------------ */
/* Escaping                                                            */
/* ------------------------------------------------------------------ */

/**
 * Escape text for XHTML.
 *
 * Ampersand first, or the escapes get double-escaped. Quotes are escaped in
 * text content as well as attributes: it costs nothing, and it removes the
 * class of bug where a helper is reused in the other context.
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

export interface NarrativeOptions {
  /**
   * Emit provenance as `data-zb-*` attributes on wrapping spans.
   *
   * Off by default, and the default is the important half. Per-range
   * provenance is not standardised anywhere in FHIR; it travels as custom
   * attributes that a conforming server may legitimately strip. Making a host
   * opt in is what keeps that from being a surprise discovered by someone
   * else's integration engineer.
   */
  provenance?: boolean;
  /**
   * How to render an unfilled blank.
   *
   * Defaults to `***`, which is what it looks like on screen. A note should not
   * normally reach here with blanks in it — the gate blocks that — but a *draft*
   * narrative is a legitimate thing to produce, and silently dropping the blank
   * would make the draft look complete.
   */
  wildcard?: (hint: string) => string;
}

/* ------------------------------------------------------------------ */
/* Inline                                                              */
/* ------------------------------------------------------------------ */

// Fixed order, so that a range carrying both marks always nests the same way
// and therefore always hashes the same way.
const MARK_ORDER = ["provenance", "strong", "em"] as const;

// `openTag` and `closeTag` are only ever reached with a mark drawn from
// MARK_ORDER, so they are written without a fallback arm: an unreachable
// `default` is untestable code that reads as if it handles a case the schema
// makes impossible.
function openTag(mark: Mark, options: NarrativeOptions): string {
  if (mark.type.name === "strong") return "<strong>";
  if (mark.type.name === "em") return "<em>";
  if (options.provenance !== true) return "";

  const a = mark.attrs as Record<string, unknown>;
  // Attributes emitted in a fixed order for the same reason as MARK_ORDER:
  // `canonical.ts` hashes this output, so ordering is correctness.
  const parts: string[] = [`data-zb-origin="${escapeXml(String(a["origin"] ?? "typed"))}"`];
  if (a["source"] != null) parts.push(`data-zb-source="${escapeXml(String(a["source"]))}"`);
  if (a["at"] != null) parts.push(`data-zb-at="${escapeXml(String(a["at"]))}"`);
  if (a["confidence"] != null)
    parts.push(`data-zb-confidence="${escapeXml(String(a["confidence"]))}"`);
  if (a["origin"] === "ai") parts.push(`data-zb-reviewed="${a["reviewed"] === true}"`);
  return `<span ${parts.join(" ")}>`;
}

function closeTag(mark: Mark, options: NarrativeOptions): string {
  if (mark.type.name === "strong") return "</strong>";
  if (mark.type.name === "em") return "</em>";
  return options.provenance === true ? "</span>" : "";
}

function orderedMarks(node: PMNode): Mark[] {
  const out: Mark[] = [];
  for (const name of MARK_ORDER) {
    const mark = node.marks.find((m) => m.type.name === name);
    if (mark) out.push(mark);
  }
  return out;
}

function inlineContent(parent: PMNode, options: NarrativeOptions): string {
  let out = "";
  // Marks currently open, outermost first.
  let open: Mark[] = [];

  const wildcard = options.wildcard ?? ((hint: string) => (hint === "" ? "***" : `***${hint}***`));

  parent.forEach((child) => {
    const wanted = child.isText ? orderedMarks(child) : [];

    // Close from the innermost until what remains is a prefix of `wanted`, then
    // open the rest. Keeping a shared outer mark open across adjacent runs is
    // what makes the output depend only on the document and not on how it came
    // to be built — which `canonical.ts` relies on.
    let shared = 0;
    while (shared < open.length && shared < wanted.length) {
      const a = open[shared];
      const b = wanted[shared];
      if (a === undefined || b === undefined || !a.eq(b)) break;
      shared++;
    }
    for (let i = open.length - 1; i >= shared; i--) {
      const mark = open[i];
      if (mark !== undefined) out += closeTag(mark, options);
    }
    for (let i = shared; i < wanted.length; i++) {
      const mark = wanted[i];
      if (mark !== undefined) out += openTag(mark, options);
    }
    open = wanted;

    if (child.isText) out += escapeXml(child.text ?? "");
    else if (child.type.name === "wildcard") out += escapeXml(wildcard(wildcardHint(child)));
  });

  for (let i = open.length - 1; i >= 0; i--) {
    const mark = open[i];
    if (mark !== undefined) out += closeTag(mark, options);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Block                                                               */
/* ------------------------------------------------------------------ */

function block(node: PMNode, options: NarrativeOptions): string {
  switch (node.type.name) {
    case "paragraph": {
      const inner = inlineContent(node, options);
      // An empty paragraph is dropped rather than emitted as `<p></p>`. FHIR
      // permits it, but a narrative full of empty paragraphs renders as ragged
      // whitespace in every viewer that consumes it.
      return inner === "" ? "" : `<p>${inner}</p>`;
    }
    case "bullet_list":
      return `<ul>${children(node, options)}</ul>`;
    case "ordered_list":
      return `<ol>${children(node, options)}</ol>`;
    case "list_item":
      return `<li>${children(node, options)}</li>`;
    default:
      return children(node, options);
  }
}

function children(node: PMNode, options: NarrativeOptions): string {
  let out = "";
  node.forEach((child) => {
    out += block(child, options);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

/**
 * One section's narrative, as the `div` that goes in
 * `Composition.section.text.div`.
 *
 * The namespace declaration is on the div because that is what FHIR requires
 * of the element it stores — not on some ancestor that will not survive the
 * round trip through a server.
 */
export function sectionNarrative(section: PMNode, options: NarrativeOptions = {}): string {
  const inner = children(section, options);
  return `<div xmlns="${XHTML_NS}">${inner}</div>`;
}

/**
 * The whole note as one narrative div, with section headings.
 *
 * Used for `Composition.text` — the human-readable summary of the composition
 * as a whole — while `sectionNarrative` fills each `section.text`. FHIR wants
 * both, and they are genuinely different documents rather than one repeated.
 */
export function toNarrative(doc: PMNode, options: NarrativeOptions = {}): string {
  let out = `<div xmlns="${XHTML_NS}">`;
  for (const { node } of sections(doc)) {
    const title = sectionAttrs(node).title;
    const inner = children(node, options);
    if (title !== "") out += `<h2>${escapeXml(title)}</h2>`;
    out += inner;
  }
  out += "</div>";
  return out;
}

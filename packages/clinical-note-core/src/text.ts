/**
 * The document as plain text.
 *
 * Not a fallback. A great many clinical notes still travel between systems as
 * an HL7 v2 `OBX` segment, which is text and nothing else, and a note that
 * degrades badly there degrades badly in the place a downstream clinician
 * actually reads it.
 *
 * So this is a real serializer with real tests rather than `doc.textContent`.
 * The difference shows up immediately: `textContent` runs every paragraph
 * together into one wall of prose, drops the section headings that make a note
 * navigable, and turns a bulleted plan into a single unpunctuated sentence.
 */

import type { Node as PMNode } from "prosemirror-model";
import { sectionAttrs, sections, wildcardHint } from "./schema.js";

export interface TextOptions {
  /**
   * How to render a section heading. Default upper-cases the title, which is
   * the convention in every v2 interface anyone has ever had to read.
   */
  heading?: (title: string, code: string) => string;
  /** Marker for unordered list items. Default `- `. */
  bullet?: string;
  /** Rendering for an unfilled blank. Default `***`. */
  wildcard?: (hint: string) => string;
  /**
   * Line ending. Defaults to `\n`.
   *
   * HL7 v2 famously uses `\r` as its segment separator, and an interface engine
   * that receives `\n` inside an OBX-5 will do something that is technically
   * defensible and practically surprising. Making this explicit is cheaper than
   * the support ticket.
   */
  eol?: string;
}

const DEFAULTS = {
  heading: (title: string) => title.toUpperCase(),
  bullet: "- ",
  wildcard: (hint: string) => (hint === "" ? "***" : `***${hint}***`),
  eol: "\n",
};

function inline(node: PMNode, wildcard: (hint: string) => string): string {
  let out = "";
  node.forEach((child) => {
    if (child.isText) out += child.text ?? "";
    else if (child.type.name === "wildcard") out += wildcard(wildcardHint(child));
    else out += inline(child, wildcard);
  });
  return out;
}

function blocks(node: PMNode, opts: Required<TextOptions>, depth: number): string[] {
  const lines: string[] = [];

  node.forEach((child) => {
    switch (child.type.name) {
      case "paragraph": {
        const text = inline(child, opts.wildcard).trim();
        // Empty paragraphs are structural, not content. Emitting them produces
        // a note with more blank lines than sentences.
        if (text !== "") lines.push(text);
        break;
      }
      case "bullet_list": {
        child.forEach((item) => {
          for (const line of blocks(item, opts, depth + 1)) {
            lines.push(`${"  ".repeat(depth)}${opts.bullet}${line}`);
          }
        });
        break;
      }
      case "ordered_list": {
        let n = 1;
        child.forEach((item) => {
          const inner = blocks(item, opts, depth + 1);
          inner.forEach((line, i) => {
            // Only the first line of a multi-paragraph item is numbered; the
            // rest are indented under it, which is what a reader expects.
            lines.push(
              i === 0 ? `${"  ".repeat(depth)}${n}. ${line}` : `${"  ".repeat(depth + 1)}${line}`,
            );
          });
          n++;
        });
        break;
      }
      default:
        lines.push(...blocks(child, opts, depth));
    }
  });

  return lines;
}

/**
 * Serialize a note to plain text.
 *
 * Deterministic: the same document produces the same string, every time. That
 * is not incidental here — it is what allows a text rendering to be hashed and
 * compared, and what makes the golden-file tests meaningful.
 */
export function toText(doc: PMNode, options: TextOptions = {}): string {
  const opts: Required<TextOptions> = { ...DEFAULTS, ...options };
  const out: string[] = [];

  for (const { node } of sections(doc)) {
    const body = blocks(node, opts, 0);
    // A section with no content contributes nothing, not a bare heading. A
    // heading with nothing under it reads as an assertion that there was
    // nothing to find, which is a different claim from not having looked.
    if (body.length === 0) continue;

    const { title, code } = sectionAttrs(node);
    if (out.length > 0) out.push("");
    if (title !== "") out.push(opts.heading(title, code));
    out.push(...body);
  }

  return out.join(opts.eol);
}

/**
 * Dot phrases, blanks and pick lists.
 *
 * The single highest-value feature in clinical documentation, and the one the
 * reference design omitted entirely. Every US clinician has muscle memory for a
 * `.`-triggered phrase; the difference between having this and not is the
 * difference between a ninety-second note and a nine-minute one.
 *
 * The grammar is small on purpose:
 *
 *     Constitutional — denies fever.        plain text
 *     Pain is ***severity*** today.         a blank, with a hint
 *     Patient is {alert:drowsy:obtunded}.   a pick list
 *
 * `***` and `{a:b:c}` are Epic's SmartList syntax rather than anything invented
 * here. Phrase libraries are organisational assets that outlive any one vendor,
 * and a migration that requires rewriting two thousand phrases does not happen.
 *
 * Expansion is pure: text in, document fragment out, no clock and no I/O. The
 * whole file is table-testable, which is why the phrase grammar lives here and
 * not in the React package.
 */

import { Fragment, type Node as PMNode } from "prosemirror-model";
import { MARKS, NODES, wildcardHint } from "./schema.js";
import { provenance, type ProvenanceAttrs } from "./provenance.js";

/* ------------------------------------------------------------------ */
/* Phrases                                                             */
/* ------------------------------------------------------------------ */

/** A stored phrase. Hosts supply these; none ship in this package. */
export interface Phrase {
  /** The trigger without its dot, e.g. `ros` for `.ros`. */
  id: string;
  /** Shown in the picker. */
  label: string;
  /** One-line preview. What makes a library of 200 phrases usable. */
  description?: string;
  /** The body, in the grammar above. Blank lines separate paragraphs. */
  body: string;
  /** Free-form grouping for the picker, e.g. a specialty. */
  group?: string;
}

/** A parsed token of a phrase body. */
export type Token =
  | { kind: "text"; text: string }
  | { kind: "blank"; hint: string }
  | { kind: "choice"; options: string[] };

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

// Order matters: hinted blanks are matched before bare ones, and both before
// pick lists, so that a hint containing a brace cannot be mistaken for a list.
//
// A hint is one token — no whitespace, no asterisks — and that restriction is
// load-bearing rather than tidy. With a permissive hint, `*** and ***` parses
// as a single blank hinted "and" instead of the two blanks the author wrote,
// which is exactly the case a phrase with two blanks on one line produces. One
// token also matches how SmartList hints are actually written.
const TOKEN = /\*\*\*([^\s*]+)\*\*\*|\*\*\*|\{([^{}]*)\}/g;

/**
 * Parse one line of phrase body into tokens.
 *
 * Exported because it is the part most likely to need a host-specific variant,
 * and because a parser that can only be tested through the thing that uses it
 * is a parser that stops being tested.
 */
export function tokenize(line: string): Token[] {
  const out: Token[] = [];
  let last = 0;

  // The regex is stateful across calls; resetting is not optional.
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(line)) !== null) {
    if (match.index > last) out.push({ kind: "text", text: line.slice(last, match.index) });

    if (match[2] !== undefined) {
      // A pick list. Empty options are dropped rather than rendered as a blank
      // choice — `{mild::severe}` is a typo, not a three-way decision.
      const options = match[2]
        .split(":")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      if (options.length > 0) out.push({ kind: "choice", options });
      else out.push({ kind: "text", text: match[0] });
    } else {
      out.push({ kind: "blank", hint: (match[1] ?? "").trim() });
    }

    last = match.index + match[0].length;
  }

  if (last < line.length) out.push({ kind: "text", text: line.slice(last) });
  return out;
}

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

/** Options for expanding a phrase. */
export interface ExpandOptions {
  /**
   * Provenance for the inserted text.
   *
   * Defaults to `template`, which is the honest answer: the clinician chose the
   * phrase, but did not write these words in this encounter, and until they
   * edit a range it remains boilerplate. `hasUneditedTemplate` in the gate is
   * what turns that into a warning worth reading.
   */
  provenance?: Partial<ProvenanceAttrs> & { origin: ProvenanceAttrs["origin"] };
  /**
   * How to resolve a pick list without asking.
   *
   * Default takes the first option, which matches Epic's behaviour when a
   * SmartList is accepted without a selection. Hosts driving an interactive
   * picker pass their own.
   */
  choose?: (options: string[]) => string;
}

/** The result of expanding a phrase. */
export interface Expansion {
  /** Block-level nodes, ready to be inserted. */
  content: Fragment;
  /** How many blanks the inserted text still contains. */
  blanks: number;
}

/**
 * Expand a phrase body into document content.
 *
 * Blank lines become paragraph breaks; every other line becomes one paragraph.
 * Lists are deliberately not part of the grammar — a phrase that needs a
 * bulleted list is a note template, which is a different feature with a
 * different editor, and conflating them produces a grammar nobody can predict.
 */
export function expand(body: string, options: ExpandOptions = {}): Expansion {
  const attrs = provenance(options.provenance ?? { origin: "template" });
  const mark = MARKS.provenance.create(attrs as unknown as Record<string, unknown>);
  const choose = options.choose ?? ((opts: string[]) => opts[0] ?? "");

  const paragraphs: PMNode[] = [];
  let blanks = 0;

  for (const line of body.split("\n")) {
    if (line.trim() === "") continue;

    const inline: PMNode[] = [];
    for (const token of tokenize(line)) {
      if (token.kind === "text") {
        if (token.text !== "") inline.push(NODES.text.schema.text(token.text, [mark]));
      } else if (token.kind === "choice") {
        const picked = choose(token.options);
        if (picked !== "") inline.push(NODES.text.schema.text(picked, [mark]));
      } else {
        blanks++;
        inline.push(NODES.wildcard.create({ hint: token.hint }));
      }
    }

    paragraphs.push(NODES.paragraph.create(null, inline));
  }

  // A phrase whose body is only whitespace still has to produce something
  // insertable, or the caller has to special-case it at every call site.
  if (paragraphs.length === 0) paragraphs.push(NODES.paragraph.create());

  return { content: Fragment.from(paragraphs), blanks };
}

/** Expand a stored phrase. Convenience over `expand(phrase.body, …)`. */
export function expandPhrase(phrase: Phrase, options?: ExpandOptions): Expansion {
  return expand(phrase.body, options);
}

/**
 * How many blanks a phrase will leave behind, without expanding it.
 *
 * The picker shows this — "3 blanks" — because a clinician choosing between two
 * similar phrases at speed needs to know which one is about to demand three
 * more decisions from them.
 */
export function countBlanks(body: string): number {
  let n = 0;
  for (const line of body.split("\n")) {
    for (const token of tokenize(line)) if (token.kind === "blank") n++;
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Blank traversal                                                     */
/* ------------------------------------------------------------------ */

/** A blank in the document, by position. */
export interface Blank {
  pos: number;
  hint: string;
}

/** Every unfilled blank, in document order. */
export function blanks(doc: PMNode): Blank[] {
  const out: Blank[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === "wildcard") {
      out.push({ pos, hint: wildcardHint(node) });
      return false;
    }
    return true;
  });
  return out;
}

/**
 * The next blank at or after `from`, wrapping to the start.
 *
 * This is F2. It wraps because a clinician who has filled the last blank and
 * presses F2 again is asking "is there anything left?", and answering "no"
 * silently by doing nothing is indistinguishable from a broken key.
 */
export function nextBlank(doc: PMNode, from: number): Blank | null {
  const all = blanks(doc);
  const first = all[0];
  if (first === undefined) return null;
  return all.find((b) => b.pos > from) ?? first;
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/**
 * Rank phrases against what the clinician has typed so far.
 *
 * Prefix matches beat substring matches beat description matches, and ties keep
 * the library's own order. Nothing cleverer: fuzzy matching in a picker where
 * `.ap` and `.aphasia` are both real phrases produces a top hit that changes as
 * you type, and the muscle memory that makes dot phrases fast depends on the
 * top hit being stable.
 */
export function searchPhrases(phrases: readonly Phrase[], query: string): Phrase[] {
  const q = query.trim().toLowerCase().replace(/^\./, "");
  if (q === "") return [...phrases];

  const scored: { phrase: Phrase; score: number; index: number }[] = [];
  phrases.forEach((phrase, index) => {
    const id = phrase.id.toLowerCase();
    const label = phrase.label.toLowerCase();
    const description = (phrase.description ?? "").toLowerCase();

    let score = -1;
    if (id.startsWith(q)) score = 3;
    else if (id.includes(q)) score = 2;
    else if (label.toLowerCase().includes(q)) score = 1;
    else if (description.includes(q)) score = 0;

    if (score >= 0) scored.push({ phrase, score, index });
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((s) => s.phrase);
}

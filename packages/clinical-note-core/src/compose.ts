/**
 * What a note is made of.
 *
 * A 2022 analysis of over 100 million notes found 50.1% of all note text
 * duplicated from prior documentation on the same patient; an earlier UCSF
 * study of 23,630 progress notes put manual entry at 18%, copied at 46% and
 * imported at 36%. Copy-and-paste has been implicated in roughly a third of
 * errors in ambulatory patient-safety analyses.
 *
 * Those numbers exist because someone went and measured a corpus after the
 * fact. The point of this module is that the note can measure *itself*, at the
 * moment of signing, while the author can still do something about it.
 *
 * Every function here is a pure function of the document. Nothing is cached,
 * nothing is stateful, and the whole file is measured in microseconds on a
 * realistic note — which is what lets the gate run it on every keystroke
 * without the host having to think about scheduling.
 */

import type { Node as PMNode } from "prosemirror-model";
import { ORIGINS, provenanceRanges, type Origin, type ProvenanceAttrs } from "./provenance.js";

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

/** Character counts and ratios by origin. */
export interface Composition {
  /** Characters attributed to each origin. Every origin is present, possibly 0. */
  chars: Record<Origin, number>;
  /** Share of the note per origin, in [0, 1]. Sums to 1 unless the note is empty. */
  ratio: Record<Origin, number>;
  /** Total characters counted. */
  total: number;
}

function zeroed(): Record<Origin, number> {
  // Built by iterating ORIGINS rather than as an object literal so that adding
  // a seventh origin cannot leave a hole here.
  const out = {} as Record<Origin, number>;
  for (const o of ORIGINS) out[o] = 0;
  return out;
}

/**
 * Measure a document.
 *
 * Counts characters, not words or nodes. Words invite an argument about what a
 * word is that nobody in a clinical review wants to have, and node counts
 * reward fragmentation — a paragraph edited in ten places would report as more
 * copied text than the same paragraph untouched.
 *
 * Whitespace is counted. Excluding it produces a ratio that quietly disagrees
 * with the character offsets the gate reports, and two numbers that should
 * match but do not is worse than one number that is slightly generous.
 */
export function composition(doc: PMNode): Composition {
  const chars = zeroed();
  let total = 0;

  for (const range of provenanceRanges(doc)) {
    const n = range.text.length;
    chars[range.origin] += n;
    total += n;
  }

  const ratio = zeroed();
  if (total > 0) {
    for (const o of ORIGINS) ratio[o] = chars[o] / total;
  }

  return { chars, ratio, total };
}

/**
 * The share of the note that came from earlier documentation, in [0, 1].
 *
 * `copied` only. Template text is boilerplate but it is boilerplate the author
 * chose in this encounter; pulled data is current by definition. Folding either
 * into this number would make it a measure of "text you did not personally
 * type", which is a different and much less interesting fact — most good notes
 * would score badly on it.
 */
export function copiedRatio(doc: PMNode): number {
  return composition(doc).ratio.copied;
}

/* ------------------------------------------------------------------ */
/* Unreviewed generated text                                           */
/* ------------------------------------------------------------------ */

/** An AI-drafted passage nobody has read yet. */
export interface UnreviewedPassage {
  from: number;
  to: number;
  text: string;
  /** The model or vendor that produced it, when the host recorded one. */
  source: string | null;
}

/**
 * Every AI range still marked unreviewed, coalesced and in document order.
 *
 * This is what disables the sign button. CMS's July 2025 revision of its
 * Medicare signature guidance treats an AI scribe exactly as it treats a human
 * one — the clinician signs, and the clinician is accountable for every word,
 * with no obligation to name the tool. That makes attribution *our* feature
 * rather than a compliance checkbox, and it makes the review gate the thing
 * that actually protects the signer: if generated text is visually identical to
 * typed text, "I reviewed it" is unfalsifiable, including to the person saying
 * it.
 */
export function unreviewedAi(doc: PMNode): UnreviewedPassage[] {
  return provenanceRanges(doc, (a) => a.origin === "ai" && !a.reviewed).map((r) => ({
    from: r.from,
    to: r.to,
    text: r.text,
    source: r.attrs.source,
  }));
}

/* ------------------------------------------------------------------ */
/* Stale pulls                                                         */
/* ------------------------------------------------------------------ */

/** A pulled value older than the host's threshold. */
export interface StalePull {
  from: number;
  to: number;
  text: string;
  source: string | null;
  /** How old the value was at the moment it was checked. */
  ageMs: number;
}

/**
 * Pulled ranges older than `maxAgeMs`.
 *
 * `now` is required and has no default, here and everywhere else in this
 * package. A four-hour-old potassium and a current one are different facts, and
 * which one a note contains is decided by a clock the host controls — not by
 * whatever the browser on a ward workstation believes the time to be.
 */
export function stalePulls(doc: PMNode, maxAgeMs: number, now: Date): StalePull[] {
  const out: StalePull[] = [];
  for (const range of provenanceRanges(doc, (a) => a.origin === "pulled" && a.at !== null)) {
    const at = Date.parse(range.attrs.at ?? "");
    if (Number.isNaN(at)) continue;
    const age = now.getTime() - at;
    if (age > maxAgeMs) {
      out.push({
        from: range.from,
        to: range.to,
        text: range.text,
        source: range.attrs.source,
        ageMs: age,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Foreign content                                                     */
/* ------------------------------------------------------------------ */

/** Text in this note that carries another patient's identifier. */
export interface ForeignRange {
  from: number;
  to: number;
  text: string;
  /** The subject the text was copied from. */
  source: string;
}

/**
 * Ranges copied from a different patient's chart.
 *
 * Two charts open in two tabs, text copied from one into the other, is the most
 * common route to wrong-patient documentation that there is. It is only
 * detectable because copied ranges carry the subject they came from — which is
 * a thing worth doing even if nothing else in this file existed.
 *
 * `subject` is the reference of the note being written, e.g. `Patient/4471902`.
 * Both sides are compared by type and id, so a versioned (`/_history/2`) or
 * absolute (`https://…/Patient/1`) reference to the same patient is not foreign.
 * Two absolute references on different servers are foreign even with the same
 * id: ids are only unique within one server.
 */
export function foreignContent(doc: PMNode, subject: string): ForeignRange[] {
  const out: ForeignRange[] = [];
  for (const range of provenanceRanges(doc, isForeign(subject))) {
    out.push({
      from: range.from,
      to: range.to,
      text: range.text,
      source: range.attrs.source ?? "",
    });
  }
  return out;
}

function isForeign(subject: string): (a: ProvenanceAttrs) => boolean {
  const own = referenceKey(subject);
  return (a) => {
    if (a.origin !== "copied" || a.source === null) return false;
    const source = referenceKey(a.source);
    if (source?.type !== "Patient") return false;
    // A subject we cannot read matches no patient, as the string compare did.
    if (own?.type !== "Patient" || own.id !== source.id) return true;
    // A relative reference lives on the note's own server, so only two
    // absolute bases can disagree.
    return own.base !== null && source.base !== null && own.base !== source.base;
  };
}

// `Type/id`, optionally `/_history/vid`, at the end of a relative or absolute reference.
const REFERENCE =
  /(?:^|\/)([A-Z][A-Za-z]*)\/([A-Za-z0-9\-.]{1,64})(?:\/_history\/[A-Za-z0-9\-.]{1,64})?$/;

/**
 * A FHIR reference reduced to server base, type and id; version, query and
 * fragment dropped. `base` is null for a relative reference.
 */
function referenceKey(reference: string): { base: string | null; type: string; id: string } | null {
  const path = (reference.trim().split(/[?#]/)[0] ?? "").replace(/\/+$/, "");
  const match = REFERENCE.exec(path);
  if (!match) return null;
  const base = path.slice(0, match.index).toLowerCase();
  return { base: base === "" ? null : base, type: match[1] ?? "", id: match[2] ?? "" };
}

/* ------------------------------------------------------------------ */
/* Diff                                                                */
/* ------------------------------------------------------------------ */

/** One step of a line-level difference. */
export interface DiffLine {
  kind: "same" | "added" | "removed";
  text: string;
}

/**
 * A line-level diff of two notes' plain text.
 *
 * Deliberately line-level and deliberately simple: a standard LCS over lines.
 * A character-level diff of clinical prose produces a shimmer of single-letter
 * changes that nobody can read, and the question the reader is actually asking
 * — "what is different about today's note?" — is answered at the line.
 *
 * This is the mechanism behind all three diff views the brief describes: versus
 * the previous signed version, versus the AI draft, and versus yesterday's
 * note. One implementation, three uses.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const width = b.length + 1;

  // Classic LCS table, in one flat Int32Array. Notes are hundreds of lines, not
  // millions, so the quadratic table is the right trade against the complexity
  // of Myers — and a typed array indexes as `number` rather than
  // `number | undefined`, which keeps the inner loop free of assertions.
  const lcs = new Int32Array((a.length + 1) * width);
  // Reading past the table is genuinely zero in LCS terms — the suffix beyond
  // either string shares nothing — so the fallback is the correct value rather
  // than a way of silencing the checker.
  const len = (i: number, j: number): number => lcs[i * width + j] ?? 0;

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[i] === b[j] ? len(i + 1, j + 1) + 1 : Math.max(len(i + 1, j), len(i, j + 1));
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const left = a[i] ?? "";
    const right = b[j] ?? "";
    if (left === right) {
      out.push({ kind: "same", text: left });
      i++;
      j++;
    } else if (len(i + 1, j) >= len(i, j + 1)) {
      out.push({ kind: "removed", text: left });
      i++;
    } else {
      out.push({ kind: "added", text: right });
      j++;
    }
  }
  while (i < a.length) out.push({ kind: "removed", text: a[i++] ?? "" });
  while (j < b.length) out.push({ kind: "added", text: b[j++] ?? "" });

  return out;
}

/**
 * The answer, and the three registers it can be in.
 *
 * A model that answers everything in the same assured register teaches
 * clinicians to trust everything equally, which is the definition of
 * miscalibrated trust. So an answer here is never just text — it carries a
 * **register** that the skin renders with different typography, not just
 * different words. A clinician should be able to tell which of the three they
 * are looking at from across the room.
 *
 *   `grounded` — claims are tied to retrieved sources.
 *   `general`  — model knowledge, no retrieval. Visibly marked.
 *   `declined` — out of scope, or blocked. No clinical content at all.
 *
 * The register is *derived*, never asserted by the provider. A provider that
 * could declare its own answer grounded would eventually declare an ungrounded
 * one grounded, and the entire verification story rests on that not happening.
 */

import type { Claim, Source } from "./provider.js";

export type AnswerRegister = "grounded" | "general" | "declined";

export interface Answer {
  readonly text: string;
  /** Reasoning narrative, kept apart so it can never render as the answer. */
  readonly reasoning: string;
  readonly sources: ReadonlyMap<number, Source>;
  readonly claims: readonly Claim[];
  readonly register: AnswerRegister;
  /** True when the stream stopped early. Rendered as "partial", never hidden. */
  readonly partial: boolean;
}

export const EMPTY_ANSWER: Answer = {
  text: "",
  reasoning: "",
  sources: new Map(),
  claims: [],
  register: "general",
  partial: false,
};

/**
 * Spans of the answer with no supporting claim.
 *
 * This is what makes "uncited-claim marking" possible: silence about provenance
 * is the failure mode, so the component has to know which sentences nobody
 * vouched for. Returned as ranges rather than a boolean so the skin can mark
 * them inline rather than downgrade the whole answer.
 */
export function uncitedSpans(answer: Answer): readonly (readonly [number, number])[] {
  if (answer.text.length === 0) return [];
  const covered = [...answer.claims]
    .map((c) => c.span)
    .sort((a, b) => a[0] - b[0]);

  const gaps: Array<readonly [number, number]> = [];
  let cursor = 0;
  for (const [start, end] of covered) {
    if (start > cursor) gaps.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < answer.text.length) gaps.push([cursor, answer.text.length]);

  // A gap with no word character in it is not an uncited claim — it is the
  // space, comma or full stop between two cited ones. Real providers do not
  // emit character-perfect spans, and treating a stray trailing period as an
  // unsupported assertion would put a warning marker on almost every answer.
  return gaps.filter(([start, end]) => /\w/.test(answer.text.slice(start, end)));
}

/** Proportion of non-whitespace answer text covered by a claim. */
/**
 * Proportion of the answer's *words* covered by a claim.
 *
 * Counted in word characters rather than raw length so that punctuation and
 * whitespace between spans cannot drag the figure below a threshold. The number
 * feeds a release-relevant decision — whether an answer renders as grounded —
 * and it should not move because a provider's span stopped one character short
 * of a full stop.
 */
export function citationCoverage(answer: Answer): number {
  const total = countWordChars(answer.text);
  if (total === 0) return 1;
  const uncited = uncitedSpans(answer).reduce(
    (sum, [start, end]) => sum + countWordChars(answer.text.slice(start, end)),
    0,
  );
  return Math.max(0, Math.min(1, (total - uncited) / total));
}

function countWordChars(text: string): number {
  return (text.match(/\w/g) ?? []).length;
}

/**
 * Decide the register.
 *
 * Deliberately strict about `grounded`: it requires that the provider can cite
 * at all, that sources actually arrived, that the mode asked for them, and that
 * coverage clears a threshold. Anything short of all four is `general`, which
 * is not a punishment — it is an accurate label, and an accurately labelled
 * ungrounded answer is a perfectly good product.
 */
export function deriveRegister(options: {
  answer: Pick<Answer, "text" | "sources" | "claims">;
  providerCanCite: boolean;
  requireCitations: boolean;
  blocked: boolean;
  /** Minimum share of the answer that must be attributed. */
  threshold?: number;
}): AnswerRegister {
  const { answer, providerCanCite, requireCitations, blocked, threshold = 0.6 } = options;
  if (blocked) return "declined";
  if (answer.text.trim().length === 0) return "declined";
  if (!providerCanCite || !requireCitations) return "general";
  if (answer.sources.size === 0 || answer.claims.length === 0) return "general";
  const coverage = citationCoverage({ ...EMPTY_ANSWER, ...answer });
  return coverage >= threshold ? "grounded" : "general";
}

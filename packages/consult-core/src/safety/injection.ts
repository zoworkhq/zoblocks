/**
 * Injection detection, as defence in depth behind the fence.
 *
 * The fence in `context.ts` is the control. This file is the alarm.
 *
 * That ordering matters, because injection *detection* is known to be
 * insufficient on its own in healthcare, and the reason is worth stating
 * precisely: the dangerous requests in a clinical setting are fluent and
 * legitimate-looking. "Export this patient's chart to the covering physician"
 * carries no jailbreak signal — as a sentence it is unremarkable. What makes it
 * an attack is that nobody authorised it, and no text classifier can see
 * authorisation.
 *
 * So this module does not try to decide whether content is malicious. It
 * reports **how much instruction-shaped material was found in a channel that
 * should contain none**, which is a question with an answer. A clinical note
 * containing "ignore previous instructions" is anomalous whether or not anyone
 * meant harm by it, and an operator should hear about it either way.
 */

export type InjectionSeverity = "none" | "suspicious" | "hostile";

export interface InjectionVerdict {
  readonly severity: InjectionSeverity;
  /** Rule names, never matched text — the text belongs in the record, not the log. */
  readonly rules: readonly string[];
  /** Instruction-shaped phrases neutralised while fencing, from `context.ts`. */
  readonly neutralised: number;
  /**
   * Whether to proceed. `suspicious` proceeds — a note quoting a patient's
   * email is not an attack, and blocking on it would make the component
   * unusable in exactly the messy real-world charts it exists to summarise.
   */
  readonly blocking: boolean;
}

interface Rule {
  readonly name: string;
  readonly pattern: RegExp;
  readonly weight: number;
}

/**
 * Weighted rather than boolean.
 *
 * A single hit is usually noise. Several together, in a document that should
 * contain none, is a signal. Weights are ordinal, not calibrated — they exist
 * to rank, and the thresholds below are deliberately round numbers rather than
 * numbers pretending to be derived.
 */
const RULES: readonly Rule[] = [
  { name: "override.ignore", pattern: /ignore (?:all |any )?(?:previous|prior|above) instructions?/i, weight: 5 },
  { name: "override.disregard", pattern: /disregard (?:all |any )?(?:previous|prior|above)/i, weight: 5 },
  { name: "override.forget", pattern: /forget (?:everything|all) (?:you|above)/i, weight: 4 },
  { name: "role.reassign", pattern: /you are (?:now )?(?:a|an|the) [a-z ]{3,40}(?:assistant|model|agent|system)/i, weight: 4 },
  { name: "role.impersonate", pattern: /^\s*(?:system|assistant|developer)\s*:/im, weight: 4 },
  { name: "delimiter.chatml", pattern: /<\|(?:im_start|im_end|system|assistant|user)\|>/i, weight: 5 },
  { name: "delimiter.xmlish", pattern: /<\/?(?:system|instructions?|prompt)>/i, weight: 3 },
  { name: "exfil.send", pattern: /\b(?:send|email|post|upload|export|forward)\b[^.\n]{0,40}\b(?:to|at)\b[^.\n]{0,40}(?:https?:\/\/|@|external)/i, weight: 5 },
  { name: "exfil.url", pattern: /\b(?:curl|fetch|wget|http-request)\b/i, weight: 3 },
  { name: "secret.request", pattern: /\b(?:reveal|print|show|repeat)\b[^.\n]{0,30}\b(?:system prompt|instructions|api key|token)\b/i, weight: 5 },
  { name: "tool.invoke", pattern: /\b(?:call|invoke|execute|run)\s+(?:the\s+)?(?:tool|function|command)\b/i, weight: 3 },
  { name: "encoding.base64-blob", pattern: /[A-Za-z0-9+/]{120,}={0,2}/, weight: 2 },
];

const SUSPICIOUS_AT = 4;
const HOSTILE_AT = 8;

/**
 * Scan text that is supposed to be data.
 *
 * `neutralised` comes from the fencing pass and is folded into the score: text
 * that already had to be defanged is, by definition, text that contained
 * instruction shapes.
 */
export function classifyInjection(
  text: string,
  options: { neutralised?: number } = {},
): InjectionVerdict {
  const neutralised = options.neutralised ?? 0;
  const hits = RULES.filter((r) => r.pattern.test(text));
  const score = hits.reduce((total, r) => total + r.weight, 0) + neutralised * 3;

  const severity: InjectionSeverity =
    score >= HOSTILE_AT ? "hostile" : score >= SUSPICIOUS_AT ? "suspicious" : "none";

  return {
    severity,
    rules: hits.map((r) => r.name),
    neutralised,
    // Only `hostile` blocks. `suspicious` proceeds and is audited, because a
    // discharge summary that quotes a phishing email the patient received is
    // suspicious and entirely legitimate, and a component that refused to
    // summarise it would be refusing the job.
    blocking: severity === "hostile",
  };
}

/** Scan every fenced block and take the worst. */
export function classifyBlocks(
  blocks: readonly { readonly text: string }[],
  options: { neutralised?: number } = {},
): InjectionVerdict {
  const joined = blocks.map((b) => b.text).join("\n");
  return classifyInjection(joined, options);
}

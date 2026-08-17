/**
 * Post-stream checks against the mode's output contract.
 *
 * Everything here runs *after* the answer is complete and *before* it is
 * presented as clinical content. The governing rule: **a check may downgrade,
 * flag or refuse. It may never rewrite.**
 *
 * Silently editing a clinical answer so it passes a check is the worst option
 * in the space — it changes meaning without telling anyone, and it makes the
 * audit log a record of something the model did not say. A downgrade from
 * `grounded` to `general` is honest. A flag beside a dose is honest. A rewrite
 * is a fabrication with good intentions.
 */

import { citationCoverage, deriveRegister, type Answer, type AnswerRegister } from "./answer.js";
import { containsDosing } from "./actions.js";
import { findStigma, type StigmaFinding } from "./language.js";
import type { ConsultMode } from "./modes.js";

export type CheckCode =
  | "citation-coverage"
  | "claim-count"
  | "dosing-forbidden"
  | "diagnosis-forbidden"
  | "stigmatising-language"
  | "empty-answer";

export type CheckSeverity =
  /** Render a marker beside the content. The answer stands. */
  | "flag"
  /** Drop the answer out of the `grounded` register. */
  | "downgrade"
  /** Do not present as clinical content at all. */
  | "refuse";

export interface CheckFinding {
  readonly code: CheckCode;
  readonly severity: CheckSeverity;
  /** Shown to the clinician. Written for them, not for an operator. */
  readonly message: string;
  /** Character offset where relevant, for inline marking. */
  readonly index?: number;
  readonly detail?: string;
}

export interface CheckResult {
  readonly findings: readonly CheckFinding[];
  readonly register: AnswerRegister;
  /** Convenience: any finding at `refuse`. */
  readonly refused: boolean;
  readonly stigma: readonly StigmaFinding[];
}

/**
 * Phrases that assert a diagnosis rather than support one.
 *
 * Narrow on purpose. "This is consistent with" is fine and is how clinicians
 * actually write; "the patient has X" is an assertion. The line is drawn at
 * whether the sentence leaves room for the clinician's judgement, which is the
 * same line the FDA's fourth criterion draws.
 */
const DIAGNOSTIC_ASSERTION =
  /\b(?:the\s+)?(?:patient|this\s+patient|he|she|they)\s+(?:has|have|is\s+suffering\s+from|is\s+diagnosed\s+with)\s+(?!no\b|not\b)[a-z]/i;

const DEFINITIVE_FRAMING =
  /\b(?:this\s+is\s+(?:definitely|certainly|clearly)|the\s+diagnosis\s+is|you\s+should\s+diagnose)\b/i;

export interface RunChecksOptions {
  readonly answer: Answer;
  readonly mode: ConsultMode;
  readonly providerCanCite: boolean;
  readonly blocked?: boolean;
  /** Minimum citation coverage for the `grounded` register. */
  readonly coverageThreshold?: number;
}

export function runChecks(options: RunChecksOptions): CheckResult {
  const { answer, mode, providerCanCite, blocked = false, coverageThreshold = 0.6 } = options;
  const findings: CheckFinding[] = [];

  if (!blocked && answer.text.trim().length === 0) {
    findings.push({
      code: "empty-answer",
      severity: "refuse",
      message: "No answer was produced.",
    });
  }

  // Citation coverage. A downgrade rather than a refusal: an uncited answer is
  // still useful when it is labelled as uncited, and refusing it would push
  // clinicians toward a chat window with no labelling at all.
  if (mode.output.requireCitations && providerCanCite && answer.text.trim().length > 0) {
    const coverage = citationCoverage(answer);
    if (coverage < coverageThreshold) {
      findings.push({
        code: "citation-coverage",
        severity: "downgrade",
        message: "Parts of this answer are not supported by a source.",
        detail: `${Math.round(coverage * 100)}% of the answer is attributed.`,
      });
    }
  }

  if (mode.output.maxClaims !== undefined && answer.claims.length > mode.output.maxClaims) {
    findings.push({
      code: "claim-count",
      severity: "flag",
      message: "This answer covers more ground than the mode is configured for.",
      detail: `${answer.claims.length} claims, limit ${mode.output.maxClaims}.`,
    });
  }

  // Dosing. Always a flag even where permitted — §6 says any numeric dose in
  // the output is marked for verification regardless of confidence, because a
  // transcription error in a drug dose is the classic harm and it is cheap to
  // ask someone to look twice.
  if (containsDosing(answer.text)) {
    findings.push({
      code: "dosing-forbidden",
      severity: mode.output.forbidDosing ? "refuse" : "flag",
      message: mode.output.forbidDosing
        ? "This mode does not provide dosing. Check the formulary directly."
        : "Verify every dose against your formulary before acting.",
    });
  }

  if (mode.output.forbidDiagnosis) {
    const assertion = DIAGNOSTIC_ASSERTION.exec(answer.text);
    const definitive = DEFINITIVE_FRAMING.exec(answer.text);
    const hit = assertion ?? definitive;
    if (hit) {
      findings.push({
        code: "diagnosis-forbidden",
        severity: "downgrade",
        message: "This reads as a diagnosis rather than support for one.",
        index: hit.index,
      });
    }
  }

  const stigma = findStigma(answer.text);
  for (const finding of stigma) {
    findings.push({
      code: "stigmatising-language",
      severity: "flag",
      message: `Consider "${finding.prefer}" rather than "${finding.term}".`,
      detail: finding.why,
      index: finding.index,
    });
  }

  const refused = findings.some((f) => f.severity === "refuse");
  const downgraded = refused || findings.some((f) => f.severity === "downgrade");

  const register: AnswerRegister = refused
    ? "declined"
    : downgraded
      ? "general"
      : deriveRegister({
          answer,
          providerCanCite,
          requireCitations: mode.output.requireCitations,
          blocked,
          threshold: coverageThreshold,
        });

  return { findings, register, refused, stigma };
}

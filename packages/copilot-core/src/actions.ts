/**
 * Actions: propose, confirm, attribute.
 *
 * The moment a copilot can *do* something rather than *say* something it
 * becomes a different product with a different risk profile. One pattern makes
 * that survivable and it has no exceptions:
 *
 *   1. The model emits a **proposal** — a structured object, never free text.
 *   2. The UI renders it as a reviewable diff, with reasoning and sources.
 *   3. A human **confirms**, deliberately and distinguishably from dismissing.
 *   4. The host **executes**, and provenance attributes the act to the human.
 *
 * The temptation to collapse steps 2 and 3 is enormous and is always framed as
 * saving clicks. The specific failure it prevents is worth naming: an agent
 * with standing write access to an EHR, reading an inbound patient-portal
 * message that contains a hidden instruction, and executing it before any human
 * sees the message. That is a documented indirect-injection pattern, not a
 * hypothetical, and the propose/confirm boundary is what makes it survivable.
 *
 * The type system carries the rule. `commit()` accepts only a
 * `ConfirmedProposal`, and the only way to obtain one is `confirmProposal()`,
 * which requires a human actor. There is no path from a `CopilotEvent` to a
 * committed write that does not pass through a person.
 */

import type { Reference } from "./fhir-types.js";

/* ------------------------------------------------------------------ */
/* Tools                                                               */
/* ------------------------------------------------------------------ */

/**
 * A tool the model asked to call.
 *
 * Whether it *may* is decided by the mode's allowlist in core, not by the
 * prompt. A prompt is not a permission system: it is a string that a
 * sufficiently motivated input can talk around, and §12 is a list of ways
 * people have.
 */
export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Readonly<Record<string, unknown>>;
}

export type ToolDecision =
  { readonly allowed: true } | { readonly allowed: false; readonly reason: string };

/**
 * Is this tool permitted in this mode?
 *
 * Deliberately not a method on the mode: keeping it a free function means the
 * check can be run again server-side against the same mode definition, which
 * is where it actually matters. A client-side allowlist stops mistakes; a
 * server-side one stops attacks.
 */
export function decideTool(allowedTools: readonly string[], call: ToolCall): ToolDecision {
  if (allowedTools.includes(call.name)) return { allowed: true };
  return {
    allowed: false,
    reason:
      allowedTools.length === 0
        ? `This mode allows no tools, and the model attempted "${call.name}".`
        : `"${call.name}" is not in this mode's allowlist (${allowedTools.join(", ")}).`,
  };
}

/* ------------------------------------------------------------------ */
/* Proposals                                                           */
/* ------------------------------------------------------------------ */

/**
 * What a proposal would do, by risk class.
 *
 * The classes drive the confirmation UI: `routine` gets a plain confirm,
 * `elevated` gets a diff the user must scroll, `prohibited` never renders a
 * confirm control at all and is reported as a contract violation.
 */
export type ProposalRisk = "routine" | "elevated" | "prohibited";

export type ProposalKind =
  /** Text for a note the clinician is writing. The safest and most common. */
  | "note-text"
  /** A suggested addition to the problem list. */
  | "problem-list"
  /** An unsigned draft order set. Signing is never in scope. */
  | "draft-order"
  /** Patient-education material to hand over. */
  | "patient-education"
  /** A referral letter draft. */
  | "referral-draft";

/**
 * Kinds that always need friction, whatever the content.
 *
 * Anything with a dose or a route, anything leaving the organisation, and
 * anything a patient will read. The list is short because it should be
 * reviewable at a glance.
 */
const ELEVATED_KINDS: ReadonlySet<ProposalKind> = new Set<ProposalKind>([
  "draft-order",
  "patient-education",
  "referral-draft",
]);

export interface ActionProposal {
  readonly id: string;
  readonly kind: ProposalKind;
  /** One line, imperative, describing what will happen. Rendered as the heading. */
  readonly summary: string;
  /** The proposed content. Rendered as a diff against `replaces` when present. */
  readonly content: string;
  /** Existing text this would replace, if any. Absent means an insertion. */
  readonly replaces?: string;
  /** Citation markers supporting this proposal. */
  readonly markers?: readonly number[];
  /** Where it would be written. Opaque to core; meaningful to the host. */
  readonly target?: Reference;
}

/**
 * Classify a proposal.
 *
 * `forbidDosing` comes from the mode's output contract. A mode that forbids
 * dosing and receives a proposal containing one has not received a risky
 * proposal — it has received evidence that something upstream is not behaving,
 * which is why the result is `prohibited` rather than `elevated`.
 */
export function classifyProposal(
  proposal: ActionProposal,
  options: { forbidDosing?: boolean } = {},
): ProposalRisk {
  if (options.forbidDosing && containsDosing(proposal.content)) return "prohibited";
  if (ELEVATED_KINDS.has(proposal.kind)) return "elevated";
  return "routine";
}

/**
 * Does this text carry a dose?
 *
 * Intentionally over-inclusive. A false positive costs one extra confirmation
 * step; a false negative costs a dose nobody checked. The asymmetry is not
 * close, so the pattern errs toward catching.
 */
const DOSE_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:mcg|microgram|micrograms|mg|milligram|milligrams|g|gram|grams|kg|ml|millilitre|millilitres|milliliter|milliliters|l|unit|units|iu|mmol|mEq|meq)\b/i;
const FREQUENCY_PATTERN = /\b(?:od|bd|tds|qds|qid|tid|bid|prn|nocte|mane|q\d+h)\b/i;
/**
 * "Daily", "weekly" and "hourly" are dosing only beside a medication: "once
 * daily", "take it daily", "daily dose". "Attends weekly sessions" is not.
 */
const MEDICATION_FREQUENCY =
  /\b(?:(?:once|twice|thrice|(?:one|two|three|four)\s+times)\s+(?:a\s+day|daily|weekly|hourly)|(?:take|taken|taking|give|given|administer(?:ed)?|apply|applied|inject(?:ed)?|tablets?|capsules?|puffs?|drops?|sachets?|patch(?:es)?|injections?)\b(?:\s+\w+){0,3}?\s+(?:daily|weekly|hourly)|(?:daily|weekly|hourly)\s+(?:doses?|dosing|tablets?|injections?))\b/i;

/**
 * A medication-like word: a common drug-name suffix, a common drug, or a route.
 * Over-inclusive on purpose: "bisoprolol daily" is dosing without a unit.
 */
const MEDICATION =
  "(?:[a-z]{2,}(?:olol|pril|sartan|statin|formin|azole|cillin|mycin|prazole|oxacin|cycline|pine|done|pam|lam|parin|xaban|gliptin|gliflozin|triptan|tidine|semide|thiazide|olone|asone|isone|profen|oxetine|alopram|tyline|ipramine|mab|nib)" +
  "|aspirin|warfarin|paracetamol|acetaminophen|ibuprofen|naproxen|insulin|levothyroxine|thyroxine|digoxin|lithium|sertraline|mirtazapine|venlafaxine|duloxetine|gabapentin|pregabalin|spironolactone|methotrexate|allopurinol|colchicine|clopidogrel|tramadol|morphine|codeine|levetiracetam|lamotrigine|valproate|carbamazepine|haloperidol|tamsulosin|finasteride|salbutamol|albuterol|montelukast|ondansetron|folic\\s+acid|vitamin\\s+[a-z]\\d*" +
  "|oral(?:ly)?|po|iv|im|sc|sl|subcut\\w*|intravenous(?:ly)?|intramuscular(?:ly)?|inhaled|nebuli[sz]ed|topical(?:ly)?|sublingual(?:ly)?|transdermal(?:ly)?|by\\s+mouth)";
const FREQUENCY_WORD = "(?:daily|weekly|hourly|nightly|monthly|fortnightly)";
const DRUG_FREQUENCY = new RegExp(
  `\\b${MEDICATION}\\b(?:\\s+\\w+){0,2}?\\s+${FREQUENCY_WORD}\\b|\\b${FREQUENCY_WORD}\\s+(?:\\w+\\s+)?${MEDICATION}\\b`,
  "i",
);

export function containsDosing(text: string): boolean {
  return (
    DOSE_PATTERN.test(text) ||
    FREQUENCY_PATTERN.test(text) ||
    MEDICATION_FREQUENCY.test(text) ||
    DRUG_FREQUENCY.test(text)
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation                                                        */
/* ------------------------------------------------------------------ */

/** The human who confirmed. Becomes `Provenance.agent.who`. */
export interface Actor {
  readonly display: string;
  readonly reference?: string;
  readonly credential?: string;
}

/**
 * A proposal a person has actually confirmed.
 *
 * Deliberately unconstructable except through `confirmProposal`. The private
 * brand is not ceremony — it is what stops a future refactor from passing a
 * raw `ActionProposal` to `commit()` because the shapes looked compatible.
 */
export interface ConfirmedProposal {
  readonly proposal: ActionProposal;
  readonly actor: Actor;
  /** ISO 8601, supplied by the caller. This package never reads a clock. */
  readonly confirmedAt: string;
  /**
   * Milliseconds between the proposal rendering and the confirmation.
   *
   * Recorded because §17 needs it: a median under two seconds means the
   * confirm step has become reflexive, which means it is laundering the
   * model's output as human judgement while adding no scrutiny. That is worse
   * than having no confirm step, and the only way to know is to measure.
   */
  readonly dwellMs: number;
  readonly __confirmed: true;
}

export class ProposalProhibitedError extends Error {
  readonly code = "proposal-prohibited" as const;
  constructor(
    readonly proposalId: string,
    reason: string,
  ) {
    super(`Proposal ${proposalId} cannot be confirmed: ${reason}`);
    this.name = "ProposalProhibitedError";
  }
}

/**
 * The only way to produce a `ConfirmedProposal`.
 *
 * Throws on a prohibited proposal rather than returning a result, for the same
 * reason `PhiNotPermittedError` throws: there is no sensible UI for "you have
 * confirmed something the mode forbids", and a caller who reached here has a
 * bug that should stop them.
 */
export function confirmProposal(
  proposal: ActionProposal,
  actor: Actor,
  meta: { confirmedAt: string; dwellMs: number; forbidDosing?: boolean },
): ConfirmedProposal {
  const risk = classifyProposal(proposal, { forbidDosing: meta.forbidDosing });
  if (risk === "prohibited") {
    throw new ProposalProhibitedError(
      proposal.id,
      "it contains dosing information and the active mode forbids dosing output",
    );
  }
  return {
    proposal,
    actor,
    confirmedAt: meta.confirmedAt,
    dwellMs: meta.dwellMs,
    __confirmed: true,
  };
}

/** Was this confirmation plausibly considered, or reflexive? See §17. */
export function isReflexive(confirmed: ConfirmedProposal, thresholdMs = 2000): boolean {
  return confirmed.dwellMs < thresholdMs;
}

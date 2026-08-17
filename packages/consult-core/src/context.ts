/**
 * Context resolution and request assembly.
 *
 * Two jobs, deliberately in one file because they are the two halves of one
 * guarantee.
 *
 * **Resolution** asks the host for exactly the categories the active mode
 * declared, and requires the host to say what it withheld. The host owns access
 * control; this package owns never asking for more than the mode admitted to.
 *
 * **Assembly** is the single place in the entire codebase where the instruction
 * channel and the data channel meet. That is why it is one function, in one
 * file, with a test that fails if record text ever reaches the instruction side.
 * Indirect prompt injection — instructions hidden in retrieved content rather
 * than in what the user typed — is the failure mode most likely to produce a
 * headline, and in healthcare the retrieval corpus is the chart, the portal
 * message queue, and uploaded PDFs, all of which contain text written by people
 * outside the organisation.
 *
 * The containment rule: **record content is fenced, labelled, and never
 * concatenated into the instruction string.** The endpoint is expected to
 * reconstruct the same fence server-side, which is why `ContextBlock` carries
 * the label and resource type separately rather than a pre-joined blob.
 */

import { PhiNotPermittedError, consultError, type ConsultError } from "./errors.js";
import type { ClinicalResourceType, FhirResource, Reference } from "./fhir-types.js";
import { readsPatientData, type ConsultMode, type ExclusionCategory } from "./modes.js";
import type { ConsultProvider, ConsultRequest, ConsultTurn, ContextBlock } from "./provider.js";

/* ------------------------------------------------------------------ */
/* Withheld records                                                    */
/* ------------------------------------------------------------------ */

export type WithheldReason = ExclusionCategory | "break-glass-required" | "policy" | "unavailable";

/**
 * A category of record the host did not supply.
 *
 * `disclosable` exists because in some jurisdictions the *existence* of a
 * withheld record is itself protected — knowing a patient has a sealed record
 * can be as revealing as reading it. So the host decides whether the scope
 * strip says "2 records withheld" or says nothing, and Consult renders whichever
 * it is told. That judgement belongs to the deploying organisation's counsel,
 * not to a component author, and this field is the API saying so.
 */
export interface Withheld {
  readonly reason: WithheldReason;
  readonly count: number;
  readonly disclosable: boolean;
}

export interface ResolvedContext {
  readonly resources: readonly FhirResource[];
  /**
   * Required, not optional.
   *
   * An empty array is a positive claim of completeness and must be made
   * deliberately. The failure this prevents is precise: a patient has an SUD
   * treatment episode the copilot may not see, Consult summarises the record
   * without saying so, and the clinician reads a summary that appears complete
   * and is not. The system has actively created a false belief that would not
   * exist if the tool did not exist. "2 records withheld" is not a privacy
   * nicety — it is the difference between a redaction and a lie.
   */
  readonly withheld: readonly Withheld[];
  /** ISO 8601. Staleness is a clinical fact and the strip renders it. */
  readonly asOf: string;
}

export interface ContextRequest {
  readonly subject: Reference;
  readonly categories: readonly ClinicalResourceType[];
  readonly excludes: readonly ExclusionCategory[];
  /** Recorded in the AuditEvent's purposeOfEvent. */
  readonly purpose: "treatment";
}

export interface ConsultContextResolver {
  resolve(request: ContextRequest): Promise<ResolvedContext>;
}

/** True when anything was withheld that the clinician is allowed to know about. */
export function hasDisclosableWithholding(context: ResolvedContext): boolean {
  return context.withheld.some((w) => w.disclosable && w.count > 0);
}

/** Total count across disclosable withholdings. Drives "N records withheld". */
export function disclosableWithheldCount(context: ResolvedContext): number {
  return context.withheld.filter((w) => w.disclosable).reduce((total, w) => total + w.count, 0);
}

/**
 * Resolve context for a mode, or explain why not.
 *
 * Returns a discriminated result rather than throwing, because "the record was
 * unreachable" is a designed UI state — the answer renders as degraded and
 * names what is missing — whereas a PHI misconfiguration is a programming error
 * and throws.
 */
export type ContextOutcome =
  | { readonly ok: true; readonly context: ResolvedContext }
  | { readonly ok: false; readonly error: ConsultError };

export async function resolveContext(
  mode: ConsultMode,
  subject: Reference | undefined,
  resolver: ConsultContextResolver | undefined,
): Promise<ContextOutcome> {
  if (!readsPatientData(mode)) {
    return { ok: true, context: EMPTY_CONTEXT };
  }
  if (!subject || !resolver) {
    return {
      ok: false,
      error: consultError(
        "context-unavailable",
        `Mode "${mode.id}" reads patient data but no ${!subject ? "subject" : "resolver"} was supplied.`,
        { retryable: false },
      ),
    };
  }

  try {
    const context = await resolver.resolve({
      subject,
      categories: mode.reads,
      excludes: mode.excludes,
      purpose: "treatment",
    });
    return { ok: true, context };
  } catch (cause) {
    return {
      ok: false,
      error: consultError("context-unavailable", "The record could not be read.", {
        retryable: true,
        cause,
      }),
    };
  }
}

export const EMPTY_CONTEXT: ResolvedContext = {
  resources: [],
  withheld: [],
  asOf: "1970-01-01T00:00:00.000Z",
};

/* ------------------------------------------------------------------ */
/* Fencing                                                             */
/* ------------------------------------------------------------------ */

/**
 * Characters that let record text escape a fence or impersonate a role.
 *
 * Stripped rather than escaped. Escaping preserves the attack for whatever
 * downstream component forgets to unescape; stripping loses a little fidelity
 * in a clinical note and loses the whole attack with it. Given the note is
 * being summarised rather than transcribed, that is the correct trade.
 */
const FENCE_HAZARDS =
  // Control characters except tab, newline and carriage return; DEL; zero-width
  // and bidi marks; line and paragraph separators; bidi embeddings and isolates;
  // and the byte-order mark. Written as escapes rather than literals so the rule
  // stays greppable — a rule made of invisible characters is a rule nobody can
  // review, which rather defeats the purpose.
  //
  // Matching control characters is the entire point here: they are what let
  // record text escape a fence. The rule exists to catch them being matched by
  // accident, not on purpose.
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/**
 * Instruction-shaped phrases that have no business inside a clinical record.
 *
 * Neutralised by inserting a zero-width-free marker, not deleted, so a reviewer
 * reading the audit log can see that something tried. Deliberately short: this
 * is defence in depth behind the fence, not the fence itself. Treating a
 * blocklist as the primary control is the mistake that makes injection research
 * depressing to read.
 */
const INSTRUCTION_SHAPES = [
  /ignore (?:all |any )?(?:previous|prior|above) instructions?/gi,
  /disregard (?:all |any )?(?:previous|prior|above) instructions?/gi,
  /you are now (?:a|an) /gi,
  /system\s*(?:prompt|message)\s*:/gi,
  /<\|[a-z_]+\|>/gi,
  /\bassistant\s*:\s*$/gim,
];

export interface FenceResult {
  readonly text: string;
  /** How many instruction-shaped phrases were neutralised. Audited. */
  readonly neutralised: number;
}

/**
 * Make a piece of record text safe to place in the data channel.
 *
 * Not exported as "sanitise", because that word invites the belief that the
 * output is safe to concatenate anywhere. It is not. It is safe to put *inside
 * a fence*, and the fence is what does the work.
 */
export function fenceText(text: string): FenceResult {
  let neutralised = 0;
  let out = text.replace(FENCE_HAZARDS, "");
  for (const pattern of INSTRUCTION_SHAPES) {
    out = out.replace(pattern, (match) => {
      neutralised += 1;
      return `[redacted instruction-shaped text: ${match.length} chars]`;
    });
  }
  return { text: out, neutralised };
}

/**
 * Turn resolved resources into fenced blocks.
 *
 * `serialise` is a parameter rather than a hardcoded `JSON.stringify` because
 * how a host wants a `Condition` rendered for a model is a product decision —
 * a terse clinical line reads better and costs fewer tokens than raw FHIR JSON,
 * and both are legitimate. The fence is not negotiable; the contents are.
 */
export function toContextBlocks(
  context: ResolvedContext,
  serialise: (resource: FhirResource) => string = defaultSerialise,
): { blocks: readonly ContextBlock[]; neutralised: number } {
  let neutralised = 0;
  const blocks = context.resources.map((resource) => {
    const fenced = fenceText(serialise(resource));
    neutralised += fenced.neutralised;
    return {
      label: `${resource.resourceType}${resource.id ? `/${resource.id}` : ""}`,
      resourceType: String(resource.resourceType),
      text: fenced.text,
    };
  });
  return { blocks, neutralised };
}

function defaultSerialise(resource: FhirResource): string {
  return JSON.stringify(resource);
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export interface AssembleOptions {
  readonly exchangeId: string;
  readonly mode: ConsultMode;
  readonly provider: ConsultProvider;
  readonly question: string;
  readonly history: readonly ConsultTurn[];
  readonly context: ResolvedContext;
  readonly locale: string;
  readonly serialise?: (resource: FhirResource) => string;
}

export interface AssembledRequest {
  readonly request: ConsultRequest;
  /** Instruction-shaped phrases neutralised while fencing. Goes to the audit log. */
  readonly neutralised: number;
}

/**
 * Build the request. The one place instruction and data meet.
 *
 * Three guarantees, each with a test:
 *
 *   1. `question` — the instruction channel — is passed through untouched. It
 *      came from the clinician's keyboard, and mangling it would break the
 *      product to defend against the wrong threat.
 *   2. Record content only ever reaches `contextBlocks`, fenced. There is no
 *      code path that appends it to `question` or `promptRef`.
 *   3. A provider without `phiPermitted` never receives patient context — the
 *      call throws instead. A configuration error becomes a loud exception in
 *      development rather than a quiet disclosure in production.
 */
export function assembleRequest(options: AssembleOptions): AssembledRequest {
  const { exchangeId, mode, provider, question, history, context, locale, serialise } = options;

  const carriesPhi = readsPatientData(mode) && context.resources.length > 0;
  if (carriesPhi && !provider.phiPermitted) {
    throw new PhiNotPermittedError(provider.id);
  }

  const { blocks, neutralised } = toContextBlocks(context, serialise);

  return {
    neutralised,
    request: {
      exchangeId,
      modeId: mode.id,
      promptRef: mode.promptRef,
      // Trimmed here rather than by the caller so the window cannot be widened
      // by accident. Guardrail decay over long conversations is measured, and
      // this is the cheapest place to bound it.
      history: history.slice(-mode.historyTurns),
      question,
      contextBlocks: blocks,
      tools: mode.tools,
      locale,
    },
  };
}

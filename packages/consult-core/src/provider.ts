/**
 * The model adapter, and the wire protocol it speaks.
 *
 * One rule shapes this whole file: **Consult never talks to a model vendor.**
 * A `ConsultProvider` targets an endpoint the customer operates. That endpoint
 * holds the key, applies whichever BAA-covered routing the organisation has,
 * and enforces tenancy and rate limits.
 *
 * Two things follow, and both are the point:
 *
 *   1. "Configurable with any model" becomes true in the only sense that
 *      matters — swapping providers is a change on the customer's server, not
 *      a change to the component or a redeploy of the frontend.
 *
 *   2. The single most common integration vulnerability with any model SDK —
 *      a client-side API key — is not merely discouraged, it is unrepresentable.
 *      There is no `apiKey` field here, and no code path in this package makes
 *      a network request of its own.
 *
 * The events below are a *normalised* protocol. Whatever an endpoint emits —
 * SSE, NDJSON, a vendor SDK's own async iterator — the adapter maps it onto
 * these. That normalisation is where a host absorbs vendor differences, so the
 * pipeline, the reducer and the UI never learn a vendor's name.
 */

import type { ActionProposal, ToolCall } from "./actions.js";
import type { ConsultError } from "./errors.js";
import type { ModelDisclosure } from "./disclosure.js";
import type { SafetyVerdict } from "./safety/index.js";

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/**
 * Where a source came from.
 *
 * `kind` is not decoration. The FDA's revised CDS guidance (Jan 2026) expects
 * recommendations to rest on "well-understood and accepted" sources —
 * established guidelines and peer-reviewed literature rather than novel or
 * proprietary derived signals. Making the kind explicit lets a host see, and a
 * reviewer audit, when a corpus has drifted outside that.
 */
export type SourceKind =
  /** A clinical practice guideline. The strongest basis available. */
  | "guideline"
  /** Peer-reviewed literature. */
  | "literature"
  /** A drug formulary or interaction database. */
  | "formulary"
  /** The deploying organisation's own policy or pathway. */
  | "org-policy"
  /** The patient's own record. Grounds a claim about *this* patient only. */
  | "record";

/**
 * A retrieved source.
 *
 * `passage` is required, and that requirement is the difference between a
 * component that satisfies the FDA's fourth non-device criterion and one that
 * gestures at it. A clinician asked to "independently review the basis for the
 * recommendation" cannot do so from a URL — following it costs a tab, a load
 * and a search, and the whole finding about automation bias is that people
 * accept rather than pay that cost. The passage is the basis. The link is a
 * convenience.
 */
export interface Source {
  id: string;
  title: string;
  /** The retrieved text itself. Not a summary of it, and not a URL. */
  passage: string;
  /**
   * Character offsets into `passage` for the clause that actually supports the
   * claim. Renders as a highlight, which is what makes verification a glance
   * rather than a read.
   */
  highlight?: readonly [number, number];
  url?: string;
  kind: SourceKind;
  /**
   * Edition or revision. "Retrieved today from the 2023 guideline" and
   * "retrieved today from the 2019 guideline" are different clinical facts,
   * and only this field can tell them apart.
   */
  version?: string;
  /** ISO 8601. Supplied by the host, never read from a clock in this package. */
  retrievedAt: string;
  /** Retrieval score, if the endpoint exposes one. Displayed, never thresholded here. */
  score?: number;
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

/**
 * A span of answer text attributed to one or more sources.
 *
 * Offsets are into the *accumulated* answer text, so a claim can be emitted as
 * soon as the model finishes the sentence that carries it rather than at the
 * end of the response. That timing is what lets the sources drawer open from
 * cache in §4's 150ms budget instead of fetching on click.
 */
export interface Claim {
  span: readonly [number, number];
  markers: readonly number[];
}

export type ConsultEvent =
  /** A chunk of answer text. */
  | { readonly type: "delta"; readonly text: string }
  /**
   * A chunk of the model's reasoning narrative. Kept in a separate channel so
   * it can never be rendered as the answer — a visible chain of thought reads
   * as evidence to a clinician, and it is not evidence.
   */
  | { readonly type: "reasoning"; readonly text: string }
  /** A source becoming available. Emitted during the stream, not after it. */
  | { readonly type: "citation"; readonly marker: number; readonly source: Source }
  /** A span of the answer attributed to markers. */
  | { readonly type: "claim"; readonly claim: Claim }
  /** The model asking to use a tool. Gated by the mode's allowlist. */
  | { readonly type: "tool-call"; readonly call: ToolCall }
  /** A proposed action, awaiting human confirmation. Never auto-executed. */
  | { readonly type: "proposal"; readonly proposal: ActionProposal }
  /** A safety determination made server-side. Client classifiers still run. */
  | { readonly type: "safety"; readonly verdict: SafetyVerdict }
  | { readonly type: "usage"; readonly input: number; readonly output: number }
  | { readonly type: "error"; readonly error: ConsultError }
  | {
      readonly type: "done";
      readonly finish: "stop" | "length" | "aborted" | "refused";
    };

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

/**
 * A turn in the conversation as the adapter receives it.
 *
 * Note what is absent: there is no `systemPrompt` and no free-form `messages`
 * array the caller can stuff arbitrary roles into. The instruction channel is
 * assembled by `context.ts` from the mode's registered prompt, and record
 * content arrives fenced in `contextBlocks`. Keeping them apart in the *type*
 * is what makes §12's containment rule checkable rather than aspirational.
 */
export interface ConsultRequest {
  /** Stable id for this exchange. Appears in the audit event. */
  readonly exchangeId: string;
  /** The mode in force. The endpoint may use it to route or to select a prompt. */
  readonly modeId: string;
  /** Reference to the registered prompt template, e.g. "work-up@3". */
  readonly promptRef: string;
  /** Prior turns, already trimmed to the mode's window. */
  readonly history: readonly ConsultTurn[];
  /** What the clinician typed or dictated. */
  readonly question: string;
  /**
   * Record content, fenced. Every block is data. None of it is an instruction,
   * and the endpoint is expected to treat it that way too.
   */
  readonly contextBlocks: readonly ContextBlock[];
  /** Tools the mode allows. Empty for every mode that does not need one. */
  readonly tools: readonly string[];
  /** Locale for the response, e.g. "en-GB". */
  readonly locale: string;
}

export interface ConsultTurn {
  readonly role: "clinician" | "assistant";
  readonly text: string;
}

/**
 * A fenced block of record content.
 *
 * `label` and `resourceType` exist so the endpoint can reconstruct the fence
 * server-side rather than trusting a pre-concatenated string, which is the
 * shape that lets a host defend against injection at both ends.
 */
export interface ContextBlock {
  readonly label: string;
  readonly resourceType: string;
  readonly text: string;
}

/* ------------------------------------------------------------------ */
/* The adapter                                                         */
/* ------------------------------------------------------------------ */

export interface ProviderCapabilities {
  readonly streaming: boolean;
  /**
   * When false, every answer from this provider renders in the "general"
   * register — model knowledge, visibly marked, never presented as grounded.
   * A provider that cannot cite is not a lesser provider; it is a differently
   * labelled one.
   */
  readonly citations: boolean;
  readonly reasoning: boolean;
  readonly tools: boolean;
  readonly attachments: boolean;
}

export interface ConsultProvider {
  readonly id: string;

  /**
   * Whether this endpoint is covered for protected health information.
   *
   * `assembleRequest` throws if patient context would be attached to a provider
   * where this is false. A configuration mistake therefore becomes a loud
   * exception in development rather than a quiet disclosure in production,
   * which is the only version of this check worth having.
   */
  readonly phiPermitted: boolean;

  readonly capabilities: ProviderCapabilities;

  /** Rendered by the disclosure sheet; structured to the HTI-1 attribute set. */
  readonly disclosure: ModelDisclosure;

  send(request: ConsultRequest, signal: AbortSignal): AsyncIterable<ConsultEvent>;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * A provider that answers from a fixed script.
 *
 * Exported rather than kept in test files because it is genuinely useful to a
 * consumer: it makes the component renderable in Storybook, in tests, and in a
 * demo with no endpoint at all, and it gives an integrator something to diff
 * their own adapter against.
 */
export function createStaticProvider(options: {
  id?: string;
  events: readonly ConsultEvent[];
  disclosure: ModelDisclosure;
  phiPermitted?: boolean;
  capabilities?: Partial<ProviderCapabilities>;
  /** Milliseconds between events. Zero in tests; nonzero to see streaming. */
  delayMs?: number;
}): ConsultProvider {
  const {
    id = "static",
    events,
    disclosure,
    phiPermitted = false,
    capabilities,
    delayMs = 0,
  } = options;

  return {
    id,
    phiPermitted,
    disclosure,
    capabilities: {
      streaming: true,
      citations: true,
      reasoning: true,
      tools: false,
      attachments: false,
      ...capabilities,
    },
    async *send(_request, signal) {
      for (const event of events) {
        if (signal.aborted) {
          yield { type: "done", finish: "aborted" };
          return;
        }
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        yield event;
      }
    },
  };
}

/**
 * The session state machine.
 *
 * A pure reducer, exhaustively switched, with no timers, no I/O and no clock.
 * Everything time-shaped arrives as a field on an action, which is what makes
 * the whole machine deterministic under test — a state chart you can only
 * exercise by waiting is a state chart nobody exercises.
 *
 *   idle
 *    └─ composing ──────────────┬─► dictating ──► composing
 *                               │
 *                               └─► submitting
 *                                    ├─► refused      (scope said no)
 *                                    ├─► crisis       (terminal)
 *                                    └─► streaming
 *                                         ├─► stopped
 *                                         ├─► error
 *                                         └─► complete
 *                                              ├─► composing   (follow-up)
 *                                              └─► proposing ──► confirming ──► composing
 *
 * Two properties are load-bearing and both have tests named after them.
 *
 * **`crisis` is terminal.** There is no transition out of it except starting a
 * new thread. No code path exists in which a crisis classification is followed
 * by a model answer, because the reducer will not produce one — an `event`
 * action arriving in the crisis state is ignored rather than applied.
 *
 * **`committed` is reachable only through `confirming`.** The action that
 * commits requires a `ConfirmedProposal`, and the only way to obtain one of
 * those is `confirmProposal()`, which requires a human actor. §9's rule is
 * therefore enforced by the type system rather than by developer discipline.
 */

import { EMPTY_ANSWER, type Answer } from "./answer.js";
import type { ActionProposal, ConfirmedProposal, ToolCall } from "./actions.js";
import type { CheckResult } from "./checks.js";
import type { ConsultError } from "./errors.js";
import type { Claim, ConsultEvent, ConsultTurn, Source } from "./provider.js";
import type { SafetyVerdict } from "./safety/index.js";
import { SAFE_VERDICT } from "./safety/index.js";
import type { ResolvedContext } from "./context.js";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type ConsultStatus =
  | "idle"
  | "composing"
  | "dictating"
  | "submitting"
  | "streaming"
  | "complete"
  | "stopped"
  | "error"
  | "refused"
  | "crisis"
  | "proposing"
  | "confirming";

export interface ConsultMessage {
  readonly id: string;
  readonly role: "clinician" | "assistant";
  readonly text: string;
  /** Present on assistant messages only. */
  readonly answer?: Answer;
  readonly checks?: CheckResult;
  /** Tool calls the mode refused. Surfaced so an operator can see attempts. */
  readonly blockedTools?: readonly ToolCall[];
}

export interface SessionState {
  readonly status: ConsultStatus;
  readonly modeId: string;
  /** What is in the field right now. */
  readonly draft: string;
  /** Live partial transcript during dictation, kept apart from the draft. */
  readonly transcript: string;
  readonly messages: readonly ConsultMessage[];
  /** The answer being streamed. Null outside `streaming`/`complete`. */
  readonly current: Answer | null;
  readonly error: ConsultError | null;
  readonly safety: SafetyVerdict;
  /** Summary of what the resolver returned, for the scope strip. */
  readonly context: ResolvedContext | null;
  readonly proposal: ActionProposal | null;
  readonly exchangeId: string | null;
  /** Provider capability snapshot, so the reducer can derive the register. */
  readonly providerCanCite: boolean;
}

export function initialState(modeId: string, providerCanCite = true): SessionState {
  return {
    status: "idle",
    modeId,
    draft: "",
    transcript: "",
    messages: [],
    current: null,
    error: null,
    safety: SAFE_VERDICT,
    context: null,
    proposal: null,
    exchangeId: null,
    providerCanCite,
  };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type SessionAction =
  | { readonly type: "set-mode"; readonly modeId: string }
  | { readonly type: "set-draft"; readonly draft: string }
  | { readonly type: "dictation-start" }
  | { readonly type: "dictation-partial"; readonly transcript: string }
  | { readonly type: "dictation-stop"; readonly transcript?: string }
  | {
      readonly type: "submit";
      readonly exchangeId: string;
      readonly messageId: string;
      readonly question: string;
    }
  | { readonly type: "context-resolved"; readonly context: ResolvedContext }
  | { readonly type: "refuse"; readonly error: ConsultError }
  | { readonly type: "crisis"; readonly safety: SafetyVerdict }
  | { readonly type: "stream-start" }
  | { readonly type: "event"; readonly event: ConsultEvent }
  | {
      readonly type: "complete";
      readonly messageId: string;
      readonly checks: CheckResult;
      readonly finish: "stop" | "length" | "aborted" | "refused";
    }
  | { readonly type: "stop" }
  | { readonly type: "fail"; readonly error: ConsultError }
  | { readonly type: "confirm"; readonly confirmed: ConfirmedProposal }
  | { readonly type: "dismiss-proposal" }
  | { readonly type: "new-thread" };

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

const TERMINAL: ReadonlySet<ConsultStatus> = new Set<ConsultStatus>(["crisis"]);

export function reduce(state: SessionState, action: SessionAction): SessionState {
  // The terminal guard, first and unconditional. Everything except starting a
  // new thread is ignored once a crisis has been classified — including events
  // already in flight from a request that was dispatched before the classifier
  // returned.
  if (TERMINAL.has(state.status) && action.type !== "new-thread") {
    return state;
  }

  switch (action.type) {
    case "set-mode":
      // Changing mode mid-stream would mean an answer governed by one output
      // contract rendered under another. Ignored rather than queued.
      if (state.status === "streaming" || state.status === "submitting") return state;
      return { ...state, modeId: action.modeId, error: null };

    case "set-draft":
      return {
        ...state,
        draft: action.draft,
        status: state.status === "idle" || state.status === "complete" ? "composing" : state.status,
        error: null,
      };

    case "dictation-start":
      return { ...state, status: "dictating", transcript: "" };

    case "dictation-partial":
      if (state.status !== "dictating") return state;
      return { ...state, transcript: action.transcript };

    case "dictation-stop": {
      // The transcript lands in the draft, never straight into a submission.
      // Speech recognition errors in drug names are the classic harm, and the
      // fix is that a human sees the words before they are sent.
      const text = action.transcript ?? state.transcript;
      const draft = state.draft ? `${state.draft} ${text}`.trim() : text.trim();
      return { ...state, status: "composing", transcript: "", draft };
    }

    case "submit": {
      if (state.status === "streaming" || state.status === "submitting") return state;
      const message: ConsultMessage = {
        id: action.messageId,
        role: "clinician",
        text: action.question,
      };
      return {
        ...state,
        status: "submitting",
        exchangeId: action.exchangeId,
        draft: "",
        transcript: "",
        error: null,
        current: EMPTY_ANSWER,
        proposal: null,
        messages: [...state.messages, message],
      };
    }

    case "context-resolved":
      return { ...state, context: action.context };

    case "refuse":
      return { ...state, status: "refused", error: action.error, current: null };

    case "crisis":
      // The answer in flight is discarded, not annotated. Appending a hotline
      // to an otherwise helpful answer produces something people scroll past.
      return { ...state, status: "crisis", safety: action.safety, current: null };

    case "stream-start":
      if (state.status !== "submitting") return state;
      return { ...state, status: "streaming", current: EMPTY_ANSWER };

    case "event":
      if (state.status !== "streaming" || !state.current) return state;
      return applyEvent(state, action.event);

    case "complete": {
      if (state.status !== "streaming") return state;
      const answer: Answer = {
        ...(state.current ?? EMPTY_ANSWER),
        register: action.checks.register,
        partial: action.finish === "aborted" || action.finish === "length",
      };
      const message: ConsultMessage = {
        id: action.messageId,
        role: "assistant",
        text: answer.text,
        answer,
        checks: action.checks,
      };
      return {
        ...state,
        status: state.proposal ? "proposing" : "complete",
        current: answer,
        messages: [...state.messages, message],
      };
    }

    case "stop":
      if (state.status !== "streaming" && state.status !== "submitting") return state;
      return { ...state, status: "stopped" };

    case "fail":
      return { ...state, status: "error", error: action.error, current: null };

    case "confirm":
      // Reachable only with a ConfirmedProposal, which only confirmProposal()
      // can mint, and which requires an actor. This is §9's rule as a type.
      return { ...state, status: "composing", proposal: null };

    case "dismiss-proposal":
      return { ...state, status: "complete", proposal: null };

    case "new-thread":
      return {
        ...initialState(state.modeId, state.providerCanCite),
        status: "idle",
      };

    default: {
      // Exhaustiveness at compile time, inertness at runtime. The assignment is
      // what makes a new action member fail to compile until it is handled;
      // returning `state` is what makes an action that somehow arrives anyway —
      // from untyped JavaScript, or a version skew between packages — leave the
      // session alone instead of replacing it with the action object.
      const _exhaustive: never = action;
      void _exhaustive;
      return state;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Event application                                                   */
/* ------------------------------------------------------------------ */

function applyEvent(state: SessionState, event: ConsultEvent): SessionState {
  const current = state.current ?? EMPTY_ANSWER;

  switch (event.type) {
    case "delta":
      return { ...state, current: { ...current, text: current.text + event.text } };

    case "reasoning":
      return { ...state, current: { ...current, reasoning: current.reasoning + event.text } };

    case "citation": {
      const sources = new Map(current.sources);
      sources.set(event.marker, event.source);
      return { ...state, current: { ...current, sources } };
    }

    case "claim":
      return { ...state, current: { ...current, claims: [...current.claims, event.claim] } };

    case "proposal":
      return { ...state, proposal: event.proposal };

    case "safety":
      // A blocking verdict from the endpoint short-circuits here, before any
      // more of the answer accumulates.
      if (event.verdict.blocking) {
        return { ...state, status: "crisis", safety: event.verdict, current: null };
      }
      return { ...state, safety: event.verdict };

    case "error":
      return { ...state, status: "error", error: event.error, current: null };

    // `tool-call`, `usage` and `done` carry no state the reducer owns. Tool
    // calls are decided by the pipeline against the mode's allowlist; usage is
    // telemetry; `done` arrives as an explicit `complete` action so the checks
    // can run first.
    case "tool-call":
    case "usage":
    case "done":
      return state;

    default: {
      // Same shape as above, and the same reason: an unrecognised stream event
      // must not become the state. A provider on a newer protocol version is
      // the realistic way this happens.
      const _exhaustive: never = event;
      void _exhaustive;
      return state;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

/** Prior turns in the shape the provider expects. */
export function toTurns(state: SessionState): readonly ConsultTurn[] {
  return state.messages.map((m) => ({
    role: m.role,
    text: m.text,
  }));
}

/** Plain text of prior turns, for the crisis classifier's thread window. */
export function toHistoryText(state: SessionState): readonly string[] {
  return state.messages.map((m) => m.text);
}

export function isBusy(state: SessionState): boolean {
  return state.status === "submitting" || state.status === "streaming";
}

/** Can the clinician type right now? */
export function canCompose(state: SessionState): boolean {
  return !isBusy(state) && state.status !== "crisis";
}

export function sourcesOf(state: SessionState): readonly Source[] {
  return state.current ? [...state.current.sources.values()] : [];
}

export function claimsOf(state: SessionState): readonly Claim[] {
  return state.current?.claims ?? [];
}

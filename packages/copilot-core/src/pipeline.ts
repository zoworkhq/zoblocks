/**
 * The exchange pipeline.
 *
 * Every question runs the same ordered chain. Each stage is pluggable, each
 * stage's decision is recorded, and **the order is not configurable** — that is
 * the guarantee, not an oversight.
 *
 *   crisis   → deterministic risk classification over the whole thread
 *   scope    → is this question in the mode's remit?
 *   resolve  → ask the host for the mode's declared categories
 *   assemble → the one place instruction and data meet
 *   inject   → scan the fenced blocks; alarm, not gate
 *   stream   → call the adapter, normalise events
 *   check    → output contract, coverage, dosing, language
 *   audit    → emit an AuditEvent through the host's sink
 *
 * `crisis` runs first, and it took a test to get that right.
 *
 * The original order put `scope` first, reasoning that an out-of-scope question
 * should be redirected before anything scanned it for risk. That rationale does
 * not survive contact with the classifier: "write me a poem" contains no risk
 * language, so crisis never fires on it, and scope-first bought nothing.
 *
 * What it cost was real. A clinician typing "my patient is actively suicidal and
 * has a plan" while a reference-only mode happened to be selected got a bland
 * "switch to Prepare" instead of the escalation path — the mode chip deciding
 * whether someone in danger gets help. Risk classification does not care which
 * chip is lit.
 *
 * The whole function is injected with its clock and its id generator. Nothing
 * here reads `Date.now()` or `crypto.randomUUID()`, which is what makes the
 * suite deterministic and the package importable in an edge runtime that has
 * neither.
 */

import { assembleRequest, resolveContext, type CopilotContextResolver } from "./context.js";
import { auditExchange, type AuditSink } from "./audit.js";
import { decideTool, type ToolCall } from "./actions.js";
import { copilotError, PhiNotPermittedError } from "./errors.js";
import { runChecks, type CheckResult } from "./checks.js";
import type { CopilotMode } from "./modes.js";
import type { CopilotProvider, CopilotEvent } from "./provider.js";
import type { FhirResource, Reference } from "./fhir-types.js";
import {
  defaultClassifiers,
  mergeVerdicts,
  SAFE_VERDICT,
  type SafetyClassifiers,
  type SafetyVerdict,
} from "./safety/index.js";
import { EMPTY_ANSWER, type Answer } from "./answer.js";
import {
  reduce,
  toHistoryText,
  toTurns,
  type SessionAction,
  type SessionState,
} from "./session.js";
import type { TelemetrySink } from "./telemetry.js";

export interface PipelineDeps {
  readonly provider: CopilotProvider;
  readonly modes: readonly CopilotMode[];
  readonly contextResolver?: CopilotContextResolver;
  readonly subject?: Reference;
  readonly locale: string;
  readonly classifiers?: SafetyClassifiers;
  readonly audit?: AuditSink;
  readonly telemetry?: TelemetrySink;
  readonly serialise?: (resource: FhirResource) => string;
  /** ISO 8601 string. Injected so the suite is deterministic. */
  readonly now: () => string;
  readonly newId: () => string;
  /** Who is asking. Recorded as the audit agent. */
  readonly actor?: { display: string; reference?: string };
  readonly coverageThreshold?: number;
}

export type ExchangeOutcome =
  | { readonly kind: "answered"; readonly checks: CheckResult; readonly answer: Answer }
  | { readonly kind: "refused" }
  | { readonly kind: "crisis"; readonly safety: SafetyVerdict }
  | { readonly kind: "stopped" }
  | { readonly kind: "failed" };

export interface RunExchangeOptions {
  readonly question: string;
  readonly state: SessionState;
  readonly mode: CopilotMode;
  readonly deps: PipelineDeps;
  readonly dispatch: (action: SessionAction) => void;
  readonly signal: AbortSignal;
}

/**
 * Run one exchange.
 *
 * Drives the reducer through `dispatch` rather than returning a new state,
 * because the React layer needs the intermediate states — the whole product is
 * the streaming. The returned outcome is for the caller's telemetry and for
 * tests, not for rendering.
 */
export async function runExchange(options: RunExchangeOptions): Promise<ExchangeOutcome> {
  const { question, state, mode, deps, dispatch, signal } = options;
  const classifiers = { ...defaultClassifiers, ...deps.classifiers };
  const exchangeId = deps.newId();
  const startedAt = deps.now();

  dispatch({ type: "submit", exchangeId, messageId: deps.newId(), question });

  /* --- 1. crisis --------------------------------------------------- */

  const crisis = classifiers.crisis({ question, history: toHistoryText(state) });
  if (crisis.blocking) {
    const safety: SafetyVerdict = { crisis, blocking: true };
    dispatch({ type: "crisis", safety });
    deps.telemetry?.({
      type: "crisis",
      exchangeId,
      modeId: mode.id,
      severity: crisis.severity,
      audience: crisis.audience,
    });
    await emitAudit(deps, {
      exchangeId,
      mode,
      startedAt,
      outcome: "crisis",
      safety,
      withheld: [],
    });
    return { kind: "crisis", safety };
  }

  /* --- 2. scope ---------------------------------------------------- */

  const scope = classifiers.scope({ question, mode, modes: deps.modes });
  if (!scope.inScope) {
    const error = copilotError("out-of-scope", scopeMessage(scope.reason), {
      retryable: false,
      ...(scope.suggestedModeId ? { suggestedModeId: scope.suggestedModeId } : {}),
    });
    dispatch({ type: "refuse", error });
    deps.telemetry?.({ type: "refused", exchangeId, modeId: mode.id, reason: scope.reason });
    await emitAudit(deps, {
      exchangeId,
      mode,
      startedAt,
      outcome: "refused",
      safety: SAFE_VERDICT,
      withheld: [],
    });
    return { kind: "refused" };
  }

  /* --- 3. resolve -------------------------------------------------- */

  const contextOutcome = await resolveContext(mode, deps.subject, deps.contextResolver);
  if (!contextOutcome.ok) {
    dispatch({ type: "fail", error: contextOutcome.error });
    await emitAudit(deps, {
      exchangeId,
      mode,
      startedAt,
      outcome: "failed",
      safety: SAFE_VERDICT,
      withheld: [],
    });
    return { kind: "failed" };
  }
  const context = contextOutcome.context;
  dispatch({ type: "context-resolved", context });

  /* --- 4. assemble ------------------------------------------------- */

  let assembled;
  try {
    assembled = assembleRequest({
      exchangeId,
      mode,
      provider: deps.provider,
      question,
      history: toTurns(state),
      context,
      locale: deps.locale,
      ...(deps.serialise ? { serialise: deps.serialise } : {}),
    });
  } catch (cause) {
    // A PHI misconfiguration is a programming error, not a UI state. It is
    // reported and rethrown so it stops the developer rather than degrading
    // quietly into a component that half works.
    if (cause instanceof PhiNotPermittedError) {
      dispatch({
        type: "fail",
        error: copilotError("phi-not-permitted", cause.message, { retryable: false, cause }),
      });
      throw cause;
    }
    dispatch({
      type: "fail",
      error: copilotError("provider", "The request could not be assembled.", { cause }),
    });
    return { kind: "failed" };
  }

  /* --- 5. injection scan ------------------------------------------- */

  let safety: SafetyVerdict = { crisis, blocking: false };
  if (assembled.request.contextBlocks.length > 0) {
    const injection = classifiers.injection(
      assembled.request.contextBlocks.map((b) => b.text).join("\n"),
      { neutralised: assembled.neutralised },
    );
    safety = { crisis, injection, blocking: injection.blocking };
    if (injection.blocking) {
      dispatch({
        type: "fail",
        error: copilotError(
          "context-unavailable",
          "The record contains content that could not be safely summarised.",
          { retryable: false },
        ),
      });
      deps.telemetry?.({
        type: "injection",
        exchangeId,
        modeId: mode.id,
        severity: injection.severity,
        rules: injection.rules,
      });
      await emitAudit(deps, {
        exchangeId,
        mode,
        startedAt,
        outcome: "blocked",
        safety,
        withheld: context.withheld,
      });
      return { kind: "failed" };
    }
  }

  /* --- 6. stream --------------------------------------------------- */

  dispatch({ type: "stream-start" });
  deps.telemetry?.({ type: "submitted", exchangeId, modeId: mode.id });

  let working: SessionState = { ...state, current: EMPTY_ANSWER, status: "streaming" };
  const blockedTools: ToolCall[] = [];
  let finish: "stop" | "length" | "aborted" | "refused" = "stop";
  let firstTokenAt: string | undefined;

  try {
    for await (const event of deps.provider.send(assembled.request, signal)) {
      if (signal.aborted) {
        finish = "aborted";
        break;
      }

      if (event.type === "delta" && firstTokenAt === undefined) {
        firstTokenAt = deps.now();
        deps.telemetry?.({ type: "first-token", exchangeId, modeId: mode.id, at: firstTokenAt });
      }

      if (event.type === "tool-call") {
        const decision = decideTool(mode.tools, event.call);
        if (!decision.allowed) {
          blockedTools.push(event.call);
          deps.telemetry?.({
            type: "tool-blocked",
            exchangeId,
            modeId: mode.id,
            tool: event.call.name,
            reason: decision.reason,
          });
          continue;
        }
      }

      if (event.type === "done") {
        finish = event.finish;
        continue;
      }

      if (event.type === "safety") {
        safety = mergeVerdicts(safety, event.verdict);
        if (event.verdict.blocking) {
          dispatch({ type: "crisis", safety });
          await emitAudit(deps, {
            exchangeId,
            mode,
            startedAt,
            outcome: "crisis",
            safety,
            withheld: context.withheld,
          });
          return { kind: "crisis", safety };
        }
      }

      working = applyLocally(working, event);
      dispatch({ type: "event", event });
    }
  } catch (cause) {
    if (signal.aborted) {
      dispatch({ type: "stop" });
      return { kind: "stopped" };
    }
    dispatch({
      type: "fail",
      error: copilotError("network", "The connection to the assistant failed.", { cause }),
    });
    await emitAudit(deps, {
      exchangeId,
      mode,
      startedAt,
      outcome: "failed",
      safety,
      withheld: context.withheld,
    });
    return { kind: "failed" };
  }

  if (signal.aborted) {
    dispatch({ type: "stop" });
    deps.telemetry?.({ type: "stopped", exchangeId, modeId: mode.id });
    return { kind: "stopped" };
  }

  /* --- 7. check ---------------------------------------------------- */

  const answer = working.current ?? EMPTY_ANSWER;
  const checks = runChecks({
    answer,
    mode,
    providerCanCite: deps.provider.capabilities.citations,
    blocked: false,
    ...(deps.coverageThreshold !== undefined ? { coverageThreshold: deps.coverageThreshold } : {}),
  });

  dispatch({ type: "complete", messageId: deps.newId(), checks, finish });

  /* --- 8. audit ---------------------------------------------------- */

  deps.telemetry?.({
    type: "answered",
    exchangeId,
    modeId: mode.id,
    register: checks.register,
    sourceCount: answer.sources.size,
    findingCount: checks.findings.length,
  });

  await emitAudit(deps, {
    exchangeId,
    mode,
    startedAt,
    outcome: checks.refused ? "refused" : "answered",
    safety,
    withheld: context.withheld,
    sourceCount: answer.sources.size,
    blockedTools: blockedTools.map((t) => t.name),
    neutralised: assembled.neutralised,
  });

  return { kind: "answered", checks, answer: { ...answer, register: checks.register } };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * The pipeline keeps its own copy of the accumulating answer.
 *
 * It cannot read the caller's state — React has not re-rendered yet — and the
 * checks in stage 7 need the finished answer. Running the same reducer keeps
 * the two copies identical by construction rather than by a second
 * implementation that could drift.
 */
function applyLocally(state: SessionState, event: CopilotEvent): SessionState {
  return reduce(state, { type: "event", event });
}

function scopeMessage(reason: string): string {
  switch (reason) {
    case "needs-patient-context":
      return "That question is about a specific patient, and this mode does not read the record.";
    case "asks-for-diagnosis":
      return "This assistant supports a diagnosis, it does not make one.";
    case "asks-for-autonomous-action":
      return "This assistant cannot place orders, send messages or change the record.";
    default:
      return "That is outside what this assistant is for.";
  }
}

async function emitAudit(
  deps: PipelineDeps,
  input: Parameters<typeof auditExchange>[0],
): Promise<void> {
  if (!deps.audit) return;
  try {
    // Best-effort and never blocking: an audit sink that is down must not take
    // the clinical tool down with it. The failure is swallowed here and
    // surfaced through telemetry instead.
    await deps.audit(auditExchange({ ...input, actor: deps.actor, recorded: deps.now() }));
  } catch (cause) {
    deps.telemetry?.({ type: "audit-failed", exchangeId: input.exchangeId, cause });
  }
}

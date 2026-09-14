/**
 * `useCopilot` — the whole component's behaviour, without a single style.
 *
 * The hook owns the reducer, the pipeline, the abort controller, dictation,
 * and the verification timer. A skin owns markup and CSS and nothing else,
 * which is what lets the antd skin and the Tailwind registry skin share every
 * line of the hard parts — the accessibility work in `use-announcer.ts`, the
 * keyboard model, and the safety plumbing.
 *
 * Note what is *not* in the options: no `apiKey`, no `model`, no
 * `systemPrompt`, no `onToolCall`. Those absences are the design. A consumer
 * cannot misconfigure this into calling a vendor directly, cannot smuggle a
 * permission grant through a prompt string, and cannot wire an unattended tool
 * execution, because the surface to do any of it does not exist.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  assertClinicianFacing,
  categoryLabels,
  classifyProposal,
  confirmProposal,
  copilotError,
  disclosableWithheldCount,
  hasDisclosableWithholding,
  initialState,
  pendingProposal,
  isReflexive,
  reduce,
  requireMode,
  resolveCrisisLines,
  runExchange,
  type ActionProposal,
  type Actor,
  type Answer,
  type ConfirmedProposal,
  type CopilotContextResolver,
  type CopilotMessage,
  type CopilotMode,
  type CopilotProvider,
  type ProposalRisk,
  type CrisisLine,
  type FeedbackReason,
  type ModelDisclosure,
  type Reference,
  type SafetyClassifiers,
  type SessionAction,
  type SessionState,
  type Source,
  type AuditSink,
  type TelemetrySink,
} from "@zoblocks/copilot-core";
import { useAnnouncer, type Announcer, type AnnouncementMode } from "./use-announcer.js";

export interface UseCopilotOptions {
  /**
   * Where answers come from. Targets your endpoint, never a model vendor — there is no
   * `apiKey` prop and no way to add one.
   */
  readonly provider: CopilotProvider;
  /**
   * The scope contracts. Each declares what it may read, what tools it may call, what it may
   * output and what risk it carries — enforced in code rather than described in a prompt.
   */
  readonly modes: readonly CopilotMode[];
  /** Which mode opens first. Defaults to the first in `modes`. */
  readonly initialModeId?: string;
  /**
   * Resolves what the copilot may see for this reader and this patient, returning a redacted
   * view — so a mode cannot widen its own scope.
   */
  readonly context?: CopilotContextResolver;
  /**
   * The patient this session is about, as a FHIR reference. Stamped on every audit event; a
   * question asked with no subject is not attributable to a chart.
   */
  readonly subject?: Reference;
  /** BCP 47 tag for generated strings and crisis-line selection. */
  readonly locale?: string;
  /**
   * Safety checks run over the reader's question and the model's answer before either is
   * shown. Crisis detection routes to `crisisLines` rather than to a model.
   */
  readonly classifiers?: SafetyClassifiers;
  /**
   * Every question, answer, citation, refusal and escalation as a FHIR AuditEvent. This is the
   * record that makes the feature defensible; without it the host has an unlogged clinical
   * assistant.
   */
  readonly onAudit?: AuditSink;
  /**
   * Latency, token counts and refusal reasons, for operating the thing. Deliberately separate
   * from `onAudit`, which is the clinical record.
   */
  readonly onTelemetry?: TelemetrySink;
  /**
   * Who is asking, and in what role. Decides what `context` resolves and is stamped on every
   * audit event.
   */
  readonly actor?: Actor;
  /**
   * Law 5, and the FDA's time-critical clause in criterion 4. When true the
   * hook refuses to submit and the skin renders nothing at all.
   */
  readonly suppressed?: boolean;
  /** Which surface this is. `patient` throws for every built-in mode. */
  readonly surface?: "clinician" | "patient";
  /**
   * How streamed answers reach assistive technology. Token-by-token is unreadable, so the
   * default announces at sentence boundaries.
   */
  readonly announcementMode?: AnnouncementMode;
  /**
   * Crisis resources by region. Rendered directly and never generated, because a hallucinated
   * helpline number is the worst output this component could produce.
   */
  readonly crisisLines?: Readonly<Record<string, readonly CrisisLine[]>>;
  /** Injected for tests. Defaults to real implementations. */
  readonly now?: () => string;
  /** Injected for tests, so ids are deterministic in snapshots. Defaults to a real generator. */
  readonly newId?: () => string;
}

export interface ScopeSummary {
  readonly subject: Reference | undefined;
  /** For display — clinical English, several resource types collapsed. */
  readonly categories: readonly string[];
  /** The enforcement contract, unchanged, for anyone auditing what was read. */
  readonly resourceTypes: readonly string[];
  readonly withheldCount: number;
  readonly showWithheld: boolean;
  readonly asOf: string | undefined;
}

export interface CopilotApi {
  readonly state: SessionState;
  readonly mode: CopilotMode;
  readonly modes: readonly CopilotMode[];
  readonly setMode: (id: string) => void;

  readonly draft: string;
  readonly setDraft: (value: string) => void;
  readonly submit: (question?: string) => Promise<void>;
  /**
   * Re-send the last question the clinician asked.
   *
   * Distinct from `submit()` because `submit` clears the draft — so a retry
   * that called it with no argument would send an empty string and silently do
   * nothing, which is exactly the sort of dead control that erodes trust in a
   * tool faster than an honest error does.
   */
  readonly retry: () => Promise<void>;
  readonly canRetry: boolean;
  readonly stop: () => void;
  readonly newThread: () => void;
  readonly canSubmit: boolean;

  readonly dictation: {
    readonly active: boolean;
    readonly transcript: string;
    readonly start: () => void;
    readonly update: (transcript: string) => void;
    readonly stop: (final?: string) => void;
  };

  /** The drawer's sources, in marker order. */
  readonly sources: readonly Source[];
  /** The same sources with their citation markers, so a skin numbers them as the answer does. */
  readonly citations: readonly CopilotCitation[];
  readonly sourcesOpen: boolean;
  /** Opens the latest answer's sources. Emits the verification-rate signal. §17. */
  readonly openSources: () => void;
  /** Opens one assistant message's sources, so an older answer shows its own. */
  readonly openSourcesFor: (messageId: string) => void;
  readonly closeSources: () => void;

  /** Null until the answer carrying it has been checked. */
  readonly proposal: ActionProposal | null;
  /** The proposal's risk under the active mode. A `prohibited` one renders no confirm. */
  readonly proposalRisk: ProposalRisk | null;
  readonly confirm: () => void;
  readonly dismissProposal: () => void;

  readonly crisisLines: readonly CrisisLine[];
  readonly scope: ScopeSummary;
  readonly announcer: Announcer;
  readonly suppressed: boolean;

  /**
   * The active provider's disclosure, surfaced so a skin can render the sheet
   * without being handed the provider itself. Skins should not hold a reference
   * to something with a `send` method on it.
   */
  readonly disclosure: ModelDisclosure;

  /** Feedback on the latest answer. */
  readonly sendFeedback: (rating: "up" | "down", reason?: FeedbackReason) => void;
  /**
   * Feedback on one assistant message, recorded against the exchange that
   * produced it. A bare thumbs-down sets `awaitingFeedbackReason` to that
   * message's id, so a skin asks under the right answer. A skin with no reason
   * picker passes `{ askReason: false }` to record it at once.
   */
  readonly sendFeedbackFor: (
    messageId: string,
    rating: "up" | "down",
    reason?: FeedbackReason,
    options?: { readonly askReason?: boolean },
  ) => void;

  /**
   * Collapsed to a bubble.
   *
   * Distinct from `suppressed`: suppression is the *host* deciding the
   * clinician is mid-procedure and the component must not exist. Collapsing is
   * the clinician deciding they want it out of the way, and it has to stay out
   * of the way — a dock that re-expands itself is one people stop trusting to
   * stay put.
   */
  readonly collapsed: boolean;
  readonly setCollapsed: (collapsed: boolean) => void;

  /**
   * Threads, in memory.
   *
   * The switcher is real; persistence is not this component's job. A host that
   * wants threads to survive a reload writes them wherever its data already
   * lives — ZoBlocks never picks the database, for the same reason it never
   * becomes a processor of clinical interaction data.
   */
  readonly threads: readonly CopilotThreadSummary[];
  readonly activeThreadId: string;
  readonly switchThread: (id: string) => void;

  /**
   * The message awaiting a reason for a thumbs-down, if any.
   *
   * Free-text thumbs are worthless — nobody types, and the ones who do write
   * "bad". Asking for a reason from a closed list is what makes the signal
   * analysable, and each option maps to a different fix: `unsafe` is a
   * stop-ship, `outdated` is a corpus problem, `no-source` is retrieval,
   * `wrong` is the model.
   */
  readonly awaitingFeedbackReason: string | null;
  readonly dismissFeedbackReason: () => void;
}

/** A source and the marker the answer cites it by. */
export interface CopilotCitation {
  readonly marker: number;
  readonly source: Source;
}

export interface CopilotThreadSummary {
  readonly id: string;
  /** Taken from the first question asked, so a thread names itself. */
  readonly title: string;
  readonly messageCount: number;
}

let fallbackId = 0;

/**
 * Clock helpers, at module scope rather than inside the hook.
 *
 * `no-restricted-syntax` forbids reading the current time inside a component,
 * and it is right to: a rendered timestamp makes visual-regression snapshots
 * non-deterministic. Neither of these is rendered. `defaultNow` produces the
 * ISO string that goes into an audit record, and `elapsed` measures a duration
 * for telemetry — the verification interval and the confirmation dwell, both of
 * which are the whole point of §17. Hoisting them here keeps the rule's real
 * target (a clock in the render path) enforced while letting the measurements
 * happen.
 */
// Not a render path: this is the default for an injected dependency. Every
// call site takes `now` as an option and every test supplies a fixed one,
// which is exactly what the rule asks for. The value becomes an audit
// timestamp and is never rendered.
// eslint-disable-next-line no-restricted-syntax
const defaultNow = (): string => new Date().toISOString();

// Measures elapsed time for telemetry — the verification interval and the
// confirmation dwell. Never rendered, so it cannot drift a VRT baseline.
// eslint-disable-next-line no-restricted-syntax
const stamp = (): number => Date.now();

const elapsed = (since: number | null): number => (since === null ? 0 : stamp() - since);

const defaultNewId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `copilot-${++fallbackId}`;

/** A message's answer by id, or undefined when there is none. */
function answerFor(messages: readonly CopilotMessage[], id: string | null): Answer | undefined {
  return id === null ? undefined : messages.find((message) => message.id === id)?.answer;
}

/** An answer's sources paired with their markers, in marker order. */
function citationsOf(answer: Answer | null | undefined): readonly CopilotCitation[] {
  if (!answer) return [];
  return [...answer.sources]
    .map(([marker, source]) => ({ marker, source }))
    .sort((a, b) => a.marker - b.marker);
}

export function useCopilot(options: UseCopilotOptions): CopilotApi {
  const {
    provider,
    modes,
    initialModeId = modes[0]?.id ?? "look-up",
    context,
    subject,
    locale = "en-GB",
    classifiers,
    onAudit,
    onTelemetry,
    actor,
    suppressed = false,
    surface = "clinician",
    announcementMode,
    crisisLines: crisisOverrides,
    now = defaultNow,
    newId = defaultNewId,
  } = options;

  const [state, dispatch] = useReducerState(initialModeId, provider.capabilities.citations);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  // Which answer the drawer shows, by message id. Null means the latest.
  const [sourcesFor, setSourcesFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [awaitingFeedbackReason, setAwaitingFeedbackReason] = useState<string | null>(null);
  const [threads, setThreads] = useState<readonly CopilotThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState(() => "thread-1");
  const abortRef = useRef<AbortController | null>(null);
  const answeredAtRef = useRef<number | null>(null);
  const proposalShownAtRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const mode = useMemo(() => requireMode(modes, state.modeId), [modes, state.modeId]);

  // Throws for every built-in mode when `surface` is "patient". Deliberately
  // during render rather than on submit: a developer wiring this up wrongly
  // should find out on first paint, not on a patient's first message.
  assertClinicianFacing(mode, surface);

  /* --- verification timing ----------------------------------------- */

  const previousStatusRef = useRef(state.status);
  useEffect(() => {
    const previous = previousStatusRef.current;
    previousStatusRef.current = state.status;
    // An answer with a proposal lands in proposing. Dismissing that proposal
    // (proposing → complete) is not a new answer, so the clock keeps running.
    // The drawer is not closed here. "Show sources" is on screen before an
    // answer is marked complete, so closing on that transition shut a drawer
    // the clinician had just opened. `submit` closes it when a new question
    // is sent instead.
    if (state.status === "proposing" || (state.status === "complete" && previous !== "proposing")) {
      answeredAtRef.current = stamp();
    }
  }, [state.status]);

  // Stamped when the card can render, not when the event arrived, so dwell
  // time never includes the stream.
  const proposal = pendingProposal(state);
  useEffect(() => {
    if (proposal) proposalShownAtRef.current = stamp();
  }, [proposal]);

  /* --- actions ------------------------------------------------------ */

  const setDraft = useCallback(
    (value: string) => dispatch({ type: "set-draft", draft: value }),
    [dispatch],
  );

  const setMode = useCallback(
    (id: string) => dispatch({ type: "set-mode", modeId: id }),
    [dispatch],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "stop" });
  }, [dispatch]);

  // A thread names itself from its first question, so the switcher is legible
  // without asking anyone to title anything.
  useEffect(() => {
    const first = state.messages.find((m) => m.role === "clinician");
    if (!first) return;
    setThreads((prev) => {
      const title = first.text.length > 48 ? `${first.text.slice(0, 48)}…` : first.text;
      const existing = prev.find((t) => t.id === activeThreadId);
      if (existing && existing.title === title && existing.messageCount === state.messages.length) {
        return prev;
      }
      const next = { id: activeThreadId, title, messageCount: state.messages.length };
      return existing ? prev.map((t) => (t.id === activeThreadId ? next : t)) : [...prev, next];
    });
  }, [state.messages, activeThreadId]);

  const switchThread = useCallback(
    (id: string) => {
      // In-memory only: switching starts a fresh session under the chosen id.
      // A host with persistence rehydrates here instead.
      abortRef.current?.abort();
      setActiveThreadId(id);
      dispatch({ type: "new-thread" });
      setSourcesOpen(false);
      setSourcesFor(null);
      setAwaitingFeedbackReason(null);
    },
    [dispatch],
  );

  const newThread = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "new-thread" });
    setSourcesOpen(false);
    setSourcesFor(null);
    setAwaitingFeedbackReason(null);
    setActiveThreadId(newId());
  }, [dispatch, newId]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const submit = useCallback(
    async (override?: string) => {
      const question = (override ?? stateRef.current.draft).trim();
      if (!question || suppressed) return;

      // A synchronous latch, not a status read.
      //
      // `stateRef` only catches up when React re-renders, so two calls in the
      // same tick — a double-click ahead of the disabled state, or two
      // programmatic calls — would both see "idle" and both start an exchange.
      // Two concurrent exchanges on one session means interleaved dispatches,
      // two audit events for one question, and a thread that no longer matches
      // what anybody asked. The ref closes the window regardless of render
      // timing; the status check stays as the guard for the ordinary case.
      if (inFlightRef.current) return;
      if (stateRef.current.status === "streaming" || stateRef.current.status === "submitting") {
        return;
      }
      inFlightRef.current = true;

      // A new question makes the open drawer describe the wrong answer, so it
      // closes here, synchronously. A status effect could miss it: the
      // complete → submitting → complete updates can land in one render.
      setSourcesOpen(false);
      setSourcesFor(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await runExchange({
          question,
          state: stateRef.current,
          mode,
          deps: {
            provider,
            modes,
            ...(context ? { contextResolver: context } : {}),
            ...(subject ? { subject } : {}),
            locale,
            ...(classifiers ? { classifiers } : {}),
            ...(onAudit ? { audit: onAudit } : {}),
            ...(onTelemetry ? { telemetry: onTelemetry } : {}),
            ...(actor
              ? {
                  actor: {
                    display: actor.display,
                    ...(actor.reference ? { reference: actor.reference } : {}),
                  },
                }
              : {}),
            now,
            newId,
          },
          dispatch,
          signal: controller.signal,
        });
      } finally {
        inFlightRef.current = false;
      }
    },
    [
      mode,
      modes,
      provider,
      context,
      subject,
      locale,
      classifiers,
      onAudit,
      onTelemetry,
      actor,
      now,
      newId,
      suppressed,
      dispatch,
    ],
  );

  const lastQuestion = useMemo(() => {
    for (let i = state.messages.length - 1; i >= 0; i -= 1) {
      const message = state.messages[i];
      if (message?.role === "clinician") return message.text;
    }
    return undefined;
  }, [state.messages]);

  const retry = useCallback(async () => {
    if (!lastQuestion) return;
    await submit(lastQuestion);
  }, [lastQuestion, submit]);

  /* --- dictation ---------------------------------------------------- */

  const dictation = useMemo(
    () => ({
      active: state.status === "dictating",
      transcript: state.transcript,
      start: () => dispatch({ type: "dictation-start" }),
      update: (transcript: string) => dispatch({ type: "dictation-partial", transcript }),
      // Never auto-submits. A human sees the words before they are sent,
      // because speech recognition errors in drug names are the classic harm.
      stop: (final?: string) =>
        dispatch(
          final === undefined
            ? { type: "dictation-stop" }
            : { type: "dictation-stop", transcript: final },
        ),
    }),
    [state.status, state.transcript, dispatch],
  );

  /* --- sources ------------------------------------------------------ */

  // Destructured first: the exhaustive-deps rule treats any `.current` access
  // as a ref, and `state.current` is the streaming answer rather than one.
  const streaming = state.current;
  const messages = state.messages;
  const citations = useMemo(
    () => citationsOf(answerFor(messages, sourcesFor) ?? streaming),
    [messages, sourcesFor, streaming],
  );
  const sources = useMemo(() => citations.map((citation) => citation.source), [citations]);

  const showSources = useCallback(
    (target: string | null) => {
      setSourcesFor(target);
      setSourcesOpen(true);
      // The verification signal. A falling rate is the automation-bias early
      // warning, and `msToOpen` is Law 2 made measurable.
      const latest = stateRef.current;
      if (onTelemetry && latest.exchangeId) {
        const answer = answerFor(latest.messages, target) ?? latest.current;
        onTelemetry({
          type: "sources-opened",
          exchangeId: latest.exchangeId,
          msToOpen: elapsed(answeredAtRef.current),
          sourceCount: answer?.sources.size ?? 0,
        });
      }
    },
    [onTelemetry],
  );
  const openSources = useCallback(() => showSources(null), [showSources]);
  const openSourcesFor = useCallback((id: string) => showSources(id), [showSources]);

  const closeSources = useCallback(() => setSourcesOpen(false), []);

  /* --- proposals ---------------------------------------------------- */

  const proposalRisk = useMemo(
    () =>
      proposal ? classifyProposal(proposal, { forbidDosing: mode.output.forbidDosing }) : null,
    [proposal, mode.output.forbidDosing],
  );

  const confirm = useCallback(() => {
    const proposal = pendingProposal(stateRef.current);
    if (!proposal || !actor) return;
    const dwellMs = elapsed(proposalShownAtRef.current);
    let confirmed: ConfirmedProposal;
    try {
      confirmed = confirmProposal(proposal, actor, {
        confirmedAt: now(),
        dwellMs,
        forbidDosing: mode.output.forbidDosing,
      });
    } catch (cause) {
      // A prohibited proposal is a contract violation, not a crash in a click
      // handler. Shown as an error; the reducer drops the proposal.
      const message = cause instanceof Error ? cause.message : "Proposal cannot be confirmed.";
      dispatch({
        type: "fail",
        error: copilotError("contract-violation", message, { retryable: false, cause }),
      });
      return;
    }
    onTelemetry?.({
      type: "proposal-confirmed",
      exchangeId: stateRef.current.exchangeId ?? "",
      dwellMs,
      reflexive: isReflexive(confirmed),
    });
    dispatch({ type: "confirm", confirmed });
  }, [actor, mode.output.forbidDosing, now, onTelemetry, dispatch]);

  const dismissProposal = useCallback(() => {
    onTelemetry?.({ type: "proposal-dismissed", exchangeId: stateRef.current.exchangeId ?? "" });
    dispatch({ type: "dismiss-proposal" });
  }, [onTelemetry, dispatch]);

  const dismissFeedbackReason = useCallback(() => setAwaitingFeedbackReason(null), []);

  const recordFeedback = useCallback(
    (target: string | null, rating: "up" | "down", reason?: FeedbackReason, askReason = true) => {
      const latest = stateRef.current;
      // Null targets the latest answer; an id targets that message's exchange.
      const message =
        target === null
          ? [...latest.messages].reverse().find((m) => m.role === "assistant")
          : latest.messages.find((m) => m.id === target);
      const exchangeId = target === null ? latest.exchangeId : message?.exchangeId;
      // A bare thumbs-down asks for the reason rather than recording a signal
      // nobody can act on. Thumbs-up records immediately: there is nothing to
      // diagnose about an answer that worked.
      if (rating === "down" && reason === undefined && askReason) {
        setAwaitingFeedbackReason(message?.id ?? "pending");
        return;
      }
      setAwaitingFeedbackReason(null);
      onTelemetry?.({
        type: "feedback",
        exchangeId: exchangeId ?? "",
        rating,
        ...(reason ? { reason } : {}),
      });
    },
    [onTelemetry],
  );
  const sendFeedback = useCallback(
    (rating: "up" | "down", reason?: FeedbackReason) => recordFeedback(null, rating, reason),
    [recordFeedback],
  );
  const sendFeedbackFor = useCallback(
    (
      messageId: string,
      rating: "up" | "down",
      reason?: FeedbackReason,
      options?: { readonly askReason?: boolean },
    ) => recordFeedback(messageId, rating, reason, options?.askReason ?? true),
    [recordFeedback],
  );

  /* --- derived ------------------------------------------------------ */

  const announcer = useAnnouncer({
    status: state.status,
    answer: state.current,
    ...(announcementMode ? { mode: announcementMode } : {}),
  });

  const scope: ScopeSummary = useMemo(
    () => ({
      subject,
      // Clinical English, not FHIR. `mode.reads` stays the contract; this is
      // the sentence a clinician actually reads mid-consultation, and one they
      // skip is the scope control defeated.
      categories: categoryLabels(mode.reads),
      resourceTypes: mode.reads,
      withheldCount: state.context ? disclosableWithheldCount(state.context) : 0,
      showWithheld: state.context ? hasDisclosableWithholding(state.context) : false,
      asOf: state.context?.asOf,
    }),
    [subject, mode.reads, state.context],
  );

  const crisisLines = useMemo(
    () => resolveCrisisLines(locale, crisisOverrides),
    [locale, crisisOverrides],
  );

  // Abort anything in flight when the component goes away, so a suppressed or
  // unmounted dock cannot leave a request running against a patient's record.
  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    state,
    mode,
    modes,
    setMode,
    draft: state.draft,
    setDraft,
    submit,
    retry,
    canRetry: lastQuestion !== undefined && !suppressed,
    stop,
    newThread,
    canSubmit:
      !suppressed &&
      state.draft.trim().length > 0 &&
      state.status !== "streaming" &&
      state.status !== "submitting" &&
      state.status !== "crisis",
    dictation,
    sources,
    citations,
    sourcesOpen,
    openSources,
    openSourcesFor,
    closeSources,
    proposal,
    proposalRisk,
    confirm,
    dismissProposal,
    crisisLines,
    scope,
    announcer,
    suppressed,
    disclosure: provider.disclosure,
    sendFeedback,
    sendFeedbackFor,
    collapsed,
    setCollapsed,
    threads,
    activeThreadId,
    switchThread,
    awaitingFeedbackReason,
    dismissFeedbackReason,
  };
}

/**
 * `useReducer` with a stable dispatch that also survives the pipeline calling
 * it many times per frame.
 *
 * Written out rather than using `useReducer` directly so the reducer identity
 * is fixed and `dispatch` never changes, which keeps every `useCallback` below
 * from invalidating on each render.
 */
function useReducerState(
  modeId: string,
  canCite: boolean,
): [SessionState, (action: SessionAction) => void] {
  const [state, setState] = useState<SessionState>(() => initialState(modeId, canCite));
  const dispatch = useCallback((action: SessionAction) => {
    setState((current) => reduce(current, action));
  }, []);
  return [state, dispatch];
}

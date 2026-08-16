/**
 * `useConsult` — the whole component's behaviour, without a single style.
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
  confirmProposal,
  disclosableWithheldCount,
  hasDisclosableWithholding,
  initialState,
  isReflexive,
  reduce,
  requireMode,
  resolveCrisisLines,
  runExchange,
  type ActionProposal,
  type Actor,
  type ConsultContextResolver,
  type ConsultMode,
  type ConsultProvider,
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
} from "@oxygenui-design/consult-core";
import { useAnnouncer, type Announcer, type AnnouncementMode } from "./use-announcer.js";

export interface UseConsultOptions {
  readonly provider: ConsultProvider;
  readonly modes: readonly ConsultMode[];
  readonly initialModeId?: string;
  readonly context?: ConsultContextResolver;
  readonly subject?: Reference;
  readonly locale?: string;
  readonly classifiers?: SafetyClassifiers;
  readonly onAudit?: AuditSink;
  readonly onTelemetry?: TelemetrySink;
  readonly actor?: Actor;
  /**
   * Law 5, and the FDA's time-critical clause in criterion 4. When true the
   * hook refuses to submit and the skin renders nothing at all.
   */
  readonly suppressed?: boolean;
  /** Which surface this is. `patient` throws for every built-in mode. */
  readonly surface?: "clinician" | "patient";
  readonly announcementMode?: AnnouncementMode;
  readonly crisisLines?: Readonly<Record<string, readonly CrisisLine[]>>;
  /** Injected for tests. Defaults to real implementations. */
  readonly now?: () => string;
  readonly newId?: () => string;
}

export interface ScopeSummary {
  readonly subject: Reference | undefined;
  readonly categories: readonly string[];
  readonly withheldCount: number;
  readonly showWithheld: boolean;
  readonly asOf: string | undefined;
}

export interface ConsultApi {
  readonly state: SessionState;
  readonly mode: ConsultMode;
  readonly modes: readonly ConsultMode[];
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

  readonly sources: readonly Source[];
  readonly sourcesOpen: boolean;
  /** Opening the drawer emits the verification-rate signal. §17. */
  readonly openSources: () => void;
  readonly closeSources: () => void;

  readonly proposal: ActionProposal | null;
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

  readonly sendFeedback: (rating: "up" | "down", reason?: FeedbackReason) => void;
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
    : `consult-${++fallbackId}`;

export function useConsult(options: UseConsultOptions): ConsultApi {
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
  const abortRef = useRef<AbortController | null>(null);
  const answeredAtRef = useRef<number | null>(null);
  const proposalShownAtRef = useRef<number | null>(null);

  const mode = useMemo(() => requireMode(modes, state.modeId), [modes, state.modeId]);

  // Throws for every built-in mode when `surface` is "patient". Deliberately
  // during render rather than on submit: a developer wiring this up wrongly
  // should find out on first paint, not on a patient's first message.
  assertClinicianFacing(mode, surface);

  /* --- verification timing ----------------------------------------- */

  useEffect(() => {
    if (state.status === "complete") {
      answeredAtRef.current = stamp();
      setSourcesOpen(false);
    }
  }, [state.status]);

  useEffect(() => {
    if (state.proposal) proposalShownAtRef.current = stamp();
  }, [state.proposal]);

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

  const newThread = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "new-thread" });
    setSourcesOpen(false);
  }, [dispatch]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const submit = useCallback(
    async (override?: string) => {
      const question = (override ?? stateRef.current.draft).trim();
      if (!question || suppressed) return;
      if (stateRef.current.status === "streaming" || stateRef.current.status === "submitting") {
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

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
          ...(actor ? { actor: { display: actor.display, ...(actor.reference ? { reference: actor.reference } : {}) } } : {}),
          now,
          newId,
        },
        dispatch,
        signal: controller.signal,
      });
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
        dispatch(final === undefined ? { type: "dictation-stop" } : { type: "dictation-stop", transcript: final }),
    }),
    [state.status, state.transcript, dispatch],
  );

  /* --- sources ------------------------------------------------------ */

  // Destructured first: the exhaustive-deps rule treats any `.current` access
  // as a ref, and `state.current` is the streaming answer rather than one.
  const streaming = state.current;
  const sources = useMemo(
    () => (streaming ? [...streaming.sources.values()] : []),
    [streaming],
  );

  const openSources = useCallback(() => {
    setSourcesOpen(true);
    // The verification signal. A falling rate is the automation-bias early
    // warning, and `msToOpen` is Law 2 made measurable.
    if (onTelemetry && state.exchangeId) {
      onTelemetry({
        type: "sources-opened",
        exchangeId: state.exchangeId,
        msToOpen: elapsed(answeredAtRef.current),
        sourceCount: sources.length,
      });
    }
  }, [onTelemetry, state.exchangeId, sources.length]);

  const closeSources = useCallback(() => setSourcesOpen(false), []);

  /* --- proposals ---------------------------------------------------- */

  const confirm = useCallback(() => {
    const proposal = stateRef.current.proposal;
    if (!proposal || !actor) return;
    const dwellMs = elapsed(proposalShownAtRef.current);
    const confirmed = confirmProposal(proposal, actor, {
      confirmedAt: now(),
      dwellMs,
      forbidDosing: mode.output.forbidDosing,
    });
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

  const sendFeedback = useCallback(
    (rating: "up" | "down", reason?: FeedbackReason) => {
      onTelemetry?.({
        type: "feedback",
        exchangeId: stateRef.current.exchangeId ?? "",
        rating,
        ...(reason ? { reason } : {}),
      });
    },
    [onTelemetry],
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
      categories: mode.reads,
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
    sourcesOpen,
    openSources,
    closeSources,
    proposal: state.proposal,
    confirm,
    dismissProposal,
    crisisLines,
    scope,
    announcer,
    suppressed,
    disclosure: provider.disclosure,
    sendFeedback,
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

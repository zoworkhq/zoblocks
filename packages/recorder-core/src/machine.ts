/**
 * The capture machine: eleven phases and four terminals, §06.
 *
 * It lives here — no React, no DOM — so the same edges hold in a test, in a
 * web component and on a server. Four of them are load-bearing and none is
 * obvious:
 *
 *   `armed` is not `idle`. Permission is granted and the device is chosen,
 *   but nothing is being captured and no basis is recorded. Most
 *   implementations collapse the two and then have nowhere to put the consent
 *   step. **The `armed → recording` edge is blocked without resolved consent,
 *   and that check lives here rather than in a button handler**, because a
 *   guard in a click handler is a guard exactly one caller honours.
 *
 *   `held` is not `stopping` and not `uploading`. It is a resting state that
 *   can last for days, on a laptop in a bag, and it has to survive a reload.
 *   A recorder that shows a tick while the bytes are still in IndexedDB has
 *   told a clinician something false about a legal record.
 *
 *   `paused` is not a dropped stream. Clinicians step out of the room, and
 *   pause has to be visually distinct from both `stopping` and a device
 *   fault, or the component teaches people to distrust all three.
 *
 *   `failed` is not terminal for the audio. A failed transcription is a
 *   failed transcription; the recording is intact and the step is retryable.
 *   Collapsing them is the commonest way a pipeline throws away the expensive
 *   artefact because the cheap one broke — so recovery exists, as an explicit
 *   call rather than an ordinary edge.
 */

import { resolveConsent } from "./consent";
import type {
  ConsentVerdict,
  RecorderConsent,
  RecorderEvent,
  RecorderState,
  RecorderTerminal,
} from "./types";
import { RECORDER_TERMINALS } from "./types";

const TERMINALS: ReadonlySet<string> = new Set(RECORDER_TERMINALS);

/** Whether a state is one of the four terminals. */
export function isTerminal(state: RecorderState): state is RecorderTerminal {
  return TERMINALS.has(state);
}

/**
 * The transition table.
 *
 * Read it as the whole contract: an event not listed for a state is not
 * merely undefined, it is refused. The four terminals have no entries at all,
 * which is what makes "terminal" a property of this table rather than a claim
 * in a comment.
 */
export const RECORDER_TRANSITIONS: Readonly<
  Record<RecorderState, Partial<Record<RecorderEvent, RecorderState>>>
> = Object.freeze({
  idle: { request: "requesting" },
  // Dismissed is not denied. The prompt can be raised again after a dismissal
  // and cannot after a denial, and collapsing the two produces a dead end
  // with a retry button that re-prompts and silently fails (§11 rows 1–2).
  requesting: { grant: "armed", deny: "denied", dismiss: "idle", lose: "unavailable" },
  armed: { start: "recording", disarm: "idle", lose: "unavailable", discard: "discarded" },
  recording: { pause: "paused", stop: "stopping", lose: "unavailable" },
  paused: { resume: "recording", stop: "stopping", lose: "unavailable" },
  // A quota failure stops cleanly and holds what exists (§11 row 10); it does
  // not fail. `fail` here is a finalise that genuinely could not write.
  stopping: { settle: "held", fail: "failed" },
  held: { upload: "uploading", transcribe: "transcribing", discard: "discarded" },
  uploading: { queue: "queued", transcribe: "transcribing", complete: "ready", fail: "failed" },
  queued: { upload: "uploading", transcribe: "transcribing", fail: "failed" },
  transcribing: { complete: "ready", fail: "failed" },
  ready: { discard: "discarded" },
  denied: {},
  unavailable: {},
  failed: {},
  discarded: {},
});

/** Why a `send` did not move the machine. */
export type RefusalReason =
  | "no-such-edge"
  | "consent-absent"
  | "consent-incomplete"
  | "consent-not-all-parties";

export interface TransitionResult {
  /** Whether the machine moved. */
  readonly ok: boolean;
  readonly from: RecorderState;
  /** Where it is now — unchanged from `from` when `ok` is false. */
  readonly phase: RecorderState;
  readonly event: RecorderEvent;
  readonly reason?: RefusalReason;
}

export interface RecorderMachineOptions {
  readonly phase?: RecorderState;
  readonly consent?: RecorderConsent | null;
  /**
   * Whether this recording needs an affirmative basis at all.
   *
   * Defaults to `true`. A host that sets it false is asserting that its
   * jurisdiction and its use case do not require one — which is a decision
   * the host is entitled to make and this component is not.
   */
  readonly consentRequired?: boolean;
  /** Called after every accepted transition. */
  readonly onTransition?: (result: TransitionResult) => void;
}

export interface RecorderMachine {
  readonly phase: RecorderState;
  /** The state that was current when the machine last entered a terminal. */
  readonly failedFrom: RecorderState | null;
  readonly consent: RecorderConsent | null;
  readonly consentVerdict: ConsentVerdict;
  /** Whether `event` would be accepted right now, guards included. */
  can(event: RecorderEvent): boolean;
  /** Why `event` would be refused, or `null` if it would be accepted. */
  refusal(event: RecorderEvent): RefusalReason | null;
  send(event: RecorderEvent): TransitionResult;
  /** Replace the asserted basis. Never authored here, only held. */
  setConsent(consent: RecorderConsent | null): void;
  /**
   * Leave a recoverable terminal.
   *
   * `failed` returns to `held` when there is audio behind it, because a
   * failed upload or transcription leaves the recording intact and retryable.
   * `unavailable` returns to `held` when capture had begun — the audio to
   * that point is intact and must be held, not discarded (§11 row 5) — and to
   * `idle` when it had not. `denied` and `discarded` do not recover.
   */
  recover(): TransitionResult;
  /** A new encounter. Not a rewind: clears the terminal history too. */
  reset(): void;
  subscribe(listener: (result: TransitionResult) => void): () => void;
}

/** States from which a terminal still has audio worth holding. */
const HAS_AUDIO: ReadonlySet<RecorderState> = new Set<RecorderState>([
  "recording",
  "paused",
  "stopping",
  "held",
  "uploading",
  "queued",
  "transcribing",
  "ready",
]);

export function createRecorderMachine(options: RecorderMachineOptions = {}): RecorderMachine {
  let phase: RecorderState = options.phase ?? "idle";
  let consent: RecorderConsent | null = options.consent ?? null;
  const consentRequired = options.consentRequired ?? true;
  let failedFrom: RecorderState | null = null;

  const listeners = new Set<(result: TransitionResult) => void>();
  if (options.onTransition) listeners.add(options.onTransition);

  function verdict(): ConsentVerdict {
    return resolveConsent(consent, { required: consentRequired });
  }

  function refusal(event: RecorderEvent): RefusalReason | null {
    const next = RECORDER_TRANSITIONS[phase][event];
    if (next === undefined) return "no-such-edge";
    // The one guard, and the reason the machine exists rather than a switch
    // statement in a component. `armed → recording` is where a disclosure
    // begins, so it is the edge that has to be impossible to take by accident.
    if (phase === "armed" && event === "start") {
      const resolved = verdict();
      if (resolved === "absent") return "consent-absent";
      if (resolved === "incomplete") return "consent-incomplete";
      if (resolved === "not-all-parties") return "consent-not-all-parties";
    }
    return null;
  }

  function emit(result: TransitionResult): TransitionResult {
    if (result.ok) for (const listener of listeners) listener(result);
    return result;
  }

  function send(event: RecorderEvent): TransitionResult {
    const from = phase;
    const reason = refusal(event);
    if (reason !== null) return { ok: false, from, phase, event, reason };

    const next = RECORDER_TRANSITIONS[from][event] as RecorderState;
    if (isTerminal(next)) failedFrom = from;
    phase = next;
    return emit({ ok: true, from, phase, event });
  }

  return {
    get phase() {
      return phase;
    },
    get failedFrom() {
      return failedFrom;
    },
    get consent() {
      return consent;
    },
    get consentVerdict() {
      return verdict();
    },
    can(event) {
      return refusal(event) === null;
    },
    refusal,
    send,
    setConsent(next) {
      consent = next;
    },
    recover() {
      const from = phase;
      const event: RecorderEvent = "settle";
      if (from !== "failed" && from !== "unavailable") {
        return { ok: false, from, phase, event, reason: "no-such-edge" };
      }
      const salvage: RecorderState =
        failedFrom !== null && HAS_AUDIO.has(failedFrom) ? "held" : "idle";
      phase = salvage;
      failedFrom = null;
      return emit({ ok: true, from, phase, event });
    },
    reset() {
      phase = "idle";
      failedFrom = null;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

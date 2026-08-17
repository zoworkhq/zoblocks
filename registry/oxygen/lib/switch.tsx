"use client";

/**
 * switch-core — the state model behind Oxygen's Switch.
 *
 * A switch in a consumer application is one axis: `checked`. In a shared
 * clinical record it is three, and they are genuinely independent — a control
 * can be on, reverting, and read-only at the same time, and each fact needs its
 * own rendering:
 *
 *   1. **value**        what the record says — true, false, or "unknown"
 *   2. **phase**        what the system is doing about it — the commit machine
 *   3. **availability** whether you may change it, and why not
 *
 * Everything here is axis 1 and axis 2. Axis 3 is presentation and lives in the
 * component.
 *
 * `useCommitPhase` is exported on its own for the same reason `useLoadingGate`
 * is: an application will need this decision for something that is not an
 * Oxygen Switch — a checkbox, a segmented control, an inline dropdown — and a
 * second hand-rolled copy of it is a second set of bugs.
 *
 * Styling lives in `styles/oxygen-switch.css`, installed alongside this file.
 * No Tailwind utilities: keyframes cannot be expressed as tokens, and a
 * component whose motion depends on the host's Tailwind config renders
 * unstyled in a Vue app.
 *
 * See content/decisions/0010-antd-compatible-primitives.md.
 */

import * as React from "react";

/**
 * Elapsed time, measured on a monotonic clock.
 *
 * Never the wall clock. `Date.now()` moves when the system clock is adjusted —
 * an NTP step or a daylight-saving change mid-request would make a 200ms write
 * measure as an hour, or as negative. `performance.now()` cannot go backwards,
 * which is the only property these measurements need. It is also why the
 * repository's rule against reading the clock inside a component is satisfied
 * here rather than suppressed: nothing below asks what time it is, only how
 * long something took. What time it is always arrives as `now`, from the
 * caller.
 *
 * Falls back to 0 where `performance` is absent, which degrades a minimum
 * pending window to "no minimum" rather than throwing.
 */
export function elapsedClock(): number {
  return typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : 0;
}

/* ------------------------------------------------------------------ */
/* Axis 1 — value                                                      */
/* ------------------------------------------------------------------ */

/**
 * What the record says.
 *
 * `"unknown"` is the value a binary control cannot express, and the reason
 * this component exists. "Advance directive: off" and "nobody asked about the
 * advance directive" are clinically different facts, and rendering them
 * identically is how a switch comes to make a claim nobody checked.
 *
 * A user can leave `"unknown"`. A user can never enter it — see
 * `nextValueFor` below.
 */
export type SwitchValue = boolean | "unknown";

/**
 * Why a value is absent.
 *
 * Structurally identical to `AbsentReason` in `@oxygenui-design/fhir`, which is
 * the normalised form of a FHIR `dataAbsentReason`. It is restated here rather
 * than imported because a primitive takes no dependency it does not need
 * (ADR 0010) — pipe `resolveAbsentReason(obs.dataAbsentReason)` straight in.
 * A type test asserts the two unions have not drifted.
 */
export type AbsentReason =
  | "unknown"
  | "pending"
  | "not-collected"
  | "declined"
  | "masked"
  | "not-permitted"
  | "not-applicable"
  | "not-performed"
  | "as-text"
  | "error"
  | "unstated";

/**
 * The word rendered for each absence.
 *
 * Every member gets its own. A shared shrug — "—", "N/A", "Unknown" for all
 * eleven — is CONTENT.md §1's first failure, and a table-driven test fails the
 * build if a new member arrives without a word.
 */
export const ABSENT_REASON_LABEL: Record<AbsentReason, string> = {
  unknown: "Not known",
  pending: "Result pending",
  "not-collected": "Not asked",
  declined: "Declined to answer",
  masked: "Restricted — not shown",
  "not-permitted": "Not available to you",
  "not-applicable": "Does not apply",
  "not-performed": "Not performed",
  "as-text": "Recorded as text",
  error: "Could not load",
  unstated: "Not recorded",
};

export function isUnknown(value: SwitchValue): value is "unknown" {
  return value === "unknown";
}

/**
 * What activating the control commits.
 *
 * From `"unknown"` this is `true` — the affirmative, because that is the
 * answer somebody is recording. There is deliberately no path back: allowing a
 * user to re-enter `"unknown"` would let them un-ask a question, and the
 * correction for a wrong answer is a new answer with a provenance, never an
 * erasure. A caller that needs to record "no" from an unknown state uses
 * `requestOff`, which every appearance exposes.
 */
export function nextValueFor(current: SwitchValue): boolean {
  return current === true ? false : true;
}

/* ------------------------------------------------------------------ */
/* Axis 2 — the commit phase machine                                   */
/* ------------------------------------------------------------------ */

/**
 * What the system is doing about the request.
 *
 * Each member is a different recovery action, which is the test for whether a
 * state deserves to exist:
 *
 *   idle       nothing in flight
 *   pending    sent, awaiting the server. Still focusable — a spinner that
 *              removes the control is a disabled state wearing a costume.
 *   committed  landed. A brief confirmation, then back to idle.
 *   reverted   we tried and it failed. Retry is reasonable.
 *   blocked    refused before trying. Retry fails identically.
 *   queued     not sent at all — offline. May be cancelled.
 *   stale      somebody else's write landed and disagrees with what you see.
 */
export type CommitPhase =
  "idle" | "pending" | "committed" | "reverted" | "blocked" | "queued" | "stale";

/**
 * Phase guards, so a caller never compares against a string literal.
 *
 * A typo in `phase === "commited"` is silently false forever: the branch never
 * runs, nothing throws, and the bug is a missing confirmation nobody notices.
 * These narrow, so the same typo is a compile error.
 */
export function isPending(phase: CommitPhase): boolean {
  return phase === "pending" || phase === "queued";
}

export function isCommitted(phase: CommitPhase): phase is "committed" {
  return phase === "committed";
}

/** Reverted, blocked or stale — the three that need a human before they clear. */
export function isUnresolved(phase: CommitPhase): boolean {
  return phase === "reverted" || phase === "blocked" || phase === "stale";
}

/** Thrown (or rejected with) from `onCommit` to reach `blocked` rather than `reverted`. */
export class SwitchBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SwitchBlockedError";
  }
}

export interface CommitContext {
  /** The value being moved away from. */
  from: SwitchValue;
  /** Monotonic request id. A response whose sequence is not the latest is discarded. */
  sequence: number;
  /** Free text collected by `confirm="attest"`. */
  reason?: string;
  /** ISO 8601, supplied by the caller. The component never reads the clock. */
  now?: string;
}

export interface SwitchAuditEvent {
  type: "requested" | "committed" | "reverted" | "blocked" | "queued" | "cancelled" | "resolved";
  at: string;
  from: SwitchValue;
  to: SwitchValue;
  reason?: string;
  detail?: string;
}

export interface UseCommitPhaseOptions {
  /** The value the record holds. While pending, the REQUESTED value is rendered instead. */
  value: SwitchValue;
  /**
   * Return a promise and this hook owns the machine: pending while in flight,
   * committed on resolve, reverted on reject. Reject with a `SwitchBlockedError`
   * to reach `blocked` instead.
   */
  onCommit?: (next: boolean, ctx: CommitContext) => void | Promise<void>;
  /**
   * An external value that disagrees with `value`. Puts the control in `stale`.
   * Never auto-resolved: a conflict between two clinicians is not a merge
   * problem, and picking a winner discards somebody's reasoning silently.
   */
  serverValue?: SwitchValue;
  /** `false` queues the commit instead of sending it. */
  online?: boolean;
  /** Minimum time in `pending`, so a fast write is perceptible rather than a flash. */
  minPendingMs?: number;
  /** How long `committed` is shown before returning to `idle`. */
  committedMs?: number;
  /** Announce a stall after this long. 0 disables. */
  slowAfter?: number;
  onSlow?: () => void;
  /** ISO 8601 from the server. Required alongside `onAuditEvent`. */
  now?: string;
  onAuditEvent?: (event: SwitchAuditEvent) => void;
}

export interface CommitPhaseState {
  phase: CommitPhase;
  /** The value to render right now — the request while in flight, the record otherwise. */
  shown: SwitchValue;
  /** What the user asked for, while `pending` or `queued`. */
  requested?: boolean;
  /** Present in `reverted` and `blocked`. */
  error?: string;
  /** The value the record now holds, while `stale`. */
  conflicting?: SwitchValue;
  /** True once `slowAfter` has elapsed on a pending request. */
  slow: boolean;
  /** Ask for a new value. Supersedes anything in flight. */
  request: (next: boolean, reason?: string) => void;
  /** Drop a queued change without sending it. */
  cancelQueued: () => void;
  /** Dismiss `reverted` or `blocked` and return to `idle`. */
  acknowledge: () => void;
  /** Resolve a `stale` conflict. `"theirs"` adopts the record; `"mine"` re-sends yours. */
  resolveConflict: (keep: "mine" | "theirs") => void;
}

const DEFAULT_MIN_PENDING = 220;
const DEFAULT_COMMITTED_MS = 800;
const DEFAULT_SLOW_AFTER = 4000;

export function useCommitPhase({
  value,
  onCommit,
  serverValue,
  online = true,
  minPendingMs = DEFAULT_MIN_PENDING,
  committedMs = DEFAULT_COMMITTED_MS,
  slowAfter = DEFAULT_SLOW_AFTER,
  onSlow,
  now,
  onAuditEvent,
}: UseCommitPhaseOptions): CommitPhaseState {
  const [phase, setPhase] = React.useState<CommitPhase>("idle");
  const [requested, setRequested] = React.useState<boolean | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [slow, setSlow] = React.useState(false);

  /**
   * Monotonic request id.
   *
   * Toggle on, toggle off, and the two writes race. Resolving by whichever
   * response arrives last means a slow first request can overwrite a fast
   * second one, leaving the control showing a value the user explicitly
   * changed away from. A response whose sequence is not the latest is dropped
   * without touching state.
   */
  const sequence = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const alive = React.useRef(true);

  const after = React.useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      if (alive.current) fn();
    }, ms);
    timers.current.push(id);
    return id;
  }, []);

  const clearTimers = React.useCallback(() => {
    for (const id of timers.current) clearTimeout(id);
    timers.current = [];
  }, []);

  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      for (const id of timers.current) clearTimeout(id);
      timers.current = [];
    };
  }, []);

  // Refs, so the audit callback and the clock do not re-create `request` on
  // every render and restart timers underneath an in-flight commit.
  const audit = React.useRef(onAuditEvent);
  audit.current = onAuditEvent;
  const clock = React.useRef(now);
  clock.current = now;
  const commit = React.useRef(onCommit);
  commit.current = onCommit;
  const slowCb = React.useRef(onSlow);
  slowCb.current = onSlow;

  const record = React.useCallback((event: Omit<SwitchAuditEvent, "at">) => {
    const handler = audit.current;
    if (!handler) return;
    // `now` is required alongside onAuditEvent at the type level. The
    // fallback exists so a missing value cannot throw inside a callback the
    // host supplied for governance — an empty timestamp is visible in an
    // audit log; a crash in the toggle handler is not.
    handler({ ...event, at: clock.current ?? "" });
  }, []);

  /* -------------------------------------------------------------- */
  /* stale — somebody else's write landed                            */
  /* -------------------------------------------------------------- */

  const conflicting = serverValue !== undefined && serverValue !== value ? serverValue : undefined;

  React.useEffect(() => {
    // A conflict never interrupts an in-flight request: the response is about
    // to change the picture anyway, and two competing explanations on screen
    // is worse than one that arrives a moment later.
    if (conflicting === undefined) {
      setPhase((current) => (current === "stale" ? "idle" : current));
      return;
    }
    setPhase((current) => (current === "pending" || current === "queued" ? current : "stale"));
  }, [conflicting]);

  /* -------------------------------------------------------------- */
  /* request                                                         */
  /* -------------------------------------------------------------- */

  const request = React.useCallback(
    (next: boolean, reason?: string) => {
      clearTimers();
      setSlow(false);
      setError(undefined);

      const mine = ++sequence.current;
      setRequested(next);
      record({ type: "requested", from: value, to: next, reason });

      // Offline: nothing is sent. Queued is not pending — the user may still
      // change their mind, and telling them it is on its way would be a lie.
      if (!online) {
        setPhase("queued");
        record({ type: "queued", from: value, to: next, reason });
        return;
      }

      setPhase("pending");

      if (slowAfter > 0) {
        after(slowAfter, () => {
          if (mine !== sequence.current) return;
          setSlow(true);
          slowCb.current?.();
        });
      }

      const started = elapsedClock();
      const handler = commit.current;
      const settle = (fn: () => void) => {
        const held = Math.max(0, minPendingMs - (elapsedClock() - started));
        after(held, () => {
          if (mine !== sequence.current) return;
          fn();
        });
      };

      const succeed = () => {
        setSlow(false);
        setPhase("committed");
        record({ type: "committed", from: value, to: next, reason });
        after(committedMs, () => {
          if (mine !== sequence.current) return;
          setPhase("idle");
          setRequested(undefined);
        });
      };

      const fail = (cause: unknown) => {
        setSlow(false);
        setRequested(undefined);
        const blocked = cause instanceof SwitchBlockedError;
        const message =
          cause instanceof Error && cause.message ? cause.message : "The change was not saved.";
        setError(message);
        setPhase(blocked ? "blocked" : "reverted");
        record({
          type: blocked ? "blocked" : "reverted",
          from: value,
          to: next,
          reason,
          detail: message,
        });
      };

      if (!handler) {
        settle(succeed);
        return;
      }

      let result: void | Promise<void>;
      try {
        result = handler(next, { from: value, sequence: mine, reason, now: clock.current });
      } catch (cause) {
        settle(() => fail(cause));
        return;
      }

      if (result && typeof (result as Promise<void>).then === "function") {
        void (result as Promise<void>).then(
          () => settle(succeed),
          (cause: unknown) => settle(() => fail(cause)),
        );
        return;
      }

      settle(succeed);
    },
    [after, clearTimers, committedMs, minPendingMs, online, record, slowAfter, value],
  );

  /* -------------------------------------------------------------- */
  /* flush — reconnecting sends what was queued                      */
  /* -------------------------------------------------------------- */

  const queuedRef = React.useRef<boolean | undefined>(undefined);
  queuedRef.current = phase === "queued" ? requested : undefined;

  React.useEffect(() => {
    if (!online) return;
    const pendingValue = queuedRef.current;
    if (pendingValue === undefined) return;
    request(pendingValue);
    // `request` is stable enough for this: it changes only when the record's
    // value or the timing options change, and either is a reason to re-evaluate
    // a queued write anyway.
  }, [online, request]);

  const cancelQueued = React.useCallback(() => {
    if (phase !== "queued") return;
    sequence.current += 1;
    clearTimers();
    const dropped = requested;
    setRequested(undefined);
    setPhase("idle");
    record({ type: "cancelled", from: value, to: dropped ?? value });
  }, [clearTimers, phase, record, requested, value]);

  const acknowledge = React.useCallback(() => {
    setPhase((current) => (current === "reverted" || current === "blocked" ? "idle" : current));
    setError(undefined);
    setRequested(undefined);
  }, []);

  const resolveConflict = React.useCallback(
    (keep: "mine" | "theirs") => {
      if (conflicting === undefined) return;
      record({
        type: "resolved",
        from: value,
        to: keep === "theirs" ? conflicting : value,
        detail: keep,
      });
      if (keep === "mine" && typeof value === "boolean") {
        request(value);
        return;
      }
      setPhase("idle");
    },
    [conflicting, record, request, value],
  );

  /* -------------------------------------------------------------- */
  /* what to render                                                  */
  /* -------------------------------------------------------------- */

  const shown: SwitchValue =
    (phase === "pending" || phase === "queued" || phase === "committed") && requested !== undefined
      ? requested
      : value;

  return {
    phase,
    shown,
    requested: phase === "pending" || phase === "queued" ? requested : undefined,
    error,
    conflicting: phase === "stale" ? conflicting : undefined,
    slow,
    request,
    cancelQueued,
    acknowledge,
    resolveConflict,
  };
}

/* ------------------------------------------------------------------ */
/* Words                                                               */
/* ------------------------------------------------------------------ */

export interface StateLabels {
  on: string;
  off: string;
  unknown: string;
}

/**
 * "On" and "Off" are correct for a light switch and wrong for almost
 * everything in a clinical record. A precaution is *in effect*; a consent is
 * *given*; an order is *active*; a flag is *set*.
 *
 * The word is not decoration — it is the signal that survives greyscale,
 * forced colours and a screen reader, and the one that carries the state when
 * on-track and off-track sit within 1.2:1 of each other in luminance.
 *
 * Every preset has its own unknown word. A shared shrug across all of them is
 * the failure this component exists to prevent.
 */
export const STATE_LABEL_PRESETS = {
  "on-off": { on: "On", off: "Off", unknown: "Not set" },
  "yes-no": { on: "Yes", off: "No", unknown: "Not asked" },
  "active-inactive": { on: "Active", off: "Inactive", unknown: "Not started" },
  "in-effect": { on: "In effect", off: "Not in effect", unknown: "Not assessed" },
  "allowed-blocked": { on: "Allowed", off: "Blocked", unknown: "Not specified" },
  /** Note that "off" here is a positive clinical act, not an absence. */
  "given-declined": { on: "Given", off: "Declined", unknown: "Not asked" },
  "enabled-disabled": { on: "Enabled", off: "Disabled", unknown: "Not configured" },
} as const satisfies Record<string, StateLabels>;

export type StateLabelPreset = keyof typeof STATE_LABEL_PRESETS;

export function resolveStateLabels(
  labels: StateLabelPreset | Partial<StateLabels> | undefined,
  absentReason?: AbsentReason,
): StateLabels {
  const base: StateLabels =
    typeof labels === "string"
      ? STATE_LABEL_PRESETS[labels]
      : { ...STATE_LABEL_PRESETS["on-off"], ...labels };

  // A specific absence always beats the preset's generic one. "Declined by
  // patient" and "Not asked" must not collapse into one another.
  return absentReason ? { ...base, unknown: ABSENT_REASON_LABEL[absentReason] } : base;
}

/** The word for a value, given the resolved label set. */
export function wordFor(value: SwitchValue, labels: StateLabels): string {
  if (value === "unknown") return labels.unknown;
  return value ? labels.on : labels.off;
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export interface Announcement {
  text: string;
  /** A failed write interrupts. A success does not. */
  politeness: "polite" | "assertive";
}

/**
 * What a screen reader hears, per phase.
 *
 * "Still {state}" in the revert case is the load-bearing clause. Without it a
 * listener knows the write failed but not what the value now is, which is the
 * question they were actually asking.
 */
export function announcementFor(
  phase: CommitPhase,
  label: string,
  shown: SwitchValue,
  serverWord: string,
  labels: StateLabels,
  error?: string,
): Announcement | undefined {
  const word = wordFor(shown, labels).toLowerCase();

  switch (phase) {
    case "pending":
      return { text: `${label}: setting to ${word}…`, politeness: "polite" };
    case "queued":
      return {
        text: `${label}: ${word} queued. Not sent yet — it will apply when the connection returns.`,
        politeness: "polite",
      };
    case "committed":
      return { text: `${label}: ${word}.`, politeness: "polite" };
    case "reverted":
      return {
        text: `${label} was not changed. ${error ?? ""} Still ${serverWord.toLowerCase()}.`.replace(
          /\s+/g,
          " ",
        ),
        politeness: "assertive",
      };
    case "blocked":
      return {
        text: `${label} cannot be changed. ${error ?? ""}`.trim(),
        politeness: "assertive",
      };
    case "stale":
      return {
        text: `${label} was changed by someone else. You are looking at ${word}; the record now says ${serverWord.toLowerCase()}. Choose which to keep.`,
        politeness: "assertive",
      };
    default:
      return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Geometry and appearance                                             */
/* ------------------------------------------------------------------ */

export type SwitchSize = "micro" | "small" | "default" | "large";
export type SwitchTone = "affirmative" | "neutral" | "caution" | "critical";
export type SwitchAppearance = "switch" | "labeled" | "segmented" | "chip" | "row";
export type SwitchAudience = "clinician" | "patient";

/**
 * Track and thumb geometry per size, in pixels.
 *
 * The hit area is deliberately NOT here — it comes from
 * `--ox-switch-target-min`, which follows the density profile. Shrinking the
 * pill must never shrink the target: a mis-tap on a clinical flag is not a
 * cosmetic defect, and SC 2.5.8 holds at every density.
 */
export const SWITCH_SIZE: Record<SwitchSize, { track: [number, number]; thumb: number }> = {
  micro: { track: [26, 14], thumb: 10 },
  small: { track: [32, 18], thumb: 14 },
  default: { track: [44, 24], thumb: 20 },
  large: { track: [56, 30], thumb: 26 },
};

/** A style object that may also carry CSS custom properties. */
export type SwitchVars = React.CSSProperties & Record<`--${string}`, string | number>;

export function sizeVars(size: SwitchSize): SwitchVars {
  const { track, thumb } = SWITCH_SIZE[size];
  return {
    "--ox-switch-track-w": `${track[0]}px`,
    "--ox-switch-track-h": `${track[1]}px`,
    "--ox-switch-thumb-size": `${thumb}px`,
  };
}

/* ------------------------------------------------------------------ */
/* Controlled / uncontrolled                                           */
/* ------------------------------------------------------------------ */

/**
 * The standard controllable-state pair.
 *
 * Written here rather than pulled from a library because it is fifteen lines
 * and the alternative is a runtime dependency in a primitive, which ADR 0010
 * spends some care avoiding.
 */
export function useControllable<T>(
  controlled: T | undefined,
  defaultValue: T,
): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : uncontrolled;

  const set = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
    },
    [isControlled],
  );

  return [value, set];
}

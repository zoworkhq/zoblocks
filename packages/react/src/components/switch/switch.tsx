"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/switch/switch.tsx. Edit that file, not this one.
/**
 * Switch — the binary control, for a record that is shared, asynchronous, and
 * frequently missing the fact you are asking it about.
 *
 * A switch promises something it usually cannot keep: *this is now true*. In
 * healthcare software that promise gets made over a hospital wifi network,
 * about a fact that may never have been asked, by someone wearing gloves, on a
 * record that may already be signed. This component models the request, the
 * outcome, and the gap between them — and never renders a state it cannot
 * substantiate.
 *
 * Three axes, all independent (see `@/lib/oxygen-switch`):
 *
 *   value         true · false · "unknown"          what the record says
 *   phase         idle · pending · committed ·      what the system is doing
 *                 reverted · blocked · queued ·
 *                 stale
 *   availability  editable · readOnly · disabled    whether you may change it
 *
 * The API matches Ant Design's Switch exactly, and takes no dependency on it.
 * `import { Switch } from "antd"` becomes `from "@oxygenui-design/react"` with
 * no other diff. The one deliberate divergence is `loading`, which maps to
 * `phase="pending"` and does *not* disable the control — see below.
 *
 * See content/decisions/0010-antd-compatible-primitives.md.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  announcementFor,
  elapsedClock,
  isUnknown,
  nextValueFor,
  resolveStateLabels,
  sizeVars,
  useCommitPhase,
  useControllable,
  wordFor,
  type AbsentReason,
  type CommitPhase,
  type StateLabelPreset,
  type StateLabels,
  type SwitchAppearance,
  type SwitchAudience,
  type SwitchAuditEvent,
  type SwitchSize,
  type SwitchTone,
  type SwitchValue,
  type SwitchVars,
} from "../../lib/switch";

export {
  ABSENT_REASON_LABEL,
  SWITCH_SIZE,
  SwitchBlockedError,
  STATE_LABEL_PRESETS,
  useCommitPhase,
  isUnknown,
  isPending,
  isCommitted,
  isUnresolved,
  type AbsentReason,
  type CommitPhase,
  type SwitchValue,
  type SwitchAuditEvent,
} from "../../lib/switch";

/* ------------------------------------------------------------------ */
/* Glyphs                                                              */
/* ------------------------------------------------------------------ */

/**
 * The thumb glyph is not decoration.
 *
 * On-track and off-track sit within about 1.2:1 of each other in relative
 * luminance, so in monochrome output and in forced colours the fill carries
 * nothing. Position, glyph and the state word each have to be sufficient alone.
 */
function Glyph({ kind }: { kind: "on" | "unknown" | "queued" | "locked" }) {
  const paths: Record<typeof kind, React.ReactNode> = {
    on: (
      <path
        d="M3 8.5l3.2 3.2L13 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    unknown: (
      <path
        d="M8 4.2v5.2M8 12.4v.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    ),
    queued: (
      <path
        d="M8 4v4l2.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    locked: (
      <path
        d="M4.6 7.4V5.6a3.4 3.4 0 016.8 0v1.8M4 7.4h8v5.2H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  };

  return (
    <svg className="ox-switch__glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {paths[kind]}
    </svg>
  );
}

function glyphFor(value: SwitchValue, phase: CommitPhase, readOnly: boolean) {
  if (phase === "queued") return "queued" as const;
  if (isUnknown(value)) return "unknown" as const;
  if (value && readOnly) return "locked" as const;
  if (value) return "on" as const;
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Hold to confirm                                                     */
/* ------------------------------------------------------------------ */

interface HoldState {
  progress: number;
  holding: boolean;
  start: () => void;
  /** Returns true when the hold lasted long enough to commit. */
  stop: () => boolean;
}

/**
 * Press and hold, decided by elapsed time rather than by frame count.
 *
 * `requestAnimationFrame` is throttled in a background tab, so a ring-driven
 * decision would silently refuse a hold the user genuinely completed. The ring
 * is the indicator; the clock is the contract.
 *
 * Holding is a timed input and SC 2.2.1 applies, which is why `holdMs` is a
 * token a host can set to 0 — and why keyboard and assistive-technology
 * activation never take this path at all. See `Switch`'s click handler.
 */
function useHold(holdMs: number): HoldState {
  const [progress, setProgress] = React.useState(0);
  const [holding, setHolding] = React.useState(false);
  const startedAt = React.useRef(0);
  const frame = React.useRef<number | undefined>(undefined);

  const cancelFrame = React.useCallback(() => {
    if (frame.current !== undefined) {
      cancelAnimationFrame(frame.current);
      frame.current = undefined;
    }
  }, []);

  React.useEffect(() => cancelFrame, [cancelFrame]);

  const tick = React.useCallback(() => {
    if (!startedAt.current) return;
    const elapsed = elapsedClock() - startedAt.current;
    setProgress(Math.min(100, (elapsed / holdMs) * 100));
    if (elapsed < holdMs) frame.current = requestAnimationFrame(tick);
  }, [holdMs]);

  const start = React.useCallback(() => {
    if (startedAt.current) return;
    // A sentinel, because elapsedClock() can legitimately return 0.
    startedAt.current = elapsedClock() + 1;
    setHolding(true);
    setProgress(0);
    frame.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = React.useCallback(() => {
    if (!startedAt.current) return false;
    const elapsed = elapsedClock() + 1 - startedAt.current;
    startedAt.current = 0;
    cancelFrame();
    setHolding(false);
    setProgress(0);
    return elapsed >= holdMs;
  }, [cancelFrame, holdMs]);

  return { progress, holding, start, stop };
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

export interface SwitchSlots {
  thumb?: (state: { value: SwitchValue; phase: CommitPhase }) => React.ReactNode;
  label?: React.ReactNode;
  description?: React.ReactNode;
  state?: (state: { value: SwitchValue; word: string }) => React.ReactNode;
}

export interface CountersignRequirement {
  /** The role a second signer must hold, e.g. "registered-nurse". */
  role: string;
  /**
   * The requester's id. The second signature must not be theirs — this is what
   * makes an independent double-check independent, and the thing most
   * implementations forget. Enforced here rather than left to `onCommit`.
   */
  notSameAs: string;
  /** Who has already signed, if anyone. */
  requestedBy?: string;
  /**
   * Resolves with the countersigner's id. Reject or resolve with the same id as
   * `notSameAs` and the commit is refused.
   */
  verify?: () => Promise<string>;
}

export interface SwitchProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "onChange" | "defaultChecked" | "children" | "onClick"
> {
  /* ---- antd-compatible core ------------------------------------- */

  /** `"unknown"` is Oxygen's widening. antd's `boolean` shape is unchanged. */
  checked?: SwitchValue;
  defaultChecked?: SwitchValue;
  /** antd's signature exactly. Fires optimistically, before the commit resolves. */
  onChange?: (checked: boolean, event: React.SyntheticEvent) => void;
  /**
   * The last resort, and almost always the wrong prop. Correct only when the
   * unavailability is transient and caused by something the user just did.
   * Everything else — policy, permission, record state, dependency — is
   * `readOnly` with a `lockedReason`.
   */
  disabled?: boolean;
  /**
   * Kept for drop-in compatibility, with the behaviour corrected: it maps to
   * `phase="pending"` and does **not** disable the control. A spinner that
   * removes the control loses focus, cannot be cancelled, and turns a switch
   * into a dead pixel for as long as the request takes.
   */
  loading?: boolean;
  size?: SwitchSize;
  /** Supplying either implies `appearance="labeled"`. */
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  autoFocus?: boolean;
  /** antd's alias for `checked`, accepted by `Form.Item`. */
  value?: SwitchValue;

  /* ---- value and absence ---------------------------------------- */

  /**
   * Why the value is `"unknown"`. Structurally the output of
   * `resolveAbsentReason()` in `@oxygenui-design/fhir`.
   */
  absentReason?: AbsentReason;

  /* ---- commit ---------------------------------------------------- */

  /**
   * Return a promise and the component owns the phase machine: pending while
   * in flight, committed on resolve, reverted on reject — with the rollback
   * animated and announced. Reject with a `SwitchBlockedError` for `blocked`.
   */
  onCommit?: (next: boolean, ctx: { from: SwitchValue; reason?: string }) => void | Promise<void>;
  /**
   * The controlled alternative to `onCommit`, for a caller that already owns a
   * state machine — a mutation library, a websocket, an offline queue — and
   * needs this control to render its phases rather than run its own.
   *
   * Supplying it takes the machine out of the loop entirely: nothing here
   * starts a timer, and `requested` decides what is drawn while in flight.
   * Every rendering, announcement and availability rule is unchanged, which is
   * the point — a host should not have to reimplement the revert animation to
   * use its own transport.
   */
  phase?: CommitPhase;
  /** What to render while a controlled `phase` is `pending` or `queued`. */
  requested?: boolean;
  /** Shown and announced on a controlled `reverted`, `blocked` or `stale`. */
  error?: React.ReactNode;
  /** Minimum time in `pending`, so a fast write is perceptible rather than a flash. */
  minPendingMs?: number;
  slowAfter?: number;
  onSlow?: () => void;
  /** A switch that does not take effect until Save must say so. */
  commit?: "instant" | "deferred";

  /* ---- shared-record reality ------------------------------------- */

  /** What the record now holds. Differing from `checked` puts the control in `stale`. */
  serverValue?: SwitchValue;
  onResolveConflict?: (keep: "mine" | "theirs") => void;
  /** `false` queues the commit rather than sending it. */
  online?: boolean;
  provenance?: { by: string; at: string; via?: string };

  /* ---- time-boxing ------------------------------------------------ */

  /** ISO 8601. Renders "in effect until …". The component never writes on expiry. */
  until?: string;
  /** Warn this long before `until`. */
  untilWarnMs?: number;
  onExpire?: (at: string) => void;

  /* ---- availability ----------------------------------------------- */

  readOnly?: boolean;
  lockedReason?: React.ReactNode;

  /* ---- meaning ---------------------------------------------------- */

  tone?: SwitchTone;
  stateLabels?: StateLabelPreset | Partial<StateLabels>;
  /** The word beside the control. */
  showState?: boolean;
  audience?: SwitchAudience;

  /* ---- confirmation ------------------------------------------------ */

  confirm?: "hold" | "dialog" | "attest" | "countersign" | false;
  confirmCopy?: { title?: string; consequence: string; subject?: string };
  /** Hold duration in ms. 0 routes every activation to the dialog instead. */
  holdMs?: number;
  countersign?: CountersignRequirement;
  /** The consequence, rendered before the click rather than after the decision. */
  impact?: React.ReactNode[];

  /* ---- layout and composition -------------------------------------- */

  label?: React.ReactNode;
  description?: React.ReactNode;
  labelPlacement?: "start" | "end";
  appearance?: SwitchAppearance;
  slots?: SwitchSlots;

  /* ---- governance --------------------------------------------------- */

  onAuditEvent?: (event: SwitchAuditEvent) => void;
  /** ISO 8601 from the server. Required alongside `onAuditEvent` and `until`. */
  now?: string;
}

/* ------------------------------------------------------------------ */
/* Switch                                                              */
/* ------------------------------------------------------------------ */

export const Switch = React.forwardRef<HTMLSpanElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked = false,
    value,
    onChange,
    disabled = false,
    loading = false,
    size,
    checkedChildren,
    unCheckedChildren,
    autoFocus,
    absentReason,
    onCommit,
    minPendingMs,
    slowAfter,
    onSlow,
    commit = "instant",
    phase: phaseProp,
    requested: requestedProp,
    error: errorProp,
    serverValue,
    onResolveConflict,
    online = true,
    provenance,
    until,
    untilWarnMs = 0,
    onExpire,
    readOnly = false,
    lockedReason,
    tone = "affirmative",
    stateLabels,
    showState,
    audience = "clinician",
    confirm = false,
    confirmCopy,
    holdMs = 600,
    countersign,
    impact,
    label,
    description,
    labelPlacement = "end",
    appearance,
    slots,
    onAuditEvent,
    now,
    className,
    style,
    id,
    ...rest
  },
  ref,
) {
  const reactId = React.useId();
  const controlId = id ?? `ox-switch-${reactId}`;
  const labelId = `${controlId}-label`;
  const stateId = `${controlId}-state`;
  const noteId = `${controlId}-note`;

  /* ---- resolved configuration --------------------------------- */

  const resolvedAppearance: SwitchAppearance =
    appearance ?? (checkedChildren || unCheckedChildren ? "labeled" : "switch");
  const resolvedSize: SwitchSize = size ?? (audience === "patient" ? "large" : "default");
  const labels = resolveStateLabels(
    stateLabels ?? (audience === "patient" ? "yes-no" : "on-off"),
    absentReason,
  );
  const showStateWord = showState ?? resolvedAppearance !== "chip";

  /* ---- value -------------------------------------------------- */

  const controlled = checked ?? value;
  const [current, setCurrent] = useControllable<SwitchValue>(controlled, defaultChecked);

  /* ---- phase -------------------------------------------------- */

  const machine = useCommitPhase({
    value: current,
    onCommit: onCommit
      ? (next, ctx) => onCommit(next, { from: ctx.from, reason: ctx.reason })
      : undefined,
    serverValue,
    online,
    minPendingMs,
    slowAfter,
    onSlow,
    now,
    onAuditEvent,
  });

  /**
   * A controlled `phase` wins outright.
   *
   * The internal machine still runs — it is what `request` drives, and taking
   * it out would mean two code paths for activation — but nothing it computes
   * reaches the screen. That keeps the controlled and uncontrolled renderings
   * identical by construction rather than by two implementations agreeing.
   *
   * `loading` is antd's prop, and it sits underneath both: it renders as
   * pending and never disables.
   */
  const phaseControlled = phaseProp !== undefined;
  const phase: CommitPhase = phaseControlled
    ? phaseProp
    : loading && machine.phase === "idle"
      ? "pending"
      : machine.phase;

  const shown: SwitchValue = phaseControlled
    ? (phase === "pending" || phase === "queued" || phase === "committed") &&
      requestedProp !== undefined
      ? requestedProp
      : current
    : machine.shown;

  const conflicting = phaseControlled
    ? phase === "stale" && serverValue !== undefined && serverValue !== current
      ? serverValue
      : undefined
    : machine.conflicting;

  const slow = phaseControlled ? false : machine.slow;
  /** The caller's message when controlled, the machine's otherwise. */
  const error: React.ReactNode = phaseControlled ? errorProp : machine.error;

  /* ---- until -------------------------------------------------- */

  /**
   * Lapse is derived from the caller's `now`, not from the wall clock, so the
   * rendered output depends only on props and can be visually regression
   * tested. The timer below exists solely to *notify*; it never decides what
   * is on screen, and it never writes.
   */
  const untilMs = until ? Date.parse(until) : Number.NaN;
  const nowMs = now ? Date.parse(now) : Number.NaN;
  const hasWindow = Number.isFinite(untilMs) && Number.isFinite(nowMs);
  const lapsed = hasWindow && nowMs >= untilMs;
  const warning = hasWindow && !lapsed && untilWarnMs > 0 && untilMs - nowMs <= untilWarnMs;

  const expireCb = React.useRef(onExpire);
  expireCb.current = onExpire;

  React.useEffect(() => {
    if (!hasWindow || lapsed || shown !== true || !until) return;
    const id = setTimeout(() => expireCb.current?.(until), Math.max(0, untilMs - nowMs));
    return () => clearTimeout(id);
  }, [hasWindow, lapsed, nowMs, shown, until, untilMs]);

  /* ---- confirmation ------------------------------------------- */

  const [awaiting, setAwaiting] = React.useState<boolean | undefined>(undefined);
  const [attestation, setAttestation] = React.useState("");
  const [countersignError, setCountersignError] = React.useState<string | undefined>(undefined);
  const hold = useHold(holdMs > 0 ? holdMs : 1);

  const editable = !disabled && !readOnly;

  const send = React.useCallback(
    (next: boolean, reason?: string, event?: React.SyntheticEvent) => {
      setAwaiting(undefined);
      setAttestation("");
      setCountersignError(undefined);
      setCurrent(next);
      // Deferred commits are applied by the form, and a controlled `phase`
      // means the caller's own machine owns the write. Running ours as well
      // would produce a second set of announcements racing the caller's.
      if (commit !== "deferred" && !phaseControlled) machine.request(next, reason);
      if (event) onChange?.(next, event);
    },
    [commit, machine, onChange, phaseControlled, setCurrent],
  );

  const attempt = React.useCallback(
    (next: boolean, event: React.SyntheticEvent, viaHold: boolean) => {
      if (!editable) return;
      // A completed hold IS the confirmation. Anything else opens the dialog.
      if (confirm === false || (confirm === "hold" && viaHold)) {
        send(next, undefined, event);
        return;
      }
      setAwaiting(next);
    },
    [confirm, editable, send],
  );

  const runCountersign = React.useCallback(async () => {
    if (awaiting === undefined) return;
    if (!countersign?.verify) {
      setCountersignError("No countersignature could be collected.");
      return;
    }
    try {
      const signer = await countersign.verify();
      if (signer === countersign.notSameAs) {
        setCountersignError(
          "The second signature must be from a different person. This is an independent check.",
        );
        return;
      }
      send(awaiting, `countersigned by ${signer}`);
    } catch (cause) {
      setCountersignError(
        cause instanceof Error && cause.message
          ? cause.message
          : "The countersignature was not collected.",
      );
    }
  }, [awaiting, countersign, send]);

  /* ---- activation --------------------------------------------- */

  const requestValue = React.useCallback(
    (next: boolean, event: React.SyntheticEvent, viaHold = false) => attempt(next, event, viaHold),
    [attempt],
  );

  const onControlClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (!editable) return;
      // Shift-activation records the negative. It is the only way to reach
      // `false` from `"unknown"` on the pill, and it is mirrored by a
      // keyboard-reachable button rendered below.
      const next = event.shiftKey && isUnknown(shown) ? false : nextValueFor(shown);
      // A pointer hold that completed already committed on pointerup.
      if (confirm === "hold" && holdMs > 0 && hold.holding) return;
      requestValue(next, event);
    },
    [confirm, editable, hold.holding, holdMs, requestValue, shown],
  );

  const onPointerDown = React.useCallback(() => {
    if (!editable || confirm !== "hold" || holdMs <= 0) return;
    hold.start();
  }, [confirm, editable, hold, holdMs]);

  const onPointerEnd = React.useCallback(
    (event: React.PointerEvent) => {
      if (!editable || confirm !== "hold" || holdMs <= 0) return;
      const completed = hold.stop();
      if (completed) requestValue(nextValueFor(shown), event, true);
    },
    [confirm, editable, hold, holdMs, requestValue, shown],
  );

  /* ---- announcement -------------------------------------------- */

  const plainLabel =
    typeof label === "string"
      ? label
      : typeof rest["aria-label"] === "string"
        ? rest["aria-label"]
        : "This setting";
  const announcement = announcementFor(
    phase,
    plainLabel,
    shown,
    wordFor(conflicting ?? current, labels),
    labels,
    typeof error === "string" ? error : undefined,
  );

  /* ---- classes and data attributes ------------------------------ */

  const stateAttr = isUnknown(shown) ? "unknown" : shown ? "on" : "off";
  const vars: SwitchVars = { ...sizeVars(resolvedSize), ...(style as SwitchVars) };
  if (holdMs !== 600) vars["--ox-switch-hold-ms"] = `${holdMs}ms`;
  if (hold.holding) vars["--ox-switch-hold-progress"] = hold.progress;

  const word = wordFor(shown, labels);

  /* ---- describedby ---------------------------------------------- */

  const describedBy =
    [
      description ? `${controlId}-desc` : undefined,
      lockedReason || error || slow ? noteId : undefined,
      showStateWord ? stateId : undefined,
      typeof rest["aria-describedby"] === "string" ? rest["aria-describedby"] : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const ariaLabel = typeof rest["aria-label"] === "string" ? rest["aria-label"] : undefined;

  const controlProps = {
    id: controlId,
    type: "button" as const,
    role: "switch" as const,
    "aria-checked": (isUnknown(shown) ? "mixed" : shown) as boolean | "mixed",
    "aria-labelledby": label ? labelId : undefined,
    // Without this an icon-only switch has no accessible name at all: the root
    // is decorative and drops its aria-label, so the control has to carry it.
    "aria-label": label ? undefined : ariaLabel,
    "aria-describedby": describedBy,
    "aria-busy": phase === "pending",
    "aria-readonly": readOnly || undefined,
    "aria-disabled": disabled || undefined,
    autoFocus,
    onClick: onControlClick,
    onPointerDown,
    onPointerUp: onPointerEnd,
    onPointerLeave: onPointerEnd,
  };

  /* ---- pieces ---------------------------------------------------- */

  const glyph = glyphFor(shown, phase, readOnly);
  const thumb = (
    <span className="ox-switch__thumb">
      {slots?.thumb ? slots.thumb({ value: shown, phase }) : glyph ? <Glyph kind={glyph} /> : null}
    </span>
  );

  const track = (
    <span className="ox-switch__track">
      {resolvedAppearance === "labeled" ? (
        <span className="ox-switch__words">
          {/*
            Both words share one grid cell, so the track is sized by the longer
            of the two and never resizes as it toggles. In a table row, a
            resizing switch makes the whole row jump.
          */}
          <span className="ox-switch__word ox-switch__word--on" aria-hidden="true">
            {checkedChildren ?? labels.on}
          </span>
          <span className="ox-switch__word ox-switch__word--off" aria-hidden="true">
            {unCheckedChildren ?? labels.off}
          </span>
        </span>
      ) : null}
      {thumb}
    </span>
  );

  const holdRing =
    confirm === "hold" && holdMs > 0 && hold.holding ? (
      <svg
        className="ox-switch__ring"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="ox-switch__ring-track" cx="50" cy="50" r="46" pathLength={100} />
        <circle
          className="ox-switch__ring-value"
          cx="50"
          cy="50"
          r="46"
          pathLength={100}
          transform="rotate(-90 50 50)"
        />
      </svg>
    ) : null;

  /* ---- notes ------------------------------------------------------ */

  const notes: React.ReactNode[] = [];

  if (error) {
    notes.push(
      <span key="error" className="ox-switch__note ox-switch__note--error">
        {error}
        {phase === "reverted" || phase === "blocked" ? (
          <>
            {" "}
            <button type="button" className="ox-switch__action" onClick={machine.acknowledge}>
              Dismiss
            </button>
          </>
        ) : null}
      </span>,
    );
  }

  if (phase === "queued") {
    notes.push(
      <span key="queued" className="ox-switch__note ox-switch__note--pending">
        Not sent yet. It will apply when the connection returns.{" "}
        <button type="button" className="ox-switch__action" onClick={machine.cancelQueued}>
          Cancel
        </button>
      </span>,
    );
  }

  if (slow && phase === "pending") {
    notes.push(
      <span key="slow" className="ox-switch__note ox-switch__note--pending">
        Still saving. The change has not been confirmed yet.
      </span>,
    );
  }

  if (commit === "deferred" && current !== defaultChecked) {
    notes.push(
      <span key="deferred" className="ox-switch__note ox-switch__note--pending">
        Not applied yet — this is saved when you submit the form.
      </span>,
    );
  }

  if (readOnly && lockedReason) {
    notes.push(
      <span key="locked" className="ox-switch__note ox-switch__note--locked">
        {lockedReason}
      </span>,
    );
  }

  if (until && shown === true) {
    notes.push(
      <span key="until" className="ox-switch__note">
        <span className={cn("ox-switch__until", lapsed && "ox-switch__until--lapsed")}>
          {lapsed ? "lapsed" : "until"} {formatTime(until)}
        </span>{" "}
        {lapsed
          ? "This has ended. Confirm whether it still applies."
          : warning
            ? "Ends soon. Extend it, or it lapses."
            : "Ends automatically."}
      </span>,
    );
  }

  if (impact?.length) {
    notes.push(
      <span key="impact" className="ox-switch__impact">
        Turning this on will:
        <span style={{ display: "block", marginBlockStart: "0.3rem" }}>
          {impact.map((item, index) => (
            <span key={index} style={{ display: "list-item", marginInlineStart: "1.1rem" }}>
              {item}
            </span>
          ))}
        </span>
      </span>,
    );
  }

  if (provenance) {
    notes.push(
      <span key="prov" className="ox-switch__provenance">
        Last changed {formatTime(provenance.at)} by {provenance.by}
        {provenance.via ? `, ${provenance.via}` : ""}
      </span>,
    );
  }

  if (phase === "stale" && conflicting !== undefined) {
    const theirs = wordFor(conflicting, labels);
    const mine = wordFor(current, labels);
    notes.push(
      <span
        key="stale"
        className="ox-switch__conflict"
        role="group"
        aria-label="Conflicting change"
      >
        <span>
          <strong>Changed by someone else.</strong>
        </span>
        <span>
          You are looking at <strong>{mine.toLowerCase()}</strong>. The record now says{" "}
          <strong>{theirs.toLowerCase()}</strong>.
        </span>
        {/*
          Two buttons and no default. A conflict between two clinicians is not a
          merge problem — each of them had a reason, and picking a winner
          silently discards one of those reasons.
        */}
        <span className="ox-switch__conflict-actions">
          <button
            type="button"
            className="ox-switch__action"
            onClick={() => {
              machine.resolveConflict("theirs");
              if (conflicting !== undefined) setCurrent(conflicting);
              onResolveConflict?.("theirs");
            }}
          >
            Use theirs ({theirs.toLowerCase()})
          </button>
          <button
            type="button"
            className="ox-switch__action"
            onClick={() => {
              machine.resolveConflict("mine");
              onResolveConflict?.("mine");
            }}
          >
            Change it back ({mine.toLowerCase()})
          </button>
        </span>
      </span>,
    );
  }

  /* ---- the confirmation panel ------------------------------------- */

  if (awaiting !== undefined) {
    const target = wordFor(awaiting, labels).toLowerCase();
    const heading =
      confirmCopy?.title ??
      `Set ${plainLabel.toLowerCase()} to ${target}${confirmCopy?.subject ? ` for ${confirmCopy.subject}` : ""}?`;

    notes.push(
      <span
        key="confirm"
        className="ox-switch__dialog"
        role="alertdialog"
        aria-label={heading}
        aria-modal="false"
      >
        {/*
          The consequence, stated. Never "Are you sure?", which asks the reader
          to re-derive the thing they were already unsure about — CONTENT.md §4.
        */}
        <span>
          <strong>{heading}</strong>
        </span>
        {confirmCopy?.consequence ? <span>{confirmCopy.consequence}</span> : null}

        {confirm === "attest" ? (
          <>
            <label htmlFor={`${controlId}-attest`}>Reason (recorded against your login)</label>
            <textarea
              id={`${controlId}-attest`}
              className="ox-switch__attest"
              rows={2}
              value={attestation}
              onChange={(event) => setAttestation(event.target.value)}
            />
          </>
        ) : null}

        {confirm === "countersign" ? (
          <span className="ox-switch__countersign">
            <span>
              <strong>Requires a second qualified signature before this takes effect.</strong>
            </span>
            <span className="ox-switch__countersign-row">
              <span className="ox-switch__countersign-slot ox-switch__countersign-slot--done">
                Requested by {countersign?.requestedBy ?? countersign?.notSameAs}
              </span>
            </span>
            <span className="ox-switch__countersign-row">
              <span className="ox-switch__countersign-slot">
                Awaiting a {countersign?.role.replace(/-/g, " ")} other than the requester
              </span>
            </span>
            {countersignError ? (
              <span className="ox-switch__note ox-switch__note--error">{countersignError}</span>
            ) : null}
          </span>
        ) : null}

        <span className="ox-switch__dialog-actions">
          <button
            type="button"
            className="ox-switch__action"
            disabled={confirm === "attest" && attestation.trim().length === 0}
            onClick={(event) => {
              if (confirm === "countersign") {
                void runCountersign();
                return;
              }
              send(awaiting, confirm === "attest" ? attestation.trim() : undefined, event);
            }}
          >
            {confirm === "countersign" ? "Collect countersignature" : `Set to ${target}`}
          </button>
          <button
            type="button"
            className="ox-switch__action"
            onClick={() => {
              setAwaiting(undefined);
              setAttestation("");
              setCountersignError(undefined);
            }}
          >
            Cancel
          </button>
        </span>
      </span>,
    );
  }

  /* ---- text column -------------------------------------------------- */

  const textColumn =
    label || description || showStateWord || notes.length ? (
      <span className="ox-switch__text">
        {label && resolvedAppearance !== "row" ? (
          <span className="ox-switch__label" id={labelId}>
            {label}
          </span>
        ) : null}
        {description && resolvedAppearance !== "row" ? (
          <span className="ox-switch__desc" id={`${controlId}-desc`}>
            {description}
          </span>
        ) : null}
        {showStateWord ? (
          <span className="ox-switch__state" id={stateId}>
            {slots?.state ? slots.state({ value: shown, word }) : word}
          </span>
        ) : null}
        {notes.length ? (
          <span id={noteId} style={{ display: "contents" }}>
            {notes}
          </span>
        ) : null}
      </span>
    ) : null;

  /* ---- the "record no" path out of unknown --------------------------- */

  const recordNegative =
    isUnknown(shown) && editable ? (
      <button
        type="button"
        className="ox-switch__sr"
        onClick={(event) => requestValue(false, event)}
      >
        Record {labels.off.toLowerCase()} for {plainLabel}
      </button>
    ) : null;

  /* ---- root ---------------------------------------------------------- */

  const rootProps = {
    ref,
    className: cn("ox-switch", className),
    style: vars,
    "data-ox-switch": "",
    "data-ox-state": stateAttr,
    "data-ox-phase": phase,
    "data-ox-tone": tone,
    "data-ox-size": resolvedSize,
    "data-ox-appearance": resolvedAppearance,
    "data-ox-audience": audience,
    "data-ox-readonly": readOnly ? "true" : undefined,
    "data-ox-disabled": disabled ? "true" : undefined,
    ...rest,
    // The root is a decorative wrapper; the accessible name belongs on the
    // control, which reads it from `aria-labelledby` or the passed aria-label.
    "aria-label": undefined,
    "aria-describedby": undefined,
  };

  const liveRegions = (
    <>
      <span className="ox-switch__sr" role="status" aria-live="polite">
        {announcement?.politeness === "polite" ? announcement.text : ""}
      </span>
      <span className="ox-switch__sr" role="alert" aria-live="assertive">
        {announcement?.politeness === "assertive" ? announcement.text : ""}
      </span>
    </>
  );

  /* ---- appearance: segmented ------------------------------------------ */

  if (resolvedAppearance === "segmented") {
    return (
      <span {...rootProps}>
        {labelPlacement === "start" ? textColumn : null}
        <span
          className="ox-switch__segments"
          role="radiogroup"
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : ariaLabel}
          aria-readonly={readOnly || undefined}
        >
          {/*
            Two labelled cells that both look pressable ARE a radio group.
            Calling them a switch would be a lie to a screen reader, so this is
            the one appearance that changes the ARIA role.
          */}
          {([false, true] as const).map((option) => (
            <button
              key={String(option)}
              type="button"
              className="ox-switch__segment"
              role="radio"
              aria-checked={shown === option}
              // `disabled` only when genuinely disabled: a read-only cell stays
              // in the tab order and keeps its name, and `attempt` refuses the
              // change anyway. Removing it from the tab order would hide the
              // control from a screen-reader user entirely.
              disabled={disabled}
              aria-disabled={disabled || undefined}
              aria-readonly={readOnly || undefined}
              onClick={(event) => requestValue(option, event)}
            >
              {shown === option ? <Glyph kind="on" /> : null}
              {option ? labels.on : labels.off}
            </button>
          ))}
          {/*
            The unasked cell is not a button and disappears once answered.
            A user may leave "unknown"; a user may never enter it.
          */}
          {isUnknown(shown) ? (
            <span className="ox-switch__segment ox-switch__segment--unasked">{labels.unknown}</span>
          ) : null}
        </span>
        {labelPlacement === "end" ? textColumn : null}
        {liveRegions}
      </span>
    );
  }

  /* ---- appearance: chip ------------------------------------------------ */

  if (resolvedAppearance === "chip") {
    return (
      <span {...rootProps}>
        <button {...controlProps} className="ox-switch__chip">
          {glyph ? <Glyph kind={glyph} /> : null}
          {label ?? word}
        </button>
        {recordNegative}
        {textColumn}
        {liveRegions}
      </span>
    );
  }

  /* ---- appearance: row -------------------------------------------------- */

  if (resolvedAppearance === "row") {
    return (
      <span {...rootProps}>
        <button {...controlProps} className="ox-switch__control">
          <span className="ox-switch__rowtext">
            {label ? (
              <span className="ox-switch__label" id={labelId}>
                {label}
              </span>
            ) : null}
            {description ? (
              <span className="ox-switch__desc" id={`${controlId}-desc`}>
                {description}
              </span>
            ) : null}
          </span>
          {track}
        </button>
        {recordNegative}
        {textColumn}
        {liveRegions}
      </span>
    );
  }

  /* ---- appearance: switch | labeled -------------------------------------- */

  return (
    <span {...rootProps}>
      {labelPlacement === "start" ? textColumn : null}
      <button {...controlProps} className="ox-switch__control">
        {holdRing}
        {track}
      </button>
      {recordNegative}
      {labelPlacement === "end" ? textColumn : null}
      {liveRegions}
    </span>
  );
});

/**
 * Time, formatted without reading the clock.
 *
 * An ISO string in, a short local time out. If it does not parse, the raw value
 * is shown rather than a placeholder — a timestamp we cannot read is still
 * information, and substituting punctuation for it would be CONTENT.md §1's
 * first failure.
 */
function formatTime(iso: string): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/* SwitchField                                                         */
/* ------------------------------------------------------------------ */

export interface SwitchFieldProps extends SwitchProps {
  /** Rendered under the label, above the state word. */
  description?: React.ReactNode;
}

/**
 * A labelled row — what actually ships. A bare switch is rare in clinical
 * software; a labelled row inside a titled group is the shape almost every
 * real surface uses.
 */
export const SwitchField = React.forwardRef<HTMLDivElement, SwitchFieldProps>(function SwitchField(
  { className, label, description, ...props },
  ref,
) {
  const reactId = React.useId();
  const id = props.id ?? `ox-switch-field-${reactId}`;

  return (
    <div ref={ref} className={cn("ox-switch-field", className)}>
      <div className="ox-switch-field__body">
        <Switch
          {...props}
          id={id}
          label={label}
          description={description}
          labelPlacement="start"
          className="ox-switch-field__control"
        />
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* SwitchList                                                          */
/* ------------------------------------------------------------------ */

export interface SwitchListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  /**
   * Counts for the summary line. `unknown` is reported separately and excluded
   * from both numerator and denominator — a count that silently treats "not
   * asked" as "off" is the whole failure this component exists to prevent,
   * repeated at group scale.
   */
  counts?: { on: number; total: number; unknown?: number };
  /** Who last changed anything in this group. The first question anyone asks. */
  provenance?: { by: string; at: string };
  children?: React.ReactNode;
}

export const SwitchList = React.forwardRef<HTMLDivElement, SwitchListProps>(function SwitchList(
  { title, counts, provenance, children, className, ...rest },
  ref,
) {
  const reactId = React.useId();
  const titleId = `ox-switch-list-${reactId}`;

  const summary = counts
    ? [
        `${counts.on} of ${counts.total} in effect`,
        counts.unknown ? `${counts.unknown} not asked` : undefined,
        provenance ? `last changed ${formatTime(provenance.at)} by ${provenance.by}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <div
      ref={ref}
      className={cn("ox-switch-list", className)}
      role="group"
      aria-labelledby={title ? titleId : undefined}
      {...rest}
    >
      {title || summary ? (
        <div className="ox-switch-list__head">
          {title ? (
            <span className="ox-switch-list__title" id={titleId}>
              {title}
            </span>
          ) : null}
          {summary ? <span className="ox-switch-list__summary">{summary}</span> : null}
        </div>
      ) : null}
      <div className="ox-switch-list__items">{children}</div>
    </div>
  );
});

"use client";

/**
 * ActionGate — two-step confirmation for consequential clinical actions.
 *
 * The copy rule is the whole component: it states what will happen, to whom,
 * and what cannot be undone. "Are you sure?" is not a confirmation — it asks
 * the reader to re-derive the consequence they were already unsure about.
 * `consequence` and `patientName` are required for exactly that reason.
 *
 * Friction is calibrated, not maximised. Too little and wrong-patient actions
 * happen; too much and clinicians route around the system, which is worse
 * because it moves the work somewhere you cannot see it.
 *
 *   confirm  — reversible. One deliberate click.
 *   type     — irreversible. Type the confirmation phrase.
 *   hold     — irreversible and urgent-adjacent. Press and hold, so it cannot
 *              be triggered by a stray double-click on a dense screen.
 *
 * The audit event is emitted, not persisted. Storing it is the application's
 * job and the component says so rather than implying a trail it cannot provide.
 */

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionAuditEvent {
  action: string;
  consequence: string;
  patientName?: string;
  reason?: string;
  reversible: boolean;
  at: Date;
}

export interface ActionGateProps {
  /** Imperative name of the action. The same word appears on the trigger,
   *  in the dialog, and in the result — an action keeps its name throughout. */
  action: string;
  /** What actually happens, in plain language. Never "Are you sure?". */
  consequence: string;
  /** The patient affected. Acting on the wrong chart is the error being prevented. */
  patientName?: string;
  reversible?: boolean;
  /** Escalate friction. Defaults to "confirm" when reversible, "type" when not. */
  mode?: "confirm" | "type" | "hold";
  /** Phrase the user must type in "type" mode. Defaults to the action name. */
  confirmPhrase?: string;
  /** Require a reason before proceeding. Recorded on the audit event. */
  reasons?: string[];
  onConfirm: (event: ActionAuditEvent) => void | Promise<void>;
  /** Rendered as the trigger. Defaults to a button labelled with the action. */
  children?: React.ReactNode;
  destructive?: boolean;
  className?: string;
}

const HOLD_MS = 1200;

export function ActionGate({
  action,
  consequence,
  patientName,
  reversible = true,
  mode,
  confirmPhrase,
  reasons,
  onConfirm,
  children,
  destructive = false,
  className,
}: ActionGateProps) {
  const resolvedMode = mode ?? (reversible ? "confirm" : "type");
  const phrase = confirmPhrase ?? action;

  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [holding, setHolding] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const holdTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setTyped("");
    setReason("");
    setHolding(0);
    // Focus returns to what opened the dialog, not to the document start.
    triggerRef.current?.focus();
  }, []);

  // Focus moves into the dialog on open, and Escape always gets you out.
  React.useEffect(() => {
    if (!open) return;
    const first = dialogRef.current?.querySelector<HTMLElement>(
      "input, select, button, [tabindex]",
    );
    first?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const reasonSatisfied = !reasons?.length || Boolean(reason);
  const typedSatisfied = resolvedMode !== "type" || typed.trim() === phrase;
  const canProceed = reasonSatisfied && typedSatisfied && !busy;

  async function commit() {
    if (!canProceed) return;
    setBusy(true);
    try {
      await onConfirm({
        action,
        consequence,
        patientName,
        reason: reason || undefined,
        reversible,
        at: new Date(),
      });
      close();
    } finally {
      setBusy(false);
    }
  }

  function startHold() {
    if (!reasonSatisfied) return;
    holdTimer.current = setInterval(() => {
      setHolding((value) => {
        const next = value + 100;
        if (next >= HOLD_MS) {
          if (holdTimer.current) clearInterval(holdTimer.current);
          void commit();
          return HOLD_MS;
        }
        return next;
      });
    }, 100);
  }

  function endHold() {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHolding(0);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--ox-radius)] border px-3 py-1.5 text-[length:var(--ox-text-sm)] font-semibold",
          destructive
            ? "border-[var(--ox-status-critical)] text-[var(--ox-status-critical)] hover:bg-[var(--ox-status-critical-bg)]"
            : "border-[var(--ox-border-strong)] text-[var(--ox-text)] hover:bg-[var(--ox-bg-muted)]",
          className,
        )}
      >
        {children ?? action}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ox-gate-title"
            aria-describedby="ox-gate-desc"
            className="w-full max-w-md rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface-overlay)] p-5 shadow-[var(--ox-shadow-lg)]"
          >
            <h2
              id="ox-gate-title"
              className="flex items-center gap-2 text-[length:var(--ox-text-lg)] font-bold"
            >
              {!reversible && (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-4 text-[var(--ox-status-critical)]"
                />
              )}
              {action}
            </h2>

            {/* The consequence is in the accessible description, not only in
                visible text, and the patient is named in it. */}
            <p
              id="ox-gate-desc"
              className="mt-2 text-[length:var(--ox-text-sm)] leading-relaxed text-[var(--ox-text-muted)]"
            >
              {consequence}
              {patientName && (
                <>
                  {" "}
                  This affects <strong className="text-[var(--ox-text)]">{patientName}</strong>.
                </>
              )}{" "}
              {reversible ? "This can be undone." : "This cannot be undone."}
            </p>

            {reasons?.length ? (
              <div className="mt-4 flex flex-col gap-1">
                <label
                  htmlFor="ox-gate-reason"
                  className="text-[length:var(--ox-text-2xs)] font-semibold uppercase tracking-wider text-[var(--ox-text-muted)]"
                >
                  Reason
                </label>
                <select
                  id="ox-gate-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] bg-[var(--ox-surface)] px-2 py-1.5 text-[length:var(--ox-text-sm)]"
                >
                  <option value="">Select a reason…</option>
                  {reasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {resolvedMode === "type" && (
              <div className="mt-4 flex flex-col gap-1">
                <label
                  htmlFor="ox-gate-type"
                  className="text-[length:var(--ox-text-2xs)] font-semibold uppercase tracking-wider text-[var(--ox-text-muted)]"
                >
                  Type <span className="font-[family-name:var(--ox-font-mono)]">{phrase}</span> to
                  confirm
                </label>
                <input
                  id="ox-gate-type"
                  value={typed}
                  autoComplete="off"
                  onChange={(event) => setTyped(event.target.value)}
                  className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] bg-[var(--ox-surface)] px-2 py-1.5 font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-sm)]"
                />
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-[var(--ox-radius)] border border-[var(--ox-border-strong)] px-3 py-2 text-[length:var(--ox-text-sm)] font-semibold hover:bg-[var(--ox-bg-muted)]"
              >
                Cancel
              </button>

              {resolvedMode === "hold" ? (
                <button
                  type="button"
                  disabled={!reasonSatisfied || busy}
                  onPointerDown={startHold}
                  onPointerUp={endHold}
                  onPointerLeave={endHold}
                  // Keyboard equivalent: hold-to-confirm cannot be pointer-only.
                  onKeyDown={(event) => {
                    if (event.key === " " || event.key === "Enter") {
                      event.preventDefault();
                      if (!holdTimer.current) startHold();
                    }
                  }}
                  onKeyUp={endHold}
                  className="relative overflow-hidden rounded-[var(--ox-radius)] bg-[var(--ox-status-critical)] px-3 py-2 text-[length:var(--ox-text-sm)] font-semibold text-white disabled:opacity-50"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-black/25 transition-[width] duration-100"
                    style={{ width: `${(holding / HOLD_MS) * 100}%` }}
                  />
                  <span className="relative">Hold to {action.toLowerCase()}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canProceed}
                  onClick={commit}
                  className={cn(
                    "rounded-[var(--ox-radius)] px-3 py-2 text-[length:var(--ox-text-sm)] font-semibold text-white disabled:opacity-50",
                    destructive || !reversible
                      ? "bg-[var(--ox-status-critical)]"
                      : "bg-[var(--ox-accent)]",
                  )}
                >
                  {busy ? "Working…" : action}
                </button>
              )}
            </div>

            <p className="mt-3 text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
              This action emits an audit event. Persisting it is the application&rsquo;s
              responsibility.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

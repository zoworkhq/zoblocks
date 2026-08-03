"use client";

/**
 * RestrictedShield — wraps content that may be restricted by sensitivity policy.
 *
 * The redacted state is the DEFAULT render, not the fallback. Behavioral
 * health, substance use under 42 CFR Part 2, reproductive care, HIV status,
 * and minor confidentiality can each be restricted independently of the rest
 * of the chart, and every path here fails closed.
 *
 * The subtle requirement is the middle ground: stating that restricted content
 * EXISTS without revealing what it is. A reader who cannot tell the difference
 * between "nothing here" and "something here you cannot see" will misread the
 * chart in one direction or the other. The `concealExistence` variant handles
 * the narrower case where even that acknowledgement is not permitted.
 *
 * Disclosure is deliberate, reasoned, time-boxed, and logged. It is not a
 * session-wide unlock: the shield re-closes on its own, because a disclosure
 * that persists until logout is not really time-boxed.
 *
 * This renders policy outcomes. It does not evaluate policy — the application
 * decides who may see what, and passes the answer in.
 */

import * as React from "react";
import { Eye, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DisclosureEvent {
  reason: string;
  /** Seconds the disclosure was granted for. */
  durationSeconds: number;
  at: Date;
}

export interface RestrictedShieldProps {
  /** Whether the content is restricted at all. Decided by the application. */
  restricted?: boolean;
  /**
   * Whether this viewer may break the glass. False renders the shield with no
   * disclosure path and an explanation, which is different from being able to
   * ask and choosing not to.
   */
  disclosurePermitted?: boolean;
  /**
   * Do not acknowledge that content exists. For the narrow cases where the
   * existence of a record is itself the sensitive fact.
   */
  concealExistence?: boolean;
  /** Category shown to the reader, e.g. "Substance use — 42 CFR Part 2". */
  category?: string;
  /** Reasons a viewer may choose from. Free text alone is not auditable. */
  reasons?: string[];
  /** How long a disclosure lasts before the shield closes again. */
  durationSeconds?: number;
  /**
   * Emitted when content is disclosed. The application persists this — the
   * component does not, and says so rather than implying an audit trail it
   * cannot provide.
   */
  onDisclose?: (event: DisclosureEvent) => void;
  onRedact?: () => void;
  children: React.ReactNode;
  className?: string;
}

const DEFAULT_REASONS = [
  "Emergency treatment",
  "Direct treatment relationship",
  "Patient request",
  "Care coordination",
];

export function RestrictedShield({
  restricted = false,
  disclosurePermitted = true,
  concealExistence = false,
  category = "Restricted record",
  reasons = DEFAULT_REASONS,
  durationSeconds = 300,
  onDisclose,
  onRedact,
  children,
  className,
}: RestrictedShieldProps) {
  const [disclosed, setDisclosed] = React.useState(false);
  const [asking, setAsking] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [remaining, setRemaining] = React.useState(durationSeconds);

  // Auto re-redact. A disclosure that lasts until logout is not time-boxed,
  // and "I forgot it was open" is how sensitive data ends up on a shared screen.
  React.useEffect(() => {
    if (!disclosed) return;
    setRemaining(durationSeconds);
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setDisclosed(false);
          onRedact?.();
          return durationSeconds;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [disclosed, durationSeconds, onRedact]);

  if (!restricted) return <>{children}</>;

  // Existence itself is concealed: render nothing at all, with no gap that
  // would betray that something was removed.
  if (concealExistence && !disclosed) return null;

  if (disclosed) {
    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, "0");
    return (
      <div
        className={cn(
          "rounded-[var(--ox-radius)] border-2 border-[var(--ox-flag-restricted)] p-[var(--ox-density-pad-x)]",
          className,
        )}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-flag-restricted)]">
            <Eye className="size-3.5" />
            Disclosed · {category}
          </span>
          {/* Polite, not assertive: a countdown that interrupts a reader every
              second is worse than the risk it mitigates. */}
          <span
            aria-live="polite"
            className="font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-xs)] tabular-nums text-[var(--ox-text-muted)]"
          >
            Re-hides in {minutes}:{seconds}
          </span>
          <button
            type="button"
            onClick={() => {
              setDisclosed(false);
              onRedact?.();
            }}
            className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold hover:bg-[var(--ox-bg-muted)]"
          >
            Hide now
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[var(--ox-radius)] border border-dashed border-[#ddd6fe] bg-[var(--ox-flag-restricted-bg)] p-[var(--ox-density-pad-x)]",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Lock
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-[var(--ox-flag-restricted)]"
        />
        <div className="min-w-0 flex-1">
          {/* Text, not an icon: the reader must know this is withheld content
              and not an empty section. */}
          <p className="text-[length:var(--ox-text-sm)] font-semibold text-[var(--ox-flag-restricted)]">
            Hidden — {category}
          </p>
          <p className="mt-0.5 text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
            {disclosurePermitted
              ? "Content exists and is withheld. Disclosure is recorded and reviewed."
              : "Content exists and your role cannot disclose it. Ask the privacy office."}
          </p>

          {disclosurePermitted && !asking && (
            <button
              type="button"
              onClick={() => setAsking(true)}
              className="mt-2 rounded-[var(--ox-radius-sm)] border border-[var(--ox-flag-restricted)] px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-flag-restricted)] hover:bg-[var(--ox-surface)]"
            >
              Disclose with a reason
            </button>
          )}

          {disclosurePermitted && asking && (
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!reason) return;
                setDisclosed(true);
                setAsking(false);
                onDisclose?.({ reason, durationSeconds, at: new Date() });
              }}
            >
              <span className="flex flex-col gap-1">
                <label
                  htmlFor="ox-shield-reason"
                  className="text-[length:var(--ox-text-2xs)] font-semibold uppercase tracking-wider text-[var(--ox-text-muted)]"
                >
                  Reason for access
                </label>
                <select
                  id="ox-shield-reason"
                  required
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] bg-[var(--ox-surface)] px-2 py-1 text-[length:var(--ox-text-xs)]"
                >
                  <option value="">Select a reason…</option>
                  {reasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </span>
              <button
                type="submit"
                className="rounded-[var(--ox-radius-sm)] bg-[var(--ox-flag-restricted)] px-2.5 py-1.5 text-[length:var(--ox-text-xs)] font-semibold text-white disabled:opacity-50"
                disabled={!reason}
              >
                Disclose
              </button>
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="px-2 py-1.5 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-text-muted)] hover:text-[var(--ox-text)]"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

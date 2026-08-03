"use client";

/**
 * AlertBanner — the standard surface for a clinical alert that must be seen.
 *
 * Interruption is a scarce resource and every alert spends it. The failure
 * mode of clinical alerting is not missing alerts, it is too many: fire enough
 * of them and clinicians dismiss everything, including the one that mattered.
 *
 * So the severity tiers here are a budget, not a palette:
 *
 *   critical — may take focus, cannot be dismissed without an action recorded
 *   high     — persistent, dismissible, does not steal focus
 *   moderate — inline, quiet
 *   low/info — inline, quiet, no icon weight
 *
 * Two rules that keep the budget honest:
 *
 *   1. The finding is stated, not the category. "Potassium 6.8 — critical
 *      high" earns its interruption. "Abnormal result" does not, and teaches
 *      people to dismiss without reading.
 *   2. Dismissing a critical alert requires a reason and emits it. An alert
 *      everyone silently clears is an alert that should be retired, and you
 *      cannot know that without the reasons.
 */

import * as React from "react";
import { CircleAlert, Info, TriangleAlert, X } from "lucide-react";
import type { AlertSeverity } from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

export interface AlertDismissal {
  reason?: string;
  at: Date;
}

export interface AlertBannerProps {
  severity?: AlertSeverity;
  /** The specific finding. Never a category like "Abnormal result". */
  finding: string;
  detail?: string;
  /** Where it came from, so a clinician can judge it. */
  source?: string;
  /** Inline actions. Responding should not require navigating away. */
  actions?: React.ReactNode;
  /**
   * Reasons offered when dismissing a critical alert. Dismissal without a
   * reason is what makes alert performance unmeasurable.
   */
  dismissReasons?: string[];
  onDismiss?: (dismissal: AlertDismissal) => void;
  className?: string;
}

/** Written out in full — Tailwind cannot see a class built from a variable. */
const SEVERITY_CLASS: Record<AlertSeverity, string> = {
  critical:
    "border-[var(--ox-status-critical)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  high: "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  moderate:
    "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  low: "border-[var(--ox-status-low-border)] bg-[var(--ox-status-low-bg)] text-[var(--ox-status-low)]",
  info: "border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] text-[var(--ox-text-muted)]",
};

const SEVERITY_ICON: Record<AlertSeverity, React.ComponentType<{ className?: string }>> = {
  critical: TriangleAlert,
  high: CircleAlert,
  moderate: CircleAlert,
  low: Info,
  info: Info,
};

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
  info: "Information",
};

export function AlertBanner({
  severity = "info",
  finding,
  detail,
  source,
  actions,
  dismissReasons,
  onDismiss,
  className,
}: AlertBannerProps) {
  const [dismissing, setDismissing] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const Icon = SEVERITY_ICON[severity];
  const isCritical = severity === "critical";
  // Only the top tier gets to interrupt. Everything else waits its turn in the
  // reading order rather than jumping the queue.
  const live = isCritical ? "assertive" : "polite";

  // A critical alert requires a reason if reasons were supplied; a lesser one
  // dismisses on a click, because friction everywhere is friction nowhere.
  const needsReason = isCritical && Boolean(dismissReasons?.length);

  function dismiss() {
    onDismiss?.({ reason: reason || undefined, at: new Date() });
    setDismissing(false);
    setReason("");
  }

  return (
    <div
      role={isCritical ? "alert" : "status"}
      aria-live={live}
      data-severity={severity}
      className={cn(
        "flex flex-col gap-2 rounded-[var(--ox-radius)] border px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        isCritical && "border-2",
        SEVERITY_CLASS[severity],
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

        <div className="min-w-0 flex-1">
          {/* Severity as a word, so it survives greyscale, forced-colors, and
              being read aloud. */}
          <p className="text-[length:var(--ox-text-sm)] font-semibold leading-snug">
            <span className="sr-only">{SEVERITY_LABEL[severity]}: </span>
            {finding}
          </p>
          {detail && (
            <p className="mt-0.5 text-[length:var(--ox-text-xs)] leading-relaxed text-[var(--ox-text-muted)]">
              {detail}
            </p>
          )}
          {source && (
            <p className="mt-0.5 text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
              {source}
            </p>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={() => (needsReason ? setDismissing(true) : dismiss())}
            aria-label={`Dismiss alert: ${finding}`}
            className="shrink-0 rounded-[var(--ox-radius-sm)] p-1 hover:bg-[var(--ox-surface)]"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>

      {actions && <div className="flex flex-wrap gap-2 pl-6">{actions}</div>}

      {/* The reason is the measurement. Without it there is no way to tell a
          rule that is working from one that is being clicked through. */}
      {dismissing && (
        <form
          className="flex flex-wrap items-end gap-2 border-t border-current/20 pt-2 pl-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!reason) return;
            dismiss();
          }}
        >
          <span className="flex flex-col gap-1">
            <label
              htmlFor="ox-alert-reason"
              className="text-[length:var(--ox-text-2xs)] font-semibold uppercase tracking-wider"
            >
              Reason for dismissing
            </label>
            <select
              id="ox-alert-reason"
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="rounded-[var(--ox-radius-sm)] border border-current bg-[var(--ox-surface)] px-2 py-1 text-[length:var(--ox-text-xs)] text-[var(--ox-text)]"
            >
              <option value="">Select a reason…</option>
              {dismissReasons?.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </span>
          <button
            type="submit"
            disabled={!reason}
            className="rounded-[var(--ox-radius-sm)] bg-[var(--ox-status-critical)] px-2.5 py-1.5 text-[length:var(--ox-text-xs)] font-semibold text-white disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => setDismissing(false)}
            className="px-2 py-1.5 text-[length:var(--ox-text-xs)] font-semibold"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

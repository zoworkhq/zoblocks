"use client";

/**
 * EmptyState — distinguishes the five reasons a clinical section shows nothing.
 *
 * Most products render one empty state. These five mean entirely different
 * things, and conflating them has caused documented harm:
 *
 *   never      — no data has ever been recorded here
 *   filtered   — data exists; the current filters exclude all of it
 *   unavailable— the source system did not answer. This is NOT empty.
 *   restricted — data exists and this viewer may not see it
 *   pending    — ordered or expected, not yet resulted
 *
 * `unavailable` is the dangerous one. A section that failed to load and renders
 * as "no results" tells a clinician the patient has no allergies when the
 * allergy service was simply down.
 *
 * The copy rule that follows from this: never assert a clinical negative the
 * data does not support. "No allergies recorded" is safe. "No allergies" is a
 * claim, and this component will not make it for you — which is why `title` is
 * a required prop rather than a helpful default.
 */

import * as React from "react";
import { CircleSlash, Clock, Filter, Lock, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyReason = "never" | "filtered" | "unavailable" | "restricted" | "pending";

const REASON_ICON: Record<EmptyReason, React.ComponentType<{ className?: string }>> = {
  never: CircleSlash,
  filtered: Filter,
  unavailable: TriangleAlert,
  restricted: Lock,
  pending: Clock,
};

/**
 * Class names written out in full. Tailwind resolves classes by scanning
 * source text, so a class assembled from `reason` produces no CSS and an
 * unavailable section renders as an ordinary empty one.
 */
const REASON_CLASS: Record<EmptyReason, string> = {
  never: "border-[var(--ox-border)] text-[var(--ox-text-subtle)]",
  filtered: "border-[var(--ox-border)] text-[var(--ox-text-subtle)]",
  unavailable:
    "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  restricted: "border-[#ddd6fe] bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)]",
  pending: "border-[var(--ox-border)] text-[var(--ox-text-muted)]",
};

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  reason?: EmptyReason;
  /**
   * Required. There is no safe default: the correct sentence for an empty
   * allergy list is not the correct sentence for an empty problem list, and
   * getting it wrong asserts a clinical negative.
   */
  title: string;
  description?: string;
  /**
   * When the source was last successfully read. An empty list without this is
   * indistinguishable from a current one, and staleness is clinical.
   */
  lastCheckedLabel?: string;
  action?: React.ReactNode;
  /** Single-line rendering for table cells and clinical density. */
  compact?: boolean;
}

export function EmptyState({
  reason = "never",
  title,
  description,
  lastCheckedLabel,
  action,
  compact = false,
  className,
  ...props
}: EmptyStateProps) {
  const Icon = REASON_ICON[reason];

  // Emptiness that follows a user action (filtering) is announced; emptiness
  // that was always there is not, because it is not news.
  const live = reason === "filtered" ? "polite" : undefined;

  if (compact) {
    return (
      <div
        role="status"
        aria-live={live}
        data-empty-reason={reason}
        className={cn(
          "inline-flex items-center gap-1.5 text-[length:var(--ox-text-sm)]",
          REASON_CLASS[reason].replace(/border-\S+/g, "").trim(),
          className,
        )}
        {...props}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live={live}
      data-empty-reason={reason}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--ox-radius)] border border-dashed px-[var(--ox-density-pad-x)] py-8 text-center",
        REASON_CLASS[reason],
        className,
      )}
      {...props}
    >
      {/* Decorative: the message carries the meaning, not the glyph. */}
      <Icon aria-hidden="true" className="size-5" />
      <p className="text-[length:var(--ox-text-sm)] font-semibold">{title}</p>
      {description && (
        <p className="max-w-[46ch] text-[length:var(--ox-text-xs)] leading-relaxed text-[var(--ox-text-muted)]">
          {description}
        </p>
      )}
      {lastCheckedLabel && (
        <p className="font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
          {lastCheckedLabel}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

"use client";

/**
 * ClinicalSkeleton — loading placeholders that never imply a value exists.
 *
 * A skeleton shaped like a lab result invites the reader to fill in the blank.
 * These are shaped like LAYOUT — bars of neutral width — never like a specific
 * value, and never like a number.
 *
 * The more important export here is `ProgressiveSection`. Six source systems
 * behind one screen is normal in healthcare, and partial failure is the normal
 * case rather than the exception. The dangerous outcome is a screen that
 * renders five sections and silently omits the sixth: five of eight medications
 * displayed as though they were all of them.
 *
 * So a section is always in exactly one of four honest states — loading,
 * loaded, failed, or stale — and "failed" and "stale" are visible facts rather
 * than the absence of a fact.
 */

import * as React from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of placeholder rows. */
  rows?: number;
  /** Match the shape of the content being replaced, to avoid layout shift. */
  variant?: "text" | "row" | "card";
}

export function ClinicalSkeleton({
  rows = 3,
  variant = "text",
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      // Announced once as busy, not on every frame. A shimmer that re-announces
      // is a screen reader talking over itself.
      role="status"
      aria-busy="true"
      aria-live="off"
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            "rounded-[var(--ox-radius-sm)] bg-[var(--ox-bg-muted)]",
            // motion-safe only: reduced-motion users get a static placeholder,
            // not a pulsing one.
            "motion-safe:animate-pulse",
            variant === "text" && "h-3",
            variant === "row" && "h-[var(--ox-density-row-height)]",
            variant === "card" && "h-20",
          )}
          // Varied widths so it reads as layout, never as a column of numbers.
          style={variant === "text" ? { width: `${[92, 74, 84, 62, 78][index % 5]}%` } : undefined}
        />
      ))}
    </div>
  );
}

export type SectionState = "loading" | "loaded" | "failed" | "stale";

export interface ProgressiveSectionProps {
  state: SectionState;
  /** Section name, used in the failure message. */
  label: string;
  /** When cached content is shown while revalidating. */
  cachedAtLabel?: string;
  /** Why the source failed, in terms a clinician can act on. */
  failureDetail?: string;
  onRetry?: () => void;
  skeletonRows?: number;
  skeletonVariant?: SkeletonProps["variant"];
  /**
   * Optional: a section that is loading or has failed has nothing to render,
   * and requiring a child there would force callers to pass a placeholder —
   * which is the empty-looking failure this component exists to prevent.
   */
  children?: React.ReactNode;
  className?: string;
}

export function ProgressiveSection({
  state,
  label,
  cachedAtLabel,
  failureDetail,
  onRetry,
  skeletonRows = 3,
  skeletonVariant = "text",
  children,
  className,
}: ProgressiveSectionProps) {
  if (state === "loading") {
    return (
      <div className={className}>
        <ClinicalSkeleton rows={skeletonRows} variant={skeletonVariant} />
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div
        // Assertive: a section that failed to load changes what the reader can
        // conclude from the screen, so it interrupts rather than waits.
        role="alert"
        className={cn(
          "flex flex-col items-start gap-2 rounded-[var(--ox-radius)] border border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
          className,
        )}
      >
        <p className="flex items-center gap-1.5 text-[length:var(--ox-text-sm)] font-semibold text-[var(--ox-status-high)]">
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {label} could not be loaded
        </p>
        <p className="text-[length:var(--ox-text-xs)] leading-relaxed text-[var(--ox-text-muted)]">
          {failureDetail ?? "The source system did not respond."} This section is incomplete — do
          not read it as a complete record.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-[var(--ox-radius-sm)] border border-[var(--ox-status-high)] px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-status-high)] hover:bg-[var(--ox-surface)]"
          >
            <RotateCw aria-hidden="true" className="size-3" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (state === "stale") {
    return (
      <div className={className}>
        <p className="mb-1.5 flex items-center gap-1.5 font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
          <RotateCw aria-hidden="true" className="size-3 motion-safe:animate-spin" />
          {cachedAtLabel ? `Showing data from ${cachedAtLabel}` : "Showing cached data"} ·
          refreshing
        </p>
        {children}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

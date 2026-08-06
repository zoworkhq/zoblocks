"use client";

/**
 * PatientSnapshot — what a clinician needs before walking into the room.
 *
 * The single most requested and most misdesigned surface in clinical software.
 * The design problem is not what to show; it is what to LEAVE OUT, and the
 * answer differs by specialty, setting, and patient.
 *
 * Three decisions that follow from that:
 *
 *   1. Each section states its own recency and its own failure. Six source
 *      systems back this screen and partial failure is the normal case, so a
 *      section that did not load says so rather than rendering empty. Nothing
 *      here may look fresher or more complete than it is.
 *   2. Truncation is counted, never silent. "3 of 11 problems" is honest;
 *      showing three and stopping is a summary that reads as a complete list.
 *   3. Changes since the reader last looked are surfaced. Covering clinicians
 *      do not need the chart, they need the delta — and that is the difference
 *      between a summary that saves time and one that is skipped.
 *
 * Composition, not reimplementation: every section renders through the
 * primitives, so "critical" here is the same critical as everywhere else.
 */

import * as React from "react";
import { Clock } from "lucide-react";
import { formatClinicalDate } from "@oxygenui-design/fhir";
import { EmptyState } from "@/components/oxygen/empty-state";
import { ProgressiveSection, type SectionState } from "@/components/oxygen/clinical-skeleton";
import { cn } from "@/lib/utils";

export interface SnapshotSection {
  id: string;
  title: string;
  state: SectionState;
  /** Total available, when more exists than is shown. */
  totalCount?: number;
  shownCount?: number;
  /** When this source was last read successfully. */
  lastReadAt?: string;
  /** Items added or changed since the reader's last review. */
  changedCount?: number;
  failureDetail?: string;
  onRetry?: () => void;
  onExpand?: () => void;
  /** Copy for the genuinely-empty case. Required — see EmptyState. */
  emptyTitle: string;
  emptyDescription?: string;
  content: React.ReactNode;
  /** Rendered empty when true, regardless of content. */
  isEmpty?: boolean;
}

export interface PatientSnapshotProps {
  sections: SnapshotSection[];
  timeZone: string;
  locale?: string;
  /** When this reader last reviewed the chart, for the change summary. */
  lastReviewedAt?: string;
  /** Two columns on desktop, or a single prioritised stack. */
  columns?: 1 | 2;
  label?: string;
  className?: string;
}

export function PatientSnapshot({
  sections,
  timeZone,
  locale,
  lastReviewedAt,
  columns = 2,
  label = "Patient summary",
  className,
}: PatientSnapshotProps) {
  const lastReviewed = formatClinicalDate(lastReviewedAt, timeZone, locale);
  const totalChanged = sections.reduce((sum, s) => sum + (s.changedCount ?? 0), 0);
  const failed = sections.filter((s) => s.state === "failed");

  return (
    <section aria-label={label} className={cn("flex flex-col gap-3", className)}>
      {/*
        The delta, first. A covering clinician needs what moved since last
        time far more than they need the whole chart again.
      */}
      {lastReviewed && (
        <p
          role="status"
          className="flex flex-wrap items-center gap-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]"
        >
          <Clock aria-hidden="true" className="size-3.5 shrink-0" />
          You last reviewed this chart {lastReviewed}.
          {totalChanged > 0 ? (
            <strong className="font-semibold text-[var(--ox-text)]">
              {totalChanged} {totalChanged === 1 ? "change" : "changes"} since.
            </strong>
          ) : (
            <span>No changes since.</span>
          )}
        </p>
      )}

      {/*
        Stated once, at the top. A reader who scrolls past a failed section
        halfway down has already formed a picture from the sections above it.
      */}
      {failed.length > 0 && (
        <p
          role="alert"
          className="rounded-[var(--ox-radius)] border border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-[length:var(--ox-text-sm)] font-semibold text-[var(--ox-status-high)]"
        >
          {failed.length} of {sections.length} sections could not be loaded (
          {failed.map((s) => s.title).join(", ")}). This summary is incomplete.
        </p>
      )}

      <div className={cn("grid gap-3", columns === 2 ? "md:grid-cols-2" : "grid-cols-1")}>
        {sections.map((section) => {
          const truncated =
            section.totalCount !== undefined &&
            section.shownCount !== undefined &&
            section.totalCount > section.shownCount;
          const lastRead = formatClinicalDate(section.lastReadAt, timeZone, locale);

          return (
            <article
              key={section.id}
              aria-label={section.title}
              // min-w-0 so a wide child cannot force the grid column open and
              // push its neighbour off screen.
              className="flex min-w-0 flex-col rounded-[var(--ox-radius)] border border-[var(--ox-border)] bg-[var(--ox-surface)]"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--ox-border)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]">
                <h3 className="text-[length:var(--ox-text-sm)] font-semibold">
                  {section.title}
                  {section.changedCount ? (
                    <span className="ml-1.5 rounded-[var(--ox-radius-full)] bg-[var(--ox-accent-subtle)] px-1.5 py-0.5 text-[length:var(--ox-text-2xs)] font-bold text-[var(--ox-accent)]">
                      {section.changedCount} new
                      <span className="sr-only"> since your last review</span>
                    </span>
                  ) : null}
                </h3>

                {/* Recency travels with the section, not the screen. One stale
                    source among five fresh ones is invisible otherwise. */}
                {lastRead && section.state !== "failed" && (
                  <span className="font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-2xs)] tabular-nums text-[var(--ox-text-subtle)]">
                    Read {lastRead}
                  </span>
                )}
              </header>

              {/*
                A safety net for caller-supplied content that does not manage
                its own overflow. Oxygen's own dense components (ObservationPanel
                and the like) already provide a focusable horizontal scroller,
                so this is a no-op for them — but `sections` takes arbitrary
                nodes, and a summary column is narrow enough that anything
                unprepared for it would clip.
              */}
              <div className="min-w-0 flex-1 overflow-x-auto p-[var(--ox-density-pad-x)]">
                <ProgressiveSection
                  state={section.state}
                  label={section.title}
                  failureDetail={section.failureDetail}
                  onRetry={section.onRetry}
                  skeletonRows={3}
                >
                  {section.isEmpty ? (
                    <EmptyState
                      reason="never"
                      title={section.emptyTitle}
                      description={section.emptyDescription}
                      lastCheckedLabel={lastRead ? `Last read ${lastRead}` : undefined}
                    />
                  ) : (
                    section.content
                  )}
                </ProgressiveSection>
              </div>

              {/* Counted truncation. Showing three of eleven and stopping is a
                  summary that reads as a complete list. */}
              {truncated && section.state === "loaded" && !section.isEmpty && (
                <footer className="border-t border-[var(--ox-border)] px-[var(--ox-density-pad-x)] py-1.5">
                  <button
                    type="button"
                    onClick={section.onExpand}
                    className="text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-accent)] underline underline-offset-2"
                  >
                    Showing {section.shownCount} of {section.totalCount} — see all{" "}
                    {section.title.toLowerCase()}
                  </button>
                </footer>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

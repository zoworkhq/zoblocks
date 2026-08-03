"use client";

/**
 * ConditionList — the problem list, from FHIR Condition resources.
 *
 * A problem list is not a log. Its value comes from the reader being able to
 * tell, at a glance, which problems are current — so resolved and inactive
 * entries are visually separated rather than merely sorted below, and the
 * distinction between "provisional" and "confirmed" is never dropped.
 *
 * Onset is rendered as recorded. FHIR permits `onsetString` ("in childhood")
 * alongside `onsetDateTime`, and coercing a vague onset into a false precise
 * date is a common and quietly damaging bug.
 */

import * as React from "react";
import { Activity, CircleDot, CircleHelp } from "lucide-react";
import {
  clinicalStatusCode,
  codeableText,
  verificationStatusCode,
  type Condition,
} from "@oxygenui/fhir";
import { StatusBadge, type StatusTone } from "@/components/oxygen/status-badge";
import { cn } from "@/lib/utils";

function severityTone(condition: Condition): StatusTone {
  const severity = codeableText(condition.severity)?.toLowerCase();
  if (severity?.includes("severe")) return "critical";
  if (severity?.includes("moderate")) return "high";
  if (severity?.includes("mild")) return "normal";
  return "unknown";
}

function isActive(condition: Condition): boolean {
  const status = clinicalStatusCode(condition);
  return status === "active" || status === "recurrence" || status === "relapse";
}

/** Onset exactly as recorded — never coerced into a precision it doesn't have. */
function formatOnset(condition: Condition): string | undefined {
  if (condition.onsetDateTime) return condition.onsetDateTime.slice(0, 10);
  if (condition.onsetString) return condition.onsetString;
  return undefined;
}

export interface ConditionListProps extends React.HTMLAttributes<HTMLDivElement> {
  conditions: Condition[] | undefined;
  /** Render resolved and inactive problems in a separate, collapsed group. */
  separateInactive?: boolean;
  loading?: boolean;
  label?: string;
  emptyMessage?: string;
}

export function ConditionList({
  conditions,
  separateInactive = true,
  loading = false,
  label = "Problem list",
  emptyMessage = "No problems recorded.",
  className,
  ...props
}: ConditionListProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading problem list"
        className={cn(
          "space-y-2 rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)] p-[var(--ox-density-pad-x)]",
          className,
        )}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        ))}
        <span className="sr-only">Loading problem list</span>
      </div>
    );
  }

  if (!conditions?.length) {
    return (
      <div
        className={cn(
          "rounded-[var(--ox-radius-lg)] border border-dashed border-[var(--ox-border-strong)] bg-[var(--ox-bg-subtle)] px-6 py-10 text-center",
          className,
        )}
        {...props}
      >
        <p className="text-[length:var(--ox-text-base)] text-[var(--ox-text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  const active = separateInactive ? conditions.filter(isActive) : conditions;
  const inactive = separateInactive ? conditions.filter((c) => !isActive(c)) : [];

  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        className,
      )}
      {...props}
    >
      <div className="divide-y divide-[var(--ox-border)]">
        {active.map((condition, index) => (
          <ConditionRow key={condition.id ?? index} condition={condition} />
        ))}
      </div>

      {inactive.length > 0 && (
        <details className="border-t border-[var(--ox-border)] bg-[var(--ox-bg-subtle)]">
          <summary className="cursor-pointer px-[var(--ox-density-pad-x)] py-2 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ox-focus-ring)]">
            {inactive.length} resolved or inactive{" "}
            {inactive.length === 1 ? "problem" : "problems"}
          </summary>
          <div className="divide-y divide-[var(--ox-border)] border-t border-[var(--ox-border)]">
            {inactive.map((condition, index) => (
              <ConditionRow key={condition.id ?? index} condition={condition} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ConditionRow({ condition }: { condition: Condition }) {
  const name = codeableText(condition.code);
  const severity = codeableText(condition.severity);
  const tone = severityTone(condition);
  const clinical = clinicalStatusCode(condition);
  const verification = verificationStatusCode(condition);
  const onset = formatOnset(condition);
  const active = isActive(condition);
  const provisional = verification === "provisional" || verification === "differential";

  return (
    <div
      data-clinical-status={clinical ?? "unknown"}
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {active ? (
            <CircleDot aria-hidden="true" className="size-3.5 shrink-0 text-[var(--ox-accent)]" />
          ) : (
            <Activity aria-hidden="true" className="size-3.5 shrink-0 text-[var(--ox-text-subtle)]" />
          )}
          <span
            className={cn(
              "font-medium text-[var(--ox-text)]",
              !active && "text-[var(--ox-text-muted)]",
            )}
          >
            {name ?? (
              <span className="font-normal italic text-[var(--ox-text-muted)]">
                Problem not recorded
              </span>
            )}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5.5 text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]">
          {onset ? (
            <span>
              Onset{" "}
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">{onset}</span>
            </span>
          ) : (
            <span className="italic">Onset not recorded</span>
          )}
          {condition.abatementDateTime && (
            <span>
              Resolved{" "}
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                {condition.abatementDateTime.slice(0, 10)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        {/* A provisional diagnosis carried forward as settled fact is one of
            the most consequential UI errors in a chart. */}
        {provisional && (
          <StatusBadge tone="unknown" icon={CircleHelp}>
            {verification === "differential" ? "Differential" : "Provisional"}
          </StatusBadge>
        )}
        {severity && <StatusBadge tone={tone}>{severity}</StatusBadge>}
        {!active && (
          <StatusBadge tone="neutral">
            {clinical === "resolved" ? "Resolved" : clinical === "remission" ? "Remission" : "Inactive"}
          </StatusBadge>
        )}
      </div>
    </div>
  );
}

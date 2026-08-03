"use client";

/**
 * CoverageCard — insurance coverage from a FHIR Coverage resource.
 *
 * `status: "active"` is not sufficient to say a coverage is usable. A record
 * can carry an active status while its period has already ended, and acting on
 * lapsed coverage produces a denied claim and a surprise bill for the patient.
 * The effective state is therefore derived from status AND period together.
 *
 * Member identifiers are maskable for the same reason they are on the patient
 * banner: these screens are read at shared desks and over shoulders.
 */

import * as React from "react";
import { CalendarClock, CircleCheck, CircleSlash, ShieldX } from "lucide-react";
import {
  codeableText,
  coverageClass,
  coverageState,
  maskIdentifier,
  type Coverage,
  type CoverageState,
} from "@oxygenui/fhir";
import { StatusBadge, type StatusTone } from "@/components/oxygen/status-badge";
import { cn } from "@/lib/utils";

const STATE_PRESENTATION: Record<
  CoverageState,
  { label: string; tone: StatusTone; icon: React.ComponentType<{ className?: string }> }
> = {
  active: { label: "Active", tone: "normal", icon: CircleCheck },
  "not-yet-effective": { label: "Not yet effective", tone: "high", icon: CalendarClock },
  lapsed: { label: "Lapsed", tone: "critical", icon: ShieldX },
  cancelled: { label: "Cancelled", tone: "neutral", icon: CircleSlash },
  unknown: { label: "Status unknown", tone: "unknown", icon: CircleSlash },
};

export interface CoverageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  coverage: Coverage | undefined;
  /** Date used to evaluate the coverage period. Pass a fixed date for deterministic tests. */
  asOf?: Date;
  /** Mask all but the last four characters of member and group identifiers. */
  maskIdentifiers?: boolean;
  loading?: boolean;
}

export function CoverageCard({
  coverage,
  asOf = new Date(),
  maskIdentifiers: shouldMask = false,
  loading = false,
  className,
  ...props
}: CoverageCardProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading coverage"
        className={cn(
          "rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
          className,
        )}
        {...props}
      >
        <div className="h-4 w-36 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <div className="mt-3 h-3.5 w-48 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <span className="sr-only">Loading coverage</span>
      </div>
    );
  }

  const state = coverageState(coverage, asOf);
  const presentation = STATE_PRESENTATION[state];
  const payer = coverage?.payor?.[0]?.display;
  const plan = coverageClass(coverage, "plan") ?? codeableText(coverage?.type);
  const group = coverageClass(coverage, "group");
  const memberId = shouldMask ? maskIdentifier(coverage?.subscriberId) : coverage?.subscriberId;
  const relationship = codeableText(coverage?.relationship);
  const { start, end } = coverage?.period ?? {};

  return (
    <div
      data-state={state}
      className={cn(
        "rounded-[var(--ox-radius-lg)] border bg-[var(--ox-surface)]",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)]",
        state === "lapsed"
          ? "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)]"
          : "border-[var(--ox-border)]",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-[var(--ox-text)]">
            {payer ?? (
              <span className="font-normal italic text-[var(--ox-text-muted)]">
                Payer not recorded
              </span>
            )}
          </h3>
          {plan && (
            <p className="mt-0.5 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">{plan}</p>
          )}
        </div>

        <StatusBadge tone={presentation.tone} icon={presentation.icon} className="shrink-0">
          {presentation.label}
        </StatusBadge>
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-[var(--ox-border)] pt-3 text-[length:var(--ox-text-xs)] sm:grid-cols-2">
        <Field label="Member ID">
          {memberId ? (
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
              {memberId}
              {shouldMask && coverage?.subscriberId && (
                <span className="sr-only">
                  {" "}
                  (masked, ending {coverage.subscriberId.slice(-4)})
                </span>
              )}
            </span>
          ) : (
            <NotRecorded />
          )}
        </Field>

        <Field label="Group">
          {group ? (
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">{group}</span>
          ) : (
            <NotRecorded />
          )}
        </Field>

        <Field label="Relationship">
          {relationship ? <span className="capitalize">{relationship}</span> : <NotRecorded />}
        </Field>

        <Field label="Effective">
          {start || end ? (
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
              {start?.slice(0, 10) ?? "—"}
              {" → "}
              {end?.slice(0, 10) ?? "open"}
            </span>
          ) : (
            <NotRecorded />
          )}
        </Field>
      </dl>

      {state === "lapsed" && end && (
        <p className="mt-3 rounded-[var(--ox-radius)] border border-[var(--ox-status-critical-border)] bg-[var(--ox-surface)] px-3 py-2 text-[length:var(--ox-text-sm)] text-[var(--ox-status-critical)]">
          Coverage ended {end.slice(0, 10)}. Verify eligibility before billing.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 font-medium uppercase tracking-wide text-[var(--ox-text-subtle)]">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-[var(--ox-text)]">{children}</dd>
    </div>
  );
}

function NotRecorded() {
  return <span className="italic text-[var(--ox-text-subtle)]">Not recorded</span>;
}

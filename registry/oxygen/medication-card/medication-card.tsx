"use client";

/**
 * MedicationCard — a single medication order from a FHIR MedicationRequest.
 *
 * The design problem here is status. Most implementations collapse on-hold,
 * stopped, completed, and expired into one greyed-out treatment, which loses
 * the difference between a drug a clinician deliberately paused and one that
 * simply ran out of refills. Those lead to opposite next actions, so each gets
 * its own label and tone.
 *
 * "Expired" is derived, not stored: FHIR has no expired status, so a request
 * that is still `active` past its dispense validity period is surfaced as
 * expired rather than presented as current.
 */

import * as React from "react";
import { CircleAlert, CirclePause, CircleStop, Clock, Pill } from "lucide-react";
import {
  codeableText,
  formatDosage,
  isMedicationExpired,
  medicationName,
  type MedicationRequest,
} from "@oxygenui-design/fhir";
import { StatusBadge, type StatusTone } from "@/components/oxygen/status-badge";
import { cn } from "@/lib/utils";

type DisplayStatus =
  | "active"
  | "on-hold"
  | "stopped"
  | "cancelled"
  | "completed"
  | "expired"
  | "draft"
  | "error"
  | "unknown";

const STATUS_PRESENTATION: Record<
  DisplayStatus,
  {
    label: string;
    tone: StatusTone;
    icon?: React.ComponentType<{ className?: string }>;
    dimmed: boolean;
  }
> = {
  active: { label: "Active", tone: "normal", dimmed: false },
  "on-hold": { label: "On hold", tone: "high", icon: CirclePause, dimmed: false },
  stopped: { label: "Stopped", tone: "critical", icon: CircleStop, dimmed: true },
  cancelled: { label: "Cancelled", tone: "neutral", icon: CircleStop, dimmed: true },
  completed: { label: "Completed", tone: "neutral", dimmed: true },
  expired: { label: "Expired", tone: "high", icon: Clock, dimmed: true },
  draft: { label: "Draft", tone: "neutral", dimmed: false },
  error: { label: "Entered in error", tone: "critical", icon: CircleAlert, dimmed: true },
  unknown: { label: "Status unknown", tone: "unknown", dimmed: false },
};

function resolveStatus(request: MedicationRequest | undefined, asOf: Date): DisplayStatus {
  const status = request?.status;
  if (status === "entered-in-error") return "error";
  if (status === "on-hold") return "on-hold";
  if (status === "stopped") return "stopped";
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "draft") return "draft";
  if (status === "active") {
    return isMedicationExpired(request, asOf) ? "expired" : "active";
  }
  return "unknown";
}

export interface MedicationCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** FHIR R4 MedicationRequest. */
  request: MedicationRequest | undefined;
  /** Date used to evaluate expiry. Pass a fixed date to keep tests deterministic. */
  asOf?: Date;
  /** Show the prescriber and authored date. */
  showProvenance?: boolean;
  loading?: boolean;
  onSelect?: (request: MedicationRequest) => void;
}

export function MedicationCard({
  request,
  asOf = new Date(),
  showProvenance = true,
  loading = false,
  onSelect,
  className,
  ...props
}: MedicationCardProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading medication"
        className={cn(
          "rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)]",
          "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
          className,
        )}
        {...props}
      >
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <div className="mt-2 h-3.5 w-56 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <span className="sr-only">Loading medication</span>
      </div>
    );
  }

  const status = resolveStatus(request, asOf);
  const presentation = STATUS_PRESENTATION[status];
  const name = medicationName(request);
  const dosage = formatDosage(request?.dosageInstruction?.[0]);
  const reason = codeableText(request?.reasonCode?.[0]);
  const statusReason = codeableText(request?.statusReason);
  const refills = request?.dispenseRequest?.numberOfRepeatsAllowed;
  const interactive = Boolean(onSelect);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect && request ? () => onSelect(request) : undefined}
      onKeyDown={
        onSelect && request
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(request);
              }
            }
          : undefined
      }
      data-status={status}
      className={cn(
        "rounded-[var(--ox-radius-lg)] border bg-[var(--ox-surface)]",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)]",
        status === "stopped" || status === "error"
          ? "border-[var(--ox-status-critical-border)]"
          : "border-[var(--ox-border)]",
        interactive &&
          "cursor-pointer transition-colors hover:bg-[var(--ox-bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Pill
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-4 shrink-0",
              presentation.dimmed ? "text-[var(--ox-text-subtle)]" : "text-[var(--ox-accent)]",
            )}
          />
          <div className="min-w-0">
            <h3
              className={cn(
                "truncate font-semibold text-[var(--ox-text)]",
                // Never strike through a discontinued drug: struck text is
                // widely unreadable at small sizes and is not exposed as
                // meaning by screen readers. The badge carries the state.
                presentation.dimmed && "text-[var(--ox-text-muted)]",
              )}
            >
              {name ?? (
                <span className="font-normal italic text-[var(--ox-text-muted)]">
                  Medication not recorded
                </span>
              )}
            </h3>

            {dosage ? (
              <p className="mt-0.5 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
                {dosage}
              </p>
            ) : (
              <p className="mt-0.5 text-[length:var(--ox-text-sm)] italic text-[var(--ox-text-subtle)]">
                No dosage instruction recorded
              </p>
            )}
          </div>
        </div>

        <StatusBadge tone={presentation.tone} icon={presentation.icon} className="shrink-0">
          {presentation.label}
        </StatusBadge>
      </div>

      {(reason || statusReason || typeof refills === "number" || showProvenance) && (
        <dl className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--ox-border)] pt-2.5 text-[length:var(--ox-text-xs)]">
          {reason && <Field label="For">{reason}</Field>}
          {/* Why a drug was stopped is often the single most useful field on
              the card, and it is routinely dropped by implementations. */}
          {statusReason && <Field label="Reason">{statusReason}</Field>}
          {typeof refills === "number" && (
            <Field label="Refills">
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                {refills}
              </span>
            </Field>
          )}
          {showProvenance && request?.authoredOn && (
            <Field label="Ordered">
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                {request.authoredOn.slice(0, 10)}
              </span>
            </Field>
          )}
          {showProvenance && request?.requester?.display && (
            <Field label="By">{request.requester.display}</Field>
          )}
        </dl>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-medium uppercase tracking-wide text-[var(--ox-text-subtle)]">{label}</dt>
      <dd className="text-[var(--ox-text-muted)]">{children}</dd>
    </div>
  );
}

/** Renders a medication list, preserving the order supplied. */
export function MedicationList({
  requests,
  asOf,
  emptyMessage = "No medications recorded.",
  className,
  ...props
}: {
  requests: MedicationRequest[] | undefined;
  asOf?: Date;
  emptyMessage?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!requests?.length) {
    return (
      <div
        className={cn(
          "rounded-[var(--ox-radius-lg)] border border-dashed border-[var(--ox-border-strong)]",
          "bg-[var(--ox-bg-subtle)] px-6 py-10 text-center",
          className,
        )}
        {...props}
      >
        <p className="text-[length:var(--ox-text-base)] text-[var(--ox-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {requests.map((request, index) => (
        <MedicationCard key={request.id ?? index} request={request} asOf={asOf} />
      ))}
    </div>
  );
}

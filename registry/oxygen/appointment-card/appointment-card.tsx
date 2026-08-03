"use client";

/**
 * AppointmentCard — a scheduled appointment from a FHIR Appointment resource.
 *
 * Time zone is a required prop, not an optional one.
 *
 * Defaulting to the browser's zone is how a clinic in one region books a
 * patient in another for the wrong hour. It is also invisible in testing,
 * because the developer and the test runner are usually in the same zone as
 * the clinic. Making the caller state the zone turns a silent class of bug
 * into a compile error.
 */

import * as React from "react";
import { CalendarX, Clock, MapPin, UserX, Video } from "lucide-react";
import {
  codeableText,
  formatAppointmentTime,
  isVirtualAppointment,
  timeZoneLabel,
  type Appointment,
  type AppointmentStatus,
} from "@oxygenui/fhir";
import { StatusBadge, type StatusTone } from "@/components/oxygen/status-badge";
import { cn } from "@/lib/utils";

const STATUS_PRESENTATION: Record<
  AppointmentStatus,
  { label: string; tone: StatusTone; icon?: React.ComponentType<{ className?: string }> }
> = {
  proposed: { label: "Proposed", tone: "unknown" },
  pending: { label: "Pending confirmation", tone: "high" },
  booked: { label: "Booked", tone: "normal" },
  arrived: { label: "Arrived", tone: "normal" },
  "checked-in": { label: "Checked in", tone: "normal" },
  fulfilled: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral", icon: CalendarX },
  // A no-show is operationally distinct from a cancellation: nobody was told,
  // the slot was lost, and follow-up is usually required.
  noshow: { label: "No-show", tone: "critical", icon: UserX },
  "entered-in-error": { label: "Entered in error", tone: "critical" },
  waitlist: { label: "Waitlisted", tone: "unknown" },
};

export interface AppointmentCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  appointment: Appointment | undefined;
  /**
   * IANA time zone the appointment time should be read in, e.g.
   * "Asia/Kolkata". Required — see the note at the top of this file.
   */
  timeZone: string;
  locale?: string;
  loading?: boolean;
  onSelect?: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  timeZone,
  locale,
  loading = false,
  onSelect,
  className,
  ...props
}: AppointmentCardProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading appointment"
        className={cn(
          "rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
          className,
        )}
        {...props}
      >
        <div className="h-4 w-44 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <div className="mt-2 h-3.5 w-32 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <span className="sr-only">Loading appointment</span>
      </div>
    );
  }

  const status = appointment?.status;
  const presentation = status ? STATUS_PRESENTATION[status] : { label: "Status unknown", tone: "unknown" as StatusTone };
  const when = formatAppointmentTime(appointment, timeZone, locale);
  const zone = timeZoneLabel(timeZone);
  const virtual = isVirtualAppointment(appointment);
  const service = codeableText(appointment?.serviceType?.[0]) ?? codeableText(appointment?.appointmentType);
  const practitioner = appointment?.participant?.find((p) =>
    p.actor?.reference?.startsWith("Practitioner"),
  )?.actor?.display;
  const cancellation = codeableText(appointment?.cancelationReason);
  const inactive = status === "cancelled" || status === "fulfilled" || status === "entered-in-error";
  const interactive = Boolean(onSelect);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onSelect && appointment ? () => onSelect(appointment) : undefined}
      onKeyDown={
        onSelect && appointment
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(appointment);
              }
            }
          : undefined
      }
      data-status={status ?? "unknown"}
      className={cn(
        "rounded-[var(--ox-radius-lg)] border bg-[var(--ox-surface)]",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)]",
        status === "noshow"
          ? "border-[var(--ox-status-critical-border)]"
          : "border-[var(--ox-border)]",
        interactive &&
          "cursor-pointer transition-colors hover:bg-[var(--ox-bg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ox-focus-ring)]",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={cn("font-semibold text-[var(--ox-text)]", inactive && "text-[var(--ox-text-muted)]")}>
            {appointment?.description ?? service ?? "Appointment"}
          </h3>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-3.5 shrink-0" />
              {when ? (
                <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                  {when}
                  {/* The zone is always shown. A time without one is an
                      assumption the reader cannot check. */}
                  {zone && <span className="text-[var(--ox-text-subtle)]"> {zone}</span>}
                </span>
              ) : (
                <span className="italic text-[var(--ox-text-subtle)]">Time not scheduled</span>
              )}
            </span>

            {appointment?.minutesDuration && (
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums text-[var(--ox-text-subtle)]">
                {appointment.minutesDuration} min
              </span>
            )}
          </p>

          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              {virtual ? (
                <>
                  <Video aria-hidden="true" className="size-3.5 shrink-0 text-[var(--ox-accent)]" />
                  Virtual visit
                </>
              ) : (
                <>
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  In person
                </>
              )}
            </span>
            {practitioner && <span>{practitioner}</span>}
          </p>
        </div>

        <StatusBadge tone={presentation.tone} icon={presentation.icon} className="shrink-0">
          {presentation.label}
        </StatusBadge>
      </div>

      {cancellation && (
        <p className="mt-2.5 border-t border-[var(--ox-border)] pt-2.5 text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
          <span className="font-medium uppercase tracking-wide text-[var(--ox-text-subtle)]">
            Reason
          </span>{" "}
          {cancellation}
        </p>
      )}

      {appointment?.patientInstruction && (
        <p className="mt-2 rounded-[var(--ox-radius)] bg-[var(--ox-bg-subtle)] px-3 py-2 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
          {appointment.patientInstruction}
        </p>
      )}
    </div>
  );
}

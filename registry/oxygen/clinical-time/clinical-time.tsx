"use client";

/**
 * ClinicalTime — a clinical instant with an unambiguous time zone.
 *
 * `timeZone` is a required prop. It is not inferred from the browser, and
 * there is no default, because the browser's zone is the wrong answer often
 * enough to be dangerous: a patient in one zone, a clinician in another, a
 * facility policy zone, and a UTC-stored record produce four defensible
 * readings of the same string.
 *
 * Two further rules:
 *
 *   1. Relative time is an addition, never a replacement. "Two hours ago" is
 *      useless in a handover and wrong in a medication record; the absolute
 *      time is always available and always in the accessible name.
 *   2. Partial precision is preserved. FHIR dateTime may be a year, a month, a
 *      day, or an instant. Rendering "2026" as 1 January 2026 invents a day
 *      nobody recorded.
 */

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import {
  datePrecision,
  formatClinicalDate,
  isFutureDate,
  timeZoneLabel,
} from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Coarse relative phrasing. Deliberately never more precise than it can be. */
function relativeLabel(from: Date, to: Date): string {
  const delta = to.getTime() - from.getTime();
  const ahead = delta < 0;
  const abs = Math.abs(delta);

  let phrase: string;
  if (abs < MINUTE) phrase = "just now";
  else if (abs < HOUR) phrase = `${Math.floor(abs / MINUTE)} min`;
  else if (abs < DAY) phrase = `${Math.floor(abs / HOUR)} h`;
  else if (abs < 30 * DAY) phrase = `${Math.floor(abs / DAY)} d`;
  else return "";

  if (phrase === "just now") return phrase;
  return ahead ? `in ${phrase}` : `${phrase} ago`;
}

export interface ClinicalTimeProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** FHIR date, dateTime, or instant. Partial precision is honoured. */
  value?: string;
  /**
   * IANA time zone the instant should be read in, e.g. "America/New_York".
   * Required — there is no safe default.
   */
  timeZone: string;
  locale?: string;
  /**
   * absolute — date and time (default)
   * relative — "2 h ago", with the absolute form in the accessible name
   * both     — absolute, with the relative form appended
   */
  display?: "absolute" | "relative" | "both";
  /** Show the zone label, e.g. "GMT-4". Recommended wherever zones can differ. */
  showZone?: boolean;
  /**
   * When the event was recorded, if that differs from when it happened.
   * A dose given at 08:00 and charted at 11:20 is two facts, not one.
   */
  recorded?: string;
  /** Evaluation date. Pass a fixed date to keep tests and stories deterministic. */
  asOf?: Date;
  label?: string;
}

export function ClinicalTime({
  value,
  timeZone,
  locale,
  display = "absolute",
  showZone = false,
  recorded,
  asOf = new Date(),
  label,
  className,
  ...props
}: ClinicalTimeProps) {
  const precision = datePrecision(value);
  const absolute = formatClinicalDate(value, timeZone, locale);

  if (!absolute || !value) {
    return (
      <span
        className={cn("text-[length:var(--ox-text-sm)] text-[var(--ox-text-subtle)]", className)}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
      >
        No date recorded
      </span>
    );
  }

  // Relative phrasing needs an instant. A year-only date has none, so the
  // request is ignored rather than answered with a fabricated precision.
  const canBeRelative = precision === "time" || precision === "day";
  const parsed = new Date(precision === "day" ? `${value}T00:00:00Z` : value);
  const relative = canBeRelative ? relativeLabel(parsed, asOf) : "";

  const zone = showZone && precision === "time" ? timeZoneLabel(timeZone, parsed) : undefined;
  const future = isFutureDate(value, asOf);

  const recordedAbsolute = recorded ? formatClinicalDate(recorded, timeZone, locale) : undefined;
  const chartedLate = Boolean(recordedAbsolute && recorded !== value);

  // The accessible name always carries the absolute time and the zone, even
  // when the visible text is relative.
  const spoken = [
    label,
    absolute,
    zone,
    chartedLate ? `recorded ${recordedAbsolute}` : undefined,
    future ? "date is in the future" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  const visible =
    display === "relative" && relative
      ? relative
      : display === "both" && relative
        ? `${absolute}${zone ? ` ${zone}` : ""} · ${relative}`
        : `${absolute}${zone ? ` ${zone}` : ""}`;

  return (
    <time
      dateTime={value}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        "font-[family-name:var(--ox-font-numeric)] tabular-nums",
        "text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]",
        className,
      )}
      {...(props as React.HTMLAttributes<HTMLTimeElement>)}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true">{visible}</span>

      {/* A future clinical timestamp is almost always a data error. Say so. */}
      {future && (
        <span
          aria-hidden="true"
          title="This timestamp is in the future"
          className="inline-flex items-center gap-1 text-[var(--ox-status-high)]"
        >
          <TriangleAlert className="size-3.5" />
          future
        </span>
      )}

      {chartedLate && (
        <span aria-hidden="true" className="text-[var(--ox-text-subtle)]">
          (recorded {recordedAbsolute})
        </span>
      )}
    </time>
  );
}

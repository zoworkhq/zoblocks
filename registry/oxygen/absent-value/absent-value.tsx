"use client";

/**
 * AbsentValue — renders the absence of a clinical value as a statement.
 *
 * This is the smallest component in the library and one of the most important,
 * because the alternatives are all worse than they look:
 *
 *   - A blank cell is indistinguishable from a rendering failure.
 *   - A dash flattens fifteen different reasons into one.
 *   - A zero is a value, and reading "not measured" as 0 is a clinical error.
 *
 * So absence gets a component. It always renders text, it never renders an
 * empty string, and it distinguishes the reasons that a reader must act on
 * differently — in particular it separates "the system does not have this"
 * from "you are not allowed to see this", which look identical in most
 * products and mean opposite things at the bedside.
 *
 * The component is presentational and takes the reason as data. It does not
 * decide whether a viewer is permitted to see something; that is the
 * application's job, and this renders the outcome.
 */

import * as React from "react";
import {
  CircleHelp,
  CircleOff,
  CircleSlash,
  Clock,
  FileText,
  Lock,
  MessageCircleOff,
  TriangleAlert,
} from "lucide-react";
import {
  ABSENT_REASON_LABEL,
  isRestrictedAbsence,
  resolveAbsentReason,
  type AbsentReason,
  type CodeableConcept,
} from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

/**
 * Three tones, not eleven. The reason taxonomy is fine-grained because the
 * words matter; the styling is coarse because a reader can only act on a few
 * distinctions at a glance.
 *
 *   muted      — genuinely absent. The chart does not have this.
 *   restricted — present but withheld. Do not read the chart as empty.
 *   warning    — something is broken. This SHOULD be here.
 */
type AbsentTone = "muted" | "restricted" | "warning";

const REASON_TONE: Record<AbsentReason, AbsentTone> = {
  unknown: "muted",
  pending: "muted",
  "not-collected": "muted",
  declined: "muted",
  masked: "restricted",
  "not-permitted": "restricted",
  "not-applicable": "muted",
  "not-performed": "muted",
  "as-text": "muted",
  error: "warning",
  unstated: "muted",
};

/**
 * Class names written out in full. Tailwind resolves classes by scanning source
 * text, so a template literal built from `tone` produces no CSS and the absence
 * renders as unstyled body text — which reads as a real value.
 */
const TONE_CLASS: Record<AbsentTone, string> = {
  muted: "text-[var(--ox-text-subtle)]",
  restricted: "text-[var(--ox-flag-restricted)]",
  warning: "text-[var(--ox-status-high)]",
};

const BLOCK_CLASS: Record<AbsentTone, string> = {
  muted: "border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] text-[var(--ox-text-muted)]",
  restricted:
    "border-[var(--ox-flag-restricted)]/30 bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)]",
  warning:
    "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
};

const REASON_ICON: Record<AbsentReason, React.ComponentType<{ className?: string }>> = {
  unknown: CircleHelp,
  pending: Clock,
  "not-collected": CircleSlash,
  declined: MessageCircleOff,
  masked: Lock,
  "not-permitted": Lock,
  "not-applicable": CircleOff,
  "not-performed": CircleSlash,
  "as-text": FileText,
  error: TriangleAlert,
  unstated: CircleSlash,
};

export interface AbsentValueProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * The FHIR `dataAbsentReason`, or a normalized reason directly.
   * Omit it entirely and the component renders "Not recorded" — absence with
   * no stated reason is itself a state, not a case to fall through.
   */
  reason?: CodeableConcept | AbsentReason;
  /**
   * The field this absence belongs to, e.g. "Potassium".
   *
   * Rendered as a screen-reader-only prefix so the announcement is "Potassium,
   * not asked" rather than a bare "not asked". Omit it when the absence already
   * sits in a cell associated with a row or column header, or the field name
   * will be announced twice.
   */
  field?: string;
  /**
   * Free-text explanation from the source system. Shown alongside the label.
   *
   * Ignored for restricted reasons: source text on a masked value can itself
   * describe what was masked, which defeats the masking. Failing closed here
   * costs a little detail and prevents a disclosure.
   */
  detail?: string;
  /**
   * inline — flows with body text and table cells (default)
   * block  — a bordered region for a whole empty section
   */
  variant?: "inline" | "block";
  /** Hide the icon. Only when an adjacent icon already carries the meaning. */
  hideIcon?: boolean;
  /**
   * Offer a way to request access. Rendered only for restricted reasons, since
   * there is nothing to request when the data genuinely does not exist.
   */
  onRequestAccess?: () => void;
  requestAccessLabel?: string;
}

/** Resolve either input shape to a normalized reason. */
function normalize(reason: AbsentValueProps["reason"]): AbsentReason {
  if (!reason) return "unstated";
  if (typeof reason === "string") return reason;
  return resolveAbsentReason(reason);
}

/** Source text, where it is safe to show and adds something over the label. */
function sourceDetail(
  reason: AbsentValueProps["reason"],
  detail: string | undefined,
  resolved: AbsentReason,
): string | undefined {
  if (isRestrictedAbsence(resolved)) return undefined;
  if (detail) return detail;
  if (reason && typeof reason !== "string" && reason.text) return reason.text;
  return undefined;
}

export function AbsentValue({
  reason,
  field,
  detail,
  variant = "inline",
  hideIcon = false,
  onRequestAccess,
  requestAccessLabel = "Request access",
  className,
  ...props
}: AbsentValueProps) {
  const resolved = normalize(reason);
  const tone = REASON_TONE[resolved];
  const Icon = REASON_ICON[resolved];
  const label = ABSENT_REASON_LABEL[resolved];
  const explanation = sourceDetail(reason, detail, resolved);
  const canRequest = Boolean(onRequestAccess) && isRestrictedAbsence(resolved);

  const body = (
    <>
      {/*
        Not aria-hidden on the field: this is the prefix that turns a bare
        "Not asked" into "Potassium, not asked" for a screen-reader user
        landing in a cell with no other context.
      */}
      {field && <span className="sr-only">{field}, </span>}
      {!hideIcon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />}
      <span>{label}</span>
      {explanation && <span className="text-[var(--ox-text-subtle)]">— {explanation}</span>}
    </>
  );

  if (variant === "block") {
    return (
      <div
        data-absent-reason={resolved}
        className={cn(
          "flex flex-col items-start gap-2 rounded-[var(--ox-radius)] border border-dashed px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-[length:var(--ox-text-sm)]",
          BLOCK_CLASS[tone],
          className,
        )}
        {...(props as React.HTMLAttributes<HTMLDivElement>)}
      >
        <span className="flex items-center gap-1.5 font-medium">{body}</span>
        {canRequest && (
          <button
            type="button"
            onClick={onRequestAccess}
            className="rounded-[var(--ox-radius-sm)] border border-current px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold hover:bg-[var(--ox-bg)]"
          >
            {requestAccessLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <span
      data-absent-reason={resolved}
      className={cn(
        "inline-flex items-center gap-1.5 text-[length:var(--ox-text-sm)]",
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {body}
      {canRequest && (
        <button
          type="button"
          onClick={onRequestAccess}
          className="underline underline-offset-2 hover:no-underline"
        >
          {requestAccessLabel}
        </button>
      )}
    </span>
  );
}

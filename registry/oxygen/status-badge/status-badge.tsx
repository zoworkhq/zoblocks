"use client";

/**
 * StatusBadge — the shared severity and status chip.
 *
 * Every Oxygen component that communicates state uses this, so that "critical"
 * looks and reads identically on a lab result, a medication, and an allergy.
 *
 * Two rules are enforced by the API itself:
 *
 *   1. `children` is required. There is no icon-only variant, because an icon
 *      alone is not a label — it is a rebus.
 *   2. Tone maps to a semantic token, never to a raw color. A caller cannot
 *      pass "red"; they pass "critical", and the token decides what that
 *      looks like in light, dark, and forced-colors modes.
 */

import * as React from "react";
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  CirclePause,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone = "critical" | "high" | "low" | "normal" | "unknown" | "neutral";

/**
 * Class names written out in full. Tailwind resolves classes by scanning
 * source text, so a template literal built from `tone` produces no CSS and
 * the badge renders unstyled — which silently deletes the severity signal.
 */
const TONE_CLASS: Record<StatusTone, string> = {
  critical:
    "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  high: "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  low: "border-[var(--ox-status-low-border)] bg-[var(--ox-status-low-bg)] text-[var(--ox-status-low)]",
  normal:
    "border-[var(--ox-status-normal-border)] bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)]",
  unknown:
    "border-[var(--ox-status-unknown-border)] bg-[var(--ox-status-unknown-bg)] text-[var(--ox-status-unknown)]",
  neutral: "border-[var(--ox-border)] bg-[var(--ox-bg-muted)] text-[var(--ox-text-muted)]",
};

const TONE_ICON: Record<StatusTone, React.ComponentType<{ className?: string }>> = {
  critical: CircleAlert,
  high: TrendingUp,
  low: TrendingDown,
  normal: CircleCheck,
  unknown: CircleHelp,
  neutral: CircleMinus,
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  /** Replace the tone's default icon. Pass `null` only when an adjacent icon already carries the meaning. */
  icon?: React.ComponentType<{ className?: string }> | null;
  size?: "sm" | "md";
  /** The label. Required — a badge without text is not accessible. */
  children: React.ReactNode;
}

export function StatusBadge({
  tone = "neutral",
  icon,
  size = "sm",
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = icon === null ? null : (icon ?? TONE_ICON[tone]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--ox-radius-full)] border font-semibold",
        size === "sm"
          ? "px-2 py-0.5 text-[length:var(--ox-text-xs)]"
          : "px-2.5 py-1 text-[length:var(--ox-text-sm)]",
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </span>
  );
}

/** Paused / on-hold icon, exported so medication and care components share it. */
export { CirclePause as PauseIcon };

"use client";

/**
 * PrecautionsBar — what staff must know before entering the room.
 *
 * This is read on the way through a door, so it is ordered by the action
 * required rather than alphabetically, and the required PPE is named rather
 * than implied by a category. "Contact precautions" is a label; "gown and
 * gloves" is an instruction.
 *
 * Two things it does that a flag list does not:
 *
 *   1. Lapsed precautions are dropped, not greyed out. A stale precaution left
 *      on screen is how staff learn to ignore all of them, and the credibility
 *      of the whole bar depends on nothing false being on it.
 *   2. Behavioral flags describe the approach, not the person. "Two staff for
 *      personal care" is actionable and carries no judgement; "aggressive" is
 *      a label that follows someone through the record and shapes their care
 *      for years. The component takes an approach string and will render a
 *      category without one rather than inventing a characterisation.
 */

import * as React from "react";
import { Biohazard, HandHelping, PersonStanding, ShieldAlert, Wind } from "lucide-react";
import { codeableText, flagCategory, isFlagActive, type Flag } from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

export type PrecautionKind =
  "isolation" | "airborne" | "fall" | "behavioral" | "mobility" | "other";

export interface PrecautionDisplay {
  kind: PrecautionKind;
  /** What the precaution is called. */
  label: string;
  /** What staff must actually do. The reason the bar exists. */
  action?: string;
}

export interface PrecautionsBarProps {
  flags?: Flag[];
  /** Explicit precautions, for callers not modelling these as FHIR Flags. */
  precautions?: PrecautionDisplay[];
  /**
   * Maps a Flag to its required action. Without an entry, the precaution
   * renders with its label alone rather than an invented instruction.
   */
  actionFor?: (flag: Flag) => string | undefined;
  asOf?: Date;
  className?: string;
}

const KIND_ICON: Record<PrecautionKind, React.ComponentType<{ className?: string }>> = {
  isolation: Biohazard,
  airborne: Wind,
  fall: PersonStanding,
  behavioral: ShieldAlert,
  mobility: HandHelping,
  other: ShieldAlert,
};

/** Written out in full — Tailwind cannot resolve a class built from a variable. */
const KIND_CLASS: Record<PrecautionKind, string> = {
  isolation:
    "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  airborne:
    "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  fall: "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  behavioral: "border-[#ddd6fe] bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)]",
  mobility:
    "border-[var(--ox-status-low-border)] bg-[var(--ox-status-low-bg)] text-[var(--ox-status-low)]",
  other: "border-[var(--ox-border-strong)] bg-[var(--ox-bg-muted)] text-[var(--ox-text-muted)]",
};

/** Ordered by how urgently it changes what someone does at the door. */
const KIND_ORDER: PrecautionKind[] = [
  "airborne",
  "isolation",
  "behavioral",
  "fall",
  "mobility",
  "other",
];

const CATEGORY_KIND: Record<string, PrecautionKind> = {
  infection: "isolation",
  airborne: "airborne",
  safety: "fall",
  behavioral: "behavioral",
  mobility: "mobility",
};

function kindFor(flag: Flag): PrecautionKind {
  const category = flagCategory(flag);
  return (category && CATEGORY_KIND[category]) || "other";
}

export function PrecautionsBar({
  flags,
  precautions,
  actionFor,
  asOf = new Date(),
  className,
}: PrecautionsBarProps) {
  const fromFlags: PrecautionDisplay[] = (flags ?? [])
    // Dropped, not greyed. A lapsed precaution on screen devalues every
    // precaution beside it.
    .filter((flag) => isFlagActive(flag, asOf))
    .map((flag) => ({
      kind: kindFor(flag),
      label: codeableText(flag.code) ?? "Precaution",
      action: actionFor?.(flag),
    }));

  const all = [...fromFlags, ...(precautions ?? [])].sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind),
  );

  if (!all.length) {
    return (
      <p className={cn("text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]", className)}>
        No active precautions recorded
      </p>
    );
  }

  return (
    <section
      aria-label="Precautions"
      className={cn("flex flex-wrap items-stretch gap-2", className)}
    >
      {all.map((precaution, index) => {
        const Icon = KIND_ICON[precaution.kind];
        return (
          <div
            key={`${precaution.label}-${index}`}
            className={cn(
              "flex items-center gap-2 rounded-[var(--ox-radius)] border px-2.5 py-1.5",
              KIND_CLASS[precaution.kind],
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <div className="min-w-0">
              {/* Icon, text, and colour together — this is read at a distance,
                  in a corridor, often on a poor display. */}
              <p className="text-[length:var(--ox-text-sm)] font-semibold leading-tight">
                {precaution.label}
              </p>
              {precaution.action && (
                <p className="text-[length:var(--ox-text-xs)] leading-tight opacity-90">
                  {precaution.action}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

"use client";

/**
 * ClinicalValue — one measured quantity, its unit, and its interpretation as a
 * single atomic element.
 *
 * The bug this exists to prevent is mundane and everywhere: a value and its
 * unit laid out as separate nodes, which then drift apart under truncation,
 * wrapping, or translation. "5.1" next to "mmol/L" in a narrow column can wrap
 * so the unit lands beside the row below it. Here they are one element and
 * cannot separate.
 *
 * Three rules the API enforces:
 *
 *   1. Precision is never changed. A lab that reported 5.10 meant three
 *      significant figures; re-rounding it to 5.1 discards information the
 *      source deliberately included.
 *   2. Comparators survive. A result of <0.01 is not 0.01, and dropping the
 *      comparator turns "undetectable" into a number.
 *   3. Absence routes to AbsentValue. There is no code path here that renders
 *      an empty string.
 */

import * as React from "react";
import { quantityParts, type CodeableConcept, type Quantity } from "@oxygenui/fhir";
import { AbsentValue } from "@/components/oxygen/absent-value";
import { cn } from "@/lib/utils";

/** Emphasis, not severity. Severity belongs to StatusBadge and the row. */
type ValueTone = "default" | "critical" | "high" | "low" | "normal" | "muted";

/**
 * Class names written out in full. Tailwind resolves classes by scanning source
 * text, so a template literal built from `tone` produces no CSS and the value
 * renders unstyled — which silently deletes the severity signal.
 */
const TONE_CLASS: Record<ValueTone, string> = {
  default: "text-[var(--ox-text)]",
  critical: "text-[var(--ox-status-critical)]",
  high: "text-[var(--ox-status-high)]",
  low: "text-[var(--ox-status-low)]",
  normal: "text-[var(--ox-status-normal)]",
  muted: "text-[var(--ox-text-muted)]",
};

const SIZE_CLASS = {
  sm: "text-[length:var(--ox-text-sm)]",
  md: "text-[length:var(--ox-density-font)]",
  lg: "text-[length:var(--ox-text-xl)]",
  hero: "text-[length:var(--ox-text-2xl)]",
} as const;

export interface ClinicalValueProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** The measured quantity. */
  quantity?: Quantity;
  /** Non-numeric result — a titre, an organism, "Nonreactive". */
  text?: string;
  /**
   * Why the value is absent, when it is. Passed straight to AbsentValue.
   * Absence is rendered as a statement, never as a blank or a dash.
   */
  absentReason?: CodeableConcept;
  /** Field name, used for the accessible name of an absent value. */
  field?: string;
  tone?: ValueTone;
  size?: keyof typeof SIZE_CLASS;
  /** Emphasise the number. Used for critical results. */
  bold?: boolean;
  /** Hide the unit. Only when a column header already carries it. */
  hideUnit?: boolean;
}

/**
 * Expansions for the abbreviations most likely to be misread aloud.
 *
 * mg/dL and mmol/L differ by a factor that matters, and a screen reader saying
 * "em em oh ell slash ell" is not a unit. Only unambiguous expansions are
 * listed; an unknown unit is announced as written rather than guessed at.
 */
const UNIT_SPOKEN: Record<string, string> = {
  "mg/dL": "milligrams per decilitre",
  "g/dL": "grams per decilitre",
  "mmol/L": "millimoles per litre",
  "mIU/L": "milli-international units per litre",
  "µg/L": "micrograms per litre",
  "ng/mL": "nanograms per millilitre",
  mmHg: "millimetres of mercury",
  "/min": "per minute",
  "%": "percent",
  "°C": "degrees Celsius",
  "°F": "degrees Fahrenheit",
  kg: "kilograms",
  cm: "centimetres",
};

const COMPARATOR_SPOKEN: Record<string, string> = {
  "<": "less than",
  "<=": "less than or equal to",
  ">": "greater than",
  ">=": "greater than or equal to",
};

export function ClinicalValue({
  quantity,
  text,
  absentReason,
  field,
  tone = "default",
  size = "md",
  bold = false,
  hideUnit = false,
  className,
  ...props
}: ClinicalValueProps) {
  const parts = quantityParts(quantity);

  if (!parts && !text) {
    return <AbsentValue field={field} reason={absentReason} />;
  }

  if (!parts) {
    return (
      <span
        className={cn(SIZE_CLASS[size], TONE_CLASS[tone], bold && "font-semibold", className)}
        {...props}
      >
        {text}
      </span>
    );
  }

  const { comparator, value, unit } = parts;

  // The spoken form is assembled so a screen reader never reads a bare number.
  // "6.8" alone is meaningless; "6.8 millimoles per litre" is a result.
  const spoken = [
    comparator ? COMPARATOR_SPOKEN[comparator] : undefined,
    value,
    unit ? (UNIT_SPOKEN[unit] ?? unit) : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 whitespace-nowrap",
        "font-[family-name:var(--ox-font-numeric)] tabular-nums",
        SIZE_CLASS[size],
        TONE_CLASS[tone],
        bold ? "font-bold" : "font-medium",
        className,
      )}
      {...props}
    >
      {/* One accessible name for the whole quantity, not three fragments. */}
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true">
        {comparator}
        {value}
      </span>
      {unit && !hideUnit && (
        <span aria-hidden="true" className="font-normal text-[var(--ox-text-muted)]">
          {unit}
        </span>
      )}
    </span>
  );
}

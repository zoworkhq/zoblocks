"use client";

/**
 * DoseInput — numeric entry for doses, weights, rates, and volumes.
 *
 * This is one of the highest-consequence inputs in healthcare software, and a
 * free-text number field is not an acceptable control for it.
 *
 * Three defences, in order of how much harm they prevent:
 *
 *   1. ISMP formatting rules. "1.0 mg" read past the decimal point is 10 mg;
 *      ".5 mg" is 5 mg. Both patterns are flagged as you type, with the
 *      corrected form offered — not silently rewritten, because a silent
 *      rewrite of a dose is its own hazard.
 *   2. Plausibility, separated from abnormality. A dose can be unusual and
 *      correct. A soft warning states its reason and does not block; a hard
 *      maximum blocks and says what it is. Conflating the two is how
 *      prescribers learn to click through both.
 *   3. Weight-based calculation with its inputs shown. A calculator that
 *      returns a bare number invites use with a stale weight, so the arithmetic
 *      stays on screen and the result is never editable independently of it.
 *
 * Units come from the drug and route, not from a free list — "5 units" and
 * "5 mL" of insulin are different events.
 */

import * as React from "react";
import { Calculator, CircleAlert, TriangleAlert } from "lucide-react";
import {
  DOSE_ISSUE_LABEL,
  doseFormatIssues,
  safeDoseText,
  weightBasedDose,
  type DoseFormatIssue,
} from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

export interface DoseInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Units permitted for this drug and route. Never a free list. */
  units: string[];
  unit?: string;
  onUnitChange?: (unit: string) => void;
  /**
   * Soft floor and ceiling. Crossing these warns with a stated reason and
   * does NOT block — a dose can be unusual and correct.
   */
  plausibleMin?: number;
  plausibleMax?: number;
  /**
   * Documented hard maximum. Crossing this blocks, and the interface says
   * what the maximum is rather than only refusing.
   */
  absoluteMax?: number;
  /** Weight-based dosing. Omit the weight and no calculation is offered. */
  dosePerKg?: number;
  weightKg?: number;
  disabled?: boolean;
  className?: string;
}

/** Written out in full — Tailwind cannot see a class built from a variable. */
const FIELD_CLASS = {
  ok: "border-[var(--ox-border-strong)]",
  warn: "border-[var(--ox-status-high)] bg-[var(--ox-status-high-bg)]",
  block: "border-[var(--ox-status-critical)] bg-[var(--ox-status-critical-bg)]",
} as const;

export function DoseInput({
  id = "ox-dose",
  label = "Dose",
  value,
  onChange,
  units,
  unit,
  onUnitChange,
  plausibleMin,
  plausibleMax,
  absoluteMax,
  dosePerKg,
  weightKg,
  disabled = false,
  className,
}: DoseInputProps) {
  const issues: DoseFormatIssue[] = doseFormatIssues(value);
  const corrected = safeDoseText(value);
  const numeric = value.trim() === "" ? undefined : Number(value);
  const parsed = numeric !== undefined && !Number.isNaN(numeric) ? numeric : undefined;

  const overAbsolute = parsed !== undefined && absoluteMax !== undefined && parsed > absoluteMax;
  const overPlausible =
    parsed !== undefined && plausibleMax !== undefined && parsed > plausibleMax && !overAbsolute;
  const underPlausible =
    parsed !== undefined && plausibleMin !== undefined && parsed < plausibleMin;

  const calculation = weightBasedDose(dosePerKg, weightKg, absoluteMax);

  const tone = overAbsolute
    ? "block"
    : issues.length || overPlausible || underPlausible
      ? "warn"
      : "ok";

  // Every message is associated with the input, so a screen-reader user hears
  // the problem on the field rather than discovering it at submit.
  const messageIds = [
    issues.length ? `${id}-format` : undefined,
    overAbsolute ? `${id}-block` : undefined,
    overPlausible || underPlausible ? `${id}-plausible` : undefined,
    calculation ? `${id}-calc` : undefined,
  ].filter(Boolean) as string[];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[length:var(--ox-text-2xs)] font-semibold uppercase tracking-wider text-[var(--ox-text-muted)]"
      >
        {label}
      </label>

      <div className="flex items-stretch gap-2">
        <input
          id={id}
          type="text"
          // A numeric keypad without the spinner: spinners on a dose field
          // let a stray scroll change a prescription.
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={overAbsolute || issues.includes("not-a-number")}
          aria-describedby={messageIds.length ? messageIds.join(" ") : undefined}
          className={cn(
            "w-28 rounded-[var(--ox-radius-sm)] border bg-[var(--ox-surface)] px-2 py-1.5",
            "font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-density-font)] tabular-nums",
            FIELD_CLASS[tone],
          )}
        />

        <label htmlFor={`${id}-unit`} className="sr-only">
          Unit
        </label>
        <select
          id={`${id}-unit`}
          disabled={disabled}
          value={unit ?? units[0] ?? ""}
          onChange={(event) => onUnitChange?.(event.target.value)}
          className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] bg-[var(--ox-surface)] px-2 py-1.5 text-[length:var(--ox-density-font)]"
        >
          {units.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* ISMP formatting. Offered, never applied silently. */}
      {issues.length > 0 && (
        <p
          id={`${id}-format`}
          className="flex items-start gap-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {issues.map((issue) => DOSE_ISSUE_LABEL[issue]).join(" ")}
            {corrected && corrected !== value && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => onChange(corrected)}
                  className="font-semibold underline underline-offset-2"
                >
                  Use {corrected}
                </button>
              </>
            )}
          </span>
        </p>
      )}

      {/* Hard stop. States the maximum rather than only refusing. */}
      {overAbsolute && (
        <p
          id={`${id}-block`}
          role="alert"
          className="flex items-start gap-1.5 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-status-critical)]"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Above the documented maximum of {absoluteMax} {unit ?? units[0]}. This cannot be
          prescribed without an override.
        </p>
      )}

      {/* Soft warning. Reason stated; does not block. */}
      {(overPlausible || underPlausible) && (
        <p
          id={`${id}-plausible`}
          className="flex items-start gap-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {overPlausible
            ? `Unusually high for this drug and route (typical up to ${plausibleMax}). Confirm if intended.`
            : `Unusually low for this drug and route (typical from ${plausibleMin}). Confirm if intended.`}
        </p>
      )}

      {/* The arithmetic, not just the answer. */}
      {calculation && (
        <div
          id={`${id}-calc`}
          className="flex items-start gap-1.5 rounded-[var(--ox-radius-sm)] bg-[var(--ox-bg-subtle)] px-2 py-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]"
        >
          <Calculator aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
              {calculation.workings}
            </span>{" "}
            ={" "}
            <strong className="font-[family-name:var(--ox-font-numeric)] font-semibold tabular-nums text-[var(--ox-text)]">
              {calculation.total} {unit ?? units[0]}
            </strong>
            {calculation.cappedAt !== undefined && " — capped at the documented maximum"}
            <button
              type="button"
              onClick={() => onChange(String(calculation.total))}
              className="ml-2 font-semibold text-[var(--ox-accent)] underline underline-offset-2"
            >
              Use this
            </button>
          </span>
        </div>
      )}

      {/* Weight-based dosing was requested but there is no weight. Say so
          rather than substituting an average, which turns a paediatric dose
          into an adult one. */}
      {dosePerKg !== undefined && !calculation && (
        <p className="text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]">
          Weight-based dosing requires a recorded weight. No weight on file — record one before
          calculating.
        </p>
      )}
    </div>
  );
}

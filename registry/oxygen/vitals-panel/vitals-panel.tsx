"use client";

/**
 * ObservationPanel — renders a set of FHIR R4 `Observation` resources as a
 * results list: value, units, reference range, and interpretation.
 *
 * The interpretation logic is the entire point of this component, and it is
 * conservative by design:
 *
 *   - An interpretation stated in the payload always wins.
 *   - If none is stated, it is derived ONLY by comparing the value to its own
 *     reference range. Nothing else is inferred.
 *   - With neither, the result reads "Not interpreted" — never "Normal".
 *     Silently defaulting an uninterpreted result to normal is how a UI
 *     manufactures false reassurance.
 *
 * Severity is carried by icon, text label, and position — never by color
 * alone. Verify by viewing in forced-colors mode: every status must still be
 * distinguishable.
 */

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  CircleHelp,
  FileWarning,
  Minus,
  PencilLine,
} from "lucide-react";
import {
  codeableText,
  formatComponentValue,
  formatObservationValue,
  formatReferenceRange,
  getComponentInterpretation,
  getPanelInterpretation,
  INTERPRETATION_LABEL,
  isCorrected,
  isCritical,
  isProvisional,
  type Interpretation,
  type Observation,
  type ObservationComponent,
} from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Interpretation → presentation
// ---------------------------------------------------------------------------

const INTERPRETATION_ICON: Record<Interpretation, React.ComponentType<{ className?: string }>> = {
  "critical-high": CircleAlert,
  "critical-low": CircleAlert,
  high: ArrowUp,
  low: ArrowDown,
  abnormal: CircleAlert,
  normal: Check,
  unknown: CircleHelp,
};

/**
 * Class names are written out in full, never assembled from a variable.
 * Tailwind resolves classes by scanning source text, so a template literal
 * like `text-[var(--ox-status-${token})]` produces no CSS at all — the badge
 * renders unstyled and severity silently disappears. Keep these literal.
 */
const INTERPRETATION_CLASS: Record<Interpretation, { badge: string; value: string }> = {
  "critical-high": {
    badge:
      "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
    value: "text-[var(--ox-status-critical)]",
  },
  "critical-low": {
    badge:
      "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
    value: "text-[var(--ox-status-critical)]",
  },
  high: {
    badge:
      "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
    value: "text-[var(--ox-status-high)]",
  },
  low: {
    badge:
      "border-[var(--ox-status-low-border)] bg-[var(--ox-status-low-bg)] text-[var(--ox-status-low)]",
    value: "text-[var(--ox-status-low)]",
  },
  abnormal: {
    badge:
      "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
    value: "text-[var(--ox-status-high)]",
  },
  normal: {
    badge:
      "border-[var(--ox-status-normal-border)] bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)]",
    value: "text-[var(--ox-status-normal)]",
  },
  unknown: {
    badge:
      "border-[var(--ox-status-unknown-border)] bg-[var(--ox-status-unknown-bg)] text-[var(--ox-status-unknown)]",
    value: "text-[var(--ox-status-unknown)]",
  },
};

// `onSelect` is omitted from the DOM attributes deliberately: React's native
// onSelect fires on text selection, which is not what a row activation means.
// Ours takes the Observation that was chosen.
export interface ObservationPanelProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** FHIR R4 Observation resources, in the order they should be read. */
  observations: Observation[] | undefined;
  /** Accessible name for the results table. */
  label?: string;
  /** Hide the reference-range column — useful in narrow or patient-facing layouts. */
  hideReferenceRange?: boolean;
  /** Renders the skeleton state. */
  loading?: boolean;
  /** Number of skeleton rows while loading. */
  loadingRows?: number;
  /** Shown when `observations` is an empty array. */
  emptyMessage?: string;
  /** Called when a row is activated. Omit to render non-interactive rows. */
  onSelect?: (observation: Observation) => void;
}

export function ObservationPanel({
  observations,
  label = "Observations",
  hideReferenceRange = false,
  loading = false,
  loadingRows = 4,
  emptyMessage = "No results in this period.",
  onSelect,
  className,
  ...props
}: ObservationPanelProps) {
  if (loading) {
    return <ObservationPanelSkeleton rows={loadingRows} className={className} {...props} />;
  }

  if (!observations?.length) {
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

  const criticalCount = observations.filter((o) => isCritical(getPanelInterpretation(o))).length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)]",
        "bg-[var(--ox-surface)]",
        className,
      )}
      {...props}
    >
      {/* Announced to assistive tech before the table is read, so a critical
          result is known up front rather than discovered on row seven. */}
      {criticalCount > 0 && (
        <p className="sr-only" role="status">
          {criticalCount} critical {criticalCount === 1 ? "result" : "results"} in this panel.
        </p>
      )}

      <table className="w-full border-collapse text-[length:var(--ox-density-font)]">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr className="border-b border-[var(--ox-border)] bg-[var(--ox-bg-subtle)]">
            <Th className="text-left">Test</Th>
            <Th className="text-right">Result</Th>
            {!hideReferenceRange && <Th className="text-right">Reference</Th>}
            <Th className="text-left">Interpretation</Th>
          </tr>
        </thead>
        <tbody>
          {observations.map((observation, index) => (
            <React.Fragment key={observation.id ?? index}>
              <ObservationRow
                observation={observation}
                hideReferenceRange={hideReferenceRange}
                onSelect={onSelect}
              />
              {/* Multi-part results (blood pressure, differentials) carry their
                  reading in components, not on the parent. Each renders as its
                  own indented row so systolic and diastolic are separately
                  readable and separately flaggable. */}
              {(observation.component ?? []).map((part, partIndex) => (
                <ObservationComponentRow
                  key={partIndex}
                  component={part}
                  hideReferenceRange={hideReferenceRange}
                />
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-[var(--ox-density-pad-x)] py-2",
        "text-[length:var(--ox-text-xs)] font-semibold uppercase tracking-wide",
        "text-[var(--ox-text-subtle)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ObservationRow({
  observation,
  hideReferenceRange = false,
  onSelect,
}: {
  observation: Observation;
  hideReferenceRange?: boolean;
  onSelect?: (observation: Observation) => void;
}) {
  // Panel interpretation, not just the parent's: a critical systolic must
  // escalate the blood-pressure row even though the parent has no value.
  const interpretation = getPanelInterpretation(observation);
  const style = INTERPRETATION_CLASS[interpretation];
  const Icon = INTERPRETATION_ICON[interpretation];
  const critical = isCritical(interpretation);

  const name = codeableText(observation.code) ?? "Unnamed observation";
  const parts = observation.component ?? [];
  const value = formatObservationValue(observation);
  const absentReason = codeableText(observation.dataAbsentReason);
  const range = formatReferenceRange(observation.referenceRange?.[0]);

  const interactive = Boolean(onSelect);

  return (
    <tr
      onClick={onSelect ? () => onSelect(observation) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(observation);
              }
            }
          : undefined
      }
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      data-interpretation={interpretation}
      className={cn(
        "border-b border-[var(--ox-border)] last:border-b-0",
        "min-h-[var(--ox-density-row-height)]",
        interactive &&
          "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ox-focus-ring)] hover:bg-[var(--ox-bg-subtle)]",
        // A critical result gets a left rule as well as its badge: a second,
        // non-color channel that survives grayscale and forced-colors.
        critical &&
          "bg-[var(--ox-status-critical-bg)] shadow-[inset_3px_0_0_0_var(--ox-status-critical)]",
      )}
    >
      <td className="px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]">
        <div className="font-medium text-[var(--ox-text)]">{name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {isProvisional(observation) && (
            <StatusChip icon={<FileWarning aria-hidden="true" className="size-3" />}>
              Preliminary
            </StatusChip>
          )}
          {isCorrected(observation) && (
            <StatusChip icon={<PencilLine aria-hidden="true" className="size-3" />}>
              {observation.status === "amended" ? "Amended" : "Corrected"}
            </StatusChip>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-right">
        {value ? (
          <span
            className={cn(
              "font-[family-name:var(--ox-font-numeric)] tabular-nums",
              critical ? "font-bold" : "font-medium",
              style.value,
            )}
          >
            {value}
          </span>
        ) : parts.length ? (
          // The reading is in the rows below. Saying "No value" here would be
          // wrong, and blank would look like a failure.
          <span className="text-[length:var(--ox-text-sm)] text-[var(--ox-text-subtle)]">
            {parts.length} parts
          </span>
        ) : (
          <span className="text-[length:var(--ox-text-sm)] italic text-[var(--ox-text-subtle)]">
            {absentReason ?? "No value"}
          </span>
        )}
      </td>

      {!hideReferenceRange && (
        <td className="whitespace-nowrap px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-right">
          {range ? (
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
              {range}
            </span>
          ) : (
            <Minus aria-hidden="true" className="ml-auto size-3.5 text-[var(--ox-text-subtle)]" />
          )}
        </td>
      )}

      <td className="px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--ox-radius-full)] border px-2 py-0.5",
            "text-[length:var(--ox-text-xs)] font-semibold whitespace-nowrap",
            style.badge,
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
          {INTERPRETATION_LABEL[interpretation]}
        </span>
      </td>
    </tr>
  );
}

/**
 * One part of a multi-component observation — a systolic reading, a
 * differential fraction. Indented under its parent and independently flagged,
 * because "blood pressure is abnormal" is not actionable but "systolic is
 * critical high" is.
 */
export function ObservationComponentRow({
  component,
  hideReferenceRange = false,
}: {
  component: ObservationComponent;
  hideReferenceRange?: boolean;
}) {
  const interpretation = getComponentInterpretation(component);
  const style = INTERPRETATION_CLASS[interpretation];
  const Icon = INTERPRETATION_ICON[interpretation];
  const critical = isCritical(interpretation);

  const name = codeableText(component.code) ?? "Component";
  const value = formatComponentValue(component);
  const absentReason = codeableText(component.dataAbsentReason);
  const range = formatReferenceRange(component.referenceRange?.[0]);

  return (
    <tr
      data-interpretation={interpretation}
      className={cn(
        "border-b border-[var(--ox-border)] last:border-b-0",
        critical &&
          "bg-[var(--ox-status-critical-bg)] shadow-[inset_3px_0_0_0_var(--ox-status-critical)]",
      )}
    >
      <td className="py-[var(--ox-density-pad-y)] pl-[calc(var(--ox-density-pad-x)*2)] pr-[var(--ox-density-pad-x)]">
        <span className="text-[var(--ox-text-muted)]">{name}</span>
      </td>

      <td className="whitespace-nowrap px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-right">
        {value ? (
          <span
            className={cn(
              "font-[family-name:var(--ox-font-numeric)] tabular-nums",
              critical ? "font-bold" : "font-medium",
              style.value,
            )}
          >
            {value}
          </span>
        ) : (
          <span className="text-[length:var(--ox-text-sm)] italic text-[var(--ox-text-subtle)]">
            {absentReason ?? "No value"}
          </span>
        )}
      </td>

      {!hideReferenceRange && (
        <td className="whitespace-nowrap px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] text-right">
          {range ? (
            <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
              {range}
            </span>
          ) : (
            <Minus aria-hidden="true" className="ml-auto size-3.5 text-[var(--ox-text-subtle)]" />
          )}
        </td>
      )}

      <td className="px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--ox-radius-full)] border px-2 py-0.5",
            "text-[length:var(--ox-text-xs)] font-semibold whitespace-nowrap",
            style.badge,
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
          {INTERPRETATION_LABEL[interpretation]}
        </span>
      </td>
    </tr>
  );
}

function StatusChip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[length:var(--ox-text-xs)] font-medium text-[var(--ox-flag-provisional)]">
      {icon}
      {children}
    </span>
  );
}

export function ObservationPanelSkeleton({
  rows = 4,
  className,
  ...props
}: { rows?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading results"
      className={cn(
        "overflow-hidden rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        className,
      )}
      {...props}
    >
      <div className="border-b border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] px-[var(--ox-density-pad-x)] py-2.5">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 border-b border-[var(--ox-border)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)] last:border-b-0"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--ox-bg-muted)]" />
        </div>
      ))}
      <span className="sr-only">Loading results</span>
    </div>
  );
}

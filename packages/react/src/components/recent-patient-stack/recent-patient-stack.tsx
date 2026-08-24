"use client";

// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/oxygen/recent-patient-stack/recent-patient-stack.tsx. Edit that file, not this one.
/**
 * RecentPatientStack — a multi-chart workspace that makes the active patient
 * unmistakable, because the alternative is eleven identical browser tabs.
 *
 *     <RecentPatientStack
 *       charts={open}
 *       activeId={activeId}
 *       now={serverTime}
 *       onActivate={switchChart}
 *       onClose={closeChart}
 *     />
 *
 * A stack does three things a dropdown cannot: it makes the set visible
 * without being opened, it gives each chart a persistent visual identity, and
 * it carries per-chart state — a draft note, a pending order, an unread
 * result.
 *
 * The identity is derived from the chart id rather than handed out in arrival
 * order, so it is the same hue in every session. Colour is never the only
 * identity: the initials and the name are always present, and two charts whose
 * names look alike both grow an identifier.
 *
 * Not offered on a phone. A multi-chart workspace on a 375px screen is a
 * wrong-patient generator, so below the breakpoint the stack renders as a
 * single active chart and a switcher — see the stylesheet.
 *
 * Styling lives in `styles/oxygen-workspace.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  WORK_SHORT,
  canClose,
  chartAccent,
  describeChart,
  describeWork,
  moveChart,
  needsIdentifier,
  needsReassertion,
  orderCharts,
  worstWork,
  type CloseVerdict,
  type OpenChart,
} from "../../lib/workspace";

export {
  ACCENT_COUNT,
  REASSERT_AFTER_MS,
  WORK_LABEL,
  WORK_ORDER,
  WORK_SHORT,
  canClose,
  chartAccent,
  describeChart,
  describeWork,
  fnv1a,
  moveChart,
  needsIdentifier,
  needsReassertion,
  orderCharts,
  similarPairs,
  worstWork,
  type CloseVerdict,
  type OpenChart,
  type OutstandingWork,
  type WorkKind,
} from "../../lib/workspace";

/**
 * Two letters, from the display name.
 *
 * Built by slicing rather than by indexing. The indexed version needed two
 * `?? ""` fallbacks that no input could reach — `split` on a trimmed string
 * never yields an empty word — and an unreachable fallback is a branch no
 * honest test can cover.
 */
function initials(display: string): string {
  const letters = display
    .replace(/,.*$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase());

  // First and last for a full name; whatever there is for one word or none.
  return (letters.length > 1 ? [...letters.slice(0, 1), ...letters.slice(-1)] : letters).join("");
}

export interface RecentPatientStackProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "onSelect"
> {
  charts: readonly OpenChart[];
  activeId?: string;
  /** ISO 8601 from the host. Decides whether returning re-asserts identity. */
  now?: string;
  /**
   * Switch to a chart.
   *
   * Called with `reassert: true` when the clinician has been away long enough
   * that the host should confirm the patient before showing the chart. Fifteen
   * minutes is roughly the length of an interruption you do not remember.
   */
  onActivate?: (chart: OpenChart, options: { reassert: boolean }) => void;
  /**
   * Close a chart.
   *
   * Called only when `canClose` returns `close` or the host confirmed a
   * `confirm`. A `refuse` never reaches here.
   */
  onClose?: (chart: OpenChart) => void;
  onPin?: (chart: OpenChart, pinned: boolean) => void;
  /** Keyboard reordering, the equivalent of a drag (WCAG 2.5.7). */
  onReorder?: (charts: OpenChart[]) => void;
  /** Start expanded, showing the panel rather than the avatar row. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function RecentPatientStack({
  charts,
  activeId,
  now,
  onActivate,
  onClose,
  onPin,
  onReorder,
  expanded = false,
  onExpandedChange,
  className,
  ...rest
}: RecentPatientStackProps) {
  const ordered = React.useMemo(() => orderCharts(charts), [charts]);
  const ambiguous = React.useMemo(() => needsIdentifier(charts), [charts]);
  const owed = describeWork(charts, now);

  /**
   * The confirmation a `confirm` verdict opens, and the refusal it never does.
   *
   * Typed to exclude `close`, because a chart that closes never opens a panel —
   * holding the full union here meant the panel carried a `kind === "close"`
   * branch that could not be reached and rendered `null` if it somehow were,
   * which is a dead branch pretending to be a safety net.
   */
  const [pending, setPending] = React.useState<{
    chart: OpenChart;
    verdict: Exclude<CloseVerdict, { kind: "close" }>;
  } | null>(null);

  const tabs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const activate = (chart: OpenChart) => {
    onActivate?.(chart, { reassert: now ? needsReassertion(chart, now) : true });
  };

  const attemptClose = (chart: OpenChart) => {
    const verdict = canClose(chart);
    if (verdict.kind === "close") {
      onClose?.(chart);
      return;
    }
    // Both `confirm` and `refuse` surface the same panel; only one of them
    // offers a way through it.
    setPending({ chart, verdict });
  };

  /**
   * Roving tabindex across the stack, plus the keyboard equivalent of a drag.
   *
   * `Alt` + arrow moves a chart rather than the focus, which is the WCAG 2.5.7
   * requirement: every pointer-drag needs a single-pointer or keyboard path.
   */
  const onKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    // Taken from the row that rendered the handler rather than looked up by
    // index. The lookup needed a `!chart` guard that nothing could reach, and
    // an unreachable guard is a line no test can honestly cover.
    chart: OpenChart,
    index: number,
  ) => {
    if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      onReorder?.(moveChart(ordered, chart.id, event.key === "ArrowDown" ? 1 : -1));
      return;
    }

    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : event.key === "Home"
            ? -index
            : event.key === "End"
              ? ordered.length - 1 - index
              : 0;
    if (!step) return;

    event.preventDefault();
    const next = Math.min(ordered.length - 1, Math.max(0, index + step));
    tabs.current[next]?.focus();
  };

  return (
    <div
      {...rest}
      className={cn("ox-stack", className)}
      data-ox-stack=""
      data-ox-expanded={expanded ? "" : undefined}
    >
      <div className="ox-stack__bar">
        <div
          className="ox-stack__tabs"
          role="tablist"
          aria-label="Open charts"
          aria-orientation={expanded ? "vertical" : "horizontal"}
        >
          {ordered.map((chart, index) => {
            const active = chart.id === activeId;
            const worst = worstWork(chart);
            const showIdentifier = ambiguous.has(chart.id);

            return (
              <button
                key={chart.id}
                type="button"
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                role="tab"
                aria-selected={active}
                // Roving: one stop for the whole stack, arrows within it.
                tabIndex={active || (!activeId && index === 0) ? 0 : -1}
                className="ox-stack__tab"
                data-ox-accent={chartAccent(chart.id)}
                data-ox-active={active ? "" : undefined}
                data-ox-pinned={chart.pinned ? "" : undefined}
                data-ox-work={worst?.kind}
                aria-label={describeChart(chart, { showIdentifier })}
                onClick={() => activate(chart)}
                onKeyDown={(event) => onKeyDown(event, chart, index)}
              >
                <span className="ox-stack__avatar" aria-hidden="true">
                  {initials(chart.display)}
                </span>

                {/*
                  The name is present in every mode. Colour is an accelerant
                  for a reader who already knows the chart, never the thing
                  that identifies it.
                */}
                <span className="ox-stack__who" aria-hidden="true">
                  <span className="ox-stack__name">{chart.display}</span>
                  {/*
                    Two charts whose names look alike both grow an identifier.
                    Marking only the newcomer would leave the reader comparing
                    a row that has one against a row that does not.
                  */}
                  {showIdentifier && chart.identifier ? (
                    <span className="ox-stack__identifier">{chart.identifier}</span>
                  ) : null}
                  {chart.reason ? <span className="ox-stack__reason">{chart.reason}</span> : null}
                </span>

                {worst ? (
                  // One word on the tab; the long form is in the accessible
                  // name and in the panel, where there is room for it.
                  <span className="ox-stack__work" aria-hidden="true">
                    {WORK_SHORT[worst.kind]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="ox-stack__controls">
          {owed ? (
            <span className="ox-stack__owed" aria-hidden="true">
              {owed}
            </span>
          ) : null}
          {onExpandedChange ? (
            <button
              type="button"
              className="ox-stack__expand"
              aria-expanded={expanded}
              onClick={() => onExpandedChange(!expanded)}
            >
              {expanded ? "Collapse charts" : `${charts.length} charts`}
            </button>
          ) : null}
        </div>
      </div>

      {/*
        Per-chart actions live in the expanded panel rather than on the tab.
        A close affordance inside a tab is one mis-tap from losing a draft, and
        the tab is already the target for the thing people mean to do.
      */}
      {expanded ? (
        <ul className="ox-stack__panel">
          {ordered.map((chart) => (
            <li key={chart.id} className="ox-stack__row" data-ox-accent={chartAccent(chart.id)}>
              <span className="ox-stack__row-name">{chart.display}</span>
              {ambiguous.has(chart.id) && chart.identifier ? (
                <span className="ox-stack__identifier">{chart.identifier}</span>
              ) : null}
              {onPin ? (
                <button
                  type="button"
                  className="ox-stack__action"
                  aria-pressed={Boolean(chart.pinned)}
                  onClick={() => onPin(chart, !chart.pinned)}
                >
                  {chart.pinned ? "Unpin" : "Pin"}
                </button>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  className="ox-stack__action"
                  data-ox-close=""
                  onClick={() => attemptClose(chart)}
                >
                  Close {chart.display}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/*
        Confirm and refuse look different because they are different.
        A draft order that vanishes with its tab is an order somebody believes
        they placed, and nothing downstream will show its absence — so it is
        not offered, rather than offered with a warning.
      */}
      {pending ? (
        <div
          className="ox-stack__verdict"
          data-ox-verdict={pending.verdict.kind}
          role="alertdialog"
          aria-label={pending.verdict.kind === "refuse" ? "Cannot close" : "Close this chart?"}
        >
          <p className="ox-stack__verdict-reason">{pending.verdict.reason}</p>
          <div className="ox-stack__verdict-actions">
            {pending.verdict.kind === "confirm" ? (
              <button
                type="button"
                onClick={() => {
                  onClose?.(pending.chart);
                  setPending(null);
                }}
              >
                Close and lose the draft
              </button>
            ) : null}
            <button type="button" onClick={() => setPending(null)}>
              {pending.verdict.kind === "refuse" ? "Back to the chart" : "Keep it open"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

RecentPatientStack.displayName = "RecentPatientStack";

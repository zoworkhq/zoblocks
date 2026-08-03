"use client";

/**
 * ClinicalErrorBoundary — contains a failure so it degrades one section
 * instead of a whole chart.
 *
 * The dangerous case is not a blank screen. It is a chart that renders five of
 * a patient's eight medications, with nothing to indicate the other three
 * failed to load. A blank screen is obviously broken; a partial render looks
 * complete and gets acted on.
 *
 * So this does two jobs:
 *
 *   1. Catches the throw and scopes it to the smallest sensible boundary, with
 *      `critical` boundaries (a patient banner, a code-status display) marked
 *      as such because their absence changes what the reader can safely
 *      conclude from everything around them.
 *   2. Refuses to be silent. There is no "render nothing and move on" path.
 *
 * PHI never leaves in a report. React error messages routinely contain props,
 * and props here are patient data, so the report carries a reference id and a
 * component name and nothing else. The full error stays in the browser.
 */

import * as React from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorReport {
  /** Short id the user can quote to support. Not a stack trace. */
  reference: string;
  /** Which boundary caught it. Never the props it caught it with. */
  boundary: string;
  message: string;
  componentStack?: string;
}

export interface ClinicalErrorBoundaryProps {
  /** Section name, used in the message. "Medications", not "MedListView". */
  label: string;
  /**
   * Marks a boundary whose failure invalidates the surrounding screen — the
   * patient banner, code status, an allergy list. These say so loudly.
   */
  critical?: boolean;
  /**
   * Reported without PHI. React error messages routinely embed props, and
   * props here are patient data, so only the reference and boundary are sent.
   */
  onError?: (report: ErrorReport) => void;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
}

interface State {
  error: Error | null;
  reference: string | null;
}

/**
 * Deterministic-enough reference id without pulling in a uuid dependency.
 * This identifies a report to support; it is not a security token.
 */
function makeReference(): string {
  return `OX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export class ClinicalErrorBoundary extends React.Component<ClinicalErrorBoundaryProps, State> {
  override state: State = { error: null, reference: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, reference: makeReference() };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    const reference = this.state.reference ?? makeReference();
    // Deliberately narrow: message and component stack only. The props that
    // caused the throw are patient data and do not leave the browser.
    this.props.onError?.({
      reference,
      boundary: this.props.label,
      message: error.message,
      componentStack: info.componentStack ?? undefined,
    });
  }

  reset = () => {
    this.setState({ error: null, reference: null });
    this.props.onRetry?.();
  };

  override render() {
    const { error, reference } = this.state;
    const { label, critical = false, children, className } = this.props;

    if (!error) return <>{children}</>;

    return (
      <div
        // Assertive: a failed section changes what the reader can conclude
        // from the screen, so it interrupts rather than waits to be noticed.
        role="alert"
        className={cn(
          "flex flex-col items-start gap-2 rounded-[var(--ox-radius)] border px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
          critical
            ? "border-[var(--ox-status-critical)] bg-[var(--ox-status-critical-bg)]"
            : "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)]",
          className,
        )}
      >
        <p
          className={cn(
            "flex items-center gap-1.5 text-[length:var(--ox-text-sm)] font-semibold",
            critical ? "text-[var(--ox-status-critical)]" : "text-[var(--ox-status-high)]",
          )}
        >
          <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
          {label} could not be displayed
        </p>

        <p className="text-[length:var(--ox-text-xs)] leading-relaxed text-[var(--ox-text-muted)]">
          {critical ? (
            <>
              This section is part of the patient context. Do not act on the rest of this screen
              until it loads — reopen the chart or contact support.
            </>
          ) : (
            <>
              This section is incomplete. Nothing here should be read as a complete record, and
              other sections on this screen are unaffected.
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={this.reset}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--ox-radius-sm)] border px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold hover:bg-[var(--ox-surface)]",
              critical
                ? "border-[var(--ox-status-critical)] text-[var(--ox-status-critical)]"
                : "border-[var(--ox-status-high)] text-[var(--ox-status-high)]",
            )}
          >
            <RotateCw aria-hidden="true" className="size-3" />
            Try again
          </button>

          {/* Quotable to support, and safe to read aloud on a ward. */}
          {reference && (
            <span className="font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
              Reference {reference}
            </span>
          )}
        </div>
      </div>
    );
  }
}

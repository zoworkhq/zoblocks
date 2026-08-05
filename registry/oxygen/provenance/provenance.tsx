"use client";

/**
 * ProvenanceTag — who recorded this, when, from where, and has it changed.
 *
 * Clinicians discount data they cannot source, and an amended result that
 * looks identical to the original is a known harm pathway. Both problems are
 * solved by the same disclosure.
 *
 * Three distinctions the component refuses to flatten:
 *
 *   1. When it happened vs when it was written. A dose given at 08:00 and
 *      charted at 11:20 is two facts.
 *   2. Who observed it vs what typed it. Patient-reported, device-recorded,
 *      and clinician-entered data carry different weight, and an interface
 *      feed is not a person.
 *   3. Present vs absent provenance. "Source not recorded" is stated plainly
 *      rather than papered over with a plausible-looking default, because a
 *      confident wrong attribution is worse than an honest gap.
 *
 * Amendment is surfaced on the trigger itself, not only inside the popover —
 * a correction nobody opens is a correction nobody saw.
 */

import * as React from "react";
import { History, Info, PencilLine } from "lucide-react";
import {
  ENTRY_METHOD_LABEL,
  formatClinicalDate,
  summariseProvenance,
  type Provenance,
  type Resource,
} from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

export interface ProvenanceTagProps {
  provenance?: Provenance;
  /** The resource itself, read for meta.versionId and meta.lastUpdated. */
  resource?: Resource;
  /** IANA zone. Required for the same reason it is on ClinicalTime. */
  timeZone: string;
  locale?: string;
  /** What this provenance describes, e.g. "Potassium 6.8 mmol/L". */
  subject?: string;
  /** Render the attribution inline as text instead of behind a disclosure. */
  inline?: boolean;
  className?: string;
}

export function ProvenanceTag({
  provenance,
  resource,
  timeZone,
  locale,
  subject,
  inline = false,
  className,
}: ProvenanceTagProps) {
  const [open, setOpen] = React.useState(false);
  const summary = summariseProvenance(provenance, resource);

  const recorded = formatClinicalDate(summary.recordedAt, timeZone, locale);
  const occurred = formatClinicalDate(summary.occurredAt, timeZone, locale);
  const chartedLate = Boolean(occurred && recorded && summary.occurredAt !== summary.recordedAt);

  const rows: Array<[string, string]> = [
    ["Recorded by", summary.author ?? "Not recorded"],
    ["Entry method", ENTRY_METHOD_LABEL[summary.method]],
    ["Event time", occurred ?? "Not recorded"],
    ["Recorded at", recorded ?? "Not recorded"],
    ["Source system", summary.source ?? "Not recorded"],
    ["Version", summary.versionId ?? "Not recorded"],
  ];

  if (inline) {
    return (
      <p className={cn("text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]", className)}>
        {summary.author ?? "Source not recorded"}
        {recorded ? ` · ${recorded}` : ""}
        {summary.amended ? " · amended" : ""}
      </p>
    );
  }

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.stopPropagation();
            setOpen(false);
          }
        }}
        // A bare icon is not a label. The accessible name says what the button
        // reveals and about what.
        aria-label={
          summary.amended
            ? `Provenance and amendment history${subject ? ` for ${subject}` : ""}`
            : `Provenance${subject ? ` for ${subject}` : ""}`
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-[var(--ox-radius-sm)] border px-1.5 py-0.5",
          "text-[length:var(--ox-text-2xs)] font-semibold",
          summary.amended
            ? "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]"
            : "border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] text-[var(--ox-text-subtle)]",
        )}
      >
        {summary.amended ? (
          <>
            <PencilLine aria-hidden="true" className="size-3" />
            Amended
          </>
        ) : (
          <Info aria-hidden="true" className="size-3" />
        )}
      </button>

      {open && (
        <span
          role="group"
          aria-label={`Provenance${subject ? ` for ${subject}` : ""}`}
          className="absolute left-0 top-full z-20 mt-1 w-72 rounded-[var(--ox-radius)] border border-[var(--ox-border)] bg-[var(--ox-surface-overlay)] p-2.5 text-left shadow-[var(--ox-shadow-md)]"
        >
          {summary.amended && (
            <span className="mb-2 flex items-start gap-1.5 rounded-[var(--ox-radius-sm)] bg-[var(--ox-status-high-bg)] px-2 py-1.5 text-[length:var(--ox-text-xs)] text-[var(--ox-status-high)]">
              <History aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This record was changed after it was first released. The original value is retained
                in the audit trail.
              </span>
            </span>
          )}

          <dl className="flex flex-col gap-1">
            {rows.map(([term, detail]) => (
              <span key={term} className="flex items-baseline justify-between gap-3">
                <dt className="text-[length:var(--ox-text-2xs)] uppercase tracking-wider text-[var(--ox-text-subtle)]">
                  {term}
                </dt>
                <dd
                  className={cn(
                    "text-right text-[length:var(--ox-text-xs)]",
                    detail === "Not recorded"
                      ? "text-[var(--ox-text-subtle)]"
                      : "text-[var(--ox-text)]",
                  )}
                >
                  {detail}
                </dd>
              </span>
            ))}
          </dl>

          {/* Event time and charting time differing is normal and worth
              stating, not an anomaly to hide. */}
          {chartedLate && (
            <p className="mt-2 border-t border-[var(--ox-border)] pt-2 text-[length:var(--ox-text-2xs)] text-[var(--ox-text-muted)]">
              Charted after the event. Both times are shown because they are different facts.
            </p>
          )}
        </span>
      )}
    </span>
  );
}

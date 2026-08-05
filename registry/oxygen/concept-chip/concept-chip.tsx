"use client";

/**
 * ConceptChip — a coded clinical concept with its coding reachable on demand.
 *
 * Clinicians read display text. Integrations, audits, and anyone debugging a
 * mapping need the code. Hiding the coding entirely makes data problems
 * undiagnosable; showing it inline makes every list unreadable. So it lives
 * one interaction away.
 *
 * The useful behaviour is the honesty about what is missing:
 *
 *   - Text with no coding at all is extremely common and is marked as such,
 *     because an uncoded concept cannot drive a rule or a report.
 *   - A code from a system we do not recognise is shown with its raw system
 *     URI rather than silently rendered as though it were standard.
 *   - When an expected value set is supplied, a concept outside it is flagged.
 *     That flag is how bad mappings become visible instead of accumulating.
 */

import * as React from "react";
import { CircleAlert, Tag } from "lucide-react";
import { codeableText, terminologyName, type CodeableConcept } from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

export interface ConceptChipProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  concept?: CodeableConcept;
  /**
   * Codes the concept is expected to carry, as "system|code" or bare "code".
   * A concept outside this set is flagged rather than silently accepted.
   */
  expectedCodes?: string[];
  /** Show the terminology name inline, e.g. "SNOMED CT · Hypertension". */
  showSystem?: boolean;
  /** Render as plain text with no disclosure. For dense grids. */
  readOnly?: boolean;
  size?: "sm" | "md";
  /** Field name for the accessible name when the chip stands alone. */
  field?: string;
}

export function ConceptChip({
  concept,
  expectedCodes,
  showSystem = false,
  readOnly = false,
  size = "sm",
  field,
  className,
  ...props
}: ConceptChipProps) {
  const [open, setOpen] = React.useState(false);
  const text = codeableText(concept);
  const codings = concept?.coding ?? [];

  // Absence is a state here too — an uncoded, untexted concept is not blank.
  if (!text) {
    return (
      <span
        className={cn("text-[length:var(--ox-text-sm)] text-[var(--ox-text-subtle)]", className)}
      >
        No concept recorded
      </span>
    );
  }

  const primary = codings.find((c) => c.userSelected) ?? codings[0];
  const systemName = primary?.system ? terminologyName(primary.system) : undefined;
  const uncoded = codings.length === 0;

  const outsideValueSet =
    expectedCodes?.length && codings.length
      ? !codings.some((c) =>
          expectedCodes.some((expected) =>
            expected.includes("|") ? expected === `${c.system}|${c.code}` : expected === c.code,
          ),
        )
      : false;

  const spoken = [
    field,
    text,
    uncoded ? "no code recorded" : undefined,
    outsideValueSet ? "outside the expected value set" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  const body = (
    <>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="truncate">
        {showSystem && systemName && (
          <span className="mr-1 font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
            {systemName}
          </span>
        )}
        {text}
      </span>
      {uncoded && (
        <span
          aria-hidden="true"
          title="Text only — no code recorded"
          className="font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]"
        >
          text
        </span>
      )}
      {outsideValueSet && (
        <CircleAlert aria-hidden="true" className="size-3.5 text-[var(--ox-status-high)]" />
      )}
    </>
  );

  const shell = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-[var(--ox-radius-sm)] border px-1.5 py-0.5",
    size === "sm" ? "text-[length:var(--ox-text-sm)]" : "text-[length:var(--ox-density-font)]",
    outsideValueSet
      ? "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)]"
      : "border-[var(--ox-border)] bg-[var(--ox-bg-subtle)]",
    className,
  );

  if (readOnly || uncoded) {
    return (
      <span className={shell} {...(props as React.HTMLAttributes<HTMLSpanElement>)}>
        {body}
      </span>
    );
  }

  return (
    <span className="relative inline-flex max-w-full">
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
        className={cn(shell, "cursor-pointer hover:border-[var(--ox-border-strong)]")}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {body}
        <Tag aria-hidden="true" className="size-3 shrink-0 text-[var(--ox-text-subtle)]" />
      </button>

      {open && (
        <span
          role="group"
          aria-label={`Codings for ${text}`}
          className="absolute left-0 top-full z-20 mt-1 min-w-64 rounded-[var(--ox-radius)] border border-[var(--ox-border)] bg-[var(--ox-surface-overlay)] p-2 shadow-[var(--ox-shadow-md)]"
        >
          {codings.map((coding, index) => (
            <span
              key={`${coding.system ?? "?"}-${coding.code ?? index}`}
              className="flex flex-col gap-0.5 border-b border-[var(--ox-border)] py-1.5 last:border-b-0"
            >
              <span className="flex items-center gap-2 font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-xs)]">
                <span className="font-semibold text-[var(--ox-text)]">{coding.code ?? "—"}</span>
                {coding.userSelected && (
                  <span className="text-[length:var(--ox-text-2xs)] text-[var(--ox-accent)]">
                    user selected
                  </span>
                )}
              </span>
              <span className="text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
                {coding.display ?? "No display text"}
              </span>
              {/* An unrecognised system shows its URI. Echoing the URI as a
                  friendly name would hide exactly the mapping problem worth
                  seeing. */}
              <span className="break-all font-[family-name:var(--ox-font-mono)] text-[length:var(--ox-text-2xs)] text-[var(--ox-text-subtle)]">
                {terminologyName(coding.system) ?? coding.system ?? "No system"}
                {coding.version ? ` · v${coding.version}` : ""}
              </span>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

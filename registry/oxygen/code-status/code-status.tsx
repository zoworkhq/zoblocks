"use client";

/**
 * CodeStatus — resuscitation status, advance directives, and healthcare proxy.
 *
 * This is the highest-consequence display in the library. A DNR order that is
 * not visible during a code is a catastrophic failure of information design,
 * and the failure mode is never a crash — it is a directive that was on file,
 * one click away, and nobody found it in eleven seconds.
 *
 * The rules follow from that:
 *
 *   1. Unknown is a state, and it is loud. There is no default to full code:
 *      assuming resuscitation because nothing was found is a clinical decision
 *      being made by a rendering fallback.
 *   2. Verification age is part of the status. A directive verified two
 *      admissions ago is not the same claim as one verified this morning.
 *   3. Conflicts are surfaced, never resolved. Two directives from different
 *      dates or organisations is a question for a human, and picking the newer
 *      one silently is the library deciding something it must not decide.
 *
 * Contrast, size, and reading order here are treated as safety requirements
 * rather than aesthetic ones.
 */

import * as React from "react";
import { FileText, Phone, ShieldQuestion, TriangleAlert } from "lucide-react";
import { formatClinicalDate, type RelatedPerson } from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

export type ResuscitationStatus =
  "full-code" | "dnr" | "dnr-dni" | "comfort-only" | "limited" | "unknown";

export interface CodeStatusProps {
  status?: ResuscitationStatus;
  /** When the status was last verified, and by whom. */
  verifiedAt?: string;
  verifiedBy?: string;
  /** Days after which verification is considered stale by local policy. */
  staleAfterDays?: number;
  timeZone: string;
  locale?: string;
  /** Directive documents on file. Linked, not merely referenced. */
  documents?: Array<{ id: string; title: string; onOpen?: () => void }>;
  /** Healthcare proxy, with a contact route that works during an arrest. */
  proxy?: RelatedPerson;
  proxyPhone?: string;
  /**
   * More than one directive is on file and they do not agree. Surfaced as a
   * question, never resolved by picking the newer one.
   */
  conflicting?: boolean;
  asOf?: Date;
  className?: string;
}

/**
 * Written out in full — a class assembled from `status` produces no CSS, and
 * an unstyled code-status banner is the exact failure this component exists
 * to prevent.
 */
const STATUS_CLASS: Record<ResuscitationStatus, string> = {
  "full-code":
    "border-[var(--ox-status-normal-border)] bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)]",
  dnr: "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  "dnr-dni":
    "border-[var(--ox-status-critical-border)] bg-[var(--ox-status-critical-bg)] text-[var(--ox-status-critical)]",
  "comfort-only":
    "border-[#ddd6fe] bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)]",
  limited:
    "border-[var(--ox-status-high-border)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
  unknown:
    "border-[var(--ox-status-high)] bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)]",
};

const STATUS_LABEL: Record<ResuscitationStatus, string> = {
  "full-code": "Full code",
  dnr: "DNR — do not resuscitate",
  "dnr-dni": "DNR / DNI — do not resuscitate or intubate",
  "comfort-only": "Comfort measures only",
  limited: "Limited interventions",
  unknown: "Code status not on file",
};

export function CodeStatus({
  status = "unknown",
  verifiedAt,
  verifiedBy,
  staleAfterDays = 30,
  timeZone,
  locale,
  documents,
  proxy,
  proxyPhone,
  conflicting = false,
  asOf = new Date(),
  className,
}: CodeStatusProps) {
  const verified = formatClinicalDate(verifiedAt, timeZone, locale);

  const verifiedDate = verifiedAt ? new Date(verifiedAt) : undefined;
  const ageDays =
    verifiedDate && !Number.isNaN(verifiedDate.getTime())
      ? Math.floor((asOf.getTime() - verifiedDate.getTime()) / 86_400_000)
      : undefined;
  const stale = ageDays !== undefined && ageDays > staleAfterDays;

  const proxyName = proxy?.name?.[0]?.text ?? proxy?.name?.[0]?.family;
  const proxyRelationship = proxy?.relationship?.[0]?.text;

  return (
    <section
      aria-label="Code status and advance directives"
      className={cn(
        "rounded-[var(--ox-radius)] border-2 px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        STATUS_CLASS[status],
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {status === "unknown" ? (
          <ShieldQuestion aria-hidden="true" className="size-5 shrink-0 self-center" />
        ) : null}
        {/* First in the reading order of any summary that contains it. */}
        <h2 className="text-[length:var(--ox-text-lg)] font-bold leading-tight">
          {STATUS_LABEL[status]}
        </h2>

        {verified ? (
          <p className="font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-xs)] tabular-nums opacity-90">
            Verified {verified}
            {verifiedBy ? ` · ${verifiedBy}` : ""}
          </p>
        ) : (
          status !== "unknown" && (
            <p className="text-[length:var(--ox-text-xs)] font-semibold">
              Not verified this admission
            </p>
          )
        )}
      </div>

      {/* An absent directive is not a full code. Say what is actually true. */}
      {status === "unknown" && (
        <p className="mt-1.5 text-[length:var(--ox-text-sm)] leading-relaxed">
          No directive has been found for this patient. This is not a full-code order — establish
          and record the patient&rsquo;s wishes.
        </p>
      )}

      {stale && status !== "unknown" && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[length:var(--ox-text-xs)] font-semibold">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          Last verified {ageDays} days ago, past the {staleAfterDays}-day policy window. Re-confirm.
        </p>
      )}

      {/* Surfaced as a question. Resolving it silently is not this
          component's decision to make. */}
      {conflicting && (
        <p
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 rounded-[var(--ox-radius-sm)] bg-[var(--ox-surface)] px-2 py-1.5 text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-status-critical)]"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          More than one directive is on file and they do not agree. Review both before acting — the
          most recent has not been assumed to win.
        </p>
      )}

      {(documents?.length || proxyName) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-current/20 pt-2">
          {documents?.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={doc.onOpen}
              className="inline-flex items-center gap-1.5 rounded-[var(--ox-radius-sm)] border border-current bg-[var(--ox-surface)] px-2 py-1 text-[length:var(--ox-text-xs)] font-semibold"
            >
              <FileText aria-hidden="true" className="size-3.5" />
              {doc.title}
            </button>
          ))}

          {proxyName && (
            <span className="inline-flex items-center gap-1.5 text-[length:var(--ox-text-xs)]">
              <span className="font-semibold">Proxy:</span>
              {proxyName}
              {proxyRelationship ? ` (${proxyRelationship})` : ""}
              {proxyPhone && (
                // A tel: link, not a copyable string — this gets used during
                // an arrest, one-handed.
                <a
                  href={`tel:${proxyPhone}`}
                  className="inline-flex items-center gap-1 rounded-[var(--ox-radius-sm)] border border-current px-1.5 py-0.5 font-semibold no-underline"
                >
                  <Phone aria-hidden="true" className="size-3" />
                  {proxyPhone}
                </a>
              )}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

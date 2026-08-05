"use client";

/**
 * AllergyList — known allergies and intolerances from FHIR AllergyIntolerance.
 *
 * The decision that matters most here is what an empty list means.
 *
 * "No allergies recorded" and "no known allergies" are different clinical
 * facts. The first means nobody has asked. The second means someone asked and
 * documented the answer. Rendering them identically tells a clinician the
 * patient is safe when the truth is that the question was never put — so this
 * component refuses to guess, and `noKnownAllergies` must be passed explicitly.
 */

import * as React from "react";
import { CircleHelp, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  clinicalStatusCode,
  codeableText,
  reactionManifestations,
  verificationStatusCode,
  worstReactionSeverity,
  type AllergyIntolerance,
} from "@oxygenui-design/fhir";
import { StatusBadge, type StatusTone } from "@/components/oxygen/status-badge";
import { cn } from "@/lib/utils";

function criticalityPresentation(allergy: AllergyIntolerance): {
  label: string;
  tone: StatusTone;
} {
  // Criticality is the risk of a *future* severe reaction, which is the field
  // that should drive prescribing caution. Reaction severity describes what
  // already happened. When criticality is absent we fall back to observed
  // severity rather than inventing a risk assessment.
  if (allergy.criticality === "high") return { label: "High risk", tone: "critical" };
  if (allergy.criticality === "low") return { label: "Low risk", tone: "normal" };

  const severity = worstReactionSeverity(allergy);
  if (severity === "severe") return { label: "Severe reaction", tone: "critical" };
  if (severity === "moderate") return { label: "Moderate reaction", tone: "high" };
  if (severity === "mild") return { label: "Mild reaction", tone: "normal" };

  return { label: "Risk not assessed", tone: "unknown" };
}

export interface AllergyListProps extends React.HTMLAttributes<HTMLDivElement> {
  allergies: AllergyIntolerance[] | undefined;
  /**
   * Pass `true` only when a no-known-allergies assertion is actually recorded.
   * Leaving this undefined with an empty list renders "not recorded", which is
   * the safe reading — never assume silence means none.
   */
  noKnownAllergies?: boolean;
  /** Hide entries whose clinical status is inactive or resolved. */
  hideInactive?: boolean;
  loading?: boolean;
  label?: string;
}

export function AllergyList({
  allergies,
  noKnownAllergies,
  hideInactive = false,
  loading = false,
  label = "Allergies and intolerances",
  className,
  ...props
}: AllergyListProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading allergies"
        className={cn(
          "space-y-2 rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)] p-[var(--ox-density-pad-x)]",
          className,
        )}
        {...props}
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        ))}
        <span className="sr-only">Loading allergies</span>
      </div>
    );
  }

  const visible = hideInactive
    ? allergies?.filter((a) => {
        const status = clinicalStatusCode(a);
        return status !== "inactive" && status !== "resolved";
      })
    : allergies;

  if (!visible?.length) {
    return (
      <div
        role="region"
        aria-label={label}
        className={cn(
          "rounded-[var(--ox-radius-lg)] border px-5 py-6 text-center",
          noKnownAllergies
            ? "border-[var(--ox-status-normal-border)] bg-[var(--ox-status-normal-bg)]"
            : "border-dashed border-[var(--ox-border-strong)] bg-[var(--ox-bg-subtle)]",
          className,
        )}
        {...props}
      >
        {noKnownAllergies ? (
          <p className="flex items-center justify-center gap-2 font-semibold text-[var(--ox-status-normal)]">
            <ShieldCheck aria-hidden="true" className="size-4" />
            No known allergies
          </p>
        ) : (
          <p className="flex items-center justify-center gap-2 text-[var(--ox-text-muted)]">
            <CircleHelp aria-hidden="true" className="size-4 text-[var(--ox-status-unknown)]" />
            Allergies not recorded
          </p>
        )}
        <p className="mt-1 text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]">
          {noKnownAllergies
            ? "Recorded by a clinician."
            : "No allergy history has been documented for this patient."}
        </p>
      </div>
    );
  }

  const highRisk = visible.filter((a) => criticalityPresentation(a).tone === "critical").length;

  return (
    <div
      role="region"
      aria-label={label}
      className={cn(
        "divide-y divide-[var(--ox-border)] overflow-hidden rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        className,
      )}
      {...props}
    >
      {highRisk > 0 && (
        <p className="sr-only" role="status">
          {highRisk} high-risk {highRisk === 1 ? "allergy" : "allergies"} recorded.
        </p>
      )}

      {visible.map((allergy, index) => (
        <AllergyRow key={allergy.id ?? index} allergy={allergy} />
      ))}
    </div>
  );
}

function AllergyRow({ allergy }: { allergy: AllergyIntolerance }) {
  const presentation = criticalityPresentation(allergy);
  const substance = codeableText(allergy.code);
  const manifestations = reactionManifestations(allergy);
  const verification = verificationStatusCode(allergy);
  const clinical = clinicalStatusCode(allergy);
  const isInactive = clinical === "inactive" || clinical === "resolved";
  const isRefuted = verification === "refuted";
  const isUnconfirmed = verification === "unconfirmed";

  return (
    <div
      data-criticality={allergy.criticality ?? "unknown"}
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)]",
        presentation.tone === "critical" &&
          !isRefuted &&
          "bg-[var(--ox-status-critical-bg)] shadow-[inset_3px_0_0_0_var(--ox-status-critical)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {presentation.tone === "critical" && !isRefuted && (
            <TriangleAlert
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--ox-status-critical)]"
            />
          )}
          <span
            className={cn(
              "font-semibold text-[var(--ox-text)]",
              (isInactive || isRefuted) && "text-[var(--ox-text-muted)]",
            )}
          >
            {substance ?? (
              <span className="font-normal italic text-[var(--ox-text-muted)]">
                Substance not recorded
              </span>
            )}
          </span>

          {allergy.type && (
            <span className="text-[length:var(--ox-text-xs)] uppercase tracking-wide text-[var(--ox-text-subtle)]">
              {allergy.type}
            </span>
          )}
        </div>

        {manifestations.length > 0 ? (
          <p className="mt-0.5 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
            {manifestations.join(", ")}
          </p>
        ) : (
          <p className="mt-0.5 text-[length:var(--ox-text-sm)] italic text-[var(--ox-text-subtle)]">
            No reaction documented
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {/* An unconfirmed or refuted allergy must never look like a
              confirmed one — clinicians de-prescribe on this distinction. */}
          {isRefuted && <StatusBadge tone="neutral">Refuted</StatusBadge>}
          {isUnconfirmed && <StatusBadge tone="unknown">Unconfirmed</StatusBadge>}
          {isInactive && (
            <StatusBadge tone="neutral">
              {clinical === "resolved" ? "Resolved" : "Inactive"}
            </StatusBadge>
          )}
        </div>
      </div>

      <StatusBadge tone={isRefuted ? "neutral" : presentation.tone} className="shrink-0">
        {presentation.label}
      </StatusBadge>
    </div>
  );
}

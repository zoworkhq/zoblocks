"use client";

/**
 * PatientBanner — the persistent identity header on a clinical screen.
 *
 * Takes a FHIR R4 `Patient` directly. No adapter, no mapping layer.
 *
 * Wrong-patient error is one of the highest-consequence failures in clinical
 * software, so this component is deliberately conservative:
 *
 *   - It never invents a name. An unnamed patient reads "Name not recorded",
 *     never "Unknown Patient" or a blank space that looks like a loading state.
 *   - Deceased and restricted status are announced to assistive technology,
 *     not conveyed by styling alone.
 *   - Identifiers can be masked for shared or public-facing screens.
 *
 * Access control is the caller's responsibility. `restricted` changes what is
 * displayed; it does not prevent the data reaching the browser.
 */

import * as React from "react";
import { Lock, ShieldAlert, TriangleAlert } from "lucide-react";
import {
  calculateAge,
  getIdentifier,
  isDeceased,
  isRestricted,
  maskIdentifier,
  resolvePatientName,
  type Patient,
} from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

export interface PatientBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** FHIR R4 Patient resource. */
  patient: Patient | undefined;
  /** Identifier system to display, e.g. your MRN system. Defaults to the official identifier. */
  identifierSystem?: string;
  /** Label shown before the identifier. */
  identifierLabel?: string;
  /** Mask all but the last four characters. Use on shared or public screens. */
  maskIdentifiers?: boolean;
  /**
   * Force the restricted presentation. When omitted, derived from
   * `meta.security` confidentiality labels on the resource.
   */
  restricted?: boolean;
  /** Renders the skeleton state. */
  loading?: boolean;
  /** Date used to compute age. Pass a fixed date to keep tests deterministic. */
  asOf?: Date;
  /** Trailing slot for actions — encounter switcher, chart menu, alerts. */
  actions?: React.ReactNode;
  /**
   * Heading level for the patient name. Defaults to 2, which suits a banner at
   * the top of a page.
   *
   * Set it when the banner is nested — several banners on one page at h2 each
   * inject a sibling into the document outline, and screen-reader users
   * navigate by that outline. Match the level to where the banner actually
   * sits, not to how large you want the text.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function PatientBanner({
  patient,
  identifierSystem,
  identifierLabel = "MRN",
  maskIdentifiers = false,
  restricted,
  loading = false,
  asOf,
  actions,
  headingLevel = 2,
  className,
  ...props
}: PatientBannerProps) {
  const Heading = `h${headingLevel}` as const;
  if (loading) {
    return <PatientBannerSkeleton className={className} {...props} />;
  }

  const isRestrictedRecord = restricted ?? isRestricted(patient);
  const name = resolvePatientName(patient, "official");
  const identifier = getIdentifier(patient, identifierSystem);
  const rawIdentifierValue = identifier?.value;
  const identifierValue = maskIdentifiers ? maskIdentifier(rawIdentifierValue) : rawIdentifierValue;
  const age = calculateAge(patient?.birthDate, asOf);
  const deceased = isDeceased(patient);

  return (
    <div
      // A banner landmark keeps the patient context reachable at any point in
      // the screen — screen reader users should never have to hunt for who
      // the chart belongs to.
      role="region"
      aria-label="Patient identity"
      data-restricted={isRestrictedRecord || undefined}
      data-deceased={deceased || undefined}
      className={cn(
        "flex flex-wrap items-center gap-x-[var(--ox-density-gap)] gap-y-2",
        "rounded-[var(--ox-radius-lg)] border bg-[var(--ox-surface)]",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        "text-[length:var(--ox-density-font)] text-[var(--ox-text)]",
        deceased ? "border-[var(--ox-border-strong)]" : "border-[var(--ox-border)]",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="truncate text-[length:var(--ox-text-lg)] font-semibold tracking-tight">
            {name ?? (
              <span className="font-normal italic text-[var(--ox-text-muted)]">
                Name not recorded
              </span>
            )}
          </Heading>

          {deceased && (
            <Flag icon={<TriangleAlert aria-hidden="true" className="size-3.5" />} tone="deceased">
              Deceased
            </Flag>
          )}

          {isRestrictedRecord && (
            <Flag icon={<ShieldAlert aria-hidden="true" className="size-3.5" />} tone="restricted">
              Restricted record
            </Flag>
          )}
        </div>

        <dl className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[length:var(--ox-text-sm)] text-[var(--ox-text-muted)]">
          <Field label={identifierLabel}>
            {identifierValue ? (
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                {identifierValue}
                {maskIdentifiers && rawIdentifierValue && (
                  <>
                    <Lock aria-hidden="true" className="ml-1 inline size-3 align-[-1px]" />
                    <span className="sr-only">
                      {" "}
                      (masked, ending {rawIdentifierValue.slice(-4)})
                    </span>
                  </>
                )}
              </span>
            ) : (
              <NotRecorded />
            )}
          </Field>

          <Field label="DOB">
            {patient?.birthDate ? (
              <span className="font-[family-name:var(--ox-font-numeric)] tabular-nums">
                {patient.birthDate}
                {age !== undefined && (
                  <span className="text-[var(--ox-text-subtle)]"> ({age}y)</span>
                )}
              </span>
            ) : (
              <NotRecorded />
            )}
          </Field>

          <Field label="Sex">
            {patient?.gender && patient.gender !== "unknown" ? (
              <span className="capitalize">{patient.gender}</span>
            ) : (
              <NotRecorded />
            )}
          </Field>
        </dl>
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[length:var(--ox-text-xs)] font-medium uppercase tracking-wide text-[var(--ox-text-subtle)]">
        {label}
      </dt>
      <dd className="text-[var(--ox-text)]">{children}</dd>
    </div>
  );
}

/**
 * Absent data reads as explicitly absent. An empty cell is indistinguishable
 * from a rendering failure, and in a chart that ambiguity is dangerous.
 */
function NotRecorded() {
  return <span className="italic text-[var(--ox-text-subtle)]">Not recorded</span>;
}

function Flag({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: "deceased" | "restricted";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--ox-radius-full)] border px-2 py-0.5",
        "text-[length:var(--ox-text-xs)] font-semibold",
        tone === "restricted"
          ? "border-transparent bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)]"
          : "border-[var(--ox-border-strong)] bg-[var(--ox-bg-muted)] text-[var(--ox-flag-deceased)]",
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function PatientBannerSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading patient"
      className={cn(
        "rounded-[var(--ox-radius-lg)] border border-[var(--ox-border)] bg-[var(--ox-surface)]",
        "px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]",
        className,
      )}
      {...props}
    >
      <div className="h-5 w-48 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
      <div className="mt-2 flex gap-4">
        <div className="h-3.5 w-28 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <div className="h-3.5 w-32 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
        <div className="h-3.5 w-20 animate-pulse rounded bg-[var(--ox-bg-muted)]" />
      </div>
      <span className="sr-only">Loading patient details</span>
    </div>
  );
}

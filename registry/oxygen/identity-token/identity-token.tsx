"use client";

/**
 * IdentityToken — a compact, privacy-aware representation of a person.
 *
 * Wrong-patient error begins with an identity affordance that looked close
 * enough, so this component is built around confirming rather than merely
 * labelling:
 *
 *   - A photo renders only when consent is explicitly stated. Absent the flag,
 *     initials. Consent is not assumed from the presence of a photo.
 *   - A secondary identifier is configurable and shown by default, because a
 *     name alone does not distinguish two people called J. Patel.
 *   - Deceased and restricted are permanent facts about the record and are
 *     rendered as text, not as an icon a reader has to know.
 *
 * Initials and colour are derived from the characters of the name only.
 * Nothing here infers anything demographic — an avatar is not a classifier.
 */

import * as React from "react";
import { Lock, ShieldAlert } from "lucide-react";
import {
  formatAge,
  isDeceased,
  isRestricted,
  maskIdentifier,
  nameInitials,
  resolvePatientName,
  getIdentifier,
  type Patient,
} from "@oxygenui/fhir";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: { box: "size-7 text-[length:var(--ox-text-2xs)]", name: "text-[length:var(--ox-text-sm)]" },
  md: {
    box: "size-9 text-[length:var(--ox-text-xs)]",
    name: "text-[length:var(--ox-density-font)]",
  },
  lg: { box: "size-11 text-[length:var(--ox-text-sm)]", name: "text-[length:var(--ox-text-lg)]" },
} as const;

/**
 * Six neutral swatches. Written out in full because Tailwind cannot see a
 * class assembled from a variable, and a colourless avatar is a broken one.
 *
 * These are decorative only — never the sole carrier of identity, and never
 * mapped to anything about the person.
 */
const SWATCH = [
  "bg-[var(--ox-brand-50)] text-[var(--ox-brand-800)] border-[var(--ox-brand-200)]",
  "bg-[var(--ox-slate-100)] text-[var(--ox-slate-700)] border-[var(--ox-slate-300)]",
  "bg-[var(--ox-status-low-bg)] text-[var(--ox-status-low)] border-[var(--ox-status-low-border)]",
  "bg-[var(--ox-status-normal-bg)] text-[var(--ox-status-normal)] border-[var(--ox-status-normal-border)]",
  "bg-[var(--ox-status-high-bg)] text-[var(--ox-status-high)] border-[var(--ox-status-high-border)]",
  "bg-[var(--ox-flag-restricted-bg)] text-[var(--ox-flag-restricted)] border-[#ddd6fe]",
];

/** Stable index from the name's characters. Same name, same swatch, always. */
function swatchFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return SWATCH[hash % SWATCH.length]!;
}

export interface IdentityTokenProps extends React.HTMLAttributes<HTMLDivElement> {
  patient?: Patient;
  /** Identifier system to display, e.g. your MRN system. */
  identifierSystem?: string;
  identifierLabel?: string;
  /** Mask all but the last four characters. For shared and public screens. */
  maskIdentifiers?: boolean;
  /**
   * Show the patient's photo. Requires an explicit assertion that the patient
   * consented to it being displayed — the component will not infer consent
   * from the photo simply being present in the resource.
   */
  photoConsent?: boolean;
  size?: keyof typeof SIZE;
  /** Avatar only. The name still reaches assistive technology. */
  avatarOnly?: boolean;
  /** Show age and secondary identifier under the name. */
  showDetail?: boolean;
  /**
   * Another patient in the same view whose name is confusingly similar.
   * Renders an explicit warning — name-alike collisions are a list-level fact
   * that an item-level component cannot detect on its own.
   */
  nameAlike?: boolean;
  asOf?: Date;
}

export function IdentityToken({
  patient,
  identifierSystem,
  identifierLabel = "MRN",
  maskIdentifiers = false,
  photoConsent = false,
  size = "md",
  avatarOnly = false,
  showDetail = true,
  nameAlike = false,
  asOf = new Date(),
  className,
  ...props
}: IdentityTokenProps) {
  const name = resolvePatientName(patient);
  const restricted = isRestricted(patient);
  const deceased = isDeceased(patient);

  // An unidentified trauma patient is a real and recurring case. The record
  // exists, the person is real, and the component must not render blank.
  const displayName = name ?? "Name not recorded";
  const initials = nameInitials(name) ?? "?";

  const identifier = getIdentifier(patient, identifierSystem)?.value;
  const shownIdentifier = maskIdentifiers ? maskIdentifier(identifier) : identifier;
  const age = formatAge(patient?.birthDate, asOf);

  const photo = photoConsent ? patient?.photo?.find((p) => p.url)?.url : undefined;
  const sizes = SIZE[size];

  const spoken = [
    displayName,
    age ? `age ${age}` : undefined,
    shownIdentifier ? `${identifierLabel} ${shownIdentifier}` : undefined,
    restricted ? "restricted record" : undefined,
    deceased ? "deceased" : undefined,
    nameAlike ? "similar name in this list, confirm identity" : undefined,
  ]
    .filter(Boolean)
    .join(", ");

  const avatar = (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--ox-radius)] border font-semibold",
        sizes.box,
        swatchFor(displayName),
        deceased && "grayscale",
      )}
    >
      {photo ? (
        // Decorative: the adjacent name is the label, so alt is empty.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );

  if (avatarOnly) {
    return (
      <div className={cn("inline-flex", className)} {...props}>
        <span className="sr-only">{spoken}</span>
        {avatar}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-[var(--ox-density-gap)]", className)} {...props}>
      <span className="sr-only">{spoken}</span>
      {avatar}

      <div aria-hidden="true" className="min-w-0">
        <div className={cn("flex flex-wrap items-center gap-1.5 font-semibold", sizes.name)}>
          {/* Truncates from the end but keeps the family name reachable via
              the accessible name above, which is never truncated. */}
          <span className="truncate">{displayName}</span>

          {restricted && (
            <span className="inline-flex items-center gap-1 rounded-[var(--ox-radius-sm)] border border-[#ddd6fe] bg-[var(--ox-flag-restricted-bg)] px-1.5 py-0.5 text-[length:var(--ox-text-2xs)] font-semibold text-[var(--ox-flag-restricted)]">
              <Lock className="size-3" />
              Restricted
            </span>
          )}
          {deceased && (
            <span className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] bg-[var(--ox-bg-muted)] px-1.5 py-0.5 text-[length:var(--ox-text-2xs)] font-semibold text-[var(--ox-flag-deceased)]">
              Deceased
            </span>
          )}
        </div>

        {showDetail && (age || shownIdentifier) && (
          <div className="mt-0.5 flex flex-wrap gap-2 font-[family-name:var(--ox-font-numeric)] text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]">
            {age && <span>{age}</span>}
            {shownIdentifier && (
              <span>
                {identifierLabel} {shownIdentifier}
              </span>
            )}
          </div>
        )}

        {nameAlike && (
          <div className="mt-1 inline-flex items-center gap-1 text-[length:var(--ox-text-xs)] font-medium text-[var(--ox-status-high)]">
            <ShieldAlert className="size-3.5" />
            Similar name in this list — confirm identity
          </div>
        )}
      </div>
    </div>
  );
}

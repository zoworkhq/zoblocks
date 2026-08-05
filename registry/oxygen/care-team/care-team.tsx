"use client";

/**
 * CareTeamPanel — everyone involved, and who is actually reachable now.
 *
 * The gap this closes: the person on the record is frequently not the person
 * to contact. A panel that lists the assigned consultant at 2am, with no
 * indication that they are not on call, is worse than no panel — it produces a
 * confident call to a phone nobody is holding.
 *
 * So coverage is a first-class concept. The assigned clinician is shown, and
 * the person covering them right now is shown next to it, rather than one
 * silently replacing the other.
 *
 * Two further choices:
 *
 *   - Past members are history, not deletions. "Who was looking after them in
 *     March" is a question reviews actually ask.
 *   - Caregivers, peer supports, and community health workers are rendered
 *     with the same weight as clinicians. In behavioral health and complex
 *     care they frequently are the team, and demoting them to a footnote
 *     misrepresents how the care actually happens.
 */

import * as React from "react";
import { Phone, Send, UserRound } from "lucide-react";
import {
  careTeamMembers,
  nameInitials,
  type CareTeam,
  type CareTeamMember,
} from "@oxygenui-design/fhir";
import { cn } from "@/lib/utils";

export interface CoverageInfo {
  /** Who is actually reachable for this member right now. */
  coveringName: string;
  until?: string;
}

export interface CareTeamPanelProps {
  team?: CareTeam;
  /** Members not modelled in the CareTeam resource, e.g. community supports. */
  extraMembers?: CareTeamMember[];
  /** Coverage by member reference or name. The record is not the roster. */
  coverage?: Record<string, CoverageInfo>;
  /** Contact routes by member reference or name. */
  contacts?: Record<string, { phone?: string; onMessage?: () => void }>;
  /** Responsible clinician, pinned first. */
  responsibleRef?: string;
  showPast?: boolean;
  asOf?: Date;
  label?: string;
  className?: string;
}

export function CareTeamPanel({
  team,
  extraMembers = [],
  coverage = {},
  contacts = {},
  responsibleRef,
  showPast = true,
  asOf = new Date(),
  label = "Care team",
  className,
}: CareTeamPanelProps) {
  const members = [...careTeamMembers(team, asOf), ...extraMembers];

  const current = members.filter((m) => m.current);
  const past = members.filter((m) => !m.current);

  // The responsible clinician is pinned; everyone else keeps source order,
  // because reordering a team by role implies a hierarchy the record does not
  // state.
  const ordered = [...current].sort((a, b) => {
    const aResp = responsibleRef && (a.reference === responsibleRef || a.name === responsibleRef);
    const bResp = responsibleRef && (b.reference === responsibleRef || b.name === responsibleRef);
    return Number(bResp) - Number(aResp);
  });

  if (!members.length) {
    return (
      <section aria-label={label} className={className}>
        <p className="text-[length:var(--ox-text-sm)] text-[var(--ox-text-subtle)]">
          No care team recorded. This is not the same as having no care team — record who is
          involved.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={label} className={cn("flex flex-col gap-2", className)}>
      <ul className="flex flex-col gap-1.5">
        {ordered.map((member, index) => {
          const key = member.reference ?? member.name;
          const cover = coverage[key];
          const contact = contacts[key];
          const responsible =
            responsibleRef &&
            (member.reference === responsibleRef || member.name === responsibleRef);

          return (
            <li
              key={`${key}-${index}`}
              className="flex items-center gap-[var(--ox-density-gap)] rounded-[var(--ox-radius)] border border-[var(--ox-border)] bg-[var(--ox-surface)] px-[var(--ox-density-pad-x)] py-[var(--ox-density-pad-y)]"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-[var(--ox-radius)] border border-[var(--ox-border)] bg-[var(--ox-bg-subtle)] text-[length:var(--ox-text-2xs)] font-semibold text-[var(--ox-text-muted)]"
              >
                {nameInitials(member.name) ?? <UserRound className="size-3.5" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 text-[length:var(--ox-density-font)] font-semibold">
                  {member.name}
                  {responsible && (
                    <span className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-accent-border)] bg-[var(--ox-accent-subtle)] px-1.5 py-0.5 text-[length:var(--ox-text-2xs)] font-bold uppercase tracking-wider text-[var(--ox-accent)]">
                      Responsible
                    </span>
                  )}
                </p>
                <p className="text-[length:var(--ox-text-xs)] text-[var(--ox-text-muted)]">
                  {member.role ?? "Role not recorded"}
                </p>

                {/* Coverage sits beside the assignment rather than replacing
                    it. Both facts are true and a caller needs both. */}
                {cover && (
                  <p className="mt-0.5 text-[length:var(--ox-text-xs)] font-medium text-[var(--ox-status-high)]">
                    Not on call — {cover.coveringName} is covering
                    {cover.until ? ` until ${cover.until}` : ""}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    aria-label={`Call ${member.name}`}
                    className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] p-1.5 text-[var(--ox-text-muted)] no-underline hover:bg-[var(--ox-bg-muted)]"
                  >
                    <Phone aria-hidden="true" className="size-3.5" />
                  </a>
                )}
                {contact?.onMessage && (
                  <button
                    type="button"
                    onClick={contact.onMessage}
                    // A bare icon is not a label. The action and its target
                    // are both in the accessible name.
                    aria-label={`Send a secure message to ${member.name}`}
                    className="rounded-[var(--ox-radius-sm)] border border-[var(--ox-border-strong)] p-1.5 text-[var(--ox-text-muted)] hover:bg-[var(--ox-bg-muted)]"
                  >
                    <Send aria-hidden="true" className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {showPast && past.length > 0 && (
        <details className="rounded-[var(--ox-radius)] border border-[var(--ox-border)] px-[var(--ox-density-pad-x)] py-1.5">
          <summary className="cursor-pointer text-[length:var(--ox-text-xs)] font-semibold text-[var(--ox-text-muted)]">
            {past.length} past team {past.length === 1 ? "member" : "members"}
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1">
            {past.map((member, index) => (
              <li
                key={`${member.reference ?? member.name}-${index}`}
                className="text-[length:var(--ox-text-xs)] text-[var(--ox-text-subtle)]"
              >
                {member.name} — {member.role ?? "Role not recorded"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

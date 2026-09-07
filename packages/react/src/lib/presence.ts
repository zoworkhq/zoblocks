// GENERATED FILE — DO NOT EDIT.
//
// Produced by `pnpm gen` from each component's *.meta.ts.
// Edit the metadata, then re-run. CI fails if this file is stale.
//
// See content/decisions/0004-generated-component-metadata.md
//
// Generated from registry/zoblocks/lib/presence.ts. Edit that file, not this one.
/**
 * Presence with clinical semantics: not *online*, but in session, on call,
 * signed out to whom, and who else is in this chart right now.
 *
 * A green dot meaning "online" is worse than useless on a ward. A therapist
 * who is in session is at their desk and must not be interrupted. A hospitalist
 * who is signed out is online and is the wrong person to page. A colleague who
 * is in this chart right now is about to create a documentation conflict you
 * should be told about before you start typing, not at save.
 *
 * Two halves, and the second is the one a PDF on a shared drive answers today:
 * who covers this patient at 02:00 on a Sunday, and until when.
 *
 * No React, no DOM, no transport. The presence channel is the host's — this
 * file is the vocabulary and the resolution rules.
 */

import { clockTime } from "../lib/clock";

/**
 * Re-exported so a consumer who installs CareTeamPresence gets the formatter
 * its output is written in, without having to know it lives in `utils`.
 */
export { clockTime } from "../lib/clock";

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

/**
 * Nine states, and four of them exist because behavioral health needs them
 * and no generic presence system has them.
 *
 * `available` is the only one that means what a green dot means. The rest all
 * answer a different question: not "is this person at a computer" but "is this
 * person the one to contact, and how".
 */
export type PresenceState =
  /** At a computer and interruptible. */
  | "available"
  /** With a patient. At their desk, and must not be interrupted. */
  | "in-session"
  /** Running a group. Interrupting reaches eight patients, not one. */
  | "in-group"
  /** Staffing the crisis line. Reachable, and only for an escalation. */
  | "on-crisis-line"
  /** On call for this service. The right person to page out of hours. */
  | "on-call"
  /** Handed over. Online, and the wrong person to page. */
  | "signed-out"
  /** Not working. Different from signed out: nobody took the handover. */
  | "off-shift"
  /** The channel dropped. Not offline — unknown, and it says so. */
  | "degraded"
  /** No presence has ever been reported for this person. */
  | "unknown";

export const PRESENCE_LABEL: Record<PresenceState, string> = {
  available: "Available",
  "in-session": "In session",
  "in-group": "In group",
  "on-crisis-line": "On crisis line",
  "on-call": "On call",
  "signed-out": "Signed out",
  "off-shift": "Off shift",
  degraded: "Presence degraded",
  unknown: "Presence unknown",
};

/**
 * The ring shape, which carries the state independently of its colour.
 *
 * Nine hues on a 24px avatar is unreadable before it is inaccessible. The ring
 * is a shape — solid, dashed, doubled, notched — and a reader who cannot
 * distinguish the hues reads it, as does anyone in Windows high contrast.
 */
export const PRESENCE_RING: Record<PresenceState, string> = {
  available: "solid",
  "in-session": "block",
  "in-group": "double",
  "on-crisis-line": "pulse",
  "on-call": "half",
  "signed-out": "arrow",
  "off-shift": "none",
  degraded: "dashed",
  unknown: "dotted",
};

/**
 * States where contacting the person directly is the wrong move.
 *
 * Exported because an escalation affordance has to ask, and asking by string
 * comparison in four places is how one of them gets missed.
 */
export const DO_NOT_DISTURB: readonly PresenceState[] = ["in-session", "in-group"];

export function isDoNotDisturb(state: PresenceState): boolean {
  return DO_NOT_DISTURB.includes(state);
}

/** States where somebody else is the right contact. */
export const REDIRECTS: readonly PresenceState[] = ["signed-out", "off-shift"];

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export interface Clinician {
  id: string;
  /** "A. Vance, MD". */
  display: string;
  /**
   * "Attending", "LCSW", "PMHNP".
   *
   * Rendered beneath the name and never omitted: "Dr Vance" is not actionable
   * and "Attending, night coverage until 07:00" is.
   */
  role?: string;
  /** "pager 4471", an extension, a room. */
  contact?: string;
  /**
   * Whether this clinician is the patient's assigned therapist.
   *
   * Different from being a member of the care team, and the distinction
   * matters: in behavioral health the assigned therapist is the person a
   * disclosure decision routes through.
   */
  assignedTherapist?: boolean;
}

export interface Presence {
  clinician: Clinician;
  state: PresenceState;
  /** ISO 8601. When the state was last confirmed by the channel. */
  since?: string;
  /** ISO 8601. "In session until 15:50", "night coverage until 07:00". */
  until?: string;
  /** Who to contact instead, for a signed-out or off-shift clinician. */
  coveredBy?: Clinician;
  /** "IOP group · 8 members". Free text the state carries. */
  detail?: string;
}

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

export interface CoverageWindow {
  clinician: Clinician;
  /** ISO 8601. */
  start: string;
  end: string;
  /** "Night coverage for T. Boateng", "Psychiatry back-up". */
  reason?: string;
}

export interface Coverage {
  /** The person responsible right now. */
  responsible: Clinician;
  /**
   * When their window ends.
   *
   * Required, not optional. It is `CoverageWindow.end`, which is required, and
   * the only way to obtain a `Coverage` is to resolve one from a window — so an
   * optional `until` bought two unreachable branches in the renderer and one
   * sentence that could not be produced. Coverage with no end is not coverage;
   * it is a name on a list.
   */
  until: string;
  reason?: string;
  /** Second line of defence, for an escalation that the first does not answer. */
  backup?: Clinician;
}

/**
 * Who is actually responsible at a given moment.
 *
 * Returns `null` rather than the first window or the last one when nothing
 * covers `now`. A gap in the rota is a real and dangerous state, and filling
 * it with a plausible name is how a page goes to somebody who is asleep.
 */
export function resolveCoverage(
  windows: readonly CoverageWindow[],
  now: string,
  backup?: Clinician,
): Coverage | null {
  const at = Date.parse(now);
  if (!Number.isFinite(at)) return null;

  const active = windows.find((w) => {
    const start = Date.parse(w.start);
    const end = Date.parse(w.end);
    return Number.isFinite(start) && Number.isFinite(end) && at >= start && at < end;
  });
  if (!active) return null;

  const coverage: Coverage = { responsible: active.clinician, until: active.end };
  if (active.reason) coverage.reason = active.reason;
  if (backup) coverage.backup = backup;
  return coverage;
}

/* ------------------------------------------------------------------ */
/* Co-presence                                                         */
/* ------------------------------------------------------------------ */

/** What somebody else is doing in this chart. */
export type Activity = "viewing" | "documenting" | "signing";

export const ACTIVITY_LABEL: Record<Activity, string> = {
  viewing: "viewing",
  documenting: "documenting",
  signing: "signing",
};

export interface ChartPresence {
  clinician: Clinician;
  activity: Activity;
  /** ISO 8601. When they started. */
  since: string;
  /** "Progress note", "Discharge summary". What they have open. */
  target?: string;
  /** True when the thing they have open is not yet signed. */
  unsigned?: boolean;
}

/**
 * Whether opening an editor here would create a conflict.
 *
 * The one presence signal that appears without being asked for, and the reason
 * is timing: told at save, this is a merge problem; told before you type, it is
 * a choice between three reasonable options.
 */
export function conflictsWith(others: readonly ChartPresence[]): ChartPresence | null {
  return others.find((o) => o.activity === "documenting" || o.activity === "signing") ?? null;
}

/* ------------------------------------------------------------------ */
/* Escalation                                                          */
/* ------------------------------------------------------------------ */

export type EscalationTarget =
  | { kind: "direct"; clinician: Clinician }
  /** Do-not-disturb: the covering clinician is offered instead. */
  | { kind: "covering"; clinician: Clinician; instead: Clinician; reason: string }
  /** Do-not-disturb with nobody covering. An override, and it is logged. */
  | { kind: "override-required"; clinician: Clinician; reason: string };

/**
 * Who an escalation should actually reach.
 *
 * A do-not-disturb state is not a locked door — a genuine emergency overrides
 * it — but the default has to be the covering clinician, because the common
 * case is somebody who has not noticed that interrupting a group session
 * reaches eight patients rather than one. The override exists and it is logged.
 */
export function resolveEscalation(presence: Presence): EscalationTarget {
  const { clinician, state, coveredBy } = presence;

  if (coveredBy && (isDoNotDisturb(state) || REDIRECTS.includes(state))) {
    return {
      kind: "covering",
      clinician: coveredBy,
      instead: clinician,
      reason: `${clinician.display} is ${PRESENCE_LABEL[state].toLowerCase()}`,
    };
  }

  if (isDoNotDisturb(state)) {
    return {
      kind: "override-required",
      clinician,
      reason: `${clinician.display} is ${PRESENCE_LABEL[state].toLowerCase()} and nobody is covering`,
    };
  }

  return { kind: "direct", clinician };
}

/* ------------------------------------------------------------------ */
/* The sentence                                                        */
/* ------------------------------------------------------------------ */

/**
 * "3 h", "45 min", "2 d". Abbreviated on purpose, and deliberately not the
 * same function as ResultValue's `describeElapsed`, which spells the unit out.
 *
 * A result panel has room for "3 hours" and a roster of twelve clinicians does
 * not — the age sits beside a name in a 28px row, and the long form pushes the
 * role off the line. Two formats, two names: a shared helper here would have
 * to pick one surface to be wrong for.
 */
export function describeElapsedShort(ms: number): string {
  if (ms < 60_000) return "just now";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

/**
 * The whole presence as one spoken statement.
 *
 * "A. Vance, MD, attending. Available. In clinic." — name, role, state,
 * detail. The role is second because it is what makes the name actionable, and
 * the state is third because a reader who stops there has enough to decide
 * whether to make contact.
 */
export function describePresence(presence: Presence, now?: string): string {
  const { clinician, state } = presence;
  const parts: string[] = [clinician.display];

  if (clinician.role) parts.push(clinician.role);
  if (clinician.assignedTherapist) parts.push("assigned therapist");

  parts.push(PRESENCE_LABEL[state]);

  if (presence.detail) parts.push(presence.detail);
  if (presence.until) parts.push(`until ${clockTime(presence.until, now)}`);
  if (presence.coveredBy) {
    parts.push(
      presence.coveredBy.role
        ? `covered by ${presence.coveredBy.display}, ${presence.coveredBy.role}`
        : `covered by ${presence.coveredBy.display}`,
    );
  }

  // Degraded presence says how stale it is, because a frozen dot that looks
  // live is the failure mode this state exists to prevent.
  if (state === "degraded" && now && presence.since) {
    const elapsed = Date.parse(now) - Date.parse(presence.since);
    if (Number.isFinite(elapsed) && elapsed >= 0) {
      parts.push(`last seen ${describeElapsedShort(elapsed)} ago, channel lost`);
    }
  }

  if (isDoNotDisturb(state)) parts.push("do not disturb");
  if (clinician.contact) parts.push(clinician.contact);

  // Each clause is a sentence, so each one starts with a capital. Joining
  // "Available" and "until 07:00" with a full stop and leaving the second
  // lowercase produces a statement no screen reader punctuates correctly.
  return `${parts.map(sentence).join(". ")}.`;
}

/** First letter up, the rest untouched — "MD" must not become "Md". */
function sentence(part: string): string {
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** "L. Marsh, LCSW is documenting in this encounter." */
export function describeConflict(other: ChartPresence, now?: string): string {
  const who = other.clinician.role
    ? `${other.clinician.display}, ${other.clinician.role}`
    : other.clinician.display;

  const parts = [`${who} is ${ACTIVITY_LABEL[other.activity]} in this encounter`];
  if (other.target) parts.push(other.target);

  if (now) {
    const elapsed = Date.parse(now) - Date.parse(other.since);
    if (Number.isFinite(elapsed) && elapsed >= 0) {
      parts.push(`started ${describeElapsedShort(elapsed)} ago`);
    }
  }

  if (other.unsigned) parts.push("unsigned");
  if (other.activity === "documenting") {
    parts.push("opening a second note in the same encounter will create a duplicate");
  }

  return `${parts.join(", ")}.`;
}

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

interface FhirReference {
  display?: string;
  reference?: string;
}

interface FhirCareTeamParticipant {
  role?: Array<{ text?: string; coding?: Array<{ display?: string }> }>;
  member?: FhirReference;
  period?: { start?: string; end?: string };
}

/**
 * `CareTeam.participant` into coverage windows.
 *
 * A participant with no period covers nothing in particular and is dropped
 * rather than treated as covering everything: an open-ended membership is
 * "on the team", which is a different question from "responsible right now".
 */
export function coverageFromCareTeam(
  participants: readonly FhirCareTeamParticipant[],
): CoverageWindow[] {
  const windows: CoverageWindow[] = [];

  for (const participant of participants) {
    const start = participant.period?.start;
    const end = participant.period?.end;
    const display = participant.member?.display;
    if (!start || !end || !display) continue;

    const role = participant.role?.[0]?.text ?? participant.role?.[0]?.coding?.[0]?.display;
    const clinician: Clinician = { id: participant.member?.reference ?? display, display };
    if (role) clinician.role = role;

    windows.push({ clinician, start, end });
  }

  return windows;
}

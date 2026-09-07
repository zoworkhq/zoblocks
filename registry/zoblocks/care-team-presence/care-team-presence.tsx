/**
 * CareTeamPresence — presence with clinical semantics.
 *
 *     <PresenceChip presence={marsh} now={serverTime} />
 *     <CoverageCard windows={rota} now={serverTime} onPage={page} />
 *     <ChartCoPresence others={inThisChart} now={serverTime} />
 *
 * Not "online". A therapist who is in session is at their desk and must not be
 * interrupted; a hospitalist who is signed out is online and is the wrong
 * person to page. The ring carries the state as a shape rather than a hue,
 * because nine colours on a 24px avatar is unreadable before it is
 * inaccessible.
 *
 * `ChartCoPresence` is the one presence signal that appears without being
 * asked for, and the reason is timing: told at save, a second note in the same
 * encounter is a merge problem; told before you type, it is a choice between
 * three reasonable options.
 *
 * Transport-agnostic. The host subscribes once and passes presence down.
 *
 * Styling lives in `styles/zoblocks-presence.css`, installed alongside.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABEL,
  PRESENCE_LABEL,
  PRESENCE_RING,
  clockTime,
  conflictsWith,
  describeConflict,
  describeElapsedShort,
  describePresence,
  isDoNotDisturb,
  resolveCoverage,
  resolveEscalation,
  type ChartPresence,
  type Clinician,
  type CoverageWindow,
  type EscalationTarget,
  type Presence,
} from "@/lib/zoblocks-presence";

export {
  ACTIVITY_LABEL,
  DO_NOT_DISTURB,
  PRESENCE_LABEL,
  PRESENCE_RING,
  REDIRECTS,
  clockTime,
  conflictsWith,
  coverageFromCareTeam,
  describeConflict,
  describeElapsedShort,
  describePresence,
  isDoNotDisturb,
  resolveCoverage,
  resolveEscalation,
  type Activity,
  type ChartPresence,
  type Clinician,
  type Coverage,
  type CoverageWindow,
  type EscalationTarget,
  type Presence,
  type PresenceState,
} from "@/lib/zoblocks-presence";

/**
 * Two letters, from the display name. Never a photograph.
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

/* ------------------------------------------------------------------ */
/* One person                                                          */
/* ------------------------------------------------------------------ */

export interface PresenceChipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * The person and their current state — available, in session, signed out, off shift — with
   * whoever is covering for them.
   */
  presence: Presence;
  /** ISO 8601, supplied by the host. Needed for the degraded state's age. */
  now?: string;
  /** Avatar only, for a co-presence stack. The name stays in the label. */
  compact?: boolean;
  /**
   * Contact this person.
   *
   * Routed through `resolveEscalation`, so a do-not-disturb clinician offers
   * their cover instead and an override is a second, deliberate action.
   */
  onContact?: (target: EscalationTarget) => void;
}

export const PresenceChip = React.forwardRef<HTMLDivElement, PresenceChipProps>(
  function PresenceChip({ presence, now, compact = false, onContact, className, ...rest }, ref) {
    const { clinician, state } = presence;
    const escalation = resolveEscalation(presence);
    const dnd = isDoNotDisturb(state);

    return (
      <div
        {...rest}
        ref={ref}
        className={cn("zb-presence", className)}
        data-zb-presence=""
        data-zb-state={state}
        data-zb-dnd={dnd ? "" : undefined}
        data-zb-compact={compact ? "" : undefined}
        role="group"
        aria-label={describePresence(presence, now)}
      >
        <span
          className="zb-presence__avatar"
          data-zb-ring={PRESENCE_RING[state]}
          aria-hidden="true"
        >
          {initials(clinician.display)}
        </span>

        {compact ? null : (
          <span className="zb-presence__body" aria-hidden="true">
            <span className="zb-presence__name">
              {clinician.display}
              {clinician.assignedTherapist ? (
                <span className="zb-presence__assigned">assigned therapist</span>
              ) : null}
            </span>

            {/*
              The role is never omitted. "Dr Vance" is not actionable;
              "Attending, night coverage until 07:00" is, and the difference is
              whether a reader knows they have found the right person.
            */}
            <span className="zb-presence__meta">
              {clinician.role ? <span className="zb-presence__role">{clinician.role}</span> : null}
              <span className="zb-presence__state">{PRESENCE_LABEL[state]}</span>
              {presence.detail ? (
                <span className="zb-presence__detail">{presence.detail}</span>
              ) : null}
              {presence.until ? (
                <span className="zb-presence__until">until {clockTime(presence.until, now)}</span>
              ) : null}
            </span>

            {presence.coveredBy ? (
              <span className="zb-presence__cover">
                → covered by {presence.coveredBy.display}
                {presence.until ? ` until ${clockTime(presence.until, now)}` : ""}
              </span>
            ) : null}

            {/*
              A degraded channel says how stale it is. A dot that froze three
              hours ago and still looks live is the failure this state exists
              to prevent.
            */}
            {state === "degraded" && now && presence.since ? (
              <span className="zb-presence__degraded">
                Last seen {describeElapsedShort(Date.parse(now) - Date.parse(presence.since))} ago ·
                channel lost
              </span>
            ) : null}
          </span>
        )}

        {onContact ? (
          <button
            type="button"
            className="zb-presence__contact"
            data-zb-escalation={escalation.kind}
            onClick={() => onContact(escalation)}
          >
            {escalation.kind === "covering"
              ? `Page ${escalation.clinician.display}`
              : escalation.kind === "override-required"
                ? "Interrupt…"
                : "Page"}
          </button>
        ) : null}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

export interface CoverageCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Who is covering, and when. Overlaps and gaps are both drawn: a gap in coverage is the fact
   * a reader is looking for.
   */
  windows: readonly CoverageWindow[];
  now: string;
  /**
   * Who to reach when the primary does not answer. Rendered before it is needed rather than
   * found during an escalation.
   */
  backup?: Clinician;
  /** Fired when the reader pages somebody. The component never contacts anyone itself. */
  onPage?: (clinician: Clinician) => void;
}

/**
 * Who is responsible right now, and until when.
 *
 * The question a PDF on a shared drive answers today. A gap in the rota is
 * rendered as a gap rather than filled with the nearest plausible name —
 * paging somebody who is asleep because the component rounded to the closest
 * window is worse than saying nobody is covering.
 */
export const CoverageCard = React.forwardRef<HTMLDivElement, CoverageCardProps>(
  function CoverageCard({ windows, now, backup, onPage, className, ...rest }, ref) {
    const coverage = resolveCoverage(windows, now, backup);

    if (!coverage) {
      return (
        <div
          {...rest}
          ref={ref}
          className={cn("zb-coverage zb-coverage--gap", className)}
          data-zb-coverage="gap"
          role="alert"
          aria-label="Nobody is covering this patient right now. Escalate to the on-call supervisor."
        >
          <span className="zb-coverage__title" aria-hidden="true">
            Nobody is covering right now
          </span>
          <span className="zb-coverage__detail" aria-hidden="true">
            No rota window covers this moment. Escalate to the on-call supervisor.
          </span>
        </div>
      );
    }

    // Each clause is a sentence and starts like one. Joining "Night attending"
    // and "until 09:00" with a full stop and leaving the second lower-case
    // gives a screen reader nothing to punctuate.
    const label = [
      `Responsible right now: ${coverage.responsible.display}`,
      coverage.responsible.role,
      coverage.reason,
      `Until ${clockTime(coverage.until, now)}`,
      coverage.backup ? `Back-up ${coverage.backup.display}` : undefined,
    ]
      .filter(Boolean)
      .join(". ");

    return (
      <div
        {...rest}
        ref={ref}
        className={cn("zb-coverage", className)}
        data-zb-coverage="covered"
        role="group"
        aria-label={`${label}.`}
      >
        <span className="zb-coverage__title" aria-hidden="true">
          Responsible right now
        </span>

        <div className="zb-coverage__who" aria-hidden="true">
          <span className="zb-presence__avatar" data-zb-ring="solid">
            {initials(coverage.responsible.display)}
          </span>
          <span>
            <span className="zb-coverage__name">{coverage.responsible.display}</span>
            <span className="zb-coverage__meta">
              {coverage.responsible.role ? `${coverage.responsible.role} · ` : ""}
              {coverage.reason ?? "Covering"}
              {` · until ${clockTime(coverage.until, now)}`}
            </span>
          </span>
        </div>

        {coverage.backup ? (
          <span className="zb-coverage__backup" aria-hidden="true">
            Back-up: {coverage.backup.display}
            {coverage.backup.role ? `, ${coverage.backup.role}` : ""}
            {coverage.backup.contact ? ` · ${coverage.backup.contact}` : ""}
          </span>
        ) : null}

        {onPage ? (
          <button
            type="button"
            className="zb-coverage__page"
            onClick={() => onPage(coverage.responsible)}
          >
            Page {coverage.responsible.display}
          </button>
        ) : null}
      </div>
    );
  },
);

/* ------------------------------------------------------------------ */
/* Co-presence                                                         */
/* ------------------------------------------------------------------ */

export interface ChartCoPresenceProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /**
   * Who else has this chart open right now. Two people writing the same note is a merge nobody
   * wins.
   */
  others: readonly ChartPresence[];
  now?: string;
  /** Opens the other person's draft, read-only. */
  onOpenTheirs?: (other: ChartPresence) => void;
  /** Fired when the reader asks the current editor to hand over. */
  onRequestHandoff?: (other: ChartPresence) => void;
  /**
   * Fired when the reader chooses to write their own addendum instead of waiting. The honest
   * alternative to a silent overwrite.
   */
  onSeparateAddendum?: (other: ChartPresence) => void;
}

/**
 * Who else is in this chart, and what they are doing.
 *
 * The conflict notice is `aria-live="polite"` and throttled: a stream of
 * arrival announcements is an interruption, and this component's whole purpose
 * is to prevent one kind of interruption rather than introduce another.
 */
export const ChartCoPresence = React.forwardRef<HTMLDivElement, ChartCoPresenceProps>(
  function ChartCoPresence(
    { others, now, onOpenTheirs, onRequestHandoff, onSeparateAddendum, className, ...rest },
    ref,
  ) {
    const conflict = conflictsWith(others);

    /*
     * One announcement per ten seconds.
     *
     * Without the throttle, a ward round where six people open the same chart
     * produces six interruptions in as many seconds — and a screen-reader user
     * loses whatever they were reading each time.
     */
    const [announced, setAnnounced] = React.useState<string>("");
    // Negative infinity rather than 0: the first conflict on a freshly-mounted
    // chart is always worth saying immediately, and `performance.now()` starts
    // at an arbitrary point that would otherwise decide it.
    const lastAt = React.useRef(Number.NEGATIVE_INFINITY);
    const message = conflict ? describeConflict(conflict, now) : "";

    React.useEffect(() => {
      if (!message) {
        setAnnounced("");
        return;
      }
      const elapsed = performance.now() - lastAt.current;
      if (elapsed >= 10_000) {
        lastAt.current = performance.now();
        setAnnounced(message);
        return;
      }
      const timer = setTimeout(() => {
        lastAt.current = performance.now();
        setAnnounced(message);
      }, 10_000 - elapsed);
      return () => clearTimeout(timer);
    }, [message]);

    if (!others.length) return null;

    return (
      <div
        {...rest}
        ref={ref}
        className={cn("zb-copresence", className)}
        data-zb-copresence=""
        data-zb-conflict={conflict ? "" : undefined}
      >
        <span className="zb-copresence__stack" aria-hidden="true">
          {others.slice(0, 4).map((other) => (
            <span
              key={other.clinician.id}
              className="zb-presence__avatar"
              data-zb-ring="solid"
              data-zb-activity={other.activity}
              title={`${other.clinician.display} — ${ACTIVITY_LABEL[other.activity]}`}
            >
              {initials(other.clinician.display)}
            </span>
          ))}
          {others.length > 4 ? (
            <span className="zb-copresence__more">+{others.length - 4}</span>
          ) : null}
        </span>

        {conflict ? (
          <div className="zb-copresence__conflict">
            <p className="zb-copresence__message" aria-hidden="true">
              {describeConflict(conflict, now)}
            </p>
            {/*
              Three options, none of them "carry on anyway".
              Told before you type, this is a choice; told at save, it is a
              merge problem with somebody else's unsigned note.
            */}
            <div className="zb-copresence__actions">
              {onOpenTheirs ? (
                <button type="button" onClick={() => onOpenTheirs(conflict)}>
                  Open theirs read-only
                </button>
              ) : null}
              {onRequestHandoff ? (
                <button type="button" onClick={() => onRequestHandoff(conflict)}>
                  Request handoff
                </button>
              ) : null}
              {onSeparateAddendum ? (
                <button type="button" onClick={() => onSeparateAddendum(conflict)}>
                  Create a separate addendum
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Polite and throttled. The component exists to prevent an
            interruption, not to become one. */}
        <p className="zb-presence__sr" aria-live="polite">
          {announced}
        </p>
      </div>
    );
  },
);

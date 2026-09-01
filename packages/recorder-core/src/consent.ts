/**
 * `resolveConsent` — a predicate, and deliberately nothing more.
 *
 * The component takes a consent object — basis, who recorded it, when, and
 * whether it covers every participant — and refuses the `armed → recording`
 * edge without it. What it does not do is decide what a lawful basis is. It
 * renders a state the host asserts.
 *
 * The jurisdictional problem is real and is not ours: around a dozen US
 * states require all-party consent to record a conversation, several
 * countries treat a clinical recording as special-category data, and a
 * behavioural-health session may be a 42 CFR Part 2 record with disclosure
 * rules of its own.
 *
 * So there are no sentences in this file. It returns a verdict; the host
 * writes the copy. Consent wording is blocked on a named clinical reviewer
 * and a legal review that do not exist (§18), and writing a confident
 * sentence about lawful basis that nobody qualified has read is not an
 * engineering decision. If a later change adds a default string here, it has
 * crossed exactly the line this file was written to hold.
 */

import type { ConsentVerdict, RecorderConsent, RecorderParticipant } from "./types";

export interface ResolveConsentOptions {
  /** Whether an affirmative basis is required at all. The host's call. */
  readonly required?: boolean;
  /**
   * Who is in the room.
   *
   * When supplied, a participant explicitly marked `consented: false`
   * contradicts a `coversAll: true` claim, and the contradiction wins — a
   * component that believes the summary over the detail is a component that
   * will start recording someone who declined.
   */
  readonly participants?: readonly RecorderParticipant[];
}

/** Whether every field the host said it would supply is actually there. */
function isComplete(consent: RecorderConsent): boolean {
  return (
    typeof consent.basis === "string" &&
    consent.basis.trim().length > 0 &&
    typeof consent.recordedAt === "string" &&
    consent.recordedAt.trim().length > 0 &&
    typeof consent.recordedBy === "string" &&
    consent.recordedBy.trim().length > 0
  );
}

/**
 * The verdict on an asserted basis.
 *
 * `"not-required"` is distinct from `"resolved"` on purpose: one says a basis
 * cleared the edge, the other says the host declared no basis was needed.
 * Both open the edge and they are not the same fact, and a surface that
 * cannot tell them apart cannot render an honest provenance line.
 */
export function resolveConsent(
  consent: RecorderConsent | null | undefined,
  options: ResolveConsentOptions = {},
): ConsentVerdict {
  const required = options.required ?? true;

  if (consent === null || consent === undefined) {
    return required ? "absent" : "not-required";
  }
  if (!isComplete(consent)) return "incomplete";

  const declined = (options.participants ?? []).some(
    (participant) => participant.consented === false,
  );
  if (declined || consent.coversAll !== true) return "not-all-parties";

  return "resolved";
}

/** Whether a verdict clears the `armed → recording` edge. */
export function isConsentResolved(verdict: ConsentVerdict): boolean {
  return verdict === "resolved" || verdict === "not-required";
}

/**
 * Participants the asserted basis does not cover.
 *
 * Rendered by the host beside its own copy. Returned as the participants
 * themselves rather than as a count, because "2 not covered" is a number and
 * a name is a person.
 */
export function uncoveredParticipants(
  participants: readonly RecorderParticipant[],
): readonly RecorderParticipant[] {
  return participants.filter((participant) => participant.consented === false);
}

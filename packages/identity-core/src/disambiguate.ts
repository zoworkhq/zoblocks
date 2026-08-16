/**
 * `disambiguate` — the pass that keeps two patients with one name apart.
 *
 * Every hospital that has thought about this runs a "name alert" programme on
 * paper. No component library has ever offered it, because it needs a component
 * to know about its siblings — which is exactly the kind of thing a design
 * system is well placed to provide and an application team never gets to.
 *
 * The input is *what is actually on screen*, not the database. The output, per
 * identity, is the minimum set of extra fields that makes that identity unique
 * within the set. It stops at the first rung that separates them, because
 * escalating everything is the same as escalating nothing — `CONTENT.md` §3's
 * interruption budget, applied to density.
 */

import { fold } from "./text.js";
import { looksAlikeFolded, metaphone } from "./similarity.js";
import type { Identity } from "./types.js";

/** Fields the ladder can add, in the order it adds them. */
export type EscalationField = "given-full" | "dob" | "identifier" | "photo";

export type EscalationReason =
  "same-family-name" | "similar-name" | "same-birth-date" | "same-swatch";

export interface Escalation {
  /** Why this identity was escalated. The strongest reason wins. */
  reason: EscalationReason;
  /** All reasons that fired, for the explanation the app may want to show. */
  reasons: EscalationReason[];
  /** Fields to append. Appended, never substituted. */
  add: EscalationField[];
  /** Render the "similar name on this list" marker. */
  mark: boolean;
  /** Keys of the other identities this one collides with. */
  with: string[];
}

export interface DisambiguationResult {
  /** Per-identity escalation, keyed by `Identity.key`. Absent = untouched. */
  plan: Map<string, Escalation>;
  /** How many identities were escalated. */
  escalated: number;
  /** Total identities considered. */
  total: number;
}

/** Reason strength, strongest first. Drives which reason a renderer shows. */
const REASON_RANK: Record<EscalationReason, number> = {
  "same-birth-date": 4,
  "same-family-name": 3,
  "similar-name": 2,
  "same-swatch": 1,
};

/**
 * Everything the pairwise loop needs, computed once per identity.
 *
 * This is the whole performance story. `fold` runs an NFD normalise and four
 * regex passes; `metaphone` allocates. Doing either inside an O(n²) loop turns
 * a 300-row worklist into half a second of main-thread work — which was
 * measured, not guessed, and is why the test that caught it asserts a wall
 * clock rather than a call count.
 */
interface Prepared {
  identity: Identity;
  /** Folded family name, or the whole displayed name for a mononym. */
  family: string;
  /** Folded full name. */
  full: string;
  /** Folded given names, joined. */
  given: string;
  /** Metaphone of the family name, for the sound-alike test. */
  familySound: string;
  dob: string | undefined;
  primaryId: string | undefined;
}

function prepare(i: Identity): Prepared {
  // A mononym record has no family name; comparing on the whole displayed name
  // is the right fallback, because that is what the reader sees.
  const family = fold(i.name.family ?? i.name.text);
  const prepared: Prepared = {
    identity: i,
    family,
    full: fold(i.name.text),
    given: fold(i.name.given.join(" ")),
    familySound: metaphone(family),
    dob: i.birthDate?.value,
    primaryId: i.identifiers[0]?.raw,
  };
  return prepared;
}

/**
 * Pairwise collision detection.
 *
 * Deliberately O(n²) over prepared values. A worklist that is on screen is at
 * most a few hundred rows — beyond that the rows are virtualised, and rows
 * outside the viewport are not part of "what a reader could confuse", which is
 * the question being asked. A blocking index is the right answer for a
 * million-row match job and the wrong answer here.
 */
function collide(a: Prepared, b: Prepared): EscalationReason[] {
  const reasons: EscalationReason[] = [];

  // Two records that are the same record are not a collision.
  if (a.identity.key === b.identity.key) return reasons;

  const sameDob = !!a.dob && !!b.dob && a.dob === b.dob;
  const sameFamily = a.family.length > 0 && a.family === b.family;

  // Newborn twins: same surname, same date of birth, often a placeholder given
  // name. The classic wrong-patient case, and the one where colour and initials
  // are both useless.
  if (sameDob && sameFamily) reasons.push("same-birth-date");
  else if (sameFamily) reasons.push("same-family-name");
  else if (looksAlikeFolded(a.full, b.full)) reasons.push("similar-name");
  else if (
    // Two people whose surnames sound alike collide even when the given names
    // differ, because a reader scanning a column reads the surname. The
    // metaphones are precomputed, so this costs a string compare.
    (a.familySound.length > 1 && a.familySound === b.familySound) ||
    looksAlikeFolded(a.family, b.family)
  ) {
    reasons.push("similar-name");
  }

  if (a.identity.swatch === b.identity.swatch) reasons.push("same-swatch");

  return reasons;
}

/**
 * The ladder.
 *
 * Each rung is tried in order and the first one that makes the pair distinct
 * wins. `photo` is last and is a request, not a command: it overrides the
 * field-drop order but never the site's photo policy.
 */
function ladderFor(a: Prepared, b: Prepared, reasons: EscalationReason[]): EscalationField[] {
  const add: EscalationField[] = [];

  // Rung 1 — the full given name. "A. Okonkwo" and "A. Okonkwo" become
  // "Amara Chinelo Okonkwo" and "Amara Nkechi Okonkwo".
  if (a.given !== b.given && a.given.length > 0 && b.given.length > 0) {
    add.push("given-full");
    // A different full given name is only enough when the collision was about
    // the family name. If the dates of birth are identical too, a reader still
    // needs the date to be certain.
    if (!reasons.includes("same-birth-date")) return add;
  }

  // Rung 2 — the date of birth.
  if (a.dob && b.dob && a.dob !== b.dob) {
    add.push("dob");
    return add;
  }

  // Rung 3 — the primary identifier. Always distinct if the records are
  // distinct, so this rung terminates.
  if (a.primaryId && b.primaryId && a.primaryId !== b.primaryId) {
    add.push("identifier");
    return add;
  }

  // Rung 4 — force the photograph. Reached only when the records carry no
  // distinguishing identifier at all, which is itself a data defect worth
  // seeing.
  add.push("photo");
  return add;
}

/**
 * Mutable accumulator.
 *
 * Sets rather than arrays-plus-dedupe. On a pathological set — a paediatric
 * ward where forty children share a surname, or any list large enough that
 * every swatch collides — array concatenation makes the merge step quadratic in
 * the number of collisions, on top of the quadratic pair loop. That was
 * measured at half a second for 300 rows before this changed.
 */
interface Accumulator {
  reasons: Set<EscalationReason>;
  add: Set<EscalationField>;
  mark: boolean;
  with: Set<string>;
}

/**
 * Upper bound on the collision keys reported per identity.
 *
 * A renderer needs enough to explain the escalation, not the full clique. When
 * a set is this degenerate the useful signal is the list-level notice, and
 * `disambiguationNotice` still counts everyone. Silently unbounded growth here
 * would be the kind of cap that reads as "we covered everything" while quietly
 * costing memory on the largest lists.
 */
export const MAX_COLLISION_PEERS = 24;

export function disambiguate(set: Identity[]): DisambiguationResult {
  const plan = new Map<string, Escalation>();
  if (set.length < 2) return { plan, escalated: 0, total: set.length };

  // O(n) preparation, then O(n²) comparison over prepared values.
  const prepared = set.map(prepare);
  const acc = new Map<string, Accumulator>();

  for (let i = 0; i < prepared.length; i++) {
    for (let j = i + 1; j < prepared.length; j++) {
      const a = prepared[i];
      const b = prepared[j];
      if (!a || !b) continue;

      const reasons = collide(a, b);
      if (reasons.length === 0) continue;

      // A shared swatch alone escalates, but only to the extent of adding the
      // full given name — the tint is decoration and two people sharing one is
      // expected, not alarming. What must not happen is colour becoming the
      // fastest discriminator on the row.
      const onlySwatch = reasons.length === 1 && reasons[0] === "same-swatch";
      const forward = onlySwatch ? (["given-full"] as EscalationField[]) : ladderFor(a, b, reasons);
      const backward = onlySwatch ? forward : ladderFor(b, a, reasons);

      record(acc, a.identity.key, b.identity.key, reasons, forward, !onlySwatch);
      record(acc, b.identity.key, a.identity.key, reasons, backward, !onlySwatch);
    }
  }

  for (const [key, a] of acc) {
    let strongest: EscalationReason = "same-swatch";
    for (const r of a.reasons) if (REASON_RANK[r] > REASON_RANK[strongest]) strongest = r;
    plan.set(key, {
      reason: strongest,
      reasons: [...a.reasons],
      add: [...a.add],
      mark: a.mark,
      with: [...a.with],
    });
  }

  return { plan, escalated: plan.size, total: set.length };
}

function record(
  acc: Map<string, Accumulator>,
  selfKey: string,
  otherKey: string,
  reasons: EscalationReason[],
  fields: EscalationField[],
  mark: boolean,
): void {
  let entry = acc.get(selfKey);
  if (!entry) {
    entry = { reasons: new Set(), add: new Set(), mark: false, with: new Set() };
    acc.set(selfKey, entry);
  }
  for (const r of reasons) entry.reasons.add(r);
  for (const f of fields) entry.add.add(f);
  if (mark) entry.mark = true;
  if (entry.with.size < MAX_COLLISION_PEERS) entry.with.add(otherKey);
}

/**
 * A one-line summary for the list-level marker.
 *
 * Names the count and the action, per `CONTENT.md` §4 — it does not ask "are
 * you sure?", it says what to check.
 */
export function disambiguationNotice(result: DisambiguationResult): string | undefined {
  if (result.escalated === 0) return undefined;
  return `${result.escalated} of ${result.total} patients on this list have a similar name, a shared date of birth, or a shared avatar colour. Confirm date of birth before acting.`;
}

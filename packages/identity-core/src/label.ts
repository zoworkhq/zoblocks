/**
 * `identityLabel` — the single string a screen reader should hear.
 *
 * This lives in the engine rather than the component because the accessible
 * name and the visual rendering are two projections of one resolved identity,
 * and they must not be allowed to disagree. A banner whose label says one
 * patient and whose pixels say another is the wrong-patient bug with extra
 * steps.
 *
 * The default rendering of the reference design is seven separate fragments —
 * initials, name, a status pill, a letter, an age, a date, a number — that a
 * non-sighted user has to reassemble into a person. One label, read once, in
 * the order a human would say it.
 */

import { disclosureAllows, shortName } from "./resolve.js";
import type { Identity, IdentityPolicy } from "./types.js";
import { SENSITIVITY_LABEL } from "./types.js";

/**
 * Spell an initialism so a screen reader says the letters.
 *
 * `MRN` is pronounced "mern" by every major screen reader, and a clinician
 * verifying an identifier by ear needs `M R N`. The same applies to `NHS` and
 * `ABHA`. Anything already containing a space is left alone.
 */
export function spellOut(label: string): string {
  if (label.includes(" ")) {
    return label
      .split(" ")
      .map((w) => (isInitialism(w) ? w.split("").join(" ") : w))
      .join(" ");
  }
  return isInitialism(label) ? label.split("").join(" ") : label;
}

function isInitialism(word: string): boolean {
  return (
    word.length >= 2 && word.length <= 5 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)
  );
}

/**
 * Digits read in groups of three, with pauses.
 *
 * A ten-digit run announced as one number ("one hundred twenty three million…")
 * is unusable for verification. Commas produce the pause every screen reader
 * honours.
 */
export function spellDigits(value: string): string {
  const compact = value.replace(/\s/g, "");
  if (!/^[\d•]+$/.test(compact)) return value;
  return (compact.match(/.{1,3}/g) ?? [compact]).join(", ");
}

function stateLabel(identity: Identity, p: IdentityPolicy): string[] {
  const out: string[] = [];
  for (const s of identity.states) {
    switch (s.kind) {
      case "deceased":
        out.push(s.date ? `Deceased, died ${s.date.spoken}` : "Deceased");
        break;
      case "merged":
        out.push("Record merged — care is recorded elsewhere");
        break;
      case "inactive":
        out.push("Inactive — not currently receiving care from this service");
        break;
      case "test":
        out.push("Test record, not a person");
        break;
      case "restricted":
        /**
         * The categories are named only at full disclosure.
         *
         * Below it the visible banner withholds them behind an audited reveal,
         * and a label that named them anyway would hand a screen-reader user
         * the thing the reveal exists to record — an accessibility path around
         * a disclosure control, and a case of the label and the pixels
         * disagreeing, which is the exact failure `identityLabel` exists to
         * prevent.
         */
        out.push(
          p.disclosure === "full"
            ? `Sensitive record: ${s.codes.map((c) => SENSITIVITY_LABEL[c]).join(", ")}`
            : "Sensitive record",
        );
        break;
      default:
        break;
    }
  }
  return out;
}

export interface LabelOptions {
  /** Prefix, so a screen reader user knows what kind of thing this is. */
  noun?: string;
  /** Include identifiers. False for a chip inside a list of many. */
  identifiers?: boolean;
}

export function identityLabel(
  identity: Identity,
  p: IdentityPolicy,
  options: LabelOptions = {},
): string {
  const noun = options.noun ?? "Patient";

  /*
   * The same allowance the renderer consults.
   *
   * Reducing the pixels and leaving the label intact would put every withheld
   * fact into the accessible name — a screen-reader user hearing the date of
   * birth a waiting-room screen was built not to show. This function exists so
   * the two cannot disagree, and that only holds if it reads the same rule.
   */
  const allow = disclosureAllows(p.disclosure);
  const displayName = allow.name === "short" ? shortName(identity.name) : identity.name.text;
  const parts: string[] = [`${noun}: ${displayName}`];

  if (allow.pronouns && identity.pronouns) parts.push(identity.pronouns);
  if (allow.birthDate && identity.birthDate) parts.push(`born ${identity.birthDate.spoken}`);
  if (allow.age && identity.age) {
    parts.push(
      identity.age.atDeath ? `aged ${identity.age.text} at death` : `age ${identity.age.text}`,
    );
  }
  if (allow.clinicalSex && identity.spcu) {
    parts.push(`sex parameter for clinical use, ${identity.spcu.label}`);
  }

  if (allow.identifiers && options.identifiers !== false) {
    for (const id of identity.identifiers) {
      const assigner = id.assigner ? `, ${id.assigner}` : "";
      const masked = id.masked ? ", partially hidden" : "";
      parts.push(`${spellOut(id.label)} ${spellDigits(id.text)}${assigner}${masked}`);
      if (id.checkDigitValid === false) parts.push("this identifier fails its check digit");
    }
  }

  const states = stateLabel(identity, p);
  const status = states.length > 0 ? states : ["Active"];

  return `${parts.join(", ")}. ${status.join(". ")}.`;
}

/**
 * The announcement fired into a polite live region when the displayed patient
 * changes.
 *
 * A sighted user gets a full visual repaint. A screen-reader user gets nothing:
 * focus is wherever it was and the DOM swapped underneath them. Short on
 * purpose — the full label is available on the region itself, and this one has
 * to be over before the next thing they do.
 */
export function switchAnnouncement(identity: Identity): string {
  const born = identity.birthDate ? `, born ${identity.birthDate.spoken}` : "";
  return `Now viewing ${identity.name.text}${born}.`;
}

/**
 * Initials for an avatar.
 *
 * Nothing here infers gender, ethnicity, or anything else from a name — an
 * avatar is not a classifier. It picks characters, and the only intelligence in
 * it is about writing systems.
 */

import type { ResolvedName } from "./types.js";
import { graphemes, isCaseless, isIdeographic, isParticle, nameWords } from "./text.js";

/** Locales whose personal names are written family-name-first. */
const FAMILY_FIRST = new Set(["ja", "zh", "ko", "hu", "vi", "yue"]);

export function isFamilyFirstLocale(locale: string): boolean {
  return FAMILY_FIRST.has(locale.toLowerCase().split(/[-_]/)[0] ?? "");
}

/**
 * One or two characters, chosen for the script the name is written in.
 *
 * - Ideographic scripts (Han, Kana, Hangul) take **one** character. 陳美琳 as
 *   "CM" is nonsense and as "陳美" is most of the name.
 * - Everything else takes the first grapheme cluster of the first and last
 *   meaningful words. Grapheme clusters rather than code units, so `रामेश`
 *   yields `रा` — one cluster of two code points — rather than a bare
 *   consonant.
 * - Particles are skipped: `van der Berg` is `VB`.
 * - A mononym yields one character, not a doubled one. `Suryanto` is `S`.
 */
export function initialsFromText(text: string, locale = "en"): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (isIdeographic(trimmed)) {
    const first = graphemes(trimmed.replace(/\s+/g, ""))[0];
    return first ?? "";
  }

  const words = nameWords(trimmed);
  if (words.length === 0) return "";

  const meaningful = words.filter((w) => !isParticle(w));
  const pool = meaningful.length > 0 ? meaningful : words;

  const first = pool[0] ?? "";
  const last = pool.length > 1 ? (pool[pool.length - 1] ?? "") : "";

  const pick = (w: string): string => graphemes(w)[0] ?? "";
  const out = pool.length > 1 ? pick(first) + pick(last) : pick(first);

  // Skip the case pass for caseless scripts: `toUpperCase` is a no-op for
  // Devanagari and Thai, but it is emphatically not a no-op for Turkish
  // dotless i or Greek final sigma, and running it "just in case" is how a
  // name gets quietly misspelled.
  return isCaseless(out) ? out : out.toLocaleUpperCase(locale);
}

/**
 * Initials for a resolved name.
 *
 * Prefers the structured parts when the record has them, because
 * `given: ["Amara", "Chinelo"], family: "Okonkwo"` gives `AO` unambiguously
 * where the flattened text has to guess which word is the family name — and in
 * a family-first locale it would guess wrong.
 */
export function identityInitials(name: ResolvedName, locale = "en"): string {
  const given = name.given.filter((g) => g.trim().length > 0);
  const family = name.family?.trim();

  if (family && isIdeographic(family)) {
    return graphemes(family.replace(/\s+/g, ""))[0] ?? "";
  }
  if (!family && given.length === 0) {
    return initialsFromText(name.text, locale);
  }

  const firstGiven = given[0];
  const pick = (w: string | undefined): string => (w ? (graphemes(w)[0] ?? "") : "");

  let out: string;
  if (firstGiven && family) {
    out = isFamilyFirstLocale(locale)
      ? pick(family) + pick(firstGiven)
      : pick(firstGiven) + pick(family);
  } else {
    // A mononym: one initial. Doubling it to fill the circle would invent a
    // name part the record does not have.
    out = pick(firstGiven ?? family);
  }

  return isCaseless(out) ? out : out.toLocaleUpperCase(locale);
}

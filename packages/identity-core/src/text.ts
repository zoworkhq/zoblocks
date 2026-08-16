/**
 * Script-aware text primitives.
 *
 * Everything here exists because the obvious implementation — `name[0]`,
 * `toUpperCase()`, `split(" ")` — is correct for English and wrong for roughly
 * half the world's patients. A component library that gets a patient's initials
 * wrong is telling them, on every screen, that the system was not built for
 * them.
 */

/**
 * Split into grapheme clusters, so a Devanagari consonant with its vowel sign,
 * an emoji with a modifier, or a decomposed accented letter each count as one
 * character.
 *
 * `Intl.Segmenter` is available on every supported runtime (Node >= 20.11, all
 * current browsers). The fallback exists for the one environment that will
 * eventually turn up without it, and degrades to code points rather than to
 * UTF-16 units — which is still wrong for `रा`, but wrong in a way that renders
 * a letter rather than half a surrogate pair.
 */
export function graphemes(input: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(input), (s) => s.segment);
  }
  return Array.from(input);
}

/**
 * Script detection by code point, not by character class.
 *
 * A regex class spanning Devanagari or Arabic can match a combining mark on its
 * own, which splits a grapheme and is what `no-misleading-character-class`
 * exists to catch. Comparing code points sidesteps the whole category: it asks
 * about the base character, which is the actual question.
 */
interface Range {
  from: number;
  to: number;
}

const IDEOGRAPHIC_RANGES: Range[] = [
  { from: 0x3040, to: 0x30ff }, // Hiragana and Katakana
  { from: 0x3400, to: 0x4dbf }, // CJK Extension A
  { from: 0x4e00, to: 0x9fff }, // CJK Unified Ideographs
  { from: 0xf900, to: 0xfaff }, // CJK Compatibility Ideographs
  { from: 0xac00, to: 0xd7af }, // Hangul Syllables
  { from: 0x20000, to: 0x2ffff }, // CJK Extension B and beyond
];

const CASELESS_RANGES: Range[] = [
  { from: 0x0590, to: 0x05ff }, // Hebrew
  { from: 0x0600, to: 0x06ff }, // Arabic
  { from: 0x0900, to: 0x097f }, // Devanagari
  { from: 0x0e00, to: 0x0e7f }, // Thai
  ...IDEOGRAPHIC_RANGES,
];

function anyCodePointIn(input: string, ranges: Range[]): boolean {
  for (const char of input) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    for (const range of ranges) {
      if (cp >= range.from && cp <= range.to) return true;
    }
  }
  return false;
}

/**
 * Scripts whose "initials" are one character, not two.
 *
 * 陳美琳 initialised as "CM" is nonsense and initialised as "陳美" is most of the
 * name. One character is the convention these scripts actually use.
 */
export function isIdeographic(input: string): boolean {
  return anyCodePointIn(input, IDEOGRAPHIC_RANGES);
}

/**
 * Scripts with no letter case. Upper-casing them is a no-op, but calling
 * `toUpperCase` on Turkish or Greek text is *not* — dotted/dotless I and final
 * sigma both change — so the case pass is skipped rather than applied blindly.
 */
export function isCaseless(input: string): boolean {
  return anyCodePointIn(input, CASELESS_RANGES);
}

/**
 * Name particles that are not initials.
 *
 * `van der Berg` initialises to `VB`, not `VD`. `bint Salim` initialises on
 * `Salim`. Dropping these is the difference between initials that identify
 * someone and initials that identify a grammatical construction.
 */
const PARTICLES = new Set([
  "van",
  "von",
  "der",
  "den",
  "de",
  "del",
  "della",
  "di",
  "da",
  "dos",
  "das",
  "do",
  "la",
  "le",
  "les",
  "el",
  "al",
  "bin",
  "ibn",
  "bint",
  "binti",
  "abu",
  "umm",
  "mac",
  "mc",
  "st",
  "ter",
  "ten",
  "op",
  "af",
  "av",
  "zu",
  "y",
  "e",
  "i",
]);

/** Honorifics and credentials the record may carry in `prefix`/`suffix`. */
const TITLES = new Set([
  "mr",
  "mrs",
  "ms",
  "mx",
  "miss",
  "dr",
  "prof",
  "sir",
  "dame",
  "rev",
  "fr",
  "capt",
  "col",
  "lt",
  "sgt",
  "hon",
  "shri",
  "smt",
  "kum",
]);

/**
 * Generational and credential suffixes.
 *
 * "Ada Lovelace Jr." initialises to `AL`, not `AJ` — the suffix is a
 * disambiguator between father and child, which makes it exactly the kind of
 * thing the escalation ladder should surface as text and exactly the wrong
 * thing to put in a two-character circle.
 */
const SUFFIXES = new Set([
  "jr",
  "jnr",
  "sr",
  "snr",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "md",
  "do",
  "rn",
  "np",
  "pa",
  "phd",
  "esq",
  "dds",
  "dvm",
  "mbbs",
]);

export function isParticle(word: string): boolean {
  return PARTICLES.has(strip(word).toLowerCase());
}

export function isSuffix(word: string): boolean {
  return SUFFIXES.has(strip(word).toLowerCase());
}

export function isTitle(word: string): boolean {
  return TITLES.has(strip(word).toLowerCase());
}

function strip(word: string): string {
  return word.replace(/[.,()]/g, "");
}

/**
 * Case- and diacritic-folded form, for comparison only.
 *
 * `Nguyên` and `Nguyen` are routinely the same person entered twice and
 * routinely two different people on the same ward. Folding tells us they are
 * *indistinguishable to a reader in a hurry*, which is the question the
 * disambiguation pass is asking — it does not claim they are the same person.
 */
export function fold(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`´]/g, "")
    .replace(/[-‐-―]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Split a name string into meaningful words, dropping punctuation, titles and
 * particles. Hyphenated names split, because `Okonkwo-Adeyemi` is two names and
 * a reader scanning a list matches on either.
 */
export function nameWords(input: string): string[] {
  const words = input
    .replace(/[(),.]/g, " ")
    .split(/[\s\u00a0-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !isTitle(w));

  // Suffixes are dropped only when something else survives. A record whose
  // whole name is "V" is a person, not a regnal number, and this function's
  // job is not to decide that.
  const withoutSuffixes = words.filter((w) => !isSuffix(w));
  return withoutSuffixes.length > 0 ? withoutSuffixes : words;
}

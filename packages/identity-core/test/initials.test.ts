import { describe, expect, it } from "vitest";
import { identityInitials, initialsFromText, isFamilyFirstLocale } from "../src/initials.js";
import type { ResolvedName } from "../src/types.js";

function name(partial: Partial<ResolvedName>): ResolvedName {
  return { text: "", given: [], use: "official", isChosen: false, ...partial };
}

/**
 * The locale table.
 *
 * Each row is a name a real patient could have and an initials rendering that
 * would not embarrass the product. The rows that matter most are the ones the
 * obvious implementation gets wrong.
 */
const TABLE: Array<[string, string, string]> = [
  // [ input, locale, expected ]
  ["Amara Chinelo Okonkwo", "en", "AO"],
  ["Ada Lovelace", "en", "AL"],
  ["ada lovelace", "en", "AL"],
  ["Dr Ada Lovelace", "en", "AL"],
  ["Ada Lovelace Jr.", "en", "AL"],

  // Mononyms. One initial, not a doubled one.
  ["Suryanto", "id", "S"],
  ["Prince", "en", "P"],

  // Ideographic scripts take one character, not two letters.
  ["陳美琳", "zh", "陳"],
  ["田中花子", "ja", "田"],
  ["김민준", "ko", "김"],
  ["さくら", "ja", "さ"],

  // Grapheme clusters, not code units.
  ["रामेश कुलकर्णी", "hi", "राकु"],
  ["สมชาย ใจดี", "th", "สใ"],

  // Cyrillic and Greek have case; they get upper-cased.
  ["Иван Петров", "ru", "ИП"],
  ["Γιώργος Παπαδόπουλος", "el", "ΓΠ"],

  // Particles are not initials.
  ["Joris van der Meer", "nl", "JM"],
  ["Ludwig von Beethoven", "de", "LB"],
  ["Sofía Ramírez Cruz", "es", "SC"],
  ["Ahmed bin Salim", "ar", "AS"],
  ["Fatima bint Rashid", "ar", "FR"],

  // Hyphenated names split.
  ["Amara Okonkwo-Adeyemi", "en", "AA"],

  // Punctuation and extra whitespace do not survive.
  ["  Ada   Lovelace  ", "en", "AL"],
  ["O'Brien, Sean", "en", "OS"],

  // Degenerate input returns nothing rather than throwing.
  ["", "en", ""],
  ["   ", "en", ""],
];

describe("initialsFromText", () => {
  it.each(TABLE)("%s (%s) → %s", (input, locale, expected) => {
    expect(initialsFromText(input, locale)).toBe(expected);
  });

  it("never returns more than two grapheme clusters", () => {
    for (const [input, locale] of TABLE) {
      const out = initialsFromText(input, locale);
      expect(
        Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(out)).length,
      ).toBeLessThanOrEqual(2);
    }
  });

  it("does not lower-case Turkish dotted I into an ASCII i", () => {
    // toUpperCase on Turkish text is the classic locale trap. The output must
    // stay a Turkish capital, not become "I" via a naive round trip.
    const out = initialsFromText("İbrahim Yılmaz", "tr");
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain("i");
  });
});

describe("identityInitials", () => {
  it("prefers the structured parts over the flattened text", () => {
    const n = name({ text: "Okonkwo Amara", given: ["Amara"], family: "Okonkwo" });
    expect(identityInitials(n, "en")).toBe("AO");
  });

  it("reverses for a family-first locale", () => {
    const n = name({ text: "田中 花子", given: ["花子"], family: "田中" });
    // Ideographic short-circuits to one character regardless of order.
    expect(identityInitials(n, "ja")).toBe("田");

    const latin = name({ text: "Nagy Anna", given: ["Anna"], family: "Nagy" });
    expect(identityInitials(latin, "hu")).toBe("NA");
    expect(identityInitials(latin, "en")).toBe("AN");
  });

  it("handles a record with a family name and no given name", () => {
    const n = name({ text: "Okonkwo", family: "Okonkwo" });
    expect(identityInitials(n, "en")).toBe("O");
  });

  it("handles a record with a given name and no family name", () => {
    const n = name({ text: "Suryanto", given: ["Suryanto"] });
    expect(identityInitials(n, "id")).toBe("S");
  });

  it("falls back to the text when the record has no parts at all", () => {
    const n = name({ text: "Unidentified Adult Male" });
    expect(identityInitials(n, "en")).toBe("UM");
  });

  it("returns an empty string rather than throwing on an empty name", () => {
    expect(identityInitials(name({ text: "" }), "en")).toBe("");
  });
});

describe("isFamilyFirstLocale", () => {
  it.each(["ja", "zh", "ko", "hu", "zh-Hant", "ja-JP"])("%s is family-first", (l) => {
    expect(isFamilyFirstLocale(l)).toBe(true);
  });
  it.each(["en", "en-GB", "es", "hi", "ar", "de"])("%s is given-first", (l) => {
    expect(isFamilyFirstLocale(l)).toBe(false);
  });
});

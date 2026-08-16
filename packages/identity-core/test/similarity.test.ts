import { describe, expect, it } from "vitest";
import {
  SIMILARITY_THRESHOLD,
  jaro,
  jaroWinkler,
  looksAlike,
  metaphone,
  similarityReason,
} from "../src/similarity.js";
import { fold } from "../src/text.js";

describe("jaro", () => {
  it("matches the published reference values", () => {
    expect(jaro("MARTHA", "MARHTA")).toBeCloseTo(0.944, 3);
    expect(jaro("DIXON", "DICKSONX")).toBeCloseTo(0.767, 3);
    expect(jaro("JELLYFISH", "SMELLYFISH")).toBeCloseTo(0.896, 3);
  });
  it("is 1 for identical strings and 0 for an empty one", () => {
    expect(jaro("okonkwo", "okonkwo")).toBe(1);
    expect(jaro("", "okonkwo")).toBe(0);
    expect(jaro("okonkwo", "")).toBe(0);
  });
  it("is 0 for strings with nothing in common", () => {
    expect(jaro("abc", "xyz")).toBe(0);
  });
  it("is symmetric", () => {
    expect(jaro("nguyen", "nguyan")).toBeCloseTo(jaro("nguyan", "nguyen"), 10);
  });
});

describe("jaroWinkler", () => {
  it("matches the published reference values", () => {
    expect(jaroWinkler("MARTHA", "MARHTA")).toBeCloseTo(0.961, 3);
    expect(jaroWinkler("DIXON", "DICKSONX")).toBeCloseTo(0.813, 3);
  });
  it("rewards a shared prefix, which is what makes surnames hard to scan", () => {
    expect(jaroWinkler("okonkwo", "okonjo")).toBeGreaterThan(jaro("okonkwo", "okonjo"));
  });
  it("does not apply the bonus below the 0.7 floor", () => {
    expect(jaroWinkler("abc", "xyz")).toBe(jaro("abc", "xyz"));
  });
});

describe("metaphone", () => {
  it("collapses names that sound the same", () => {
    expect(metaphone("Smith")).toBe(metaphone("Smyth"));
    expect(metaphone("Katherine")).toBe(metaphone("Catherine"));
  });
  it("keeps names that sound different apart", () => {
    expect(metaphone("Okonkwo")).not.toBe(metaphone("Mensah"));
    expect(metaphone("Lovelace")).not.toBe(metaphone("Iyer"));
  });
  it("handles silent leading clusters", () => {
    expect(metaphone("Knight")).toBe(metaphone("Night"));
    expect(metaphone("Wright")).toBe(metaphone("Right"));
  });
  it("returns an empty string for input with no letters", () => {
    expect(metaphone("")).toBe("");
    expect(metaphone("123 456")).toBe("");
  });
  it("is bounded, so it cannot blow the bundle budget on a long name", () => {
    expect(metaphone("a".repeat(500)).length).toBeLessThanOrEqual(6);
  });
});

describe("looksAlike", () => {
  it("catches diacritic-only differences — the same person entered twice, or two people", () => {
    expect(looksAlike("Anh Nguyen", "Ánh Nguyên")).toBe(true);
    expect(similarityReason("Anh Nguyen", "Ánh Nguyên")).toBe("identical-folded");
  });

  it("catches near-spellings", () => {
    expect(looksAlike("Okonkwo", "Okonkwe")).toBe(true);
    expect(similarityReason("Okonkwo", "Okonkwe")).toBe("similar-spelling");
  });

  it("catches sound-alikes that look different", () => {
    expect(looksAlike("Smith", "Smyth")).toBe(true);
    expect(similarityReason("Smith", "Smyth")).toBe("sounds-alike");
  });

  it("does not fire on unrelated names", () => {
    expect(looksAlike("Amara Okonkwo", "Devraj Iyer")).toBe(false);
    expect(similarityReason("Amara Okonkwo", "Devraj Iyer")).toBeNull();
  });

  it("does not fire on the common South Asian surnames the threshold was tuned for", () => {
    // The reason the threshold is 0.92 and not 0.90. If these start firing,
    // every row on a ward list is escalated and the escalation stops meaning
    // anything.
    expect(looksAlike("Singh", "Sinha")).toBe(false);
    expect(looksAlike("Sharma", "Verma")).toBe(false);
  });

  it("is symmetric", () => {
    const pairs: Array<[string, string]> = [
      ["Okonkwo", "Okonjo"],
      ["Nguyen", "Nguyan"],
      ["Smith", "Smyth"],
      ["Lovelace", "Iyer"],
    ];
    for (const [a, b] of pairs) expect(looksAlike(a, b)).toBe(looksAlike(b, a));
  });

  it("is false when either side is empty", () => {
    expect(looksAlike("", "Okonkwo")).toBe(false);
    expect(looksAlike("Okonkwo", "   ")).toBe(false);
  });

  it("honours a caller-supplied threshold", () => {
    expect(looksAlike("Singh", "Sinha", 0.5)).toBe(true);
    expect(SIMILARITY_THRESHOLD).toBe(0.92);
  });
});

describe("fold", () => {
  it("strips diacritics, case, apostrophes and hyphens", () => {
    expect(fold("Ánh Nguyên")).toBe("anh nguyen");
    expect(fold("O'Brien")).toBe("obrien");
    expect(fold("Okonkwo-Adeyemi")).toBe("okonkwo adeyemi");
    expect(fold("  Ada   Lovelace ")).toBe("ada lovelace");
  });
  it("leaves non-Latin scripts intact", () => {
    expect(fold("陳美琳")).toBe("陳美琳");
  });
});

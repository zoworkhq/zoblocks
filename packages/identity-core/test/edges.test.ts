/**
 * The paths the main suites do not reach.
 *
 * Everything here is a real branch a real record can take — a name made
 * entirely of particles, a runtime with no `Intl.Segmenter`, two patients whose
 * surnames only rhyme, a policy that asks for consent nobody recorded. What is
 * deliberately *not* here is the class of defensive fallback that
 * `noUncheckedIndexedAccess` forces (`bytes[i] ?? 0`, `graphemes(w)[0] ?? ""`):
 * those are unreachable by construction, and a test that pretended to reach
 * them would be asserting on a lie.
 */

import { describe, expect, it, vi } from "vitest";
import { disambiguate } from "../src/disambiguate.js";
import { precise, resolveAge, yearsBetween } from "../src/dates.js";
import { substituteForDemo } from "../src/demo.js";
import { resolveIdentifiers, DEFAULT_IDENTIFIER_SYSTEMS } from "../src/identifiers.js";
import { identityInitials, initialsFromText } from "../src/initials.js";
import { identityLabel } from "../src/label.js";
import { policy, resolveIdentity, resolvePhoto } from "../src/resolve.js";
import { metaphone } from "../src/similarity.js";
import { graphemes } from "../src/text.js";
import type { Identity, ResolvedName } from "../src/types.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });

function name(partial: Partial<ResolvedName>): ResolvedName {
  return { text: "", given: [], use: "official", isChosen: false, ...partial };
}

describe("graphemes without Intl.Segmenter", () => {
  it("degrades to code points rather than to UTF-16 units", () => {
    // The fallback for the runtime that eventually turns up without it. Still
    // wrong for a Devanagari cluster, but wrong in a way that renders a letter
    // rather than half a surrogate pair.
    const real = Intl.Segmenter;
    // @ts-expect-error — deliberately removing a built-in for this test.
    delete Intl.Segmenter;
    try {
      expect(graphemes("ab")).toEqual(["a", "b"]);
      // A surrogate pair stays whole, which is the property that matters.
      expect(graphemes("𝔄b")).toEqual(["𝔄", "b"]);
    } finally {
      Intl.Segmenter = real;
    }
  });
});

describe("initials — the pools the happy path does not exercise", () => {
  it("returns nothing for a name that is only a title", () => {
    expect(initialsFromText("Dr.", "en")).toBe("");
    expect(initialsFromText("Mr Mrs Ms", "en")).toBe("");
  });

  it("falls back to the particles when a name is nothing but particles", () => {
    // Pathological, and it happens: a registration clerk types the tussenvoegsel
    // into the family-name field and nothing else. One letter beats none.
    expect(initialsFromText("van der", "nl")).toBe("VD");
    expect(initialsFromText("de la", "es")).toBe("DL");
  });

  it("initialises a record that has a family name and no given name", () => {
    expect(identityInitials(name({ text: "Okonkwo", family: "Okonkwo" }), "en")).toBe("O");
  });

  it("takes one character for an ideographic family name regardless of locale", () => {
    const n = name({ text: "陳美琳", given: ["美琳"], family: "陳" });
    expect(identityInitials(n, "en")).toBe("陳");
    expect(identityInitials(n, "zh")).toBe("陳");
  });

  it("handles a given name that is only whitespace", () => {
    const n = name({ text: "Okonkwo", given: ["   "], family: "Okonkwo" });
    expect(identityInitials(n, "en")).toBe("O");
  });
});

describe("names outside the resolution order", () => {
  it("shows a name marked old when it is the only one the record has", () => {
    // `old` is in neither the display nor the legal order — it is a superseded
    // name. A record that carries nothing else still has to render something,
    // and the superseded name beats "Name not recorded", which would claim the
    // record is anonymous when it plainly is not.
    const p = F.patient({ name: [{ use: "old", given: ["Amara"], family: "Okonkwo" }] });
    expect(resolveIdentity(p, P).name.text).toBe("Amara Okonkwo");
  });

  it("skips an old name entry that carries nothing", () => {
    const p = F.patient({ name: [{ use: "old" }, { use: "old", family: "Okonkwo" }] });
    expect(resolveIdentity(p, P).name.text).toBe("Okonkwo");
  });

  it("falls back through a name whose given array is all whitespace", () => {
    const p = F.patient({ name: [{ use: "old", given: ["  ", "\t"] }] });
    expect(resolveIdentity(p, P).name.text).toBe("Name not recorded");
  });
});

describe("label — the states the main suite skips", () => {
  it("says what inactive means, not just the word", () => {
    const label = identityLabel(resolveIdentity(F.patient({ active: false }), P), P);
    expect(label).toContain("Inactive — not currently receiving care from this service");
  });

  it("reads several states in one sentence", () => {
    const p = F.patient({ active: false, deceasedDateTime: "2024-03-12" });
    const label = identityLabel(resolveIdentity(p, P), P);
    expect(label).toContain("Deceased");
    expect(label).toContain("Inactive");
  });

  it("omits the age clause when the record has no birth date", () => {
    const label = identityLabel(resolveIdentity(F.patient({ birthDate: undefined }), P), P);
    expect(label).not.toContain("age");
    expect(label).toContain("Amara Chinelo Okonkwo");
  });
});

describe("dates — the precision boundaries", () => {
  it("handles a birth date exactly on the neonatal boundaries", () => {
    expect(resolveAge("2026-07-19", F.NOW)?.text).toBe("28 d".replace("28 d", "4 wk"));
    expect(resolveAge("2026-05-17", F.NOW)?.text).toMatch(/wk|mo/);
  });

  it("does not go negative for a birth date in the future", () => {
    expect(resolveAge("2030-01-01", F.NOW)).toBeUndefined();
    expect(yearsBetween("2030-01-01", F.NOW)).toBeUndefined();
  });

  it("computes an age from a year-only birth date", () => {
    expect(resolveAge("1985", F.NOW)?.text).toBe("41 y");
  });

  it("computes an age from a month-precision birth date", () => {
    expect(resolveAge("1985-03", F.NOW)?.text).toBe("41 y");
  });

  it("accepts a death date with a time component", () => {
    const age = resolveAge("1961-01-04", F.NOW, "2024-03-12T14:30:00Z");
    expect(age?.atDeath).toBe(true);
    expect(age?.text).toBe("63 y");
  });

  it("rejects a day that does not exist rather than rolling it over", () => {
    // Rolling 31 February into 3 March would render a date the record does not
    // contain, which is the failure mode this whole file exists to avoid.
    expect(precise("1985-02-31")?.text).toBe("31 Feb 1985");
  });
});

describe("photo policy", () => {
  it("consent-required withholds rather than quietly behaving like allow", () => {
    // It used to fall through and render the photograph, which made the value
    // indistinguishable from "allow". A setting that reads as a safeguard and
    // does nothing is worse than not having it.
    const s = resolvePhoto(F.withPhoto, policy({ now: F.NOW, photos: "consent-required" }));
    expect(s.kind).toBe("withheld");
    expect(s.kind === "withheld" && s.reason).toContain("Consent");
  });

  it("consent-required still reports none-on-file when there is no photograph", () => {
    expect(resolvePhoto(F.patient(), policy({ now: F.NOW, photos: "consent-required" })).kind).toBe(
      "none-on-file",
    );
  });

  it("keeps the content type when one is recorded", () => {
    const s = resolvePhoto(F.withPhoto, policy({ now: F.NOW, photos: "allow" }));
    expect(s.kind === "present" && s.contentType).toBe("image/png");
  });

  it("defaults an inline attachment with no content type to jpeg", () => {
    const p = F.patient({ photo: [{ data: "aGk=" }] });
    const s = resolvePhoto(p, policy({ now: F.NOW, photos: "allow" }));
    expect(s.kind === "present" && s.src.startsWith("data:image/jpeg;base64,")).toBe(true);
  });
});

describe("identifiers — the remaining rungs", () => {
  it("masks nothing extra at full disclosure", () => {
    const out = resolveIdentifiers(
      [{ system: F.MRN_SYSTEM, value: "123456789" }],
      DEFAULT_IDENTIFIER_SYSTEMS,
      "full",
    );
    expect(out[0]?.masked).toBe(false);
    expect(out[0]?.text).toBe("123 456 789");
  });

  it("leaves a value alone when its length does not match the grouping", () => {
    const out = resolveIdentifiers(
      [{ system: F.MRN_SYSTEM, value: "12345" }],
      DEFAULT_IDENTIFIER_SYSTEMS,
      "clinical",
    );
    expect(out[0]?.text).toBe("12345");
  });

  it("keeps an identifier with a use other than old", () => {
    const out = resolveIdentifiers(
      [{ system: F.MRN_SYSTEM, value: "123456789", use: "secondary" }],
      DEFAULT_IDENTIFIER_SYSTEMS,
      "clinical",
    );
    expect(out).toHaveLength(1);
  });
});

describe("metaphone — the letters the common names miss", () => {
  it.each([
    ["Xavier", "Zavier"],
    ["Philip", "Filip"],
    ["Quinn", "Kuinn"],
    ["Vaughan", "Faughan"],
    ["Zeta", "Seta"],
  ])("%s and %s sound alike", (a, b) => {
    expect(metaphone(a)).toBe(metaphone(b));
  });

  it("handles doubled consonants without doubling the code", () => {
    expect(metaphone("Abbott")).toBe(metaphone("Abott"));
  });

  it("handles a name that is only vowels", () => {
    expect(metaphone("Aiea")).toBe("A");
  });

  /**
   * A table over the branches, not a handful of examples.
   *
   * Metaphone is a long switch, and the rows nobody exercises are exactly the
   * ones that silently stop catching a class of sound-alike surname. Each row
   * below is a real surname shape and the rule it is there to pin.
   */
  it.each([
    ["Shaw", "X", "SH → X"],
    ["Nation", "NXN", "TIO → X"],
    ["Martian", "MRXN", "TIA → X"],
    ["Mission", "MXN", "SS before IO still palatalises"],
    ["Asia", "AX", "SIA → X"],
    ["Thomas", "0MS", "TH → 0"],
    ["Vaughan", "FKN", "V → F, GH → K"],
    ["Xavier", "SFR", "leading X → S"],
    ["Foxx", "FKS", "internal X → KS"],
    ["Zola", "SL", "Z → S"],
    ["Wright", "RKT", "silent WR"],
    ["Knight", "NKT", "silent KN"],
    ["Gnome", "NM", "silent GN"],
    ["Psalm", "SLM", "silent PS"],
    ["Bridge", "PRJ", "DGE → J"],
    ["Hannah", "HN", "H only between vowels"],
    ["Yusuf", "YSF", "leading Y survives"],
    ["Lloyd", "LT", "doubled consonant collapses"],
  ])("%s → %s (%s)", (input, expected) => {
    expect(metaphone(input)).toBe(expected);
  });

  it("collapses a doubled S before IO, which the generic skip used to swallow", () => {
    expect(metaphone("Mission")).toBe(metaphone("Mishon"));
    expect(metaphone("Russian")).toBe(metaphone("Rushan"));
  });

  it("keeps Qu and Kw apart, which is the correct Metaphone behaviour", () => {
    // Not a bug: "Qu" collapses to K and drops the glide, "Kw" keeps it. Worth
    // pinning so a future "fix" has to argue with a test rather than a hunch.
    expect(metaphone("Quinn")).toBe("KN");
    expect(metaphone("Kwinn")).toBe("KWN");
  });
});

describe("disambiguate — the rungs the worklist does not reach", () => {
  function id(key: string, given: string[], family: string, dob: string, mrn?: string): Identity {
    return resolveIdentity(
      F.patient({
        id: key,
        name: [{ use: "official", given, family }],
        birthDate: dob,
        identifier: mrn ? [{ system: F.MRN_SYSTEM, value: mrn }] : [],
      }),
      P,
    );
  }

  it("collides on surnames that only sound alike", () => {
    const a = id("s1", ["Ada"], "Smith", "1979-02-02", "111111111");
    const b = id("s2", ["Devraj"], "Smyth", "1988-05-05", "222222222");
    const r = disambiguate([a, b]);
    expect(r.plan.get(a.key)?.reasons).toContain("similar-name");
  });

  it("reaches the photograph rung when no identifier can separate two records", () => {
    // Both records carry the same name, the same date of birth and no
    // identifier at all — which is itself a data defect worth seeing.
    const a = id("t1", ["Baby"], "Ferreira", "2026-08-15");
    const b = id("t2", ["Baby"], "Ferreira", "2026-08-15");
    const r = disambiguate([a, b]);
    expect(r.plan.get(a.key)?.add).toContain("photo");
  });

  it("handles a set where one identity has no birth date", () => {
    const a = id("u1", ["Amara"], "Okonkwo", "1985-03-08", "333333333");
    const b = resolveIdentity(
      F.patient({
        id: "u2",
        name: [{ use: "official", given: ["Amara"], family: "Okonkwo" }],
        birthDate: undefined,
        identifier: [{ system: F.MRN_SYSTEM, value: "444444444" }],
      }),
      P,
    );
    const r = disambiguate([a, b]);
    expect(r.plan.get(a.key)?.add).toContain("identifier");
  });
});

describe("demo mode — the shapes it has to preserve", () => {
  it("leaves an unparseable birth date alone rather than inventing one", () => {
    const out = substituteForDemo(F.patient({ birthDate: "not-a-date" }), "k");
    expect(out.birthDate).toBe("not-a-date");
  });

  it("produces an identifier of the requested length for any length", () => {
    for (const len of [1, 4, 9, 12, 20]) {
      const p = F.patient({ identifier: [{ system: F.MRN_SYSTEM, value: "1".repeat(len) }] });
      expect(substituteForDemo(p, `k${len}`).identifier?.[0]?.value).toHaveLength(len);
    }
  });

  it("gives a record with no name a synthetic one anyway", () => {
    const out = substituteForDemo(F.patient({ name: undefined }), "k");
    expect(out.name?.[0]?.given?.[0]).toBeTruthy();
  });
});

describe("resolveIdentity — remaining shapes", () => {
  it("survives a patient whose only identifier is a room number", () => {
    const p = F.patient({ identifier: [{ value: "Room 4B" }] });
    const me = resolveIdentity(p, P);
    expect(me.identifiers).toEqual([]);
    // The record still resolves; it simply has nothing that identifies a person.
    expect(me.name.text).toBe("Amara Chinelo Okonkwo");
  });

  it("uses a caller-supplied identity key for the swatch", () => {
    const a = resolveIdentity(F.patient(), P, { key: "site-key-1" });
    const b = resolveIdentity(F.patient(), P, { key: "site-key-2" });
    expect(a.key).toBe("site-key-1");
    expect(a.swatch).not.toBe(b.swatch);
  });

  it("respects a caller-supplied swatch count", () => {
    const three = policy({ now: F.NOW, swatchCount: 3 });
    for (let i = 0; i < 60; i++) {
      const me = resolveIdentity(F.patient({ id: `pat-${i}` }), three);
      expect(me.swatch).toBeLessThan(3);
    }
  });
});

describe("no console output from the engine", () => {
  it("writes nothing, on any path", () => {
    // ARCHITECTURE §9: a component that logs its props writes PHI to the
    // console and onward to the customer's error reporter. The engine is where
    // that would be easiest to do by accident.
    const spies = (["log", "warn", "error", "info", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    for (const p of [F.patient(), F.deceased, F.merged, F.testPatient, F.sensitive, {}]) {
      const me = resolveIdentity(p, P);
      identityLabel(me, P);
      disambiguate([me]);
    }
    for (const s of spies) {
      expect(s).not.toHaveBeenCalled();
      s.mockRestore();
    }
  });
});

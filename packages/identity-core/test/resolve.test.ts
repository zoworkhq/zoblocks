import { describe, expect, it } from "vitest";
import {
  DEFAULT_POLICY,
  IdentityCache,
  identityKey,
  policy,
  resolveIdentity,
  resolveName,
  resolvePhoto,
  resolvePronouns,
  resolveSensitivity,
  resolveStates,
} from "../src/resolve.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });

describe("identityKey", () => {
  it("prefers the resource id", () => {
    expect(identityKey(F.patient())).toBe("pat-4471");
  });
  it("falls back to an identifier, then to a name", () => {
    expect(identityKey(F.patient({ id: undefined }))).toBe("123456789");
    expect(identityKey(F.patient({ id: undefined, identifier: [] }))).toBe("Okonkwo");
  });
  it("honours an explicit override", () => {
    expect(identityKey(F.patient(), "site-key-9")).toBe("site-key-9");
  });
  it("never throws on an empty resource", () => {
    expect(identityKey({})).toBe("unknown");
  });
});

describe("resolveName", () => {
  it("shows the chosen name, not the legal one", () => {
    const n = resolveName(F.chosenName, P);
    expect(n.text).toBe("Robin Ferreira");
    expect(n.isChosen).toBe(true);
    expect(n.legalText).toBe("Robert James Ferreira");
  });

  it("shows the legal name when the policy asks for it", () => {
    const n = resolveName(F.chosenName, policy({ nameContext: "legal", now: F.NOW }));
    expect(n.text).toBe("Robert James Ferreira");
    expect(n.isChosen).toBe(false);
  });

  it("reorders for a family-first locale", () => {
    const n = resolveName(F.patient(), policy({ locale: "ja", now: F.NOW }));
    expect(n.text).toBe("Okonkwo Amara Chinelo");
  });

  it("prefers HumanName.text when the record supplies it", () => {
    const n = resolveName(
      F.patient({ name: [{ use: "official", text: "Dr Amara C Okonkwo" }] }),
      P,
    );
    expect(n.text).toBe("Dr Amara C Okonkwo");
  });

  it("states the absence rather than rendering a blank", () => {
    // CONTENT.md §1: an interface that omits a fact it already has is making a
    // claim. An unidentified admission is a real state and gets real words.
    expect(resolveName(F.unnamed, P).text).toBe("Name not recorded");
    expect(resolveName({}, P).text).toBe("Name not recorded");
  });

  it("keeps a mononym as a mononym", () => {
    const n = resolveName(F.mononym, P);
    expect(n.text).toBe("Suryanto");
    expect(n.family).toBeUndefined();
  });

  it("ignores a name entry that is structurally present but empty", () => {
    const n = resolveName(
      F.patient({ name: [{ use: "usual" }, { use: "official", family: "Okonkwo" }] }),
      P,
    );
    expect(n.text).toBe("Okonkwo");
  });

  it("falls back to any name with content when no `use` is in the order", () => {
    // `old` is a member of NameUse but appears in neither DISPLAY_ORDER nor
    // LEGAL_ORDER, so a record carrying only that reaches `pick`'s final
    // fallback. Reporting "Name not recorded" for a patient whose name is
    // right there in the record would be the interface lying about what it
    // holds — the exact failure `states the absence` guards the other way.
    const onlyOld = F.patient({ name: [{ use: "old", family: "Okonkwo", given: ["Amara"] }] });
    expect(resolveName(onlyOld, P).text).toBe("Amara Okonkwo");
    expect(resolveName(onlyOld, policy({ nameContext: "legal", now: F.NOW })).text).toBe(
      "Amara Okonkwo",
    );

    // The empty-entry guard still applies inside the fallback: an `old` entry
    // with no content must not win over a later one that has some.
    const emptyThenReal = F.patient({
      name: [{ use: "old" }, { use: "old", text: "Amara C Okonkwo" }],
    });
    expect(resolveName(emptyThenReal, P).text).toBe("Amara C Okonkwo");

    // Given-only, so the fallback's content check has to reach `given` rather
    // than short-circuiting on `text` or `family` — the mononym shape, which
    // is the one most likely to be dropped by a "has a family name" test.
    const givenOnly = F.patient({ name: [{ use: "old", given: ["Suryanto"] }] });
    expect(resolveName(givenOnly, P).text).toBe("Suryanto");
  });
});

describe("resolvePronouns", () => {
  it("reads the nested R5 extension form", () => {
    expect(resolvePronouns(F.chosenName)).toBe("they/them");
  });
  it("reads the flattened form some servers emit", () => {
    const p = F.patient({
      extension: [
        {
          url: "http://hl7.org/fhir/StructureDefinition/individual-pronouns",
          valueString: "she/her",
        },
      ],
    });
    expect(resolvePronouns(p)).toBe("she/her");
  });
  it("is undefined when absent", () => {
    expect(resolvePronouns(F.patient())).toBeUndefined();
  });
});

describe("resolveSensitivity", () => {
  it("reads ActCode labels", () => {
    expect(resolveSensitivity(F.sensitive).sort()).toEqual(["ETH", "PSY"]);
  });
  it("reads HTEST from either security or tag", () => {
    expect(resolveSensitivity(F.testPatient)).toContain("HTEST");
    const tagged = F.patient({ meta: { tag: [{ code: "HTEST" }] } });
    expect(resolveSensitivity(tagged)).toContain("HTEST");
  });
  it("ignores codes it does not recognise", () => {
    const p = F.patient({ meta: { security: [{ code: "BANANA" }] } });
    expect(resolveSensitivity(p)).toEqual([]);
  });
  it("is empty for a plain record", () => {
    expect(resolveSensitivity(F.patient())).toEqual([]);
  });
});

describe("resolveStates", () => {
  it("distinguishes deceased from inactive", () => {
    const dead = resolveStates(F.deceased, P);
    expect(dead.map((s) => s.kind)).toEqual(["deceased"]);
    const inactive = resolveStates(F.patient({ active: false }), P);
    expect(inactive.map((s) => s.kind)).toEqual(["inactive"]);
  });

  it("carries the date of death when the record has one", () => {
    const s = resolveStates(F.deceased, P)[0];
    expect(s?.kind === "deceased" && s.date?.text).toBe("12 Mar 2024");
  });

  it("handles deceasedBoolean without a date", () => {
    const s = resolveStates(F.patient({ deceasedBoolean: true }), P)[0];
    expect(s?.kind).toBe("deceased");
    expect(s?.kind === "deceased" && s.date).toBeUndefined();
  });

  it("reports a merged record as merged, not inactive", () => {
    const s = resolveStates(F.merged, P);
    expect(s.map((x) => x.kind)).toEqual(["merged"]);
    expect(s[0]?.kind === "merged" && s[0].into.reference).toBe("Patient/pat-3099");
  });

  it("ignores a link that is not replaced-by", () => {
    const p = F.patient({ link: [{ other: { reference: "Patient/x" }, type: "seealso" }] });
    expect(resolveStates(p, P)).toEqual([]);
  });

  it("reports a test record", () => {
    expect(resolveStates(F.testPatient, P).map((s) => s.kind)).toContain("test");
  });

  it("reports restriction without folding HTEST into it", () => {
    const s = resolveStates(F.sensitive, P);
    const restricted = s.find((x) => x.kind === "restricted");
    expect(restricted?.kind === "restricted" && restricted.codes.sort()).toEqual(["ETH", "PSY"]);
  });

  it("can report several states at once", () => {
    const p = F.patient({ active: false, deceasedDateTime: "2024-03-12" });
    expect(
      resolveStates(p, P)
        .map((s) => s.kind)
        .sort(),
    ).toEqual(["deceased", "inactive"]);
  });
});

describe("resolvePhoto", () => {
  it("denies by default — presence is not consent", () => {
    expect(resolvePhoto(F.withPhoto, DEFAULT_POLICY).kind).toBe("withheld");
    expect(policy().photos).toBe("deny");
  });

  it("reports none-on-file when there is genuinely no photo", () => {
    expect(resolvePhoto(F.patient(), policy({ photos: "allow" })).kind).toBe("none-on-file");
    // Even under deny: nothing was withheld, because there was nothing there.
    expect(resolvePhoto(F.patient(), DEFAULT_POLICY).kind).toBe("none-on-file");
  });

  it("returns the url when allowed", () => {
    const s = resolvePhoto(F.withPhoto, policy({ photos: "allow" }));
    expect(s).toMatchObject({ kind: "present", src: "https://pacs.example.org/p/4471.png" });
  });

  it("builds a data url from inline base64", () => {
    const p = F.patient({ photo: [{ contentType: "image/png", data: "aGk=" }] });
    const s = resolvePhoto(p, policy({ photos: "allow" }));
    expect(s.kind === "present" && s.src.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("reports unavailable for an attachment with neither url nor data", () => {
    const p = F.patient({ photo: [{ contentType: "image/png", title: "x" }] });
    expect(resolvePhoto(p, policy({ photos: "allow" })).kind).toBe("none-on-file");
  });
});

describe("resolveIdentity", () => {
  it("produces the whole value", () => {
    const me = resolveIdentity(F.patient(), P);
    expect(me.key).toBe("pat-4471");
    expect(me.name.text).toBe("Amara Chinelo Okonkwo");
    expect(me.initials).toBe("AO");
    expect(me.birthDate?.text).toBe("08 Mar 1985");
    expect(me.age?.text).toBe("41 y");
    expect(me.identifiers[0]?.text).toBe("123 456 789");
    expect(me.states).toEqual([]);
    expect(me.swatch).toBeGreaterThanOrEqual(0);
    expect(me.swatch).toBeLessThan(6);
  });

  it("never resolves Patient.gender", () => {
    // The fixture has gender: "male" and an SPCU of female-typical. A component
    // that read gender would dose off the wrong one.
    const me = resolveIdentity(F.withSpcu, P);
    expect(me.spcu?.label).toBe("female-typical");
    expect(JSON.stringify(me)).not.toContain('"male"');
    expect(me).not.toHaveProperty("gender");
  });

  it("resolves gender identity and recorded sex separately from SPCU", () => {
    const me = resolveIdentity(F.withSpcu, P);
    expect(me.genderIdentity?.label).toBe("Female");
    expect(me.recordedSexOrGender?.label).toBe("Male");
    expect(me.spcu?.label).toBe("female-typical");
  });

  it("freezes age at death", () => {
    const me = resolveIdentity(F.deceased, P);
    expect(me.age?.text).toBe("63 y");
    expect(me.age?.atDeath).toBe(true);
  });

  it("uses day precision for a neonate", () => {
    expect(resolveIdentity(F.neonate, P).age?.text).toBe("6 d");
  });

  it("hashes the key, not the name", () => {
    const before = resolveIdentity(F.patient(), P);
    const renamed = resolveIdentity(
      F.patient({ name: [{ use: "official", given: ["Amara"], family: "Lindqvist" }] }),
      P,
    );
    expect(renamed.swatch).toBe(before.swatch);
    expect(renamed.name.text).not.toBe(before.name.text);
  });

  it("is byte-identical across repeated calls — hydration safety", () => {
    const a = JSON.stringify(resolveIdentity(F.patient(), P));
    for (let i = 0; i < 50; i++) {
      expect(JSON.stringify(resolveIdentity(F.patient(), P))).toBe(a);
    }
  });

  it("does not mutate the input resource", () => {
    const p = F.patient();
    const snapshot = JSON.stringify(p);
    resolveIdentity(p, policy({ demoMode: true, now: F.NOW }));
    expect(JSON.stringify(p)).toBe(snapshot);
  });

  it("substitutes a synthetic identity in demo mode, keyed off the real record", () => {
    const demo = policy({ demoMode: true, now: F.NOW });
    const a = resolveIdentity(F.patient(), demo);
    const b = resolveIdentity(F.patient(), demo);
    expect(a.name.text).toBe(b.name.text);
    expect(a.name.text).not.toBe("Amara Chinelo Okonkwo");
    expect(a.key).toBe("pat-4471");
    expect(a.swatch).toBe(resolveIdentity(F.patient(), P).swatch);
  });

  it("survives a completely empty resource", () => {
    const me = resolveIdentity({}, P);
    expect(me.name.text).toBe("Name not recorded");
    expect(me.identifiers).toEqual([]);
    expect(me.photo.kind).toBe("none-on-file");
  });
});

describe("IdentityCache", () => {
  it("returns the same object for the same key and policy", () => {
    const cache = new IdentityCache(10);
    const a = cache.resolve(F.patient(), P);
    const b = cache.resolve(F.patient(), P);
    expect(a).toBe(b);
  });

  it("invalidates when the policy version changes", () => {
    // Without the version in the key, two thousand patients stay rendered under
    // the previous disclosure level — a privacy defect, not a perf one.
    const cache = new IdentityCache(10);
    const clinical = policy({ now: F.NOW, version: "v1" });
    const reception = policy({ now: F.NOW, disclosure: "reception", version: "v2" });
    const a = cache.resolve(F.patient(), clinical);
    const b = cache.resolve(F.patient(), reception);
    expect(a).not.toBe(b);
    expect(a.identifiers[0]?.masked).toBe(false);
    expect(b.identifiers[0]?.masked).toBe(true);
  });

  it("evicts least-recently-used past its bound", () => {
    const cache = new IdentityCache(2);
    cache.resolve(F.patient({ id: "a" }), P);
    cache.resolve(F.patient({ id: "b" }), P);
    cache.resolve(F.patient({ id: "a" }), P); // refresh a
    cache.resolve(F.patient({ id: "c" }), P); // should evict b
    expect(cache.size).toBe(2);
  });

  it("clears", () => {
    const cache = new IdentityCache(4);
    cache.resolve(F.patient(), P);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

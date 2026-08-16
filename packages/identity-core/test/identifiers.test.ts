import { describe, expect, it } from "vitest";
import {
  DEFAULT_IDENTIFIER_SYSTEMS,
  group,
  isLocationLike,
  luhn,
  mask,
  nhsCheckDigit,
  resolveIdentifiers,
  verhoeff,
  verhoeffCheckDigit,
  verhoeffValid,
} from "../src/identifiers.js";
import {
  ABHA_SYSTEM,
  INVALID_NHS,
  MRN_SYSTEM,
  NHS_SYSTEM,
  VALID_ABHA,
  VALID_NHS,
} from "./fixtures.js";

describe("nhsCheckDigit", () => {
  it("accepts a valid NHS number", () => {
    expect(nhsCheckDigit(VALID_NHS)).toBe(true);
    expect(nhsCheckDigit("943 476 5919")).toBe(true);
  });
  it("rejects a wrong check digit", () => {
    expect(nhsCheckDigit(INVALID_NHS)).toBe(false);
  });
  it("rejects the wrong length", () => {
    expect(nhsCheckDigit("123")).toBe(false);
    expect(nhsCheckDigit("94347659190")).toBe(false);
  });
  it("rejects a number whose check digit would be 10", () => {
    // Remainder 1 gives check digit 10, which is not a digit — the number is
    // invalid outright rather than this function being wrong.
    expect(nhsCheckDigit("0000000010")).toBe(false);
  });
});

describe("verhoeff", () => {
  it("matches the canonical published example", () => {
    // Verhoeff's own worked example: the check digit for 236 is 3.
    expect(verhoeffCheckDigit("236")).toBe(3);
    expect(verhoeffValid("2363")).toBe(true);
  });

  it("accepts a valid twelve-digit value", () => {
    expect(verhoeff(VALID_ABHA)).toBe(true);
  });

  it("catches every single-digit corruption", () => {
    // The guarantee Verhoeff actually makes. Worth asserting exhaustively
    // rather than with one example, because a transcribed table is easy to get
    // subtly wrong and this is the only thing that would notice.
    for (let pos = 0; pos < VALID_ABHA.length; pos++) {
      for (let d = 0; d <= 9; d++) {
        if (String(d) === VALID_ABHA[pos]) continue;
        const corrupted = VALID_ABHA.slice(0, pos) + d + VALID_ABHA.slice(pos + 1);
        expect(verhoeff(corrupted), `${corrupted} should be rejected`).toBe(false);
      }
    }
  });

  it("catches every adjacent transposition", () => {
    for (let i = 0; i < VALID_ABHA.length - 1; i++) {
      const a = VALID_ABHA[i];
      const b = VALID_ABHA[i + 1];
      if (a === b) continue;
      const swapped = VALID_ABHA.slice(0, i) + b + a + VALID_ABHA.slice(i + 2);
      expect(verhoeff(swapped), `${swapped} should be rejected`).toBe(false);
    }
  });

  it("rejects the wrong length", () => {
    expect(verhoeff("2345678901")).toBe(false);
    expect(verhoeffValid("2")).toBe(false);
  });
});

describe("luhn", () => {
  it("accepts a valid value", () => {
    expect(luhn("79927398713")).toBe(true);
  });
  it("rejects an invalid one", () => {
    expect(luhn("79927398710")).toBe(false);
  });
  it("rejects input that is too short to check", () => {
    expect(luhn("7")).toBe(false);
  });
});

describe("group", () => {
  it("groups digits for reading without changing the value", () => {
    expect(group("123456789", [3, 3, 3])).toBe("123 456 789");
    expect(group("123456789", [3, 3, 3]).replace(/\s/g, "")).toBe("123456789");
  });
  it("leaves the value alone when the length does not match the pattern", () => {
    expect(group("12345", [3, 3, 3])).toBe("12345");
  });
  it("leaves the value alone with no pattern", () => {
    expect(group("123456789")).toBe("123456789");
    expect(group("123456789", [])).toBe("123456789");
  });
});

describe("mask", () => {
  it("keeps the requested number of trailing characters", () => {
    expect(mask("123456789", 3)).toBe("••••••789");
  });
  it("hides everything at zero", () => {
    expect(mask("123456789", 0)).toBe("•••••••••");
  });
  it("uses bullets, not asterisks", () => {
    // An asterisk reads as a footnote marker, and has been mistaken for one on
    // a printed banner.
    expect(mask("123456789", 3)).not.toContain("*");
  });
  it("does not lengthen a short value", () => {
    expect(mask("12", 4)).toBe("12");
  });
});

describe("isLocationLike", () => {
  it.each(["Room 4", "bed 12", "Bay 3", "WARD 4B", "Cubicle 2"])("%s is a location", (v) => {
    expect(isLocationLike(v)).toBe(true);
  });
  it.each(["123456789", "9434765919", "Roomy Smith"])("%s is not", (v) => {
    expect(isLocationLike(v)).toBe(false);
  });
  it("is false for nothing", () => {
    expect(isLocationLike(undefined)).toBe(false);
  });
});

describe("resolveIdentifiers", () => {
  const systems = DEFAULT_IDENTIFIER_SYSTEMS;

  it("labels a known system and carries its assigner", () => {
    const [id] = resolveIdentifiers(
      [{ system: MRN_SYSTEM, value: "123456789", assigner: { display: "St Aidan's" } }],
      systems,
      "clinical",
    );
    expect(id).toMatchObject({
      kind: "mrn",
      label: "MRN",
      text: "123 456 789",
      assigner: "St Aidan's",
    });
    expect(id?.masked).toBe(false);
  });

  it("renders an unrecognised system as unrecognised rather than relabelling it", () => {
    const [id] = resolveIdentifiers(
      [{ system: "http://elsewhere.example/id", value: "XYZ1" }],
      systems,
      "clinical",
    );
    expect(id?.kind).toBe("unknown");
    expect(id?.label).toBe("Identifier");
  });

  it("says so when an identifier arrives with no system at all", () => {
    const [id] = resolveIdentifiers([{ value: "XYZ1" }], systems, "clinical");
    expect(id?.label).toBe("Unlabelled identifier");
  });

  it("drops a room number — NPSG.01.01.01 excludes location", () => {
    const out = resolveIdentifiers(
      [{ system: MRN_SYSTEM, value: "123456789" }, { value: "Room 4B" }],
      systems,
      "clinical",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.kind).toBe("mrn");
  });

  it("drops an old identifier so a reader gets one answer", () => {
    const out = resolveIdentifiers(
      [
        { system: MRN_SYSTEM, value: "123456789" },
        { system: MRN_SYSTEM, value: "000111222", use: "old" },
      ],
      systems,
      "clinical",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.raw).toBe("123456789");
  });

  it("validates a check digit when the system has one", () => {
    const ok = resolveIdentifiers([{ system: NHS_SYSTEM, value: VALID_NHS }], systems, "clinical");
    const bad = resolveIdentifiers(
      [{ system: NHS_SYSTEM, value: INVALID_NHS }],
      systems,
      "clinical",
    );
    expect(ok[0]?.checkDigitValid).toBe(true);
    expect(bad[0]?.checkDigitValid).toBe(false);
  });

  it("validates ABHA with Verhoeff", () => {
    const out = resolveIdentifiers(
      [{ system: ABHA_SYSTEM, value: VALID_ABHA }],
      systems,
      "clinical",
    );
    expect(out[0]?.kind).toBe("abha");
    expect(out[0]?.checkDigitValid).toBe(true);
  });

  it("masks at reception and shows nothing at all in public", () => {
    const rec = resolveIdentifiers(
      [{ system: MRN_SYSTEM, value: "123456789" }],
      systems,
      "reception",
    );
    expect(rec[0]?.text).toBe("••••••789");
    expect(rec[0]?.masked).toBe(true);

    const pub = resolveIdentifiers([{ system: MRN_SYSTEM, value: "123456789" }], systems, "public");
    expect(pub[0]?.text).not.toContain("789");
  });

  it("never unmasks an SSN, at any disclosure level", () => {
    for (const level of ["reception", "clinical", "full"] as const) {
      const out = resolveIdentifiers(
        [{ system: "http://hl7.org/fhir/sid/us-ssn", value: "123456789" }],
        systems,
        level,
      );
      expect(out[0]?.text).not.toContain("6789");
      expect(out[0]?.masked).toBe(true);
    }
  });

  it("keeps the raw value available for matching even when masked", () => {
    const out = resolveIdentifiers(
      [{ system: MRN_SYSTEM, value: "123456789" }],
      systems,
      "reception",
    );
    expect(out[0]?.raw).toBe("123456789");
  });

  it("sorts by system weight so the primary identifier leads", () => {
    const out = resolveIdentifiers(
      [
        { system: "http://hl7.org/fhir/sid/us-ssn", value: "123456789" },
        { system: MRN_SYSTEM, value: "123456789" },
      ],
      systems,
      "clinical",
    );
    expect(out[0]?.kind).toBe("mrn");
  });

  it("skips empty values and returns an empty list for nothing", () => {
    expect(resolveIdentifiers(undefined, systems, "clinical")).toEqual([]);
    expect(resolveIdentifiers([{ value: "   " }], systems, "clinical")).toEqual([]);
  });
});

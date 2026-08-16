import { describe, expect, it } from "vitest";
import { identityLabel, spellDigits, spellOut, switchAnnouncement } from "../src/label.js";
import { policy, resolveIdentity } from "../src/resolve.js";
import * as F from "./fixtures.js";

const P = policy({ now: F.NOW });

describe("spellOut", () => {
  it("spaces an initialism so a screen reader says the letters", () => {
    // Unspaced, every major screen reader pronounces this "mern".
    expect(spellOut("MRN")).toBe("M R N");
    expect(spellOut("NHS number")).toBe("N H S number");
    expect(spellOut("ABHA number")).toBe("A B H A number");
  });
  it("leaves ordinary words alone", () => {
    expect(spellOut("Medicare")).toBe("Medicare");
    expect(spellOut("Identifier")).toBe("Identifier");
  });
});

describe("spellDigits", () => {
  it("groups digits so they are read as digits, not as a quantity", () => {
    expect(spellDigits("123456789")).toBe("123, 456, 789");
    expect(spellDigits("123 456 789")).toBe("123, 456, 789");
  });
  it("leaves a non-numeric value alone", () => {
    expect(spellDigits("AB-123")).toBe("AB-123");
  });
  it("handles a masked value", () => {
    expect(spellDigits("••••••789")).toContain(",");
  });
});

describe("identityLabel", () => {
  it("composes one sentence a screen reader can read as a person", () => {
    const label = identityLabel(resolveIdentity(F.patient(), P), P);
    expect(label).toBe(
      "Patient: Amara Chinelo Okonkwo, born 8 March 1985, age 41 y, M R N 123, 456, 789, St Aidan's. Active.",
    );
  });

  it("says Active rather than saying nothing", () => {
    // A patient whose status failed to load and an active patient must not
    // sound identical.
    expect(identityLabel(resolveIdentity(F.patient(), P), P)).toContain("Active.");
  });

  it("names the state instead when there is one", () => {
    const dead = identityLabel(resolveIdentity(F.deceased, P), P);
    expect(dead).toContain("Deceased, died 12 March 2024");
    expect(dead).toContain("aged 63 y at death");
    expect(dead).not.toContain("Active");
  });

  it("explains a merged record rather than calling it inactive", () => {
    expect(identityLabel(resolveIdentity(F.merged, P), P)).toContain("care is recorded elsewhere");
  });

  it("names a test record as not a person", () => {
    expect(identityLabel(resolveIdentity(F.testPatient, P), P)).toContain(
      "Test record, not a person",
    );
  });

  it("says a record is sensitive without naming the categories below full disclosure", () => {
    // Naming them here would hand a screen-reader user the thing the audited
    // reveal exists to record — an accessibility path around a disclosure
    // control, and a case of the label disagreeing with the pixels.
    const label = identityLabel(resolveIdentity(F.sensitive, P), P);
    expect(label).toContain("Sensitive record");
    expect(label).not.toMatch(/Substance use|Psychiatry/);
    expect(label).not.toContain("ETH");
  });

  it("names the categories in words, not codes, at full disclosure", () => {
    const full = policy({ now: F.NOW, disclosure: "full" });
    const label = identityLabel(resolveIdentity(F.sensitive, full), full);
    expect(label).toMatch(/Substance use|Psychiatry/);
    expect(label).not.toContain("ETH");
  });

  it("includes pronouns when the record has them", () => {
    expect(identityLabel(resolveIdentity(F.chosenName, P), P)).toContain("they/them");
  });

  it("labels the SPCU rather than emitting a bare letter", () => {
    const label = identityLabel(resolveIdentity(F.withSpcu, P), P);
    expect(label).toContain("sex parameter for clinical use, female-typical");
  });

  it("says when an identifier is partially hidden", () => {
    const masked = policy({ now: F.NOW, disclosure: "reception" });
    expect(identityLabel(resolveIdentity(F.patient(), masked), masked)).toContain(
      "partially hidden",
    );
  });

  it("flags a failing check digit in the spoken label", () => {
    const p = F.patient({ identifier: [{ system: F.NHS_SYSTEM, value: F.INVALID_NHS }] });
    expect(identityLabel(resolveIdentity(p, P), P)).toContain("fails its check digit");
  });

  it("can omit identifiers for a chip inside a long list", () => {
    const label = identityLabel(resolveIdentity(F.patient(), P), P, { identifiers: false });
    expect(label).not.toContain("M R N");
    expect(label).toContain("Amara Chinelo Okonkwo");
  });

  it("takes a different noun for a practitioner", () => {
    const label = identityLabel(resolveIdentity(F.patient(), P), P, { noun: "Clinician" });
    expect(label.startsWith("Clinician:")).toBe(true);
  });

  it("never leaks a name into an empty record's label", () => {
    expect(identityLabel(resolveIdentity({}, P), P)).toContain("Name not recorded");
  });
});

describe("switchAnnouncement", () => {
  it("is short, and says who is now on screen", () => {
    expect(switchAnnouncement(resolveIdentity(F.patient(), P))).toBe(
      "Now viewing Amara Chinelo Okonkwo, born 8 March 1985.",
    );
  });
  it("omits the date when the record has none", () => {
    const p = F.patient({ birthDate: undefined });
    expect(switchAnnouncement(resolveIdentity(p, P))).toBe("Now viewing Amara Chinelo Okonkwo.");
  });
  it("carries no identifier — a live region is announced out loud", () => {
    expect(switchAnnouncement(resolveIdentity(F.patient(), P))).not.toContain("123");
  });
});

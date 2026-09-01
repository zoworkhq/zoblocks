/**
 * The predicate that guards the `armed → recording` edge.
 *
 * There are no sentences in `consent.ts` and there are none asserted here:
 * the module returns a verdict and the host writes the copy, because deciding
 * what a lawful basis is, is not an engineering decision. What is asserted is
 * the one rule the file exists to hold — that the detail beats the summary. A
 * component that believes `coversAll: true` over a participant who said no is
 * a component that will start recording someone who declined.
 */

import { describe, expect, it } from "vitest";

import { isConsentResolved, resolveConsent, uncoveredParticipants } from "../src/consent";
import type { ConsentVerdict, RecorderConsent, RecorderParticipant } from "../src/types";

const RESOLVED: RecorderConsent = {
  basis: "host-defined",
  recordedAt: "2026-08-31T09:11:00Z",
  recordedBy: "practitioner/okafor",
  coversAll: true,
};

describe("resolveConsent — no basis at all", () => {
  it("calls a missing basis absent, whether it is null or undefined", () => {
    expect(resolveConsent(null)).toBe("absent");
    expect(resolveConsent(undefined)).toBe("absent");
  });

  it("requires a basis by default, so a host that passes no options is guarded", () => {
    // The default is the whole point. A predicate that opens the edge unless
    // asked to close it is a predicate every caller has to remember.
    expect(resolveConsent(null, {})).toBe("absent");
  });

  it("says which fact opened the edge when the host declares none is needed", () => {
    // Distinct from "resolved" on purpose: one says a basis cleared the edge,
    // the other says the host declared no basis was needed. A surface that
    // cannot tell them apart cannot render an honest provenance line.
    expect(resolveConsent(null, { required: false })).toBe("not-required");
    expect(resolveConsent(undefined, { required: false })).toBe("not-required");
  });
});

describe("resolveConsent — a basis that is not all there", () => {
  it("refuses a field that is missing or blank, and does not read the value", () => {
    // `basis` is opaque. What is checked is that it is present, never what it
    // says — around a dozen US states, several countries and 42 CFR Part 2 all
    // disagree about what it should say, and none of that is ours to encode.
    expect(resolveConsent({ ...RESOLVED, basis: "" })).toBe("incomplete");
    expect(resolveConsent({ ...RESOLVED, recordedAt: "" })).toBe("incomplete");
    expect(resolveConsent({ ...RESOLVED, recordedBy: "" })).toBe("incomplete");
  });

  it("treats whitespace as blank, because provenance nobody typed is not provenance", () => {
    expect(resolveConsent({ ...RESOLVED, basis: "   " })).toBe("incomplete");
    expect(resolveConsent({ ...RESOLVED, recordedBy: "\t\n" })).toBe("incomplete");
  });

  it("checks completeness before coverage, so the first fault reported is the real one", () => {
    const incomplete = { ...RESOLVED, basis: "", coversAll: false };
    expect(resolveConsent(incomplete)).toBe("incomplete");
  });

  it("accepts a basis with every field present", () => {
    expect(resolveConsent(RESOLVED)).toBe("resolved");
  });
});

describe("resolveConsent — the room", () => {
  const room: readonly RecorderParticipant[] = [
    { id: "p1", name: "Dr Okafor", role: "clinician", consented: true },
    { id: "p2", name: "Marion Bell", role: "patient", consented: true },
  ];

  it("refuses a basis the host says does not cover everyone", () => {
    expect(resolveConsent({ ...RESOLVED, coversAll: false })).toBe("not-all-parties");
  });

  it("lets one refusal beat a coversAll claim", () => {
    // The rule the file exists for. The summary says everyone; the detail says
    // one person declined; the detail wins.
    const declined = [...room.slice(0, 1), { ...room[1]!, consented: false }];
    expect(resolveConsent(RESOLVED, { participants: declined })).toBe("not-all-parties");
  });

  it("resolves when everyone in the room consented", () => {
    expect(resolveConsent(RESOLVED, { participants: room })).toBe("resolved");
  });

  it("does not read an unstated answer as a refusal", () => {
    // `consented` is optional and its absence means the host has not said.
    // Only an explicit `false` contradicts the claim; treating silence as a
    // refusal would make the field impossible to adopt incrementally.
    const unstated = [{ id: "p3", name: "Interpreter" }, ...room];
    expect(resolveConsent(RESOLVED, { participants: unstated })).toBe("resolved");
  });

  it("ignores the room when the host supplies none", () => {
    expect(resolveConsent(RESOLVED, { participants: [] })).toBe("resolved");
  });
});

describe("isConsentResolved", () => {
  it("opens the edge for exactly the two verdicts that should open it", () => {
    const opens: ConsentVerdict[] = ["resolved", "not-required"];
    const blocks: ConsentVerdict[] = ["absent", "incomplete", "not-all-parties"];
    for (const verdict of opens) expect(isConsentResolved(verdict)).toBe(true);
    for (const verdict of blocks) expect(isConsentResolved(verdict)).toBe(false);
  });
});

describe("uncoveredParticipants", () => {
  it("returns the people rather than a count", () => {
    // "2 not covered" is a number and a name is a person. The host renders
    // these beside its own copy, and it cannot do that from a tally.
    const found = uncoveredParticipants([
      { id: "p1", name: "Dr Okafor", consented: true },
      { id: "p2", name: "Marion Bell", consented: false },
      { id: "p3", name: "Interpreter" },
    ]);
    expect(found.map((participant) => participant.name)).toEqual(["Marion Bell"]);
  });

  it("leaves out the ones nobody has been asked about", () => {
    // Same asymmetry as the verdict: unstated is not a refusal, so naming an
    // unasked participant as uncovered would put a name on screen wrongly.
    expect(uncoveredParticipants([{ id: "p3", name: "Interpreter" }])).toEqual([]);
  });

  it("returns nothing for an empty room", () => {
    expect(uncoveredParticipants([])).toEqual([]);
  });
});

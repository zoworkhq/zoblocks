/**
 * Propose, confirm, attribute.
 *
 * The central assertion here is one you cannot write as a runtime test at all —
 * that `commit` accepts only a `ConfirmedProposal`, and that the only way to
 * obtain one is through a function requiring a human actor. That is enforced by
 * the type system. What is tested below is everything around it: the risk
 * classification, the prohibition, the dwell measurement, and the fact that
 * provenance attributes the act to the person rather than the model.
 */

import { describe, expect, it } from "vitest";
import {
  classifyProposal,
  confirmProposal,
  containsDosing,
  decideTool,
  isReflexive,
  ProposalProhibitedError,
  type ActionProposal,
} from "../src/actions.js";
import { provenanceForInsertion } from "../src/audit.js";

const proposal = (over: Partial<ActionProposal> = {}): ActionProposal => ({
  id: "p1",
  kind: "note-text",
  summary: "Add a line to the note",
  content: "New onset AF, rate controlled.",
  ...over,
});

const actor = { display: "Dr Amara Okafor", credential: "MD", reference: "Practitioner/7" };

describe("decideTool", () => {
  it("allows a tool on the allowlist", () => {
    expect(decideTool(["search"], { id: "t", name: "search", arguments: {} })).toEqual({
      allowed: true,
    });
  });

  it("refuses a tool not on the allowlist and says which are", () => {
    const decision = decideTool(["search"], { id: "t", name: "sendMessage", arguments: {} });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toContain("search");
  });

  it("refuses everything when the allowlist is empty, which is the default", () => {
    const decision = decideTool([], { id: "t", name: "anything", arguments: {} });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toMatch(/allows no tools/);
  });
});

describe("containsDosing", () => {
  it.each([
    "5 mg",
    "12.5 mcg",
    "1 g daily",
    "500 units",
    "10 ml",
    "2.5 mmol",
    "take bd",
    "tds prn",
    "q8h",
    "nocte",
  ])("detects %j", (text) => {
    expect(containsDosing(`Give ${text}.`)).toBe(true);
  });

  it.each([
    "no dosing here at all",
    "the patient is 68 years old",
    "40% of patients",
    "seen 3 times this year",
  ])("does not fire on %j", (text) => {
    expect(containsDosing(text)).toBe(false);
  });
});

describe("classifyProposal", () => {
  it("treats note text as routine", () => {
    expect(classifyProposal(proposal())).toBe("routine");
  });

  it("treats a problem-list addition as routine", () => {
    expect(classifyProposal(proposal({ kind: "problem-list" }))).toBe("routine");
  });

  it.each(["draft-order", "patient-education", "referral-draft"] as const)(
    "treats %s as elevated — it leaves the room or a patient reads it",
    (kind) => {
      expect(classifyProposal(proposal({ kind }))).toBe("elevated");
    },
  );

  it("treats dosing content as prohibited when the mode forbids dosing", () => {
    const risky = proposal({ content: "Bisoprolol 5 mg once daily." });
    expect(classifyProposal(risky, { forbidDosing: true })).toBe("prohibited");
  });

  it("treats the same content as merely routine when the mode permits dosing", () => {
    const risky = proposal({ content: "Bisoprolol 5 mg once daily." });
    expect(classifyProposal(risky, { forbidDosing: false })).toBe("routine");
  });

  it("prohibition beats elevation — the worse verdict wins", () => {
    const risky = proposal({ kind: "draft-order", content: "Bisoprolol 5 mg." });
    expect(classifyProposal(risky, { forbidDosing: true })).toBe("prohibited");
  });
});

describe("confirmProposal", () => {
  it("mints a confirmed proposal carrying the actor and the dwell", () => {
    const confirmed = confirmProposal(proposal(), actor, {
      confirmedAt: "2026-08-16T09:00:00.000Z",
      dwellMs: 5400,
    });
    expect(confirmed.__confirmed).toBe(true);
    expect(confirmed.actor.display).toBe("Dr Amara Okafor");
    expect(confirmed.dwellMs).toBe(5400);
  });

  it("throws on a prohibited proposal rather than returning a result", () => {
    expect(() =>
      confirmProposal(proposal({ content: "Give 5 mg." }), actor, {
        confirmedAt: "2026-08-16T09:00:00.000Z",
        dwellMs: 1000,
        forbidDosing: true,
      }),
    ).toThrow(ProposalProhibitedError);
  });

  it("names the proposal in the error so it is findable", () => {
    try {
      confirmProposal(proposal({ id: "p-42", content: "Give 5 mg." }), actor, {
        confirmedAt: "2026-08-16T09:00:00.000Z",
        dwellMs: 1000,
        forbidDosing: true,
      });
      expect.unreachable("should have thrown");
    } catch (error) {
      expect((error as ProposalProhibitedError).proposalId).toBe("p-42");
    }
  });
});

describe("isReflexive", () => {
  it("flags a sub-two-second confirmation as reflexive", () => {
    const confirmed = confirmProposal(proposal(), actor, {
      confirmedAt: "2026-08-16T09:00:00.000Z",
      dwellMs: 400,
    });
    // §17: a median under two seconds means the confirm step has become
    // theatre — laundering the model's output as human judgement.
    expect(isReflexive(confirmed)).toBe(true);
  });

  it("does not flag a considered confirmation", () => {
    const confirmed = confirmProposal(proposal(), actor, {
      confirmedAt: "2026-08-16T09:00:00.000Z",
      dwellMs: 8000,
    });
    expect(isReflexive(confirmed)).toBe(false);
  });

  it("accepts a custom threshold", () => {
    const confirmed = confirmProposal(proposal(), actor, {
      confirmedAt: "2026-08-16T09:00:00.000Z",
      dwellMs: 3000,
    });
    expect(isReflexive(confirmed, 5000)).toBe(true);
  });
});

describe("provenanceForInsertion", () => {
  const confirmed = confirmProposal(proposal(), actor, {
    confirmedAt: "2026-08-16T09:00:00.000Z",
    dwellMs: 6000,
  });

  const provenance = provenanceForInsertion({
    confirmed,
    target: { reference: "DocumentReference/note-1" },
    modelId: "test-model@1",
    sourceIds: ["s1", "s2"],
  });

  it("attributes the act to the human, never the model", () => {
    expect(provenance.agent[0]?.who.display).toBe("Dr Amara Okafor, MD");
    expect(provenance.agent[0]?.who.reference).toBe("Practitioner/7");
  });

  it("records the model as onBehalfOf, so both facts survive", () => {
    expect(provenance.agent[0]?.onBehalfOf?.display).toContain("test-model@1");
  });

  it("never puts the model in the who slot", () => {
    expect(provenance.agent[0]?.who.display).not.toContain("test-model");
    expect(provenance.agent[0]?.who.display).not.toMatch(/copilot/i);
  });

  it("points at the target and carries the sources", () => {
    expect(provenance.target[0]?.reference).toBe("DocumentReference/note-1");
    expect(provenance.entity).toHaveLength(2);
    expect(provenance.entity?.[0]?.role).toBe("source");
  });

  it("uses the confirmation time, not a clock read at write time", () => {
    expect(provenance.recorded).toBe("2026-08-16T09:00:00.000Z");
  });

  it("renders an actor without a credential cleanly", () => {
    const plain = provenanceForInsertion({
      confirmed: confirmProposal(
        proposal(),
        { display: "Sam Patel" },
        {
          confirmedAt: "2026-08-16T09:00:00.000Z",
          dwellMs: 3000,
        },
      ),
      target: { reference: "DocumentReference/n" },
      modelId: "m@1",
    });
    expect(plain.agent[0]?.who.display).toBe("Sam Patel");
    expect(plain.entity).toEqual([]);
  });
});

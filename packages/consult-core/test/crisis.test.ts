/**
 * Crisis classification.
 *
 * The bulk of this file is not about detecting crises. It is about **not
 * detecting them** in clinical documentation, because that is the failure that
 * makes the component unusable in the specialty that needs it most.
 *
 * A psychiatrist types "denies SI, no plan, contracts for safety" thirty times
 * a week. A classifier that escalates on those is a classifier that gets turned
 * off, and a classifier that is turned off catches nothing at all. So the
 * documentation cases below carry as much weight as the disclosure ones.
 */

import { describe, expect, it } from "vitest";
import {
  classifyCrisis,
  regionOf,
  resolveCrisisLines,
  type CrisisVerdict,
} from "../src/safety/crisis.js";

const verdict = (question: string, history?: string[]): CrisisVerdict =>
  classifyCrisis(history ? { question, history } : { question });

describe("classifyCrisis — first-person disclosure", () => {
  it.each([
    "I want to kill myself",
    "i am going to end my life",
    "I've been thinking about killing myself",
    "honestly I wish I was dead",
    "I'm suicidal and I don't know what to do",
    "there is no point in living any more",
    "everyone would be better off without me",
    "I want to hurt myself",
  ])("blocks on %j", (question) => {
    const result = verdict(question);
    expect(result.blocking).toBe(true);
    expect(result.audience).toBe("user");
    expect(["ideation", "imminent"]).toContain(result.severity);
  });

  it("escalates to imminent when means are stated", () => {
    const result = verdict("I want to kill myself, I have the pills right here");
    expect(result.severity).toBe("imminent");
    expect(result.blocking).toBe(true);
  });

  it("escalates to imminent when timing is stated", () => {
    const result = verdict("I'm going to end my life tonight");
    expect(result.severity).toBe("imminent");
  });

  it("escalates to imminent on a farewell", () => {
    const result = verdict("I want to die. Thank you for everything.");
    expect(result.severity).toBe("imminent");
  });

  it("escalates to imminent when an act is already in progress", () => {
    const result = verdict("I want to die, I have taken all of them");
    expect(result.severity).toBe("imminent");
  });

  it("reports fixed rule identifiers, never text from the disclosure", () => {
    // The property that matters for the audit log: whatever the user wrote,
    // the rule names are drawn from a closed vocabulary decided at author time.
    // A rule name may coincidentally share a word with the input; what it must
    // never do is vary with it.
    const distinctive = "I want to kill myself, my name is Wilhelmina Ashgrove-Petrie";
    const result = verdict(distinctive);

    expect(result.rules.length).toBeGreaterThan(0);
    for (const rule of result.rules) {
      expect(rule).toMatch(/^[a-z]+\.[a-z-]+$/);
    }
    const joined = result.rules.join(" ");
    expect(joined).not.toContain("Wilhelmina");
    expect(joined).not.toContain("Ashgrove");

    // Same rules fire regardless of the surrounding personal detail.
    expect(verdict("I want to kill myself").rules).toEqual(result.rules);
  });
});

describe("classifyCrisis — clinical documentation must not escalate", () => {
  it.each([
    "Patient denies suicidal ideation",
    "denies SI, no plan, no intent",
    "no active suicidal ideation today",
    "C-SSRS negative at this visit",
    "patient contracts for safety and has a safety plan in place",
    "nil suicidal intent expressed",
    "negative for self-harm",
  ])("stays clear on %j", (question) => {
    const result = verdict(question);
    expect(result.blocking).toBe(false);
    expect(result.severity).toBe("none");
  });

  it.each([
    "history of overdose in 2019",
    "hx of self-harm, no attempts since 2021",
    "previous suicidal ideation, resolved",
  ])("treats history as documentation: %j", (question) => {
    expect(verdict(question).blocking).toBe(false);
  });

  it.each([
    "what is the C-SSRS and how do I score it",
    "guidance on safety planning intervention",
    "define suicidal ideation for documentation purposes",
    "PHQ-9 item 9 scoring threshold",
  ])("lets clinicians look things up: %j", (question) => {
    expect(verdict(question).blocking).toBe(false);
  });
});

describe("classifyCrisis — third-party present risk", () => {
  it("blocks when a clinician describes a patient at active risk", () => {
    const result = verdict("my patient is actively suicidal and has a plan");
    expect(result.blocking).toBe(true);
    expect(result.severity).toBe("clinical-risk");
    expect(result.audience).toBe("third-party");
  });

  it("blocks on a present-tense disclosure about a patient", () => {
    const result = verdict("the patient reports suicidal ideation right now");
    expect(result.severity).toBe("clinical-risk");
  });

  it("does not block when the same content is historical", () => {
    const result = verdict("the patient has a history of suicidal ideation in 2019");
    expect(result.blocking).toBe(false);
  });

  it("does not block when the framing is educational", () => {
    const result = verdict(
      "what is the referral threshold when a patient reports suicidal ideation",
    );
    expect(result.blocking).toBe(false);
  });
});

describe("classifyCrisis — thread window", () => {
  it("catches disclosure split across turns", () => {
    const result = verdict("I have the pills", ["I can't do this any more", "I want to die"]);
    expect(result.severity).toBe("imminent");
    expect(result.blocking).toBe(true);
  });

  it("only looks at the last four turns, so a long thread does not accumulate noise", () => {
    const history = ["I want to die", "a", "b", "c", "d", "e"];
    const result = verdict("what is the dose of sertraline", history);
    expect(result.blocking).toBe(false);
  });

  it("a prior negation does not neutralise a later first-person disclosure", () => {
    const result = verdict("actually I want to kill myself", ["patient denies SI"]);
    expect(result.blocking).toBe(true);
    expect(result.audience).toBe("user");
  });

  it("first-person disclosure wins over third-party framing in the same message", () => {
    const result = verdict("my patient is stable but honestly I want to die");
    expect(result.audience).toBe("user");
    expect(result.blocking).toBe(true);
  });
});

describe("classifyCrisis — ordinary clinical questions", () => {
  it.each([
    "first line treatment for new onset atrial fibrillation",
    "what is the maximum dose of metformin",
    "summarise this patient's medications",
    "how long should I continue sertraline after remission",
    "differential for chest pain in a 40 year old",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });
});

describe("resolveCrisisLines", () => {
  it("returns 988 for the United States", () => {
    const lines = resolveCrisisLines("en-US");
    expect(lines[0]?.number).toBe("988");
  });

  it("returns Samaritans for the United Kingdom", () => {
    const lines = resolveCrisisLines("en-GB");
    expect(lines.some((l) => l.number === "116123")).toBe(true);
  });

  it("resolves by region rather than language, so cy-GB is British", () => {
    expect(resolveCrisisLines("cy-GB")).toEqual(resolveCrisisLines("en-GB"));
  });

  it("never guesses from a bare language tag — this is the 988 bug", () => {
    const lines = resolveCrisisLines("en");
    expect(lines.some((l) => l.number === "988")).toBe(false);
    expect(lines[0]?.label).toMatch(/emergency/i);
  });

  it("falls back to generic guidance for an unknown region rather than a wrong number", () => {
    const lines = resolveCrisisLines("pt-BR");
    expect(lines[0]?.number).toBe("");
    expect(lines[0]?.note).toMatch(/local emergency/i);
  });

  it("lets a host override the built-in list", () => {
    const lines = resolveCrisisLines("en-US", {
      US: [{ label: "Our on-call team", number: "5551234" }],
    });
    expect(lines[0]?.label).toBe("Our on-call team");
  });

  it.each([
    ["en-US", "US"],
    ["en_GB", "GB"],
    ["zh-Hans-CN", "CN"],
    ["en", undefined],
    ["", undefined],
  ])("regionOf(%j) is %j", (locale, expected) => {
    expect(regionOf(locale)).toBe(expected);
  });
});

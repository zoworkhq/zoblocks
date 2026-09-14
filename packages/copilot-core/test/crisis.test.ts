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

describe("classifyCrisis — a negation cancels only the phrase it negates", () => {
  it("escalates a disclosure that also says there is no plan", () => {
    const result = verdict("I want to kill myself, no plan yet");
    expect(result.blocking).toBe(true);
    expect(result.audience).toBe("user");
    expect(result.severity).toBe("ideation");
  });

  it("escalates active risk that 'without a safety plan' would otherwise cancel", () => {
    const result = verdict("the patient is actively suicidal without a safety plan");
    expect(result.blocking).toBe(true);
    expect(result.severity).toBe("clinical-risk");
  });

  it("escalates a disclosure alongside documentation of a denial", () => {
    const result = verdict("patient denies SI but honestly I want to kill myself");
    expect(result.blocking).toBe(true);
    expect(result.audience).toBe("user");
  });

  it("escalates present risk listed after a negated item", () => {
    expect(verdict("the patient reports self-harm, denies SI").severity).toBe("clinical-risk");
  });

  it.each([
    "I don't want to hurt myself",
    "I don't want to kill myself",
    "denies suicidal ideation",
    "the patient is calm, denies SI or self-harm",
    "the patient has no SI/HI, no plan, no intent",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });

  it("does not let a negated phrase in history block a later ordinary question", () => {
    expect(
      verdict("what is the dose of sertraline", ["I don't want to kill myself"]).blocking,
    ).toBe(false);
  });
});

describe("classifyCrisis — 'od' is prescribing shorthand unless it means overdose", () => {
  it.each([
    "the patient is on ramipril 5 mg od",
    "my patient is taking amlodipine 10mg OD",
    "she has been started on sertraline 50 mg od mane",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });

  it.each([
    "she has taken an OD",
    "the patient has OD'd on paracetamol",
    "he is here after a suspected od",
    "the patient has overdosed",
  ])("treats %j as overdose", (question) => {
    expect(verdict(question).severity).toBe("clinical-risk");
  });
});

describe("classifyCrisis — history qualifies only the phrase it dates", () => {
  it.each([
    "history of SI, now actively suicidal",
    "the patient has a history of SI, now actively suicidal",
    "patient has a history of overdose and is suicidal today",
    "hx of self-harm, currently suicidal",
    "the patient is suicidal this morning, previous overdose in 2019",
    "the patient has overdosed in the past week",
    "prior to admission the patient has taken an overdose",
  ])("escalates current risk beside history: %j", (question) => {
    const result = verdict(question);
    expect(result.blocking).toBe(true);
    expect(result.severity).toBe("clinical-risk");
  });

  it.each([
    "history of SI, no current ideation",
    "the patient has a history of SI, no current ideation",
    "the patient has a history of overdose and self-harm",
    "pt has hx of SI and overdose in 2019, denies current SI",
    "the patient reports self-harm 3 years ago",
    "the patient has a history of being suicidal",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });

  it("names the history rule when history is what cleared it", () => {
    expect(verdict("the patient has a history of suicidal ideation").rules).toContain(
      "historical.past",
    );
  });
});

describe("classifyCrisis — bare 'suicidal' about a patient", () => {
  it.each([
    "patient is suicidal without a plan",
    "pt suicidal",
    "Pt currently suicidal, no plan",
    "she is suicidal",
  ])("escalates %j", (question) => {
    const result = verdict(question);
    expect(result.blocking).toBe(true);
    expect(result.severity).toBe("clinical-risk");
    expect(result.audience).toBe("third-party");
  });

  it.each([
    "patient is not suicidal",
    "the patient denies being suicidal",
    "pt isn't suicidal",
    "patient is no longer suicidal",
    "pt not currently suicidal",
    "how do I manage a patient with suicidal ideation",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });

  it("does not let 'not' cancel a disclosure it does not negate", () => {
    expect(verdict("the patient is not eating and is suicidal").severity).toBe("clinical-risk");
    expect(verdict("the patient is not denying SI").severity).toBe("clinical-risk");
  });
});

describe("classifyCrisis — acts, third-person ideation and risk to others", () => {
  it.each([
    // An overdose or attempt that has happened.
    "the patient took an overdose of paracetamol 2 hours ago",
    "she has taken an OD",
    "attempted overdose",
    "patient attempted suicide last night",
    "she reports a suicide attempt yesterday",
    "tried to kill himself this morning",
    // "Cannot rule out" leaves the risk open.
    "cannot rule out suicidal intent",
    "unable to exclude self-harm",
    "suicidal intent cannot be excluded",
    // Ideation reported in the third person.
    "he wants to kill himself",
    "patient says she wants to die",
    "he wants to be dead",
    "patient has thoughts of ending her life",
    // Self-harm in progress.
    "the patient is cutting herself",
    "patient is self-harming",
    // Assessed risk.
    "patient is at risk of suicide",
    "high risk of self-harm",
    // Risk to others.
    "patient is homicidal",
    "he wants to kill his wife",
    "threatening to harm others",
    // Someone other than the patient.
    "the patient's mother is suicidal",
    // Recent past: hours, days, weeks or months.
    "patient was suicidal last week",
    "self-harmed 3 days ago",
    "the patient overdosed 2 months ago",
    // "Not" before a word that does not negate.
    "she has not stopped talking about suicide",
    "patient is not sure if suicidal",
    "has not eaten since taking an overdose",
  ])("escalates %j as clinical risk", (question) => {
    expect(verdict(question)).toMatchObject({
      severity: "clinical-risk",
      audience: "third-party",
      blocking: true,
    });
  });

  it.each(["I took an overdose", "I've taken an overdose", "I tried to kill myself last night"])(
    "treats the first-person act %j as imminent",
    (question) => {
      expect(verdict(question)).toMatchObject({
        severity: "imminent",
        audience: "user",
        blocking: true,
      });
    },
  );

  it.each([
    "suicide risk assessment completed, low risk",
    "no thoughts of self-harm",
    // A static risk factor in every psychiatric history, not present risk.
    "family history of suicide",
    "overdose precautions discussed",
    "attempted to reach patient by phone",
    "patient is at low risk of suicide",
    "patient is not at risk of self-harm",
    "denies thoughts of harming others",
    "no HI",
    "the patient denies SI/HI",
    "patient is not homicidal",
    "she denies taking an overdose",
    "he does not want to kill himself",
    "no suicide attempts",
    "rule out suicidal intent before discharge",
    // Distant history stays masked.
    "patient was suicidal as a teenager",
    "tried to kill himself years ago",
    "overdosed in 2015",
    "previously suicidal, now euthymic",
    "history of homicidal ideation",
    "self-harm in the past, none recently",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
  });

  it("escalates current risk beside a family history", () => {
    expect(verdict("family history of suicide, mother is suicidal now").blocking).toBe(true);
  });
});

describe("classifyCrisis — lethal means, passive ideation and population statements", () => {
  it.each([
    // Lethal acts and means.
    "she jumped off a bridge",
    "threatening to jump in front of a train",
    "found hanging",
    "he has a noose",
    "patient stockpiling pills",
    "has been saving up her tablets",
    "pt ingested bleach",
    "drank antifreeze",
    "self-inflicted laceration",
    "self-inflicted gunshot wound",
    // Passive ideation.
    "passive death wish",
    "the patient reports passive SI",
    "says life is not worth living",
    "wishes she wouldn't wake up",
    "wishes he could go to sleep and not wake up",
    // Risk to others without a subject.
    "endorses HI toward neighbour",
    // Recent overdose as a statement, not a management question.
    "the patient took an overdose 2 hours ago",
    // A management question does not clear other risk beside it.
    "treatment for patient who took an overdose, still suicidal",
    // An individual subject keeps an at-risk statement live.
    "she is at high risk of suicide, as are men over 45",
  ])("escalates %j as clinical risk", (question) => {
    expect(verdict(question)).toMatchObject({
      severity: "clinical-risk",
      audience: "third-party",
      blocking: true,
    });
  });

  it.each([
    "I cut myself on purpose",
    "I've been cutting myself",
    "I drank bleach",
    "I have a noose",
    "I've been stockpiling my pills",
    "I'm going to jump off a bridge",
  ])("treats the first-person act or means %j as imminent", (question) => {
    expect(verdict(question)).toMatchObject({
      severity: "imminent",
      audience: "user",
      blocking: true,
    });
  });

  it.each(["I wish I wouldn't wake up", "my life is not worth living"])(
    "treats first-person passive ideation %j as ideation",
    (question) => {
      expect(verdict(question)).toMatchObject({
        severity: "ideation",
        audience: "user",
        blocking: true,
      });
    },
  );

  it.each([
    // Clinicians cut themselves at work.
    "I cut myself",
    "I cut myself on a broken vial",
    "I've been cutting myself off from friends",
    // Distant history, including die and death wording.
    "he wanted to die as a teenager",
    "she wanted to kill herself in her teens",
    "passive death wish as a teenager",
    "history of self-inflicted laceration",
    "she jumped off a bridge in 2015",
    "old self-inflicted scars on both forearms",
    // Accidental poisoning is not self-harm.
    "toddler accidentally drank bleach",
    // Population and epidemiology, no individual subject.
    "high risk of suicide in men over 45",
    "suicide rates are higher in older men",
    "men over 45 are at higher risk of suicide",
    "self-harm is more common among adolescents",
    // Management of an overdose already being treated.
    "treatment for patient who took an overdose of paracetamol",
    // Negated means and passive ideation.
    "denies passive death wish",
    "no passive SI",
    "denies HI toward neighbour",
    "no evidence of self-inflicted injury",
    "laceration not self-inflicted",
    "denies stockpiling medication",
    "denies ingesting bleach",
    "denies feeling that life is not worth living",
    // Ordinary language.
    "hanging basket",
    "noose knot in the sailing club",
    "bleach the lab bench",
    "life insurance not worth it",
    "life is worth living",
    "collecting her tablets from the pharmacy",
    "he jumped off the bus",
    "pharmacy is saving up to buy a new fridge",
  ])("stays clear on %j", (question) => {
    expect(verdict(question)).toMatchObject({ severity: "none", blocking: false });
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

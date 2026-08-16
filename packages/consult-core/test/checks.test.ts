/**
 * Output contract checks, and the register they produce.
 *
 * The governing rule under test throughout: a check may downgrade, flag or
 * refuse. It may never rewrite. Every assertion below that compares
 * `answer.text` before and after is there to hold that line.
 */

import { describe, expect, it } from "vitest";
import { runChecks } from "../src/checks.js";
import { EMPTY_ANSWER, citationCoverage, deriveRegister, uncitedSpans, type Answer } from "../src/answer.js";
import { defineMode, lookUp, prepare, workUp } from "../src/modes.js";
import type { Source } from "../src/provider.js";

const source: Source = {
  id: "s1",
  title: "Guideline",
  passage: "Rate control is reasonable.",
  kind: "guideline",
  retrievedAt: "2026-08-16T09:00:00.000Z",
};

const answer = (over: Partial<Answer> = {}): Answer => ({
  ...EMPTY_ANSWER,
  text: "Rate control is a reasonable first strategy.",
  sources: new Map([[1, source]]),
  claims: [{ span: [0, 43], markers: [1] }],
  ...over,
});

describe("citationCoverage", () => {
  it("is 1 for a fully attributed answer", () => {
    expect(citationCoverage(answer())).toBe(1);
  });

  it("is 1 for an empty answer, so an empty answer is not reported as uncited", () => {
    expect(citationCoverage(EMPTY_ANSWER)).toBe(1);
  });

  it("is 0 when nothing is attributed", () => {
    expect(citationCoverage(answer({ claims: [] }))).toBe(0);
  });

  it("is partial when only part of the answer carries a claim", () => {
    const partial = answer({
      text: "Rate control is reasonable. Rhythm control is also reasonable.",
      claims: [{ span: [0, 27], markers: [1] }],
    });
    const coverage = citationCoverage(partial);
    expect(coverage).toBeGreaterThan(0.3);
    expect(coverage).toBeLessThan(0.6);
  });

  it("handles overlapping claims without double counting", () => {
    const overlapping = answer({
      claims: [
        { span: [0, 30], markers: [1] },
        { span: [20, 43], markers: [1] },
      ],
    });
    expect(citationCoverage(overlapping)).toBe(1);
  });
});

describe("uncitedSpans", () => {
  it("returns nothing for a fully attributed answer", () => {
    expect(uncitedSpans(answer())).toEqual([]);
  });

  it("returns the trailing gap", () => {
    const partial = answer({
      text: "Cited part. Uncited part.",
      claims: [{ span: [0, 11], markers: [1] }],
    });
    expect(uncitedSpans(partial)).toEqual([[11, 25]]);
  });

  it("returns a leading gap", () => {
    const partial = answer({
      text: "Uncited part. Cited part.",
      claims: [{ span: [13, 25], markers: [1] }],
    });
    expect(uncitedSpans(partial)).toEqual([[0, 13]]);
  });

  it("ignores whitespace-only gaps, so no marker appears on every full stop", () => {
    const spaced = answer({
      text: "One. Two.",
      claims: [
        { span: [0, 4], markers: [1] },
        { span: [5, 9], markers: [1] },
      ],
    });
    expect(uncitedSpans(spaced)).toEqual([]);
  });

  it("returns nothing for an empty answer", () => {
    expect(uncitedSpans(EMPTY_ANSWER)).toEqual([]);
  });
});

describe("deriveRegister", () => {
  it("is grounded when sources, claims and coverage all line up", () => {
    expect(
      deriveRegister({
        answer: answer(),
        providerCanCite: true,
        requireCitations: true,
        blocked: false,
      }),
    ).toBe("grounded");
  });

  it("is general when the provider cannot cite", () => {
    expect(
      deriveRegister({
        answer: answer(),
        providerCanCite: false,
        requireCitations: true,
        blocked: false,
      }),
    ).toBe("general");
  });

  it("is general when the mode does not require citations", () => {
    expect(
      deriveRegister({
        answer: answer(),
        providerCanCite: true,
        requireCitations: false,
        blocked: false,
      }),
    ).toBe("general");
  });

  it("is general when no sources arrived", () => {
    expect(
      deriveRegister({
        answer: answer({ sources: new Map() }),
        providerCanCite: true,
        requireCitations: true,
        blocked: false,
      }),
    ).toBe("general");
  });

  it("is declined when blocked", () => {
    expect(
      deriveRegister({
        answer: answer(),
        providerCanCite: true,
        requireCitations: true,
        blocked: true,
      }),
    ).toBe("declined");
  });

  it("is declined for an empty answer", () => {
    expect(
      deriveRegister({
        answer: EMPTY_ANSWER,
        providerCanCite: true,
        requireCitations: true,
        blocked: false,
      }),
    ).toBe("declined");
  });

  it("cannot be asserted by a provider — it is always derived", () => {
    // A provider claiming its answer is grounded gets no say: the register is a
    // function of what actually arrived.
    const lying = answer({ register: "grounded", claims: [], sources: new Map() });
    expect(
      deriveRegister({
        answer: lying,
        providerCanCite: true,
        requireCitations: true,
        blocked: false,
      }),
    ).toBe("general");
  });
});

describe("runChecks — never rewrites", () => {
  it.each([
    ["dosing", "Give 5 mg bisoprolol daily."],
    ["stigma", "The patient is a non-compliant addict."],
    ["diagnosis", "The patient has heart failure."],
  ])("leaves the answer text untouched when flagging %s", (_label, text) => {
    const subject = answer({ text, claims: [{ span: [0, text.length], markers: [1] }] });
    const result = runChecks({ answer: subject, mode: prepare, providerCanCite: true });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(subject.text).toBe(text);
  });
});

describe("runChecks — citations", () => {
  it("downgrades rather than refuses on low coverage", () => {
    const subject = answer({ claims: [] });
    const result = runChecks({ answer: subject, mode: lookUp, providerCanCite: true });
    expect(result.register).toBe("general");
    expect(result.refused).toBe(false);
    expect(result.findings.find((f) => f.code === "citation-coverage")?.severity).toBe("downgrade");
  });

  it("reports the coverage percentage in the detail", () => {
    const subject = answer({ claims: [] });
    const result = runChecks({ answer: subject, mode: lookUp, providerCanCite: true });
    expect(result.findings.find((f) => f.code === "citation-coverage")?.detail).toMatch(/0%/);
  });

  it("skips the coverage check when the provider cannot cite", () => {
    const result = runChecks({
      answer: answer({ claims: [] }),
      mode: lookUp,
      providerCanCite: false,
    });
    expect(result.findings.some((f) => f.code === "citation-coverage")).toBe(false);
  });

  it("respects a custom coverage threshold", () => {
    const subject = answer({
      text: "Cited. Uncited but long enough to matter.",
      claims: [{ span: [0, 7], markers: [1] }],
    });
    const strict = runChecks({
      answer: subject,
      mode: lookUp,
      providerCanCite: true,
      coverageThreshold: 0.9,
    });
    const lax = runChecks({
      answer: subject,
      mode: lookUp,
      providerCanCite: true,
      coverageThreshold: 0.1,
    });
    expect(strict.register).toBe("general");
    expect(lax.register).toBe("grounded");
  });
});

describe("runChecks — dosing", () => {
  it("refuses in a mode that forbids dosing", () => {
    const result = runChecks({
      answer: answer({ text: "Give 5 mg bisoprolol once daily." }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.refused).toBe(true);
    expect(result.register).toBe("declined");
  });

  it("flags but permits in Look up, which is the formulary mode", () => {
    const result = runChecks({
      answer: answer({
        text: "Bisoprolol 5 mg once daily is a usual starting dose.",
        claims: [{ span: [0, 51], markers: [1] }],
      }),
      mode: lookUp,
      providerCanCite: true,
    });
    expect(result.refused).toBe(false);
    const finding = result.findings.find((f) => f.code === "dosing-forbidden");
    expect(finding?.severity).toBe("flag");
    expect(finding?.message).toMatch(/verify every dose/i);
  });

  it.each([
    "500 mg",
    "12.5 microgram",
    "10 units",
    "1 g",
    "take bd",
    "one tablet tds",
    "q6h",
  ])("detects %j as dosing", (text) => {
    const result = runChecks({
      answer: answer({ text: `Something ${text} something.` }),
      mode: lookUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "dosing-forbidden")).toBe(true);
  });

  it("does not treat an ordinary number as a dose", () => {
    const result = runChecks({
      answer: answer({ text: "Around 40% of patients relapse within 2 years." }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "dosing-forbidden")).toBe(false);
  });
});

describe("runChecks — diagnosis", () => {
  it("downgrades an assertion of a diagnosis", () => {
    const result = runChecks({
      answer: answer({ text: "The patient has atrial fibrillation." }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "diagnosis-forbidden")).toBe(true);
    expect(result.register).toBe("general");
  });

  it("downgrades definitive framing", () => {
    const result = runChecks({
      answer: answer({ text: "The diagnosis is heart failure." }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "diagnosis-forbidden")).toBe(true);
  });

  it("permits supportive framing, which is how clinicians actually write", () => {
    const text = "This is consistent with atrial fibrillation; consider confirming with an ECG.";
    const result = runChecks({
      answer: answer({ text, claims: [{ span: [0, text.length], markers: [1] }] }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "diagnosis-forbidden")).toBe(false);
    expect(result.register).toBe("grounded");
  });

  it("permits a negated statement", () => {
    const text = "The patient has not been diagnosed with atrial fibrillation.";
    const result = runChecks({
      answer: answer({ text, claims: [{ span: [0, text.length], markers: [1] }] }),
      mode: workUp,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "diagnosis-forbidden")).toBe(false);
  });
});

describe("runChecks — claim count", () => {
  it("flags an answer that covers more ground than the mode allows", () => {
    const many = answer({
      claims: Array.from({ length: 9 }, (_, i) => ({ span: [i, i + 1] as const, markers: [1] })),
    });
    const result = runChecks({ answer: many, mode: workUp, providerCanCite: true });
    const finding = result.findings.find((f) => f.code === "claim-count");
    expect(finding?.severity).toBe("flag");
    expect(finding?.detail).toContain("9 claims");
  });

  it("does not flag when the mode sets no limit", () => {
    const many = answer({
      claims: Array.from({ length: 40 }, (_, i) => ({ span: [i, i + 1] as const, markers: [1] })),
    });
    const result = runChecks({ answer: many, mode: lookUp, providerCanCite: true });
    expect(result.findings.some((f) => f.code === "claim-count")).toBe(false);
  });
});

describe("runChecks — stigmatising language", () => {
  it("flags and offers the preferred term", () => {
    const text = "The patient is an addict who is non-compliant with treatment.";
    const result = runChecks({
      answer: answer({ text, claims: [{ span: [0, text.length], markers: [1] }] }),
      mode: prepare,
      providerCanCite: true,
    });
    const codes = result.findings.filter((f) => f.code === "stigmatising-language");
    expect(codes.length).toBeGreaterThanOrEqual(2);
    expect(codes[0]?.severity).toBe("flag");
    expect(result.stigma.length).toBeGreaterThanOrEqual(2);
  });

  it("does not downgrade the register on language alone", () => {
    const text = "The patient is an addict.";
    const result = runChecks({
      answer: answer({ text, claims: [{ span: [0, text.length], markers: [1] }] }),
      mode: prepare,
      providerCanCite: true,
    });
    expect(result.register).toBe("grounded");
  });
});

describe("runChecks — empty and blocked", () => {
  it("refuses an empty answer", () => {
    const result = runChecks({ answer: EMPTY_ANSWER, mode: lookUp, providerCanCite: true });
    expect(result.refused).toBe(true);
    expect(result.findings[0]?.code).toBe("empty-answer");
  });

  it("does not report an empty answer when the exchange was blocked", () => {
    const result = runChecks({
      answer: EMPTY_ANSWER,
      mode: lookUp,
      providerCanCite: true,
      blocked: true,
    });
    expect(result.findings.some((f) => f.code === "empty-answer")).toBe(false);
    expect(result.register).toBe("declined");
  });
});

describe("runChecks — a mode with everything switched off", () => {
  it("still flags dosing, because that check is unconditional", () => {
    const permissive = defineMode({
      id: "permissive",
      label: "Permissive",
      promptRef: "p@1",
      risk: "reference",
      output: { requireCitations: false, forbidDosing: false, forbidDiagnosis: false },
    });
    const result = runChecks({
      answer: answer({ text: "Give 5 mg." }),
      mode: permissive,
      providerCanCite: true,
    });
    expect(result.findings.some((f) => f.code === "dosing-forbidden")).toBe(true);
    expect(result.refused).toBe(false);
  });
});

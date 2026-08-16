import { describe, expect, it } from "vitest";
import {
  DEFAULT_RULES,
  DO_NOT_USE,
  copyForward,
  formatDuration,
  freshPulls,
  lowConfidenceDictation,
  noDangerousAbbreviations,
  noForeignContent,
  noUnfilledBlanks,
  requiredSections,
  runGate,
  uneditedTemplate,
  unreviewedAiRule,
  type GateContext,
  type GateRule,
} from "../src/gate.js";
import { emptyNote } from "../src/schema.js";
import { blank, doc, p, sampleNote, section, t } from "./helpers.js";

const NOW = new Date("2026-08-16T14:38:00+05:30");
const ctx: GateContext = { noteType: "progress", now: NOW, subject: "Patient/4471902" };

/** Run a single rule and flatten. */
function run(rule: GateRule, d = sampleNote(), c: GateContext = ctx) {
  const result = rule.run(d, c);
  return result === null ? [] : Array.isArray(result) ? result : [result];
}

describe("runGate", () => {
  it("refuses to sign while a block stands", () => {
    const result = runGate(sampleNote(), DEFAULT_RULES, ctx);
    expect(result.canSign).toBe(false);
    expect(result.blocking.length).toBeGreaterThan(0);
  });

  it("signs a clean note", () => {
    const clean = doc(
      section({ code: "10154-3", title: "Chief complaint" }, p(t("Transfusion.", "typed"))),
      section(
        { code: "10164-2", title: "History of present illness", required: true },
        p(t("Fatigue.", "typed")),
      ),
      section(
        { code: "51847-2", title: "Assessment and plan", required: true },
        p(t("Transfuse.", "typed")),
      ),
    );
    const result = runGate(clean, DEFAULT_RULES, ctx);
    expect(result.canSign).toBe(true);
    expect(result.blocking).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.passed.length).toBeGreaterThan(0);
  });

  it("sorts most-severe first and is stable within a severity", () => {
    // A list that reshuffles between keystrokes cannot be read, and a clinician
    // halfway through fixing the second item does not want it to become the
    // fourth.
    const result = runGate(sampleNote(), DEFAULT_RULES, ctx);
    const ranks = result.findings.map((f) => ({ block: 0, warn: 1, pass: 2 })[f.severity]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);

    const again = runGate(sampleNote(), DEFAULT_RULES, ctx);
    expect(again.findings.map((f) => f.id)).toEqual(result.findings.map((f) => f.id));
  });

  it("reports every finding across the three buckets exactly once", () => {
    const r = runGate(sampleNote(), DEFAULT_RULES, ctx);
    expect(r.blocking.length + r.warnings.length + r.passed.length).toBe(r.findings.length);
  });

  it("turns a throwing host rule into a loud block rather than taking the editor down", () => {
    // A host rule with a bug must not silently make a note unsignable — and
    // must not silently make a broken note signable either.
    const explode: GateRule = {
      id: "host-rule",
      run() {
        throw new Error("host database unreachable");
      },
    };
    const result = runGate(emptyNote("progress"), [explode], ctx);
    expect(result.canSign).toBe(false);
    expect(result.findings[0]!.id).toBe("host-rule:error");
    expect(result.findings[0]!.detail).toContain("host database unreachable");
  });

  it("reports a non-Error throw too", () => {
    const result = runGate(
      emptyNote("progress"),
      [
        {
          id: "odd",
          run() {
            throw "just a string";
          },
        },
      ],
      ctx,
    );
    expect(result.findings[0]!.detail).toContain("just a string");
  });

  it("skips rules that decline to answer", () => {
    expect(
      runGate(emptyNote("progress"), [{ id: "quiet", run: () => null }], ctx).findings,
    ).toHaveLength(0);
  });
});

describe("requiredSections", () => {
  it("blocks on an empty required section, and points at it", () => {
    const findings = run(requiredSections);
    const assessment = findings.find((f) => f.id.endsWith("51847-2"));
    expect(assessment?.severity).toBe("block");
    expect(assessment?.at).toBeDefined();
  });

  it("passes when every required section has content", () => {
    const d = doc(
      section({ code: "10164-2", title: "HPI", required: true }, p(t("x"))),
      section({ code: "51847-2", title: "A&P", required: true }, p(t("y"))),
    );
    expect(run(requiredSections, d)[0]!.severity).toBe("pass");
  });

  it("takes the requirement from the note type when the node does not carry it", () => {
    // Documents built by an older schema, or loaded from a server that dropped
    // the attribute, must still be checked.
    const d = doc(section({ code: "10164-2", title: "HPI", required: false }));
    expect(run(requiredSections, d)[0]!.severity).toBe("block");
  });

  it("ignores sections the note type says nothing about", () => {
    const d = doc(section({ code: "99999-9", title: "Bespoke" }));
    expect(run(requiredSections, d)[0]!.severity).toBe("pass");
  });
});

describe("unreviewedAiRule", () => {
  it("blocks while generated text is unread", () => {
    const finding = run(unreviewedAiRule)[0]!;
    expect(finding.severity).toBe("block");
    expect(finding.title).toBe("1 AI-drafted passage has not been reviewed");
  });

  it("pluralises honestly", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("a", "ai")), p(t("b", "ai"))));
    expect(run(unreviewedAiRule, d)[0]!.title).toBe("2 AI-drafted passages have not been reviewed");
  });

  it("passes once the passages have been reviewed", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("a", "ai", { reviewed: true }))));
    expect(run(unreviewedAiRule, d)[0]!.severity).toBe("pass");
  });
});

describe("noUnfilledBlanks", () => {
  it("blocks, because a signed note containing *** was never read", () => {
    const d = doc(section({ code: "1", title: "S" }, p(blank("dose"))));
    const finding = run(noUnfilledBlanks, d)[0]!;
    expect(finding.severity).toBe("block");
    expect(finding.title).toBe("1 blank is unfilled");
  });

  it("pluralises", () => {
    const d = doc(section({ code: "1", title: "S" }, p(blank(), blank())));
    expect(run(noUnfilledBlanks, d)[0]!.title).toBe("2 blanks are unfilled");
  });

  it("passes on a note with none", () => {
    expect(run(noUnfilledBlanks, emptyNote("progress"))[0]!.severity).toBe("pass");
  });
});

describe("noForeignContent", () => {
  it("blocks on text from another chart", () => {
    const d = doc(
      section({ code: "1", title: "S" }, p(t("theirs", "copied", { source: "Patient/9999999" }))),
    );
    const finding = run(noForeignContent, d)[0]!;
    expect(finding.severity).toBe("block");
    expect(finding.detail).toContain("Patient/9999999");
  });

  it("passes when everything belongs to this patient", () => {
    expect(run(noForeignContent)[0]!.severity).toBe("pass");
  });

  it("declines to answer when the host supplies no subject", () => {
    // Better to say nothing than to invent a comparison.
    expect(run(noForeignContent, sampleNote(), { noteType: "progress", now: NOW })).toHaveLength(0);
  });
});

describe("copyForward", () => {
  it("warns above the threshold, with the number", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("aaaaaaaa", "copied"), t("bb", "typed"))));
    const finding = run(copyForward, d)[0]!;
    expect(finding.severity).toBe("warn");
    expect(finding.title).toBe("80% of this note is copied from earlier documentation");
    expect(finding.detail).toContain("8 of 10");
  });

  it("passes at or below the threshold", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("aaaaa", "copied"), t("bbbbb", "typed"))));
    expect(run(copyForward, d)[0]!.severity).toBe("pass");
  });

  it("honours a host threshold", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("aaa", "copied"), t("bbbbbbb", "typed"))));
    expect(run(copyForward, d, { ...ctx, copyForwardWarnAt: 0.2 })[0]!.severity).toBe("warn");
  });

  it("passes an empty note rather than dividing by zero", () => {
    expect(run(copyForward, emptyNote("progress"))[0]!.severity).toBe("pass");
  });
});

describe("freshPulls", () => {
  it("warns on a stale value and names the oldest", () => {
    const finding = run(freshPulls)[0]!;
    expect(finding.severity).toBe("warn");
    expect(finding.title).toContain("4h");
    expect(finding.detail).toContain("Hemoglobin 7.1 g/dL");
    expect(finding.at).toBeDefined();
  });

  it("passes when the host's window is wider", () => {
    expect(
      run(freshPulls, sampleNote(), { ...ctx, maxPullAgeMs: 24 * 3600_000 })[0]!.severity,
    ).toBe("pass");
  });

  it("uses singular grammar for a single stale value", () => {
    expect(run(freshPulls)[0]!.title).toContain("value was");
  });

  it("uses plural grammar for several", () => {
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(
          t("a", "pulled", { at: "2026-08-16T01:00:00+05:30" }),
          t("b", "pulled", { at: "2026-08-16T02:00:00+05:30" }),
        ),
      ),
    );
    expect(run(freshPulls, d)[0]!.title).toContain("values were");
  });
});

describe("uneditedTemplate", () => {
  it("warns when boilerplate dominates", () => {
    // A normal-exam macro firing eleven systems onto a patient with an
    // obviously abnormal abdomen is a lie nobody typed.
    const d = doc(
      section({ code: "1", title: "S" }, p(t("aaaaaaaa", "template"), t("bb", "typed"))),
    );
    expect(run(uneditedTemplate, d)[0]!.severity).toBe("warn");
  });

  it("passes at a normal proportion", () => {
    const d = doc(
      section({ code: "1", title: "S" }, p(t("aa", "template"), t("bbbbbbbb", "typed"))),
    );
    expect(run(uneditedTemplate, d)[0]!.severity).toBe("pass");
  });

  it("passes an empty note", () => {
    expect(run(uneditedTemplate, emptyNote("progress"))[0]!.severity).toBe("pass");
  });
});

describe("do-not-use abbreviations", () => {
  const cases: [string, string][] = [
    ["Give 10 U insulin", "U"],
    ["Vitamin D 400 IU daily", "IU"],
    ["Furosemide 40 mg QD", "QD"],
    ["Alendronate QOD", "QOD"],
    ["Started on MS for pain", "MS"],
    ["MSO4 2 mg IV", "MSO4"],
    ["MgSO4 2 g IV", "MgSO4"],
    ["Warfarin 5.0 mg nightly", "trailing zero"],
    ["Digoxin .25 mg daily", "missing leading zero"],
  ];

  for (const [text, term] of cases) {
    it(`flags ${term}`, () => {
      const d = doc(section({ code: "1", title: "S" }, p(t(text))));
      const hits = run(noDangerousAbbreviations, d);
      expect(hits.some((f) => f.id === `do-not-use:${term}`)).toBe(true);
      expect(hits.every((f) => f.severity === "warn")).toBe(true);
    });
  }

  it("warns rather than blocks, because it is a standard and not a statute", () => {
    // And because the trailing-zero carve-out for genuine precision guarantees
    // false positives. A rule that blocks on those gets switched off.
    const d = doc(section({ code: "1", title: "S" }, p(t("Give 10 U insulin"))));
    expect(run(noDangerousAbbreviations, d)[0]!.severity).toBe("warn");
  });

  it("leaves a lab value's trailing zero alone", () => {
    // Trailing zeros are permitted where they demonstrate precision, which is
    // exactly what a reported result does.
    const d = doc(section({ code: "1", title: "S" }, p(t("Hemoglobin 7.0 today, potassium 4.0"))));
    expect(run(noDangerousAbbreviations, d)[0]!.severity).toBe("pass");
  });

  it("does not flag ordinary prose", () => {
    const d = doc(
      section({ code: "1", title: "S" }, p(t("Patient is alert and oriented. Denies pain."))),
    );
    expect(run(noDangerousAbbreviations, d)[0]!.severity).toBe("pass");
  });

  it("does not leak regex state between runs", () => {
    // Every entry owns a stateful global regex. A missing lastIndex reset makes
    // the second run of an identical note disagree with the first.
    const d = doc(section({ code: "1", title: "S" }, p(t("Give 10 U insulin"))));
    expect(run(noDangerousAbbreviations, d)).toEqual(run(noDangerousAbbreviations, d));
  });

  it("publishes a replacement and a reason for every entry", () => {
    for (const abbr of DO_NOT_USE) {
      expect(abbr.write.length).toBeGreaterThan(0);
      expect(abbr.because.length).toBeGreaterThan(0);
    }
  });
});

describe("lowConfidenceDictation", () => {
  it("warns where the recognizer said it was unsure", () => {
    // "denies chest pain" heard as "denies test pain" is one character from
    // clinically wrong, and the author proof-reads what they meant to say.
    const d = doc(
      section({ code: "1", title: "S" }, p(t("denies test pain", "dictated", { confidence: 0.4 }))),
    );
    const finding = run(lowConfidenceDictation, d)[0]!;
    expect(finding.severity).toBe("warn");
    expect(finding.detail).toContain("denies test pain");
  });

  it("passes on confident dictation and on text with no confidence recorded", () => {
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(t("clear", "dictated", { confidence: 0.99 }), t("unknown", "dictated")),
      ),
    );
    expect(run(lowConfidenceDictation, d)[0]!.severity).toBe("pass");
  });

  it("names the least confident passage when there are several", () => {
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(t("worse", "dictated", { confidence: 0.2 })),
        p(t("better", "dictated", { confidence: 0.7 })),
      ),
    );
    expect(run(lowConfidenceDictation, d)[0]!.detail).toContain("worse");
  });
});

describe("formatDuration", () => {
  it("is coarse and human", () => {
    expect(formatDuration(26 * 60_000)).toBe("26m");
    expect(formatDuration(2 * 3600_000)).toBe("2h");
    expect(formatDuration(8 * 3600_000 + 26 * 60_000)).toBe("8h 26m");
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(-90 * 60_000)).toBe("1h 30m");
  });
});

describe("the default rule set", () => {
  it("has unique ids", () => {
    const ids = DEFAULT_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leads with the blocking rules", () => {
    expect(DEFAULT_RULES.slice(0, 4).map((r) => r.id)).toEqual([
      "required-sections",
      "unreviewed-ai",
      "unfilled-blanks",
      "foreign-content",
    ]);
  });
});

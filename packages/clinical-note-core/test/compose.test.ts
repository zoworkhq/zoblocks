import { describe, expect, it } from "vitest";
import {
  composition,
  copiedRatio,
  diffLines,
  foreignContent,
  stalePulls,
  unreviewedAi,
} from "../src/compose.js";
import { ORIGINS } from "../src/provenance.js";
import { emptyNote } from "../src/schema.js";
import { doc, p, sampleNote, section, t } from "./helpers.js";

describe("composition", () => {
  it("reports every origin, including the ones at zero", () => {
    // Built by iterating ORIGINS rather than as a literal, so a seventh origin
    // cannot leave a hole in the report.
    const c = composition(emptyNote("progress"));
    for (const origin of ORIGINS) {
      expect(c.chars[origin]).toBe(0);
      expect(c.ratio[origin]).toBe(0);
    }
    expect(c.total).toBe(0);
  });

  it("counts characters, and the ratios sum to one", () => {
    const c = composition(sampleNote());
    expect(c.total).toBeGreaterThan(0);
    const sum = ORIGINS.reduce((acc, o) => acc + c.ratio[o], 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(ORIGINS.reduce((acc, o) => acc + c.chars[o], 0)).toBe(c.total);
  });

  it("attributes each range to its own origin", () => {
    const d = doc(
      section({ code: "1", title: "S" }, p(t("aaaa", "copied"), t("bb", "typed"), t("cccc", "ai"))),
    );
    const c = composition(d);
    expect(c.chars.copied).toBe(4);
    expect(c.chars.typed).toBe(2);
    expect(c.chars.ai).toBe(4);
    expect(c.ratio.copied).toBeCloseTo(0.4);
  });

  it("counts unmarked text as typed", () => {
    expect(composition(doc(section({ code: "1", title: "S" }, p(t("plain"))))).chars.typed).toBe(5);
  });
});

describe("copiedRatio", () => {
  it("measures copied text only", () => {
    // Not "text you did not personally type" — template text is boilerplate the
    // author chose in this encounter, and pulled data is current by definition.
    // Folding either in would make most good notes score badly.
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(t("aaaaa", "copied"), t("bbbbb", "template"), t("ccccc", "pulled"), t("ddddd", "typed")),
      ),
    );
    expect(copiedRatio(d)).toBeCloseTo(0.25);
  });

  it("is zero for an empty note rather than NaN", () => {
    expect(copiedRatio(emptyNote("progress"))).toBe(0);
  });
});

describe("unreviewedAi", () => {
  it("finds generated text nobody has read", () => {
    const passages = unreviewedAi(sampleNote());
    expect(passages).toHaveLength(1);
    expect(passages[0]!.text).toContain("denies overt bleeding");
    expect(passages[0]!.source).toBe("scribe/v2");
  });

  it("ignores AI text that has been reviewed", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("checked", "ai", { reviewed: true }))));
    expect(unreviewedAi(d)).toHaveLength(0);
  });

  it("reports positions that select the passage", () => {
    const d = sampleNote();
    const passage = unreviewedAi(d)[0]!;
    expect(d.textBetween(passage.from, passage.to)).toBe(passage.text);
  });
});

describe("stalePulls", () => {
  const now = new Date("2026-08-16T14:38:00+05:30");

  it("flags a value older than the threshold", () => {
    const stale = stalePulls(sampleNote(), 4 * 3600_000, now);
    expect(stale).toHaveLength(1);
    expect(stale[0]!.ageMs).toBeGreaterThan(8 * 3600_000);
  });

  it("says nothing when the threshold is generous", () => {
    expect(stalePulls(sampleNote(), 24 * 3600_000, now)).toHaveLength(0);
  });

  it("ignores pulls with no timestamp and pulls with an unparseable one", () => {
    // A number with no timestamp is an assertion, not evidence — but it is also
    // not something this rule can say anything useful about.
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(t("no time", "pulled"), t("bad time", "pulled", { at: "yesterday-ish" })),
      ),
    );
    expect(stalePulls(d, 0, now)).toHaveLength(0);
  });

  it("ignores non-pulled origins however old they claim to be", () => {
    const d = doc(
      section({ code: "1", title: "S" }, p(t("x", "copied", { at: "1999-01-01T00:00:00Z" }))),
    );
    expect(stalePulls(d, 1000, now)).toHaveLength(0);
  });
});

describe("foreignContent", () => {
  it("catches text copied from another patient's chart", () => {
    // Two charts, two tabs, one clipboard. The most common route to
    // wrong-patient documentation there is.
    const d = doc(
      section(
        { code: "1", title: "S" },
        p(
          t("mine", "copied", { source: "Patient/4471902" }),
          t("theirs", "copied", { source: "Patient/9999999" }),
        ),
      ),
    );
    const foreign = foreignContent(d, "Patient/4471902");
    expect(foreign).toHaveLength(1);
    expect(foreign[0]!.text).toBe("theirs");
    expect(foreign[0]!.source).toBe("Patient/9999999");
  });

  it("ignores copied text whose source is not a patient", () => {
    // Copying from your own prior note is normal and is measured elsewhere.
    const d = doc(
      section({ code: "1", title: "S" }, p(t("x", "copied", { source: "DocumentReference/7" }))),
    );
    expect(foreignContent(d, "Patient/1")).toHaveLength(0);
  });

  it("ignores copied text with no recorded source", () => {
    const d = doc(section({ code: "1", title: "S" }, p(t("x", "copied"))));
    expect(foreignContent(d, "Patient/1")).toHaveLength(0);
  });
});

describe("diffLines", () => {
  it("reports identical text as unchanged", () => {
    expect(diffLines("a\nb", "a\nb").every((l) => l.kind === "same")).toBe(true);
  });

  it("reports additions and removals", () => {
    const diff = diffLines("a\nb\nc", "a\nx\nc");
    expect(diff.filter((l) => l.kind === "removed").map((l) => l.text)).toEqual(["b"]);
    expect(diff.filter((l) => l.kind === "added").map((l) => l.text)).toEqual(["x"]);
    expect(diff.filter((l) => l.kind === "same").map((l) => l.text)).toEqual(["a", "c"]);
  });

  it("handles pure insertion and pure deletion", () => {
    expect(diffLines("", "new").filter((l) => l.kind === "added")).toHaveLength(1);
    expect(diffLines("old", "").filter((l) => l.kind === "removed")).toHaveLength(1);
  });

  it("handles trailing additions and removals past the common prefix", () => {
    expect(
      diffLines("a", "a\nb\nc")
        .filter((l) => l.kind === "added")
        .map((l) => l.text),
    ).toEqual(["b", "c"]);
    expect(
      diffLines("a\nb\nc", "a")
        .filter((l) => l.kind === "removed")
        .map((l) => l.text),
    ).toEqual(["b", "c"]);
  });

  it("preserves every line of the newer text", () => {
    const after = "one\ntwo\nthree\nfour";
    const kept = diffLines("one\nthree", after)
      .filter((l) => l.kind !== "removed")
      .map((l) => l.text)
      .join("\n");
    expect(kept).toBe(after);
  });
});

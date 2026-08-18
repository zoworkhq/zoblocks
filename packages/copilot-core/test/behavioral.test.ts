/**
 * The behavioral health pack.
 *
 * Two things are being defended here. The instrument maths, because a summary
 * that reports a two-point PHQ-9 move as "improving" is false precision that
 * erodes trust in the whole surface. And the patient-facing guard, because
 * Nevada prohibits AI from providing behavioral healthcare outright and a
 * component that quietly reconfigured itself would be a five-figure penalty per
 * violation.
 */

import { describe, expect, it } from "vitest";
import {
  assertClinicianFacing,
  AUDITC,
  bandFor,
  behavioralModes,
  betweenVisits,
  computeTrend,
  describeTrend,
  findInstrument,
  formulate,
  GAD7,
  INSTRUMENTS,
  PatientFacingNotSupportedError,
  PCL5,
  PHQ9,
  type InstrumentScore,
} from "../src/behavioral.js";
import { defaultModes, lookUp, prepare, workUp } from "../src/modes.js";

const ASOF = "2026-08-16";

describe("instruments", () => {
  it("exposes the four measures a behavioral health service actually runs", () => {
    expect(INSTRUMENTS.map((i) => i.id)).toEqual(["phq-9", "gad-7", "audit-c", "pcl-5"]);
  });

  it("finds an instrument by id", () => {
    expect(findInstrument("gad-7")).toBe(GAD7);
    expect(findInstrument("nope")).toBeUndefined();
  });

  it.each([
    [PHQ9, 0, "minimal"],
    [PHQ9, 7, "mild"],
    [PHQ9, 12, "moderate"],
    [PHQ9, 17, "moderately severe"],
    [PHQ9, 25, "severe"],
    [GAD7, 3, "minimal"],
    [GAD7, 18, "severe"],
    [AUDITC, 1, "low risk"],
    [AUDITC, 4, "screen positive"],
    [PCL5, 40, "at or above provisional threshold"],
  ])("bands %s %i as %s", (instrument, score, label) => {
    expect(bandFor(instrument, score)?.label).toBe(label);
  });

  it("returns no band for an out-of-range score", () => {
    expect(bandFor(PHQ9, 99)).toBeUndefined();
  });

  it("marks PHQ-9 item 9 as carrying independent risk meaning", () => {
    expect(PHQ9.riskItems).toEqual([9]);
  });
});

describe("computeTrend", () => {
  const scores = (...pairs: [string, number][]): InstrumentScore[] =>
    pairs.map(([date, score]) => ({ date, score }));

  it("returns nothing when there are no completions", () => {
    expect(computeTrend(PHQ9, [], ASOF)).toBeUndefined();
  });

  it("reports insufficient data from a single completion", () => {
    const trend = computeTrend(PHQ9, scores(["2026-08-10", 14]), ASOF);
    expect(trend?.direction).toBe("insufficient-data");
  });

  it("reports improvement when the drop clears the MCID", () => {
    const trend = computeTrend(PHQ9, scores(["2026-06-01", 14], ["2026-08-10", 8]), ASOF);
    expect(trend?.direction).toBe("improving");
    expect(trend?.change).toBe(-6);
    expect(trend?.meaningful).toBe(true);
  });

  it("reports flat when the change is inside the MCID", () => {
    // The whole point: a 2-point PHQ-9 move is noise, not news.
    const trend = computeTrend(PHQ9, scores(["2026-06-01", 14], ["2026-08-10", 12]), ASOF);
    expect(trend?.direction).toBe("flat");
    expect(trend?.meaningful).toBe(false);
  });

  it("reports worsening when the rise clears the MCID", () => {
    const trend = computeTrend(GAD7, scores(["2026-06-01", 8], ["2026-08-10", 15]), ASOF);
    expect(trend?.direction).toBe("worsening");
  });

  it("uses each instrument's own MCID", () => {
    // A 4-point move is meaningful on GAD-7 and not on PHQ-9.
    expect(computeTrend(GAD7, scores(["2026-06-01", 4], ["2026-08-10", 8]), ASOF)?.direction).toBe(
      "worsening",
    );
    expect(computeTrend(PHQ9, scores(["2026-06-01", 4], ["2026-08-10", 8]), ASOF)?.direction).toBe(
      "flat",
    );
  });

  it("sorts by date rather than trusting input order", () => {
    const trend = computeTrend(PHQ9, scores(["2026-08-10", 8], ["2026-06-01", 14]), ASOF);
    expect(trend?.earliest.score).toBe(14);
    expect(trend?.latest.score).toBe(8);
    expect(trend?.direction).toBe("improving");
  });

  it("computes days since the last completion", () => {
    const trend = computeTrend(PHQ9, scores(["2026-06-01", 14], ["2026-08-10", 8]), ASOF);
    expect(trend?.daysSinceLatest).toBe(6);
  });

  it("copes with an unparseable date rather than producing NaN", () => {
    const trend = computeTrend(PHQ9, [{ date: "not-a-date", score: 5 }], ASOF);
    expect(trend?.daysSinceLatest).toBe(0);
  });

  it("surfaces a positive risk item independently of the total", () => {
    // A total of 4 with item 9 positive is not a low-risk result, and this is
    // the case a summary that reports only the total gets wrong.
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 12 },
        { date: "2026-08-10", score: 4, riskItemsPositive: [9] },
      ],
      ASOF,
    );
    expect(trend?.latestBand?.label).toBe("minimal");
    expect(trend?.riskItemPositive).toBe(true);
  });
});

describe("describeTrend", () => {
  it("restates facts without recommending anything", () => {
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 14 },
        { date: "2026-08-10", score: 8 },
      ],
      ASOF,
    );
    const line = describeTrend(trend!);
    expect(line).toContain("PHQ-9 8");
    expect(line).toContain("mild");
    expect(line).toContain("down 6 from 14");
    expect(line).toContain("completed 6d ago");
    // No advice, no "consider", no recommendation.
    expect(line).not.toMatch(/consider|recommend|should/i);
  });

  it("says 'completed today' rather than '0d ago'", () => {
    const trend = computeTrend(
      GAD7,
      [
        { date: "2026-08-01", score: 4 },
        { date: "2026-08-16", score: 12 },
      ],
      ASOF,
    );
    expect(describeTrend(trend!)).toContain("completed today");
  });

  it("names the MCID when reporting no meaningful change", () => {
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 12 },
        { date: "2026-08-16", score: 14 },
      ],
      ASOF,
    );
    expect(describeTrend(trend!)).toContain("MCID 5");
  });

  it("reports unanswered items, because an incomplete instrument is a different fact", () => {
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 14 },
        { date: "2026-08-16", score: 8, unanswered: 2 },
      ],
      ASOF,
    );
    expect(describeTrend(trend!)).toContain("2 items unanswered");
  });

  it("singularises a lone unanswered item", () => {
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 14 },
        { date: "2026-08-16", score: 8, unanswered: 1 },
      ],
      ASOF,
    );
    expect(describeTrend(trend!)).toContain("1 item unanswered");
  });

  it("puts the risk item last, so it is where the eye lands", () => {
    const trend = computeTrend(
      PHQ9,
      [
        { date: "2026-06-01", score: 12 },
        { date: "2026-08-16", score: 4, riskItemsPositive: [9] },
      ],
      ASOF,
    );
    const line = describeTrend(trend!);
    expect(line.endsWith("RISK ITEM POSITIVE — review directly")).toBe(true);
  });

  it("notes a single completion rather than inventing a direction", () => {
    const trend = computeTrend(PHQ9, [{ date: "2026-08-16", score: 8 }], ASOF);
    expect(describeTrend(trend!)).toContain("single completion");
  });
});

describe("mode exclusions", () => {
  it("keeps Part 2 and psychotherapy notes excluded even in a behavioral health mode", () => {
    // 42 CFR Part 2 now treats SUD counselling notes as needing specific
    // consent. A score summary has no business receiving them.
    expect(betweenVisits.excludes).toContain("part2");
    expect(betweenVisits.excludes).toContain("sud-counseling-notes");
    expect(betweenVisits.excludes).toContain("psychotherapy-notes");
  });

  it("keeps every built-in mode clinician-facing", () => {
    for (const mode of [lookUp, prepare, workUp, betweenVisits, formulate]) {
      expect(mode.patientFacing).toBe(false);
    }
  });

  it("gives every built-in mode an empty tool allowlist", () => {
    for (const mode of [lookUp, prepare, workUp, betweenVisits, formulate]) {
      expect(mode.tools).toEqual([]);
    }
  });

  it("keeps the high-risk modes out of the default sets", () => {
    // A host has to reach for Work up and Formulate by name.
    expect(defaultModes.map((m) => m.id)).toEqual(["look-up", "prepare"]);
    expect(behavioralModes.map((m) => m.id)).toEqual(["between-visits"]);
  });

  it("bounds the history window on every mode, since guardrails decay", () => {
    for (const mode of [lookUp, prepare, workUp, betweenVisits, formulate]) {
      expect(mode.historyTurns).toBeLessThanOrEqual(8);
    }
  });
});

describe("assertClinicianFacing", () => {
  it("permits a clinician surface", () => {
    expect(() => assertClinicianFacing(betweenVisits, "clinician")).not.toThrow();
  });

  it("throws on a patient surface rather than silently disabling the mode", () => {
    expect(() => assertClinicianFacing(betweenVisits, "patient")).toThrow(
      PatientFacingNotSupportedError,
    );
  });

  it("explains the three state laws in the error, because the reader needs the why", () => {
    try {
      assertClinicianFacing(formulate, "patient");
      expect.unreachable("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toMatch(/Illinois/);
      expect(message).toMatch(/Nevada/);
      expect(message).toMatch(/Utah/);
      expect(message).toMatch(/separate product/);
    }
  });

  it("blocks every built-in mode from a patient surface", () => {
    for (const mode of [lookUp, prepare, workUp, betweenVisits, formulate]) {
      expect(() => assertClinicianFacing(mode, "patient")).toThrow();
    }
  });
});

describe("no affect detection anywhere", () => {
  it("exposes no sentiment, emotion or affect API", async () => {
    // Illinois' WOPR Act specifically prohibits AI detecting emotions or mental
    // state. This is a feature product teams ask for constantly, so the absence
    // is asserted rather than assumed.
    const surface = await import("../src/index.js");
    const names = Object.keys(surface).join(" ").toLowerCase();
    expect(names).not.toMatch(/sentiment|emotion|affect|mood(?!s)/);
  });
});

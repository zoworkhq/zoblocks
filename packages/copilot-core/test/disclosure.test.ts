/**
 * Disclosure, language, telemetry and audit shape.
 *
 * The disclosure tests exist mostly to hold the count honest: HTI-1 specifies
 * 31 source attributes for a predictive DSI, and a "model card" that quietly
 * covers nineteen of them is the thing this type is meant to prevent.
 */

import { describe, expect, it } from "vitest";
import {
  disclosureCompleteness,
  disclosureFields,
  DISCLOSURE_LABELS,
  DISCLOSURE_SECTIONS,
  minimalDisclosure,
} from "../src/disclosure.js";
import { findStigma, STIGMA_TERMS } from "../src/language.js";
import { summarise, type TelemetryEvent } from "../src/telemetry.js";
import { auditExchange } from "../src/audit.js";
import { lookUp, prepare } from "../src/modes.js";
import { SAFE_VERDICT } from "../src/safety/index.js";

describe("ModelDisclosure", () => {
  it("covers exactly the 31 HTI-1 source attributes", () => {
    const total = DISCLOSURE_SECTIONS.reduce((n, s) => n + disclosureFields(s).length, 0);
    expect(total).toBe(31);
  });

  it("labels every section", () => {
    for (const section of DISCLOSURE_SECTIONS) {
      expect(DISCLOSURE_LABELS[section]).toBeTruthy();
    }
  });

  it("reports completeness so a customer can see what their vendor would not answer", () => {
    const { answered, total, missing } = disclosureCompleteness(minimalDisclosure("m@1"));
    expect(total).toBe(31);
    expect(answered).toBe(3);
    expect(missing).toContain("trainingDataSource");
    expect(missing).not.toContain("modelId");
  });

  it("counts a fully answered disclosure", () => {
    const full = Object.fromEntries(
      DISCLOSURE_SECTIONS.flatMap((s) => disclosureFields(s)).map((f) => [f, "stated"]),
    ) as Parameters<typeof disclosureCompleteness>[0];
    expect(disclosureCompleteness(full).answered).toBe(31);
  });

  it("treats an empty string as unanswered, not answered", () => {
    const { missing } = disclosureCompleteness(minimalDisclosure("m@1", { knownBiases: "" }));
    expect(missing).toContain("knownBiases");
  });

  it("requires intended and out-of-scope use, which are the reviewable half", () => {
    const disclosure = minimalDisclosure("m@1");
    expect(disclosure.intendedUse).toBeTruthy();
    expect(disclosure.outOfScopeUse).toMatch(/not for patient-facing/i);
    expect(disclosure.outOfScopeUse).toMatch(/time-critical/i);
  });

  it("lets a host override any field", () => {
    expect(minimalDisclosure("m@1", { baaInPlace: true }).baaInPlace).toBe(true);
  });
});

describe("findStigma", () => {
  it.each([
    ["addict", "person with a substance use disorder"],
    ["committed suicide", "died by suicide"],
    ["non-compliant", "not taking as prescribed"],
    ["frequent flyer", "frequent attender, or state the number of attendances"],
    ["schizophrenic", "person with schizophrenia"],
  ])("flags %j and offers %j", (term, prefer) => {
    const findings = findStigma(`The patient is ${term} apparently.`);
    expect(findings[0]?.term).toBe(term);
    expect(findings[0]?.prefer).toBe(prefer);
  });

  it("is case-insensitive", () => {
    expect(findStigma("The patient is an ADDICT.")).toHaveLength(1);
  });

  it("matches on word boundaries, so 'cleanliness' is not 'clean'", () => {
    expect(findStigma("Wound cleanliness was good.")).toHaveLength(0);
  });

  it("leaves quoted speech alone — a patient's own words are clinical data", () => {
    // Rewriting a quotation is falsifying a record.
    expect(findStigma('Patient states "I am just an addict".')).toHaveLength(0);
  });

  it("still flags the same term outside the quotation", () => {
    const findings = findStigma('The addict states "I am doing better".');
    expect(findings).toHaveLength(1);
  });

  it("can be told not to skip quotes", () => {
    const findings = findStigma('Patient states "I am just an addict".', { skipQuoted: false });
    expect(findings).toHaveLength(1);
  });

  it("returns findings in document order", () => {
    const findings = findStigma("The addict was non-compliant and then went clean.");
    expect(findings.map((f) => f.term)).toEqual(["addict", "non-compliant", "clean"]);
  });

  it("finds nothing in ordinary clinical text", () => {
    expect(
      findStigma("Person with alcohol use disorder, currently abstinent, engaged with treatment."),
    ).toHaveLength(0);
  });

  it("gives every term a reason, because a flag without a why gets ignored", () => {
    for (const entry of STIGMA_TERMS) {
      expect(entry.why.length).toBeGreaterThan(10);
      expect(entry.prefer.length).toBeGreaterThan(3);
    }
  });
});

describe("telemetry summarise", () => {
  const events: TelemetryEvent[] = [
    { type: "submitted", exchangeId: "1", modeId: "look-up" },
    { type: "submitted", exchangeId: "2", modeId: "look-up" },
    { type: "submitted", exchangeId: "3", modeId: "look-up" },
    {
      type: "answered",
      exchangeId: "1",
      modeId: "look-up",
      register: "grounded",
      sourceCount: 3,
      findingCount: 0,
    },
    {
      type: "answered",
      exchangeId: "2",
      modeId: "look-up",
      register: "general",
      sourceCount: 0,
      findingCount: 1,
    },
    { type: "refused", exchangeId: "3", modeId: "look-up", reason: "not-clinical" },
    { type: "sources-opened", exchangeId: "1", msToOpen: 90, sourceCount: 3 },
  ];

  it("computes the verification rate, which is the number worth watching", () => {
    expect(summarise(events).verificationRate).toBe(0.5);
  });

  it("computes refusal and grounded rates", () => {
    const summary = summarise(events);
    expect(summary.refusalRate).toBeCloseTo(1 / 3);
    expect(summary.groundedRate).toBe(0.5);
  });

  it("returns zeroes rather than NaN on an empty stream", () => {
    expect(summarise([])).toMatchObject({
      verificationRate: 0,
      refusalRate: 0,
      groundedRate: 0,
      medianConfirmDwellMs: null,
      reflexiveConfirmRate: 0,
    });
  });

  it("takes the median confirm dwell across an odd number of confirmations", () => {
    const confirms: TelemetryEvent[] = [
      { type: "proposal-confirmed", exchangeId: "1", dwellMs: 1000, reflexive: true },
      { type: "proposal-confirmed", exchangeId: "2", dwellMs: 5000, reflexive: false },
      { type: "proposal-confirmed", exchangeId: "3", dwellMs: 9000, reflexive: false },
    ];
    expect(summarise(confirms).medianConfirmDwellMs).toBe(5000);
  });

  it("takes the median across an even number", () => {
    const confirms: TelemetryEvent[] = [
      { type: "proposal-confirmed", exchangeId: "1", dwellMs: 1000, reflexive: true },
      { type: "proposal-confirmed", exchangeId: "2", dwellMs: 3000, reflexive: false },
    ];
    expect(summarise(confirms).medianConfirmDwellMs).toBe(2000);
  });

  it("reports the reflexive confirmation rate — the theatre detector", () => {
    const confirms: TelemetryEvent[] = [
      { type: "proposal-confirmed", exchangeId: "1", dwellMs: 400, reflexive: true },
      { type: "proposal-confirmed", exchangeId: "2", dwellMs: 500, reflexive: true },
      { type: "proposal-confirmed", exchangeId: "3", dwellMs: 9000, reflexive: false },
    ];
    expect(summarise(confirms).reflexiveConfirmRate).toBeCloseTo(2 / 3);
  });

  it("counts crises", () => {
    expect(
      summarise([
        {
          type: "crisis",
          exchangeId: "1",
          modeId: "look-up",
          severity: "ideation",
          audience: "user",
        },
      ]).crises,
    ).toBe(1);
  });
});

describe("auditExchange", () => {
  const base = {
    exchangeId: "x1",
    mode: prepare,
    startedAt: "2026-08-16T09:00:00.000Z",
    safety: SAFE_VERDICT,
    withheld: [],
  };

  it("records the declared scope, not the data", () => {
    const event = auditExchange({ ...base, outcome: "answered" });
    const detail = Object.fromEntries(
      (event.entity?.[0]?.detail ?? []).map((d) => [d.type, d.valueString]),
    );
    expect(detail["readsDeclared"]).toContain("Condition");
    expect(detail["excludesDeclared"]).toContain("part2");
    expect(detail["modeRisk"]).toBe("summary");
  });

  it("says '(none)' for a mode that reads nothing, rather than an empty string", () => {
    const event = auditExchange({ ...base, mode: lookUp, outcome: "answered" });
    const detail = Object.fromEntries(
      (event.entity?.[0]?.detail ?? []).map((d) => [d.type, d.valueString]),
    );
    expect(detail["readsDeclared"]).toBe("(none)");
  });

  it("scores a refusal as a success, because the system did what it was designed to do", () => {
    expect(auditExchange({ ...base, outcome: "refused" }).outcome).toBe("0");
    expect(auditExchange({ ...base, outcome: "crisis" }).outcome).toBe("0");
    expect(auditExchange({ ...base, outcome: "blocked" }).outcome).toBe("4");
    expect(auditExchange({ ...base, outcome: "failed" }).outcome).toBe("8");
  });

  it("records withheld counts and reasons but never content", () => {
    const event = auditExchange({
      ...base,
      outcome: "answered",
      withheld: [
        { reason: "part2", count: 2, disclosable: true },
        { reason: "psychotherapy-notes", count: 1, disclosable: false },
      ],
    });
    const detail = Object.fromEntries(
      (event.entity?.[0]?.detail ?? []).map((d) => [d.type, d.valueString]),
    );
    expect(detail["withheld.part2"]).toBe("2");
    expect(detail["withheld.psychotherapy-notes"]).toBe("1 (not disclosable)");
  });

  it("records the requesting clinician as the agent", () => {
    const event = auditExchange({
      ...base,
      outcome: "answered",
      actor: { display: "Dr Okafor", reference: "Practitioner/7" },
    });
    expect(event.agent[0]?.who?.display).toBe("Dr Okafor");
    expect(event.agent[0]?.requestor).toBe(true);
  });

  it("falls back to an explicit unknown rather than omitting the agent", () => {
    expect(auditExchange({ ...base, outcome: "answered" }).agent[0]?.who?.display).toBe("unknown");
  });

  it("records instruction shapes neutralised while fencing", () => {
    const event = auditExchange({ ...base, outcome: "answered", neutralised: 2 });
    const detail = event.entity?.[0]?.detail ?? [];
    expect(detail.some((d) => d.type === "instructionShapesNeutralised")).toBe(true);
  });

  it("omits the neutralised line when there is nothing to report", () => {
    const event = auditExchange({ ...base, outcome: "answered", neutralised: 0 });
    const detail = event.entity?.[0]?.detail ?? [];
    expect(detail.some((d) => d.type === "instructionShapesNeutralised")).toBe(false);
  });

  it("is a well-formed FHIR AuditEvent", () => {
    const event = auditExchange({ ...base, outcome: "answered" });
    expect(event.resourceType).toBe("AuditEvent");
    expect(event.type.system).toContain("dicom");
    expect(event.recorded).toBeTruthy();
    expect(event.source.observer.display).toBe("Oxygen Copilot");
  });
});

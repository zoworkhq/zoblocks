/**
 * RiskIndicator — one describe block per failure.
 *
 * Stale, unattributed, and read as a diagnosis. Every assertion here traces to
 * one of the three, because the component has no other reason to exist: a
 * band and a percentage is something a div can do.
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  BAND_LABEL,
  RiskIndicator,
  concentration,
  describeAge,
  describeRisk,
  driverDirection,
  freshness,
  fromRiskAssessment,
  ordinal,
  toBand,
  topDrivers,
  type RiskAssessment,
  type RiskBand,
} from "./risk-indicator";

const NOW = "2026-08-12T10:00:00Z";
const FRAMING = "A statistical estimate from historical patterns. Not a diagnosis.";

const readmission: RiskAssessment = {
  id: "r1",
  outcome: "30-day readmission",
  band: "high",
  probability: 0.31,
  percentile: 94,
  cohort: "adult medicine",
  computedAt: "2026-08-12T04:12:00Z",
  validUntil: "2026-08-13T04:12:00Z",
  drivers: [
    { label: "3 admissions / 6 mo", weight: 11.2 },
    { label: "Lives alone", weight: 4.8 },
    { label: "No PCP visit < 90 d", weight: 3.9 },
    { label: "Adherent to statin", weight: -2.1 },
  ],
  model: { name: "Readmit-v4", auc: 0.71 },
};

const render1 = (props: Partial<React.ComponentProps<typeof RiskIndicator>> = {}) =>
  render(<RiskIndicator assessment={readmission} now={NOW} notADiagnosis={FRAMING} {...props} />);

/* ------------------------------------------------------------------ */
/* Failure 1 — the score is stale                                      */
/* ------------------------------------------------------------------ */

describe("staleness", () => {
  it("puts the age on the face rather than in a tooltip", () => {
    // A tooltip is invisible to anyone who did not hover, and the population
    // that most needs this signal is the one scanning a panel of forty.
    render1();
    expect(screen.getByRole("group")).toHaveTextContent("Computed 6 hours ago");
  });

  it("says expired rather than old past the validity window", () => {
    render1({ now: "2026-08-14T09:00:00Z" });
    const group = screen.getByRole("group");
    expect(group.getAttribute("data-ox-freshness")).toBe("expired");
    expect(group).toHaveTextContent(/Expired .* ago/);
  });

  it("treats a missing validity window as unbounded, not as fresh", () => {
    // Nothing can be said about it, and the component says that rather than
    // assuming a default the model never declared.
    const { validUntil, ...noWindow } = readmission;
    void validUntil;
    render1({ assessment: noWindow });
    expect(screen.getByRole("group").getAttribute("data-ox-freshness")).toBe("unbounded");
  });

  it("computes freshness from the host's clock, never its own", () => {
    expect(freshness(readmission, "2026-08-12T10:12:00Z")).toMatchObject({ state: "fresh" });
    expect(freshness(readmission, "2026-08-14T00:00:00Z")).toMatchObject({ state: "expired" });
  });

  it("offers recompute and acknowledge, and no dismiss", async () => {
    // A score somebody waved away stays on the panel looking current.
    const onRecompute = vi.fn();
    const onAcknowledge = vi.fn();
    render1({ now: "2026-08-14T09:00:00Z", onRecompute, onAcknowledge });

    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Recompute" }));
    await userEvent.click(screen.getByRole("button", { name: "Acknowledge as expired" }));
    expect(onRecompute).toHaveBeenCalledWith(readmission);
    expect(onAcknowledge).toHaveBeenCalledWith(readmission);
  });

  it("shows no expiry actions while the score is still valid", () => {
    render1({ onRecompute: () => {}, onAcknowledge: () => {} });
    expect(screen.queryByRole("button", { name: "Recompute" })).toBeNull();
  });

  it("coarsens the age, because precision implies a freshness nobody has", () => {
    expect(describeAge(30_000)).toBe("just now");
    expect(describeAge(41 * 60_000)).toBe("41 minutes");
    expect(describeAge(6 * 3_600_000)).toBe("6 hours");
    expect(describeAge(9 * 86_400_000)).toBe("9 days");
  });
});

/* ------------------------------------------------------------------ */
/* Failure 2 — the score is unattributed                               */
/* ------------------------------------------------------------------ */

describe("attribution", () => {
  it("renders the top drivers with direction and weight", () => {
    const { container } = render1();
    const rows = container.querySelectorAll(".ox-risk__driver");
    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent("3 admissions / 6 mo");
    expect(rows[0]?.getAttribute("data-ox-direction")).toBe("raises");
    expect(rows[3]?.getAttribute("data-ox-direction")).toBe("lowers");
  });

  it("sorts by absolute weight, so the biggest driver leads", () => {
    const sorted = topDrivers(readmission.drivers!, 2).map((d) => d.label);
    expect(sorted).toEqual(["3 admissions / 6 mo", "Lives alone"]);
  });

  it("carries the sign into the accessible name, not only the colour", () => {
    render1({ driverCount: 4 });
    const name = screen.getByRole("group").getAttribute("aria-label")!;
    expect(name).toContain("3 admissions / 6 mo, raises it");
    expect(name).toContain("Adherent to statin, lowers it");
  });

  it("says when one factor is most of the score", () => {
    // A model whose top driver carries most of the attribution is not
    // modelling a patient; it is reporting one event.
    render1({
      assessment: {
        ...readmission,
        drivers: [
          { label: "ED visit, 18 months ago", weight: 14 },
          { label: "Lives alone", weight: 2.1 },
          { label: "No PCP visit < 90 d", weight: 1.8 },
        ],
      },
    });
    expect(screen.getByRole("group")).toHaveTextContent(/\d+% of this score comes from one factor/);
  });

  it("stays quiet when attribution is spread", () => {
    const { container } = render1({
      assessment: {
        ...readmission,
        drivers: [
          { label: "a", weight: 4 },
          { label: "b", weight: 4 },
          { label: "c", weight: 4 },
        ],
      },
    });
    expect(container.querySelector(".ox-risk__concentration")).toBeNull();
  });

  it("speaks the same drivers it shows", () => {
    // A screen-reader user hearing three while the face shows four is worse
    // than hearing three when the face shows three: neither knows the other set
    // exists.
    render1({ driverCount: 4 });
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain(
      "Adherent to statin, lowers it",
    );
  });

  it("computes concentration as a share of total absolute weight", () => {
    expect(
      concentration([
        { label: "a", weight: 8 },
        { label: "b", weight: 2 },
      ]),
    ).toBeCloseTo(0.8, 5);
    expect(concentration([])).toBeNull();
    // All-zero weights: no share to report rather than a division by zero.
    expect(concentration([{ label: "a", weight: 0 }])).toBeNull();
  });

  it("renders unweighted drivers without inventing a bar", () => {
    // `basis[]` from a FHIR RiskAssessment names references with no
    // attribution. Drawing a bar for them would be making one up.
    const { container } = render1({
      assessment: { ...readmission, drivers: [{ label: "Encounter/123", weight: 0 }] },
    });
    expect(container.querySelector(".ox-risk__driver-bar")).toBeNull();
    expect(container.querySelector("[data-ox-unweighted]")).toHaveTextContent("contributing");
  });

  it("knows the three directions", () => {
    expect(driverDirection({ label: "a", weight: 1 })).toBe("raises");
    expect(driverDirection({ label: "a", weight: -1 })).toBe("lowers");
    expect(driverDirection({ label: "a", weight: 0 })).toBe("neutral");
  });
});

/* ------------------------------------------------------------------ */
/* Failure 3 — the score is read as a diagnosis                        */
/* ------------------------------------------------------------------ */

describe("framing", () => {
  it("renders the framing sentence on the face", () => {
    render1();
    expect(screen.getByRole("group")).toHaveTextContent(FRAMING);
  });

  it("ends the accessible name with it", () => {
    // Put first it is boilerplate a listener skips; put last it is the
    // sentence they are left with.
    render1();
    expect(screen.getByRole("group").getAttribute("aria-label")!.endsWith(FRAMING)).toBe(true);
  });

  it("demotes the numeral and rounds it", () => {
    // Two decimal places imply a precision the model does not have.
    const { container } = render1({ assessment: { ...readmission, probability: 0.3142 } });
    expect(container.querySelector(".ox-risk__probability")).toHaveTextContent("31");
    expect(container.querySelector(".ox-risk__probability")).not.toHaveTextContent("31.4");
  });

  it("leads with the band", () => {
    const { container } = render1();
    // The band is the honest resolution of the estimate, so it is the chip in
    // the head rather than a colour on the number.
    expect(container.querySelector(".ox-risk__head [data-ox-scale='risk']")).toBeTruthy();
  });

  it("surfaces the model and its performance", () => {
    // An AUC of 0.63 trusted by clinicians who were never shown it is the
    // specific failure. The number is on the face.
    render1();
    expect(screen.getByRole("group")).toHaveTextContent("Readmit-v4 · AUC 0.71");
  });

  it("opens the model card from the keyboard", async () => {
    const onOpenModel = vi.fn();
    render1({ onOpenModel });
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onOpenModel).toHaveBeenCalledWith(readmission);
  });
});

/* ------------------------------------------------------------------ */
/* Bands and the cohort rule                                           */
/* ------------------------------------------------------------------ */

describe("bands", () => {
  const bands: RiskBand[] = ["unknown", "low", "moderate", "high", "imminent"];

  it.each(bands)("%s reaches the accessible name as a word", (band) => {
    render1({ assessment: { ...readmission, band } });
    expect(screen.getByRole("group").getAttribute("aria-label")).toContain(
      `${BAND_LABEL[band]} risk`,
    );
  });

  it("renders unknown as its own state, not as low", () => {
    // Rendering it as the bottom band is how a patient the model cannot see
    // becomes a patient the panel does not call.
    render1({ assessment: { id: "r", outcome: "Readmission", band: "unknown", computedAt: NOW } });
    const group = screen.getByRole("group");
    expect(group.getAttribute("data-ox-band")).toBe("unknown");
    expect(group).toHaveTextContent("This is not a low score");
    expect(group.getAttribute("aria-label")).toContain("could not score this patient");
  });

  it("says nothing numeric about an unscored patient", () => {
    const { container } = render1({
      assessment: {
        id: "r",
        outcome: "Readmission",
        band: "unknown",
        probability: 0.31,
        computedAt: NOW,
      },
    });
    // The probability is on the object and is deliberately not rendered:
    // saying it would be reporting a score the model did not stand behind.
    expect(container.querySelector(".ox-risk__probability")).toBeNull();
  });

  it("never speaks a percentile without its cohort", () => {
    const { cohort, ...noCohort } = readmission;
    void cohort;
    render1({ assessment: noCohort as RiskAssessment });
    expect(screen.getByRole("group").getAttribute("aria-label")).not.toContain("percentile");
  });

  it("formats ordinals correctly, including the teens", () => {
    expect(ordinal(94)).toBe("94th");
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
    expect(ordinal(21)).toBe("21st");
  });
});

/* ------------------------------------------------------------------ */
/* FHIR                                                                */
/* ------------------------------------------------------------------ */

describe("fromRiskAssessment", () => {
  it("reads the prediction, the window and the method", () => {
    const assessment = fromRiskAssessment({
      id: "ra1",
      occurrenceDateTime: "2026-08-12T04:12:00Z",
      method: { text: "Readmit-v4" },
      prediction: [
        {
          outcome: { text: "30-day readmission" },
          probabilityDecimal: 0.31,
          qualitativeRisk: { coding: [{ code: "high" }] },
          whenPeriod: { end: "2026-08-13T04:12:00Z" },
        },
      ],
    });
    expect(assessment).toMatchObject({
      outcome: "30-day readmission",
      band: "high",
      probability: 0.31,
      validUntil: "2026-08-13T04:12:00Z",
      model: { name: "Readmit-v4" },
    });
  });

  it("maps certain to imminent rather than adding a sixth band", () => {
    // A risk model does not produce certainty, and rendering the word would
    // grant it an authority the component spends its surface withholding.
    expect(toBand("certain")).toBe("imminent");
    expect(toBand("negligible")).toBe("low");
    expect(toBand("moderate")).toBe("moderate");
  });

  it("maps an unrecognised qualitative risk to unknown", () => {
    expect(toBand("something")).toBe("unknown");
    expect(toBand(undefined)).toBe("unknown");
  });

  it("turns basis into unweighted drivers", () => {
    const assessment = fromRiskAssessment({
      id: "ra2",
      basis: [{ display: "Encounter, 3 Aug" }, { reference: "Observation/44" }],
      prediction: [{ outcome: { text: "Deterioration" } }],
    });
    expect(assessment?.drivers).toEqual([
      { label: "Encounter, 3 Aug", weight: 0 },
      { label: "Observation/44", weight: 0 },
    ]);
  });

  it("returns null when there is no prediction to render", () => {
    expect(fromRiskAssessment({ id: "empty" })).toBeNull();
  });
});

describe("describeRisk", () => {
  it("composes the whole statement in the reading order", () => {
    expect(describeRisk(readmission, NOW, FRAMING)).toBe(
      "30-day readmission: High risk. 31 per cent. 94th percentile of adult medicine. " +
        "Computed 6 hours ago. Top drivers: 3 admissions / 6 mo, raises it; Lives alone, raises it; " +
        "No PCP visit < 90 d, raises it. Readmit-v4, AUC 0.71. " +
        FRAMING,
    );
  });
});

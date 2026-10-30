"use client";

import * as React from "react";
import {
  RiskIndicator,
  type RiskAssessment,
} from "@/registry/zoblocks/risk-indicator/risk-indicator";

const NOW = "2026-08-12T10:00:00Z";

export function TheThreeFailures() {
  const assessment: RiskAssessment = {
    id: "readmit-30",
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
  return (
    <RiskIndicator
      now={NOW}
      notADiagnosis="A statistical estimate from historical patterns. Not a diagnosis."
      assessment={assessment}
    />
  );
}

export function ExpiredNotOld() {
  const [action, setAction] = React.useState<string | null>(null);
  const assessment: RiskAssessment = {
    id: "deterioration-24h",
    outcome: "Deterioration within 24 h",
    band: "high",
    probability: 0.42,
    computedAt: "2026-08-12T04:12:00Z",
    validUntil: "2026-08-13T04:12:00Z",
    drivers: [
      { label: "Rising respiratory rate", weight: 6.1 },
      { label: "Lactate trending up", weight: 3.4 },
    ],
    model: { name: "Deteriorate-v2", auc: 0.74 },
  };
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <RiskIndicator
        now="2026-08-14T09:00:00Z"
        notADiagnosis="A statistical estimate, not a diagnosis."
        assessment={assessment}
        onRecompute={() => setAction("Recompute requested — the host would call the model again.")}
        onAcknowledge={() =>
          setAction("Acknowledged as expired — stays on the panel, marked seen, not dismissed.")
        }
      />
      <span style={{ fontSize: 12, opacity: 0.62 }}>
        {action ?? "Two ways out of an expired score, and no third: recompute or acknowledge."}
      </span>
    </div>
  );
}

export function NotScoredIsNotLow() {
  const assessment: RiskAssessment = {
    id: "readmit-30-unscored",
    outcome: "30-day readmission",
    band: "unknown",
    computedAt: "2026-08-12T04:12:00Z",
  };
  return (
    <RiskIndicator
      now={NOW}
      notADiagnosis="A statistical estimate, not a diagnosis."
      assessment={assessment}
    />
  );
}

export function ConcentrationDominance() {
  const assessment: RiskAssessment = {
    id: "readmit-30-concentration",
    outcome: "30-day readmission",
    band: "high",
    probability: 0.28,
    computedAt: "2026-08-12T04:12:00Z",
    // 78% of the attribution sits on one driver, and the card says so.
    drivers: [
      { label: "ED visit, 18 months ago", weight: 14.0 },
      { label: "Lives alone", weight: 2.1 },
      { label: "No PCP visit < 90 d", weight: 1.8 },
    ],
    model: { name: "Readmit-v4", auc: 0.71 },
  };
  return (
    <RiskIndicator
      now={NOW}
      notADiagnosis="A statistical estimate from historical patterns. Not a diagnosis."
      assessment={assessment}
    />
  );
}

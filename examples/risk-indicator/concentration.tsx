import { RiskIndicator, type RiskAssessment } from "@/components/zoblocks/risk-indicator";
import { NOT_A_DIAGNOSIS } from "./_shared/shared";

const now = "2026-08-12T10:00:00Z";
const assessment: RiskAssessment = {
  id: "readmit-30-concentration",
  outcome: "30-day readmission",
  band: "high",
  probability: 0.28,
  computedAt: "2026-08-12T04:12:00Z",
  drivers: [
    { label: "ED visit, 18 months ago", weight: 14.0 },
    { label: "Lives alone", weight: 2.1 },
    { label: "No PCP visit < 90 d", weight: 1.8 },
  ],
  model: { name: "Readmit-v4", auc: 0.71 },
};

export default function WhenOneFactorIsMostOfTheScore() {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <RiskIndicator assessment={assessment} now={now} notADiagnosis={NOT_A_DIAGNOSIS} />
    </section>
  );
}

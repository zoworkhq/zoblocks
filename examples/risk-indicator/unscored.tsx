import { RiskIndicator, type RiskAssessment } from "@/components/zoblocks/risk-indicator";
import { NOT_A_DIAGNOSIS } from "./_shared/shared";

const now = "2026-08-12T10:00:00Z";
const assessment: RiskAssessment = {
  id: "readmit-30-unscored",
  outcome: "30-day readmission",
  band: "unknown",
  computedAt: "2026-08-12T04:12:00Z",
};

export default function NotScoredIsNotLow() {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <RiskIndicator assessment={assessment} now={now} notADiagnosis={NOT_A_DIAGNOSIS} />
    </section>
  );
}

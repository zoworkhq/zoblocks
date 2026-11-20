import { RiskIndicator, type RiskAssessment } from "@/components/zoblocks/risk-indicator";
import { NOT_A_DIAGNOSIS } from "./_shared/shared";

const now = "2026-08-12T10:00:00Z";
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

export default function TheDateDriversAndFraming() {
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <RiskIndicator assessment={assessment} now={now} notADiagnosis={NOT_A_DIAGNOSIS} />
    </section>
  );
}

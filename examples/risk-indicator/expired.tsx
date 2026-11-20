import { useState } from "react";
import { RiskIndicator, type RiskAssessment } from "@/components/zoblocks/risk-indicator";
import { NOT_A_DIAGNOSIS } from "./_shared/shared";

const now = "2026-08-14T09:00:00Z";
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

export default function ExpiredNotOld() {
  const [feedback, setFeedback] = useState<string | null>(null);
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <RiskIndicator
        assessment={assessment}
        now={now}
        notADiagnosis={NOT_A_DIAGNOSIS}
        onRecompute={() => setFeedback("Recompute requested")}
        onAcknowledge={() => setFeedback("Acknowledged as expired")}
      />
      {feedback ? <span aria-live="polite">{feedback}</span> : null}
    </section>
  );
}

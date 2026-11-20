import { Signature, type SignatureValue } from "@zoblocks/signature";
import { Example, NOW, RECORDER, RECORDED_AT, patientSignature } from "./_shared/shared";

const value: SignatureValue = {
  outcome: "pending",
  awaiting: "clinician",
  since: "2026-11-05T11:40:00.000Z",
  soFar: [patientSignature],
  recordedAt: RECORDED_AT,
  recordedBy: RECORDER,
};

export default function AwaitingCountersignature() {
  return (
    <Example>
      <Signature now={NOW} value={value} disabled />
    </Example>
  );
}

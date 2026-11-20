import { Signature, type SignatureValue } from "@zoblocks/signature";
import {
  Example,
  NOW,
  RECORDER,
  RECORDED_AT,
  REVOKED_AT,
  patientSignature,
} from "./_shared/shared";

const value: SignatureValue = {
  outcome: "revoked",
  original: patientSignature,
  revokedBy: { name: "Josh Randall" },
  revokedAt: REVOKED_AT,
  reason: "Changed their mind after speaking with their daughter.",
  recordedAt: RECORDED_AT,
  recordedBy: RECORDER,
};

export default function ConsentWithdrawn() {
  return (
    <Example>
      <Signature now={NOW} value={value} disabled />
    </Example>
  );
}

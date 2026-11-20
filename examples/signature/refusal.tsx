import { useState } from "react";
import { Signature, type SignatureValue } from "@zoblocks/signature";
import { ATTESTATION, Example, NOW, RECORDER, SUBJECT, outcomeLabel } from "./_shared/shared";

export default function PatientRefusal() {
  const [value, setValue] = useState<SignatureValue>();
  return (
    <Example>
      <Signature
        now={NOW}
        meaning="consent"
        attestation={ATTESTATION}
        subject={SUBJECT}
        recordedBy={RECORDER}
        outcomes={["declined", "unable", "verbal", "on-paper"]}
        onChange={setValue}
      />
      {value && <p role="status">Recorded outcome: {outcomeLabel(value)}</p>}
    </Example>
  );
}

import { Signature } from "@zoblocks/signature";
import { ATTESTATION, Example, NOW, RECORDER, SUBJECT } from "./_shared/shared";

export default function KeyboardAlone() {
  return (
    <Example>
      <Signature
        now={NOW}
        meaning="consent"
        attestation={ATTESTATION}
        subject={SUBJECT}
        recordedBy={RECORDER}
        methods={["type"]}
      />
    </Example>
  );
}

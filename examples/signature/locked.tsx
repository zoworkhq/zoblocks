import { Signature } from "@zoblocks/signature";
import { Example, NOW, patientSignature } from "./_shared/shared";

export default function SubmittedFormLegible() {
  return (
    <Example>
      <Signature now={NOW} value={patientSignature} disabled />
    </Example>
  );
}

import { useState } from "react";
import { Button, Form } from "antd";
import { Signature, signatureRequired } from "@zoblocks/signature";
import { ATTESTATION, Example, NOW, RECORDER, SUBJECT, outcomeLabel } from "./_shared/shared";

export default function ConsentInsideAntdForm() {
  const [submitted, setSubmitted] = useState<string>();
  return (
    <Example>
      <Form layout="vertical" onFinish={({ consent }) => setSubmitted(outcomeLabel(consent))}>
        <Form.Item name="consent" label="Patient signature" rules={[signatureRequired()]}>
          <Signature
            now={NOW}
            meaning="consent"
            attestation={ATTESTATION}
            subject={SUBJECT}
            recordedBy={RECORDER}
            outcomes={["declined", "unable"]}
          />
        </Form.Item>
        <Button htmlType="submit" type="primary">
          Submit
        </Button>
        {submitted && <p role="status">Submitted: {submitted}</p>}
      </Form>
    </Example>
  );
}

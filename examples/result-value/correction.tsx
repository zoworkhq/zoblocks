import { ResultValue } from "@/components/zoblocks/result-value";

const now = "2026-08-03T08:21:00Z";

export default function CorrectionExample() {
  return (
    <ResultValue
      now={now}
      value={{
        id: "trop",
        versionId: "2",
        analyte: "Troponin I",
        value: 0.09,
        unit: "ng/mL",
        range: { high: 0.04 },
        status: "corrected",
        superseded: { value: "<0.04", at: "14:22 today" },
      }}
    />
  );
}

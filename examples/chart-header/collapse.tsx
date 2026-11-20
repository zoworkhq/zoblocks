import { useState } from "react";
import { ChartHeader, type SafetyInput } from "@/components/zoblocks/chart-header";
import { NOW, patient } from "./_shared/patient";

const safety: SafetyInput = {
  allergies: { label: "Penicillin — anaphylaxis", tone: "critical", detail: "confirmed" },
  codeStatus: { label: "DNR" },
};

export default function CollapseExample() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ChartHeader
      patient={patient}
      identifiers={[{ kind: "mrn" }, { kind: "nhs" }]}
      now={NOW}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      safety={safety}
    />
  );
}

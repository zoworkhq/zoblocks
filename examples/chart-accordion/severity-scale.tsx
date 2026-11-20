import { ChartAccordion } from "@/components/zoblocks/chart-accordion";

// Every severity carries its words; the header never relies on colour alone.
export default function SeverityScale() {
  return (
    <ChartAccordion
      headingLevel={3}
      sections={[
        { key: "risk", label: "Risk", severity: "critical", status: "C-SSRS positive" },
        { key: "meds", label: "Medications", severity: "high", status: "ANC due 18 Aug" },
        { key: "plan", label: "Safety plan", severity: "normal", status: "Current" },
        { key: "audit", label: "AUDIT", severity: "unknown", status: "Not asked this visit" },
      ]}
    />
  );
}

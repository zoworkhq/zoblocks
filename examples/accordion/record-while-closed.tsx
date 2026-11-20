import { Accordion } from "@/components/zoblocks/accordion";

export default function RecordReadsWhileClosedExample() {
  return (
    <Accordion
      headingLevel={3}
      items={[
        {
          key: "risk",
          label: "Risk & suicidality",
          severity: "critical",
          summary: "C-SSRS positive · 13 Aug",
          children: (
            <p>Ideation 3 — active thoughts, no plan, no intent, no preparatory behaviour.</p>
          ),
        },
        {
          key: "medications",
          label: "Medications",
          severity: "high",
          summary: "Clozapine ANC due 18 Aug",
          children: <p>Clozapine 300 mg nightly. Lithium carbonate 900 mg nightly.</p>,
        },
        {
          key: "safety-plan",
          label: "Safety plan",
          severity: "normal",
          summary: "Current · revised 11 Aug",
          children: <p>Six steps complete. Means restriction reviewed on 11 August.</p>,
        },
        {
          key: "audit",
          label: "AUDIT",
          severity: "unknown",
          summary: "Not asked this visit",
          children: <p>Alcohol screening was not completed during this visit.</p>,
        },
      ]}
    />
  );
}

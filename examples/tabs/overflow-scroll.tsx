import { Tabs } from "@zoblocks/tabs";

const chartSections = [
  { value: "summary", label: "Summary" },
  { value: "observations", label: "Observations" },
  { value: "medications", label: "Medications" },
  { value: "allergies", label: "Allergies" },
  { value: "problems", label: "Problems" },
  { value: "procedures", label: "Procedures" },
  { value: "immunisations", label: "Immunisations" },
  { value: "documents", label: "Documents" },
  { value: "encounters", label: "Encounters" },
  { value: "care-plans", label: "Care plans" },
  { value: "audit-log", label: "Audit log" },
];

export default function OverflowScrollExample() {
  return (
    <section className="space-y-4">
      <div className="max-w-xl">
        <Tabs
          as="tabs"
          variant="underline"
          overflow="scroll"
          aria-label="Chart section"
          defaultValue="summary"
          items={chartSections}
        />
      </div>
    </section>
  );
}

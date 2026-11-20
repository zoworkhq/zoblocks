import { Tabs } from "@zoblocks/tabs";
import { allergyList, medicationList, observationPanel } from "./_shared/tabs-fixtures";

function Summary() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <p className="text-sm">
        <strong>Summary</strong> — Problems, allergies, recent encounters.
      </p>
    </div>
  );
}

function Labs() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <p className="text-sm">
        <strong>Labs</strong> — 8 results in the latest panel.
      </p>
    </div>
  );
}

function Meds() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <p className="text-sm">
        <strong>Medications</strong> — 5 active.
      </p>
    </div>
  );
}

function Allergies() {
  return (
    <div className="rounded-xl border border-dashed border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-4">
      <p className="text-sm">
        <strong>Allergies</strong> — 4 recorded.
      </p>
    </div>
  );
}

export default function PatientRoutineExample() {
  return (
    <section className="space-y-4">
      <Tabs
        as="tabs"
        aria-label="Chart sections"
        defaultValue="summary"
        items={[
          {
            value: "summary",
            label: "Summary",
            children: <Summary />,
          },
          {
            value: "labs",
            label: "Labs",
            count: observationPanel.length,
            tone: "critical",
            children: <Labs />,
          },
          {
            value: "meds",
            label: "Medications",
            count: medicationList.length,
            children: <Meds />,
          },
          {
            value: "allergies",
            label: "Allergies",
            count: allergyList.length,
            children: <Allergies />,
          },
        ]}
      />
    </section>
  );
}

import { Tabs } from "@zoblocks/tabs";

function Summary() {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-[#F8FAFC] p-4">
      <p className="text-sm">
        <strong>Summary</strong> — Problems, allergies, recent encounters.
      </p>
    </div>
  );
}

export default function PatientRestrictedExample() {
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
            value: "bh",
            label: "Behavioural health",
            disabled: true,
            disabledReason:
              "Restricted. Opening it records an access event and notifies the record owner.",
          },
        ]}
      />
    </section>
  );
}

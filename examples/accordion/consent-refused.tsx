import { Accordion } from "@/components/zoblocks/accordion";

export default function ApplicationRefusesExample() {
  return (
    <Accordion
      headingLevel={3}
      onDisclose={() => false}
      items={[
        {
          key: "sud",
          label: "Substance use treatment",
          access: {
            kind: "consent",
            policy: "42 CFR Part 2",
            state: "missing",
          },
          children: (
            <div className="space-y-2">
              <p className="font-medium">Substance use treatment record</p>
              <p>This section contains confidential treatment information.</p>
              <p>Example: Treatment plan reviewed on 12 August.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

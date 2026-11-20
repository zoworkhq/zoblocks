import { Accordion } from "@/components/zoblocks/accordion";

export default function ConsentGateExample() {
  return (
    <Accordion
      headingLevel={3}
      onDisclose={() => true}
      items={[
        {
          key: "sud",
          label: "Substance use treatment",
          summary: "42 CFR Part 2",
          access: {
            kind: "consent",
            policy: "42 CFR Part 2",
            state: "granted",
            expiresAt: "2027-02-02",
          },
          children: (
            <div className="space-y-2">
              <p className="font-semibold">Substance use treatment records</p>
              <p>Treatment history, care plans, and related clinical documentation.</p>
            </div>
          ),
        },
        {
          key: "notes",
          label: "Progress notes",
          summary: "142 encounters",
          children: (
            <div className="space-y-2">
              <p className="font-semibold">Progress notes</p>
              <p>Clinical notes from 142 patient encounters.</p>
            </div>
          ),
        },
      ]}
    />
  );
}

import { Accordion } from "@/components/zoblocks/accordion";

export default function BreakGlassWithReasonExample() {
  return (
    <Accordion
      headingLevel={3}
      onDisclose={async (event) => {
        console.log("Access audit event:", {
          section: event.key,
          reason: event.reasonCode,
          at: event.at,
        });

        return true;
      }}
      items={[
        {
          key: "external",
          label: "Records from another organisation",
          severity: "high",
          summary: "Access is recorded",
          access: {
            kind: "reason",
            reasons: [
              { code: "emergency", label: "Emergency treatment" },
              { code: "covering", label: "Covering clinician" },
              { code: "coordination", label: "Care coordination" },
            ],
          },
          children: (
            <div className="space-y-2">
              <p className="font-semibold">External clinical records</p>
              <p>
                Records from another organisation are now available for this patient&apos;s care.
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}

import { useState } from "react";
import { ChartAccordion } from "@/components/zoblocks/chart-accordion";
import { TOOLBAR_LABEL, sections } from "./_shared/record";

export default function ConsentGate() {
  // Stands in for the host's audit service: the component reports the
  // disclosure, the host decides whether it may proceed.
  const [audit, setAudit] = useState<string[]>([]);

  return (
    <div className="grid w-full gap-3">
      <ChartAccordion
        toolbarLabel={TOOLBAR_LABEL}
        headingLevel={3}
        defaultOpenKeys={["sud"]}
        onDisclose={async (event) => {
          setAudit((entries) => [...entries, `Disclosed "${String(event.key)}"`]);
          return true;
        }}
        sections={[
          ...sections.slice(0, 2),
          {
            key: "sud",
            label: "Substance use treatment",
            severity: "unknown",
            status: "42 CFR Part 2",
            access: { kind: "consent", policy: "42 CFR Part 2", state: "granted" },
            children: <p>Intensive outpatient programme, three sessions weekly.</p>,
          },
        ]}
      />
      <p role="status" className="m-0 text-xs" style={{ color: "var(--zb-text-muted)" }}>
        Audit: {audit.length ? audit.join(" · ") : "nothing disclosed yet"}
      </p>
    </div>
  );
}

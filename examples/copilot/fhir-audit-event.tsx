import { useState } from "react";
import { Copilot } from "@/components/zoblocks/copilot";
import {
  createStaticProvider,
  lookUp,
  minimalDisclosure,
  type CopilotEvent,
} from "@zoblocks/copilot-core";

const events: CopilotEvent[] = [
  { type: "delta", text: "This is a scripted response for the audit callback example." },
  { type: "done", finish: "stop" },
];

const provider = createStaticProvider({
  events,
  disclosure: minimalDisclosure("scripted-demo@1", {
    developer: "Documentation example",
    knowledgeCutoff: "2026-01",
  }),
});

let auditExchangeSequence = 0;

export default function AuditEventExample() {
  const [auditEvent, setAuditEvent] = useState<unknown>();

  return (
    <div className="w-full min-w-0 max-w-[36rem]">
      <Copilot
        provider={provider}
        modes={[lookUp]}
        actor={{ display: "Documentation example" }}
        now={() => "2026-01-15T12:00:00.000Z"}
        newId={() => `demo-exchange-${++auditExchangeSequence}`}
        onAudit={setAuditEvent}
        anchor="inline"
      />
      <p className="m-0 mt-3 text-xs leading-relaxed text-[var(--zb-text-muted)]">
        In-memory preview of the actual FHIR R4 AuditEvent received by the onAudit callback.
        Emission is best-effort, not guaranteed for every path; some stopped exchanges and error
        paths may not produce an event. The host is responsible for persistence and transmission.
      </p>
      <pre className="mt-2 max-h-64 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[var(--zb-border)] p-3 text-[0.6875rem]">
        {auditEvent
          ? JSON.stringify(auditEvent, null, 2)
          : "Send a question to see the callback object."}
      </pre>
    </div>
  );
}

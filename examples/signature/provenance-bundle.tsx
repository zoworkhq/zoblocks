import { useMemo } from "react";
import { toFhirBundle } from "@zoblocks/signature";
import { Example, patientSignature } from "./_shared/shared";

export default function FhirBundle() {
  const bundle = useMemo(
    () =>
      toFhirBundle(patientSignature, {
        release: "R4",
        subject: { display: "Randall, Josh", reference: "Patient/4471902" },
      }),
    [],
  );
  const entries = bundle.entry as Array<{
    resource?: { resourceType?: string };
    request?: { method?: string; url?: string };
  }>;

  return (
    <Example>
      <div className="grid w-full max-w-xl gap-3 text-[var(--zb-text)]">
        <ol className="m-0 grid list-none gap-2 p-0">
          {entries.map((entry, index) => (
            <li
              key={index}
              className="flex items-baseline gap-3 rounded-lg border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-sm"
            >
              <span className="font-mono text-xs text-[var(--zb-text-muted)]">entry[{index}]</span>
              <span className="font-medium text-[var(--zb-text)]">
                {entry.request?.method} {entry.resource?.resourceType}
              </span>
            </li>
          ))}
        </ol>
        <details className="text-xs">
          <summary className="cursor-pointer text-[var(--zb-text-muted)]">
            The whole transaction Bundle
          </summary>
          <pre className="m-0 mt-2 max-h-72 overflow-auto rounded-lg border border-[var(--zb-border)] bg-[var(--zb-bg-subtle)] p-3 font-mono text-[0.6875rem] leading-relaxed text-[var(--zb-text)]">
            {JSON.stringify(bundle, null, 2)}
          </pre>
        </details>
      </div>
    </Example>
  );
}

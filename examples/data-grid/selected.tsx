import { useState } from "react";
import { CASELOAD, DemoGrid, Example, HostStatus } from "./_shared/shared";

export default function SelectedWithVerbs() {
  const [selected, setSelected] = useState<readonly string[]>([CASELOAD[0]!.mrn]);
  const [action, setAction] = useState<string | null>(null);

  return (
    <Example>
      <div className="grid min-w-0 gap-2">
        <DemoGrid
          rows={CASELOAD}
          identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
          selectedKeys={selected}
          onSelectionChange={setSelected}
          bulkActions={(selectedRows) => (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--zb-surface, #fff)",
                  borderColor: "var(--zb-border, #cbd5e1)",
                  color: "var(--zb-text, #1e293b)",
                }}
                onClick={() =>
                  setAction(
                    `Assign clinician requested for ${selectedRows.map((row) => row.name).join(", ")}.`,
                  )
                }
              >
                Assign clinician
              </button>
              <button
                type="button"
                className="rounded border px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--zb-surface, #fff)",
                  borderColor: "var(--zb-border, #cbd5e1)",
                  color: "var(--zb-text, #1e293b)",
                }}
                onClick={() =>
                  setAction(
                    `Schedule contact requested for ${selectedRows.map((row) => row.name).join(", ")}.`,
                  )
                }
              >
                Schedule contact · {selectedRows.length}
              </button>
            </div>
          )}
        />
        {action ? <HostStatus>{action}</HostStatus> : null}
      </div>
    </Example>
  );
}

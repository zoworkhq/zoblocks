import { ABSENCE_CASELOAD, CASELOAD, DemoGrid, Example, type CaseloadRow } from "./_shared/shared";

const rows: readonly CaseloadRow[] = [...CASELOAD, ...ABSENCE_CASELOAD];
const coverage = { shown: rows.length, total: 312, noun: "clients" };

export default function AnAbsenceSortsLast() {
  return (
    <Example>
      <div className="grid min-w-0 gap-6">
        <div className="grid min-w-0 gap-2">
          <h3
            className="m-0 text-sm font-medium"
            style={{ color: "var(--zb-text-muted, #64748b)" }}
          >
            Ascending
          </h3>
          <DemoGrid
            rows={rows}
            coverage={coverage}
            defaultSort={{ key: "phq9", direction: "ascending" }}
          />
        </div>
        <div className="grid min-w-0 gap-2">
          <h3
            className="m-0 text-sm font-medium"
            style={{ color: "var(--zb-text-muted, #64748b)" }}
          >
            Descending
          </h3>
          <DemoGrid
            rows={rows}
            coverage={coverage}
            defaultSort={{ key: "phq9", direction: "descending" }}
          />
        </div>
      </div>
    </Example>
  );
}

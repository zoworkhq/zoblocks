import { useState } from "react";
import { CASELOAD, DemoGrid, Example, HostStatus, type CaseloadRow } from "./_shared/shared";

const arrivals: readonly CaseloadRow[] = CASELOAD.slice(0, 3).map((row, index) => ({
  ...row,
  phq9: [21, 14, 5][index]!,
  previousPhq9: [18, 11, 7][index]!,
  risk: [0.74, 0.58, 0.33][index]!,
}));

export default function ResultsArriveNothingMoves() {
  const [rows, setRows] = useState<readonly CaseloadRow[]>(CASELOAD);
  const [held, setHeld] = useState<readonly CaseloadRow[] | undefined>(arrivals);

  return (
    <Example>
      <div className="grid min-w-0 gap-2">
        <DemoGrid
          rows={rows}
          coverage={{ shown: rows.length, total: 312, noun: "clients" }}
          arrivals={held}
          arrivalsAt="11:47"
          onAdmitArrivals={(arrived) => {
            const byMrn = new Map(arrived.map((row) => [row.mrn, row]));
            setRows((current) => current.map((row) => byMrn.get(row.mrn) ?? row));
            setHeld(undefined);
          }}
        />
        <HostStatus>
          {held ? "The host has not changed the rows." : "The host admitted the held results."}
        </HostStatus>
      </div>
    </Example>
  );
}

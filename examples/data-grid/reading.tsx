import { useState } from "react";
import { CASELOAD, DemoGrid, Example, HostStatus } from "./_shared/shared";

export default function TheRowTheReaderIsOn() {
  const [activated, setActivated] = useState<string | null>(null);
  return (
    <Example>
      <div className="grid min-w-0 gap-2">
        <DemoGrid
          rows={CASELOAD}
          identify={(row) => ({ primary: row.name, secondary: `MRN ${row.mrn}` })}
          onRowActivate={(row) => setActivated(row.name)}
        />
        <HostStatus>
          {activated
            ? `onRowActivate — ${activated}`
            : "Use the arrow keys to move through cells; press Enter to activate a row."}
        </HostStatus>
      </div>
    </Example>
  );
}

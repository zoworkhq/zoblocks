import { useEffect, useRef, useState } from "react";
import { ABSENCE_CASELOAD, CASELOAD, DemoGrid, Example, type CaseloadRow } from "./_shared/shared";

const NEXT_ROWS = ABSENCE_CASELOAD;

export default function LoadingMore() {
  const [rows, setRows] = useState<readonly CaseloadRow[]>(CASELOAD);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <Example>
      <div className="min-w-0 max-w-3xl">
        <DemoGrid
          rows={rows}
          coverage={{ shown: rows.length, total: "unknown", noun: "clients" }}
          maxHeight="9rem"
          onReachEnd={() => {
            if (loading || exhausted) return;
            setLoading(true);
            timer.current = window.setTimeout(() => {
              setRows((current) => [...current, ...NEXT_ROWS]);
              setLoading(false);
              setExhausted(true);
            }, 550);
          }}
          loadingMore={loading}
          exhausted={exhausted}
        />
      </div>
    </Example>
  );
}

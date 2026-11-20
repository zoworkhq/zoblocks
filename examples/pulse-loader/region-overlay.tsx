import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { PulseLoader } from "@/components/zoblocks/pulse-loader";

function ResultsTable() {
  return (
    <table className="w-full text-left text-sm" aria-hidden="true">
      <thead>
        <tr className="border-b border-[var(--zb-border)] text-[var(--zb-text-muted)]">
          <th className="px-4 py-2 font-medium">Result</th>
          <th className="px-4 py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-[var(--zb-border)]">
          <td className="px-4 py-3">Complete blood count</td>
          <td className="px-4 py-3">Ready</td>
        </tr>
        <tr>
          <td className="px-4 py-3">Metabolic panel</td>
          <td className="px-4 py-3">Updating</td>
        </tr>
      </tbody>
    </table>
  );
}

export default function RegionDelayDemo() {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const simulateResponse = (responseMs: number) => {
    window.clearTimeout(timer.current);
    setOpen(true);
    timer.current = window.setTimeout(() => setOpen(false), responseMs);
  };

  return (
    <DemoSection>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => simulateResponse(2000)}
          className="rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
        >
          Response in 2000 ms
        </button>
        <button
          type="button"
          onClick={() => simulateResponse(250)}
          className="rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
        >
          Response in 250 ms
        </button>
      </div>
      <div className="relative min-h-[180px] overflow-hidden rounded-lg border border-[var(--zb-border)]">
        <ResultsTable />
        <PulseLoader
          mode="overlay"
          label="Loading results"
          delay={200}
          minDuration={400}
          open={open}
        />
      </div>
    </DemoSection>
  );
}

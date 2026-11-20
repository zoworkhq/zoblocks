import * as React from "react";
import DemoSection from "./_shared/DemoSection";
import { PulseLoader } from "@/components/zoblocks/pulse-loader";

export default function StallCallbackDemo() {
  const [open, setOpen] = React.useState(true);
  const [slowReports, setSlowReports] = React.useState(0);

  return (
    <DemoSection>
      <div className="grid justify-items-center gap-3">
        <PulseLoader
          showLabel
          label="Loading your records"
          slowAfter={3000}
          open={open}
          onSlow={() => setSlowReports((count) => count + 1)}
          actions={
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-[var(--zb-border)] px-3 py-1.5 text-sm text-[var(--zb-text)]"
            >
              Go back
            </button>
          }
        />
        <span className="text-xs text-[var(--zb-text-muted)]" aria-live="polite">
          Host onSlow reports: {slowReports}
        </span>
      </div>
    </DemoSection>
  );
}

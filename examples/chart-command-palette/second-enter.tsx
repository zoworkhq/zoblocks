import { useState } from "react";
import {
  ChartCommandPalette,
  outcomeFor,
  type PaletteItem,
} from "@/components/zoblocks/chart-command-palette";

const discontinue: PaletteItem = {
  id: "discontinue",
  kind: "action",
  label: "Discontinue medication",
  detail: "Clinical action",
  significant: true,
};

const offlineOrder: PaletteItem = {
  id: "offlineOrder",
  kind: "action",
  label: "Order medication",
  detail: "Order prescription",
  unavailable: { reason: "Offline" },
};

const items = [discontinue, offlineOrder];

export default function SignificantActionConfirmation() {
  const [open, setOpen] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-3.5">
      <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-[var(--zb-border)] bg-[var(--zb-surface)] p-5 [contain:layout_paint]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-sm text-[var(--zb-text)] hover:bg-slate-50"
        >
          Try the action palette
        </button>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">Helper outcomes</h3>
            <pre className="overflow-x-auto rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface-raised)] p-3 text-xs text-[var(--zb-text)]">
              {JSON.stringify(
                {
                  "outcomeFor(discontinue)": outcomeFor(discontinue),
                  "outcomeFor(discontinue, true)": outcomeFor(discontinue, true),
                  "outcomeFor(offlineOrder)": outcomeFor(offlineOrder),
                },
                null,
                2,
              )}
            </pre>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">Palette status</h3>
            <p className="text-sm text-[var(--zb-text-muted)]">
              {lastRun ? `Ran: ${lastRun}` : "No action has run yet."}
            </p>
            <p className="mt-2 text-xs text-[var(--zb-text-muted)]">
              Try “discontinue” for the two-step confirmation, then reopen and type “order” to see
              the unavailable row. Selecting a blocked row leaves the palette open.
            </p>
          </div>
        </div>
        <ChartCommandPalette
          open={open}
          items={items}
          onClose={() => setOpen(false)}
          onRun={(item) => setLastRun(item.label)}
          placeholder={'Try "discontinue" or "order"…'}
        />
      </div>
    </section>
  );
}

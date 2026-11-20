import { useState } from "react";
import {
  ChartCommandPalette,
  applyScope,
  describeWithheld,
  rank,
} from "@/components/zoblocks/chart-command-palette";
import { paletteItems, patientScope } from "./_shared/palette-data";

const items = paletteItems;
const results = applyScope(rank("okon", items), { inScope: new Set(["p-mine"]) });
const withheldMessage = describeWithheld(3, { inScope: new Set(["p-mine"]), breakGlass: true });

export default function OutOfScopeCount() {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-3.5">
      <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-[var(--zb-border)] bg-[var(--zb-surface)] p-5 [contain:layout_paint]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-sm text-[var(--zb-text)] hover:bg-slate-50"
        >
          Search patients
        </button>
        <div className="mt-5 flex flex-col gap-3" aria-label="Scoped results for okon">
          {results.visible
            .filter((entry) => entry.item.kind === "patient")
            .map(({ item }) => (
              <div key={item.id} className="rounded-md border border-[var(--zb-border)] p-3">
                <div className="text-sm font-medium text-[var(--zb-text)]">{item.label}</div>
                {item.detail && (
                  <div className="mt-1 text-xs text-[var(--zb-text-muted)]">{item.detail}</div>
                )}
              </div>
            ))}
          {results.withheld > 0 && (
            <div className="rounded-md border border-[var(--zb-border)] px-3 py-2 text-sm text-[var(--zb-text-muted)]">
              <span className="font-medium text-[var(--zb-text)]">
                withheld: {results.withheld}
              </span>
              <span className="ml-2">{withheldMessage}</span>
            </div>
          )}
        </div>
        <div className="mt-4 font-mono text-xs text-[var(--zb-text-muted)]">
          applyScope(rank(&quot;okon&quot;, items), &#123; inScope: new Set([&quot;p-mine&quot;])
          &#125;)
        </div>
        <ChartCommandPalette
          open={open}
          items={paletteItems}
          scope={patientScope}
          onClose={() => setOpen(false)}
          placeholder="Search patients…"
        />
      </div>
    </section>
  );
}

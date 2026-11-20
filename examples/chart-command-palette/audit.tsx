import { useState } from "react";
import {
  ChartCommandPalette,
  applyScope,
  auditFor,
  rank,
  type SearchAudit,
} from "@/components/zoblocks/chart-command-palette";
import { paletteItems, patientScope } from "./_shared/palette-data";

const results = applyScope(rank("okon", paletteItems), patientScope);
const okonkwoAudit = auditFor("okonkwo", results, true);
const unmatchedResults = applyScope(rank("zzq", paletteItems), patientScope);
const unmatchedAudit = auditFor("zzq", unmatchedResults, true);
const nonPatientAudit = auditFor("dark mode", results, false);

export default function EveryPatientSearchRecorded() {
  const [open, setOpen] = useState(false);
  const [latestAudit, setLatestAudit] = useState<SearchAudit | null>(null);

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
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">
              Latest emitted audit
            </h3>
            <pre className="min-h-24 overflow-x-auto rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface-raised)] p-3 text-xs text-[var(--zb-text)]">
              {latestAudit
                ? JSON.stringify(latestAudit, null, 2)
                : "No patient search audit yet. Type in the palette to emit one."}
            </pre>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">Helper examples</h3>
            <pre className="overflow-x-auto rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface-raised)] p-3 text-xs text-[var(--zb-text)]">
              {JSON.stringify(
                {
                  'auditFor("okonkwo", results, true)': okonkwoAudit,
                  'auditFor("zzq", unmatchedResults, true)': unmatchedAudit,
                  'auditFor("dark mode", results, false)': nonPatientAudit,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
        <ChartCommandPalette
          open={open}
          items={paletteItems}
          scope={patientScope}
          onClose={() => setOpen(false)}
          onSearchAudit={setLatestAudit}
          placeholder="Search patients…"
        />
      </div>
    </section>
  );
}

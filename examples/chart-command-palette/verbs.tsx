import { useState } from "react";
import {
  ChartCommandPalette,
  ITEM_KIND_LABEL,
  KIND_ORDER,
  KIND_WEIGHT,
  rank,
  type PaletteItem,
} from "@/components/zoblocks/chart-command-palette";

const items: PaletteItem[] = [
  {
    id: "doc",
    kind: "chart-resource",
    label: "PHQ-9 result, 12 Aug",
    detail: "Score 14 · frequent resource",
    frequency: 100,
  },
  {
    id: "run",
    kind: "action",
    label: "Start PHQ-9",
    detail: "Assessment · 9 items · 4 min",
  },
  { id: "safety", kind: "action", label: "Open safety plan" },
  { id: "patient", kind: "patient", label: "A. Okonkwo" },
  { id: "template", kind: "template", label: "Behavioral health note" },
  { id: "setting", kind: "setting", label: "Appearance and theme" },
  { id: "help", kind: "help", label: "Keyboard shortcuts" },
];

const exactExample: PaletteItem[] = [
  { id: "doc", kind: "chart-resource", label: "PHQ-9 result, 12 Aug" },
  { id: "run", kind: "action", label: "Start PHQ-9" },
];

export default function ActionsRankAboveRecords() {
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
          Search actions and records
        </button>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">PHQ-9 ranking</h3>
            <p className="mb-2 font-mono text-xs text-[var(--zb-text-muted)]">
              rank(&quot;phq&quot;, [doc, run])[0].item.id →{" "}
              {rank("phq", exactExample)[0]?.item.id ?? ""}
            </p>
            <ol className="m-0 list-decimal space-y-1 pl-5 text-sm text-[var(--zb-text)]">
              {rank("phq", items)
                .slice(0, 2)
                .map(({ item }) => (
                  <li key={item.id}>{item.label}</li>
                ))}
            </ol>
            <p className="mt-3 text-xs text-[var(--zb-text-muted)]">
              Resource frequency is 100 here; it is capped at 40 ranking points.
            </p>
            {lastRun && <p className="mt-2 text-xs text-[var(--zb-text-muted)]">Ran: {lastRun}</p>}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[var(--zb-text)]">Fixed group order</h3>
            <ol className="m-0 list-decimal space-y-1 pl-5 text-sm text-[var(--zb-text)]">
              {KIND_ORDER.map((kind) => (
                <li key={kind}>
                  {ITEM_KIND_LABEL[kind]} · {KIND_WEIGHT[kind]}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ChartCommandPalette
          open={open}
          items={items}
          onClose={() => setOpen(false)}
          onRun={(item) => setLastRun(item.label)}
          placeholder={'Try "phq"…'}
        />
      </div>
    </section>
  );
}

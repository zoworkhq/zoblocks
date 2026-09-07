/**
 * A moving preview for something that does not exist yet.
 *
 * A coming-soon card has no provenance to show — nothing has been measured
 * because nothing has been built. The alternative is the empty band this
 * catalogue just got rid of, so each kind gets a motif suggesting what the pack
 * *does*, rather than a placeholder suggesting it is loading.
 *
 * Six motifs, not thirty-two illustrations. The motif belongs to the category,
 * which is the honest level of detail: it says "this is a component" or "this
 * is a palette", and the title says the rest. A bespoke drawing per item would
 * be a promise about artwork that does not exist either.
 *
 * All of it is CSS on plain elements — no canvas, no library, nothing measured
 * at runtime. A dozen of these render in one grid and none may cost a layout.
 *
 * **Motion safety lives in the stylesheet**, not here. Each animation is only
 * ever declared inside `prefers-reduced-motion: no-preference`, so a reader who
 * opts out sees the resting style — a finished composition rather than a frozen
 * first frame. A variant repeated on thirty spans is thirty chances to miss one.
 */

import type { CatalogKind } from "@/db/collections";
import { cn } from "@/lib/utils";

/** The kinds a coming-soon item can carry, including ones not in the schema yet. */
export type PreviewMotif = CatalogKind | "compliance" | "pattern" | "service";

/** Staggered, so a row of cards does not pulse in unison. */
const delay = (i: number) => ({ animationDelay: `${i * 0.16}s` });

/** A results grid filling in, one column already answered. */
function Grid() {
  return (
    <div className="grid w-full max-w-[9rem] grid-cols-4 gap-1" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={delay(i)}
          className={cn(
            "h-1.5 rounded-[1px]",
            i % 4 === 3 ? "bg-brand/70" : "bg-panel-muted/35",
            "zb-fade",
          )}
        />
      ))}
    </div>
  );
}

/** A palette: eleven steps, with the light sweeping across them. */
function Ramp() {
  return (
    <div className="flex w-full max-w-[9rem] gap-0.5" aria-hidden="true">
      {Array.from({ length: 11 }, (_, i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 0.08}s`, opacity: 0.25 + i * 0.07 }}
          className="h-5 flex-1 rounded-[1px] bg-brand zb-sweep"
        />
      ))}
    </div>
  );
}

/** An icon set: shapes cycling through a slot. */
function Glyphs() {
  const shapes = ["rounded-full", "rounded-[2px]", "rounded-full", "rotate-45 rounded-[2px]"];
  return (
    <div className="flex items-center gap-2.5" aria-hidden="true">
      {shapes.map((shape, i) => (
        <span
          key={i}
          style={delay(i)}
          className={cn("size-3.5 border border-brand/60", shape, "zb-fade")}
        />
      ))}
    </div>
  );
}

/** Illustration: a line drawing itself. */
function Stroke() {
  return (
    <svg viewBox="0 0 120 40" className="w-full max-w-[9rem] text-brand" aria-hidden="true">
      <path
        d="M4 30 C 22 30, 26 10, 44 10 S 70 30, 88 30 S 110 14, 116 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={100}
        className="zb-draw [stroke-dasharray:100] [stroke-dashoffset:0]"
      />
    </svg>
  );
}

/** Fixtures: records arriving, of uneven length because the data is messy. */
function Stream() {
  const widths = ["w-[70%]", "w-[45%]", "w-[88%]", "w-[36%]", "w-[62%]"];
  return (
    <div className="flex w-full max-w-[9rem] flex-col gap-1" aria-hidden="true">
      {widths.map((w, i) => (
        <span
          key={i}
          style={delay(i)}
          className={cn("h-1 rounded-[1px] bg-panel-muted/45", w, "zb-slide")}
        />
      ))}
    </div>
  );
}

/** Compliance: a checklist being satisfied, one line at a time. */
function Ticks() {
  return (
    <div className="flex w-full max-w-[9rem] flex-col gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center gap-2">
          <span style={delay(i)} className="size-2 shrink-0 rounded-[1px] bg-brand/70 zb-fade" />
          <span style={delay(i)} className="h-1 flex-1 rounded-[1px] bg-panel-muted/35 zb-fade" />
        </span>
      ))}
    </div>
  );
}

/** An instrument: a scale, with one option chosen. */
function Scale() {
  return (
    <div className="flex w-full max-w-[9rem] flex-col gap-1.5" aria-hidden="true">
      <span className="h-1 w-[55%] rounded-[1px] bg-panel-muted/45" />
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={delay(i)}
            className={cn(
              "h-3 flex-1 rounded-[2px] border",
              i === 2 ? "border-brand/70 bg-brand/50" : "border-panel-muted/30",
              i === 2 && "zb-fade",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** A dashboard: a caseload, sorted by who is overdue. */
function Bars() {
  const heights = ["h-3", "h-5", "h-2.5", "h-6", "h-4", "h-7"];
  return (
    <div className="flex w-full max-w-[9rem] items-end gap-1.5" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          style={delay(i)}
          className={cn(
            "flex-1 rounded-[1px]",
            h,
            i >= 4 ? "bg-brand/70" : "bg-panel-muted/40",
            "zb-sweep",
          )}
        />
      ))}
    </div>
  );
}

/** A date: a month, with one day known and the rest approximate. */
function Calendar() {
  return (
    <div className="grid w-full max-w-[6.5rem] grid-cols-7 gap-[3px]" aria-hidden="true">
      {Array.from({ length: 21 }, (_, i) => (
        <span
          key={i}
          style={delay(i % 7)}
          className={cn(
            "aspect-square rounded-[1px]",
            i === 10 ? "bg-brand/80 zb-fade" : "bg-panel-muted/25",
          )}
        />
      ))}
    </div>
  );
}

/** A note: lines of prose, with an addendum arriving under a rule. */
function Lines() {
  const widths = ["w-full", "w-[85%]", "w-[92%]"];
  return (
    <div className="flex w-full max-w-[9rem] flex-col gap-1" aria-hidden="true">
      {widths.map((w, i) => (
        <span key={i} className={cn("h-1 rounded-[1px] bg-panel-muted/40", w)} />
      ))}
      <span className="my-0.5 h-px w-full bg-panel-muted/30" />
      <span className="h-1 w-[60%] rounded-[1px] bg-brand/70 zb-slide" />
    </div>
  );
}

const MOTIF: Record<PreviewMotif, () => React.JSX.Element> = {
  component: Grid,
  theme: Ramp,
  icons: Glyphs,
  illustration: Stroke,
  fixtures: Stream,
  compliance: Ticks,
  pattern: Ticks,
  service: Ticks,
};

/**
 * Where the kind is too coarse to be interesting.
 *
 * Nine of the announced items are `component`, and nine identical grids in one
 * column is a pattern rather than a preview — the eye stops reading them. These
 * are the ones whose shape is recognisable enough to be worth drawing: a scale,
 * a caseload, a month, a note with an addendum below the rule.
 *
 * Keyed by slug rather than inferred, because inference here would be a regex
 * over titles that breaks the first time one is reworded.
 */
const BY_SLUG: Record<string, () => React.JSX.Element> = {
  "measurement-based-care": Scale,
  "cssrs-screener": Scale,
  "caseload-dashboard": Bars,
  "clinical-date-entry": Calendar,
  "dictation-note-editor": Lines,
  "part-2-consent": Lines,
  "patient-identity-header": Lines,
  "vpat-and-acr": Ticks,
};

export function ComingSoonPreview({ kind, slug }: { kind: PreviewMotif; slug?: string }) {
  const Motif = (slug ? BY_SLUG[slug] : undefined) ?? MOTIF[kind] ?? Grid;
  return (
    <div className="flex h-14 items-center justify-center">
      <Motif />
    </div>
  );
}

import type { MenuSubject, MenuTriggerProps } from "@/components/zoblocks/chart-context-menu";

interface ChartRowProps {
  /** The props `ChartContextMenu` hands its render function. */
  trigger: MenuTriggerProps;
  /** Supplies the default title and caption, masked the way the menu masks it. */
  subject?: MenuSubject;
  title?: string;
  caption?: string;
  /** Right-aligned detail on the row: a time, a count. */
  aside?: string;
}

/** A chart row that owns a menu — the host's markup, spread with the trigger props. */
export default function ChartRow({ trigger, subject, title, caption, aside }: ChartRowProps) {
  return (
    <div
      {...trigger}
      className="flex select-none items-center gap-3 rounded-md border border-[var(--zb-border)] bg-[var(--zb-surface)] px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--zb-focus-ring)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--zb-text)]">
          {title ?? (subject?.masked ? "Restricted record" : subject?.label)}
        </span>
        <span className="block truncate text-xs text-[var(--zb-text-subtle)]">
          {caption ?? (subject?.masked ? "42 CFR Part 2 · not disclosed" : subject?.detail)}
        </span>
      </span>
      {aside ? (
        <span className="shrink-0 text-xs tabular-nums text-[var(--zb-text-subtle)]">{aside}</span>
      ) : null}
    </div>
  );
}

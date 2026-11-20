import { useCallback, useState, type ReactNode } from "react";
import type { ChartMenuAction, DisclosureRecord } from "@/components/zoblocks/chart-context-menu";

/**
 * The host's side of the conversation: the last few things it was told.
 * Newest first and capped, so the log never pushes the rows away.
 */
export function useHostLog(hint = "Right-click a row, or focus it and press Shift+F10.") {
  const [lines, setLines] = useState<string[]>([]);
  const say = useCallback(
    (line: string) => setLines((current) => [line, ...current].slice(0, 3)),
    [],
  );

  const handlers = {
    onRun: (action: ChartMenuAction) => say(`onRun("${action.id}") — ${action.label}`),
    onBlocked: (_action: ChartMenuAction, reason: string) => say(`onBlocked — ${reason}`),
    onDisclose: (record: DisclosureRecord) =>
      say(
        `onDisclose — ${record.action}, ${record.outcome}${record.reason ? `: ${record.reason}` : ""}`,
      ),
    onToggle: (action: ChartMenuAction, checked: boolean) =>
      say(`onToggle("${action.id}", ${checked})`),
  };

  const log = (
    <div aria-live="polite" className="grid min-h-5 gap-0.5 text-xs text-[var(--zb-text-muted)]">
      {lines.length === 0 ? (
        <p className="m-0">{hint}</p>
      ) : (
        lines.map((line, index) => (
          <p key={`${index}-${line}`} className={index === 0 ? "m-0" : "m-0 opacity-60"}>
            {line}
          </p>
        ))
      )}
    </div>
  );

  return { handlers, log, say };
}

/** The rows, with what the host was told underneath. */
export function Stage({ children, log }: { children: ReactNode; log: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3">
      <div className="grid gap-2">{children}</div>
      {log}
    </div>
  );
}

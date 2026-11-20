import type { ReactNode } from "react";

export default function DemoSpec({
  code,
  note,
  children,
}: {
  code: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-5">
      <div className="min-w-0">
        <code className="text-xs text-[var(--zb-text-muted)]">{code}</code>
        {note ? <p className="m-0 mt-1 text-xs text-[var(--zb-text-muted)]">{note}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

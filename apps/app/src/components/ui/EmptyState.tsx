import { cn } from "@/lib/utils";

/**
 * Nothing here yet.
 *
 * Always offers the real next actions. An empty state that only says "no
 * themes" is a dead end, and the next thing the reader does is ask support for
 * something they already have — so the primary action is part of the component
 * rather than an option.
 */
export function EmptyState({
  title,
  body,
  actions,
  className,
}: {
  title: React.ReactNode;
  /** What this is for, in one sentence, and why they might want one. */
  body: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface px-6 py-12 text-center", className)}>
      <p className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em]">{title}</p>
      <p className="body-sm mx-auto mt-2 max-w-[46ch] text-graphite">{body}</p>
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

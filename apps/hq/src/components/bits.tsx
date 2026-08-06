import { Flag, User } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/db/collections";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_TEXT,
  STATUS_LABEL,
  avatarColor,
  initials,
} from "@/lib/task-display";

export function Avatar({
  id,
  name,
  size = "sm",
}: {
  id: string | null;
  name: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-7 w-7 text-[0.6875rem]" : "";

  // Unassigned is drawn, not omitted — an empty cell reads as a rendering bug.
  if (!id || !name) {
    return (
      <span
        className={`avatar avatar-empty ${dim}`}
        title="Unassigned"
        aria-label="Unassigned"
        role="img"
      >
        <User aria-hidden="true" className="size-3" />
      </span>
    );
  }

  return (
    <span
      className={`avatar ${dim}`}
      style={{ background: avatarColor(id) }}
      title={name}
      aria-label={name}
      role="img"
    >
      {initials(name)}
    </span>
  );
}

/** Dot plus word. The dot is the scan; the word is the meaning. */
export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span
      className="status-pill"
      style={{
        color: STATUS_TEXT[status],
        background: `color-mix(in oklch, ${STATUS_COLOR[status]} 14%, white)`,
      }}
    >
      <span className="dot" style={{ background: STATUS_COLOR[status] }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Priority flag. Only `high` and `urgent` render — a flag means "look at this",
 * so putting one on every row means nothing. Low and normal say what they are
 * in the detail panel and the row's own controls instead.
 */
export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  if (priority === "normal" || priority === "low") return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.6875rem] font-medium"
      style={{ color: PRIORITY_COLOR[priority] }}
      title={`${PRIORITY_LABEL[priority]} priority`}
    >
      <Flag aria-hidden="true" className="size-3" fill="currentColor" />
      <span className="sr-only">{PRIORITY_LABEL[priority]} priority</span>
    </span>
  );
}

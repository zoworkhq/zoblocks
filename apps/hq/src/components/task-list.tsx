"use client";

import * as React from "react";
import { CalendarDays, ChevronRight, Plus, Search, MessageSquare } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/db/collections";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  STATUS_COLOR,
  STATUS_TEXT,
  STATUS_LABEL,
  STATUS_ORDER,
  formatDue,
} from "@/lib/task-display";
import { quickAddTask, setPriority, setTaskStatus, toggleDone } from "@/lib/actions";
import { Avatar, PriorityFlag } from "./bits";

export interface TaskItem {
  id: string;
  ref: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  commentCount: number;
}

export interface Member {
  id: string;
  name: string;
}

function Checkbox({ task, canEdit }: { task: TaskItem; canEdit: boolean }) {
  const done = task.status === "done";
  return (
    <form action={toggleDone}>
      <input type="hidden" name="taskId" value={task.id} />
      <button
        type="submit"
        disabled={!canEdit}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        className="grid size-4 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed"
        style={{
          borderColor: done ? STATUS_COLOR.done : "var(--color-rule)",
          background: done ? STATUS_COLOR.done : "transparent",
        }}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
            <path
              d="M2.5 6.2l2.3 2.3 4.7-4.7"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </form>
  );
}

function Row({
  task,
  now,
  canEdit,
  onOpen,
}: {
  task: TaskItem;
  now: Date;
  canEdit: boolean;
  onOpen: (id: string) => void;
}) {
  const due = formatDue(task.dueDate ? new Date(task.dueDate) : null, now);
  const done = task.status === "done";

  return (
    <div className="list-row">
      <div className="lr-check">
        <Checkbox task={task} canEdit={canEdit} />
      </div>

      <div className="lr-title flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onOpen(task.id)}
          className="truncate text-left text-[0.8125rem] text-ink hover:underline"
          style={done ? { color: "var(--color-muted)", textDecoration: "line-through" } : undefined}
        >
          {task.title}
        </button>
        <span className="num shrink-0 text-[0.6875rem] text-muted">HQ-{task.ref}</span>
        {task.commentCount > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 text-[0.6875rem] text-muted"
            title={`${task.commentCount} comment${task.commentCount === 1 ? "" : "s"}`}
          >
            <MessageSquare aria-hidden="true" className="size-3" />
            {task.commentCount}
          </span>
        )}
      </div>

      <div className="lr-meta flex shrink-0 items-center justify-end gap-1.5">
        <PriorityFlag priority={task.priority} />

        {/* Overdue says the word as well as turning red, so the state survives
            grayscale and forced-colors. */}
        <span
          className="num inline-flex items-center gap-1 whitespace-nowrap text-[0.6875rem]"
          style={{
            color: due.overdue
              ? "var(--zb-status-critical)"
              : due.soon
                ? "var(--color-ink-soft)"
                : "var(--color-muted)",
            fontWeight: due.overdue ? 600 : 400,
          }}
        >
          <CalendarDays aria-hidden="true" className="size-3" />
          {due.overdue ? `Overdue ${due.label}` : due.label}
        </span>

        <Avatar id={task.assigneeId} name={task.assigneeName} />

        {canEdit ? (
          <div className="on-hover flex items-center gap-1">
            <form action={setPriority}>
              <input type="hidden" name="taskId" value={task.id} />
              <label className="sr-only" htmlFor={`p-${task.id}`}>
                Priority for {task.title}
              </label>
              <select
                id={`p-${task.id}`}
                name="priority"
                defaultValue={task.priority}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="rounded border border-rule bg-paper px-1 py-0.5 text-[0.6875rem] text-muted"
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </form>

            <form action={setTaskStatus}>
              <input type="hidden" name="taskId" value={task.id} />
              <label className="sr-only" htmlFor={`s-${task.id}`}>
                Status for {task.title}
              </label>
              <select
                id={`s-${task.id}`}
                name="status"
                defaultValue={task.status}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="rounded border border-rule bg-paper px-1 py-0.5 text-[0.6875rem] text-muted"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </form>
          </div>
        ) : (
          <span className="w-2" />
        )}
      </div>
    </div>
  );
}

function QuickAdd({ status, members }: { status: TaskStatus; members: Member[] }) {
  const form = React.useRef<HTMLFormElement>(null);
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost w-full justify-start px-2 py-1.5 text-[0.75rem]"
      >
        <Plus aria-hidden="true" className="size-3.5" />
        Add task
      </button>
    );
  }

  return (
    <form
      ref={form}
      action={(data) => {
        form.current?.reset();
        return quickAddTask(data);
      }}
      className="flex items-center gap-2 px-2 py-1.5"
    >
      <input type="hidden" name="status" value={status} />
      <label className="sr-only" htmlFor={`qa-${status}`}>
        New task in {STATUS_LABEL[status]}
      </label>
      {/* autoFocus is deliberate: the button that opened this row is gone, so
          focus has to land somewhere. jsx-a11y is not installed here, so the
          reasoning lives in a comment rather than a disable for a rule that
          does not exist. */}
      <input
        id={`qa-${status}`}
        name="title"
        autoFocus
        required
        placeholder="Task name, then Enter"
        className="field py-1"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <label className="sr-only" htmlFor={`qa-a-${status}`}>
        Assignee
      </label>
      <select id={`qa-a-${status}`} name="assigneeId" defaultValue="" className="field w-36 py-1">
        <option value="">Unassigned</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button type="submit" className="btn py-1">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-ghost py-1">
        Cancel
      </button>
    </form>
  );
}

export function TaskList({
  tasks,
  members,
  isAdmin,
  currentUserId,
  showAdd,
  onOpen,
}: {
  tasks: TaskItem[];
  members: Member[];
  isAdmin: boolean;
  currentUserId: string;
  showAdd: boolean;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [assignee, setAssignee] = React.useState("all");
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({ done: true });
  const now = React.useMemo(() => new Date(), []);

  const filtered = tasks.filter((t) => {
    const q = query.trim().toLowerCase();
    if (q && !(t.title.toLowerCase().includes(q) || `hq-${t.ref}`.includes(q))) return false;
    if (assignee === "me" && t.assigneeId !== currentUserId) return false;
    if (assignee === "none" && t.assigneeId) return false;
    if (assignee !== "all" && assignee !== "me" && assignee !== "none" && t.assigneeId !== assignee)
      return false;
    return true;
  });

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          />
          <label className="sr-only" htmlFor="task-search">
            Search tasks
          </label>
          <input
            id="task-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks"
            className="field pl-8"
          />
        </div>

        <label className="sr-only" htmlFor="task-assignee">
          Filter by assignee
        </label>
        <select
          id="task-assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="field w-auto"
        >
          <option value="all">Everyone</option>
          <option value="me">Me</option>
          <option value="none">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* A filter that matches nothing says so, and says it is a filter —
          distinct from a list that is genuinely empty. */}
      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-rule px-4 py-8 text-center text-muted">
          {tasks.length === 0
            ? "No tasks yet."
            : "No tasks match this search. Clear the filters to see all of them."}
        </p>
      )}

      {STATUS_ORDER.map((status) => {
        const group = filtered.filter((t) => t.status === status);
        if (group.length === 0 && !(showAdd && status !== "done")) return null;
        const isCollapsed = collapsed[status] ?? false;

        return (
          <section key={status} className="mb-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [status]: !isCollapsed }))}
                aria-expanded={!isCollapsed}
                className="group-bar"
              >
                <ChevronRight
                  aria-hidden="true"
                  className={`size-3.5 text-faint transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
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
                <span className="num text-[0.75rem] text-muted">{group.length}</span>
              </button>
            </div>

            {!isCollapsed && (
              <div className="mt-1 overflow-hidden rounded-lg border border-rule bg-paper">
                {group.map((task) => (
                  <Row
                    key={task.id}
                    task={task}
                    now={now}
                    canEdit={isAdmin || task.assigneeId === currentUserId}
                    onOpen={onOpen}
                  />
                ))}
                {showAdd && status !== "done" && <QuickAdd status={status} members={members} />}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

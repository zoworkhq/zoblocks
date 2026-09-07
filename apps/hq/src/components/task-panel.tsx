"use client";

import * as React from "react";
import { X } from "lucide-react";
import { addComment } from "@/lib/actions";
import { STATUS_LABEL, formatDue } from "@/lib/task-display";
import { Avatar, PriorityFlag, StatusPill } from "./bits";
import type { TaskItem } from "./task-list";

export interface TaskDetail extends TaskItem {
  description: string | null;
  creatorName: string | null;
  createdAt: string;
  comments: { id: string; body: string; authorId: string; authorName: string; createdAt: string }[];
  activity: { id: number; kind: string; from: string | null; to: string | null; at: string }[];
}

function describe(a: TaskDetail["activity"][number]): string {
  if (a.kind === "created") return "created this task";
  if (a.kind === "status")
    return `moved it from ${STATUS_LABEL[a.from as keyof typeof STATUS_LABEL] ?? a.from} to ${
      STATUS_LABEL[a.to as keyof typeof STATUS_LABEL] ?? a.to
    }`;
  if (a.kind === "priority") return `changed priority from ${a.from} to ${a.to}`;
  if (a.kind === "assigned") return a.to ? "reassigned it" : "unassigned it";
  return a.kind;
}

/**
 * Slide-over detail. A panel rather than a route so the list stays on screen —
 * the context of what else is open is most of why you clicked in.
 */
export function TaskPanel({ task, onClose }: { task: TaskDetail | null; onClose: () => void }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;

  const due = formatDue(task.dueDate ? new Date(task.dueDate) : null, new Date());

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={task.title}
    >
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20"
      />

      <div
        ref={ref}
        tabIndex={-1}
        className="hq-page relative flex h-full w-full max-w-md flex-col border-l border-rule bg-paper shadow-xl outline-none"
      >
        <header className="flex items-start gap-3 border-b border-rule px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="num text-[0.6875rem] text-faint">HQ-{task.ref}</p>
            <h2 className="mt-1 text-[0.9375rem] font-semibold leading-snug text-ink">
              {task.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <dl className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-y-2.5 text-[0.75rem]">
            <dt className="text-muted">Status</dt>
            <dd>
              <StatusPill status={task.status} />
            </dd>

            <dt className="text-muted">Assignee</dt>
            <dd className="flex items-center gap-2 text-ink">
              <Avatar id={task.assigneeId} name={task.assigneeName} />
              {task.assigneeName ?? "Unassigned"}
            </dd>

            <dt className="text-muted">Due</dt>
            <dd
              className="num"
              style={{ color: due.overdue ? "var(--zb-status-critical)" : "var(--color-ink)" }}
            >
              {due.overdue ? `Overdue — ${due.label}` : due.label}
            </dd>

            <dt className="text-muted">Priority</dt>
            <dd className="flex items-center gap-1.5 text-ink">
              <PriorityFlag priority={task.priority} />
              {task.priority === "normal" ? "Normal" : null}
              {task.priority !== "normal" && <span className="capitalize">{task.priority}</span>}
            </dd>

            <dt className="text-muted">Created by</dt>
            <dd className="text-ink">{task.creatorName ?? "Unknown"}</dd>
          </dl>

          {task.description && (
            <p className="mt-4 whitespace-pre-wrap border-t border-rule pt-4 text-[0.8125rem] leading-relaxed text-ink-soft">
              {task.description}
            </p>
          )}

          <section className="mt-5 border-t border-rule pt-4">
            <h3 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
              Comments
            </h3>

            {task.comments.length === 0 ? (
              <p className="text-[0.75rem] text-faint">No comments yet.</p>
            ) : (
              <ul className="space-y-3">
                {task.comments.map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <Avatar id={c.authorId} name={c.authorName} />
                    <div className="min-w-0">
                      <p className="text-[0.75rem]">
                        <span className="font-semibold text-ink">{c.authorName}</span>{" "}
                        <time className="text-faint" dateTime={c.createdAt}>
                          {new Date(c.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </time>
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-[0.8125rem] text-ink-soft">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-5 border-t border-rule pt-4">
            <h3 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">
              Activity
            </h3>
            {task.activity.length === 0 ? (
              /* A heading with nothing under it reads as a failed load. Say
                 that there is nothing, and why there might not be. */
              <p className="text-[0.75rem] text-faint">
                Nothing recorded yet. Changes made from here on are logged.
              </p>
            ) : (
              <ul className="space-y-1.5 text-[0.75rem] text-muted">
                {task.activity.map((a) => (
                  <li key={a.id}>
                    <time dateTime={a.at} className="num text-faint">
                      {new Date(a.at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>{" "}
                    — {describe(a)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <form action={addComment} className="flex gap-2 border-t border-rule px-5 py-3">
          <input type="hidden" name="taskId" value={task.id} />
          <label className="sr-only" htmlFor="comment-body">
            Add a comment
          </label>
          <input
            id="comment-body"
            name="body"
            required
            placeholder="Write a comment"
            className="field"
          />
          <button type="submit" className="btn">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

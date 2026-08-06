"use client";

import * as React from "react";
import { TaskList, type Member, type TaskItem } from "./task-list";
import { TaskPanel, type TaskDetail } from "./task-panel";

/**
 * Holds the open-panel state so the list and the detail can share it without
 * either becoming a route. Detail is fetched on demand.
 */
export function TaskBoard(props: {
  tasks: TaskItem[];
  members: Member[];
  isAdmin: boolean;
  currentUserId: string;
  showAdd: boolean;
}) {
  const [detail, setDetail] = React.useState<TaskDetail | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const open = React.useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) return;
      setDetail(await res.json());
    } finally {
      setLoadingId(null);
    }
  }, []);

  return (
    <>
      <TaskList {...props} onOpen={open} />
      {loadingId && (
        <p role="status" className="sr-only">
          Loading task details
        </p>
      )}
      <TaskPanel task={detail} onClose={() => setDetail(null)} />
    </>
  );
}

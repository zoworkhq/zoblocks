import { asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/client";
import { comments, tasks, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team board" };

export default async function BoardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "admin";

  const rows = await db()
    .select({
      id: tasks.id,
      ref: tasks.ref,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      assigneeId: tasks.assigneeId,
      assigneeName: users.name,
      commentCount: count(comments.id),
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .leftJoin(comments, eq(comments.taskId, tasks.id))
    .groupBy(tasks.id, users.name)
    .orderBy(asc(tasks.dueDate), asc(tasks.ref));

  const members = await db()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.status, "active"))
    .orderBy(asc(users.name));

  const now = new Date();
  const open = rows.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && t.dueDate < now).length;

  return (
    <div className="hq-page mx-auto max-w-5xl px-5 py-6 sm:px-7">
      <PageHeader
        title="Team board"
        subtitle={`${open.length} open · ${overdue} overdue · ${rows.length - open.length} complete`}
      />

      <TaskBoard
        tasks={rows.map((t) => ({ ...t, dueDate: t.dueDate ? t.dueDate.toISOString() : null }))}
        members={members}
        isAdmin={isAdmin}
        currentUserId={user.id}
        showAdd={isAdmin}
      />
    </div>
  );
}

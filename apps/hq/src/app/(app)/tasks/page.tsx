import { and, asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db/client";
import { comments, tasks, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "My work" };

export default async function MyTasksPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

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
    .where(eq(tasks.assigneeId, user.id))
    .groupBy(tasks.id, users.name)
    .orderBy(asc(tasks.dueDate), asc(tasks.ref));

  const members = await db()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.status, "active")))
    .orderBy(asc(users.name));

  const now = new Date();
  const open = rows.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && t.dueDate < now).length;
  const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="hq-page mx-auto max-w-4xl px-5 py-6 sm:px-7">
      <PageHeader
        title="My work"
        subtitle={`${today} · ${open.length} open · ${overdue} overdue`}
      />

      <TaskBoard
        tasks={rows.map((t) => ({ ...t, dueDate: t.dueDate ? t.dueDate.toISOString() : null }))}
        members={members}
        isAdmin={user.role === "admin"}
        currentUserId={user.id}
        showAdd={false}
      />
    </div>
  );
}

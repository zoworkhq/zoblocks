import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";
import { currentUser } from "@/lib/auth";
import { activeMembers, taskRows } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team board" };

export default async function BoardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [rows, members] = await Promise.all([taskRows(), activeMembers()]);

  const now = new Date();
  const open = rows.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;

  return (
    <div className="hq-page mx-auto max-w-5xl px-5 py-6 sm:px-7">
      <PageHeader
        title="Team board"
        subtitle={`${open.length} open · ${overdue} overdue · ${rows.length - open.length} complete`}
      />

      <TaskBoard
        tasks={rows}
        members={members}
        isAdmin={user.role === "admin"}
        currentUserId={user.id}
        showAdd={user.role === "admin"}
      />
    </div>
  );
}

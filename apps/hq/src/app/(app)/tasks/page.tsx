import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/task-board";
import { PageHeader } from "@/components/page-header";
import { currentUser } from "@/lib/auth";
import { activeMembers, taskRows } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "My work" };

export default async function MyTasksPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [rows, members] = await Promise.all([
    taskRows({ assigneeId: new ObjectId(user.id) }),
    activeMembers(),
  ]);

  const now = new Date();
  const open = rows.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;

  // The date, not a greeting. Every row below says "due tomorrow" or "overdue"
  // relative to today, and stating today makes those readable without doing
  // arithmetic. A greeting would also be wrong half the time.
  const today = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="hq-page mx-auto max-w-4xl px-5 py-6 sm:px-7">
      <PageHeader
        title="My work"
        subtitle={`${today} · ${open.length} open · ${overdue} overdue`}
      />

      <TaskBoard
        tasks={rows}
        members={members}
        isAdmin={user.role === "admin"}
        currentUserId={user.id}
        showAdd={false}
      />
    </div>
  );
}

import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import { activity, comments, tasks, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Detail for the slide-over. Fetched on open rather than shipped with the list:
 * comments and activity for every task would be most of the payload for data
 * almost none of which is ever looked at.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const assignee = alias(users, "assignee");
  const creator = alias(users, "creator");

  const rows = await db()
    .select({
      id: tasks.id,
      ref: tasks.ref,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      assigneeId: tasks.assigneeId,
      assigneeName: assignee.name,
      creatorName: creator.name,
    })
    .from(tasks)
    .leftJoin(assignee, eq(assignee.id, tasks.assigneeId))
    .leftJoin(creator, eq(creator.id, tasks.creatorId))
    .where(eq(tasks.id, id))
    .limit(1);

  const task = rows[0];
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const commentRows = await db()
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(eq(comments.taskId, id))
    .orderBy(asc(comments.createdAt));

  const activityRows = await db()
    .select({
      id: activity.id,
      kind: activity.kind,
      from: activity.fromValue,
      to: activity.toValue,
      at: activity.createdAt,
    })
    .from(activity)
    .where(eq(activity.taskId, id))
    .orderBy(desc(activity.createdAt))
    .limit(20);

  return NextResponse.json({
    ...task,
    commentCount: commentRows.length,
    comments: commentRows,
    activity: activityRows,
  });
}

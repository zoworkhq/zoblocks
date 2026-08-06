import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/db/client";
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
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const taskId = new ObjectId(id);

  const { tasks, comments, activity, users } = db();

  const task = await tasks.findOne({ _id: taskId });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [commentDocs, activityDocs] = await Promise.all([
    comments.find({ taskId }).sort({ createdAt: 1 }).toArray(),
    activity.find({ taskId }).sort({ createdAt: -1 }).limit(20).toArray(),
  ]);

  // One lookup for every person named on this screen — assignee, creator, and
  // each commenter — rather than a query per name.
  const ids = [task.assigneeId, task.creatorId, ...commentDocs.map((c) => c.authorId)].filter(
    (v): v is ObjectId => Boolean(v),
  );

  const people = await users.find({ _id: { $in: ids } }, { projection: { name: 1 } }).toArray();
  const nameById = new Map(people.map((p) => [p._id.toHexString(), p.name]));

  return NextResponse.json({
    id: task._id.toHexString(),
    ref: task.ref,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    assigneeId: task.assigneeId ? task.assigneeId.toHexString() : null,
    assigneeName: task.assigneeId ? (nameById.get(task.assigneeId.toHexString()) ?? null) : null,
    creatorName: nameById.get(task.creatorId.toHexString()) ?? null,
    commentCount: commentDocs.length,
    comments: commentDocs.map((c) => ({
      id: c._id.toHexString(),
      body: c.body,
      authorId: c.authorId.toHexString(),
      authorName: nameById.get(c.authorId.toHexString()) ?? "Unknown",
      createdAt: c.createdAt.toISOString(),
    })),
    activity: activityDocs.map((a) => ({
      id: a._id.toHexString(),
      kind: a.kind,
      from: a.fromValue,
      to: a.toValue,
      at: a.createdAt.toISOString(),
    })),
  });
}

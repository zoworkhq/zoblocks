import type { Filter } from "mongodb";
import { db } from "@/db/client";
import type { TaskDoc } from "@/db/collections";
import type { TaskItem } from "@/components/task-list";

/**
 * Task rows for the board, with assignee names and comment counts.
 *
 * Three small queries and a join in JavaScript, rather than a `$lookup`
 * pipeline. The team is ten people and the whole user list fits in a map, so
 * the aggregation would cost more to read than it saves to run — and this stays
 * legible to whoever changes it next.
 */
export async function taskRows(filter: Filter<TaskDoc> = {}): Promise<TaskItem[]> {
  const { tasks, users, comments } = db();

  const docs = await tasks
    .find(filter)
    // Nulls sort first ascending in Mongo, so undated tasks would head the
    // list. Sorting them last matches the SQL version and the reading order
    // people expect: what is due soonest, then what has no date at all.
    .sort({ dueDate: 1, ref: 1 })
    .toArray();

  if (docs.length === 0) return [];

  const [people, counts] = await Promise.all([
    users.find({}, { projection: { name: 1 } }).toArray(),
    comments
      .aggregate<{ _id: TaskDoc["_id"]; n: number }>([
        { $match: { taskId: { $in: docs.map((d) => d._id) } } },
        { $group: { _id: "$taskId", n: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const nameById = new Map(people.map((p) => [p._id.toHexString(), p.name]));
  const countById = new Map(counts.map((c) => [c._id.toHexString(), c.n]));

  const dated = docs.filter((d) => d.dueDate);
  const undated = docs.filter((d) => !d.dueDate);

  return [...dated, ...undated].map((d) => ({
    id: d._id.toHexString(),
    ref: d.ref,
    title: d.title,
    status: d.status,
    priority: d.priority,
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    assigneeId: d.assigneeId ? d.assigneeId.toHexString() : null,
    assigneeName: d.assigneeId ? (nameById.get(d.assigneeId.toHexString()) ?? null) : null,
    commentCount: countById.get(d._id.toHexString()) ?? 0,
  }));
}

export async function activeMembers(): Promise<{ id: string; name: string }[]> {
  const people = await db()
    .users.find({ status: "active" }, { projection: { name: 1 } })
    .sort({ name: 1 })
    .toArray();
  return people.map((p) => ({ id: p._id.toHexString(), name: p.name }));
}

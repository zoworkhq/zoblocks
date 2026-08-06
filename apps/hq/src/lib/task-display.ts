import type { TaskPriority, TaskStatus } from "@/db/schema";

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  review: "In review",
  done: "Complete",
};

/**
 * Status colours, ClickUp-style: a dot plus a word, never a dot alone. The
 * word is what makes the list readable in grayscale and to anyone who does
 * not distinguish these hues — the dot is the fast scan, not the meaning.
 */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "oklch(64% 0.012 265)",
  in_progress: "oklch(62% 0.16 250)",
  blocked: "oklch(58% 0.19 25)",
  review: "oklch(66% 0.16 300)",
  done: "oklch(60% 0.15 155)",
};

/**
 * Darker siblings, for the pill's *label*. Reusing the dot colour for text on
 * its own tint lands at 3:1 and fails AA — the dot can be bright because it is
 * decoration beside a word, but the word itself has to be readable.
 */
export const STATUS_TEXT: Record<TaskStatus, string> = {
  todo: "oklch(42% 0.014 265)",
  in_progress: "oklch(44% 0.15 250)",
  blocked: "oklch(44% 0.17 25)",
  review: "oklch(44% 0.16 300)",
  done: "oklch(42% 0.13 155)",
};

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "done"];

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

/** Flag colours. `normal` is deliberately grey — a flag on everything is noise. */
export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "oklch(70% 0.02 265)",
  normal: "oklch(70% 0.02 265)",
  high: "oklch(70% 0.16 70)",
  urgent: "oklch(58% 0.2 25)",
};

export const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "normal", "low"];

/** Absence is a state: no due date is said out loud, never left blank. */
export function formatDue(
  due: Date | null,
  now: Date,
): { label: string; overdue: boolean; soon: boolean } {
  if (!due) return { label: "No date", overdue: false, soon: false };

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86_400_000);
  const date = due.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  if (days < 0) return { label: date, overdue: true, soon: false };
  if (days === 0) return { label: "Today", overdue: false, soon: true };
  if (days === 1) return { label: "Tomorrow", overdue: false, soon: true };
  return { label: date, overdue: false, soon: days <= 3 };
}

/**
 * Deterministic avatar colour from the person's id, so the same face keeps the
 * same colour on every screen and across sessions. Hashing the name instead
 * would recolour someone the day they change how it is spelled.
 */
const AVATAR_HUES = [285, 250, 200, 155, 95, 55, 25, 325];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  // 50%, not the 58% that looks nicer — the initials are white on top of this,
  // and the lighter value lands at 4.0–4.5:1 depending on hue. The darkest hue
  // in the set has to clear AA, so every hue uses the value that does.
  return `oklch(50% 0.15 ${hue})`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/**
 * Turning registry items into files on disk.
 *
 * The unit of work is a `PlannedFile`: where it goes, what it contains, and
 * whether something is already there. Planning is separated from writing so
 * that `--dry-run` runs exactly the code path a real install runs, minus the
 * final `writeFile`. A dry run that takes a different route is a dry run that
 * can disagree with the thing it is previewing.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { resolveTarget, type OxygenConfig } from "./config.js";
import { assertSafeTarget, type RegistryItem } from "./schema.js";

export interface PlannedFile {
  /** Item this file came from, for grouping in the output. */
  item: string;
  /** Path relative to the project root, in POSIX form for display. */
  relative: string;
  absolute: string;
  content: string;
  exists: boolean;
  /** True when the file is present and byte-identical to what we would write. */
  unchanged: boolean;
}

export interface Plan {
  files: PlannedFile[];
  dependencies: string[];
}

export async function planInstall(
  items: RegistryItem[],
  config: OxygenConfig,
  cwd: string,
): Promise<Plan> {
  const files: PlannedFile[] = [];
  const dependencies: string[] = [];
  const claimed = new Map<string, string>();

  for (const item of items) {
    for (const dependency of item.dependencies ?? []) {
      if (!dependencies.includes(dependency)) dependencies.push(dependency);
    }

    for (const file of item.files) {
      const relative = resolveTarget(config, file);

      /*
       * Re-checked here even though the parser already refused unsafe targets.
       * `resolveTarget` joins registry-supplied text with configured alias
       * roots, and the alias roots come from a file we did not write. The
       * check is one string comparison and it sits on the only path that
       * reaches `writeFile`.
       */
      assertSafeTarget(relative, item.name);
      const absolute = path.resolve(cwd, relative);
      if (!absolute.startsWith(path.resolve(cwd) + path.sep)) {
        throw new Error(
          `${item.name}: "${relative}" resolves outside the project and will not be written.`,
        );
      }

      /*
       * Two items claiming one path is a registry bug that would otherwise
       * surface as whichever item happened to be written last. Named here,
       * with both culprits, because the person who can fix it is us.
       */
      const previous = claimed.get(relative);
      if (previous && previous !== item.name) {
        throw new Error(
          `Both "${previous}" and "${item.name}" want to write ${relative}. Report this — the registry should not serve two items that collide.`,
        );
      }
      claimed.set(relative, item.name);

      const exists = existsSync(absolute);
      const unchanged = exists ? (await readFile(absolute, "utf8")) === file.content : false;

      files.push({
        item: item.name,
        relative: relative.split(path.sep).join("/"),
        absolute,
        content: file.content,
        exists,
        unchanged,
      });
    }
  }

  return { files, dependencies };
}

/**
 * Write the plan.
 *
 * Files that already exist are skipped unless `overwrite` is set — the source
 * is the customer's once it lands, and ADR 0002 sells that as the point of the
 * registry channel. Silently restoring our version of a file somebody has
 * since edited would make "yours to change" false in the one moment it
 * matters. Identical files are skipped either way; rewriting them would churn
 * mtimes and dirty a working tree for nothing.
 */
export async function applyPlan(
  plan: Plan,
  options: { overwrite: boolean },
): Promise<{ written: PlannedFile[]; skipped: PlannedFile[] }> {
  const written: PlannedFile[] = [];
  const skipped: PlannedFile[] = [];

  for (const file of plan.files) {
    if (file.unchanged || (file.exists && !options.overwrite)) {
      skipped.push(file);
      continue;
    }

    await mkdir(path.dirname(file.absolute), { recursive: true });
    await writeFile(file.absolute, file.content, "utf8");
    written.push(file);
  }

  return { written, skipped };
}

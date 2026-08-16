/**
 * Write-or-check.
 *
 * In normal mode the generator writes. Under `--check` it compares and records
 * drift instead, which is what makes CI able to fail a pull request whose
 * generated files are stale. Both modes take exactly the same code path up to
 * this point, so the check cannot pass for a reason the write would not have
 * produced.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { rel } from "./config";

export interface WriteResult {
  path: string;
  status: "written" | "unchanged" | "stale" | "missing" | "removed" | "orphaned";
}

export class Emitter {
  readonly results: WriteResult[] = [];

  constructor(readonly checkOnly: boolean) {}

  async emit(absolute: string, content: string): Promise<void> {
    const normalised = content.endsWith("\n") ? content : `${content}\n`;

    let existing: string | undefined;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      existing = undefined;
    }

    if (existing === normalised) {
      this.results.push({ path: rel(absolute), status: "unchanged" });
      return;
    }

    if (this.checkOnly) {
      this.results.push({
        path: rel(absolute),
        status: existing === undefined ? "missing" : "stale",
      });
      return;
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, normalised, "utf8");
    this.results.push({ path: rel(absolute), status: "written" });
  }

  /**
   * Deletes files in `dir` that this run did not produce.
   *
   * Without this, removing a component leaves its JSON on the CDN and the
   * shadcn CLI keeps installing a component that no longer exists in the
   * repository — source nobody maintains, reaching customers indefinitely.
   * Deprecation is supposed to be the sequence in ADR 0006, not an orphaned
   * file.
   */
  async prune(dir: string, keep: Set<string>, extension: string): Promise<void> {
    if (!existsSync(dir)) return;

    for (const entry of await readdir(dir)) {
      if (!entry.endsWith(extension) || keep.has(entry)) continue;

      const absolute = path.join(dir, entry);
      if (this.checkOnly) {
        this.results.push({ path: rel(absolute), status: "orphaned" });
        continue;
      }
      await rm(absolute);
      this.results.push({ path: rel(absolute), status: "removed" });
    }
  }

  get drifted(): WriteResult[] {
    return this.results.filter(
      (r) => r.status === "stale" || r.status === "missing" || r.status === "orphaned",
    );
  }

  get changed(): WriteResult[] {
    return this.results.filter((r) => r.status === "written" || r.status === "removed");
  }
}

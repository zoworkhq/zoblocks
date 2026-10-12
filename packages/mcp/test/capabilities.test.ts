/**
 * What this server is able to do, asserted from its source (ADR 0017).
 *
 * The component lint rule that refuses network access is off for this
 * package — it is tooling, like the CLI, and the rule also misreads the SDK
 * handler's `.fetch(request)` method as a request. What that rule stood for is
 * checked here instead, as the narrower claim ADR 0017 makes: the server
 * fetches one thing, the catalog manifest; reads no environment; and writes
 * nothing, anywhere.
 */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const files = readdirSync(SRC)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => ({ file: f, source: readFileSync(path.join(SRC, f), "utf8") }));

/** Source with comments removed, so prose about a capability is not the capability. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("the server's capabilities", () => {
  it("has source to check", () => {
    expect(files.map((f) => f.file)).toContain("manifest.ts");
  });

  it("makes one kind of request — the manifest, from manifest.ts", () => {
    for (const { file, source } of files) {
      // The global `fetch`, not a method of that name: `handler.fetch(request)`
      // in http.ts is the SDK serving a request, not making one.
      const calls = code(source).match(/(?<!\.)\bfetch\s*\)?\s*\(/g) ?? [];
      if (file === "manifest.ts") {
        expect(calls, file).toHaveLength(1);
        expect(source).toContain("/ai/manifest.json");
      } else {
        expect(calls, file).toEqual([]);
      }
    }
  });

  it("reads no environment", () => {
    for (const { file, source } of files) expect(code(source), file).not.toMatch(/process\.env/);
  });

  it("writes no files", () => {
    for (const { file, source } of files) {
      expect(code(source), file).not.toMatch(
        /\b(writeFile|appendFile|mkdir|rm|unlink|rename|copyFile|createWriteStream)(Sync)?\s*\(/,
      );
    }
  });

  it("reads only its own bundled snapshot from disk", () => {
    for (const { file, source } of files) {
      const reads = code(source).match(/\breadFileSync\s*\(/g) ?? [];
      expect(reads.length, file).toBe(file === "manifest.ts" ? 1 : 0);
    }
  });

  it("spawns nothing", () => {
    for (const { file, source } of files) {
      expect(code(source), file).not.toMatch(
        /child_process|\bspawn\s*\(|\bexec(File)?(Sync)?\s*\(/,
      );
    }
  });
});

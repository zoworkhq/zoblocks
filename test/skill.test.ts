/**
 * The ZoBlocks coding skill (ADR 0017), held to the Agent Skills spec and to
 * the code it describes.
 *
 * A skill is read by an agent that trusts it. So everything it names has to
 * exist: every MCP tool, every file it points at, every CLI flag it tells an
 * agent to pass. When a tool is renamed or a flag removed, this fails here
 * rather than in someone's project. And it must never tell an agent to do the
 * one thing it cannot: run `@zoblocks/eslint-plugin`, which is not published.
 *
 * Spec: https://agentskills.io/specification
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SKILL_FILES } from "../packages/cli/src/generated/skill";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_DIR = path.join(ROOT, "skills", "zoblocks");
const source = readFileSync(path.join(SKILL_DIR, "SKILL.md"), "utf8");

const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
const frontmatter = match?.[1] ?? "";
const body = match?.[2] ?? "";
const field = (key: string) => new RegExp(`^${key}: (.*)$`, "m").exec(frontmatter)?.[1]?.trim();

/** The tool names the MCP server registers, read from its source. */
const serverTools = [
  ...readFileSync(path.join(ROOT, "packages/mcp/src/tools.ts"), "utf8").matchAll(
    /server\.registerTool\(\s*"([a-z_]+)"/g,
  ),
].map((m) => m[1]);

describe("the skill's frontmatter follows the Agent Skills spec", () => {
  it("has frontmatter and a body", () => {
    expect(match).not.toBeNull();
  });

  it("names itself as its folder does", () => {
    const name = field("name") ?? "";
    expect(name).toBe(path.basename(SKILL_DIR));
    expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(name.length).toBeLessThanOrEqual(64);
  });

  it("says what it does and when to use it, within 1024 characters", () => {
    const description = field("description") ?? "";
    expect(description.length).toBeGreaterThan(100);
    expect(description.length).toBeLessThanOrEqual(1024);
    expect(description).toMatch(/Use when/);
  });

  it("keeps compatibility within 500 characters", () => {
    expect((field("compatibility") ?? "").length).toBeLessThanOrEqual(500);
  });
});

describe("the skill stays small enough to load whole", () => {
  it("is under 500 lines", () => {
    expect(source.split("\n").length).toBeLessThan(500);
  });

  it("is under the 5,000-token budget (≈4 characters a token)", () => {
    expect(body.length / 4).toBeLessThan(5000);
  });
});

describe("everything the skill names exists", () => {
  it("has server tools to check against", () => {
    expect(serverTools).toHaveLength(7);
  });

  it("names every MCP tool the server offers", () => {
    for (const tool of serverTools) expect(body, tool).toContain(`\`${tool}\``);
  });

  it("names no tool the server does not offer", () => {
    const named = [...body.matchAll(/`((?:list|search|get)_[a-z_]+)`/g)].map((m) => m[1]);
    for (const tool of named) expect(serverTools, tool).toContain(tool);
  });

  it("points only at files that are in the skill", () => {
    for (const [, file] of body.matchAll(/`(references\/[a-z-]+\.md)`/g)) {
      expect(existsSync(path.join(SKILL_DIR, file ?? "")), file).toBe(true);
    }
  });

  it("passes only flags the CLI accepts", () => {
    const help = readFileSync(path.join(ROOT, "packages/cli/src/cli.ts"), "utf8");
    for (const [, flag] of body.matchAll(
      /`[^`]*?(--(?:yes|overwrite|dry-run|no-deps|force|cwd))\b/g,
    )) {
      expect(help, flag).toContain(flag);
    }
  });

  it("never tells an agent to run the unpublished lint plugin", () => {
    expect(source).not.toMatch(/eslint-plugin/);
  });
});

describe("the skill the CLI ships and the site serves is the committed skill", () => {
  /*
   * `pnpm gen` writes the skill twice: into @zoblocks/cli as a module, which
   * `zoblocks skill add` writes from, and to apps/docs/public/ai/skill.json.
   * Both must be byte-for-byte the files committed in skills/zoblocks — so
   * what an agent installs is what this repository reviewed.
   */
  const committed = [
    "SKILL.md",
    ...readdirSync(path.join(SKILL_DIR, "references")).map((f) => `references/${f}`),
  ].sort();
  const served = JSON.parse(
    readFileSync(path.join(ROOT, "apps/docs/public/ai/skill.json"), "utf8"),
  ) as { name: string; files: Array<{ path: string; content: string }> };

  it.each([
    ["the CLI", SKILL_FILES],
    ["/ai/skill.json", served.files],
  ])("%s carries every committed file, unchanged", (_, files) => {
    for (const file of files) {
      expect(file.content, file.path).toBe(readFileSync(path.join(SKILL_DIR, file.path), "utf8"));
    }
    expect(files.map((f) => f.path).sort()).toEqual(committed);
  });

  it("names the skill zoblocks", () => {
    expect(served.name).toBe("zoblocks");
  });
});

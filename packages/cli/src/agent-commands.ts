/**
 * `zoblocks mcp init` and `zoblocks skill add` — connecting coding agents to
 * ZoBlocks (ADR 0017).
 *
 * Both are file writers, so the CLI stays dependency-free (ADR 0016), and both
 * follow the rules `add` already keeps: they write only inside the project,
 * never overwrite something the developer changed without being told to, and
 * say what they touched.
 */

import path from "node:path";
import {
  CLIENTS,
  SERVER_NAME,
  configSnippet,
  findClient,
  type Client,
  type Transport,
} from "./agents.js";
import type { CommandContext } from "./commands.js";
import { SKILL_FILES } from "./generated/skill.js";
import { assertInsideProject, editFile } from "./write.js";

/* ------------------------------------------------------------------ */
/* mcp init                                                           */
/* ------------------------------------------------------------------ */

export interface McpInitOptions {
  client?: string;
  local: boolean;
  force: boolean;
  dryRun: boolean;
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function listClients(out: (line: string) => void) {
  out("  Choose an agent with --client:");
  out("");
  for (const client of CLIENTS) out(`    ${client.id.padEnd(10)} ${client.label}`);
}

function printBlock(out: (line: string) => void, text: string) {
  out("");
  for (const line of text.trimEnd().split("\n")) out(`    ${line}`);
}

export async function mcpInit(context: CommandContext, options: McpInitOptions): Promise<number> {
  const { cwd, out, err } = context;

  if (!options.client) {
    err("Which agent? zoblocks mcp init --client <agent>");
    err("");
    listClients(err);
    return 1;
  }

  const client = findClient(options.client);
  if (!client) {
    err(`Unknown agent "${options.client}".`);
    err("");
    listClients(err);
    return 1;
  }

  const transport: Transport = options.local ? "local" : "remote";
  const how =
    transport === "remote"
      ? "the hosted server, https://zoblocks.design/mcp"
      : "a local server (npx -y @zoblocks/mcp)";

  if (client.kind === "manual") {
    out(`${client.label} keeps its MCP servers outside this project, so this prints the`);
    out(`entry rather than writing it. Add it under "${client.container}" in ${client.where}:`);
    printBlock(out, configSnippet(client, transport).code);
    out("");
    out(`  ${client.next}`);
    return 0;
  }

  const file = path.join(cwd, client.file);
  try {
    assertInsideProject(file, cwd, client.file, "mcp init");
  } catch (error) {
    err((error as Error).message);
    return 1;
  }
  let result: WriteResult;
  try {
    result = await editFile(file, client.file, (current) =>
      client.kind === "json"
        ? planJson(current, client, transport, options)
        : planToml(current, client, transport, options),
    );
  } catch (error) {
    err((error as Error).message);
    return 1;
  }

  if (result.status === "refused") {
    err(result.message);
    printBlock(err, result.snippet);
    return 1;
  }

  const verb = {
    written: "write ",
    updated: "update",
    unchanged: "same  ",
    "would write": "would",
  }[result.status];
  out(`  ${verb} ${client.file}`);
  out("");
  out(`  ${client.label} → ${how}.`);
  if (result.status !== "unchanged" && result.status !== "would write") out(`  ${client.next}`);
  return 0;
}

type WriteResult =
  | { status: "written" | "updated" | "unchanged" | "would write" }
  | { status: "refused"; message: string; snippet: string };

/** What a config file should become: the result to report and, if it changes, its contents. */
type Plan = { result: WriteResult; content?: string };

/**
 * The two planners decide from the file's current contents and write
 * nothing; `editFile` reads and writes through one descriptor around them.
 */
function planJson(
  source: string | undefined,
  client: Client & { kind: "json" },
  transport: Transport,
  options: McpInitOptions,
): Plan {
  const entry = client.entry(transport);
  const snippet = configSnippet(client, transport).code;

  let config: Record<string, unknown> = {};
  const exists = source !== undefined;
  if (exists) {
    try {
      const parsed: unknown = JSON.parse(source);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("not an object");
      config = parsed as Record<string, unknown>;
    } catch {
      /*
       * Not JSON this can read — most often comments, which VS Code allows in
       * its own files. Rewriting it would drop them, so it is left alone and
       * the entry is printed to add by hand.
       */
      return {
        result: {
          status: "refused",
          message: `${client.file} is not plain JSON (comments?), so it was left as it is. Add this under "${client.container}":`,
          snippet,
        },
      };
    }
  }

  const servers = (config[client.container] ?? {}) as Record<string, unknown>;
  if (servers[SERVER_NAME] !== undefined) {
    if (sameJson(servers[SERVER_NAME], entry)) return { result: { status: "unchanged" } };
    if (!options.force) {
      return {
        result: {
          status: "refused",
          message: `${client.file} already has a "${SERVER_NAME}" server with different settings. Pass --force to replace it with:`,
          snippet,
        },
      };
    }
  }

  if (options.dryRun) return { result: { status: "would write" } };
  config[client.container] = { ...servers, [SERVER_NAME]: entry };
  return {
    result: { status: exists ? "updated" : "written" },
    content: `${JSON.stringify(config, null, 2)}\n`,
  };
}

function planToml(
  current: string | undefined,
  client: Client & { kind: "toml" },
  transport: Transport,
  options: McpInitOptions,
): Plan {
  const block = client.entry(transport);
  const exists = current !== undefined;
  const source = current ?? "";

  /*
   * One table, found by its header and replaced as a whole — from
   * `[mcp_servers.zoblocks]` to the next table header. Everything else in the
   * file is kept byte for byte, which a TOML round-trip would not promise
   * without a dependency.
   */
  const header = `[mcp_servers.${SERVER_NAME}]`;
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim() === header);

  if (start !== -1) {
    let end = lines.findIndex((line, i) => i > start && /^\s*\[/.test(line));
    if (end === -1) end = lines.length;
    const table = `${lines.slice(start, end).join("\n").trimEnd()}\n`;
    if (table === block) return { result: { status: "unchanged" } };
    if (!options.force) {
      return {
        result: {
          status: "refused",
          message: `${client.file} already has ${header} with different settings. Pass --force to replace it with:`,
          snippet: block,
        },
      };
    }
    if (options.dryRun) return { result: { status: "would write" } };
    const next = [
      ...lines.slice(0, start),
      block.trimEnd(),
      ...(end < lines.length ? ["", ...lines.slice(end)] : []),
    ];
    return { result: { status: "updated" }, content: `${next.join("\n").trimEnd()}\n` };
  }

  if (options.dryRun) return { result: { status: "would write" } };
  return {
    result: { status: exists ? "updated" : "written" },
    content: source.trim() ? `${source.trimEnd()}\n\n${block}` : block,
  };
}

/* ------------------------------------------------------------------ */
/* skill add                                                          */
/* ------------------------------------------------------------------ */

/**
 * Where the skill is written. Between them these two are read by every agent
 * ZoBlocks documents: `.agents/skills` by Codex, Cursor, VS Code, Gemini CLI,
 * Windsurf and Roo Code; `.claude/skills` by Claude Code and Cline (and, as a
 * fallback, Cursor and VS Code too).
 */
export const SKILL_DIRS = [".agents/skills/zoblocks", ".claude/skills/zoblocks"];

export interface SkillAddOptions {
  overwrite: boolean;
  dryRun: boolean;
}

/**
 * Writes the skill this CLI version ships with (`generated/skill.ts`, from
 * `pnpm gen`). It used to fetch `/ai/skill.json` and write what came back,
 * which made the files in a developer's repository whatever that URL served
 * on the day. Bundled, they are what the published tarball contains — the
 * same trust as the rest of the CLI — and the command works offline.
 * `npx @zoblocks/cli` resolves the latest version, so the skill is current.
 */
export async function skillAdd(context: CommandContext, options: SkillAddOptions): Promise<number> {
  const { cwd, out, err } = context;

  let skipped = 0;
  for (const dir of SKILL_DIRS) {
    for (const file of SKILL_FILES) {
      const relative = path.posix.join(dir, file.path);
      const absolute = path.join(cwd, relative);
      let outcome: "same" | "skip" | "would" | "write " | "update";
      try {
        assertInsideProject(absolute, cwd, relative, "skill add");
        outcome = await editFile(absolute, relative, (existing) => {
          if (existing === file.content) return { result: "same" };
          if (existing !== undefined && !options.overwrite) return { result: "skip" };
          if (options.dryRun) return { result: "would" };
          return {
            result: existing === undefined ? "write " : "update",
            content: file.content,
          };
        });
      } catch (error) {
        err((error as Error).message);
        return 1;
      }

      if (outcome === "skip") {
        out(`  skip   ${relative} — changed here`);
        skipped++;
      } else {
        out(`  ${outcome.padEnd(6)} ${relative}`);
      }
    }
  }

  out("");
  if (skipped) {
    out(
      `  ${skipped} file(s) differ from this version's skill and were left alone. Pass --overwrite to replace them.`,
    );
    out("");
  }
  out("  .agents/skills is read by Codex, Cursor, VS Code, Gemini CLI, Windsurf and Roo Code;");
  out("  .claude/skills by Claude Code and Cline. Commit both so everyone on the project gets it.");
  out(
    "  For the facts the skill relies on, connect the MCP server: zoblocks mcp init --client <agent>",
  );
  return 0;
}

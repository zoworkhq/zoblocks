/**
 * `zoblocks mcp init` and `zoblocks skill add`, driven through `run()` against
 * a real temp directory — so what is asserted is the file that lands.
 *
 * The config shapes are pinned exactly. Each comes from that agent's own
 * documentation, and a small difference — `url` where Gemini wants `httpUrl`,
 * no `type` for Cline — is a server that silently never connects.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { run } from "../src/cli.js";
import { SKILL_DIRS } from "../src/agent-commands.js";
import { SKILL_FILES } from "../src/generated/skill.js";
import { REMOTE_URL } from "../src/agents.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "zoblocks-agents-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function zoblocks(argv: string[], fetchImpl?: typeof fetch) {
  const out: string[] = [];
  const err: string[] = [];
  const code = await run({
    argv: [...argv, "--cwd", dir],
    cwd: dir,
    env: {},
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    version: "0.0.0-test",
    ...(fetchImpl ? { fetchImpl } : {}),
  });
  return { code, out: out.join("\n"), err: err.join("\n") };
}

const json = async (file: string) => JSON.parse(await readFile(path.join(dir, file), "utf8"));
const text = (file: string) => readFile(path.join(dir, file), "utf8");

const LOCAL = { command: "npx", args: ["-y", "@zoblocks/mcp"] };

describe("zoblocks mcp init", () => {
  it("asks which agent, and lists them", async () => {
    const { code, err } = await zoblocks(["mcp", "init"]);
    expect(code).toBe(1);
    for (const id of [
      "claude",
      "codex",
      "cursor",
      "vscode",
      "roo",
      "gemini",
      "windsurf",
      "cline",
      "copilot",
    ]) {
      expect(err).toContain(id);
    }
  });

  it("refuses an agent it does not know", async () => {
    const { code, err } = await zoblocks(["mcp", "init", "--client", "notepad"]);
    expect(code).toBe(1);
    expect(err).toContain('Unknown agent "notepad"');
  });

  it("refuses an unknown mcp subcommand", async () => {
    expect((await zoblocks(["mcp", "add"])).code).toBe(1);
  });

  it.each([
    ["claude", ".mcp.json", { mcpServers: { zoblocks: { type: "http", url: REMOTE_URL } } }],
    ["cursor", ".cursor/mcp.json", { mcpServers: { zoblocks: { url: REMOTE_URL } } }],
    ["vscode", ".vscode/mcp.json", { servers: { zoblocks: { type: "http", url: REMOTE_URL } } }],
    [
      "roo",
      ".roo/mcp.json",
      { mcpServers: { zoblocks: { type: "streamable-http", url: REMOTE_URL } } },
    ],
    ["gemini", ".gemini/settings.json", { mcpServers: { zoblocks: { httpUrl: REMOTE_URL } } }],
  ])("writes %s's config in its own shape", async (client, file, expected) => {
    const { code, out } = await zoblocks(["mcp", "init", "--client", client]);
    expect(code).toBe(0);
    expect(out).toContain(`write  ${file}`);
    expect(await json(file)).toEqual(expected);
  });

  it.each([
    ["claude", ".mcp.json", "mcpServers", { type: "stdio", ...LOCAL }],
    ["cursor", ".cursor/mcp.json", "mcpServers", LOCAL],
    ["vscode", ".vscode/mcp.json", "servers", { type: "stdio", ...LOCAL }],
    ["gemini", ".gemini/settings.json", "mcpServers", LOCAL],
  ])("with --local, points %s at npx -y @zoblocks/mcp", async (client, file, container, entry) => {
    await zoblocks(["mcp", "init", "--client", client, "--local"]);
    expect((await json(file))[container].zoblocks).toEqual(entry);
  });

  it("accepts an agent's other name", async () => {
    await zoblocks(["mcp", "init", "--client", "claude-code"]);
    expect(existsSync(path.join(dir, ".mcp.json"))).toBe(true);
  });

  it("adds itself beside the servers already there, and keeps everything else", async () => {
    await writeFile(
      path.join(dir, ".mcp.json"),
      JSON.stringify({
        mcpServers: { github: { type: "http", url: "https://example.org/mcp" } },
        other: 1,
      }),
    );
    const { out } = await zoblocks(["mcp", "init", "--client", "claude"]);
    expect(out).toContain("update .mcp.json");
    expect(await json(".mcp.json")).toEqual({
      mcpServers: {
        github: { type: "http", url: "https://example.org/mcp" },
        zoblocks: { type: "http", url: REMOTE_URL },
      },
      other: 1,
    });
  });

  it("does nothing on a second run", async () => {
    await zoblocks(["mcp", "init", "--client", "cursor"]);
    const before = await text(".cursor/mcp.json");
    const { code, out } = await zoblocks(["mcp", "init", "--client", "cursor"]);
    expect(code).toBe(0);
    expect(out).toContain("same   .cursor/mcp.json");
    expect(await text(".cursor/mcp.json")).toBe(before);
  });

  it("will not replace a different zoblocks entry without --force", async () => {
    await zoblocks(["mcp", "init", "--client", "cursor", "--local"]);
    const refused = await zoblocks(["mcp", "init", "--client", "cursor"]);
    expect(refused.code).toBe(1);
    expect(refused.err).toContain("--force");
    expect((await json(".cursor/mcp.json")).mcpServers.zoblocks).toEqual(LOCAL);

    const forced = await zoblocks(["mcp", "init", "--client", "cursor", "--force"]);
    expect(forced.code).toBe(0);
    expect((await json(".cursor/mcp.json")).mcpServers.zoblocks).toEqual({ url: REMOTE_URL });
  });

  it("leaves a file with comments alone and prints the entry instead", async () => {
    await mkdir(path.join(dir, ".vscode"));
    const original = '{\n  // my servers\n  "servers": {}\n}\n';
    await writeFile(path.join(dir, ".vscode/mcp.json"), original);
    const { code, err } = await zoblocks(["mcp", "init", "--client", "vscode"]);
    expect(code).toBe(1);
    expect(err).toContain("not plain JSON");
    expect(err).toContain(REMOTE_URL);
    expect(await text(".vscode/mcp.json")).toBe(original);
  });

  it("writes nothing on --dry-run", async () => {
    const { code, out } = await zoblocks(["mcp", "init", "--client", "claude", "--dry-run"]);
    expect(code).toBe(0);
    expect(out).toContain("would .mcp.json");
    expect(await readdir(dir)).toEqual([]);
  });

  it("rewrites a longer file in place without leaving its old tail behind", async () => {
    // Written through one descriptor: the new contents are shorter than the old,
    // so anything past them must be truncated, not left as trailing bytes.
    const padded = `{\n  "mcpServers": {\n    "other": { "command": "x" }\n  }\n}${" ".repeat(4096)}\n`;
    await writeFile(path.join(dir, ".mcp.json"), padded);
    const { code } = await zoblocks(["mcp", "init", "--client", "claude"]);
    expect(code).toBe(0);
    const written = await text(".mcp.json");
    expect(written.endsWith("}\n")).toBe(true);
    expect(written.length).toBeLessThan(padded.length);
    expect(JSON.parse(written).mcpServers.other).toEqual({ command: "x" });
  });

  it("will not write through a config file that is a symlink", async () => {
    const outside = await mkdtemp(path.join(tmpdir(), "zoblocks-outside-"));
    try {
      const target = path.join(outside, "mcp.json");
      await writeFile(target, "{}\n");
      await symlink(target, path.join(dir, ".mcp.json"));
      const { code, err } = await zoblocks(["mcp", "init", "--client", "claude"]);
      expect(code).toBe(1);
      expect(err).toContain("symlink");
      expect(await readFile(target, "utf8")).toBe("{}\n");
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("will not write through a config folder that links outside the project", async () => {
    const outside = await mkdtemp(path.join(tmpdir(), "zoblocks-outside-"));
    try {
      await symlink(outside, path.join(dir, ".cursor"));
      const { code, err } = await zoblocks(["mcp", "init", "--client", "cursor"]);
      expect(code).toBe(1);
      expect(err).toContain("outside the project");
      expect(await readdir(outside)).toEqual([]);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  describe("Codex", () => {
    it("writes a TOML table", async () => {
      await zoblocks(["mcp", "init", "--client", "codex"]);
      expect(await text(".codex/config.toml")).toBe(
        `[mcp_servers.zoblocks]\nurl = "${REMOTE_URL}"\n`,
      );
    });

    it("writes the local command as TOML", async () => {
      await zoblocks(["mcp", "init", "--client", "codex", "--local"]);
      expect(await text(".codex/config.toml")).toBe(
        '[mcp_servers.zoblocks]\ncommand = "npx"\nargs = ["-y", "@zoblocks/mcp"]\n',
      );
    });

    it("keeps the rest of the file byte for byte", async () => {
      await mkdir(path.join(dir, ".codex"));
      const before = 'model = "gpt-5"\n\n[mcp_servers.github]\nurl = "https://example.org/mcp"\n';
      await writeFile(path.join(dir, ".codex/config.toml"), before);
      await zoblocks(["mcp", "init", "--client", "codex"]);
      expect(await text(".codex/config.toml")).toBe(
        `${before}\n[mcp_servers.zoblocks]\nurl = "${REMOTE_URL}"\n`,
      );
      expect((await zoblocks(["mcp", "init", "--client", "codex"])).out).toContain("same");
    });

    it("replaces only its own table with --force", async () => {
      await mkdir(path.join(dir, ".codex"));
      await writeFile(
        path.join(dir, ".codex/config.toml"),
        '[mcp_servers.zoblocks]\nurl = "https://old.example.org/mcp"\n\n[mcp_servers.github]\nurl = "https://example.org/mcp"\n',
      );
      expect((await zoblocks(["mcp", "init", "--client", "codex"])).code).toBe(1);
      await zoblocks(["mcp", "init", "--client", "codex", "--force"]);
      expect(await text(".codex/config.toml")).toBe(
        `[mcp_servers.zoblocks]\nurl = "${REMOTE_URL}"\n\n[mcp_servers.github]\nurl = "https://example.org/mcp"\n`,
      );
    });
  });

  it.each([
    ["windsurf", "serverUrl"],
    ["cline", "streamableHttp"],
    ["copilot", '"tools"'],
  ])("prints %s's entry and writes nothing in the project", async (client, marker) => {
    const { code, out } = await zoblocks(["mcp", "init", "--client", client]);
    expect(code).toBe(0);
    expect(out).toContain(marker);
    expect(out).toContain(REMOTE_URL);
    expect(await readdir(dir)).toEqual([]);
  });
});

describe("zoblocks skill add", () => {
  /** A fetch that fails the test if called: the skill ships inside the CLI. */
  const offline = (async () => {
    throw new Error("skill add must not use the network");
  }) as unknown as typeof fetch;

  const skill = SKILL_FILES.find((f) => f.path === "SKILL.md")!;

  it("writes the bundled skill where every agent reads it, without the network", async () => {
    const { code, out } = await zoblocks(["skill", "add"], offline);
    expect(code).toBe(0);
    for (const root of SKILL_DIRS) {
      for (const file of SKILL_FILES) {
        expect(await text(`${root}/${file.path}`)).toBe(file.content);
      }
      expect(out).toContain(`write  ${root}/SKILL.md`);
    }
  });

  it("does nothing on a second run", async () => {
    await zoblocks(["skill", "add"], offline);
    const { out } = await zoblocks(["skill", "add"], offline);
    expect(out).toContain("same   .agents/skills/zoblocks/SKILL.md");
    expect(out).not.toContain("write");
  });

  it("leaves a file changed in the project alone unless --overwrite", async () => {
    await zoblocks(["skill", "add"], offline);
    await writeFile(path.join(dir, ".claude/skills/zoblocks/SKILL.md"), "edited\n");

    const kept = await zoblocks(["skill", "add"], offline);
    expect(kept.out).toContain("skip   .claude/skills/zoblocks/SKILL.md");
    expect(kept.out).toContain("--overwrite");
    expect(await text(".claude/skills/zoblocks/SKILL.md")).toBe("edited\n");

    await zoblocks(["skill", "add", "--overwrite"], offline);
    expect(await text(".claude/skills/zoblocks/SKILL.md")).toBe(skill.content);
  });

  it("writes nothing on --dry-run", async () => {
    await zoblocks(["skill", "add", "--dry-run"], offline);
    expect(await readdir(dir)).toEqual([]);
  });

  it("will not write through a skills folder that links outside the project", async () => {
    const outside = await mkdtemp(path.join(tmpdir(), "zoblocks-outside-"));
    try {
      await mkdir(path.join(dir, ".claude"), { recursive: true });
      await symlink(outside, path.join(dir, ".claude/skills"));
      const { code, err } = await zoblocks(["skill", "add"], offline);
      expect(code).toBe(1);
      expect(err).toContain("outside the project");
      expect(await readdir(outside)).toEqual([]);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("ships only SKILL.md and its references — nothing that could leave the folder", () => {
    expect(SKILL_FILES.map((f) => f.path)).toContain("SKILL.md");
    for (const file of SKILL_FILES) {
      expect(file.path).toMatch(/^(SKILL\.md|references\/[a-z0-9-]+\.md)$/);
    }
    expect(skill.content).toMatch(/^---\n[\s\S]*?^name: zoblocks$/m);
  });
});

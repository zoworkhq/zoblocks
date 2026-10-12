/**
 * How each coding agent is told about the ZoBlocks MCP server (ADR 0017).
 *
 * Nine agents, at least four JSON shapes and a TOML file for the same server:
 * `mcpServers` against `servers`, `url` against `serverUrl` against `httpUrl`,
 * and three spellings of "this is Streamable HTTP". A developer copying a
 * snippet from the wrong agent's page gets a server that silently never
 * connects — Cline, given a `url` with no `type`, assumes the retired SSE
 * transport. So each shape is written down once, here, and `mcp init` writes
 * it for them.
 *
 * Every shape below is from the agent's own documentation as of September
 * 2026. Agents whose MCP settings live outside the project — in the user's
 * home directory or a web UI — are not written to: the CLI prints the exact
 * block and where it goes, because a project tool editing a user's global
 * agent settings is not something they asked for.
 */

export const REMOTE_URL = "https://zoblocks.design/mcp";
export const LOCAL_COMMAND = { command: "npx", args: ["-y", "@zoblocks/mcp"] } as const;

/** The server's name in every config. Short, because agents prefix tool names with it. */
export const SERVER_NAME = "zoblocks";

export type Transport = "remote" | "local";

interface JsonClient {
  kind: "json";
  /** Project-relative config file. */
  file: string;
  /** The object servers are listed under. */
  container: "mcpServers" | "servers";
  entry: (transport: Transport) => Record<string, unknown>;
}

interface TomlClient {
  kind: "toml";
  file: string;
  entry: (transport: Transport) => string;
}

interface ManualClient {
  kind: "manual";
  /** Where the user pastes it, in words. */
  where: string;
  entry: (transport: Transport) => Record<string, unknown>;
  container: "mcpServers";
}

export type Client = {
  id: string;
  label: string;
  aliases: string[];
  /** What to do after the config is written, to see it connect. */
  next: string;
  /** The agent's own MCP documentation, for anything this does not cover. */
  docsUrl: string;
  /** The skill folder `zoblocks skill add` writes that this agent reads. */
  skillDir: ".agents/skills" | ".claude/skills";
} & (JsonClient | TomlClient | ManualClient);

const local = () => ({ command: LOCAL_COMMAND.command, args: [...LOCAL_COMMAND.args] });

export const CLIENTS: readonly Client[] = [
  {
    id: "claude",
    docsUrl: "https://code.claude.com/docs/en/mcp",
    skillDir: ".claude/skills",
    label: "Claude Code",
    aliases: ["claude-code"],
    kind: "json",
    file: ".mcp.json",
    container: "mcpServers",
    entry: (t) =>
      t === "remote" ? { type: "http", url: REMOTE_URL } : { type: "stdio", ...local() },
    next: "Restart Claude Code, approve the project server when asked, and run /mcp — zoblocks should be connected.",
  },
  {
    id: "codex",
    docsUrl: "https://developers.openai.com/codex/mcp",
    skillDir: ".agents/skills",
    label: "OpenAI Codex",
    aliases: ["openai"],
    kind: "toml",
    file: ".codex/config.toml",
    entry: (t) =>
      t === "remote"
        ? `[mcp_servers.${SERVER_NAME}]\nurl = "${REMOTE_URL}"\n`
        : `[mcp_servers.${SERVER_NAME}]\ncommand = "${LOCAL_COMMAND.command}"\nargs = [${LOCAL_COMMAND.args.map((a) => `"${a}"`).join(", ")}]\n`,
    next: "Codex reads a project's .codex/config.toml only when the project is trusted. Restart Codex and run /mcp.",
  },
  {
    id: "cursor",
    docsUrl: "https://cursor.com/docs/context/mcp",
    skillDir: ".agents/skills",
    label: "Cursor",
    aliases: [],
    kind: "json",
    file: ".cursor/mcp.json",
    container: "mcpServers",
    entry: (t) => (t === "remote" ? { url: REMOTE_URL } : local()),
    next: "Open Cursor Settings → MCP and check that zoblocks is enabled.",
  },
  {
    id: "vscode",
    docsUrl: "https://code.visualstudio.com/docs/copilot/customization/mcp-servers",
    skillDir: ".agents/skills",
    label: "VS Code (GitHub Copilot agent mode)",
    aliases: ["vs-code", "copilot-vscode"],
    kind: "json",
    file: ".vscode/mcp.json",
    container: "servers",
    entry: (t) =>
      t === "remote" ? { type: "http", url: REMOTE_URL } : { type: "stdio", ...local() },
    next: "Open .vscode/mcp.json and select Start above zoblocks, or run “MCP: List Servers”.",
  },
  {
    id: "roo",
    docsUrl: "https://docs.roocode.com/features/mcp/using-mcp-in-roo",
    skillDir: ".agents/skills",
    label: "Roo Code",
    aliases: ["roo-code"],
    kind: "json",
    file: ".roo/mcp.json",
    container: "mcpServers",
    entry: (t) => (t === "remote" ? { type: "streamable-http", url: REMOTE_URL } : local()),
    next: "Open Roo Code's MCP servers panel and check that zoblocks is connected.",
  },
  {
    id: "gemini",
    docsUrl: "https://geminicli.com/docs/tools/mcp-server/",
    skillDir: ".agents/skills",
    label: "Gemini CLI",
    aliases: ["gemini-cli"],
    kind: "json",
    file: ".gemini/settings.json",
    container: "mcpServers",
    entry: (t) => (t === "remote" ? { httpUrl: REMOTE_URL } : local()),
    next: "Start gemini in this project and run /mcp.",
  },
  {
    id: "windsurf",
    docsUrl: "https://docs.windsurf.com/windsurf/cascade/mcp",
    skillDir: ".agents/skills",
    label: "Windsurf (Devin Desktop)",
    aliases: ["devin", "devin-desktop"],
    kind: "manual",
    container: "mcpServers",
    where:
      "~/.config/devin/mcp_config.json (Windows: %APPDATA%\\devin\\mcp_config.json) — or Cascade's … menu → MCP servers → View raw config",
    entry: (t) => (t === "remote" ? { serverUrl: REMOTE_URL } : local()),
    next: "Refresh the MCP servers list in Cascade.",
  },
  {
    id: "cline",
    docsUrl: "https://docs.cline.bot/mcp/configuring-mcp-servers",
    skillDir: ".claude/skills",
    label: "Cline",
    aliases: [],
    kind: "manual",
    container: "mcpServers",
    where:
      "Cline's MCP settings: MCP Servers icon → Configure → Configure MCP Servers (the CLI uses ~/.cline/mcp.json)",
    // `type` is not optional here: without it Cline assumes the retired SSE transport.
    entry: (t) => (t === "remote" ? { type: "streamableHttp", url: REMOTE_URL } : local()),
    next: "Check that zoblocks shows as connected in Cline's MCP Servers panel.",
  },
  {
    id: "copilot",
    docsUrl:
      "https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp",
    skillDir: ".agents/skills",
    label: "GitHub Copilot cloud agent",
    aliases: ["github", "copilot-agent"],
    kind: "manual",
    container: "mcpServers",
    where: "your repository on GitHub: Settings → Copilot → MCP servers",
    entry: (t) =>
      t === "remote"
        ? { type: "http", url: REMOTE_URL, tools: ["*"] }
        : { type: "local", ...local(), tools: ["*"] },
    next: "The cloud agent uses tools only, which is all the ZoBlocks server needs.",
  },
];

export function findClient(name: string): Client | undefined {
  const wanted = name.trim().toLowerCase();
  return CLIENTS.find((c) => c.id === wanted || c.aliases.includes(wanted));
}

/**
 * The exact config an agent needs, as the file (or place) and its text — what
 * `mcp init` writes or prints, and what the docs page shows. One function, so
 * the two can never disagree.
 */
export function configSnippet(
  client: Client,
  transport: Transport,
): { file: string; language: "json" | "toml"; code: string } {
  if (client.kind === "toml") {
    return { file: client.file, language: "toml", code: client.entry(transport) };
  }
  return {
    file: client.kind === "json" ? client.file : client.where,
    language: "json",
    code: JSON.stringify(
      { [client.container]: { [SERVER_NAME]: client.entry(transport) } },
      null,
      2,
    ),
  };
}

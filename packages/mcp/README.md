# @zoblocks/mcp

A read-only [MCP](https://modelcontextprotocol.io) server that lets coding agents
look up ZoBlocks components — their props, examples, install steps and setup
for each framework and UI style — so they use the library instead of guessing
at it.

Part of [ZoBlocks](https://zoblocks.design).

## Connect your agent

Use the hosted endpoint — nothing to install:

```text
https://zoblocks.design/mcp
```

Or run it locally over stdio:

```bash
npx -y @zoblocks/mcp
```

Step-by-step setup for Claude Code, Codex, Cursor, VS Code, GitHub Copilot,
Windsurf, Cline, Roo Code and Gemini CLI is at
[zoblocks.design/docs](https://zoblocks.design/docs).

## Tools

All read-only.

| Tool                     | Answers                                                                   |
| ------------------------ | ------------------------------------------------------------------------- |
| `list_components`        | What is in the catalog — optionally by layer, category, status, framework |
| `search_components`      | Which component fits a need: "lab result", "toggle", "FHIR Observation"   |
| `get_component`          | Every export and prop (from the TypeScript types), states, guidance, a11y |
| `get_component_examples` | Runnable usage and the named examples                                     |
| `get_installation`       | Exact commands, files written and stylesheet lines, per package manager   |
| `get_framework_rules`    | Setup for Next.js App/Pages Router, Vite, Vue, Angular, Svelte, HTML      |
| `get_conventions`        | The rules for code that uses ZoBlocks, and what ZoBlocks does not ship    |

Components are also offered as resources (`zoblocks://component/{name}`) for
clients that read them.

## Options

| Flag               | Effect                                                      |
| ------------------ | ----------------------------------------------------------- |
| `--registry <url>` | Read the catalog from a mirror instead of `zoblocks.design` |
| `--offline`        | Use the catalog bundled with this version; no network       |
| `--version`        | Print the version                                           |

The server reads the live catalog so it describes what `zoblocks add` installs
today, and falls back to the catalog bundled with the package when the network
is not there.

## What it can and cannot do

It answers questions about ZoBlocks. It reads nothing on your machine — no
files, no environment — writes nothing, and sends no telemetry. Installing is
left to the ZoBlocks CLI, which your agent runs in the open.

The catalog it serves is generated from the same component metadata as the
docs site. See
[ADR 0017](https://github.com/zoworkhq/zoblocks/blob/main/content/decisions/0017-coding-agents-read-the-catalog.md)
for the design.

## License

MIT

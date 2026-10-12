# 0017 — Coding agents read the catalog through a read-only MCP server

**Status:** accepted · 30 September 2026

> **Relates to:** [0004](0004-generated-component-metadata.md), which listed "an
> MCP manifest" among the generated artifacts and never built it;
> [0009](0009-supply-chain-and-component-constraints.md), under which this adds
> a runtime dependency; [0016](0016-the-installer-is-ours.md), whose
> zero-dependency installer this deliberately leaves alone.

## Context

Coding agents now install and wire components on a developer's behalf, and a
source-distributed library reaches them in a way a prose website does not. The
one channel we built for them is `llms.txt`: a single 20 KB file, generated
from the catalog, with the rules that matter and an install line per component.
It has no props, no examples, no framework setup, and no way to ask a question
of it — an agent has to read all of it to learn anything, and it still cannot
tell which props a component takes.

What an agent gets wrong without better information is specific, and was
found while writing the plan for this record rather than imagined:

- **It invents components.** ZoBlocks ships no Button — primitives follow Ant
  Design's API and the chrome around a clinical component comes from the host
  application ([0010](0010-antd-compatible-primitives.md), `host-react`'s
  contract). "A settings page with a ZoBlocks Switch and Button" is exactly the
  prompt that produces `@/components/zoblocks/button`, which does not exist.
- **It invents props.** The contract is extracted from the TypeScript types
  ([0004](0004-generated-component-metadata.md)), and nothing an agent can read
  today contains it.
- **It gets the setup wrong in ways that fail late.** A component stylesheet
  that is written but never imported renders bare markup; a Material UI theme
  file without `"use client"` fails `next build`; on the Pages Router the
  bridges read the library's _default_ theme unless `transpilePackages` is set.
  Each of these was found by building it, and each is invisible until then.

The agents themselves have converged enough to build for once. Every major
coding agent — Claude Code, Codex, Cursor, VS Code with Copilot, GitHub's
Copilot cloud agent, Windsurf (now Devin Desktop), Cline, Roo Code, Gemini CLI
— speaks the Model Context Protocol, and all of them read the Agent Skills
format (`SKILL.md`). What they have _not_ converged on is configuration: at
least four different JSON shapes and one TOML file for the same server, and
three spellings of the HTTP transport type. And one constraint shapes the tool
design outright: Copilot's cloud agent supports MCP **tools only** — no
resources, no prompts.

## Decision

**ZoBlocks ships a read-only MCP server, `@zoblocks/mcp`, generated from the
catalog, and a short coding skill that teaches agents to use it.**

1. **One server, two ways in.** A single server definition is served locally
   over stdio (`npx -y @zoblocks/mcp`) and remotely over Streamable HTTP at
   `https://zoblocks.design/mcp`, from a route in the docs app. Remote is the
   default in the docs — nothing to install, always current. Local exists for
   offline work, for agents that prefer it, and for customers who must use a
   mirror (`--registry <url>`, the same self-contained resolution as
   [0016](0016-the-installer-is-ours.md)).

2. **The catalog is the only source.** `pnpm gen` emits a JSON manifest — the
   one [0004](0004-generated-component-metadata.md) promised — from the same
   metadata, extracted props, examples and registry items that build the docs
   and the registry. Framework and style setup (App Router, Pages Router and
   Vite, each with ZoBlocks, Ant Design or Material UI) moves out of the docs
   page into shared data that both the page and the manifest read. Nothing an
   agent is told is written a second time, and `gen --check` fails CI on drift
   exactly as it does today.

3. **Everything is a tool.** Seven read-only tools — `list_components`,
   `search_components`, `get_component`, `get_component_examples`,
   `get_installation`, `get_framework_rules`, `get_conventions` — so the whole
   surface works in a tools-only client. Resources are offered as well, for
   clients that read them; prompts are not. Every tool carries
   `readOnlyHint: true`. The server's `instructions` field — which Codex reads
   as server-wide guidance, weighting the first 512 characters — says the three
   things that prevent most mistakes: search before building, never invent a
   prop, install with the CLI.

4. **The server reads nothing on the developer's machine and writes nothing
   anywhere.** No project files, no environment, no filesystem. Detecting the
   framework is the agent's job — it can already read the project, and the
   skill says which files to look at — so `get_installation` takes the
   framework as input rather than discovering it. Installing stays with the
   CLI, which the agent runs in the open where the developer can see and
   approve it. An MCP tool that edited files would be a second installer with
   less visibility than the first.

5. **The dependency is `@modelcontextprotocol/server` 2.x**, the server half of
   the official TypeScript SDK. Its runtime tree is three packages —
   `@modelcontextprotocol/server`, `@modelcontextprotocol/core`, `zod` — all
   MIT, Node ≥ 20. It provides the stdio transport and a web-standard HTTP
   handler (`createMcpHandler`) that takes a `Request` and returns a
   `Response`, so the remote endpoint needs no Express, no Hono and no
   adapter. Both transports were exercised end to end — `initialize`,
   `tools/list`, `tools/call` — before this record was written. Pinned exactly,
   covered by the existing `pnpm audit` gate and SBOM, like everything else.

6. **The free catalog only.** Paid registry items would need authentication in
   the server and would put the Pro boundary of
   [0002](0002-dual-channel-distribution.md) inside a new surface. A later
   record can add them behind the same `${ENV_VAR}` token convention
   `zoblocks.json` already uses.

7. **The skill lives in this repository** as `skills/zoblocks/`: a hand-written
   `SKILL.md` kept short (well under the ~5k tokens Cline recommends), plus
   reference files generated by `pnpm gen` so they cannot drift. `pnpm gen`
   also writes it into `@zoblocks/cli` as a module, and `zoblocks skill add`
   installs that copy into `.agents/skills/` and `.claude/skills/` — between
   them read by every agent listed above. It is published as one JSON document
   beside the manifest (`/ai/skill.json`) as well, for anything that wants it
   whole.

   _Amended 12 Oct 2026._ The CLI first fetched `/ai/skill.json` and wrote
   what came back. CodeQL flagged it (`js/http-to-file-access`), and rightly
   as a design point: the files landing in a developer's repository were
   whatever that URL served on the day. Bundled, they are what the published
   tarball contains — the trust the rest of the CLI already asks for — and the
   command works offline. The cost is that a skill change ships with a CLI
   release; `npx @zoblocks/cli` resolves the latest version, so in practice
   it arrives the same way.

8. **The CLI stays at zero dependencies.** Two commands join it —
   `zoblocks mcp init --client <agent>`, which writes the correct config file
   for each agent, and `zoblocks skill add` — and both are file writers that
   need nothing Node 20 does not supply. The server is a separate package
   precisely so that [0016](0016-the-installer-is-ours.md)'s rule holds.

9. **No telemetry, in either direction.** The server does not report usage,
   and the skill is not distributed through an installer that does.

### The remote endpoint

It is public, stateless, unauthenticated, and serves only what
`https://zoblocks.design/r/` and `llms.txt` already publish. It adds no data
exposure; it adds a new way to request the same data. The SDK's HTTP entry
point performs no Origin or Host validation by design, and leaves it to the
caller: the route therefore validates both, answers only `POST` with a JSON
content type, logs no tool arguments, and relies on the platform's rate
limiting. A local HTTP mode, if one is ever added, must bind to localhost and
reject foreign origins — the DNS-rebinding case the SDK documents.

### Where this sits against 0009

[0009](0009-supply-chain-and-component-constraints.md)'s no-network rule is a
rule about **components** — code that receives `Patient` and `Observation`
resources. The MCP server is tooling, like the CLI: it never sees patient data,
never runs in a customer's application, and fetches only our own public
manifest. It is held to 0009's supply-chain half — pinned, audited, attested,
and justified here — not to the component half.

## Consequences

**Good.** An agent can answer "is there a component for this?", "what does it
take?" and "how is it set up here?" from the same facts the docs render, instead
of guessing — and the guesses were the failures. The catalog work of
[0004](0004-generated-component-metadata.md) pays out a third time. Adding a
component still touches one directory; the manifest, the tools and the skill's
references follow from `pnpm gen`. The read-only, no-file-access design is
short to explain in a customer's security review: the server can tell an agent
things, and cannot do anything.

**Costs.**

- **A second zod major.** The repository is on zod 3; the SDK needs zod ≥ 4.2.
  pnpm isolates them and nothing shared crosses the boundary — the server
  validates the manifest with its own zod — but two majors is real maintenance
  until the rest moves to 4, which is its own decision.
- **A second distribution surface to keep honest.** The npm package snapshots a
  fallback manifest at publish; the remote endpoint deploys with the docs. The
  local server therefore fetches the live manifest first — the same place the
  CLI resolves components — so the two agree with what `zoblocks add` installs,
  and both report their version on connect.
- **The SDK's v2 is two months old.** It moved from one package to several in
  July 2026; the older `@modelcontextprotocol/sdk` 1.x remains the `latest`
  tag. We track 2.x because its dependency tree is the one we can defend, and
  accept that its API may still move.
- **Nine agents' configuration formats are ours to track.** `mcp init` isolates
  that to one small writer per client, and the docs link each agent's own
  reference, but these formats are young and still moving — Windsurf's moved
  to Devin Desktop's, with a new config path, while this record was drafted.
- **A skill steers; it does not guarantee.** Agents can still produce wrong
  code. The mitigation is verification the skill asks for — `tsc` and the
  build — and an evaluation suite that runs real prompts against real agents
  and grades the output by script. `@zoblocks/eslint-plugin` is not published,
  so an agent cannot run it in a customer's project; its rules reach agents as
  written conventions in the manifest instead, in the rules' own words.

**Rejected: `@modelcontextprotocol/sdk` 1.x.** The package every tutorial uses,
and seventeen runtime dependencies including Express, Hono, `cors`,
`express-rate-limit` and `jose` — most of them for transports and OAuth flows a
read-only catalog server never uses. That is the tree a vendor security review
opens first.

**Rejected: a hand-written, dependency-free server.** Stdio JSON-RPC is small,
and this was the only option that kept the dependency count at zero. But the
protocol changed eras in 2026, the HTTP transport's legacy fallback alone is
subtle, and protocol correctness is not where this project should spend its
attention. Three MIT packages from the protocol's maintainers are a better
trade than owning the spec.

**Rejected: Vercel's `mcp-handler`.** It adds `chalk` and `commander` to wrap a
handler the SDK now ships itself.

**Rejected: the server as a CLI subcommand**, as shadcn does. It would break
[0016](0016-the-installer-is-ours.md)'s zero-dependency rule for every
developer who only wants to install a component. The CLI gets the config
writer, which needs no dependency; the server gets its own package.

**Rejected: tools that write files.** An `install_component` tool would be a
second installer, running with the agent's authority and less visibility than
the CLI the agent can already run.

**Rejected: a `get_project_setup` tool that reads the project.** A remote server
cannot, and a local one should not need to. The agent reads the project; the
server answers questions about ZoBlocks.

**Rejected: distributing the skill through skills.sh.** The most convenient
cross-agent installer, and it records anonymous install telemetry. Our own CLI
reaches the same agents without it.

**Rejected: Pro components in the first version.** See decision 6.

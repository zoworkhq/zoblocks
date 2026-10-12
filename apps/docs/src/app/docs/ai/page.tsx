import type { Metadata } from "next";
import Link from "next/link";
import { CLIENTS, REMOTE_URL, configSnippet, type Client } from "@zoblocks/cli/agents";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { RevealRoot } from "@/components/site/interactions";
import { CodeBlock } from "@/components/site/code-block";
import { DocTabs } from "@/components/site/doc-tabs";
import { PmCommand } from "@/components/site/pm-command";
import {
  C,
  Callout,
  DocSection,
  DocStep,
  DocSteps,
  DocsHero,
  DocsShell,
} from "@/components/site/docs-shell";

/**
 * /docs/ai — connecting a coding agent to ZoBlocks (ADR 0017).
 *
 * Every agent's config on this page comes from `@zoblocks/cli/agents`, the
 * definitions `zoblocks mcp init` writes from — so the snippet a reader
 * copies and the file the CLI writes cannot differ. Each shape is from that
 * agent's own documentation, and the Claude Code one was connected end to end
 * before this page was written.
 *
 * The walkthrough's three settings pages were each typechecked and built in
 * a fresh Next.js app against the real Switch from the registry. What is
 * written only here is what a page needs and a CLI does not: the
 * troubleshooting per agent, and the order an agent works in.
 */
export const metadata: Metadata = {
  title: "Use ZoBlocks with AI coding agents",
  description:
    "Connect Claude Code, Codex, Cursor, VS Code, GitHub Copilot, Windsurf, Cline, Roo Code or Gemini CLI to ZoBlocks, so your agent uses the real components and props instead of guessing.",
  alternates: { canonical: "/docs/ai" },
};

const TOC = [
  { id: "what", label: "What you get" },
  { id: "quick-start", label: "Quick start" },
  { id: "agents", label: "Your agent" },
  { id: "example", label: "Example" },
  { id: "privacy", label: "Privacy and security" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

const link = "text-ink underline underline-offset-2";
const note = "text-sm leading-relaxed text-graphite";

/** Tab order: the most used first. The CLI's order is by config format. */
const ORDER = [
  "claude",
  "codex",
  "cursor",
  "vscode",
  "copilot",
  "windsurf",
  "cline",
  "roo",
  "gemini",
];
const AGENTS = ORDER.map((id) => CLIENTS.find((c) => c.id === id)).filter((c): c is Client =>
  Boolean(c),
);

/** What goes wrong per agent — found in each agent's own docs, and specific to it. */
const PITFALLS: Record<string, string[]> = {
  claude: [
    "A server in `.mcp.json` needs your approval the first time Claude Code sees it. Accept the prompt, or open `/mcp` and approve zoblocks there.",
  ],
  codex: [
    "Codex ignores a project's `.codex/config.toml` until you trust the project. To add the server for your user instead: `codex mcp add zoblocks --url https://zoblocks.design/mcp`.",
  ],
  cursor: ["Listed but not answering? Make sure zoblocks is switched on in Cursor Settings → MCP."],
  vscode: [
    "VS Code lists servers under `servers`, not `mcpServers` — a block copied from another agent will not load.",
    "Listed but stopped? Open `.vscode/mcp.json` and select Start above zoblocks.",
  ],
  copilot: [
    "Paste the block as it is. The `tools` line gives the agent all seven ZoBlocks tools; the cloud agent uses tools only, which is all ZoBlocks needs.",
  ],
  windsurf: [
    "Windsurf is now Devin Desktop. This config is for its Cascade agent; the newer Devin Local agent reads the Devin CLI's own config instead.",
  ],
  cline: [
    'Keep `"type": "streamableHttp"`. Without it Cline assumes the older SSE transport, and the server never connects.',
  ],
  roo: ['Keep `"type": "streamable-http"` — Roo Code needs it for a server reached by URL.'],
  gemini: [
    "Gemini CLI wants `httpUrl` for this kind of server. A block with `url` from another agent means the older SSE transport.",
  ],
};

/* ------------------------------------------------------------------ */
/* Example                                                            */
/* ------------------------------------------------------------------ */

const PLAIN = `"use client";

import { useState } from "react";
import { Switch } from "@/components/zoblocks/switch";

export default function EncounterSettings() {
  const [precautions, setPrecautions] = useState(false);

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <h1>Encounter settings</h1>
      <Switch
        label="Contact precautions"
        stateLabels="in-effect"
        tone="caution"
        checked={precautions}
        onCommit={async (next) => {
          await savePrecautions(next);
          setPrecautions(next);
        }}
      />
      <button type="submit">Done</button>
    </form>
  );
}

async function savePrecautions(on: boolean) {
  await fetch("/api/precautions", { method: "POST", body: JSON.stringify({ on }) });
}`;

const ANTD = PLAIN.replace(
  'import { Switch } from "@/components/zoblocks/switch";',
  'import { Button } from "antd";\nimport { Switch } from "@/components/zoblocks/switch";',
).replace(
  '      <button type="submit">Done</button>',
  '      <Button type="primary" htmlType="submit">\n        Done\n      </Button>',
);

const MUI = PLAIN.replace(
  'import { Switch } from "@/components/zoblocks/switch";',
  'import Button from "@mui/material/Button";\nimport { Switch } from "@/components/zoblocks/switch";',
).replace(
  '      <button type="submit">Done</button>',
  '      <Button variant="contained" type="submit">\n        Done\n      </Button>',
);

/** The calls an agent makes for the example, in order, with what each returns. */
const CALLS: Array<{ call: string; result: string }> = [
  {
    call: 'search_components("toggle")',
    result: "`switch` — matched on its alias, so ZoBlocks has one.",
  },
  {
    call: 'search_components("button")',
    result:
      "No ZoBlocks component is a button. The agent uses the app's own: a plain `<button>`, antd's or MUI's.",
  },
  {
    call: 'get_component("switch")',
    result: "`Switch`, `SwitchField` and `SwitchList`, with every prop from their types.",
  },
  {
    call: 'get_component_examples("switch")',
    result: "Working usage to start from.",
  },
  {
    call: 'get_installation(["switch"], "next-app")',
    result:
      "`npx @zoblocks/cli init`, `npx @zoblocks/cli add switch --yes`, and the three stylesheet lines for `globals.css`.",
  },
  {
    call: 'get_framework_rules("next-app", "antd")',
    result: "Only if the app uses antd or MUI: the provider and bridge files.",
  },
];

/* ------------------------------------------------------------------ */
/* Pieces                                                             */
/* ------------------------------------------------------------------ */

/** Text with `code` spans, as the pitfalls are written. */
function Inline({ text }: { text: string }) {
  return <>{text.split("`").map((part, i) => (i % 2 ? <C key={i}>{part}</C> : part))}</>;
}

function AgentSetup({ client }: { client: Client }) {
  const snippet = configSnippet(client, "remote");
  const writes = client.kind !== "manual";

  return (
    <div className="space-y-6">
      <DocSteps>
        <DocStep n={1} title="Connect the server">
          <PmCommand commands={[{ dlx: `@zoblocks/cli mcp init --client ${client.id}` }]} />
          <p>
            {writes ? (
              <>
                Writes <C>{snippet.file}</C> in your project. Other servers in it are kept.
              </>
            ) : (
              <>
                {client.label} keeps its servers outside your project, so this prints the entry. Add
                it in {snippet.file}.
              </>
            )}
          </p>
          <p>{writes ? "Or add it yourself:" : "The entry:"}</p>
          <CodeBlock
            title={writes ? snippet.file : `${client.label} MCP settings`}
            language={snippet.language}
            code={snippet.code}
          />
        </DocStep>

        <DocStep n={2} title="Add the skill">
          <PmCommand commands={[{ dlx: "@zoblocks/cli skill add" }]} />
          <p>
            {client.label} reads it from <C>{client.skillDir}/zoblocks</C>. Commit it so everyone on
            the project gets it.
          </p>
        </DocStep>

        <DocStep
          n={3}
          title="Check it works"
          check={
            <>
              your agent calling <C>list_components</C> and answering with ZoBlocks&rsquo;s
              components.
            </>
          }
        >
          <p>{client.next}</p>
          <p>
            Then ask: <span className="text-ink">&ldquo;List the ZoBlocks components.&rdquo;</span>
          </p>
        </DocStep>
      </DocSteps>

      {PITFALLS[client.id]?.length ? (
        <Callout title={`If ${client.label} does not connect`}>
          <ul className="space-y-1.5">
            {PITFALLS[client.id]!.map((item) => (
              <li key={item}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}

      <p className={note}>
        Prefer to run the server on your machine? Add <C>--local</C> to the first command — it uses{" "}
        <C>npx -y @zoblocks/mcp</C> instead (Node.js 20.11+). Everything else:{" "}
        <a href={client.docsUrl} rel="noopener" className={link}>
          {client.label}&rsquo;s MCP documentation
        </a>
        .
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function AiDocsPage() {
  return (
    <RevealRoot>
      <SiteHeader />

      <main id="main">
        <DocsHero
          eyebrow="Docs · MCP Server"
          title="Use ZoBlocks with your AI coding agent."
          lede="Connect your agent to ZoBlocks so it uses the real components and props instead of guessing at them. Two commands, about a minute."
        />

        <DocsShell current="/docs/ai" toc={TOC}>
          {/* --------------------------------------------------- what */}
          <DocSection id="what" title="What you get">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-rule bg-paper p-5">
                <p className="axis-label">The ZoBlocks server</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  Your agent can look things up
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  Which component fits, its props and examples, and the exact install steps for your
                  project. Hosted at <C>zoblocks.design/mcp</C>, or run on your machine.
                </p>
              </div>
              <div className="rounded-2xl border border-rule bg-paper p-5">
                <p className="axis-label">The ZoBlocks skill</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight">
                  Your agent knows how to work
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  A short instruction file it reads when you work on UI: search before building, use
                  only real props, install with the CLI, follow the clinical rules.
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-graphite">
              Without them, an agent writes ZoBlocks code from memory — and invents a ZoBlocks
              Button, which does not exist. The server uses MCP, the standard way coding agents
              connect to tools; nothing more about it is needed here.
            </p>
          </DocSection>

          {/* -------------------------------------------- quick start */}
          <DocSection
            id="quick-start"
            title="Quick start"
            intro={
              <p>
                In your project, connect your agent and add the skill. Replace <C>claude</C> with
                your agent: <C>codex</C>, <C>cursor</C>, <C>vscode</C>, <C>copilot</C>,{" "}
                <C>windsurf</C>, <C>cline</C>, <C>roo</C> or <C>gemini</C>.
              </p>
            }
          >
            <PmCommand
              commands={[
                { dlx: "@zoblocks/cli mcp init --client claude" },
                { dlx: "@zoblocks/cli skill add" },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed text-graphite">
              Restart your agent and ask it to{" "}
              <span className="text-ink">
                &ldquo;add a settings page with a ZoBlocks Switch&rdquo;
              </span>
              . Each agent&rsquo;s exact steps are below.
            </p>
          </DocSection>

          {/* ------------------------------------------------- agents */}
          <DocSection id="agents" title="Your agent">
            <DocTabs
              hash
              label="Coding agent"
              tabs={AGENTS.map((client) => ({
                id: client.id,
                label: client.label.replace(/ \(.*\)$/, ""),
                content: <AgentSetup client={client} />,
              }))}
            />
          </DocSection>

          {/* ------------------------------------------------ example */}
          <DocSection
            id="example"
            title="Example: a settings page with a Switch"
            intro={
              <p>
                You ask:{" "}
                <span className="text-ink">
                  &ldquo;Add an encounter settings page with a ZoBlocks Switch for contact
                  precautions and a Done button.&rdquo;
                </span>{" "}
                With the server and the skill, your agent works through these calls before writing
                code:
              </p>
            }
          >
            <DocSteps>
              {CALLS.map((step, i) => (
                <DocStep key={step.call} n={i + 1} title={step.call}>
                  <p>
                    <Inline text={step.result} />
                  </p>
                </DocStep>
              ))}
            </DocSteps>
            <p className="mb-4 text-sm leading-relaxed text-graphite">
              The page it writes uses the app&rsquo;s own Button and the ZoBlocks Switch, with only
              the props <C>get_component</C> returned:
            </p>
            <DocTabs
              label="UI style"
              tabs={[
                {
                  id: "zoblocks",
                  label: "ZoBlocks",
                  content: (
                    <CodeBlock title="src/app/settings/page.tsx" language="tsx" code={PLAIN} />
                  ),
                },
                {
                  id: "antd",
                  label: "Ant Design",
                  content: (
                    <CodeBlock title="src/app/settings/page.tsx" language="tsx" code={ANTD} />
                  ),
                },
                {
                  id: "mui",
                  label: "Material UI",
                  content: (
                    <CodeBlock title="src/app/settings/page.tsx" language="tsx" code={MUI} />
                  ),
                },
              ]}
            />
            <p className="mt-4 text-sm leading-relaxed text-graphite">
              With Ant Design or Material UI, the app is also wrapped in that library&rsquo;s
              provider and the ZoBlocks bridge, so the Switch takes the app&rsquo;s theme — see{" "}
              <Link href="/docs#styles" className={link}>
                Choose a style
              </Link>
              .
            </p>
          </DocSection>

          {/* ------------------------------------------------ privacy */}
          <DocSection id="privacy" title="Privacy and security">
            <ul className="max-w-2xl space-y-3 text-sm leading-relaxed text-graphite">
              <li>
                <span className="font-medium text-ink">Read-only.</span> The server answers
                questions about ZoBlocks. It cannot change anything, anywhere.
              </li>
              <li>
                <span className="font-medium text-ink">Your code stays with you.</span> The server
                reads nothing on your machine. The hosted one receives only what your agent asks it
                — a component name, a search term — never your files.
              </li>
              <li>
                <span className="font-medium text-ink">No telemetry.</span> Neither the server nor
                the skill reports usage.
              </li>
              <li>
                <span className="font-medium text-ink">The skill ships in the CLI.</span>{" "}
                <C>skill add</C> writes the copy inside the CLI package — nothing is downloaded —
                and writes only to the two skill folders, never through a link out of your project.
              </li>
              <li>
                <span className="font-medium text-ink">Your choice of where it runs.</span>{" "}
                <C>--local</C> runs it on your machine; <C>--registry &lt;url&gt;</C> on the local
                server reads the catalog from your own mirror.
              </li>
            </ul>
          </DocSection>

          {/* ---------------------------------------- troubleshooting */}
          <DocSection id="troubleshooting" title="Troubleshooting">
            <dl className="max-w-3xl">
              {[
                {
                  q: "My agent still invents components or props.",
                  a: "Check both parts are in place: the server shows as connected in your agent, and the skill folder exists. Then ask it to “use the ZoBlocks MCP server”.",
                },
                {
                  q: "The server is not listed after mcp init.",
                  a: "Restart your agent — most read their MCP config only at start. Then follow the check in your agent's tab above.",
                },
                {
                  q: "mcp init says the config already has a zoblocks entry with different settings.",
                  a: "It will not replace an entry you may have set up on purpose. Run it again with --force to replace it.",
                },
                {
                  q: "My network blocks zoblocks.design.",
                  a: `Use --local, and point the local server at your mirror with --registry <url>. The hosted address is ${REMOTE_URL}.`,
                },
              ].map((item) => (
                <div key={item.q} className="border-t border-rule py-4 last:border-b">
                  <dt className="text-sm font-medium text-ink">{item.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-graphite">{item.a}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-sm leading-relaxed text-graphite">
              Setting ZoBlocks up by hand instead?{" "}
              <Link href="/docs" className={link}>
                Install and use ZoBlocks
              </Link>
              .
            </p>
          </DocSection>
        </DocsShell>
      </main>

      <SiteFooter />
    </RevealRoot>
  );
}

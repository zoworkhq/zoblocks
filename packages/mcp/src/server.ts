/**
 * One server definition, served two ways — over stdio by the `zoblocks-mcp`
 * binary and over HTTP at zoblocks.design/mcp — so the two cannot drift.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/server";
import type { Manifest, ManifestComponent } from "./manifest.js";
import { tableCell } from "./markdown.js";
import { registerTools } from "./tools.js";

/**
 * Sent to the client on connect. Codex treats it as server-wide guidance and
 * weighs the first 512 characters, so everything that prevents a wrong
 * answer is in them: search before building, read the real props, install
 * with the CLI, and never invent what is not in the catalog.
 */
export const INSTRUCTIONS =
  "ZoBlocks is a read-only catalog of healthcare React components. Before building UI, call search_components; if ZoBlocks has it, use it rather than recreating it. Call get_component for the real props — never invent props or components (there is no ZoBlocks Button, Input or Modal; use the app's own UI library). Install with the commands get_installation returns. Follow get_framework_rules for setup and get_conventions for the rules.";

export interface ServerOptions {
  manifest: Manifest;
  /** The package version, reported to the client on connect. */
  version: string;
}

function componentMarkdown(c: ManifestComponent): string {
  const props = c.exports
    .map((e) =>
      [
        `### ${e.name}`,
        "",
        "| Prop | Type | Required | Default |",
        "| --- | --- | --- | --- |",
        ...e.props.map(
          (p) =>
            `| ${tableCell(p.name)} | \`${tableCell(p.type)}\` | ${p.required ? "yes" : ""} | ${tableCell(p.default ?? "")} |`,
        ),
      ].join("\n"),
    )
    .join("\n\n");

  return [
    `# ${c.title} (\`${c.name}\`)`,
    "",
    c.summary,
    "",
    `Import from \`${c.importFrom}\`. ${c.availability === "announced" ? "Announced — nothing to install yet." : `Install: \`${c.install}\``}`,
    "",
    "## Usage",
    "",
    "```tsx",
    c.usage,
    "```",
    "",
    "## Props",
    "",
    props,
  ].join("\n");
}

export function createServer({ manifest, version }: ServerOptions): McpServer {
  const server = new McpServer(
    { name: "zoblocks", title: "ZoBlocks", version },
    { instructions: INSTRUCTIONS },
  );

  registerTools(server, manifest);

  /*
   * Resources, for the clients that read them. They say nothing the tools do
   * not — a tools-only client loses nothing — but an editor that lets a
   * developer attach a component's page to a chat can offer it here.
   */
  server.registerResource(
    "component",
    new ResourceTemplate("zoblocks://component/{name}", {
      list: async () => ({
        resources: manifest.components.map((c) => ({
          uri: `zoblocks://component/${c.name}`,
          name: c.title,
          description: c.summary,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "ZoBlocks component", mimeType: "text/markdown" },
    async (uri, variables) => {
      const name = String(variables.name ?? "");
      const component = manifest.components.find((c) => c.name === name);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: component ? componentMarkdown(component) : `No ZoBlocks component "${name}".`,
          },
        ],
      };
    },
  );

  server.registerResource(
    "conventions",
    "zoblocks://conventions",
    { title: "ZoBlocks conventions", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: [
            "# ZoBlocks conventions",
            "",
            manifest.scopeNote,
            "",
            ...[...manifest.rules, manifest.integration.clinicalColoursNote].map((r) => `- ${r}`),
          ].join("\n"),
        },
      ],
    }),
  );

  return server;
}

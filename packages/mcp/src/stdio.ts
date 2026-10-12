/**
 * The local face: `npx -y @zoblocks/mcp`, spoken to over stdin and stdout.
 *
 * stdout carries the protocol and nothing else — a stray line there corrupts
 * the stream — so everything meant for a person goes to stderr.
 */

import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { parseArgs } from "node:util";
import { DEFAULT_REGISTRY, loadManifest, type LoadOptions } from "./manifest.js";
import { createServer } from "./server.js";

const HELP = `zoblocks-mcp — the ZoBlocks catalog for coding agents, over MCP (stdio)

Usage
  npx -y @zoblocks/mcp [options]

Options
  --registry <url>   Read the catalog from a mirror instead of ${DEFAULT_REGISTRY}
  --offline          Use the catalog bundled with this version; no network
  --version          Print the version
  --help             Print this

Read-only: it answers questions about ZoBlocks and reads nothing on this machine.
Connect it from your agent — see ${DEFAULT_REGISTRY}/docs/ai
`;

export interface StdioOptions {
  argv: string[];
  version: string;
  err: (line: string) => void;
  out: (line: string) => void;
  /** For tests: resolve the manifest without the network. */
  load?: LoadOptions;
}

/** Returns an exit code for `--help`/`--version`/bad flags; otherwise serves until stdin closes. */
export async function runStdio(options: StdioOptions): Promise<number | undefined> {
  let values;
  try {
    ({ values } = parseArgs({
      args: options.argv,
      strict: true,
      options: {
        registry: { type: "string" },
        offline: { type: "boolean", default: false },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    }));
  } catch (error) {
    options.err((error as Error).message);
    options.err(HELP);
    return 2;
  }

  if (values.help) {
    options.out(HELP);
    return 0;
  }
  if (values.version) {
    options.out(options.version);
    return 0;
  }

  const { manifest, source, from } = await loadManifest({
    ...options.load,
    ...(values.registry ? { registry: values.registry } : {}),
    offline: values.offline,
    log: options.err,
  });
  options.err(
    `zoblocks-mcp ${options.version}: ${manifest.components.length} components from the ${source === "live" ? from : "bundled catalog"} (${manifest.contentHash}).`,
  );

  await createServer({ manifest, version: options.version }).connect(new StdioServerTransport());
  return undefined;
}

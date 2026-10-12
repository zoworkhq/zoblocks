/**
 * https://zoblocks.design/mcp — the remote ZoBlocks MCP endpoint (ADR 0017).
 *
 * The same read-only server `npx -y @zoblocks/mcp` runs locally, served over
 * Streamable HTTP. Stateless: every request is answered by a fresh server, so
 * a serverless function holds nothing between them.
 *
 * The catalog is the manifest `pnpm gen` wrote for this build, imported
 * rather than fetched: the endpoint then describes exactly the components
 * this deployment serves from `/r`, with no network hop and no file lookup
 * that a function bundle could leave behind.
 *
 * `createHttpHandler` validates Host and Origin before the SDK sees the
 * request. Vercel's preview and branch URLs are added to the allowed hosts
 * so a preview answers as itself.
 */

import { createHttpHandler, parseManifest } from "@zoblocks/mcp";
import pkg from "@zoblocks/mcp/package.json";
import manifestJson from "../../../public/ai/manifest.json";

const manifest = parseManifest(manifestJson);

const handle = createHttpHandler({
  manifest,
  version: pkg.version,
  hostnames: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(
    (host): host is string => Boolean(host),
  ),
});

export const POST = handle;
export const GET = handle;
export const DELETE = handle;

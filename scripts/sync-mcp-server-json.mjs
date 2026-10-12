/**
 * Keeps packages/mcp/server.json at the version changesets just gave
 * @zoblocks/mcp.
 *
 * The MCP Registry listing names an exact npm version, and `changeset
 * version` edits package.json and nothing else. Run straight after it — the
 * root `version-packages` script does, and so does the Version PR in ci.yml —
 * so the bump and the listing land in the same commit. test/mcp-registry.test.ts
 * fails if they ever disagree.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "packages", "mcp");
const { version } = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
const file = path.join(dir, "server.json");
const server = JSON.parse(readFileSync(file, "utf8"));

server.version = version;
for (const pkg of server.packages ?? []) {
  if (pkg.identifier === "@zoblocks/mcp") pkg.version = version;
}
writeFileSync(file, `${JSON.stringify(server, null, 2)}\n`);
console.log(`server.json → ${version}`);

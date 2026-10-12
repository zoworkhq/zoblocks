/**
 * The MCP Registry listing (packages/mcp/server.json) agrees with the package
 * it lists and with the endpoint the CLI configures.
 *
 * The registry verifies an npm package by reading `mcpName` from the
 * published tarball and comparing it with the listing's name, and it rejects
 * a description over 100 characters — both found at `mcp-publisher publish`,
 * after the npm release has already gone out. Cheaper to find here.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { REMOTE_URL } from "../packages/cli/src/agents";

const MCP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../packages/mcp");
const read = (file: string) => JSON.parse(readFileSync(path.join(MCP, file), "utf8"));
const pkg = read("package.json");
const server = read("server.json");

describe("MCP Registry listing", () => {
  it("is the package's own listing", () => {
    expect(server.name).toBe(pkg.mcpName);
    expect(server.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
    // A domain namespace, proven against zoblocks.design — not the GitHub org,
    // whose repository name does not match the manifests yet (DEPLOYMENT.md).
    expect(server.name.startsWith("design.zoblocks/")).toBe(true);
  });

  it("lists the version changesets gave the package", () => {
    expect(server.version).toBe(pkg.version);
    expect(server.packages).toEqual([
      expect.objectContaining({
        registryType: "npm",
        identifier: pkg.name,
        version: pkg.version,
        transport: { type: "stdio" },
      }),
    ]);
  });

  it("points at the endpoint the CLI configures", () => {
    expect(server.remotes).toEqual([{ type: "streamable-http", url: REMOTE_URL }]);
  });

  it("fits the registry's limits", () => {
    expect(server.description.length).toBeLessThanOrEqual(100);
    expect(server.title.length).toBeLessThanOrEqual(100);
    expect(server.repository.url).toBe(
      pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""),
    );
  });
});

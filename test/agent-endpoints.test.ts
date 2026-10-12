/**
 * The post-deploy and pre-publish endpoint check, run against the real
 * handler and the generated files instead of the network — and against
 * deployments broken in the ways it exists to catch.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createHttpHandler, parseManifest } from "../packages/mcp/src/index";
import {
  checkEndpoints,
  registryComponents,
  rpcResult,
  supportedSchemaVersion,
} from "../scripts/check-agent-endpoints.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFile = (name: string) =>
  readFileSync(path.join(ROOT, "apps/docs/public/ai", name), "utf8");
const manifestText = publicFile("manifest.json");
const skillText = publicFile("skill.json");

interface Site {
  manifest?: string;
  skill?: string;
  handler?: (request: Request) => Promise<Response>;
}

/** A deployment, as a fetch: the static files plus the /mcp route. */
function site({
  manifest = manifestText,
  skill = skillText,
  handler = createHttpHandler({ manifest: parseManifest(JSON.parse(manifest)), version: "0.0.0" }),
}: Site = {}) {
  return async (input: URL | string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.pathname === "/ai/manifest.json") return new Response(manifest);
    if (url.pathname === "/ai/skill.json") return new Response(skill);
    if (url.pathname === "/mcp") return handler(new Request(url, init));
    return new Response("not found", { status: 404 });
  };
}

const run = (fetchImpl: ReturnType<typeof site>) =>
  checkEndpoints({ base: "https://zoblocks.design", fetchImpl });
const failed = async (fetchImpl: ReturnType<typeof site>) =>
  (await run(fetchImpl)).filter((f) => !f.ok).map((f) => `${f.name}: ${f.detail}`);

describe("check-agent-endpoints", () => {
  it("passes a correct deployment", async () => {
    const findings = await run(site());
    expect(findings.filter((f) => !f.ok)).toEqual([]);
    expect(findings.map((f) => f.name)).toEqual([
      "manifest",
      "skill",
      "mcp handshake",
      "mcp tools",
      "mcp answers",
      "mcp rejects foreign origins",
    ]);
  });

  it("reads what it compares against from the checkout", () => {
    expect(supportedSchemaVersion()).toBe(1);
    expect(registryComponents()).toContain("switch");
  });

  it("fails a manifest in a schema this server cannot read", async () => {
    const newer = JSON.stringify({ ...JSON.parse(manifestText), schemaVersion: 2 });
    // The route keeps the manifest it was built with; only the served file is newer.
    const handler = createHttpHandler({
      manifest: parseManifest(JSON.parse(manifestText)),
      version: "0.0.0",
    });
    expect(await failed(site({ manifest: newer, handler }))).toEqual([
      "manifest: serves schema 2; this checkout's @zoblocks/mcp reads 1",
    ]);
  });

  it("fails a stale manifest that is missing a component the registry ships", async () => {
    const parsed = JSON.parse(manifestText);
    const stale = JSON.stringify({
      ...parsed,
      components: parsed.components.filter((c: { name: string }) => c.name !== "switch"),
    });
    const problems = await failed(site({ manifest: stale }));
    expect(problems).toContain("manifest: does not list switch");
  });

  it("fails a skill bundle the CLI would refuse", async () => {
    const bundle = JSON.parse(skillText);
    bundle.files.push({ path: "../../.bashrc", content: "x" });
    expect(await failed(site({ skill: JSON.stringify(bundle) }))).toEqual([
      "skill: names files the CLI will refuse: ../../.bashrc",
    ]);
  });

  it("fails an endpoint that is down, and one that answers any origin", async () => {
    const down = await failed(site({ handler: async () => new Response("", { status: 500 }) }));
    expect(down).toEqual([
      "mcp handshake: 500 from /mcp",
      "mcp tools: 500 from /mcp",
      "mcp answers: 500 from /mcp",
      "mcp rejects foreign origins: answered 500, not 403",
    ]);

    const real = createHttpHandler({
      manifest: parseManifest(JSON.parse(manifestText)),
      version: "0.0.0",
    });
    const open = async (request: Request) => {
      const headers = new Headers(request.headers);
      headers.delete("origin");
      return real(
        new Request(request.url, { method: request.method, headers, body: await request.text() }),
      );
    };
    expect(await failed(site({ handler: open }))).toEqual([
      "mcp rejects foreign origins: answered 200, not 403",
    ]);
  });

  it("reads a JSON-RPC result from JSON or from an SSE message", () => {
    expect(rpcResult('{"jsonrpc":"2.0","id":1,"result":{"a":1}}')).toEqual({ a: 1 });
    expect(
      rpcResult('event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"a":2}}\n\n'),
    ).toEqual({
      a: 2,
    });
    expect(() => rpcResult('{"jsonrpc":"2.0","id":1,"error":{"code":-1,"message":"no"}}')).toThrow(
      "JSON-RPC error -1: no",
    );
  });
});

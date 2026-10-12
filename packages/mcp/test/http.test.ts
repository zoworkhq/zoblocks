/**
 * The remote endpoint's HTTP face: it answers MCP as itself, and only as
 * itself.
 *
 * The SDK's handler performs no Host or Origin validation by design; these
 * tests are what prove `createHttpHandler` put it in front (ADR 0017).
 */

import { describe, expect, it } from "vitest";
import { createHttpHandler } from "../src/http.js";
import { readSnapshot } from "../src/manifest.js";

const manifest = readSnapshot();
const handle = createHttpHandler({
  manifest,
  version: "0.0.0-test",
  hostnames: ["zoblocks-git-feat.vercel.app"],
});

const INITIALIZE = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  },
};

function post(
  body: unknown,
  headers: Record<string, string> = {},
  url = "https://zoblocks.design/mcp",
) {
  return handle(
    new Request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

describe("the HTTP endpoint", () => {
  it("serves an agent, which sends no Origin", async () => {
    const response = await post(INITIALIZE);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('"name":"zoblocks"');
  });

  it("answers a tool call statelessly, with no session from an earlier request", async () => {
    const response = await post({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "get_component", arguments: { name: "switch", sections: ["props"] } },
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("switch");
  });

  it("refuses a request addressed to another host", async () => {
    const response = await post(INITIALIZE, {}, "https://attacker.example.org/mcp");
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("refuses a cross-origin browser request", async () => {
    const response = await post(INITIALIZE, { origin: "https://attacker.example.org" });
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it("accepts its own origin", async () => {
    const response = await post(INITIALIZE, { origin: "https://zoblocks.design" });
    expect(response.status).toBe(200);
  });

  it("answers as a named preview deployment", async () => {
    const response = await post(INITIALIZE, {}, "https://zoblocks-git-feat.vercel.app/mcp");
    expect(response.status).toBe(200);
  });

  it("checks the Host header when the server passes one, as Next.js does", async () => {
    expect((await post(INITIALIZE, { host: "zoblocks.design" })).status).toBe(200);
    expect((await post(INITIALIZE, { host: "attacker.example.org" })).status).toBe(403);
  });

  it("serves locally for development", async () => {
    const response = await post(INITIALIZE, {}, "http://localhost:6001/mcp");
    expect(response.status).toBe(200);
  });
});

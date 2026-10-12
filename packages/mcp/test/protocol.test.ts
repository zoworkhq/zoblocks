/**
 * The server as a client sees it: over a real MCP connection, in memory.
 *
 * `tools.test.ts` checks the answers; this checks what an agent actually
 * receives — the tool list and its annotations, the instructions on connect,
 * errors as tool errors rather than protocol failures, and the resources.
 */

import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readSnapshot } from "../src/manifest.js";
import { INSTRUCTIONS, createServer } from "../src/server.js";

const manifest = readSnapshot();
let client: Client;

beforeEach(async () => {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer({ manifest, version: "0.0.0-test" }).connect(serverSide);
  client = new Client({ name: "test", version: "1" });
  await client.connect(clientSide);
});

afterEach(async () => {
  await client.close();
});

const text = (result: Awaited<ReturnType<Client["callTool"]>>) =>
  (result.content as Array<{ type: string; text: string }>)[0]!.text;

describe("over MCP", () => {
  it("sends the instructions, and keeps them inside Codex's 512 characters", () => {
    expect(client.getInstructions()).toBe(INSTRUCTIONS);
    expect(INSTRUCTIONS.length).toBeLessThanOrEqual(512);
    expect(client.getServerVersion()).toMatchObject({ name: "zoblocks", version: "0.0.0-test" });
  });

  it("offers exactly the seven tools, every one read-only", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "get_component",
      "get_component_examples",
      "get_conventions",
      "get_framework_rules",
      "get_installation",
      "list_components",
      "search_components",
    ]);
    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
      expect(tool.annotations?.destructiveHint, tool.name).toBe(false);
      expect(tool.description?.length, tool.name).toBeGreaterThan(40);
    }
  });

  it("answers a tool call with JSON", async () => {
    const result = await client.callTool({
      name: "search_components",
      arguments: { query: "toggle" },
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(text(result)).results[0].name).toBe("switch");
  });

  it("reports an unknown component as a tool error an agent can read", async () => {
    const result = await client.callTool({ name: "get_component", arguments: { name: "swtich" } });
    expect(result.isError).toBe(true);
    expect(text(result)).toMatch(/Did you mean: switch/);
  });

  it("rejects input outside the schema", async () => {
    const result = await client.callTool({
      name: "get_installation",
      arguments: { components: ["switch"], framework: "remix" },
    });
    expect(result.isError).toBe(true);
  });

  it("lists a resource per component and reads one as markdown", async () => {
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain("zoblocks://component/switch");

    const read = await client.readResource({ uri: "zoblocks://component/switch" });
    const content = read.contents[0] as { text: string; mimeType: string };
    expect(content.mimeType).toBe("text/markdown");
    expect(content.text).toMatch(/^# Switch \(`switch`\)/);
    expect(content.text).toContain("| Prop | Type |");
  });

  it("reads the conventions resource", async () => {
    const read = await client.readResource({ uri: "zoblocks://conventions" });
    expect((read.contents[0] as { text: string }).text).toContain(manifest.rules[0]);
  });
});

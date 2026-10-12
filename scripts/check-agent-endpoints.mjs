/**
 * Asserts the live endpoints coding agents depend on (ADR 0017).
 *
 *   node scripts/check-agent-endpoints.mjs                          # https://zoblocks.design
 *   node scripts/check-agent-endpoints.mjs --base https://<preview>
 *
 * What coding agents read from the site, none of which npm can see:
 *
 *   /ai/manifest.json   what `@zoblocks/mcp` fetches on start
 *   /mcp                what `zoblocks mcp init` writes into an agent's config
 *   /ai/skill.json      the skill as one document, for anything that wants it
 *                       whole. `zoblocks skill add` does not: it writes the
 *                       copy bundled in the CLI, so nothing it writes comes
 *                       from the network.
 *
 * So it runs twice. After the docs deploy (`ci.yml`), so a deploy that serves
 * a stale catalog or a broken endpoint fails where it happened. And before a
 * publish (`publish.yml`), so a CLI whose commands point at those URLs cannot
 * ship ahead of the site that serves them — the release order DEPLOYMENT.md
 * describes, enforced rather than remembered.
 *
 * Plain Node and no dependencies, on purpose: the deploy job installs nothing.
 * It speaks raw JSON-RPC to /mcp instead of loading the SDK's client, and it
 * reads what it compares against (the schema version this checkout's server
 * reads, the components this checkout's registry ships) from the checkout.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The seven tools ADR 0017 names. A deploy serving fewer is a regression. */
export const EXPECTED_TOOLS = [
  "get_component",
  "get_component_examples",
  "get_conventions",
  "get_framework_rules",
  "get_installation",
  "list_components",
  "search_components",
];

/** The same rule the CLI applies before writing a skill file (`agent-commands.ts`). */
const SKILL_FILE = /^(SKILL\.md|references\/[a-z0-9-]+\.md)$/;

/** What this checkout's server reads. Parsed from source: the deploy job has no build. */
export function supportedSchemaVersion() {
  const source = readFileSync(path.join(root, "packages/mcp/src/manifest.ts"), "utf8");
  const match = /export const SUPPORTED_SCHEMA_VERSION = (\d+);/.exec(source);
  if (!match) throw new Error("SUPPORTED_SCHEMA_VERSION not found in packages/mcp/src/manifest.ts");
  return Number(match[1]);
}

/** The components this checkout's registry ships, which the deployed catalog must list. */
export function registryComponents() {
  const registry = JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8"));
  return registry.items.filter((i) => i.type === "zoblocks:component").map((i) => i.name);
}

/** A JSON-RPC response from /mcp, which may come back as JSON or as one SSE message. */
export function rpcResult(text) {
  const data = text.trimStart().startsWith("{")
    ? text
    : text
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");
  const message = JSON.parse(data);
  if (message.error)
    throw new Error(`JSON-RPC error ${message.error.code}: ${message.error.message}`);
  return message.result;
}

/**
 * Every check, in order, against `base`. Returns findings rather than
 * throwing, so one run reports everything that is wrong.
 */
export async function checkEndpoints({
  base,
  fetchImpl = fetch,
  schemaVersion = supportedSchemaVersion(),
  components = registryComponents(),
}) {
  const findings = [];
  const check = async (name, run) => {
    try {
      findings.push({ name, ok: true, detail: await run() });
    } catch (error) {
      findings.push({ name, ok: false, detail: error.message });
    }
  };
  const get = async (pathname) => {
    const response = await fetchImpl(new URL(pathname, base), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`${response.status} from ${pathname}`);
    return response;
  };

  await check("manifest", async () => {
    const response = await get("/ai/manifest.json");
    const manifest = await response.json();
    if (manifest.schemaVersion !== schemaVersion) {
      throw new Error(
        `serves schema ${manifest.schemaVersion}; this checkout's @zoblocks/mcp reads ${schemaVersion}`,
      );
    }
    const served = new Set((manifest.components ?? []).map((c) => c.name));
    const missing = components.filter((name) => !served.has(name));
    if (missing.length) throw new Error(`does not list ${missing.join(", ")}`);
    return `schema ${manifest.schemaVersion}, ${served.size} components (${manifest.contentHash}), cache-control: ${response.headers.get("cache-control") ?? "none"}`;
  });

  await check("skill", async () => {
    const bundle = await (await get("/ai/skill.json")).json();
    if (bundle?.schemaVersion !== 1 || !Array.isArray(bundle.files)) {
      throw new Error("is not a skill bundle the CLI reads (schemaVersion 1, files[])");
    }
    const unsafe = bundle.files.filter(
      (f) => !SKILL_FILE.test(f?.path ?? "") || typeof f.content !== "string",
    );
    if (unsafe.length)
      throw new Error(`names files the CLI will refuse: ${unsafe.map((f) => f?.path).join(", ")}`);
    const skill = bundle.files.find((f) => f.path === "SKILL.md");
    if (!skill) throw new Error("has no SKILL.md");
    if (!/^---\n[\s\S]*?^name: zoblocks$/m.test(skill.content))
      throw new Error("SKILL.md is not named zoblocks");
    return `${bundle.files.length} files`;
  });

  const rpc = async (id, method, params, headers = {}) => {
    const response = await fetchImpl(new URL("/mcp", base), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
        ...headers,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }),
      signal: AbortSignal.timeout(20_000),
    });
    return response;
  };

  await check("mcp handshake", async () => {
    const response = await rpc(1, "initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "check-agent-endpoints", version: "1" },
    });
    if (!response.ok) throw new Error(`${response.status} from /mcp`);
    const { serverInfo } = rpcResult(await response.text());
    if (serverInfo?.name !== "zoblocks") throw new Error(`answered as ${serverInfo?.name}`);
    return `zoblocks ${serverInfo.version}`;
  });

  await check("mcp tools", async () => {
    const response = await rpc(2, "tools/list");
    if (!response.ok) throw new Error(`${response.status} from /mcp`);
    const { tools } = rpcResult(await response.text());
    const names = tools.map((t) => t.name).sort();
    const missing = EXPECTED_TOOLS.filter((t) => !names.includes(t));
    if (missing.length) throw new Error(`missing ${missing.join(", ")}`);
    const writable = tools.filter((t) => t.annotations?.readOnlyHint !== true).map((t) => t.name);
    if (writable.length) throw new Error(`not marked read-only: ${writable.join(", ")}`);
    return `${names.length} tools, all read-only`;
  });

  await check("mcp answers", async () => {
    const response = await rpc(3, "tools/call", {
      name: "search_components",
      arguments: { query: "toggle" },
    });
    if (!response.ok) throw new Error(`${response.status} from /mcp`);
    const result = rpcResult(await response.text());
    const text = result.content?.find((c) => c.type === "text")?.text ?? "";
    if (!text.includes('"name": "switch"'))
      throw new Error('search for "toggle" did not find switch');
    return 'search "toggle" finds switch';
  });

  await check("mcp rejects foreign origins", async () => {
    const response = await rpc(
      4,
      "initialize",
      {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "check-agent-endpoints", version: "1" },
      },
      { origin: "https://attacker.example" },
    );
    if (response.status !== 403) throw new Error(`answered ${response.status}, not 403`);
    return "403";
  });

  return findings;
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--base");
  const base = at === -1 ? "https://zoblocks.design" : args[at + 1];
  if (!base) throw new Error("--base needs a URL");

  const findings = await checkEndpoints({ base });
  console.log(`Agent endpoints at ${base}`);
  for (const f of findings) console.log(`  ${f.ok ? "ok  " : "FAIL"} ${f.name} — ${f.detail}`);
  const failed = findings.filter((f) => !f.ok);
  if (failed.length) {
    for (const f of failed) console.log(`::error::${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

/**
 * Runs real coding agents on real prompts and grades what they leave behind
 * (ADR 0017's evaluation suite).
 *
 *   pnpm ai-evals                         every case, with the server and skill
 *   pnpm ai-evals --case switch-settings  one case
 *   pnpm ai-evals --baseline              the same cases with neither, to compare
 *   pnpm ai-evals --keep                  keep each run's app for inspection
 *   pnpm ai-evals --grade <app> --case id grade an existing app, no agent
 *
 * Run it from a normal terminal: Claude Code will not start inside another
 * Claude Code session.
 *
 * For each case: copy a cached Next.js app, seed its files, connect the agent
 * to the local ZoBlocks MCP server (the package's own build, `--offline`, so
 * it serves exactly the catalog in this checkout) and copy the skill in; run
 * the agent headless; then grade by script — the app typechecks, every import
 * and prop is real, every installed stylesheet is imported, the expected
 * components are used, and the agent looked before it wrote.
 *
 * Costs real model usage and takes minutes per case, so it is run by hand,
 * not in CI. Results land in .ai-evals/ (gitignored).
 *
 * Claude Code is the agent today — the one installed where this was built.
 * Another agent is a new `runAgent` branch: its headless command and how to
 * read its tool calls.
 */

import { execFile, spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseArgs, promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { CASES, type EvalCase } from "./cases";
import {
  checkImports,
  checkProcess,
  checkProps,
  checkStylesheets,
  checkUses,
  toolCalls,
  type Finding,
  type ManifestLike,
  type SourceFile,
} from "./grade";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORK = path.join(ROOT, ".ai-evals");
const MANIFEST = path.join(ROOT, "apps/docs/public/ai/manifest.json");
const SERVER_BIN = path.join(ROOT, "packages/mcp/bin/zoblocks-mcp.mjs");

/** What the agent may do without asking. Narrow on purpose: no git, no network tools beyond these. */
const ALLOWED_TOOLS = [
  "mcp__zoblocks",
  "Read",
  "Write",
  "Edit",
  "MultiEdit",
  "Glob",
  "Grep",
  "Bash(npx @zoblocks/cli:*)",
  "Bash(npx tsc:*)",
  "Bash(npm install:*)",
  "Bash(ls:*)",
  "Bash(cat:*)",
].join(" ");

/* ------------------------------------------------------------------ */
/* Fixtures                                                           */
/* ------------------------------------------------------------------ */

async function sh(cmd: string, args: string[], cwd: string, timeout = 600_000) {
  return run(cmd, args, { cwd, timeout, maxBuffer: 64 * 1024 * 1024 });
}

/** A Next.js app created once and copied per run — create-next-app takes a minute. */
async function template(fixture: EvalCase["fixture"]): Promise<string> {
  const base = path.join(WORK, "templates", "next-app");
  if (!existsSync(path.join(base, "node_modules"))) {
    mkdirSync(path.dirname(base), { recursive: true });
    console.log("  creating the Next.js template (once)…");
    await sh(
      "npx",
      [
        "--yes",
        "create-next-app@latest",
        "next-app",
        "--ts",
        "--tailwind",
        "--eslint",
        "--app",
        "--src-dir",
        "--import-alias",
        "@/*",
        "--use-npm",
        "--yes",
      ],
      path.dirname(base),
    );
  }
  if (fixture === "next-app") return base;

  const antd = path.join(WORK, "templates", "next-app-antd");
  if (!existsSync(path.join(antd, "node_modules", "antd"))) {
    console.log("  creating the Ant Design template (once)…");
    copy(base, antd);
    await sh("npm", ["install", "antd", "@ant-design/nextjs-registry"], antd);
  }
  return antd;
}

function copy(from: string, to: string) {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true, verbatimSymlinks: true });
}

/* ------------------------------------------------------------------ */
/* The agent                                                          */
/* ------------------------------------------------------------------ */

async function runAgent(app: string, prompt: string, mcpConfig: string): Promise<string> {
  const args = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--strict-mcp-config",
    "--mcp-config",
    mcpConfig,
    // Project settings only: the evaluator's personal plugins, hooks and
    // servers must not help or hinder the agent being measured.
    "--setting-sources",
    "project",
    "--permission-mode",
    "acceptEdits",
    "--allowedTools",
    ALLOWED_TOOLS,
    "--no-session-persistence",
  ];

  return new Promise((resolve, reject) => {
    const child = spawn("claude", args, { cwd: app, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), 20 * 60_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", reject);
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !out) reject(new Error(`claude exited ${code}: ${err.slice(0, 500)}`));
      else resolve(out);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Grading                                                            */
/* ------------------------------------------------------------------ */

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

async function grade(
  app: string,
  testCase: EvalCase,
  transcript: string,
  manifest: ManifestLike,
): Promise<Finding[]> {
  const src = path.join(app, "src");
  const files: SourceFile[] = walk(src)
    .filter((f) => /\.tsx?$/.test(f) && !/[\\/](components[\\/]zoblocks|lib)[\\/]/.test(f))
    .map((f) => ({ path: path.relative(app, f), source: readFileSync(f, "utf8") }));

  const installed = new Set(
    walk(path.join(src, "components", "zoblocks")).map((f) =>
      path.basename(f).replace(/\.tsx?$/, ""),
    ),
  );
  const sheets = walk(path.join(src, "styles"))
    .map((f) => path.basename(f))
    .filter((f) => /^zoblocks-.*\.css$/.test(f));
  // Where each framework keeps it, as get_framework_rules names it: Next.js
  // App Router, then Pages Router, then Vite. `--grade` takes any of them.
  const globalCssPath = [
    path.join(src, "app", "globals.css"),
    path.join(src, "styles", "globals.css"),
    path.join(src, "index.css"),
  ].find((file) => existsSync(file));
  const globalCss = globalCssPath ? readFileSync(globalCssPath, "utf8") : undefined;

  let typecheck: Finding;
  try {
    await sh("npx", ["tsc", "--noEmit"], app, 300_000);
    typecheck = { check: "typechecks", ok: true, detail: "tsc --noEmit is clean" };
  } catch (error) {
    const output = String((error as { stdout?: string }).stdout ?? error)
      .trim()
      .split("\n")
      .slice(0, 3)
      .join("; ");
    typecheck = { check: "typechecks", ok: false, detail: output };
  }

  const findings: Finding[] = [
    typecheck,
    checkImports(files, manifest, installed),
    checkProps(files, manifest),
    checkStylesheets(globalCss, sheets),
    checkUses(files, manifest, testCase.expect),
    checkProcess(toolCalls(transcript)),
  ];

  if (testCase.expectOneOf) {
    const used = testCase.expectOneOf.filter((name) => checkUses(files, manifest, [name]).ok);
    findings.push({
      check: "uses one of",
      ok: used.length > 0,
      detail: used.length
        ? `uses ${used.join(", ")}`
        : `none of ${testCase.expectOneOf.join(", ")}`,
    });
  }
  for (const { pattern, why } of testCase.mustContain ?? []) {
    const ok = files.some((f) => pattern.test(f.source));
    findings.push({
      check: `contains ${pattern.source}`,
      ok,
      detail: ok ? why : `missing — ${why}`,
    });
  }
  return findings;
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const { values } = parseArgs({
    options: {
      case: { type: "string" },
      baseline: { type: "boolean", default: false },
      keep: { type: "boolean", default: false },
      // Grade an app that already exists — a kept run, or a known-good app —
      // against one case, without running an agent.
      grade: { type: "string" },
    },
  });

  if (!existsSync(MANIFEST)) throw new Error("No manifest — run `pnpm gen` first.");
  if (!existsSync(path.join(ROOT, "packages/mcp/dist/stdio.js"))) {
    throw new Error("The MCP server is not built — run `pnpm --filter @zoblocks/mcp build` first.");
  }
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as ManifestLike;

  if (values.grade) {
    const testCase = CASES.find((c) => c.id === values.case);
    if (!testCase)
      throw new Error("--grade needs --case <id>: which case to grade the app against.");
    const app = path.resolve(values.grade);
    const transcriptFile = path.join(app, "..", "transcript.jsonl");
    const transcript = existsSync(transcriptFile) ? readFileSync(transcriptFile, "utf8") : "";
    const findings = await grade(app, testCase, transcript, manifest);
    for (const f of findings) console.log(`  ${f.ok ? "✓" : "✗"} ${f.check} — ${f.detail}`);
    return;
  }

  /*
   * Claude Code refuses to start inside another Claude Code session — nested
   * sessions share runtime resources — and says so only after the template is
   * built. Say it first, and do not work around it.
   */
  if (process.env.CLAUDECODE) {
    throw new Error(
      "Run this from your own terminal: Claude Code will not start a second session inside the one this is running in.",
    );
  }

  const wanted = values.case?.split(",") ?? CASES.map((c) => c.id);
  const cases = CASES.filter((c) => wanted.includes(c.id));
  const mode = values.baseline ? "baseline" : "with-zoblocks";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const results: Array<{ case: string; mode: string; findings: Finding[]; toolCalls: string[] }> =
    [];

  for (const testCase of cases) {
    console.log(`\n▶ ${testCase.id} (${mode})\n  ${testCase.prompt}`);
    const dir = path.join(WORK, "runs", `${stamp}-${testCase.id}-${mode}`);
    const app = path.join(dir, "app");
    copy(await template(testCase.fixture), app);
    for (const [file, content] of Object.entries(testCase.seed ?? {})) {
      mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
      writeFileSync(path.join(app, file), content);
    }

    // With ZoBlocks: the local server and the skill. Baseline: neither — an
    // empty server list, so the evaluator's own servers stay out too.
    const mcpConfig = path.join(dir, "mcp.json");
    writeFileSync(
      mcpConfig,
      JSON.stringify({
        mcpServers: values.baseline
          ? {}
          : { zoblocks: { type: "stdio", command: "node", args: [SERVER_BIN, "--offline"] } },
      }),
    );
    if (!values.baseline)
      copy(path.join(ROOT, "skills", "zoblocks"), path.join(app, ".claude", "skills", "zoblocks"));

    const started = Date.now();
    const transcript = await runAgent(app, testCase.prompt, mcpConfig);
    writeFileSync(path.join(dir, "transcript.jsonl"), transcript);
    const findings = await grade(app, testCase, transcript, manifest);
    const calls = toolCalls(transcript).map((c) => c.name);
    results.push({ case: testCase.id, mode, findings, toolCalls: calls });

    const passed = findings.filter((f) => f.ok).length;
    console.log(
      `  ${passed}/${findings.length} checks · ${Math.round((Date.now() - started) / 1000)}s`,
    );
    for (const f of findings) console.log(`  ${f.ok ? "✓" : "✗"} ${f.check} — ${f.detail}`);
    if (!values.keep) rmSync(app, { recursive: true, force: true });
  }

  mkdirSync(WORK, { recursive: true });
  const report = path.join(WORK, `report-${stamp}-${mode}.json`);
  writeFileSync(report, JSON.stringify(results, null, 2));
  const total = results.flatMap((r) => r.findings);
  console.log(
    `\n${total.filter((f) => f.ok).length}/${total.length} checks passed across ${results.length} case(s). Report: ${path.relative(ROOT, report)}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

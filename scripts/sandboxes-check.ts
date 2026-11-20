/**
 * Proves every "Open in StackBlitz" button opens a project that compiles.
 *
 * Each generated sandbox is assembled exactly as the docs site assembles it —
 * its manifest plus the registry documents it names, from apps/docs/public —
 * written to disk, and typechecked with its own tsconfig against packages
 * installed from npm. A few are also built with Vite, which is what catches a
 * stylesheet import that resolves to nothing.
 *
 * One install serves every project: they are written beneath a single
 * node_modules holding the union of their dependencies. That only works while
 * every sandbox asks for the same range of a given package, which the
 * generator guarantees and this script re-checks rather than assumes.
 *
 *   pnpm sandboxes:check                 every sandbox
 *   pnpm sandboxes:check switch          one component's
 *   pnpm sandboxes:check --build=5       also `vite build` five of them
 *   pnpm sandboxes:check --keep          leave the projects on disk
 *
 * Needs the network for the install. See scripts/gen/emit/sandboxes.ts.
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { cpus, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assembleProject,
  type RegistryDocument,
  type SandboxManifest,
} from "../apps/docs/src/lib/sandbox-project";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "apps", "docs", "public");

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const buildCount = Number(args.find((a) => a.startsWith("--build="))?.split("=")[1] ?? 3);
const keep = args.includes("--keep");

function run(
  command: string,
  argv: string[],
  cwd: string,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, argv, { cwd, shell: process.platform === "win32" });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function pool<T>(items: T[], size: number, work: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) await work(items[next++] as T);
    }),
  );
}

async function main() {
  const sandboxDir = path.join(PUBLIC, "sandbox");
  const keys: string[] = [];
  for (const component of existsSync(sandboxDir) ? readdirSync(sandboxDir).sort() : []) {
    if (only.length && !only.includes(component)) continue;
    for (const file of readdirSync(path.join(sandboxDir, component)).sort()) {
      if (file.endsWith(".json")) keys.push(`${component}/${file.slice(0, -".json".length)}`);
    }
  }
  if (!keys.length) {
    console.error("✗ no sandboxes found — run `pnpm gen` first");
    process.exit(1);
  }

  const documents = new Map<string, RegistryDocument>();
  const readDocument = async (name: string) => {
    if (!documents.has(name)) {
      const text = await readFile(path.join(PUBLIC, "r", `${name}.json`), "utf8");
      documents.set(name, JSON.parse(text) as RegistryDocument);
    }
    return documents.get(name) as RegistryDocument;
  };

  /* Assemble, and collect one range per package across every project. */
  const projects = new Map<string, Record<string, string>>();
  const ranges = new Map<string, { range: string; from: string }>();
  const conflicts: string[] = [];

  for (const key of keys) {
    const [component, id] = key.split("/") as [string, string];
    const manifest = JSON.parse(
      await readFile(path.join(sandboxDir, component, `${id}.json`), "utf8"),
    ) as SandboxManifest;
    const project = assembleProject(manifest, await Promise.all(manifest.items.map(readDocument)));
    projects.set(key, project.files);

    const pkg = JSON.parse(project.files["package.json"] ?? "{}") as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    for (const [name, range] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
      const seen = ranges.get(name);
      if (seen && seen.range !== range) {
        conflicts.push(`${name}: ${seen.range} in ${seen.from}, ${range} in ${key}`);
      } else if (!seen) {
        ranges.set(name, { range, from: key });
      }
    }
  }

  if (conflicts.length) {
    console.error(`✗ sandboxes disagree on ${conflicts.length} dependency range(s)\n`);
    for (const line of conflicts) console.error(`  ${line}`);
    process.exit(1);
  }

  const workdir = await mkdtemp(path.join(tmpdir(), "zoblocks-sandboxes-"));
  console.log(`· ${keys.length} sandbox(es), installing ${ranges.size} packages in ${workdir}`);

  await writeFile(
    path.join(workdir, "package.json"),
    JSON.stringify(
      {
        name: "zoblocks-sandboxes-check",
        private: true,
        type: "module",
        dependencies: {
          ...Object.fromEntries([...ranges].map(([name, { range }]) => [name, range])),
          // The sandboxes leave the compiler out — StackBlitz's editor has its
          // own — so the check brings it.
          ...(ranges.has("typescript") ? {} : { typescript: "~5.9.0" }),
        },
      },
      null,
      2,
    ),
  );
  const install = await run(
    "npm",
    ["install", "--no-audit", "--no-fund", "--loglevel=error"],
    workdir,
  );
  if (install.code !== 0) {
    console.error(`✗ npm install failed\n\n${install.output}`);
    process.exit(1);
  }

  /* Write each project beneath the shared install, then typecheck it. */
  const tsc = path.join(workdir, "node_modules", ".bin", "tsc");
  const failures: string[] = [];

  for (const [key, files] of projects) {
    const dir = path.join(workdir, "projects", key);
    for (const [file, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(dir, file)), { recursive: true });
      await writeFile(path.join(dir, file), content);
    }
  }

  await pool([...projects.keys()], Math.max(2, cpus().length), async (key) => {
    const result = await run(tsc, ["--noEmit", "-p", "."], path.join(workdir, "projects", key));
    if (result.code !== 0) {
      const first = result.output.split("\n").find((line) => line.includes("error")) ?? "";
      failures.push(`${key}: ${first.trim()}`);
      process.stdout.write("✗");
    } else {
      process.stdout.write("·");
    }
  });
  process.stdout.write("\n");

  /* Build a rotating few, so every sandbox gets built over a week of runs. */
  const day = Math.floor(Date.now() / 86_400_000);
  const toBuild = [...projects.keys()]
    .map((key, i) => ({ key, i }))
    .filter(({ i }) => buildCount > 0 && (i + day) % Math.ceil(projects.size / buildCount) === 0)
    .map(({ key }) => key)
    .slice(0, buildCount);
  const vite = path.join(workdir, "node_modules", ".bin", "vite");
  for (const key of toBuild) {
    const result = await run(
      vite,
      ["build", "--logLevel", "error"],
      path.join(workdir, "projects", key),
    );
    console.log(`${result.code === 0 ? "✓" : "✗"} vite build ${key}`);
    if (result.code !== 0) failures.push(`${key}: vite build failed\n${result.output.trim()}`);
  }

  if (!keep) await rm(workdir, { recursive: true, force: true });

  if (failures.length) {
    console.error(`\n✗ ${failures.length} sandbox(es) do not compile\n`);
    for (const line of failures) console.error(`  ${line}`);
    if (keep) console.error(`\n  Projects kept in ${workdir}/projects`);
    process.exit(1);
  }
  console.log(
    `✓ ${projects.size} sandbox(es) typecheck${toBuild.length ? `, ${toBuild.length} built` : ""}`,
  );
}

void main();

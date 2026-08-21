/**
 * The commands: `init`, `add`, `list`.
 *
 * Each takes its dependencies as arguments — cwd, env, a fetch — so the tests
 * drive the same functions the binary does, against a temporary directory and
 * a stub registry, with no network and no process state.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  CONFIG_FILE,
  ConfigError,
  configExists,
  defaultConfig,
  readConfig,
  writeConfig,
  type OxygenConfig,
} from "./config.js";
import { collectItems, type FetchOptions } from "./registry.js";
import { PUBLIC_REGISTRY_INDEX } from "./constants.js";
import { parseRegistryIndex, type RegistryItem } from "./schema.js";
import { applyPlan, planInstall } from "./write.js";
import { detectPackageManager, installCommand, missingDependencies } from "./pm.js";

export interface CommandContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  out: (line: string) => void;
  err: (line: string) => void;
  fetchImpl?: typeof fetch;
}

export interface AddOptions {
  overwrite: boolean;
  dryRun: boolean;
  /** Skip the package-manager subprocess. Set by --no-deps, and by every test. */
  skipDependencies: boolean;
  yes: boolean;
}

/** `oxygen init` — write oxygen.json. */
export async function init(
  context: CommandContext,
  options: { force: boolean } = { force: false },
): Promise<number> {
  const { cwd, out } = context;

  if (configExists(cwd) && !options.force) {
    out(`${CONFIG_FILE} already exists. Pass --force to overwrite it.`);
    return 1;
  }

  const config = defaultConfig(cwd);
  await writeConfig(cwd, config);

  out(`Created ${CONFIG_FILE}`);
  out("");
  out(`  Your "@/" alias is assumed to point at:  ${config.root}`);
  out("");
  out(`  Components land under it at the paths they import each other by —`);
  out(
    `  ${path.join(config.root, "components/oxygen")}, ${path.join(config.root, "lib")}, ${path.join(config.root, "styles")}.`,
  );
  out(`  If "@/" points somewhere else in your tsconfig, change "root" in ${CONFIG_FILE}.`);
  out("");
  out("  Then:");
  out("    oxygen add vitals-panel");
  out("");
  out("  Paid components need a registry namespace and a token — the console");
  out("  prints the exact block under Marketplace → Access tokens.");

  return 0;
}

/** `oxygen list` — what the public catalog holds. */
export async function list(context: CommandContext): Promise<number> {
  const doFetch = context.fetchImpl ?? fetch;
  const response = await doFetch(PUBLIC_REGISTRY_INDEX, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    context.err(`Could not read the catalog — ${response.status} from ${PUBLIC_REGISTRY_INDEX}`);
    return 1;
  }

  const index = parseRegistryIndex(await response.json(), PUBLIC_REGISTRY_INDEX);
  const width = Math.max(...index.items.map((i) => i.name.length), 4);

  context.out(`${index.name} — ${index.items.length} items`);
  context.out("");
  for (const item of index.items) {
    context.out(`  ${item.name.padEnd(width)}  ${item.description}`);
  }
  context.out("");
  context.out("  oxygen add <name>");

  return 0;
}

/** `oxygen add <specifier...>` — the reason this binary exists. */
export async function add(
  context: CommandContext,
  specifiers: string[],
  options: AddOptions,
): Promise<number> {
  const { cwd, env, out, err } = context;

  if (specifiers.length === 0) {
    err("Nothing to add. Name a component: oxygen add vitals-panel");
    return 1;
  }

  let config: OxygenConfig;
  try {
    config = await readConfig(cwd);
  } catch (error) {
    if (error instanceof ConfigError) {
      err(error.message);
      return 1;
    }
    throw error;
  }

  const requested = new Set<RegistryItem>();
  const fetchOptions: FetchOptions = {
    env,
    roots: requested,
    ...(context.fetchImpl ? { fetchImpl: context.fetchImpl } : {}),
  };
  const items = await collectItems(specifiers, config, fetchOptions);
  const plan = await planInstall(items, config, cwd);

  const pulled = items.filter((i) => !requested.has(i));
  if (pulled.length) {
    out(
      `Resolved ${items.length} items — ${pulled.length} pulled in as dependencies: ${pulled
        .map((i) => i.name)
        .join(", ")}`,
    );
  }

  if (options.dryRun) {
    out("");
    out("Dry run — nothing written.");
    out("");
    for (const file of plan.files) {
      const state = file.unchanged ? "same" : file.exists ? "exists" : "new";
      out(`  ${state.padEnd(7)} ${file.relative}`);
    }
    if (plan.dependencies.length) {
      out("");
      out(`  npm dependencies: ${plan.dependencies.join(", ")}`);
    }
    return 0;
  }

  const { written, skipped } = await applyPlan(plan, { overwrite: options.overwrite });

  out("");
  for (const file of written) out(`  write  ${file.relative}`);

  const collisions = skipped.filter((f) => !f.unchanged);
  for (const file of collisions) out(`  skip   ${file.relative} — already exists`);

  if (collisions.length && !options.overwrite) {
    out("");
    out(`  ${collisions.length} file(s) left alone. Pass --overwrite to replace them.`);
  }

  if (!written.length && !collisions.length) out("  Everything is already up to date.");

  if (plan.dependencies.length && !options.skipDependencies) {
    const code = await installDependencies(context, plan.dependencies, options.yes);
    if (code !== 0) return code;
  } else if (plan.dependencies.length) {
    out("");
    out(`  npm dependencies not installed: ${plan.dependencies.join(", ")}`);
  }

  out("");
  return 0;
}

/**
 * Hand the npm dependencies to the project's package manager.
 *
 * Only what is missing, and only ever as a subprocess we print first. An
 * installer that mutates a lockfile without saying which command it ran is one
 * the developer cannot reproduce or undo.
 */
async function installDependencies(
  context: CommandContext,
  dependencies: string[],
  yes: boolean,
): Promise<number> {
  const { cwd, out, err } = context;

  const packageJsonPath = path.join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    out("");
    out(`  No package.json here, so these were not installed: ${dependencies.join(", ")}`);
    return 0;
  }

  let packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  try {
    packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  } catch {
    /*
     * A package.json we cannot parse is their problem to fix, not ours to
     * guess at. The files are already written and correct; only the dependency
     * step is skipped, and it says so.
     */
    err(`  package.json is not valid JSON — skipping dependency install.`);
    return 0;
  }

  const missing = missingDependencies(dependencies, packageJson);
  if (!missing.length) return 0;

  const manager = detectPackageManager(cwd);
  const { command, args } = installCommand(manager, missing);

  out("");
  out(`  ${command} ${args.join(" ")}`);

  if (!yes) {
    /*
     * Without --yes we print the command and stop.
     *
     * The alternative is an interactive prompt, which needs a TTY the CLI
     * cannot count on: this runs in CI, in agent harnesses, and inside other
     * people's install scripts. Printing a command the developer can paste is
     * honest in all three, where a prompt would hang in two of them.
     */
    out("");
    out("  Run that to install the dependencies, or re-run with --yes to have this do it.");
    return 0;
  }

  return await new Promise<number>((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", (error) => {
      err(`  Could not run ${command} — ${error.message}`);
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 0));
  });
}

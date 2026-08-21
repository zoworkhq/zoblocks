/**
 * Argument parsing and dispatch.
 *
 * Kept separate from `bin/oxygen.mjs` so the whole surface — including exit
 * codes and the help text — is reachable from a test without spawning a
 * process.
 */

import { parseArgs } from "node:util";
import { add, init, list, type CommandContext } from "./commands.js";
import { ConfigError } from "./config.js";
import { RegistryError } from "./registry.js";
import { RegistryFormatError } from "./schema.js";

const HELP = `oxygen — install Oxygen UI components into your project

Usage
  oxygen init                      Create oxygen.json
  oxygen add <component...>        Add components and their dependencies
  oxygen list                      List the public catalog

Specifiers
  vitals-panel                     A component from the public catalog
  @oxygen-pro/vitals-flowsheet     A component from a registry in oxygen.json
  https://…/item.json              A registry item by URL

Options
  --cwd <dir>      Run against another directory
  --overwrite      Replace files that already exist
  --dry-run        Show what would be written, write nothing
  --no-deps        Do not touch package.json or the lockfile
  --yes            Let this run your package manager for npm dependencies
  --force          init only: overwrite an existing oxygen.json
  --version        Print the version
  --help           Print this

Paid components need a token with the "registry" scope, minted in the console
under Marketplace → Access tokens and read from OXYGEN_TOKEN.
`;

export interface RunOptions {
  argv: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  out: (line: string) => void;
  err: (line: string) => void;
  version: string;
  fetchImpl?: typeof fetch;
}

export async function run(options: RunOptions): Promise<number> {
  const { argv, out, err } = options;

  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        cwd: { type: "string" },
        overwrite: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        /*
         * Declared as its own flag rather than as a negation of `--deps`.
         * Node's parseArgs has no `--no-` handling, so in strict mode
         * `--no-deps` is an unknown option and the whole invocation is
         * rejected — which is the opposite of what someone typing it wants.
         */
        "no-deps": { type: "boolean", default: false },
        yes: { type: "boolean", short: "y", default: false },
        force: { type: "boolean", default: false },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (error) {
    err((error as Error).message);
    err("");
    err(HELP);
    return 1;
  }

  const { values, positionals } = parsed;

  if (values.version) {
    out(options.version);
    return 0;
  }

  const [command, ...rest] = positionals;

  if (values.help || !command) {
    out(HELP);
    return command ? 0 : 1;
  }

  const cwd = values.cwd ? (values.cwd as string) : options.cwd;
  const context: CommandContext = {
    cwd,
    env: options.env,
    out,
    err,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
  };

  try {
    switch (command) {
      case "init":
        return await init(context, { force: values.force as boolean });

      case "add":
        return await add(context, rest, {
          overwrite: values.overwrite as boolean,
          dryRun: values["dry-run"] as boolean,
          skipDependencies: values["no-deps"] as boolean,
          yes: values.yes as boolean,
        });

      case "list":
        return await list(context);

      default:
        err(`Unknown command "${command}".`);
        err("");
        err(HELP);
        return 1;
    }
  } catch (error) {
    /*
     * The three error types this CLI raises deliberately already carry a
     * message written for the person reading it, so they are printed as-is.
     * Anything else is a bug in here rather than a problem with their project,
     * and gets a stack trace, because that is what we would need to fix it.
     */
    if (
      error instanceof ConfigError ||
      error instanceof RegistryError ||
      error instanceof RegistryFormatError
    ) {
      err("");
      err(error.message);
      err("");
      return 1;
    }
    throw error;
  }
}

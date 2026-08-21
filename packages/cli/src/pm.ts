/**
 * Which package manager this project uses, and how to ask it to install.
 *
 * Detected from the lockfile rather than from `npm_config_user_agent`: the
 * agent variable describes the process that launched us, which under
 * `pnpm dlx` is pnpm even in an npm project. The lockfile describes the
 * project, which is the thing we are about to modify.
 */

import { existsSync } from "node:fs";
import path from "node:path";

export type PackageManager = "pnpm" | "yarn" | "bun" | "npm";

const LOCKFILES: Array<[string, PackageManager]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"],
];

export function detectPackageManager(cwd: string): PackageManager {
  let directory = path.resolve(cwd);

  /*
   * Walk upward. A component installed into a workspace package is installed
   * into a project whose lockfile sits at the monorepo root, and stopping at
   * `cwd` would report npm for every pnpm workspace in existence.
   */
  for (;;) {
    for (const [file, manager] of LOCKFILES) {
      if (existsSync(path.join(directory, file))) return manager;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }

  return "npm";
}

/** The argv for adding dependencies, ready for `spawn`. */
export function installCommand(
  manager: PackageManager,
  packages: string[],
): { command: string; args: string[] } {
  switch (manager) {
    case "pnpm":
      return { command: "pnpm", args: ["add", ...packages] };
    case "yarn":
      return { command: "yarn", args: ["add", ...packages] };
    case "bun":
      return { command: "bun", args: ["add", ...packages] };
    case "npm":
      return { command: "npm", args: ["install", ...packages] };
  }
}

/**
 * Dependencies already satisfied by the project, which we do not reinstall.
 *
 * Only the name is compared, never the range. A project pinning
 * `react@18.2.0` against an item asking for `react@^18` is a question for the
 * developer, and an installer that silently resolved it would be answering a
 * versioning question by moving their lockfile.
 */
export function missingDependencies(
  dependencies: string[],
  packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  },
): string[] {
  const present = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);

  const seen = new Set<string>();
  const missing: string[] = [];

  for (const dependency of dependencies) {
    const name = bareName(dependency);
    if (present.has(name) || seen.has(name)) continue;
    seen.add(name);
    missing.push(dependency);
  }

  return missing;
}

/** `@scope/pkg@^1.2.3` → `@scope/pkg`. */
export function bareName(specifier: string): string {
  const at = specifier.lastIndexOf("@");
  return at > 0 ? specifier.slice(0, at) : specifier;
}

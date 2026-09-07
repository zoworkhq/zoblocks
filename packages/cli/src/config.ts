/**
 * `zoblocks.json` — the consumer's install configuration.
 *
 * It answers two questions the CLI cannot guess: where this project's `@/`
 * import alias points, and which registries it may reach.
 *
 *     {
 *       "$schema": "https://zoblocks.design/schema/zoblocks.json",
 *       "root": "src",
 *       "registries": {
 *         "@zoblocks-pro": {
 *           "url": "https://app.zoblocks.design/r/pro/{name}.json",
 *           "headers": { "Authorization": "Bearer ${ZOBLOCKS_TOKEN}" }
 *         }
 *       }
 *     }
 *
 * Tokens are written as `${ENV_VAR}` and expanded at request time from the
 * environment. The file is meant to be committed; the credential is not, and
 * a format that only permits the indirection is what keeps the two apart. A
 * literal token here is refused rather than used — see `expandHeaders`.
 *
 * ## Why there is one path setting and not four
 *
 * An earlier version of this file let you place components, lib, hooks, and
 * styles independently. That is a promise this CLI cannot keep. ZoBlocks source
 * is copied verbatim, and it imports itself through the `@/` alias —
 * `@/lib/utils`, `@/components/zoblocks/timeline`. Those specifiers are inside
 * the files, so a component's location is fixed by the source, not by
 * configuration: moving `utils.ts` to `src/shared/` while `care-timeline.tsx`
 * still imports `@/lib/utils` produces an install that writes nine files and
 * compiles none of them.
 *
 * Honouring such a setting would mean rewriting import specifiers at install
 * time — real machinery, on source we hand to healthcare teams to audit. So
 * the registry states the path under `@/` and this file states where `@/`
 * points, which is the one degree of freedom that actually exists. To put the
 * files somewhere else, change the `@/*` mapping in your tsconfig; the two
 * settings then still agree.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const CONFIG_FILE = "zoblocks.json";
export const CONFIG_SCHEMA_URL = "https://zoblocks.design/schema/zoblocks.json";

/** The public registry. Always available, needs no credential, cannot be shadowed. */
export const PUBLIC_REGISTRY_URL = "https://zoblocks.design/r/{name}.json";

export interface RegistryConfig {
  /** A URL template containing `{name}`. */
  url: string;
  headers?: Record<string, string>;
}

export interface ZoBlocksConfig {
  $schema?: string;
  /**
   * Directory the project's `@/` alias resolves to, relative to the project
   * root. Every registry `target` is written beneath it.
   */
  root: string;
  registries: Record<string, RegistryConfig>;
}

/**
 * Where `@/` points when nothing says otherwise.
 *
 * A `src` directory is the near-universal convention in the frameworks ZoBlocks
 * targets, and getting this wrong costs one edit to a file the CLI just told
 * you it wrote. Guessing is cheaper than prompting every developer for an
 * answer that is right by default.
 */
export const DEFAULT_ROOT = "src";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * The name this file carried before the project was renamed from ZoBlocks to
 * ZoBlocks. A consumer who installed anything under the old name has one of
 * these committed, and it parses identically — only the filename moved.
 *
 * It is read, never written. `resolveConfigPath` prefers the current name, so
 * a project holding both files is unambiguous, and `readConfig` warns once so
 * the reader knows why the CLI is looking at a file the docs no longer mention.
 */
export const LEGACY_CONFIG_FILE = "oxygen.json"; // rename-sweep-exempt: must name the retired file

export function configPath(cwd: string): string {
  return path.join(cwd, CONFIG_FILE);
}

export function legacyConfigPath(cwd: string): string {
  return path.join(cwd, LEGACY_CONFIG_FILE);
}

/**
 * The config this project actually has, current name first.
 *
 * Returns the current path when neither exists, so the caller's "no config
 * here" error names the file it should create rather than the retired one.
 */
export function resolveConfigPath(cwd: string): { file: string; legacy: boolean } {
  if (existsSync(configPath(cwd))) return { file: configPath(cwd), legacy: false };
  if (existsSync(legacyConfigPath(cwd))) return { file: legacyConfigPath(cwd), legacy: true };
  return { file: configPath(cwd), legacy: false };
}

export function configExists(cwd: string): boolean {
  return existsSync(configPath(cwd)) || existsSync(legacyConfigPath(cwd));
}

/**
 * Guess where `@/` points, for `zoblocks init`.
 *
 * Reported in init's output rather than applied silently, so a wrong guess is
 * visible at the moment it is made instead of at the first failed build.
 */
export function guessRoot(cwd: string): string {
  return existsSync(path.join(cwd, "src")) ? "src" : ".";
}

export function defaultConfig(cwd: string): ZoBlocksConfig {
  return {
    $schema: CONFIG_SCHEMA_URL,
    root: guessRoot(cwd),
    registries: {},
  };
}

export async function readConfig(cwd: string): Promise<ZoBlocksConfig> {
  const { file, legacy } = resolveConfigPath(cwd);
  if (!existsSync(file)) {
    throw new ConfigError(`No ${CONFIG_FILE} in ${cwd}.\n\nRun "zoblocks init" to create one.`);
  }

  if (legacy) {
    // One line, not a nag. The file still works; the reader only needs to know
    // the CLI found it under the old name and what to rename it to.
    console.warn(
      `${LEGACY_CONFIG_FILE} is the pre-rename name for ${CONFIG_FILE}. ` +
        `Rename it to ${CONFIG_FILE} — the contents are unchanged.`,
    );
  }

  // Error text names the file actually on disk, so a legacy project is not
  // told to fix a file it does not have.
  const named = legacy ? LEGACY_CONFIG_FILE : CONFIG_FILE;

  let parsed: unknown;
  const text = await readFile(file, "utf8");
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ConfigError(`${named} is not valid JSON — ${(error as Error).message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new ConfigError(`${named} must contain a JSON object.`);
  }

  const raw = parsed as Record<string, unknown>;
  const registries =
    typeof raw.registries === "object" && raw.registries !== null && !Array.isArray(raw.registries)
      ? (raw.registries as Record<string, RegistryConfig>)
      : {};

  for (const [name, registry] of Object.entries(registries)) {
    if (!name.startsWith("@")) {
      throw new ConfigError(
        `${named}: registry "${name}" must start with "@" — namespaces are written as "@zoblocks-pro".`,
      );
    }
    if (typeof registry?.url !== "string" || !registry.url.includes("{name}")) {
      throw new ConfigError(
        `${named}: registry "${name}" needs a "url" containing "{name}", e.g. "https://app.zoblocks.design/r/pro/{name}.json".`,
      );
    }
  }

  return {
    ...(typeof raw.$schema === "string" ? { $schema: raw.$schema } : {}),
    root: typeof raw.root === "string" && raw.root.trim() !== "" ? raw.root : DEFAULT_ROOT,
    registries,
  };
}

export async function writeConfig(cwd: string, config: ZoBlocksConfig): Promise<void> {
  await writeFile(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

/**
 * Resolve a file's destination inside the consumer's project.
 *
 * `target` is the path the registry states beneath `@/`, and it is written
 * verbatim under the configured root. That is the whole calculation, and it
 * being this small is the point: the destination has to agree with the import
 * specifiers already inside the file, so anything cleverer here can only
 * disagree with them.
 *
 * A file with no `target` falls back to its basename. Every item this registry
 * publishes sets one; the fallback exists for a third-party registry that does
 * not, and it puts the file somewhere obvious rather than failing.
 */
export function resolveTarget(
  config: ZoBlocksConfig,
  file: { path: string; target?: string },
): string {
  return path.join(config.root, file.target ?? path.basename(file.path));
}

/**
 * Expand `${VAR}` references in header values from the environment.
 *
 * A missing variable is an error rather than an empty header: sending
 * `Authorization: Bearer ` produces a 401 that reads like a bad token, and
 * the developer then goes looking for the wrong problem.
 *
 * A header that looks like a live credential written literally is also
 * refused. `zoblocks.json` is a committed file, and the failure it prevents —
 * a token in git history — is not one the developer can undo later.
 */
export function expandHeaders(
  headers: Record<string, string> | undefined,
  env: NodeJS.ProcessEnv,
  registryName: string,
): Record<string, string> {
  const expanded: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers ?? {})) {
    // Both prefixes. `zb_` is what the console mints now; `oxy_` is what it
    // minted before the rename, and a token from then is still a live
    // credential that must not be committed. Dropping the old prefix here
    // would turn this guard off for exactly the tokens most likely to be
    // sitting in an old config.
    if (/\b(zb|oxy)_(live|test)_[A-Za-z0-9]/.test(value)) {
      throw new ConfigError(
        `${CONFIG_FILE}: registry "${registryName}" has a token written literally into "${key}".\n\n` +
          `Move it to your environment and reference it instead:\n` +
          `  "${key}": "Bearer \${ZOBLOCKS_TOKEN}"\n\n` +
          `This file is meant to be committed; the token is not.`,
      );
    }

    expanded[key] = value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, variable: string) => {
      const found = env[variable];
      if (found === undefined || found === "") {
        throw new ConfigError(
          `${CONFIG_FILE}: registry "${registryName}" needs the environment variable ${variable}, which is not set.\n\n` +
            `Mint a token in the console under Marketplace → Access tokens, then:\n` +
            `  export ${variable}=zb_live_…`,
        );
      }
      return found;
    });
  }

  return expanded;
}

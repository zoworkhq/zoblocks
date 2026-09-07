/**
 * @zoblocks/cli — the installer for ZoBlocks components.
 *
 * The binary is `zoblocks`. This entry point exists so the same machinery is
 * usable from a script: a build step that materialises components into a
 * generated app can call `collectItems` and `planInstall` directly rather than
 * shelling out and parsing our output.
 */

export { run, type RunOptions } from "./cli.js";
export { add, init, list, type CommandContext, type AddOptions } from "./commands.js";
export {
  CONFIG_FILE,
  ConfigError,
  DEFAULT_ROOT,
  PUBLIC_REGISTRY_URL,
  defaultConfig,
  guessRoot,
  expandHeaders,
  readConfig,
  resolveTarget,
  writeConfig,
  type ZoBlocksConfig,
  type RegistryConfig,
} from "./config.js";
export {
  RegistryError,
  collectItems,
  fetchItem,
  resolveSpecifier,
  type FetchOptions,
  type ResolvedSpecifier,
} from "./registry.js";
export {
  FILE_KINDS,
  ITEM_SCHEMA_URL,
  REGISTRY_SCHEMA_URL,
  RegistryFormatError,
  parseRegistryIndex,
  parseRegistryItem,
  type FileKind,
  type RegistryIndex,
  type RegistryItem,
} from "./schema.js";
export { applyPlan, planInstall, type Plan, type PlannedFile } from "./write.js";
export {
  detectPackageManager,
  installCommand,
  missingDependencies,
  type PackageManager,
} from "./pm.js";
export { HOMEPAGE, PUBLIC_REGISTRY_INDEX } from "./constants.js";

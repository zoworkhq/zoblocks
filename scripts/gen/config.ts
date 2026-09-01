/**
 * Shared paths and constants for the generator.
 *
 * Everything the platform derives from component metadata is listed in
 * GENERATED_FILES. That list is what `pnpm gen --check` verifies in CI, so a
 * new output must be added here or it will silently stop being checked.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const HOMEPAGE = "https://oxygenui.design";
export const REGISTRY_NAME = "oxygenui";

/** Where component source lives today. Phase 1 moves this to packages/react/src/components. */
export const COMPONENTS_DIR = path.join(ROOT, "registry", "oxygen");

/** Directories under COMPONENTS_DIR that are not components. */
export const NON_COMPONENT_DIRS = new Set(["lib"]);

/**
 * Registry items that exist without component metadata, and may therefore be
 * named in a component's `registryDependencies`.
 *
 * Declared here rather than beside SUPPORT_ITEMS in emit/registry.ts: `load.ts`
 * needs the names to validate dependencies, and importing them from the emitter
 * made load → emit/registry → load a cycle. config.ts imports nothing from the
 * generator, so it is the one place both sides can reach without one.
 */
export const SUPPORT_ITEM_NAMES: ReadonlySet<string> = new Set([
  "utils",
  "tokens",
  "loader-core",
  "accordion-core",
  "switch-core",
  "clinical-note-core",
  "clinical-status-core",
  "result-value-core",
  "allergy-core",
  "risk-core",
  "provenance-core",
  "trend-core",
  "clock-core",
  "presence-core",
  "chart-header-core",
  "workspace-core",
  "palette-core",
  "timeline-core",
  "timeline-fhir",
  "datetime-core",
  "recorder-core",
]);

/** Prefix the Oxygen CLI writes component files under, inside the consumer's project. */
export const CONSUMER_COMPONENT_DIR = "components/oxygen";

export const paths = {
  registryJson: path.join(ROOT, "registry.json"),
  registryOut: path.join(ROOT, "apps", "docs", "public", "r"),
  /**
   * The JSON Schema documents every registry item and every `oxygen.json`
   * points at. Served from the docs site, so the `$schema` URLs resolve.
   */
  schemaOut: path.join(ROOT, "apps", "docs", "public", "schema"),
  tsconfigPaths: path.join(ROOT, "tsconfig.generated.json"),
  /**
   * The same mappings, rebased for the docs app.
   *
   * The docs app resolves from its own directory, so it cannot extend the root
   * file. It used to carry a hand-written subset instead, and the subset went
   * stale exactly as the root one had before it was generated: three of the ten
   * component specifiers were mapped, so a preview importing any of the other
   * seven could not be written at all.
   */
  docsTsconfigPaths: path.join(ROOT, "apps", "docs", "tsconfig.generated.json"),
  docsGenerated: path.join(ROOT, "apps", "docs", "src", "lib", "generated"),
  docsCatalog: path.join(ROOT, "apps", "docs", "src", "lib", "generated", "catalog.ts"),
  tailwindSources: path.join(ROOT, "apps", "docs", "src", "app", "generated-sources.css"),
  llmsTxt: path.join(ROOT, "apps", "docs", "public", "llms.txt"),
  coverage: path.join(ROOT, "apps", "docs", "public", "r", "coverage.json"),
  /** The npm React channel, generated from the registry source. */
  reactPackage: path.join(ROOT, "packages", "react"),
} as const;

/**
 * Banner on every generated file. The command is included because the failure
 * mode we care about is someone editing the output and losing the change on
 * the next run — the banner has to tell them where to go instead.
 */
export function banner(comment: "//" | "/*" | "#" = "//"): string {
  const lines = [
    "GENERATED FILE — DO NOT EDIT.",
    "",
    "Produced by `pnpm gen` from each component's *.meta.ts.",
    "Edit the metadata, then re-run. CI fails if this file is stale.",
    "",
    "See content/decisions/0004-generated-component-metadata.md",
  ];

  if (comment === "#") return lines.map((l) => (l ? `# ${l}` : "#")).join("\n");
  if (comment === "/*")
    return ["/*", ...lines.map((l) => (l ? ` * ${l}` : " *")), " */"].join("\n");
  return lines.map((l) => (l ? `// ${l}` : "//")).join("\n");
}

export function rel(absolute: string): string {
  return path.relative(ROOT, absolute);
}

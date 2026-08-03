/**
 * Builds the public shadcn registry.
 *
 * Reads `registry.json`, inlines the source of every referenced file, and
 * writes one JSON document per item to `apps/docs/public/r/` — the shape the
 * shadcn CLI fetches when a user runs:
 *
 *   pnpm dlx shadcn@latest add @oxygenui/patient-banner
 *
 * Run with `--check` in CI to validate without writing. A broken registry is a
 * broken install for every customer, so this fails loudly rather than
 * emitting a partial catalog.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_SOURCE = path.join(ROOT, "registry.json");
const OUTPUT_DIR = path.join(ROOT, "apps", "docs", "public", "r");
const HOMEPAGE = "https://oxygenui.design";

const CHECK_ONLY = process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const registryFileSchema = z.object({
  path: z.string().min(1),
  type: z.enum([
    "registry:lib",
    "registry:component",
    "registry:ui",
    "registry:hook",
    "registry:block",
    "registry:page",
    "registry:file",
    "registry:style",
  ]),
  target: z.string().optional(),
});

const registryItemSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case"),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(20, "description must be useful, not a placeholder"),
  categories: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  cssVars: z.record(z.unknown()).optional(),
  files: z.array(registryFileSchema).min(1),
});

const registrySchema = z.object({
  $schema: z.string().optional(),
  name: z.string().min(1),
  homepage: z.string().url(),
  items: z.array(registryItemSchema).min(1),
});

type RegistryItem = z.infer<typeof registryItemSchema>;

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const problems: string[] = [];

function fail(message: string) {
  problems.push(message);
}

async function buildItem(item: RegistryItem) {
  const files = [];

  for (const file of item.files) {
    const absolute = path.join(ROOT, file.path);

    if (!existsSync(absolute)) {
      fail(`${item.name}: file not found — ${file.path}`);
      continue;
    }

    const content = await readFile(absolute, "utf8");

    if (!content.trim()) {
      fail(`${item.name}: file is empty — ${file.path}`);
      continue;
    }

    // A component that reaches for process.env will silently break in the
    // consumer's build. Catch it here rather than in their CI.
    if (/process\.env\./.test(content)) {
      fail(`${item.name}: ${file.path} reads process.env — registry files must be self-contained`);
    }

    files.push({
      path: file.path,
      type: file.type,
      target: file.target ?? "",
      content,
    });
  }

  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.categories ? { categories: item.categories } : {}),
    ...(item.dependencies ? { dependencies: item.dependencies } : {}),
    ...(item.devDependencies ? { devDependencies: item.devDependencies } : {}),
    ...(item.registryDependencies ? { registryDependencies: item.registryDependencies } : {}),
    ...(item.cssVars ? { cssVars: item.cssVars } : {}),
    files,
  };
}

async function main() {
  const raw = await readFile(REGISTRY_SOURCE, "utf8");
  const parsed = registrySchema.safeParse(JSON.parse(raw));

  if (!parsed.success) {
    console.error("✗ registry.json failed validation:\n");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const registry = parsed.data;

  const names = registry.items.map((i) => i.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length) {
    fail(`duplicate item names: ${[...new Set(duplicates)].join(", ")}`);
  }

  // Every registryDependency must resolve to something we actually publish.
  const published = new Set(names.map((n) => `${HOMEPAGE}/r/${n}.json`));
  for (const item of registry.items) {
    for (const dep of item.registryDependencies ?? []) {
      if (dep.startsWith(HOMEPAGE) && !published.has(dep)) {
        fail(`${item.name}: registryDependency does not exist in this registry — ${dep}`);
      }
    }
  }

  const built = await Promise.all(registry.items.map(buildItem));

  if (problems.length) {
    console.error("✗ registry build failed:\n");
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  if (CHECK_ONLY) {
    console.log(`✓ registry valid — ${built.length} items, ${built.reduce((n, i) => n + i.files.length, 0)} files`);
    return;
  }

  // Clear stale output so an item removed from registry.json stops being served.
  if (existsSync(OUTPUT_DIR)) {
    for (const entry of await readdir(OUTPUT_DIR)) {
      if (entry.endsWith(".json")) await rm(path.join(OUTPUT_DIR, entry));
    }
  }
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const item of built) {
    await writeFile(
      path.join(OUTPUT_DIR, `${item.name}.json`),
      `${JSON.stringify(item, null, 2)}\n`,
      "utf8",
    );
  }

  // Index — powers the catalog page and lets agents enumerate the registry.
  await writeFile(
    path.join(OUTPUT_DIR, "index.json"),
    `${JSON.stringify(
      {
        name: registry.name,
        homepage: registry.homepage,
        items: registry.items.map((item) => ({
          name: item.name,
          type: item.type,
          title: item.title,
          description: item.description,
          categories: item.categories ?? [],
          url: `${HOMEPAGE}/r/${item.name}.json`,
        })),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`✓ wrote ${built.length} registry items + index to apps/docs/public/r/`);
  for (const item of built) {
    console.log(`  @oxygenui/${item.name}  (${item.files.length} file${item.files.length === 1 ? "" : "s"})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Scaffolds a new component.
 *
 *   pnpm gen:component vitals-trend
 *
 * The whole point of the generated pipeline is that this touches exactly one
 * directory. Nothing shared is edited: `pnpm gen` picks the component up from
 * its metadata and updates the registry, the catalog, path mappings, the
 * Tailwind source list, and the agent manifest.
 *
 * The layout is fixed and identical for every component, because uniformity is
 * what lets tooling operate over 500 of them without special cases.
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { COMPONENTS_DIR, rel } from "./config";

const name = process.argv[2];

function bail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!name) bail("Usage: pnpm gen:component <kebab-case-name>");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  bail(`"${name}" must be kebab-case — it becomes the directory, the URL slug, and the registry item.`);
}

/** vitals-trend → VitalsTrend */
const pascal = name
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");

/** vitals-trend → Vitals Trend */
const title = name
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const dir = path.join(COMPONENTS_DIR, name);
if (existsSync(dir)) bail(`${rel(dir)} already exists.`);

const component = `"use client";

/**
 * ${pascal} — one line saying what this renders.
 *
 * Then the paragraph that matters: the specific failure this component exists
 * to prevent. Not what it looks like — what goes wrong without it.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ${pascal}Props extends React.HTMLAttributes<HTMLDivElement> {
  /** Document every prop here. This is the only place the contract is written;
   *  the docs prop table is extracted from it. */
  placeholder?: string;
}

export function ${pascal}({ placeholder, className, ...props }: ${pascal}Props) {
  return (
    <div className={cn("text-[var(--ox-text)]", className)} {...props}>
      {placeholder}
    </div>
  );
}
`;

const meta = `import { defineComponentMeta } from "@oxygenui/component-meta";

export default defineComponentMeta({
  name: "${name}",
  title: "${title}",
  tier: "free",
  // Starts experimental: it ships from @oxygenui/react/experimental and may
  // break in any minor until it is promoted. See ADR 0006.
  status: "experimental",
  since: "0.0.0",
  layer: "clinical",

  summary: "TODO: one line, shown on catalog cards and in search results.",
  description:
    "TODO: two sentences. The install-time blurb a developer reads in the registry — what it does and what it handles.",
  rationale:
    "TODO: the long form. Why this component exists, what failure it prevents, and what it deliberately does not do.",

  categories: ["Clinical"],
  fhir: [],

  // Every state this renders explicitly. Absence, error, restricted, and
  // degraded states are the product — listing them is how the docs stay honest
  // about which ones are actually handled.
  states: ["Default"],

  a11y: [
    {
      label: "TODO: short label",
      detail: "TODO: what the component does, in terms a reviewer can check against the rendered output.",
    },
  ],

  guidance: {
    use: ["TODO: when to reach for this."],
    avoid: ["TODO: when not to, and what to use instead."],
  },

  limitations: ["TODO: every component has at least one. An unstated limitation is a bug report."],
  related: [],

  dependencies: ["clsx", "tailwind-merge"],
  registryDependencies: ["utils", "tokens"],

  usage: \`import { ${pascal} } from "@/components/oxygen/${name}";

<${pascal} />\`,
});
`;

async function main() {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.tsx`), component, "utf8");
  await writeFile(path.join(dir, `${name}.meta.ts`), meta, "utf8");

  console.log(`
✓ ${rel(dir)}
    ${name}.tsx       implementation
    ${name}.meta.ts   metadata — fill in the placeholders

  Then: pnpm gen

  Nothing else needs editing. The registry, the docs catalog, path mappings,
  the Tailwind source list, and the agent manifest are all generated from the
  metadata above.

  Phase 2 adds ${name}.stories.tsx and ${name}.test.tsx to this scaffold; until
  the story and test infrastructure lands, the coverage gate will report this
  component as incomplete, which is accurate.
`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

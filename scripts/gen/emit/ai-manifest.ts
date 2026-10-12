/**
 * What coding agents read: the agent manifest and the skill's reference files.
 *
 * ADR 0004 listed "an MCP manifest" among the generated artifacts; ADR 0017 is
 * what it is for. The MCP server (`@zoblocks/mcp`, local and at
 * zoblocks.design/mcp) answers every question from this one JSON file, and the
 * skill's `references/` are the same facts as markdown, for an agent with no
 * MCP connection.
 *
 * Nothing here is new information. Components come from the catalog the docs
 * render, install closures from the registry graph the CLI resolves, setup from
 * `@zoblocks/component-meta`'s integration data the /docs page renders, and the
 * rules from the lint plugin's own rule descriptions. So an agent and a reader
 * are told the same thing, and `gen --check` catches the day they would not be.
 *
 * Free catalog only (ADR 0017, decision 6) — the same boundary the public
 * registry already draws.
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ALIAS_SETUP,
  BRIDGED_STYLES,
  CLINICAL_COLOURS_NOTE,
  CODING_RULES,
  FIRST_COMPONENT_USAGE,
  FRAMEWORK_LABEL,
  GLOBAL_STYLESHEET,
  REACT_FRAMEWORKS,
  SCOPE_NOTE,
  SERVER_COMPONENTS,
  WEB_COMPONENTS,
  PACKAGE_MANAGERS,
  ZOBLOCKS_STYLE_SUMMARY,
  distributionState,
  toCommand,
  type ComponentDoc,
  type Snippet,
} from "@zoblocks/component-meta";
import eslintPlugin from "@zoblocks/eslint-plugin";
import { HOMEPAGE, banner, paths } from "../config";
import type { RegistryGraphItem } from "./registry";
import type { Emitter } from "../write";
// The module alone: one function, no imports, shared with the MCP server.
import { tableCell } from "../../../packages/mcp/src/markdown";

/** Bumped when a reader of the manifest would have to change to keep working. */
export const AI_MANIFEST_SCHEMA_VERSION = 1;

const GENERATED_MD = [
  "<!--",
  "  GENERATED FILE — DO NOT EDIT.",
  "  Produced by `pnpm gen` from the component catalog and",
  "  packages/component-meta/src/integration.ts. CI fails if it is stale.",
  "-->",
].join("\n");

/* ------------------------------------------------------------------ */
/* Install closure                                                    */
/* ------------------------------------------------------------------ */

export interface InstallClosure {
  /** Every file `zoblocks add <name>` writes, project-relative under the `@/` root. */
  files: string[];
  /** The subset that must be imported from the global stylesheet, tokens first. */
  stylesheets: string[];
  npmDependencies: string[];
}

/**
 * Everything one `add` writes, following `registryDependencies` the way the
 * CLI does. Tokens sort first among the stylesheets, because every other sheet
 * reads them.
 */
export function installClosure(name: string, graph: RegistryGraphItem[]): InstallClosure {
  const byName = new Map(graph.map((item) => [item.name, item]));
  const seen = new Set<string>();
  const files = new Set<string>();
  const dependencies = new Set<string>();

  const visit = (itemName: string) => {
    if (seen.has(itemName)) return;
    seen.add(itemName);
    const item = byName.get(itemName);
    if (!item) return;
    for (const dep of item.registryDependencies) if (!dep.includes("/")) visit(dep);
    for (const target of item.targets) files.add(target);
    for (const dep of item.dependencies) dependencies.add(dep);
  };
  visit(name);

  const sorted = [...files].sort();
  const sheets = sorted.filter((f) => f.endsWith(".css"));
  return {
    files: sorted,
    stylesheets: [
      ...sheets.filter((f) => path.posix.basename(f) === "zoblocks-tokens.css"),
      ...sheets.filter((f) => path.posix.basename(f) !== "zoblocks-tokens.css"),
    ],
    npmDependencies: [...dependencies].sort(),
  };
}

/* ------------------------------------------------------------------ */
/* Lint rules                                                         */
/* ------------------------------------------------------------------ */

interface RuleModule {
  meta?: { docs?: { description?: string } };
}

/**
 * The invariants ZoBlocks enforces on its own source, in the rules' own words.
 * The plugin is not published, so these are guidance for generated code — not
 * something an agent can run in the customer's project.
 */
export function lintRules(): Array<{ id: string; description: string }> {
  const rules: Record<string, RuleModule> = eslintPlugin.rules;
  return Object.entries(rules)
    .map(([id, rule]) => ({
      id: `@zoblocks/${id}`,
      description: rule.meta?.docs?.description?.trim() ?? "",
    }))
    .filter((rule) => rule.description)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/* ------------------------------------------------------------------ */
/* Manifest                                                           */
/* ------------------------------------------------------------------ */

type DocsOnly = "props" | "variants" | "controls" | "seo" | "fixtures";

export type ManifestComponent = Omit<ComponentDoc, DocsOnly> & {
  availability: ReturnType<typeof distributionState>;
  /** Present only when the page exists — llms.txt learned not to link a 404. */
  docsUrl?: string;
  /** Where the named exports come from, in the customer's project. */
  importFrom: string;
  installs?: InstallClosure;
};

export function buildAiManifest(catalog: ComponentDoc[], graph: RegistryGraphItem[]) {
  const components: ManifestComponent[] = catalog
    .filter((c) => c.tier === "free")
    .map((doc) => {
      // Rest-destructuring is how the docs-only fields are dropped.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { props, variants, controls, seo, fixtures, ...rest } = doc;
      const availability = distributionState(doc.name);
      const registry = doc.distribution === "registry";
      return {
        ...rest,
        availability,
        ...(availability === "ready"
          ? { docsUrl: `${HOMEPAGE}/components/${doc.seo?.slug ?? doc.name}` }
          : {}),
        importFrom: registry ? `@/components/zoblocks/${doc.name}` : (doc.packageName ?? doc.name),
        ...(registry && availability !== "announced"
          ? { installs: installClosure(doc.name, graph) }
          : {}),
      };
    });

  const integration = {
    frameworks: FRAMEWORK_LABEL,
    reactFrameworks: REACT_FRAMEWORKS,
    alias: ALIAS_SETUP,
    globalStylesheet: GLOBAL_STYLESHEET,
    firstComponentUsage: FIRST_COMPONENT_USAGE,
    serverComponents: SERVER_COMPONENTS,
    styles: {
      zoblocks: { label: "ZoBlocks", summary: ZOBLOCKS_STYLE_SUMMARY },
      ...BRIDGED_STYLES,
    },
    clinicalColoursNote: CLINICAL_COLOURS_NOTE,
    webComponents: WEB_COMPONENTS,
  };

  const body = {
    name: "zoblocks",
    homepage: HOMEPAGE,
    registry: {
      index: `${HOMEPAGE}/r/index.json`,
      item: `${HOMEPAGE}/r/{name}.json`,
    },
    cli: {
      package: "@zoblocks/cli",
      init: "npx @zoblocks/cli init",
      add: "npx @zoblocks/cli add {name} --yes",
    },
    /*
     * How each package manager runs the CLI and adds packages, as templates.
     * Rendered by the same `toCommand` the /docs page uses, so the server
     * builds the lines a reader would copy — `{package}` and `{packages}` are
     * the only placeholders.
     */
    packageManagers: Object.fromEntries(
      PACKAGE_MANAGERS.map((pm) => [
        pm,
        { run: toCommand(pm, { dlx: "{package}" }), add: toCommand(pm, { add: "{packages}" }) },
      ]),
    ),
    scopeNote: SCOPE_NOTE,
    rules: CODING_RULES,
    lintRules: lintRules(),
    components,
    integration,
  };

  // A content hash rather than a timestamp: `gen --check` compares bytes, and
  // a clock would make every run stale. Same catalog, same hash — which is
  // also exactly what a server needs to report which catalog it is serving.
  const contentHash = createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 16);

  return { schemaVersion: AI_MANIFEST_SCHEMA_VERSION, contentHash, ...body };
}

export type AiManifest = ReturnType<typeof buildAiManifest>;

/* ------------------------------------------------------------------ */
/* Skill references                                                   */
/* ------------------------------------------------------------------ */

function fence(snippet: Snippet): string {
  return `\`${snippet.file}\`\n\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``;
}

function componentsMd(manifest: AiManifest): string {
  const rows = manifest.components.map((c) => {
    const install =
      c.availability === "announced" ? "not built yet" : `\`${tableCell(c.install)}\``;
    return `| ${tableCell(c.title)} (\`${tableCell(c.name)}\`) | \`${tableCell(c.importFrom)}\` | ${tableCell(c.summary)} | ${install} |`;
  });

  return `${GENERATED_MD}

# ZoBlocks components

Every component in the public catalog. **Use the MCP server when it is connected**
— \`get_component\` has the props, \`get_component_examples\` the code. This list
is the fallback, and it is enough to know what exists.

${SCOPE_NOTE}

| Component | Import from | What it is | Install |
| --- | --- | --- | --- |
${rows.join("\n")}
`;
}

function frameworksMd(manifest: AiManifest): string {
  const { integration } = manifest;
  const react = REACT_FRAMEWORKS.map((framework) => {
    const label = FRAMEWORK_LABEL[framework];
    const alias = framework === "vite" ? ALIAS_SETUP.vite : ALIAS_SETUP.next;
    const bridged = Object.values(BRIDGED_STYLES)
      .map((style) => {
        const setup = style.frameworks[framework];
        return [
          `#### ${style.label} (guide: ${style.guideUrl})`,
          "",
          `Install: \`${setup.packages}\``,
          "",
          ...setup.files.map(fence).flatMap((f) => [f, ""]),
          ...(setup.note ? [setup.note, ""] : []),
        ].join("\n");
      })
      .join("\n");

    return `## ${label}

### The @ alias

${alias.map(fence).join("\n\n")}

### Global stylesheet

One \`@import\` per \`zoblocks-*.css\` that \`add\` writes — tokens first. This one is for the Pulse Loader.

${fence(GLOBAL_STYLESHEET[framework])}

### Styles

- **ZoBlocks:** ${integration.styles.zoblocks.summary}

${bridged}
${CLINICAL_COLOURS_NOTE}
`;
  }).join("\n");

  const web = (
    Object.keys(WEB_COMPONENTS.frameworks) as Array<keyof typeof WEB_COMPONENTS.frameworks>
  )
    .map((f) => `### ${FRAMEWORK_LABEL[f]}\n\n${fence(WEB_COMPONENTS.frameworks[f])}`)
    .join("\n\n");

  return `${GENERATED_MD}

# Setting up ZoBlocks, per framework

React (Next.js App Router, Next.js Pages Router, Vite) gets every component, installed by the CLI. Vue, Angular, Svelte and plain HTML get only the loaders and the switch, as web components.

${react}
## Server Components (Next.js App Router only)

Components that need the browser declare their own \`"use client"\`; the rest render on the server. A page does not need \`"use client"\` to use them — but passing a function (\`onOpenReport\`, any \`on…\` prop) needs a Client Component.

${fence(SERVER_COMPONENTS.page)}

${fence(SERVER_COMPONENTS.clientWrapper)}

## Vue, Angular, Svelte and HTML

Install: \`${WEB_COMPONENTS.packages}\`. Elements: ${WEB_COMPONENTS.elements.map((e) => `\`<${e}>\``).join(", ")}.

${web}
`;
}

function conventionsMd(manifest: AiManifest): string {
  return `${GENERATED_MD}

# ZoBlocks conventions

## Rules for generated code

${manifest.rules.map((rule) => `- ${rule}`).join("\n")}
- ${CLINICAL_COLOURS_NOTE}

## Invariants ZoBlocks enforces on its own source

These are lint rules in the ZoBlocks repository. The plugin is not published,
so they cannot be run in your project — follow them in the code you write.

${manifest.lintRules.map((rule) => `- \`${rule.id}\` — ${rule.description}`).join("\n")}
`;
}

/** Bumped when a reader of `/ai/skill.json` would have to change to read it. */
export const SKILL_BUNDLE_SCHEMA_VERSION = 1;

/**
 * The skill as one JSON document, the way a registry item carries its source.
 * Served at `/ai/skill.json`, and emitted into the CLI as a module
 * (`emitCliSkill`) — `zoblocks skill add` writes from that, never from the
 * network, so what it puts in a repository is what the published tarball
 * contains.
 *
 * Built from the references this run just generated, not from disk, so the
 * bundle and the committed files can never be from different runs.
 */
export async function buildSkillBundle(references: Record<string, string>) {
  const skill = await readFile(path.join(paths.skillReferences, "..", "SKILL.md"), "utf8");
  return {
    schemaVersion: SKILL_BUNDLE_SCHEMA_VERSION,
    name: "zoblocks",
    files: [
      { path: "SKILL.md", content: skill },
      ...Object.entries(references).map(([file, content]) => ({
        path: `references/${file}`,
        content: content.endsWith("\n") ? content : `${content}\n`,
      })),
    ],
  };
}

export async function emitAiManifest(
  catalog: ComponentDoc[],
  graph: RegistryGraphItem[],
  emitter: Emitter,
): Promise<AiManifest> {
  const manifest = buildAiManifest(catalog, graph);
  const references = {
    "components.md": componentsMd(manifest),
    "frameworks.md": frameworksMd(manifest),
    "conventions.md": conventionsMd(manifest),
  };
  await emitter.emit(paths.aiManifest, JSON.stringify(manifest, null, 2));
  for (const [file, content] of Object.entries(references)) {
    await emitter.emit(path.join(paths.skillReferences, file), content);
  }
  const bundle = await buildSkillBundle(references);
  await emitter.emit(paths.skillBundle, JSON.stringify(bundle, null, 2));
  await emitter.emit(paths.cliSkill, cliSkillModule(bundle.files));
  return manifest;
}

/**
 * The skill as a TypeScript module in `@zoblocks/cli`. Generated, so the
 * CLI's copy and `skills/zoblocks` cannot drift (`pnpm gen --check` fails),
 * and plain data, so the CLI keeps its zero runtime dependencies.
 */
export function cliSkillModule(files: ReadonlyArray<{ path: string; content: string }>): string {
  return `${banner()}

/** The ZoBlocks coding skill, written by \`zoblocks skill add\`. Paths are relative to the skill folder. */
export const SKILL_FILES: ReadonlyArray<{ readonly path: string; readonly content: string }> = ${JSON.stringify(files, null, 2)};
`;
}

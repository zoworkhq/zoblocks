/**
 * The seven tools (ADR 0017). All read-only, all answered from the manifest.
 *
 * Everything is a tool, not a resource or a prompt, because GitHub's Copilot
 * cloud agent reads tools only — a fact reachable only as a resource would be
 * invisible there. Each answer is JSON in a text block, which every client
 * can read and every model can quote back accurately.
 *
 * The builders are pure functions of the manifest, exported so the tests can
 * assert on answers without a protocol round trip; `registerTools` only wires
 * them to names, schemas and annotations.
 */

import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { elementModule, findComponent, search, suggest, webComponentElements } from "./catalog.js";
import type { Framework, Manifest, ManifestComponent, ReactFramework } from "./manifest.js";

export const FRAMEWORKS = [
  "next-app",
  "next-pages",
  "vite",
  "vue",
  "angular",
  "svelte",
  "html",
] as const;
const REACT: readonly string[] = ["next-app", "next-pages", "vite"];
export const STYLES = ["zoblocks", "antd", "mui"] as const;
export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export class NotFound extends Error {
  readonly suggestions: string[];

  constructor(message: string, suggestions: string[]) {
    super(message);
    this.suggestions = suggestions;
  }
}

function resolve(manifest: Manifest, name: string): ManifestComponent {
  const component = findComponent(manifest, name);
  if (component) return component;
  const suggestions = suggest(manifest, name);
  throw new NotFound(
    `No ZoBlocks component "${name}".${suggestions.length ? ` Did you mean: ${suggestions.join(", ")}?` : ""} ${manifest.scopeNote}`,
    suggestions,
  );
}

/* ------------------------------------------------------------------ */
/* list_components / search_components                                */
/* ------------------------------------------------------------------ */

export function listComponents(
  manifest: Manifest,
  filter: { layer?: string; category?: string; status?: string; framework?: Framework },
) {
  const outsideReact = filter.framework && !REACT.includes(filter.framework);
  const elements = webComponentElements(manifest);
  const category = filter.category?.toLowerCase();

  const components = manifest.components
    .filter((c) => !filter.layer || c.layer === filter.layer)
    .filter((c) => !filter.status || c.status === filter.status)
    .filter((c) => !category || c.categories.some((cat) => cat.toLowerCase() === category))
    .filter((c) => !outsideReact || elements.has(c.name))
    .map((c) => ({
      element: elements.get(c.name),
      c,
    }))
    .map(({ c, element }) => ({
      name: c.name,
      title: c.title,
      summary: c.tagline ?? c.summary,
      layer: c.layer,
      status: c.status,
      availability: c.availability,
      ...(outsideReact && element
        ? { element: `<${element}>`, module: elementModule(element) }
        : { importFrom: c.importFrom, install: c.install }),
    }));

  return {
    catalog: { contentHash: manifest.contentHash, total: manifest.components.length },
    ...(outsideReact
      ? {
          note: `Outside React, only the loaders and the switch exist, as web components (${manifest.integration.webComponents.packages}).`,
        }
      : {}),
    components,
  };
}

export function searchComponents(manifest: Manifest, query: string, limit = 5) {
  const results = search(manifest, query, limit);

  /*
   * A component that *is* the thing matches on its name or an alias. One that
   * only mentions it — Tabs exports a TabsAddButton, a date picker opens "a
   * calendar behind a button" — is not an answer to "a button", and an agent
   * shown it first will use it as one. So the answer says which it is.
   */
  const named = results.some((r) =>
    r.matched.some((m) => m.startsWith("name:") || m.startsWith("alias:")),
  );

  return {
    query,
    results,
    ...(named
      ? {}
      : {
          note: results.length
            ? `No ZoBlocks component is a "${query}"; the results only mention it. ${manifest.scopeNote}`
            : `No ZoBlocks component matches "${query}". ${manifest.scopeNote}`,
        }),
  };
}

/* ------------------------------------------------------------------ */
/* get_component / get_component_examples                             */
/* ------------------------------------------------------------------ */

export const SECTIONS = [
  "overview",
  "props",
  "states",
  "guidance",
  "accessibility",
  "frameworks",
  "install",
  "related",
] as const;
type Section = (typeof SECTIONS)[number];

export function getComponent(
  manifest: Manifest,
  name: string,
  sections: readonly Section[] = SECTIONS,
) {
  const c = resolve(manifest, name);
  const want = new Set(sections);

  return {
    name: c.name,
    title: c.title,
    status: c.status,
    availability: c.availability,
    importFrom: c.importFrom,
    ...(c.docsUrl ? { docsUrl: c.docsUrl } : {}),
    ...(c.deprecation ? { deprecation: c.deprecation } : {}),
    ...(want.has("overview")
      ? { summary: c.summary, description: c.description, fhir: c.fhir, limitations: c.limitations }
      : {}),
    ...(want.has("props")
      ? {
          // Every exported component, each with the props extracted from its
          // TypeScript types. The only props that exist are these.
          exports: c.exports.map((e) => ({ name: e.name, props: e.props })),
        }
      : {}),
    ...(want.has("states") ? { states: c.states } : {}),
    ...(want.has("guidance")
      ? { guidance: c.guidance, ...(c.uxGuidelines ? { uxGuidelines: c.uxGuidelines } : {}) }
      : {}),
    ...(want.has("accessibility") ? { accessibility: c.accessibility } : {}),
    ...(want.has("frameworks") && c.frameworks ? { frameworks: c.frameworks } : {}),
    ...(want.has("install")
      ? {
          install: c.availability === "announced" ? null : c.install,
          ...(c.installs ? { stylesheets: c.installs.stylesheets } : {}),
        }
      : {}),
    ...(want.has("related")
      ? {
          related: c.related,
          ...(c.relationships?.alternatives?.length
            ? { alternatives: c.relationships.alternatives }
            : {}),
        }
      : {}),
    exampleIds: (c.examples ?? []).map((e) => e.id),
  };
}

export function getComponentExamples(manifest: Manifest, name: string, id?: string) {
  const c = resolve(manifest, name);
  const examples = c.examples ?? [];
  if (id && !examples.some((e) => e.id === id)) {
    throw new NotFound(
      `${c.name} has no example "${id}". Its examples: ${examples.map((e) => e.id).join(", ") || "none — use `usage`"}.`,
      examples.map((e) => e.id),
    );
  }
  return {
    name: c.name,
    importFrom: c.importFrom,
    usage: c.usage,
    examples: id ? examples.filter((e) => e.id === id) : examples,
  };
}

/* ------------------------------------------------------------------ */
/* get_installation                                                   */
/* ------------------------------------------------------------------ */

function fill(template: string, value: string): string {
  return template.replace(/\{package\}|\{packages\}/, value);
}

/** A stylesheet path as written in `from`, relative and with a leading `./`. */
function relativeImport(from: string, to: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), to);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

export function getInstallation(
  manifest: Manifest,
  input: { components: string[]; framework: Framework; packageManager?: string },
) {
  const pm =
    manifest.packageManagers[input.packageManager ?? "npm"] ?? manifest.packageManagers.npm;
  if (!pm) throw new Error("The catalog manifest has no package-manager commands.");
  const components = input.components.map((name) => resolve(manifest, name));
  const label = manifest.integration.frameworks[input.framework];

  if (!REACT.includes(input.framework)) {
    const elements = webComponentElements(manifest);
    const available = components.filter((c) => elements.has(c.name));
    const unavailable = components.filter((c) => !elements.has(c.name)).map((c) => c.name);
    return {
      framework: label,
      commands: available.length ? [fill(pm.add, manifest.integration.webComponents.packages)] : [],
      imports: available.map((c) => `import "${elementModule(elements.get(c.name) ?? c.name)}";`),
      elements: available.map((c) => `<${elements.get(c.name) ?? c.name}>`),
      ...(unavailable.length
        ? {
            unavailable,
            note: `Not available in ${label}: ${unavailable.join(", ")}. Outside React only the loaders and the switch exist, as web components.`,
          }
        : {}),
      setup:
        manifest.integration.webComponents.frameworks[
          input.framework as keyof typeof manifest.integration.webComponents.frameworks
        ],
    };
  }

  const framework = input.framework as ReactFramework;
  const registry = components.filter(
    (c) => c.distribution === "registry" && c.availability !== "announced",
  );
  const packages = components.filter(
    (c) => c.distribution === "package" && c.availability !== "announced",
  );
  const announced = components.filter((c) => c.availability === "announced").map((c) => c.name);

  const files = new Set<string>();
  const sheets: string[] = [];
  const npmDependencies = new Set<string>();
  for (const c of registry) {
    for (const file of c.installs?.files ?? []) files.add(`src/${file}`);
    for (const sheet of c.installs?.stylesheets ?? [])
      if (!sheets.includes(sheet)) sheets.push(sheet);
    for (const dep of c.installs?.npmDependencies ?? []) npmDependencies.add(dep);
  }
  // Tokens first, whichever component brought them: every other sheet reads them.
  sheets.sort(
    (a, b) =>
      Number(!a.endsWith("zoblocks-tokens.css")) - Number(!b.endsWith("zoblocks-tokens.css")),
  );

  const globalCss = manifest.integration.globalStylesheet[framework].file;
  const npmPackages = packages.flatMap((c) =>
    // `importFrom` is the package name for an npm-distributed component.
    c.frameworks?.antd?.policy === "wrapping" ? [c.importFrom, "antd"] : [c.importFrom],
  );

  const commands = [
    ...(registry.length
      ? [
          fill(pm.run, "@zoblocks/cli init"),
          fill(pm.run, `@zoblocks/cli add ${registry.map((c) => c.name).join(" ")} --yes`),
        ]
      : []),
    ...(npmPackages.length ? [fill(pm.add, [...new Set(npmPackages)].join(" "))] : []),
  ];

  return {
    framework: label,
    commands,
    ...(registry.length
      ? {
          filesWritten: [...files].sort(),
          npmDependencies: [...npmDependencies].sort(),
          globalStylesheet: globalCss,
          cssLines: [
            ...sheets.map((sheet) => `@import "${relativeImport(globalCss, `src/${sheet}`)}";`),
            `@source "${relativeImport(globalCss, "src/components/zoblocks")}";`,
          ],
        }
      : {}),
    ...(packages.length
      ? { packageImports: packages.map((c) => `import "${c.packageName}/styles.css";`) }
      : {}),
    imports: [...registry, ...packages].map(
      (c) =>
        `import { ${c.exports[0]?.name ?? c.title.replace(/\s+/g, "")} } from "${c.importFrom}";`,
    ),
    notes: [
      ...(registry.length
        ? [
            "`init` runs once per project. `--yes` lets `add` install the npm packages it needs.",
            `Put the cssLines under @import "tailwindcss"; in ${globalCss} — tokens first.`,
          ]
        : []),
      ...(framework === "vite" && registry.length
        ? ["Vite needs the @ alias in vite.config.ts and tsconfig — see get_framework_rules."]
        : []),
      ...(announced.length ? [`Announced, nothing to install yet: ${announced.join(", ")}.`] : []),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* get_framework_rules / get_conventions                              */
/* ------------------------------------------------------------------ */

export function getFrameworkRules(
  manifest: Manifest,
  input: { framework: Framework; style?: (typeof STYLES)[number] },
) {
  const { integration } = manifest;
  const style = input.style ?? "zoblocks";
  const label = integration.frameworks[input.framework];

  if (!REACT.includes(input.framework)) {
    return {
      framework: label,
      supported: integration.webComponents.elements.map((e) => `<${e}>`),
      packages: integration.webComponents.packages,
      setup:
        integration.webComponents.frameworks[
          input.framework as keyof typeof integration.webComponents.frameworks
        ],
      note: `Only the loaders and the switch exist outside React. No Tailwind, CLI or @ alias is needed.${style === "zoblocks" ? "" : ` The ${style} bridge is React-only.`}`,
    };
  }

  const framework = input.framework as ReactFramework;
  const bridged = style === "zoblocks" ? undefined : integration.styles[style];
  return {
    framework: label,
    alias: framework === "vite" ? integration.alias.vite : integration.alias.next,
    globalStylesheet: integration.globalStylesheet[framework],
    stylesheetNote:
      "One @import per zoblocks-*.css that `add` writes, tokens first, plus @source for the component folder. get_installation lists the exact lines.",
    style: bridged
      ? {
          name: bridged.label,
          summary: bridged.summary,
          guideUrl: bridged.guideUrl,
          packages: bridged.frameworks[framework].packages,
          files: bridged.frameworks[framework].files,
          ...(bridged.frameworks[framework].note
            ? { note: bridged.frameworks[framework].note }
            : {}),
          clinicalColours: integration.clinicalColoursNote,
        }
      : { name: integration.styles.zoblocks.label, summary: integration.styles.zoblocks.summary },
    ...(framework === "next-app"
      ? {
          serverComponents: {
            rule: 'Components that need the browser declare their own "use client"; the rest render on the server. A page does not need "use client" to use them — but passing a function (onOpenReport, any on… prop) needs a Client Component.',
            page: integration.serverComponents.page,
            clientWrapper: integration.serverComponents.clientWrapper,
          },
        }
      : {}),
  };
}

export function getConventions(manifest: Manifest) {
  return {
    catalog: { schemaVersion: manifest.schemaVersion, contentHash: manifest.contentHash },
    scope: manifest.scopeNote,
    rules: [...manifest.rules, manifest.integration.clinicalColoursNote],
    lintRules: {
      note: "Invariants ZoBlocks enforces on its own source. The plugin is not published — follow them in generated code.",
      rules: manifest.lintRules,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Registration                                                       */
/* ------------------------------------------------------------------ */

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function answer(build: () => unknown) {
  try {
    return { content: [{ type: "text" as const, text: JSON.stringify(build(), null, 2) }] };
  } catch (error) {
    if (error instanceof NotFound) {
      return { isError: true, content: [{ type: "text" as const, text: error.message }] };
    }
    throw error;
  }
}

export function registerTools(server: McpServer, manifest: Manifest): void {
  server.registerTool(
    "list_components",
    {
      title: "List ZoBlocks components",
      description:
        "List the components in the ZoBlocks catalog, optionally filtered. Pass `framework` to see only what exists there — outside React (vue, angular, svelte, html) that is the loaders and the switch.",
      inputSchema: z.object({
        layer: z.enum(["primitive", "clinical", "pattern", "block"]).optional(),
        category: z
          .string()
          .optional()
          .describe('A catalog category, e.g. "Clinical", "Feedback".'),
        status: z.enum(["experimental", "beta", "stable", "deprecated"]).optional(),
        framework: z.enum(FRAMEWORKS).optional(),
      }),
      annotations: READ_ONLY,
    },
    async (input) => answer(() => listComponents(manifest, input)),
  );

  server.registerTool(
    "search_components",
    {
      title: "Search ZoBlocks components",
      description:
        'Find the ZoBlocks component for a need ("lab result", "toggle", "patient banner", "FHIR Observation") before building one. Matches names, aliases, FHIR resources, categories, states and summaries.',
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(20).optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => answer(() => searchComponents(manifest, query, limit)),
  );

  server.registerTool(
    "get_component",
    {
      title: "Get a ZoBlocks component",
      description:
        "The contract for one component: its exports and every prop (extracted from its TypeScript types — no other props exist), states, guidance, accessibility, framework notes, install command and stylesheets. Accepts the catalog name, the export name (ResultValue) or an alias.",
      inputSchema: z.object({
        name: z.string().min(1),
        sections: z.array(z.enum(SECTIONS)).optional().describe("Limit the answer to these parts."),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, sections }) => answer(() => getComponent(manifest, name, sections)),
  );

  server.registerTool(
    "get_component_examples",
    {
      title: "Get ZoBlocks component examples",
      description:
        "Runnable usage for a component — the snippet its docs page leads with, and its named examples. Copy these rather than composing props from memory.",
      inputSchema: z.object({ name: z.string().min(1), id: z.string().optional() }),
      annotations: READ_ONLY,
    },
    async ({ name, id }) => answer(() => getComponentExamples(manifest, name, id)),
  );

  server.registerTool(
    "get_installation",
    {
      title: "Get ZoBlocks install steps",
      description:
        "Exact commands, files written, npm dependencies and stylesheet lines to install components in a project. Detect the framework from the project first: next-app (app/ directory), next-pages (pages/), vite, or vue/angular/svelte/html.",
      inputSchema: z.object({
        components: z.array(z.string().min(1)).min(1).max(20),
        framework: z.enum(FRAMEWORKS),
        packageManager: z
          .enum(PACKAGE_MANAGERS)
          .optional()
          .describe("From the project's lockfile. Default npm."),
      }),
      annotations: READ_ONLY,
    },
    async (input) => answer(() => getInstallation(manifest, input)),
  );

  server.registerTool(
    "get_framework_rules",
    {
      title: "Get ZoBlocks setup for a framework",
      description:
        "Setup for one framework and UI style: the @ alias, the global stylesheet, the Ant Design or Material UI provider and bridge (following each library's own Next.js guide), and Server Component rules for the App Router.",
      inputSchema: z.object({
        framework: z.enum(FRAMEWORKS),
        style: z
          .enum(STYLES)
          .optional()
          .describe("The UI library the app already uses. Default zoblocks (none)."),
      }),
      annotations: READ_ONLY,
    },
    async (input) => answer(() => getFrameworkRules(manifest, input)),
  );

  server.registerTool(
    "get_conventions",
    {
      title: "Get ZoBlocks conventions",
      description:
        "The rules for code that uses ZoBlocks — absent values, status and colour, Tailwind class names, clinical colours — what ZoBlocks does not ship, and the invariants its own source is held to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => answer(() => getConventions(manifest)),
  );
}

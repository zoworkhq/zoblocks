/**
 * Emits one StackBlitz project per documented example.
 *
 *   apps/docs/public/sandbox/<component>/<id>.json   the example's half
 *   apps/docs/src/lib/generated/sandboxes.ts         which examples have one
 *   apps/docs/src/lib/generated/example-modules.ts   the files, for the Preview tab
 *
 * An example is a file, `examples/<component>/<id>.tsx`. Its sandbox is that
 * file, every helper it imports, a Vite shell, and the names of the registry
 * items it needs; the browser fetches those items from `/r/` and lays their
 * files out where the CLI would (see apps/docs/src/lib/sandbox-project.ts). So
 * what opens in StackBlitz is the code on the page, running against the source
 * a customer installs — not a published npm build that may lag it, and not a
 * snippet rewritten on the way out.
 *
 * Nothing here decides by hand which examples run. An example with a file gets
 * a project; one without says why in `notRunnable`, or is reported as a
 * snippet still waiting to become a file. `pnpm sandboxes:check` then installs
 * and typechecks every project, which is what proves the button works.
 */

import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SandboxManifest } from "../../../apps/docs/src/lib/sandbox-project";
import { EXAMPLES_DIR, ROOT, banner, paths, rel } from "../config";
import type { LoadedComponent } from "../load";
import type { BuiltRegistryItem } from "./registry";
import type { Emitter } from "../write";

/*
 * The project's toolchain. Not read from the workspace: this repository builds
 * with Next and tests with Vitest, and has no Vite app whose versions these
 * could follow. Kept to what `npm run dev` needs, because every package here is
 * installed in the reader's browser before anything renders:
 *
 *   - no `typescript`. StackBlitz's editor brings its own language service, and
 *     the compiler is the largest package in the tree. `pnpm sandboxes:check`
 *     adds it for the typecheck.
 *   - Tailwind through its Vite plugin, as a consumer's project has it. Its
 *     in-browser build saved about three seconds of a ~35s cold start, which
 *     did not pay for a project that differs from the one readers build.
 *
 * Measured in content/decisions/0017-example-sandboxes-from-the-registry.md.
 */
const TOOLCHAIN: Readonly<Record<string, string>> = {
  "@tailwindcss/vite": "^4.3.3",
  "@types/react": "^19.3.0",
  "@types/react-dom": "^19.3.0",
  "@vitejs/plugin-react": "^5.0.0",
  tailwindcss: "^4.3.3",
  vite: "^7.1.0",
};

const IMPORT_SPECIFIER =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']/g;

function specifiersOf(source: string): string[] {
  return [...source.matchAll(IMPORT_SPECIFIER)].map((m) => (m[1] ?? m[2]) as string);
}

/** The package an import installs from: `@scope/name` or `name`. */
function packageOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] as string);
}

const RESOLVE_EXTENSIONS = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];

interface WorkspacePackage {
  version: string;
  private: boolean;
  /** Ships a stylesheet the component needs beside it, as `<name>/styles.css`. */
  styles: boolean;
}

interface Versions {
  workspace: Map<string, WorkspacePackage>;
  external: Map<string, string>;
}

/**
 * The version every dependency is installed at.
 *
 * External packages take the range this repository already builds against —
 * the examples package first, since it is what the example files resolve
 * from, then the docs app, the root, and any workspace package. A workspace package takes `^major.minor.0`:
 * the local version may be one patch ahead of npm between releases, and a
 * range on the minor still resolves to what is published.
 */
async function readVersions(): Promise<Versions> {
  const workspace = new Map<string, WorkspacePackage>();
  const external = new Map<string, string>();

  const manifests: Array<Record<string, unknown>> = [];
  for (const file of [
    path.join(EXAMPLES_DIR, "package.json"),
    path.join(ROOT, "apps", "docs", "package.json"),
    path.join(ROOT, "package.json"),
  ]) {
    manifests.push(JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>);
  }

  const packagesDir = path.join(ROOT, "packages");
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    const file = path.join(packagesDir, entry.name, "package.json");
    if (!entry.isDirectory() || !existsSync(file)) continue;
    const manifest = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>;
    manifests.push(manifest);
    const exports = (manifest.exports ?? {}) as Record<string, unknown>;
    workspace.set(manifest.name as string, {
      version: manifest.version as string,
      private: manifest.private === true,
      styles: "./styles.css" in exports,
    });
  }

  for (const manifest of manifests) {
    for (const field of ["dependencies", "peerDependencies", "devDependencies"]) {
      const deps = (manifest[field] ?? {}) as Record<string, string>;
      for (const [name, range] of Object.entries(deps)) {
        if (range.startsWith("workspace:") || external.has(name)) continue;
        external.set(name, range);
      }
    }
  }

  return { workspace, external };
}

/** A project, or the reason the example cannot have one. */
type Built = { manifest: SandboxManifest } | { notRunnable: string };

export async function emitSandboxes(
  components: LoadedComponent[],
  registryItems: BuiltRegistryItem[],
  emitter: Emitter,
): Promise<string[]> {
  const problems: string[] = [];
  const versions = await readVersions();
  const itemsByName = new Map(registryItems.map((item) => [item.name, item]));

  /** `@/lib/zoblocks-switch` → the item that installs `lib/zoblocks-switch.tsx`. */
  const itemByTarget = new Map<string, string>();
  for (const item of registryItems) {
    for (const file of item.files) {
      itemByTarget.set(`@/${file.target.replace(/\.(tsx|ts)$/, "")}`, item.name);
    }
  }

  const sandboxes: string[] = [];
  const notRunnable: Array<[string, string]> = [];
  const modules: string[] = [];
  const written = new Map<string, Set<string>>();

  // Pro examples stay out of public output entirely, as the registry's do.
  const publicComponents = components.filter((c) => c.meta.tier === "free");

  for (const component of publicComponents) {
    const name = component.meta.name;

    for (const example of component.examples) {
      const key = `${name}/${example.id}`;
      const file = component.exampleFiles.get(example.id);

      if (file) modules.push(key);

      if (example.notRunnable) {
        notRunnable.push([key, example.notRunnable]);
        continue;
      }
      if (!file) {
        notRunnable.push([
          key,
          `Written inline in ${name}'s metadata; move it to examples/${key}.tsx to run it.`,
        ]);
        continue;
      }

      const built = await buildSandbox({
        component,
        exampleId: example.id,
        title: example.title,
        file,
        versions,
        itemsByName,
        itemByTarget,
        problems,
      });
      if (!built) continue;
      if ("notRunnable" in built) {
        notRunnable.push([key, built.notRunnable]);
        continue;
      }

      sandboxes.push(key);
      await emitter.emit(
        path.join(paths.sandboxOut, name, `${example.id}.json`),
        JSON.stringify(built.manifest),
      );
      const kept = written.get(name) ?? new Set<string>();
      kept.add(`${example.id}.json`);
      written.set(name, kept);
    }
  }

  if (problems.length) return problems;

  // An example that stops being runnable, or is removed, must stop being served.
  if (existsSync(paths.sandboxOut)) {
    for (const entry of readdirSync(paths.sandboxOut, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      await emitter.prune(
        path.join(paths.sandboxOut, entry.name),
        written.get(entry.name) ?? new Set(),
        ".json",
      );
    }
  }

  await emitter.emit(
    paths.docsSandboxes,
    `${banner()}

/** Examples with a generated StackBlitz project, as \`component/id\`. */
export const SANDBOXES: ReadonlySet<string> = new Set<string>(${JSON.stringify(sandboxes, null, 2)});

/** Examples without one, and why. */
export const NOT_RUNNABLE: Readonly<Record<string, string>> = ${JSON.stringify(
      Object.fromEntries(notRunnable),
      null,
      2,
    )};
`,
  );

  await emitter.emit(
    paths.docsExampleModules,
    `${banner()}

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Every example file, loaded when its card renders. The Preview tab renders
 * the same file the Code tab shows and StackBlitz opens.
 */
export const EXAMPLE_MODULES: Readonly<Record<string, LazyExoticComponent<ComponentType>>> = {
${modules.map((key) => `  ${JSON.stringify(key)}: lazy(() => import(${JSON.stringify(`@examples/${key}`)})),`).join("\n")}
};
`,
  );

  return [];
}

async function buildSandbox(input: {
  component: LoadedComponent;
  exampleId: string;
  title: string;
  file: string;
  versions: Versions;
  itemsByName: Map<string, BuiltRegistryItem>;
  itemByTarget: Map<string, string>;
  problems: string[];
}): Promise<Built | null> {
  const { component, exampleId, title, file, versions, itemsByName, itemByTarget, problems } =
    input;
  const name = component.meta.name;
  const where = rel(file);

  /* The example and every local file it reaches, at their paths under src/examples. */
  const files: Record<string, string> = {};
  const roots = new Set<string>();
  const packages = new Set<string>(["react", "react-dom"]);
  const queue = [file];
  const seen = new Set<string>();

  while (queue.length) {
    const current = queue.shift() as string;
    if (seen.has(current)) continue;
    seen.add(current);

    const source = await readFile(current, "utf8");
    files[`src/examples/${path.relative(EXAMPLES_DIR, current).split(path.sep).join("/")}`] =
      source;

    for (const specifier of specifiersOf(source)) {
      if (specifier.startsWith(".")) {
        const base = path.resolve(path.dirname(current), specifier);
        const found = RESOLVE_EXTENSIONS.map((ext) => base + ext).find(
          (candidate) => existsSync(candidate) && !candidate.endsWith(path.sep),
        );
        if (!found || !found.startsWith(EXAMPLES_DIR + path.sep)) {
          problems.push(
            `${rel(current)}: "${specifier}" does not resolve to a file under examples/ — an example may import its own helpers and nothing else by relative path`,
          );
          continue;
        }
        queue.push(found);
      } else if (specifier.startsWith("@/")) {
        const item = itemByTarget.get(specifier);
        if (!item) {
          problems.push(
            `${rel(current)}: "${specifier}" is not installed by any public registry item, so the sandbox cannot provide it`,
          );
          continue;
        }
        roots.add(item);
      } else {
        packages.add(packageOf(specifier));
      }
    }
  }

  if (!/^export\s+default\b/m.test(files[`src/examples/${name}/${exampleId}.tsx`] ?? "")) {
    problems.push(`${where}: needs a default export — the Preview tab and the sandbox render it`);
    return null;
  }

  /* Registry items, transitively, as the CLI would install them. */
  const items: string[] = [];
  const pending = [...roots];
  while (pending.length) {
    const item = pending.shift() as string;
    if (items.includes(item)) continue;
    const built = itemsByName.get(item);
    if (!built) {
      problems.push(`${where}: needs registry item "${item}", which is not published`);
      return null;
    }
    items.push(item);
    for (const dependency of built.dependencies) packages.add(packageOf(dependency));
    for (const dependency of built.registryDependencies) {
      if (!dependency.includes("/")) pending.push(dependency);
    }
  }
  items.sort();

  /* Dependencies at the versions this repository builds against. */
  const dependencies: Record<string, string> = {};
  const stylesheets: string[] = [];
  for (const pkg of [...packages].sort()) {
    const local = versions.workspace.get(pkg);
    if (local) {
      if (local.private) {
        return { notRunnable: `Imports ${pkg}, which is not published to npm.` };
      }
      const [major, minor] = local.version.split(".");
      dependencies[pkg] = `^${major}.${minor}.0`;
      if (local.styles) stylesheets.push(`${pkg}/styles.css`);
      continue;
    }
    const range = versions.external.get(pkg);
    if (!range) {
      problems.push(
        `${where}: imports "${pkg}", which no package.json in this repository depends on — add it where the docs app can resolve it`,
      );
      return null;
    }
    dependencies[pkg] = range;
  }

  /* The shell. */
  const sheets = items
    .flatMap((item) => itemsByName.get(item)?.files ?? [])
    .map((f) => f.target)
    .filter((target) => target.endsWith(".css"))
    // Tokens first: every component sheet resolves through them.
    .sort(
      (a, b) => Number(!a.includes("tokens")) - Number(!b.includes("tokens")) || a.localeCompare(b),
    );

  const entry = `examples/${name}/${exampleId}`;
  files["src/main.tsx"] = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
${stylesheets.map((sheet) => `import "${sheet}";`).join("\n")}${stylesheets.length ? "\n" : ""}import "./index.css";
import Example from "./${entry}";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Example />
  </StrictMode>,
);
`;
  files["src/index.css"] = `@import "tailwindcss";
${sheets.map((sheet) => `@import "./${sheet}";`).join("\n")}

body {
  margin: 0;
  padding: 24px;
}
`;
  files["index.html"] = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} · ${component.meta.title} · ZoBlocks</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  files["vite.config.ts"] = `import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
`;
  files["tsconfig.json"] = `${JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        isolatedModules: true,
        types: ["vite/client"],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src"],
    },
    null,
    2,
  )}\n`;
  files["package.json"] = `${JSON.stringify(
    {
      name: `zoblocks-${name}-${exampleId}`,
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", typecheck: "tsc --noEmit" },
      dependencies,
      devDependencies: TOOLCHAIN,
    },
    null,
    2,
  )}\n`;
  files[".stackblitzrc"] = `${JSON.stringify(
    { installDependencies: true, startCommand: "npm run dev" },
    null,
    2,
  )}\n`;

  return {
    manifest: {
      title: `ZoBlocks ${component.meta.title} — ${title}`,
      description: `The "${title}" example from zoblocks.design/components/${name}.`,
      openFile: `src/${entry}.tsx`,
      items,
      files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
    },
  };
}

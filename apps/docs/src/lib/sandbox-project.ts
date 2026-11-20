/**
 * One example's StackBlitz project, put together from two halves.
 *
 * `pnpm gen` writes `public/sandbox/<component>/<id>.json`: the example file,
 * the helpers it imports, the Vite shell, and the *names* of the registry
 * items it needs. The items themselves are the documents already served at
 * `public/r/<name>.json` — the ones `zoblocks add` installs from — so the
 * sandbox runs the published source by construction, and the repository does
 * not carry a second copy of every component per example.
 *
 * Pure and dependency-free: the docs site assembles in the browser, and
 * `scripts/sandboxes-check.ts` assembles the same way in CI.
 */

export interface SandboxManifest {
  title: string;
  description: string;
  /** The file the editor opens on, e.g. `src/examples/switch/absence.tsx`. */
  openFile: string;
  /** Registry items whose files land at `src/<target>`, as the CLI writes them. */
  items: string[];
  /** Everything else: the example, its helpers, and the project shell. */
  files: Record<string, string>;
}

/** The part of a served registry document a sandbox reads. */
export interface RegistryDocument {
  name: string;
  files: Array<{ target: string; content: string }>;
}

/** Where a runnable example's two halves are served from. */
export function sandboxUrl(component: string, id: string): string {
  return `/sandbox/${component}/${id}.json`;
}

export function registryUrl(item: string): string {
  return `/r/${item}.json`;
}

/** The SDK's `Project`, kept structural so this module imports nothing. */
export interface SandboxProject {
  title: string;
  description: string;
  template: "node";
  files: Record<string, string>;
}

export function assembleProject(
  manifest: SandboxManifest,
  documents: readonly RegistryDocument[],
): SandboxProject {
  const files: Record<string, string> = {};
  for (const document of documents) {
    for (const file of document.files) files[`src/${file.target}`] = file.content;
  }
  // The manifest's own files win: they are the example, and nothing a
  // registry item installs should be able to replace it.
  Object.assign(files, manifest.files);
  return { title: manifest.title, description: manifest.description, template: "node", files };
}

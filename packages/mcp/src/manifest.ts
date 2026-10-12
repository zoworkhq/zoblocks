/**
 * The agent manifest: what the server knows, and how it gets it.
 *
 * `pnpm gen` writes the manifest from the component catalog (ADR 0017) and the
 * docs site serves it at `/ai/manifest.json`. This server never learns
 * anything any other way — no project files, no environment, no second source.
 *
 * Loading prefers the live file, because the registry always serves the
 * latest components and `zoblocks add` installs from it: a server describing
 * an older catalog than the CLI installs would describe components that are
 * no longer what lands. When the network is not there (offline, a locked-down
 * CI, a slow proxy) it falls back to the snapshot bundled at publish time,
 * and says so on stderr.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

/** The manifest schema this server reads. The generator bumps it on a breaking change. */
export const SUPPORTED_SCHEMA_VERSION = 1;

export const DEFAULT_REGISTRY = "https://zoblocks.design";

export interface Snippet {
  file: string;
  language: string;
  code: string;
}

export interface PropDoc {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: string;
}

export interface ManifestComponent {
  name: string;
  title: string;
  tier: string;
  status: string;
  since: string;
  layer: string;
  distribution: "registry" | "package";
  packageName?: string;
  frameworks?: Record<string, { policy: string; inherits?: string[]; bridge?: boolean }>;
  deprecation?: { deprecatedIn: string; removeIn: string; replacement?: string; reason: string };
  summary: string;
  tagline?: string;
  description: string;
  rationale: string;
  categories: string[];
  fhir: Array<{ name: string; url: string; note?: string }>;
  states: string[];
  exports: Array<{ name: string; props: PropDoc[] }>;
  usage: string;
  guidance: { use: string[]; avoid: string[] };
  accessibility: Array<{ label: string; detail: string }>;
  limitations: string[];
  related: string[];
  dependencies: string[];
  technicalName?: string;
  aliases?: string[];
  tags?: string[];
  uxGuidelines?: { do: string[]; dont: string[] };
  examples?: Array<{
    id: string;
    title: string;
    description: string;
    fixture?: string;
    code: string;
  }>;
  relationships?: { alternatives?: Array<{ ref: string; when: string }> };
  install: string;
  availability: "ready" | "installable" | "announced";
  docsUrl?: string;
  importFrom: string;
  installs?: { files: string[]; stylesheets: string[]; npmDependencies: string[] };
}

export type ReactFramework = "next-app" | "next-pages" | "vite";
export type WebComponentFramework = "vue" | "angular" | "svelte" | "html";
export type Framework = ReactFramework | WebComponentFramework;

export interface FrameworkStyleSetup {
  packages: string;
  files: Snippet[];
  note?: string;
}

export interface BridgedStyle {
  label: string;
  guideUrl: string;
  summary: string;
  frameworks: Record<ReactFramework, FrameworkStyleSetup>;
}

export interface Manifest {
  schemaVersion: number;
  contentHash: string;
  name: string;
  homepage: string;
  cli: { package: string; init: string; add: string };
  packageManagers: Record<string, { run: string; add: string }>;
  scopeNote: string;
  rules: string[];
  lintRules: Array<{ id: string; description: string }>;
  components: ManifestComponent[];
  integration: {
    frameworks: Record<Framework, string>;
    reactFrameworks: ReactFramework[];
    alias: { next: Snippet[]; vite: Snippet[] };
    globalStylesheet: Record<ReactFramework, Snippet>;
    firstComponentUsage: string;
    serverComponents: { page: Snippet; clientWrapper: Snippet };
    styles: {
      zoblocks: { label: string; summary: string };
      antd: BridgedStyle;
      mui: BridgedStyle;
    };
    clinicalColoursNote: string;
    webComponents: {
      packages: string;
      elements: string[];
      frameworks: Record<WebComponentFramework, Snippet>;
    };
  };
}

export class ManifestError extends Error {}

/*
 * Checked at the edges a stale or foreign file would break, not field by
 * field. The generator's own test suite proves the content; this proves the
 * server was handed a manifest it can read at all.
 */
const snippet = z.object({ file: z.string(), language: z.string(), code: z.string() });
const manifestSchema = z.looseObject({
  schemaVersion: z.number(),
  contentHash: z.string(),
  packageManagers: z.record(z.string(), z.object({ run: z.string(), add: z.string() })),
  scopeNote: z.string(),
  rules: z.array(z.string()),
  lintRules: z.array(z.object({ id: z.string(), description: z.string() })),
  components: z
    .array(
      z.looseObject({
        name: z.string(),
        title: z.string(),
        summary: z.string(),
        availability: z.enum(["ready", "installable", "announced"]),
        importFrom: z.string(),
        exports: z.array(z.looseObject({ name: z.string(), props: z.array(z.unknown()) })),
      }),
    )
    .min(1),
  integration: z.looseObject({
    globalStylesheet: z.record(z.string(), snippet),
    webComponents: z.looseObject({ elements: z.array(z.string()) }),
  }),
});

/** Validate a parsed manifest, refusing a schema this server does not understand. */
export function parseManifest(json: unknown): Manifest {
  const version = (json as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (typeof version === "number" && version !== SUPPORTED_SCHEMA_VERSION) {
    throw new ManifestError(
      version > SUPPORTED_SCHEMA_VERSION
        ? `The catalog uses manifest schema ${version}; this @zoblocks/mcp reads ${SUPPORTED_SCHEMA_VERSION}. Update it: npx -y @zoblocks/mcp@latest`
        : `The catalog uses manifest schema ${version}, older than this @zoblocks/mcp reads (${SUPPORTED_SCHEMA_VERSION}).`,
    );
  }
  const result = manifestSchema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new ManifestError(
      `The catalog manifest is not in the expected shape (${issue?.path.join(".") || "root"}: ${issue?.message}).`,
    );
  }
  return json as Manifest;
}

/**
 * Where the snapshot lives. Published, it is beside the compiled module in
 * `dist`. Running from `src` in a checkout, it is the file `pnpm gen` last
 * wrote — ahead of `dist`, whose copy is only as fresh as the last build and
 * went stale the first time the catalog changed between the two.
 */
function snapshotCandidates(): string[] {
  return [
    fileURLToPath(new URL("./manifest.json", import.meta.url)),
    fileURLToPath(new URL("../../../apps/docs/public/ai/manifest.json", import.meta.url)),
  ];
}

export function readSnapshot(candidates = snapshotCandidates()): Manifest {
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) {
    throw new ManifestError(
      "No bundled catalog snapshot was found. In a checkout, run `pnpm gen` first.",
    );
  }
  return parseManifest(JSON.parse(readFileSync(file, "utf8")));
}

export interface LoadOptions {
  /** Base URL of the registry to read — the public site unless a mirror is named. */
  registry?: string;
  /** Skip the network and use the bundled snapshot. */
  offline?: boolean;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  snapshot?: () => Manifest;
  log?: (line: string) => void;
}

export interface LoadedManifest {
  manifest: Manifest;
  source: "live" | "snapshot";
  from: string;
}

/**
 * `https://mirror.example/` → `https://mirror.example`. A loop rather than
 * `/\/+$/`: `--registry` is user input, and that regex backtracks
 * quadratically on a long run of slashes that does not end the string
 * (CodeQL js/polynomial-redos). This is linear whatever it is given.
 */
export function withoutTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

/** The live manifest when it answers, the bundled snapshot when it does not. */
export async function loadManifest(options: LoadOptions = {}): Promise<LoadedManifest> {
  const registry = withoutTrailingSlashes(options.registry ?? DEFAULT_REGISTRY);
  const url = `${registry}/ai/manifest.json`;
  const log = options.log ?? (() => {});
  const snapshot = options.snapshot ?? (() => readSnapshot());

  if (!options.offline) {
    try {
      const response = await (options.fetchImpl ?? fetch)(url, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(options.timeoutMs ?? 4000),
      });
      if (!response.ok) throw new ManifestError(`${response.status} from ${url}`);
      return { manifest: parseManifest(await response.json()), source: "live", from: url };
    } catch (error) {
      log(
        `zoblocks-mcp: could not read ${url} (${(error as Error).message}); using the bundled catalog.`,
      );
    }
  }

  return { manifest: snapshot(), source: "snapshot", from: "bundled snapshot" };
}

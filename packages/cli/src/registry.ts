/**
 * The registry client: turn what someone typed into registry items on disk.
 *
 * Three forms of specifier are accepted, and they are distinguished by shape
 * rather than by a flag:
 *
 *   vitals-panel                    the public catalog
 *   @oxygen-pro/vitals-flowsheet    a namespace declared in oxygen.json
 *   https://example.com/x.json      an absolute URL, taken literally
 *
 * The public catalog is built in rather than configured. A developer who has
 * just installed the CLI should be able to add a free component without first
 * writing a URL into a file, and a registry that cannot be shadowed by a local
 * config is also one that a compromised `oxygen.json` cannot redirect.
 */

import { PUBLIC_REGISTRY_URL, expandHeaders, type OxygenConfig } from "./config.js";
import { ITEM_SCHEMA_URL, parseRegistryItem, type RegistryItem } from "./schema.js";

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistryError";
  }
}

export interface ResolvedSpecifier {
  /** What the user typed. Used in messages, so it matches what they can edit. */
  raw: string;
  /** Registry namespace, or undefined for the public catalog / a bare URL. */
  namespace?: string;
  /** Item name, used to key the resolution cache. */
  name: string;
  url: string;
  headers: Record<string, string>;
}

export function resolveSpecifier(
  specifier: string,
  config: OxygenConfig,
  env: NodeJS.ProcessEnv,
): ResolvedSpecifier {
  if (/^https?:\/\//.test(specifier)) {
    return { raw: specifier, name: itemNameFromUrl(specifier), url: specifier, headers: {} };
  }

  if (specifier.startsWith("@")) {
    const slash = specifier.indexOf("/");
    if (slash === -1) {
      throw new RegistryError(
        `"${specifier}" names a registry but no component. Write it as "${specifier}/<component>".`,
      );
    }
    const namespace = specifier.slice(0, slash);
    const name = specifier.slice(slash + 1);
    const registry = config.registries[namespace];

    if (!registry) {
      const known = Object.keys(config.registries);
      throw new RegistryError(
        `Registry "${namespace}" is not configured in oxygen.json.\n\n` +
          (known.length
            ? `Configured: ${known.join(", ")}`
            : `Add it under "registries" — the console shows the exact block under Marketplace → Access tokens.`),
      );
    }

    return {
      raw: specifier,
      namespace,
      name,
      url: registry.url.replace("{name}", name),
      headers: expandHeaders(registry.headers, env, namespace),
    };
  }

  return {
    raw: specifier,
    name: specifier,
    url: PUBLIC_REGISTRY_URL.replace("{name}", specifier),
    headers: {},
  };
}

function itemNameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    return (
      pathname
        .split("/")
        .pop()
        ?.replace(/\.json$/, "") ?? url
    );
  } catch {
    return url;
  }
}

export interface FetchOptions {
  fetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
  /**
   * Populated with the items that were asked for by name, as opposed to the
   * ones pulled in behind them.
   *
   * An out-parameter rather than a richer return type, so the common call stays
   * a plain array. `add` uses it to report what came along; guessing instead —
   * by matching an item's `name` against the specifier — misreports whenever a
   * registry serves an item under a slug that differs from its name.
   */
  roots?: Set<RegistryItem>;
}

/**
 * Fetch one item.
 *
 * The status codes are translated rather than reported, because each one has
 * exactly one likely cause and the developer can act on the cause but not on
 * the number.
 */
export async function fetchItem(
  resolved: ResolvedSpecifier,
  options: FetchOptions = {},
): Promise<RegistryItem> {
  const doFetch = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await doFetch(resolved.url, {
      headers: { accept: "application/json", ...resolved.headers },
      redirect: "follow",
    });
  } catch (error) {
    throw new RegistryError(
      `Could not reach the registry for "${resolved.raw}".\n  ${resolved.url}\n  ${(error as Error).message}`,
    );
  }

  if (response.status === 401) {
    throw new RegistryError(
      `The registry rejected the credential for "${resolved.raw}".\n\n` +
        `Check that OXYGEN_TOKEN is set to a live token with the "registry" scope. ` +
        `A Figma-scoped token cannot install components.`,
    );
  }

  if (response.status === 404) {
    throw new RegistryError(
      resolved.namespace
        ? `"${resolved.raw}" is not available to your organisation.\n\n` +
            `Either the component does not exist, or nobody has purchased it yet. ` +
            `The console lists what you own under Marketplace.`
        : `"${resolved.raw}" is not in the Oxygen catalog.\n\n` +
            `Browse the catalog at https://oxygenui.design/components`,
    );
  }

  if (!response.ok) {
    throw new RegistryError(
      `The registry returned ${response.status} for "${resolved.raw}".\n  ${resolved.url}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new RegistryError(
      `The registry returned something that is not JSON for "${resolved.raw}".\n  ${resolved.url}`,
    );
  }

  const item = parseRegistryItem(json, resolved.raw);

  /*
   * A wrong `$schema` is a warning rather than a refusal.
   *
   * We publish the URL so tooling can pin it, but a self-hosted mirror that
   * omits or rewrites the field is still serving a document we just parsed
   * successfully. Refusing here would break mirrors to enforce a field that
   * validation has already made redundant.
   */
  if (item.$schema && item.$schema !== ITEM_SCHEMA_URL) {
    process.stderr.write(
      `  note  ${resolved.raw} declares an unfamiliar schema (${item.$schema}); parsed anyway.\n`,
    );
  }

  return item;
}

/**
 * Walk an item and everything it depends on, then order them so a dependency
 * is always written before whatever needs it.
 *
 * The `seen` map is keyed by resolved URL rather than by item name. Two
 * registries may both publish "utils", and treating them as the same item
 * because they share a basename would silently drop one.
 *
 * Order is produced by a depth-first topological sort rather than by reversing
 * the discovery order. Reversal is correct only while the graph is a tree: as
 * soon as two roots share a dependency — Timeline and CareTimeline both
 * needing `timeline-core` — the shared item lands after one of its dependents.
 * Nothing executes at install time, so the cost is a listing that misreads
 * rather than a broken install, but the ordering is claimed in the output and
 * should therefore be true.
 */
export async function collectItems(
  specifiers: string[],
  config: OxygenConfig,
  options: FetchOptions = {},
): Promise<RegistryItem[]> {
  const env = options.env ?? process.env;

  /** url → the item fetched from it, plus the urls it depends on. */
  const nodes = new Map<string, { item: RegistryItem; dependencies: string[] }>();
  const roots: string[] = [];

  const queue: ResolvedSpecifier[] = specifiers.map((s) => resolveSpecifier(s, config, env));
  for (const root of queue) roots.push(root.url);

  while (queue.length) {
    const current = queue.shift() as ResolvedSpecifier;
    if (nodes.has(current.url)) continue;

    const item = await fetchItem(current, options);
    const dependencies: string[] = [];

    /*
     * `registryDependencies` may be bare names or absolute URLs. A bare name
     * inside a namespaced item stays in that namespace, because a Pro
     * component depending on "utils" means that registry's "utils".
     */
    for (const dependency of item.registryDependencies ?? []) {
      const specifier = /^https?:\/\//.test(dependency)
        ? dependency
        : current.namespace
          ? `${current.namespace}/${dependency}`
          : dependency;
      const next = resolveSpecifier(specifier, config, env);
      dependencies.push(next.url);
      if (!nodes.has(next.url)) queue.push(next);
    }

    nodes.set(current.url, { item, dependencies });
  }

  const ordered: RegistryItem[] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();

  const visit = (url: string): void => {
    if (done.has(url)) return;
    /*
     * A cycle is survivable here and not worth refusing over. The registry
     * builder rejects unpublished dependencies, so a cycle means two items
     * that genuinely reference each other; both still need writing, and
     * bailing out would install neither. We stop descending and let the
     * second one land after the first.
     */
    if (visiting.has(url)) return;

    const node = nodes.get(url);
    if (!node) return;

    visiting.add(url);
    for (const dependency of node.dependencies) visit(dependency);
    visiting.delete(url);

    done.add(url);
    ordered.push(node.item);
  };

  for (const url of roots) {
    const node = nodes.get(url);
    if (node) options.roots?.add(node.item);
    visit(url);
  }
  // Anything reached only as a dependency of something already visited is
  // covered above; this catches items whose root was deduplicated away.
  for (const url of nodes.keys()) visit(url);

  return ordered;
}

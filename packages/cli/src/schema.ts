/**
 * The Oxygen registry wire format.
 *
 * Two documents are served:
 *
 *   - a **registry index** at `/r/index.json`, listing what exists;
 *   - a **registry item** at `/r/<name>.json`, carrying the source itself.
 *
 * Both are versioned by `$schema`, published at
 * https://oxygenui.design/schema/. The URL is not decoration: it is the
 * contract a customer's tooling can pin, and the thing that lets us add a
 * field without guessing whether an older client will choke on it.
 *
 * Validation here is hand-written rather than delegated to a schema library.
 * ADR 0009 makes every runtime dependency an architectural decision and this
 * binary writes files into a customer's repository, so its dependency tree is
 * the first thing a vendor security review opens. The cost is this file; the
 * benefit is that the tree is empty.
 *
 * The rule the validator follows: reject anything that would make us write a
 * file to the wrong place or with the wrong contents, and ignore anything we
 * merely do not recognise. Unknown fields are forward compatibility, not
 * corruption.
 */

/** Schema URLs. Emitted into every document we publish and checked on read. */
export const ITEM_SCHEMA_URL = "https://oxygenui.design/schema/registry-item.json";
export const REGISTRY_SCHEMA_URL = "https://oxygenui.design/schema/registry.json";

/**
 * What a file is, which decides where it lands.
 *
 * Our own vocabulary rather than an inherited one. The values map to alias
 * roots in `oxygen.json`, so adding a kind means deciding where it goes — the
 * enum and the alias table are two halves of one statement and live within a
 * few lines of each other in this package.
 */
export const FILE_KINDS = [
  "oxygen:component",
  "oxygen:lib",
  "oxygen:hook",
  "oxygen:ui",
  "oxygen:block",
  "oxygen:page",
  "oxygen:file",
  "oxygen:style",
] as const;

export type FileKind = (typeof FILE_KINDS)[number];

/** Item kinds. An item's kind is the kind of the thing as a whole. */
export const ITEM_KINDS = FILE_KINDS;
export type ItemKind = FileKind;

export interface RegistryFile {
  /** Path in the Oxygen repository. Provenance, not a destination. */
  path: string;
  type: FileKind;
  /**
   * Where this lands in the consumer's project, relative to the alias root for
   * its kind. Optional: absent means "derive it from `path`", which is right
   * for single-file components and wrong for anything that needs renaming.
   */
  target?: string;
  /** The source itself, inlined. */
  content: string;
}

export interface RegistryItem {
  $schema?: string;
  name: string;
  type: ItemKind;
  title: string;
  description: string;
  categories?: string[];
  /** npm packages the consumer must install. */
  dependencies?: string[];
  /** Other registry items, as bare names or absolute URLs. */
  registryDependencies?: string[];
  files: RegistryFile[];
}

export interface RegistryIndexEntry {
  name: string;
  /**
   * Not narrowed to `ItemKind`, deliberately — see `parseRegistryIndex`. The
   * index is a listing, and an unfamiliar kind in it is information we do not
   * have rather than a document we cannot trust.
   */
  type: string;
  title: string;
  description: string;
  categories?: string[];
  url: string;
}

export interface RegistryIndex {
  $schema?: string;
  name: string;
  homepage: string;
  items: RegistryIndexEntry[];
}

/** Raised for a document we will not act on. Carries the source for the message. */
export class RegistryFormatError extends Error {
  constructor(
    message: string,
    readonly source: string,
  ) {
    super(message);
    this.name = "RegistryFormatError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string, source: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RegistryFormatError(`${source}: "${field}" must be a non-empty string`, source);
  }
  return value;
}

function optionalStringArray(value: unknown, field: string, source: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new RegistryFormatError(`${source}: "${field}" must be an array of strings`, source);
  }
  return value as string[];
}

function requireKind(value: unknown, field: string, source: string): FileKind {
  const kind = requireString(value, field, source);
  if (!(FILE_KINDS as readonly string[]).includes(kind)) {
    throw new RegistryFormatError(
      `${source}: "${field}" is "${kind}", which this CLI does not understand. ` +
        `Known kinds: ${FILE_KINDS.join(", ")}. Upgrade @oxygenui-design/cli if the registry is newer than you are.`,
      source,
    );
  }
  return kind as FileKind;
}

/**
 * A path we are willing to write.
 *
 * The registry is a network document and its `target` becomes a filesystem
 * path, so this is the boundary where a hostile or merely broken document
 * turns into a file outside the project. Absolute paths and `..` segments are
 * refused here rather than resolved and checked later — the check is easier to
 * prove correct on the string than on the resolved path, and there is no
 * legitimate item that needs either.
 */
export function assertSafeTarget(target: string, source: string): string {
  if (target.startsWith("/") || /^[A-Za-z]:[\\/]/.test(target)) {
    throw new RegistryFormatError(
      `${source}: refusing an absolute target path "${target}"`,
      source,
    );
  }
  const segments = target.split(/[\\/]+/);
  if (segments.includes("..")) {
    throw new RegistryFormatError(
      `${source}: refusing a target path that escapes the project — "${target}"`,
      source,
    );
  }
  return target;
}

export function parseRegistryItem(raw: unknown, source: string): RegistryItem {
  if (!isRecord(raw)) {
    throw new RegistryFormatError(`${source}: expected a registry item object`, source);
  }

  const files = raw.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new RegistryFormatError(`${source}: "files" must be a non-empty array`, source);
  }

  const parsedFiles: RegistryFile[] = files.map((file, i) => {
    if (!isRecord(file)) {
      throw new RegistryFormatError(`${source}: files[${i}] is not an object`, source);
    }
    /*
     * `content` is required, and empty is a failure rather than a no-op.
     *
     * An item whose file arrived empty means the registry lost the source
     * somewhere between disk and wire. Writing the empty file would leave the
     * consumer with a component that imports cleanly and renders nothing —
     * the most expensive way to find out.
     */
    const content = file.content;
    if (typeof content !== "string" || content.trim() === "") {
      throw new RegistryFormatError(
        `${source}: files[${i}] has no content — the registry served an empty file`,
        source,
      );
    }
    const target =
      file.target === undefined
        ? undefined
        : requireString(file.target, `files[${i}].target`, source);
    return {
      path: requireString(file.path, `files[${i}].path`, source),
      type: requireKind(file.type, `files[${i}].type`, source),
      ...(target ? { target: assertSafeTarget(target, source) } : {}),
      content,
    };
  });

  return {
    ...(typeof raw.$schema === "string" ? { $schema: raw.$schema } : {}),
    name: requireString(raw.name, "name", source),
    type: requireKind(raw.type, "type", source),
    title: requireString(raw.title, "title", source),
    description: typeof raw.description === "string" ? raw.description : "",
    ...(optionalStringArray(raw.categories, "categories", source)
      ? { categories: optionalStringArray(raw.categories, "categories", source) }
      : {}),
    ...(optionalStringArray(raw.dependencies, "dependencies", source)
      ? { dependencies: optionalStringArray(raw.dependencies, "dependencies", source) }
      : {}),
    ...(optionalStringArray(raw.registryDependencies, "registryDependencies", source)
      ? {
          registryDependencies: optionalStringArray(
            raw.registryDependencies,
            "registryDependencies",
            source,
          ),
        }
      : {}),
    files: parsedFiles,
  };
}

/**
 * Parse the catalog listing.
 *
 * Deliberately more forgiving than `parseRegistryItem` about `type`. An item
 * document is the thing we write into somebody's repository, so refusing one we
 * do not fully understand is the conservative choice. The index is a listing
 * nobody installs from: `type` is printed and otherwise unused, and failing the
 * whole catalog because one entry has a kind this version has not heard of
 * would mean every future kind breaks `oxygen list` for every older CLI.
 *
 * This was found by running `oxygen list` against the live registry mid-migration
 * — it served the older `registry:*` kinds and the command reported nothing at
 * all, rather than the catalog it could plainly read.
 */
export function parseRegistryIndex(raw: unknown, source: string): RegistryIndex {
  if (!isRecord(raw)) {
    throw new RegistryFormatError(`${source}: expected a registry index object`, source);
  }
  const items = raw.items;
  if (!Array.isArray(items)) {
    throw new RegistryFormatError(`${source}: "items" must be an array`, source);
  }
  return {
    ...(typeof raw.$schema === "string" ? { $schema: raw.$schema } : {}),
    name: requireString(raw.name, "name", source),
    homepage: typeof raw.homepage === "string" ? raw.homepage : "",
    items: items.map((item, i) => {
      if (!isRecord(item)) {
        throw new RegistryFormatError(`${source}: items[${i}] is not an object`, source);
      }
      const categories = optionalStringArray(item.categories, `items[${i}].categories`, source);
      return {
        name: requireString(item.name, `items[${i}].name`, source),
        type: requireString(item.type, `items[${i}].type`, source),
        title: requireString(item.title, `items[${i}].title`, source),
        description: typeof item.description === "string" ? item.description : "",
        ...(categories ? { categories } : {}),
        url: requireString(item.url, `items[${i}].url`, source),
      };
    }),
  };
}

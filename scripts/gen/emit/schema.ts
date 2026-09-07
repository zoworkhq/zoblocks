/**
 * Emits the JSON Schema documents the registry and `zoblocks.json` declare.
 *
 * Every document we publish carries a `$schema` pointing at
 * https://zoblocks.design/schema/. That URL has to resolve, or the field is
 * decoration that editors silently fail to fetch and a customer pinning it
 * gets a 404 in their build.
 *
 * Generated rather than hand-written for the same reason the registry is: the
 * file-kind vocabulary lives in `@zoblocks/cli`, and a schema that
 * enumerates those kinds by hand goes stale the first time one is added.
 */

import path from "node:path";
import { FILE_KINDS } from "@zoblocks/cli";
import { HOMEPAGE, paths } from "../config";
import type { Emitter } from "../write";

const DRAFT = "https://json-schema.org/draft/2020-12/schema";

const registryFile = {
  type: "object",
  required: ["path", "type"],
  properties: {
    path: {
      type: "string",
      description: "Path in the ZoBlocks repository. Provenance, not a destination.",
    },
    type: { enum: [...FILE_KINDS] },
    target: {
      type: "string",
      description:
        "Where this lands in the consumer's project, relative to the alias root for its kind. Absent means derive it from `path`.",
    },
    content: {
      type: "string",
      description: "The source itself. Present in an item document, absent from the index.",
    },
  },
  additionalProperties: true,
} as const;

const itemProperties = {
  $schema: { type: "string" },
  name: { type: "string", description: "Registry name, URL slug, and directory name." },
  type: { enum: [...FILE_KINDS] },
  title: { type: "string" },
  description: { type: "string", description: "The install-time blurb." },
  categories: { type: "array", items: { type: "string" } },
  dependencies: {
    type: "array",
    items: { type: "string" },
    description: "npm packages the consumer must install.",
  },
  registryDependencies: {
    type: "array",
    items: { type: "string" },
    description: "Other registry items, as bare names or absolute URLs.",
  },
  files: { type: "array", items: registryFile },
} as const;

export async function emitSchemas(emitter: Emitter): Promise<void> {
  const item = {
    $schema: DRAFT,
    $id: `${HOMEPAGE}/schema/registry-item.json`,
    title: "ZoBlocks registry item",
    description:
      "One installable item: a component, a shared module, or a stylesheet, with its source inlined. Installed by @zoblocks/cli.",
    type: "object",
    required: ["name", "type", "title", "files"],
    properties: itemProperties,
    /*
     * Open, deliberately. A consumer pinned to an older schema must not fail
     * validation because we added a field — forward compatibility is the
     * reason the URL is versioned at all, and closing the object would make
     * every addition a breaking change.
     */
    additionalProperties: true,
  };

  const registry = {
    $schema: DRAFT,
    $id: `${HOMEPAGE}/schema/registry.json`,
    title: "ZoBlocks registry",
    description: "The manifest of every item a registry serves.",
    type: "object",
    required: ["name", "homepage", "items"],
    properties: {
      $schema: { type: "string" },
      name: { type: "string" },
      homepage: { type: "string", format: "uri" },
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "type", "title"],
          properties: itemProperties,
          additionalProperties: true,
        },
      },
    },
    additionalProperties: true,
  };

  const config = {
    $schema: DRAFT,
    $id: `${HOMEPAGE}/schema/zoblocks.json`,
    title: "zoblocks.json",
    description:
      "Install configuration for @zoblocks/cli: where components land in this project, and which registries it may reach.",
    type: "object",
    properties: {
      $schema: { type: "string" },
      root: {
        type: "string",
        default: "src",
        description:
          'Directory this project\'s "@/" import alias resolves to. Every registry target is written beneath it.',
      },
      registries: {
        type: "object",
        description: "Namespaced registries, keyed by a name beginning with '@'.",
        propertyNames: { pattern: "^@" },
        additionalProperties: {
          type: "object",
          required: ["url"],
          properties: {
            url: {
              type: "string",
              description: "A URL template containing {name}.",
              pattern: "\\{name\\}",
            },
            headers: {
              type: "object",
              additionalProperties: { type: "string" },
              description:
                "Sent with every request. Write credentials as ${ENV_VAR}; the CLI refuses a literal token, because this file is meant to be committed.",
            },
          },
          additionalProperties: true,
        },
      },
    },
    additionalProperties: true,
  };

  for (const [name, document] of [
    ["registry-item.json", item],
    ["registry.json", registry],
    ["zoblocks.json", config],
  ] as const) {
    await emitter.emit(path.join(paths.schemaOut, name), `${JSON.stringify(document, null, 2)}\n`);
  }
}

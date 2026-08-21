/**
 * Reads the DTCG token source off disk.
 *
 * The *model* — types, constants, reference helpers, and the DTCG flattener —
 * now lives in `@oxygenui-design/tokens/validate`, because the theme app
 * has to build a `TokenSource` from a payload a customer typed rather than
 * from files. This module is the filesystem half of that split and nothing
 * more.
 *
 * It re-exports the model so every existing importer keeps working against
 * `./load` — the seam moved, the call sites did not.
 *
 * See content/decisions/0005-three-tier-token-pipeline.md.
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "../config";
import {
  DENSITIES,
  flattenDtcg,
  type Brand,
  type DensityName,
  type DtcgNode,
  type TokenMap,
  type TokenSource,
} from "@oxygenui-design/tokens/validate";

export {
  DENSITIES,
  DEFAULT_DENSITY,
  THEMES,
  cssVar,
  referenceTarget,
  toCssValue,
  flattenDtcg,
} from "@oxygenui-design/tokens/validate";
export type {
  Brand,
  DensityName,
  DtcgNode,
  Theme,
  Token,
  TokenMap,
  TokenSource,
} from "@oxygenui-design/tokens/validate";

export const TOKENS_DIR = path.join(ROOT, "packages", "tokens", "tokens");

async function readDoc(relative: string): Promise<{ doc: DtcgNode; file: string }> {
  const file = path.join(TOKENS_DIR, relative);
  const raw = await readFile(file, "utf8");
  try {
    return { doc: JSON.parse(raw) as DtcgNode, file: relative };
  } catch (error) {
    throw new Error(`${relative} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }
}

async function load(relative: string): Promise<TokenMap> {
  const { doc, file } = await readDoc(relative);
  return flattenDtcg(doc, file);
}

/**
 * Reads every `brands/*.json`.
 *
 * Absent directory, or only the README, is the normal case and not an error —
 * most installs have no customer brand.
 */
async function loadBrands(): Promise<Brand[]> {
  const dir = path.join(TOKENS_DIR, "brands");
  if (!existsSync(dir)) return [];

  const files = (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();

  const brands: Brand[] = [];
  for (const file of files) {
    const name = file.replace(/\.json$/, "");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      throw new Error(
        `brands/${file}: name must be kebab-case — it becomes the [data-ox-brand] value and a CSS attribute selector`,
      );
    }
    const map = await load(path.join("brands", file));
    const doc = JSON.parse(await readFile(path.join(dir, file), "utf8")) as {
      $description?: string;
    };

    for (const key of map.keys()) {
      if (!key.startsWith("ref.")) {
        throw new Error(
          `brands/${file}: "${key}" is not a primitive. A brand overrides the palette (ref.*), never the semantic tier — that is what keeps "critical" meaning the same thing for every customer.`,
        );
      }
    }

    brands.push({ name, description: doc.$description, primitive: map });
  }
  return brands;
}

export async function loadTokenSource(): Promise<TokenSource> {
  const [primitive, shared, light, dark, highContrast, densityDoc, component] = await Promise.all([
    load("primitive.json"),
    load("semantic/shared.json"),
    load("semantic/light.json"),
    load("semantic/dark.json"),
    load("semantic/high-contrast.json"),
    load("density.json"),
    load("component.json"),
  ]);

  // Density arrives as one document holding all three profiles. Split it so the
  // parity check has three comparable key spaces rather than one flat list in
  // which a missing key looks like a different key.
  const density = {} as Record<DensityName, TokenMap>;
  for (const name of DENSITIES) density[name] = new Map();
  const densityRoot: TokenMap = new Map();

  for (const [dotted, token] of densityDoc) {
    const [head, ...rest] = dotted.split(".");
    if (head === "density" && rest.length >= 2) {
      const profile = rest[0] as DensityName;
      if (!DENSITIES.includes(profile)) {
        throw new Error(`density.json defines unknown profile "${profile}"`);
      }
      const key = rest.slice(1).join("-");
      density[profile].set(key, { ...token, path: key });
      continue;
    }
    densityRoot.set(dotted, token);
  }

  return {
    primitive,
    shared,
    semantic: { light, dark, "high-contrast": highContrast },
    density,
    densityRoot,
    component,
    brands: await loadBrands(),
  };
}

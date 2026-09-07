/**
 * Figma's variables as the plain snapshot `figma-core` expects.
 *
 * This is the whole of the adapter. It resolves mode ids to the names a
 * designer sees, turns Figma's `{r,g,b}` floats into the colour shape the core
 * uses, keeps an alias as an alias, and recovers ZoBlocks identity from plugin
 * data rather than from the label.
 *
 * The alias case is the one worth stating. Figma returns an alias as a
 * *variable id*, which means nothing to a token system; resolving it to the
 * target's token name is what lets the diff say "this still points where it
 * should" rather than comparing two opaque strings. A dangling alias — the
 * target deleted, or in a library this file cannot see — is dropped rather
 * than guessed at.
 */

import {
  figmaRgbToHex,
  type PlannedValue,
  type SnapshotVariable,
  type VariableSnapshot,
} from "@zoblocks/figma-core";

import type { CollectionSummary } from "../protocol";

import {
  isAlias,
  isRgba,
  type FigmaReadApi,
  type FigmaVariable,
  type FigmaVariableCollection,
  type FigmaVariableValue,
} from "./api";

/** The plugin-data keys this plugin stamps. Identity survives a rename. */
export const TOKEN_KEY = "ox.token";
export const TIER_KEY = "ox.tier";
export const LOCKED_KEY = "ox.locked";

export interface ReadResult {
  snapshot: VariableSnapshot;
  collections: CollectionSummary[];
}

export async function readFile(figma: FigmaReadApi): Promise<ReadResult> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync("COLOR");

  const byId = new Map(collections.map((c) => [c.id, c]));
  const tokenById = new Map<string, string>();
  for (const variable of variables) {
    const token = variable.getPluginData(TOKEN_KEY);
    if (token) tokenById.set(variable.id, token);
  }

  const snapshot: VariableSnapshot = { variables: [] };
  const counts = new Map<string, { stamped: number; colours: number }>();

  for (const variable of variables) {
    const collection = byId.get(variable.variableCollectionId);
    if (!collection) continue;

    const token = tokenById.get(variable.id);
    const entry: SnapshotVariable = {
      ...(token ? { token } : {}),
      name: variable.name,
      collection: collection.name,
      values: readValues(variable, collection, tokenById),
    };
    snapshot.variables.push(entry);

    const count = counts.get(collection.name) ?? { stamped: 0, colours: 0 };
    count.colours += 1;
    if (token) count.stamped += 1;
    counts.set(collection.name, count);
  }

  return {
    snapshot,
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => m.name),
      stamped: counts.get(c.name)?.stamped ?? 0,
      colours: counts.get(c.name)?.colours ?? 0,
    })),
  };
}

/**
 * Keyed by mode *name*, not mode id.
 *
 * Ids are per-file and meaningless outside it; the snapshot crosses a
 * `postMessage` boundary and is compared against a plan that knows only
 * "light", "dark" and "high-contrast". Resolving the name here is what makes
 * the rest of the system able to say anything about a mode at all.
 */
function readValues(
  variable: FigmaVariable,
  collection: FigmaVariableCollection,
  tokenById: Map<string, string>,
): SnapshotVariable["values"] {
  const names = new Map(collection.modes.map((m) => [m.modeId, m.name]));
  const values: SnapshotVariable["values"] = {};

  for (const [modeId, raw] of Object.entries(variable.valuesByMode)) {
    const name = names.get(modeId);
    if (!name) continue;
    const value = toPlanned(raw, tokenById);
    if (value) values[modeKey(name)] = value;
  }
  return values;
}

/**
 * The mode names this plugin creates are the theme names, and a single-mode
 * collection's mode is conventionally called "Mode 1" or "Default". Anything
 * that is not a theme name is stored under `default`, which is the key
 * `figma-core` already reads when a named mode is absent.
 */
function modeKey(name: string): keyof SnapshotVariable["values"] {
  const lower = name.trim().toLowerCase();
  if (lower === "light" || lower === "dark" || lower === "high-contrast") return lower;
  return "default";
}

function toPlanned(
  raw: FigmaVariableValue,
  tokenById: Map<string, string>,
): PlannedValue | undefined {
  if (isAlias(raw)) {
    const token = tokenById.get(raw.id);
    // A dangling alias, or one into a library this file cannot read. Dropped
    // rather than invented: an alias to nothing is not a value.
    return token ? { kind: "alias", token } : undefined;
  }
  if (isRgba(raw)) {
    const rgb = { r: raw.r, g: raw.g, b: raw.b };
    // Both, because `PlannedValue` carries both: the floats are what Figma
    // holds, and the hex is what the diff compares — 0.1 + 0.2 is not a colour
    // question, and every colour that returns from Figma has been rounded.
    return { kind: "color", hex: figmaRgbToHex(rgb), rgb };
  }
  if (typeof raw === "string") return { kind: "string", value: raw };
  if (typeof raw === "number") return { kind: "number", value: raw };
  return undefined;
}

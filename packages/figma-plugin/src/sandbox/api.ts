/**
 * The part of the Figma plugin API this plugin actually uses.
 *
 * Declared here rather than taken from `@figma/plugin-typings`, for two
 * reasons. The narrow one is that a structural interface can be satisfied by a
 * fake object, so `read.ts` — which contains real work: mode resolution, alias
 * detection, plugin-data lookup — is testable in vitest without a Figma
 * runtime. The broader one is that this file is a written record of the
 * plugin's blast radius. Every capability it holds is on this page, and adding
 * one is a diff somebody reviews.
 *
 * It was read-only until the pull direction existed. It is not any more, and
 * the boundary that replaced "cannot write" is worth stating precisely, because
 * "we preview first" is a weaker promise than a missing function:
 *
 *   - **There is no `remove`, on anything.** Not on a variable, not on a
 *     collection, not on a mode. A pull can create and it can set; it cannot
 *     delete. Orphans are listed and left, which is why the preview can say "no
 *     longer in this theme" without that being a threat.
 *   - **Nothing here publishes.** Figma's library-publishing API is absent, so
 *     a pull changes a file and never what other files inherit.
 *   - **Writes are reached through `applyPull` only**, which takes a diff it did
 *     not compute. The sandbox cannot decide to change something.
 */

/** Figma's colour, and the only value shape this plugin reads. */
export interface FigmaRgba {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export type FigmaVariableValue = FigmaRgba | FigmaVariableAlias | string | number | boolean;

export interface FigmaMode {
  modeId: string;
  name: string;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: FigmaMode[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  valuesByMode: Record<string, FigmaVariableValue>;
  getPluginData(key: string): string;
}

export interface FigmaReadApi {
  variables: {
    getLocalVariableCollectionsAsync(): Promise<FigmaVariableCollection[]>;
    getLocalVariablesAsync(type?: string): Promise<FigmaVariable[]>;
  };
}

/* ==========================================================================
 * Writing. Everything below exists for the pull direction.
 * ======================================================================== */

/** A collection the plugin may add modes to and stamp. Never remove from. */
export interface FigmaWritableCollection extends FigmaVariableCollection {
  addMode(name: string): string;
  renameMode(modeId: string, name: string): void;
  setPluginData(key: string, value: string): void;
  getPluginData(key: string): string;
}

export interface FigmaWritableVariable extends FigmaVariable {
  description: string;
  setValueForMode(modeId: string, value: FigmaVariableValue): void;
  setPluginData(key: string, value: string): void;
}

/**
 * Where the credential lives.
 *
 * `clientStorage` is per-user and per-plugin, on this machine — not in the
 * document. A token written into the file would travel with it: into every
 * branch, every duplicate, and every copy shared with an agency.
 */
export interface FigmaClientStorage {
  getAsync(key: string): Promise<unknown>;
  setAsync(key: string, value: unknown): Promise<void>;
  deleteAsync(key: string): Promise<void>;
}

export interface FigmaWriteApi extends FigmaReadApi {
  clientStorage: FigmaClientStorage;
  variables: FigmaReadApi["variables"] & {
    createVariableCollection(name: string): FigmaWritableCollection;
    createVariable(
      name: string,
      collection: FigmaWritableCollection,
      type: "COLOR" | "STRING" | "FLOAT" | "BOOLEAN",
    ): FigmaWritableVariable;
    getVariableByIdAsync(id: string): Promise<FigmaWritableVariable | null>;
    getVariableCollectionByIdAsync(id: string): Promise<FigmaWritableCollection | null>;
  };
}

export function isAlias(value: FigmaVariableValue): value is FigmaVariableAlias {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS"
  );
}

export function isRgba(value: FigmaVariableValue): value is FigmaRgba {
  return (
    typeof value === "object" && value !== null && "r" in value && "g" in value && "b" in value
  );
}

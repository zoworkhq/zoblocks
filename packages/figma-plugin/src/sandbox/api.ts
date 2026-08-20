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
 * It is deliberately read-only. There is no `createVariable`, no
 * `setValueForMode`, no `remove`. Phase 2 reports; Phase 4 earns the right to
 * write by previewing every change first.
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

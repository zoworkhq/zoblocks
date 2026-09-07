/**
 * Reading a snapshot, without knowing it came from Figma.
 *
 * `VariableSnapshot` is `figma-core`'s plain shape — the one the sandbox
 * produces and the one the panel receives across `postMessage`. These are the
 * two questions the gate asks of it, kept here so both the sandbox and the UI
 * answer them the same way.
 */

import type { SnapshotVariable, VariableSnapshot } from "@zoblocks/figma-core";

/**
 * One variable's colour in one mode, as hex.
 *
 * An alias returns nothing rather than being followed. Following it would mean
 * reporting a ratio for a value this variable does not hold — and in a file
 * where the semantic tier aliases the brand tier, which is the shape this
 * plugin's own push direction creates, every semantic variable would otherwise
 * be measured twice under two different names.
 */
export function colourAt(variable: SnapshotVariable, mode: string): string | undefined {
  const value = variable.values[mode as keyof typeof variable.values] ?? variable.values.default;
  if (!value || value.kind !== "color") return undefined;
  return value.hex;
}

/**
 * Zoblocks token to hex, for the variables in one collection that carry a stamp.
 *
 * Keyed on the stamped token rather than the label, because the label belongs
 * to the designer. A file where somebody renamed `accent` to `Brand blue`
 * should still be measured; a file where somebody named an unrelated swatch
 * `accent` should not.
 */
export function stampedTokens(
  snapshot: VariableSnapshot,
  collection: string,
  mode: string,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const variable of snapshot.variables) {
    if (variable.collection !== collection || !variable.token) continue;
    const hex = colourAt(variable, mode);
    if (hex) out.set(variable.token, hex);
  }
  return out;
}

/** Whether a collection carries any Zoblocks identity at all, in any mode. */
export function hasStamps(snapshot: VariableSnapshot, collection: string): boolean {
  return snapshot.variables.some((v) => v.collection === collection && Boolean(v.token));
}

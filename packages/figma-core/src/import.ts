/**
 * Figma variables read back as Oxygen token overrides.
 *
 * The return shape is deliberately the one `importDtcg` already produces —
 * `{ matched, unmatched, discardedClinical }` — because a designer pulling
 * their own file back should meet the same report an app user meets when
 * they import a DTCG file. Two vocabularies for one operation is how a product
 * teaches somebody that two features are unrelated when they are the same one.
 */

import { figmaRgbToHex } from "./color";
import type { SnapshotVariable, VariableSnapshot } from "./diff";

export interface ImportReport {
  /** Token name to hex, for everything this accepts. */
  matched: Record<string, string>;
  /** Variables that are not Oxygen tokens, by the label a designer sees. */
  unmatched: string[];
  /**
   * Clinical tokens found and refused, by name.
   *
   * Named rather than dropped. A theme that quietly loses a clinical signal
   * renders correctly and passes every other check, which is exactly what makes
   * it the failure worth reporting.
   */
  discardedClinical: string[];
}

export interface ImportOptions {
  /** Token names a customer may not set. The refusal list. */
  locked?: readonly string[];
  /** Which mode to read. Defaults to the light theme. */
  mode?: string;
}

export function fromVariables(
  snapshot: VariableSnapshot,
  options: ImportOptions = {},
): ImportReport {
  const locked = new Set(options.locked ?? []);
  const mode = options.mode ?? "light";

  const matched: Record<string, string> = {};
  const unmatched: string[] = [];
  const discardedClinical: string[] = [];

  for (const variable of snapshot.variables) {
    if (!variable.token) {
      unmatched.push(variable.name);
      continue;
    }

    if (locked.has(variable.token)) {
      discardedClinical.push(variable.token);
      continue;
    }

    const value = pick(variable, mode);
    if (value === undefined) continue;
    matched[variable.token] = value;
  }

  return { matched, unmatched: unmatched.sort(), discardedClinical: discardedClinical.sort() };
}

/**
 * One mode's value as hex, or nothing.
 *
 * An alias is skipped rather than resolved: it means "whatever that token is",
 * which is not a value this customer has chosen, and importing the resolved
 * colour would turn a link into a literal — flattening the tiering that the
 * push direction went to trouble to create.
 */
function pick(variable: SnapshotVariable, mode: string): string | undefined {
  const value = variable.values[mode as keyof typeof variable.values] ?? variable.values.default;
  if (!value) return undefined;
  if (value.kind === "color") return figmaRgbToHex(value.rgb);
  return undefined;
}

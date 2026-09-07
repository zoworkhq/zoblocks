/**
 * A file, as the sandbox would have read it.
 *
 * Built through `hexToFigmaRgb` rather than by writing floats out, so the
 * fixture cannot drift from the conversion the real adapter performs — a
 * hand-written `0.094` would quietly become a different colour from the one the
 * hex says.
 */

import {
  hexToFigmaRgb,
  type FigmaRgb,
  type SnapshotVariable,
  type VariableSnapshot,
} from "@zoblocks/figma-core";

/**
 * A hex the fixture insists is a colour.
 *
 * `hexToFigmaRgb` returns `undefined` for anything it cannot parse, which is
 * correct for real input and useless here: a fixture with a typo in it should
 * stop the test rather than quietly build a variable with no value.
 */
export function rgb(hex: string): FigmaRgb {
  const parsed = hexToFigmaRgb(hex);
  if (!parsed) throw new Error(`Fixture hex is not a colour: ${hex}`);
  return parsed;
}

export function colour(
  name: string,
  hex: string,
  options: { token?: string; collection?: string; mode?: string } = {},
): SnapshotVariable {
  const mode = options.mode ?? "light";
  return {
    ...(options.token ? { token: options.token } : {}),
    name,
    collection: options.collection ?? "ZoBlocks / Semantic",
    values: { [mode]: { kind: "color", hex, rgb: rgb(hex) } },
  };
}

export function snapshot(variables: SnapshotVariable[]): VariableSnapshot {
  return { variables };
}

/**
 * A palette that passes everything the gate checks, in light.
 *
 * Values are the ones ZoBlocks ships, so a test that asserts a ratio here is
 * asserting something about the real design system rather than about a number
 * invented to make a test pass.
 */
export const PASSING: Record<string, string> = {
  "--zb-text": "#16181d",
  "--zb-text-muted": "#4b5563",
  "--zb-text-subtle": "#5b6474",
  "--zb-text-on-accent": "#ffffff",
  "--zb-bg": "#ffffff",
  "--zb-bg-subtle": "#f6f8fa",
  "--zb-bg-muted": "#eef1f5",
  "--zb-surface": "#ffffff",
  "--zb-accent": "#1851a5",
  "--zb-accent-hover": "#134286",
  "--zb-focus-ring": "#1851a5",
  "--zb-border-strong": "#6b7684",
  "--zb-status-critical": "#b4232b",
  "--zb-status-critical-bg": "#fdeced",
  "--zb-status-high": "#8a4b06",
  "--zb-status-high-bg": "#fdf1e2",
  "--zb-status-low": "#1a4fa0",
  "--zb-status-low-bg": "#e9f0fc",
  "--zb-status-normal": "#14683f",
  "--zb-status-normal-bg": "#e6f4ec",
  "--zb-status-unknown": "#4b5563",
  "--zb-status-unknown-bg": "#f0f2f5",
  /*
   * Restricted and provisional are part of the status family and were missing
   * here, so `report.missing` carried two entries and the two tests asserting
   * an empty gate had been red since the pair was added to contrast.json. The
   * fixture is a synthetic palette that passes rather than the shipped one, so
   * these are chosen to clear the 4.5:1 floor with room, not copied from
   * tokens.json.
   */
  /*
   * The label on a filled neutral — the Switch's off word on its off track.
   * White, because `border-strong` is a mid-grey in every theme and the pair
   * is held to 4.5:1 (7:1 in high contrast).
   */
  "--zb-text-on-fill": "#ffffff",
  "--zb-status-restricted": "#5b21b6",
  "--zb-status-restricted-bg": "#f5f3ff",
  "--zb-status-provisional": "#0b5c70",
  "--zb-status-provisional-bg": "#ecfeff",
  "--zb-flag-restricted": "#8a1c22",
  "--zb-flag-restricted-bg": "#fdeced",
  "--zb-flag-provisional": "#7a4a05",
  "--zb-flag-deceased": "#4b5563",
};

/** Every token above as a stamped variable in one collection, in one mode. */
export function zoblocksFile(
  over: Record<string, string> = {},
  mode = "light",
  collection = "ZoBlocks / Semantic",
): VariableSnapshot {
  const values = { ...PASSING, ...over };
  return snapshot(
    Object.entries(values).map(([token, hex]) =>
      colour(token.replace("--zb-", ""), hex, { token, collection, mode }),
    ),
  );
}

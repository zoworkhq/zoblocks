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
} from "@oxygenui-design/figma-core";

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
    collection: options.collection ?? "Oxygen / Semantic",
    values: { [mode]: { kind: "color", hex, rgb: rgb(hex) } },
  };
}

export function snapshot(variables: SnapshotVariable[]): VariableSnapshot {
  return { variables };
}

/**
 * A palette that passes everything the gate checks, in light.
 *
 * Values are the ones Oxygen ships, so a test that asserts a ratio here is
 * asserting something about the real design system rather than about a number
 * invented to make a test pass.
 */
export const PASSING: Record<string, string> = {
  "--ox-text": "#16181d",
  "--ox-text-muted": "#4b5563",
  "--ox-text-subtle": "#5b6474",
  "--ox-text-on-accent": "#ffffff",
  "--ox-bg": "#ffffff",
  "--ox-bg-subtle": "#f6f8fa",
  "--ox-bg-muted": "#eef1f5",
  "--ox-surface": "#ffffff",
  "--ox-accent": "#1851a5",
  "--ox-accent-hover": "#134286",
  "--ox-focus-ring": "#1851a5",
  "--ox-border-strong": "#6b7684",
  "--ox-status-critical": "#b4232b",
  "--ox-status-critical-bg": "#fdeced",
  "--ox-status-high": "#8a4b06",
  "--ox-status-high-bg": "#fdf1e2",
  "--ox-status-low": "#1a4fa0",
  "--ox-status-low-bg": "#e9f0fc",
  "--ox-status-normal": "#14683f",
  "--ox-status-normal-bg": "#e6f4ec",
  "--ox-status-unknown": "#4b5563",
  "--ox-status-unknown-bg": "#f0f2f5",
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
  "--ox-text-on-fill": "#ffffff",
  "--ox-status-restricted": "#5b21b6",
  "--ox-status-restricted-bg": "#f5f3ff",
  "--ox-status-provisional": "#0b5c70",
  "--ox-status-provisional-bg": "#ecfeff",
  "--ox-flag-restricted": "#8a1c22",
  "--ox-flag-restricted-bg": "#fdeced",
  "--ox-flag-provisional": "#7a4a05",
  "--ox-flag-deceased": "#4b5563",
};

/** Every token above as a stamped variable in one collection, in one mode. */
export function oxygenFile(
  over: Record<string, string> = {},
  mode = "light",
  collection = "Oxygen / Semantic",
): VariableSnapshot {
  const values = { ...PASSING, ...over };
  return snapshot(
    Object.entries(values).map(([token, hex]) =>
      colour(token.replace("--ox-", ""), hex, { token, collection, mode }),
    ),
  );
}

/**
 * An in-memory token source.
 *
 * That this file can exist at all is the point of extracting the validator:
 * the gate used to be reachable only by putting JSON on disk and running the
 * generator, so nothing could hand it a deliberately broken palette and check
 * that it objected. Every test below builds a source in memory, which is also
 * exactly what the theme app does with a payload a customer typed.
 */

import {
  DENSITIES,
  THEMES,
  type Brand,
  type DensityName,
  type Theme,
  type TokenMap,
  type TokenSource,
} from "../src/validate";

export function map(entries: Record<string, string>, file = "fixture"): TokenMap {
  const out: TokenMap = new Map();
  for (const [path, value] of Object.entries(entries)) {
    out.set(path, { path, value, file });
  }
  return out;
}

/** The semantic keys every theme must define, with values that all pass. */
const SEMANTIC: Record<string, string> = {
  bg: "#ffffff",
  "bg-subtle": "#f8fafc",
  "bg-muted": "#f1f5f9",
  surface: "#ffffff",
  border: "#e2e8f0",
  "border-strong": "#5a6b67",
  text: "#0f172a",
  "text-muted": "#475569",
  "text-subtle": "#5b6b7c",
  "text-on-accent": "#ffffff",
  accent: "#067662",
  "accent-hover": "#0a5d4f",
  "focus-ring": "#046b57",
  "status.critical": "#b91c1c",
  "status.critical-bg": "#fef2f2",
  "status.high": "#b45309",
  "status.high-bg": "#fffbeb",
  "status.low": "#2563eb",
  "status.low-bg": "#eff6ff",
  "status.normal": "#047857",
  "status.normal-bg": "#ecfdf5",
  "status.unknown": "#5a6b67",
  "status.unknown-bg": "#f8fafc",
  "flag.restricted": "#b91c1c",
  "flag.restricted-bg": "#fef2f2",
  "flag.provisional": "#4a5a68",
  "flag.deceased": "#4a5a68",
};

/**
 * High contrast holds text to 7:1 and interface components to 4.5:1, so it
 * cannot reuse the light values — the shipped light palette sits around 5–6:1
 * and correctly fails there. Reusing it was the first thing this fixture got
 * wrong, and the validator caught it, which is a reasonable advertisement for
 * the gate.
 */
const HIGH_CONTRAST: Record<string, string> = {
  bg: "#ffffff",
  "bg-subtle": "#ffffff",
  "bg-muted": "#ffffff",
  surface: "#ffffff",
  border: "#333333",
  "border-strong": "#333333",
  text: "#000000",
  "text-muted": "#1a1a1a",
  "text-subtle": "#333333",
  "text-on-accent": "#ffffff",
  accent: "#00453a",
  "accent-hover": "#003029",
  "focus-ring": "#00453a",
  "status.critical": "#8c0000",
  "status.critical-bg": "#ffffff",
  "status.high": "#5c3300",
  "status.high-bg": "#ffffff",
  "status.low": "#002d80",
  "status.low-bg": "#ffffff",
  "status.normal": "#004d26",
  "status.normal-bg": "#ffffff",
  "status.unknown": "#333333",
  "status.unknown-bg": "#ffffff",
  "flag.restricted": "#8c0000",
  "flag.restricted-bg": "#ffffff",
  "flag.provisional": "#333333",
  "flag.deceased": "#333333",
};

/**
 * A source that passes every check. Tests mutate one thing and assert one
 * problem, so a failure names the rule that fired rather than a list.
 */
export function validSource(overrides: Partial<TokenSource> = {}): TokenSource {
  const semantic = {} as Record<Theme, TokenMap>;
  for (const theme of THEMES) {
    semantic[theme] = map(theme === "high-contrast" ? HIGH_CONTRAST : SEMANTIC);
  }

  const density = {} as Record<DensityName, TokenMap>;
  for (const profile of DENSITIES) {
    density[profile] = map({ "row-height": "2.5rem", gap: "1rem", target: "2.75rem" });
  }

  return {
    primitive: map({ "ref.brand.600": "#067662", "ref.brand.700": "#0a5d4f" }),
    shared: map({ "font-sans": "system-ui", radius: "0.5rem" }),
    semantic,
    density,
    densityRoot: map({}),
    component: map({ "badge.critical-fg": "{status.critical}" }),
    brands: [],
    ...overrides,
  };
}

export function brand(name: string, primitive: Record<string, string>): Brand {
  return { name, primitive: map(primitive) };
}

/** Every problem message joined, for substring assertions. */
export function text(problems: { message: string }[]): string {
  return problems.map((p) => p.message).join("\n");
}

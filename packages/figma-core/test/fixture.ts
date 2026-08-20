import type { ResolvedTheme } from "../src/plan";

/** The eleven steps, as `generateRamp` produces them from a 600 anchor. */
export const RAMP: Record<string, string> = {
  "50": "#f2f6fd",
  "100": "#e4eefb",
  "200": "#c1d6f6",
  "300": "#90b6ef",
  "400": "#5a94e7",
  "500": "#2e76e1",
  "600": "#1d63c9",
  "700": "#1851a5",
  "800": "#134286",
  "900": "#0f3568",
  "950": "#0a2143",
};

/** The clinical tokens, which must arrive locked and never come back. */
export const CLINICAL = [
  "--ox-status-critical",
  "--ox-status-high",
  "--ox-status-low",
  "--ox-status-normal",
  "--ox-status-unknown",
];

export function theme(over: Partial<ResolvedTheme> = {}): ResolvedTheme {
  return {
    ramp: RAMP,
    semantic: {
      light: {
        // Exactly the 700 step: this must become an alias, not a literal.
        "--ox-accent": "#1851a5",
        "--ox-text": "#16181d",
        "--ox-bg": "#ffffff",
        "--ox-status-critical": "#b4232b",
      },
      dark: {
        "--ox-accent": "#5a94e7",
        "--ox-text": "#e8ecf1",
        "--ox-bg": "#0e1116",
        "--ox-status-critical": "#f08b96",
      },
      "high-contrast": {
        "--ox-accent": "#0f3568",
        "--ox-text": "#000000",
        "--ox-bg": "#ffffff",
        "--ox-status-critical": "#8c0d16",
      },
    },
    locked: Object.fromEntries(
      CLINICAL.map((token) => [
        token,
        "Clinical. Carries a validated contrast floor and 60° of hue separation.",
      ]),
    ),
    ...over,
  };
}

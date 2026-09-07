/**
 * The shapes, and the numbers that govern how they move.
 *
 * This is the single source of truth for both delivery channels: the custom
 * elements in this package and the React components in the ZoBlocks registry.
 * `test/loader-parity.test.ts` at the repository root asserts the two agree, so
 * a path edited here and not there fails the build rather than shipping two
 * loaders that are subtly different shapes.
 *
 * The geometry was measured from the reference animation rather than redrawn.
 * The heart is open at both sides at mid-height: that gap is what the rhythm
 * line passes through, and closing it turns a clinical mark into a valentine.
 */

export const LOADER_ART = {
  /** Upper lobes of the heart, open at both sides. */
  heartTop:
    "M135.6 58.3 C137 55.3 138.2 52.3 139 49.3 C140.1 45.6 140.7 42 140.8 38.5 C140.8 38.2 140.8 37.9 140.8 37.6 C140.8 20.4 129.2 6.4 109.5 6.4 C89.9 6.4 78.3 30 78.3 30 C78.3 30 66.7 6.4 47 6.4 C27.3 6.4 15.8 20.4 15.8 37.6 C15.8 37.9 15.8 38.2 15.8 38.5 C15.9 43.2 16.9 48 18.7 52.8",
  /** Lower V of the heart. */
  heartBottom: "M128.5 71 C110.3 98.1 78.4 121.6 78.4 121.6 C78.4 121.6 46.3 97.9 28.1 70.5",
  /** The rhythm line that crosses the heart through the gap. */
  heartLine:
    "M5 63.6 L29.4 63.6 C32.7 63.6 35.6 61.5 36.6 58.3 L43 39.3 C43.7 37.2 46.7 37.6 46.9 39.7 L49.5 63.6 L58.8 63.6 C60.6 63.6 62.2 64.8 62.8 66.5 L69.1 87.7 C70.1 91.1 74.9 91.3 76.1 88 L84.2 66.6 C84.9 64.8 86.6 63.6 88.6 63.6 L101.3 63.6 L108.5 40.9 C109.3 38.5 112.8 38.7 113.3 41.1 L117.3 59.6 C117.8 61.9 119.9 63.6 122.3 63.6 L154.9 63.6",
  /** A standalone rhythm strip: one PQRST complex on a baseline. */
  strip:
    "M0 36 L40 36 C44 36 46 30 50 30 C54 30 56 36 60 36 L72 36 L76 40 L82 10 L88 48 L92 36 L110 36 C114 36 116 26 122 26 C128 26 130 36 134 36 L200 36",
} as const;

export const LOADER_VIEWBOX = {
  pulse: "-4 -4 168 136",
  rhythm: "-4 -2 208 68",
  breath: "0 0 120 120",
  helix: "0 0 160 60",
  infusion: "0 0 160 48",
} as const;

/** Art width in pixels for each named size. */
export const LOADER_SIZE_PX = {
  sm: 20,
  md: 32,
  lg: 56,
  xl: 88,
} as const;

export type LoaderSize = keyof typeof LOADER_SIZE_PX;

/** Below this the heart's detail collapses and the rhythm line takes over. */
export const PULSE_MIN_SIZE_PX = 40;

/** Columns per helix strand. Nine reads as a helix; fewer reads as dots. */
export const HELIX_COLUMNS = 9;

/** Geometry of the infusion capsule, in viewBox units. */
export const INFUSION = {
  slugMin: 30,
  slugMax: 136,
  driftWidth: 48,
} as const;

/**
 * Said once so that five loaders and two delivery channels cannot each invent
 * their own wording. Names the situation and what remains possible.
 */
export const DEFAULT_SLOW_HINT = "Still loading. You can keep waiting or go back.";

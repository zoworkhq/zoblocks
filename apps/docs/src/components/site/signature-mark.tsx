/**
 * A signature, drawn by the real engine — ahead of time.
 *
 * The catalog's rule is that a card shows the actual component. Signature
 * cannot follow that literally: it wraps Ant Design, and the docs site does not
 * carry antd. Pulling a component framework into the marketing bundle to fill a
 * 92-pixel cell is the wrong trade.
 *
 * So the geometry below is not hand-drawn — it is the output of
 * `toInkPaths()` from `@oxygenui-design/signature-core`, the exact function the
 * live pad calls on every pointer move, run over the fixed stroke model in
 * `SIGNATURE_STROKES`. Variable width, smoothing and decimation are all the
 * component's own.
 *
 * It is baked rather than computed at render time for two reasons. The model is
 * constant, so recomputing it per request is waste; and `signature-core` uses
 * `.js` ESM specifiers, which Turbopack does not map back to `.ts` — importing
 * it here would mean either shipping a built copy or fighting the bundler's
 * resolver for a result that never changes.
 *
 * `packages/signature-core/test/docs-mark.test.ts` regenerates it and fails if
 * this file has drifted, so "the engine's output" stays a fact rather than a
 * claim. That test also prints the refreshed data when it fails.
 */

/** The sampled stroke model. Exported so the drift test can re-run the engine. */
export const SIGNATURE_STROKES = [
  [
    [8, 44, 0],
    [14, 24, 34],
    [22, 12, 68],
    [31, 16, 102],
    [34, 34, 136],
    [30, 52, 170],
    [22, 60, 204],
    [18, 54, 238],
    [24, 40, 272],
    [36, 34, 306],
    [46, 40, 340],
    [48, 52, 374],
    [42, 58, 408],
    [38, 48, 442],
    [44, 34, 476],
    [56, 28, 510],
    [66, 34, 544],
    [68, 48, 578],
    [62, 56, 612],
    [58, 46, 646],
    [64, 32, 680],
    [78, 22, 714],
    [92, 26, 748],
    [98, 40, 782],
    [94, 54, 816],
    [86, 58, 850],
    [84, 46, 884],
    [92, 34, 918],
    [106, 30, 952],
    [120, 38, 986],
    [126, 52, 1020],
  ],
  // The cross-stroke every scrawled signature ends with.
  [
    [16, 62, 1120],
    [48, 58, 1146],
    [86, 61, 1172],
    [124, 57, 1198],
  ],
] as const;

/** `toInkPaths(SIGNATURE_STROKES)`. Regenerate via the drift test, never by hand. */
export const SIGNATURE_PATHS: ReadonlyArray<{ d: string; width: number }> = [
  { d: "M 8 44 L 14 24", width: 1.84 },
  { d: "M 14 24 L 22 12", width: 2.05 },
  { d: "M 22 12 L 31 16", width: 2.21 },
  { d: "M 31 16 L 34 34", width: 2.19 },
  { d: "M 34 34 L 30 52", width: 2.13 },
  { d: "M 30 52 L 22 60", width: 2.24 },
  { d: "M 22 60 L 18 54", width: 2.41 },
  { d: "M 18 54 L 24 40", width: 2.42 },
  { d: "M 24 40 L 36 34", width: 2.34 },
  { d: "M 36 34 L 46 40", width: 2.33 },
  { d: "M 46 40 L 48 52", width: 2.42 },
  { d: "M 48 52 L 42 58", width: 2.49 },
  { d: "M 42 58 L 38 48", width: 2.46 },
  { d: "M 38 48 L 44 34", width: 2.37 },
  { d: "M 44 34 L 56 28", width: 2.3 },
  { d: "M 56 28 L 66 34", width: 2.3 },
  { d: "M 66 34 L 68 48", width: 2.36 },
  { d: "M 68 48 L 62 56", width: 2.41 },
  { d: "M 62 56 L 58 46", width: 2.41 },
  { d: "M 58 46 L 64 32", width: 2.31 },
  { d: "M 64 32 L 78 22", width: 2.18 },
  { d: "M 78 22 L 92 26", width: 2.13 },
  { d: "M 92 26 L 98 40", width: 2.17 },
  { d: "M 98 40 L 94 54", width: 2.26 },
  { d: "M 94 54 L 86 58", width: 2.36 },
  { d: "M 86 58 L 84 46", width: 2.4 },
  { d: "M 84 46 L 92 34", width: 2.34 },
  { d: "M 92 34 L 106 30", width: 2.23 },
  { d: "M 106 30 L 120 38", width: 2.17 },
  { d: "M 120 38 L 126 52", width: 2.15 },
  { d: "M 16 62 L 48 58", width: 1.08 },
  { d: "M 48 58 L 86 61", width: 1.08 },
  { d: "M 86 61 L 124 57", width: 1.08 },
];

export function SignatureMark({ size = 92 }: { size?: number }) {
  return (
    <svg
      viewBox="0 4 134 68"
      width={size * 1.45}
      height={size * 0.74}
      // Decorative inside a card whose link already carries the name.
      aria-hidden="true"
      focusable="false"
      style={{ maxWidth: "100%" }}
    >
      {SIGNATURE_PATHS.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill="none"
          // currentColor, exactly as the component does — it is what keeps a
          // stored signature legible in dark mode and under forced colors.
          stroke="currentColor"
          strokeWidth={path.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* The baseline the pad shows, at the same proportion. */}
      <line
        x1="6"
        y1="70"
        x2="128"
        y2="70"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.28"
      />
    </svg>
  );
}

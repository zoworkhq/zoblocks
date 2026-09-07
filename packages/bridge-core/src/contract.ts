/**
 * The theme-bridge contract.
 *
 * A bridge translates one UI framework's resolved theme into Zoblocks's
 * component token surface. It renders nothing, owns no state, and imports no
 * component — which is what keeps a UI framework out of the module graph of
 * every consumer who did not ask for one.
 *
 * The shape is deliberately small. Under an adapter architecture this file
 * would define a component interface and every framework would implement it;
 * that abstraction collapses to what all frameworks share, which does not
 * include the third `Switch` value or the commit phase machine. Here the only
 * thing crossing the boundary is a set of CSS custom properties, so nothing a
 * component can do is constrained by what a framework cannot express.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

/**
 * A set of custom-property declarations, ready to spread onto an element's
 * `style`.
 *
 * Keyed by the full property name (`--zb-accent`) rather than a token path, so
 * a bridge's output is inspectable as exactly what will land in the DOM.
 */
export type TokenPatch = Record<`--${string}`, string | number | undefined>;

/**
 * What a bridge is.
 *
 * `HostTheme` is the framework's own resolved theme object — antd's
 * `theme.useToken()` result, MUI's `useTheme()` result. The bridge never reads
 * it from a hook itself: the React wrapper does that and hands it in, so the
 * mapping stays a pure function that a test can call with a literal.
 */
export interface BridgeDefinition<HostTheme> {
  /** Stable id. Becomes the `data-zb-bridge` attribute and the npm suffix. */
  readonly id: string;

  /** Human name for docs and error messages. */
  readonly framework: string;

  /**
   * The peer range this bridge is written against, as a single major.
   *
   * Deliberately not a `>=5 || >=6` range. A bridge written against v6 token
   * names reads `undefined` on v5, and `undefined` in a custom property means
   * "fall through to the next stop in the chain" — so the failure is a
   * component quietly wearing Zoblocks's defaults instead of the customer's
   * brand. No error, no warning, no failing test. One major per bridge is what
   * makes that a resolution error instead.
   */
  readonly supports: string;

  /**
   * The mapping. Returns only the tokens with an honest counterpart.
   *
   * Every value is optional and omitting one is the correct way to say "this
   * framework has no equivalent". A bridge that fills every slot by
   * approximation produces a component that is uniformly slightly wrong, which
   * is harder to diagnose than one that is partly unthemed — and the
   * stylesheet's own fallback chain is a better answer than a guess.
   */
  map(theme: HostTheme): TokenPatch;

  /**
   * Per-component geometry the semantic tier cannot carry.
   *
   * The documented exception, kept small on purpose. Almost everything a
   * bridge does belongs in `map`, because writing `--zb-accent` once reaches
   * every component while writing each component's accent is forty
   * declarations that drift apart.
   *
   * What legitimately lives here is a value *derived* from the host's theme
   * rather than copied from it. A segmented tab strip's track and thumb radii
   * are concentric — the inner corner is the outer minus the inset — and CSS
   * cannot express that relationship over a variable it has not been given.
   * The stylesheet hardcodes a sensible pair; only a bridge can recompute them
   * from a host's own radius.
   *
   * Keyed by the component name in the token surface manifest.
   */
  readonly components?: Readonly<Record<string, (theme: HostTheme) => TokenPatch>>;

  /**
   * Tokens this framework cannot express, declared rather than silently
   * absent. Published in the docs so a customer sees the difference before
   * they file it as a bug.
   */
  readonly unmapped: readonly string[];
}

/**
 * Everything a bridge writes for one host theme: the semantic mapping plus
 * every component's derived geometry, compacted so unmapped tokens are absent.
 */
export function resolvePatch<HostTheme>(
  bridge: BridgeDefinition<HostTheme>,
  theme: HostTheme,
): TokenPatch {
  const patch: TokenPatch = { ...bridge.map(theme) };
  for (const derive of Object.values(bridge.components ?? {})) {
    Object.assign(patch, derive(theme));
  }
  return compact(patch);
}

/**
 * The minimum hit target Zoblocks guarantees, in pixels.
 *
 * WCAG 2.5.5. A host asking for 24px controls does not get to shrink a
 * clinical control below it, so density mappings clamp rather than copy.
 */
export const MIN_TARGET_PX = 44;

/** `max(44px, …)`, expressed so a host value still wins when it is larger. */
export function targetFloor(value: string | number): string {
  const px = typeof value === "number" ? `${value}px` : value;
  return `max(${MIN_TARGET_PX}px, ${px})`;
}

/** Drops undefined entries, so an unmapped token is absent rather than empty. */
export function compact(patch: TokenPatch): TokenPatch {
  const out: TokenPatch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") continue;
    out[key as `--${string}`] = value;
  }
  return out;
}

/**
 * Concentric radii.
 *
 * A track and the thumb inside it do not share a radius: the inner corner is
 * the outer corner minus the inset. A thumb that simply reuses the track's
 * radius looks subtly wrong at every size, and it is invisible in a snapshot —
 * which is why this is a helper rather than a note in a review.
 */
export function concentric(radius: number, inset: number): { outer: string; inner: string } {
  return { outer: `${radius + inset}px`, inner: `${radius}px` };
}

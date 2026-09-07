/**
 * Ant Design's resolved theme, mapped onto Zoblocks's token surface.
 *
 * The mapping rule, inherited from the bridge this generalises: **map a token
 * only where the meaning genuinely matches.** Where it does not, write nothing
 * — the stylesheet's own fallback chain then wins, which is the correct
 * outcome. A bridge that fills every slot by approximation produces a
 * component that is uniformly slightly wrong, and that is harder to diagnose
 * than one that is partly unthemed.
 *
 * Two categories are deliberately absent and both are load-bearing:
 *
 * **Clinical status.** antd has `colorError`, `colorWarning` and
 * `colorSuccess`. Zoblocks has `status.critical`, `status.high`, `status.low`,
 * `status.normal` and `status.unknown`, and the difference is not vocabulary.
 * Ours carry a validated contrast floor in three themes and a 60° hue
 * separation between `high` and `low`, so the *direction* of an abnormal
 * result survives colour-vision deficiency and monochrome print. antd has no
 * concept of direction at all — there is nothing to map `status.low` onto —
 * and a host's `colorError` has passed none of those gates. `bridge-core`
 * refuses these at runtime; this file simply never offers them.
 *
 * **Locale and motion preferences.** `ConfigProvider locale` is not bridged:
 * `@zoblocks/intl` owns Zoblocks's strings because clinical copy is
 * reviewed content, not a framework's message catalog.
 */

import {
  compact,
  concentric,
  targetFloor,
  type BridgeDefinition,
  type TokenPatch,
} from "@zoblocks/bridge-core";

/**
 * The subset of antd's token set this bridge reads.
 *
 * Declared structurally rather than imported as `GlobalToken` so the mapping
 * can be unit-tested with a literal, and so a rename in an antd major surfaces
 * here as a type error rather than as a silently `undefined` custom property.
 */
export interface AntdTokens {
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorPrimaryBg?: string;
  colorPrimaryBorder?: string;

  /**
   * The label colour on a filled surface.
   *
   * antd's own name for it, and the reason `--zb-text-on-accent` is no longer
   * in `unmapped`: it was listed there on the belief that antd computed the
   * label per component and exposed nothing to read. It does expose this, the
   * docs site's playground was already using it, and the cost of the mistake
   * was visible — with the token unmapped, Zoblocks's *dark* label (#071014,
   * near-black) landed on antd's dark primary at 3.70:1, which is not a
   * rendering antd would ever produce. Mapped, it is antd's own #fff at
   * 5.19:1.
   */
  colorTextLightSolid?: string;

  colorText?: string;
  colorTextSecondary?: string;
  colorTextTertiary?: string;
  colorTextDisabled?: string;

  colorBgContainer?: string;
  colorBgElevated?: string;
  colorBgLayout?: string;
  colorFillQuaternary?: string;
  colorFillTertiary?: string;

  colorBorder?: string;
  colorBorderSecondary?: string;

  borderRadiusSM?: number;
  borderRadius?: number;
  borderRadiusLG?: number;

  fontFamily?: string;
  fontFamilyCode?: string;
  fontSize?: number;

  controlHeight?: number;
  controlHeightSM?: number;

  motionDurationFast?: string;
  motionDurationMid?: string;
  motionDurationSlow?: string;
  motionEaseInOut?: string;

  boxShadowTertiary?: string;
  boxShadowSecondary?: string;
  boxShadow?: string;
}

const px = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : `${value}px`;

/**
 * The semantic tier.
 *
 * Written once and reaching every component, rather than per-component, which
 * would be several hundred declarations that drift apart the first time one is
 * forgotten.
 */
function semantic(token: AntdTokens): TokenPatch {
  return {
    /* Brand ------------------------------------------------------------- */
    "--zb-accent": token.colorPrimary,
    "--zb-accent-hover": token.colorPrimaryHover,
    "--zb-accent-subtle": token.colorPrimaryBg,
    "--zb-accent-border": token.colorPrimaryBorder,
    // antd has no separate focus colour; it draws focus in the primary hue,
    // which is a real correspondence rather than an approximation.
    "--zb-focus-ring": token.colorPrimary,
    /*
     * Mapping both halves of this pair is the point, not a convenience.
     *
     * `contrastViolations` in bridge-core only checks a pair when the bridge
     * supplies *both* sides — anything else would be guessing at a value it
     * cannot see. So a half-mapped pair is invisible to the gate by
     * construction: with the fill mapped and the label left to Zoblocks, the
     * ratio was never measured by anything. Now it is, and antd's own default
     * duly reports 4.10:1 against its primary — a real AA failure in antd's
     * palette, which is antd's to own and ours to surface rather than hide.
     */
    "--zb-text-on-accent": token.colorTextLightSolid,

    /* Text --------------------------------------------------------------- */
    "--zb-text": token.colorText,
    "--zb-text-muted": token.colorTextSecondary,
    "--zb-text-subtle": token.colorTextTertiary,

    /* Surfaces ----------------------------------------------------------- */
    "--zb-bg": token.colorBgLayout,
    "--zb-bg-subtle": token.colorFillQuaternary,
    "--zb-bg-muted": token.colorFillTertiary,
    "--zb-surface": token.colorBgContainer,
    "--zb-surface-raised": token.colorBgElevated,
    "--zb-surface-overlay": token.colorBgElevated,

    /* Lines -------------------------------------------------------------- */
    "--zb-border": token.colorBorder,

    /* Shape -------------------------------------------------------------- */
    "--zb-radius-sm": px(token.borderRadiusSM),
    "--zb-radius": px(token.borderRadius),
    "--zb-radius-lg": px(token.borderRadiusLG),

    /* Type --------------------------------------------------------------- */
    "--zb-font-sans": token.fontFamily,
    "--zb-font-mono": token.fontFamilyCode,
    "--zb-text-base": px(token.fontSize),

    /* Motion. `prefers-reduced-motion` still wins: the token stylesheet
       zeroes these under the media query, and a media rule beats an inline
       custom property's *value* because the component reads the token the
       stylesheet redefines. Asserted in the test suite. -------------------- */
    "--zb-duration-fast": token.motionDurationFast,
    "--zb-duration": token.motionDurationMid,
    "--zb-duration-slow": token.motionDurationSlow,
    "--zb-ease": token.motionEaseInOut,

    /* Elevation ----------------------------------------------------------- */
    "--zb-shadow-sm": token.boxShadowTertiary,
    "--zb-shadow": token.boxShadowSecondary,
    "--zb-shadow-lg": token.boxShadow,

    /* Density. A floor rather than a mapping: a host asking for 24px
       controls does not get to shrink a clinical control below WCAG 2.5.5. */
    "--zb-density-target":
      token.controlHeight === undefined ? undefined : targetFloor(token.controlHeight),
    "--zb-density-font": px(token.fontSize),
  };
}

/**
 * Tabs' concentric geometry.
 *
 * The one thing CSS cannot derive: a segmented strip's track radius is the
 * thumb's plus the inset, and the stylesheet has no way to compute that over a
 * radius the host supplied. Getting it wrong looks subtly off at every size
 * and is invisible in a snapshot, which is why it survived the generalisation
 * instead of being dropped.
 */
function tabs(token: AntdTokens): TokenPatch {
  const radius = token.borderRadiusLG ?? token.borderRadius;
  if (radius === undefined) return {};

  const inset = 4;
  const { outer, inner } = concentric(radius, inset);
  return {
    "--zb-tabs-track-radius": outer,
    "--zb-tabs-thumb-radius": inner,
    "--zb-tabs-track-pad": `${inset}px`,
  };
}

export const antdBridge: BridgeDefinition<AntdTokens> = {
  id: "antd",
  framework: "Ant Design",

  /**
   * One major, deliberately.
   *
   * v6 renamed a substantial part of the token surface. A bridge written
   * against v6 names reads `undefined` on a v5 host, and `undefined` in a
   * custom property means "fall through" — so the failure is a component
   * quietly wearing Zoblocks's defaults instead of the customer's brand. No
   * error, no warning, nothing to notice. A single major turns that into a
   * peer-resolution error at install time.
   */
  supports: "^6.0.0",

  map: (theme) => compact(semantic(theme)),
  components: { tabs },

  unmapped: [
    // Clinical. Nothing in antd carries the direction of an abnormal result.
    "--zb-status-critical",
    "--zb-status-high",
    "--zb-status-low",
    "--zb-status-normal",
    "--zb-status-unknown",
    "--zb-flag-deceased",
    "--zb-flag-restricted",
    "--zb-flag-provisional",
    // antd has one border weight; `border-strong` delimits a field and has to
    // clear 3:1, which `colorBorder` does not.
    "--zb-border-strong",
  ],
};

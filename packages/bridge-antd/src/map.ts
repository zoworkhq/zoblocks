/**
 * Ant Design's resolved theme, mapped onto Oxygen's token surface.
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
 * `colorSuccess`. Oxygen has `status.critical`, `status.high`, `status.low`,
 * `status.normal` and `status.unknown`, and the difference is not vocabulary.
 * Ours carry a validated contrast floor in three themes and a 60° hue
 * separation between `high` and `low`, so the *direction* of an abnormal
 * result survives colour-vision deficiency and monochrome print. antd has no
 * concept of direction at all — there is nothing to map `status.low` onto —
 * and a host's `colorError` has passed none of those gates. `bridge-core`
 * refuses these at runtime; this file simply never offers them.
 *
 * **Locale and motion preferences.** `ConfigProvider locale` is not bridged:
 * `@oxygenui-design/intl` owns Oxygen's strings because clinical copy is
 * reviewed content, not a framework's message catalog.
 */

import {
  compact,
  concentric,
  targetFloor,
  type BridgeDefinition,
  type TokenPatch,
} from "@oxygenui-design/bridge-core";

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
   * antd's own name for it, and the reason `--ox-text-on-accent` is no longer
   * in `unmapped`: it was listed there on the belief that antd computed the
   * label per component and exposed nothing to read. It does expose this, the
   * docs site's playground was already using it, and the cost of the mistake
   * was visible — with the token unmapped, Oxygen's *dark* label (#071014,
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
    "--ox-accent": token.colorPrimary,
    "--ox-accent-hover": token.colorPrimaryHover,
    "--ox-accent-subtle": token.colorPrimaryBg,
    "--ox-accent-border": token.colorPrimaryBorder,
    // antd has no separate focus colour; it draws focus in the primary hue,
    // which is a real correspondence rather than an approximation.
    "--ox-focus-ring": token.colorPrimary,
    /*
     * Mapping both halves of this pair is the point, not a convenience.
     *
     * `contrastViolations` in bridge-core only checks a pair when the bridge
     * supplies *both* sides — anything else would be guessing at a value it
     * cannot see. So a half-mapped pair is invisible to the gate by
     * construction: with the fill mapped and the label left to Oxygen, the
     * ratio was never measured by anything. Now it is, and antd's own default
     * duly reports 4.10:1 against its primary — a real AA failure in antd's
     * palette, which is antd's to own and ours to surface rather than hide.
     */
    "--ox-text-on-accent": token.colorTextLightSolid,

    /* Text --------------------------------------------------------------- */
    "--ox-text": token.colorText,
    "--ox-text-muted": token.colorTextSecondary,
    "--ox-text-subtle": token.colorTextTertiary,

    /* Surfaces ----------------------------------------------------------- */
    "--ox-bg": token.colorBgLayout,
    "--ox-bg-subtle": token.colorFillQuaternary,
    "--ox-bg-muted": token.colorFillTertiary,
    "--ox-surface": token.colorBgContainer,
    "--ox-surface-raised": token.colorBgElevated,
    "--ox-surface-overlay": token.colorBgElevated,

    /* Lines -------------------------------------------------------------- */
    "--ox-border": token.colorBorder,

    /* Shape -------------------------------------------------------------- */
    "--ox-radius-sm": px(token.borderRadiusSM),
    "--ox-radius": px(token.borderRadius),
    "--ox-radius-lg": px(token.borderRadiusLG),

    /* Type --------------------------------------------------------------- */
    "--ox-font-sans": token.fontFamily,
    "--ox-font-mono": token.fontFamilyCode,
    "--ox-text-base": px(token.fontSize),

    /* Motion. `prefers-reduced-motion` still wins: the token stylesheet
       zeroes these under the media query, and a media rule beats an inline
       custom property's *value* because the component reads the token the
       stylesheet redefines. Asserted in the test suite. -------------------- */
    "--ox-duration-fast": token.motionDurationFast,
    "--ox-duration": token.motionDurationMid,
    "--ox-duration-slow": token.motionDurationSlow,
    "--ox-ease": token.motionEaseInOut,

    /* Elevation ----------------------------------------------------------- */
    "--ox-shadow-sm": token.boxShadowTertiary,
    "--ox-shadow": token.boxShadowSecondary,
    "--ox-shadow-lg": token.boxShadow,

    /* Density. A floor rather than a mapping: a host asking for 24px
       controls does not get to shrink a clinical control below WCAG 2.5.5. */
    "--ox-density-target":
      token.controlHeight === undefined ? undefined : targetFloor(token.controlHeight),
    "--ox-density-font": px(token.fontSize),
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
    "--ox-tabs-track-radius": outer,
    "--ox-tabs-thumb-radius": inner,
    "--ox-tabs-track-pad": `${inset}px`,
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
   * quietly wearing Oxygen's defaults instead of the customer's brand. No
   * error, no warning, nothing to notice. A single major turns that into a
   * peer-resolution error at install time.
   */
  supports: "^6.0.0",

  map: (theme) => compact(semantic(theme)),
  components: { tabs },

  unmapped: [
    // Clinical. Nothing in antd carries the direction of an abnormal result.
    "--ox-status-critical",
    "--ox-status-high",
    "--ox-status-low",
    "--ox-status-normal",
    "--ox-status-unknown",
    "--ox-flag-deceased",
    "--ox-flag-restricted",
    "--ox-flag-provisional",
    // antd has one border weight; `border-strong` delimits a field and has to
    // clear 3:1, which `colorBorder` does not.
    "--ox-border-strong",
  ],
};

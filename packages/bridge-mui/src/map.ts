/**
 * Material UI's resolved theme, mapped onto ZoBlocks's token surface.
 *
 * This is the bridge that tested the contract. Writing it against a surface
 * derived from Ant Design was the point of building it before any customer
 * asked for MUI: anything the mapping could not express honestly is a defect
 * in the contract, and it is far cheaper to find here than after ten
 * customers.
 *
 * Three things MUI genuinely does not have, all left unmapped rather than
 * approximated:
 *
 * **A background scale.** antd distinguishes `colorFillQuaternary` and
 * `colorFillTertiary` from the container background; MUI has
 * `background.default` and `background.paper` and nothing between. ZoBlocks's
 * `bg-subtle` and `bg-muted` — the washes behind a selected row and a table
 * header — have no counterpart, so they keep ZoBlocks's values and the two
 * systems differ visibly there. That is the honest outcome.
 *
 * **A radius scale.** `shape.borderRadius` is one number. Deriving `sm` and
 * `lg` from it by halving and doubling would be inventing a design decision on
 * the host's behalf, so only the base radius is mapped and the other two fall
 * through.
 *
 * **A hit-target token.** MUI sizes controls per component (`size="small"`)
 * rather than through a global. `--zb-density-target` therefore keeps ZoBlocks's
 * floor, which is the safe direction to be wrong in.
 *
 * What MUI has and antd does not is a 25-step elevation scale. Importing it
 * whole would give ZoBlocks twenty-five shadow tokens it has no use for, so it
 * is sampled at 1 / 4 / 8 onto sm / md / lg.
 */

import { compact, concentric, type BridgeDefinition, type TokenPatch } from "@zoblocks/bridge-core";

/**
 * The subset of MUI's theme this bridge reads.
 *
 * Declared structurally rather than importing `Theme`, for the same reason the
 * antd bridge does: the mapping stays unit-testable with a literal, and it
 * keeps `@mui/material` out of this module's type graph as well as its runtime
 * graph.
 */
export interface MuiTheme {
  palette?: {
    mode?: "light" | "dark";
    primary?: { main?: string; dark?: string; light?: string; contrastText?: string };
    text?: { primary?: string; secondary?: string; disabled?: string };
    background?: { default?: string; paper?: string };
    divider?: string;
  };
  shape?: { borderRadius?: number };
  typography?: { fontFamily?: string; fontSize?: number };
  shadows?: readonly string[];
  transitions?: {
    duration?: { shorter?: number; short?: number; standard?: number; complex?: number };
    easing?: { easeInOut?: string };
  };
}

const px = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : `${value}px`;

const ms = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : `${value}ms`;

/**
 * MUI's elevation 0 is the string `"none"`, which is a valid shadow and not a
 * missing one — but reading past the end of the array yields `undefined`, and
 * a theme may legitimately ship fewer than 25 steps.
 */
function elevation(shadows: readonly string[] | undefined, step: number): string | undefined {
  const value = shadows?.[step];
  return value === "none" ? undefined : value;
}

function semantic(theme: MuiTheme): TokenPatch {
  const palette = theme.palette;
  const primary = palette?.primary;

  return {
    /* Brand ------------------------------------------------------------- */
    "--zb-accent": primary?.main,
    "--zb-accent-hover": primary?.dark,
    // `primary.light` is a lighter shade of the brand, not a wash behind it.
    // It is the closest honest counterpart to `accent-subtle`, and it is not
    // the same thing — noted here rather than silently treated as equal.
    "--zb-accent-subtle": primary?.light,
    // MUI draws focus in the primary colour, as antd does.
    "--zb-focus-ring": primary?.main,
    // The one MUI has and antd does not: a resolved label colour for a filled
    // action, computed by MUI against its own contrast threshold.
    "--zb-text-on-accent": primary?.contrastText,

    /* Text --------------------------------------------------------------- */
    "--zb-text": palette?.text?.primary,
    "--zb-text-muted": palette?.text?.secondary,
    // MUI has no tertiary text; `disabled` is a state rather than an emphasis
    // level. Mapped because it is the only de-emphasised text MUI defines, and
    // recorded as a divergence.
    "--zb-text-subtle": palette?.text?.disabled,

    /* Surfaces ----------------------------------------------------------- */
    "--zb-bg": palette?.background?.default,
    "--zb-surface": palette?.background?.paper,
    "--zb-surface-raised": palette?.background?.paper,
    "--zb-surface-overlay": palette?.background?.paper,

    /* Lines -------------------------------------------------------------- */
    "--zb-border": palette?.divider,

    /* Shape. One number, so only the base is mapped — see the file note. --- */
    "--zb-radius": px(theme.shape?.borderRadius),

    /* Type --------------------------------------------------------------- */
    "--zb-font-sans": theme.typography?.fontFamily,
    "--zb-text-base": px(theme.typography?.fontSize),

    /* Motion. MUI states durations as numbers of milliseconds. ------------ */
    "--zb-duration-fast": ms(theme.transitions?.duration?.shorter),
    "--zb-duration": ms(theme.transitions?.duration?.standard),
    "--zb-duration-slow": ms(theme.transitions?.duration?.complex),
    "--zb-ease": theme.transitions?.easing?.easeInOut,

    /* Elevation, sampled from the 25-step scale. -------------------------- */
    "--zb-shadow-sm": elevation(theme.shadows, 1),
    "--zb-shadow": elevation(theme.shadows, 4),
    "--zb-shadow-lg": elevation(theme.shadows, 8),
  };
}

/** Tabs' concentric geometry — see the antd bridge for why this cannot be CSS. */
function tabs(theme: MuiTheme): TokenPatch {
  const radius = theme.shape?.borderRadius;
  if (radius === undefined) return {};

  const inset = 4;
  const { outer, inner } = concentric(radius, inset);
  return {
    "--zb-tabs-track-radius": outer,
    "--zb-tabs-thumb-radius": inner,
    "--zb-tabs-track-pad": `${inset}px`,
  };
}

export const muiBridge: BridgeDefinition<MuiTheme> = {
  id: "mui",
  framework: "Material UI",
  supports: "^9.0.0",

  map: (theme) => compact(semantic(theme)),
  components: { tabs },

  unmapped: [
    // Clinical. MUI has error/warning/success/info and no concept of the
    // direction of an abnormal result, so there is nothing to map `status.low`
    // onto even if the gate permitted it.
    "--zb-status-critical",
    "--zb-status-high",
    "--zb-status-low",
    "--zb-status-normal",
    "--zb-status-unknown",
    "--zb-flag-deceased",
    "--zb-flag-restricted",
    "--zb-flag-provisional",
    // No background scale between `default` and `paper`.
    "--zb-bg-subtle",
    "--zb-bg-muted",
    // One radius, so no scale to map.
    "--zb-radius-sm",
    "--zb-radius-lg",
    // One divider weight; `border-strong` delimits a field and must clear 3:1.
    "--zb-border-strong",
    // Sized per component rather than through a global token.
    "--zb-density-target",
    "--zb-density-font",
    // No monospace token in the theme.
    "--zb-font-mono",
    // MUI's primary ramp has no border step.
    "--zb-accent-border",
  ],
};

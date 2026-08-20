/**
 * Material UI's resolved theme, mapped onto Oxygen's token surface.
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
 * `background.default` and `background.paper` and nothing between. Oxygen's
 * `bg-subtle` and `bg-muted` — the washes behind a selected row and a table
 * header — have no counterpart, so they keep Oxygen's values and the two
 * systems differ visibly there. That is the honest outcome.
 *
 * **A radius scale.** `shape.borderRadius` is one number. Deriving `sm` and
 * `lg` from it by halving and doubling would be inventing a design decision on
 * the host's behalf, so only the base radius is mapped and the other two fall
 * through.
 *
 * **A hit-target token.** MUI sizes controls per component (`size="small"`)
 * rather than through a global. `--ox-density-target` therefore keeps Oxygen's
 * floor, which is the safe direction to be wrong in.
 *
 * What MUI has and antd does not is a 25-step elevation scale. Importing it
 * whole would give Oxygen twenty-five shadow tokens it has no use for, so it
 * is sampled at 1 / 4 / 8 onto sm / md / lg.
 */

import {
  compact,
  concentric,
  type BridgeDefinition,
  type TokenPatch,
} from "@oxygenui-design/bridge-core";

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
    "--ox-accent": primary?.main,
    "--ox-accent-hover": primary?.dark,
    // `primary.light` is a lighter shade of the brand, not a wash behind it.
    // It is the closest honest counterpart to `accent-subtle`, and it is not
    // the same thing — noted here rather than silently treated as equal.
    "--ox-accent-subtle": primary?.light,
    // MUI draws focus in the primary colour, as antd does.
    "--ox-focus-ring": primary?.main,
    // The one MUI has and antd does not: a resolved label colour for a filled
    // action, computed by MUI against its own contrast threshold.
    "--ox-text-on-accent": primary?.contrastText,

    /* Text --------------------------------------------------------------- */
    "--ox-text": palette?.text?.primary,
    "--ox-text-muted": palette?.text?.secondary,
    // MUI has no tertiary text; `disabled` is a state rather than an emphasis
    // level. Mapped because it is the only de-emphasised text MUI defines, and
    // recorded as a divergence.
    "--ox-text-subtle": palette?.text?.disabled,

    /* Surfaces ----------------------------------------------------------- */
    "--ox-bg": palette?.background?.default,
    "--ox-surface": palette?.background?.paper,
    "--ox-surface-raised": palette?.background?.paper,
    "--ox-surface-overlay": palette?.background?.paper,

    /* Lines -------------------------------------------------------------- */
    "--ox-border": palette?.divider,

    /* Shape. One number, so only the base is mapped — see the file note. --- */
    "--ox-radius": px(theme.shape?.borderRadius),

    /* Type --------------------------------------------------------------- */
    "--ox-font-sans": theme.typography?.fontFamily,
    "--ox-text-base": px(theme.typography?.fontSize),

    /* Motion. MUI states durations as numbers of milliseconds. ------------ */
    "--ox-duration-fast": ms(theme.transitions?.duration?.shorter),
    "--ox-duration": ms(theme.transitions?.duration?.standard),
    "--ox-duration-slow": ms(theme.transitions?.duration?.complex),
    "--ox-ease": theme.transitions?.easing?.easeInOut,

    /* Elevation, sampled from the 25-step scale. -------------------------- */
    "--ox-shadow-sm": elevation(theme.shadows, 1),
    "--ox-shadow": elevation(theme.shadows, 4),
    "--ox-shadow-lg": elevation(theme.shadows, 8),
  };
}

/** Tabs' concentric geometry — see the antd bridge for why this cannot be CSS. */
function tabs(theme: MuiTheme): TokenPatch {
  const radius = theme.shape?.borderRadius;
  if (radius === undefined) return {};

  const inset = 4;
  const { outer, inner } = concentric(radius, inset);
  return {
    "--ox-tabs-track-radius": outer,
    "--ox-tabs-thumb-radius": inner,
    "--ox-tabs-track-pad": `${inset}px`,
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
    "--ox-status-critical",
    "--ox-status-high",
    "--ox-status-low",
    "--ox-status-normal",
    "--ox-status-unknown",
    "--ox-flag-deceased",
    "--ox-flag-restricted",
    "--ox-flag-provisional",
    // No background scale between `default` and `paper`.
    "--ox-bg-subtle",
    "--ox-bg-muted",
    // One radius, so no scale to map.
    "--ox-radius-sm",
    "--ox-radius-lg",
    // One divider weight; `border-strong` delimits a field and must clear 3:1.
    "--ox-border-strong",
    // Sized per component rather than through a global token.
    "--ox-density-target",
    "--ox-density-font",
    // No monospace token in the theme.
    "--ox-font-mono",
    // MUI's primary ramp has no border step.
    "--ox-accent-border",
  ],
};

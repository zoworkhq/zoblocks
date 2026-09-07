/**
 * The inverse bridge: a Zoblocks brand, pushed into Material UI.
 *
 * The mirror of `map.ts`, and deliberately the same shape as the antd inverse
 * so a customer moving between the two frameworks changes a provider and
 * nothing else.
 *
 * Clinical status is not pushed, for the same reason it is not pulled: MUI
 * would apply `palette.error` to a form helper text and a delete button, and a
 * colour that means *this result is dangerous* would come to mean *this field
 * is wrong*. The hex would survive; the meaning would not.
 */

import { toPx, type ZoblocksTokens } from "@zoblocks/bridge-core";

/** The shape `createTheme` takes. Structural, so MUI stays a peer. */
export interface MuiThemeOptions {
  palette?: {
    /*
     * `main` is required, and that is MUI's rule rather than a preference.
     *
     * `createTheme` runs `augmentColor` over any `primary` it is given and
     * throws — "the color provided to augmentColor is invalid" — if `main` is
     * missing. So a theme that had defined `--zb-accent-hover` but not
     * `--zb-accent` used to produce an object that looked fine, typechecked
     * against this interface, and took the host's application down at import.
     */
    primary?: { main: string; dark?: string; light?: string; contrastText?: string };
    text?: { primary?: string; secondary?: string; disabled?: string };
    background?: { default?: string; paper?: string };
    divider?: string;
  };
  shape?: { borderRadius?: number };
  typography?: { fontFamily?: string; fontSize?: number };
}

export function toMuiTheme(tokens: ZoblocksTokens): MuiThemeOptions {
  const options: MuiThemeOptions = {};

  /*
   * No accent, no palette entry. The shades are meaningless without the colour
   * they are shades *of*, and MUI refuses the object rather than ignoring it.
   */
  const main = tokens["--zb-accent"];
  const primary = main
    ? (clean({
        main,
        dark: tokens["--zb-accent-hover"],
        light: tokens["--zb-accent-subtle"],
        contrastText: tokens["--zb-text-on-accent"],
      }) as { main: string; dark?: string; light?: string; contrastText?: string })
    : undefined;

  const text = clean({
    primary: tokens["--zb-text"],
    secondary: tokens["--zb-text-muted"],
    disabled: tokens["--zb-text-subtle"],
  });

  const background = clean({
    default: tokens["--zb-bg"],
    paper: tokens["--zb-surface"],
  });

  const palette = clean({
    ...(primary ? { primary } : {}),
    ...(text ? { text } : {}),
    ...(background ? { background } : {}),
    divider: tokens["--zb-border"],
  });
  if (palette) options.palette = palette as MuiThemeOptions["palette"];

  // MUI has one radius, a number of pixels. Handing it Zoblocks's base is the
  // honest choice — there is nowhere to put the other two steps.
  const radius = toPx(tokens["--zb-radius"]);
  if (radius !== undefined) options.shape = { borderRadius: radius };

  const typography = clean({
    fontFamily: tokens["--zb-font-sans"],
    fontSize: toPx(tokens["--zb-text-base"]),
  });
  if (typography) options.typography = typography as MuiThemeOptions["typography"];

  return options;
}

/**
 * Drops undefined entries and returns undefined for an empty result.
 *
 * `createTheme({ palette: { primary: {} } })` is not the same as leaving
 * `primary` alone: MUI treats a present-but-empty object as a deliberate
 * override and computes defaults from it, so an empty one changes the theme.
 */
function clean<T extends Record<string, unknown>>(input: T): T | undefined {
  const out = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ""),
  ) as T;
  return Object.keys(out).length ? out : undefined;
}

/** Not written, and named so a customer sees the boundary before filing a bug. */
export const NOT_PUSHED_TO_MUI = [
  "palette.error",
  "palette.warning",
  "palette.success",
  "palette.info",
] as const;

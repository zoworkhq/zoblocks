/**
 * The inverse bridge: an Oxygen brand, pushed into Material UI.
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

import { toPx, type OxygenTokens } from "@oxygenui-design/bridge-core";

/** The shape `createTheme` takes. Structural, so MUI stays a peer. */
export interface MuiThemeOptions {
  palette?: {
    primary?: { main?: string; dark?: string; light?: string; contrastText?: string };
    text?: { primary?: string; secondary?: string; disabled?: string };
    background?: { default?: string; paper?: string };
    divider?: string;
  };
  shape?: { borderRadius?: number };
  typography?: { fontFamily?: string; fontSize?: number };
}

export function toMuiTheme(tokens: OxygenTokens): MuiThemeOptions {
  const options: MuiThemeOptions = {};

  const primary = clean({
    main: tokens["--ox-accent"],
    dark: tokens["--ox-accent-hover"],
    light: tokens["--ox-accent-subtle"],
    contrastText: tokens["--ox-text-on-accent"],
  });

  const text = clean({
    primary: tokens["--ox-text"],
    secondary: tokens["--ox-text-muted"],
    disabled: tokens["--ox-text-subtle"],
  });

  const background = clean({
    default: tokens["--ox-bg"],
    paper: tokens["--ox-surface"],
  });

  const palette = clean({
    ...(primary ? { primary } : {}),
    ...(text ? { text } : {}),
    ...(background ? { background } : {}),
    divider: tokens["--ox-border"],
  });
  if (palette) options.palette = palette as MuiThemeOptions["palette"];

  // MUI has one radius, a number of pixels. Handing it Oxygen's base is the
  // honest choice — there is nowhere to put the other two steps.
  const radius = toPx(tokens["--ox-radius"]);
  if (radius !== undefined) options.shape = { borderRadius: radius };

  const typography = clean({
    fontFamily: tokens["--ox-font-sans"],
    fontSize: toPx(tokens["--ox-text-base"]),
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

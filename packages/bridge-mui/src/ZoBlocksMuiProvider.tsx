"use client";

/**
 * Your Material UI application, in your ZoBlocks brand.
 *
 *     <ZoBlocksMuiProvider>
 *       <YourMuiApp />
 *     </ZoBlocksMuiProvider>
 *
 * Deliberately the same API as `ZoBlocksAntdProvider`, down to the prop names: a
 * customer moving between frameworks should change a provider and nothing else,
 * and two wrappers with different shapes would quietly make that false.
 */

import * as React from "react";
import {
  ThemeProvider,
  createTheme,
  useTheme,
  type Theme,
  type ThemeOptions,
} from "@mui/material/styles";
import {
  useZoBlocksTokens,
  type UseZoBlocksTokensOptions,
  type ZoBlocksTokens,
} from "@zoblocks/bridge-core";
import { toMuiTheme, type MuiThemeOptions } from "./inverse";

export interface ZoBlocksMuiProviderProps {
  children: React.ReactNode;
  fallback?: ZoBlocksTokens;
  /** Merged over the derived options, for a deliberate exception. */
  override?: MuiThemeOptions;
  /** The element whose brand to read, when it is not the document's. */
  scope?: UseZoBlocksTokensOptions["scope"];
}

export function ZoBlocksMuiProvider({
  children,
  fallback,
  override,
  scope,
}: ZoBlocksMuiProviderProps) {
  const tokens = useZoBlocksTokens({ fallback, scope });

  // The host's existing theme, so this extends rather than replaces. A customer
  // who set `spacing` or a breakpoint keeps them; only the palette and shape
  // this derives are supplied.
  const outer = useTheme();

  const theme = React.useMemo(
    () => createTheme(mergeThemeOptions(outer, toMuiTheme(tokens), override)),
    [outer, tokens, override],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

type Bag = Record<string, unknown>;

/**
 * One options object for a single `createTheme` call.
 *
 * `createTheme(a, b, c)` builds the palette and type scale from `a` only, then
 * deep-merges `b` and `c` raw. A brand passed that way never gets its `dark`,
 * `light` or `contrastText`, and its font never reaches a variant. So the
 * layers are merged first, with two rules the raw merge cannot know:
 *
 *   - a layer's `palette.primary` replaces the one below, because the host's
 *     shades belong to the host's colour;
 *   - when a layer sets the font, the host's variants keep only what the host
 *     set deliberately, so the rest is derived again from the new font.
 */
export function mergeThemeOptions(
  outer: Theme,
  ...layers: (MuiThemeOptions | undefined)[]
): ThemeOptions {
  const palette: Bag = { ...outer.palette };
  let typography: Bag | undefined;

  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer.palette ?? {})) {
      palette[key] =
        key !== "primary" && isBag(value) && isBag(palette[key])
          ? { ...palette[key], ...value }
          : value;
    }
    if (layer.typography) {
      typography = { ...(typography ?? hostTypography(outer)), ...layer.typography };
    }
  }

  const shape = Object.assign({}, outer.shape, ...layers.map((l) => l?.shape));
  return {
    ...(outer as unknown as ThemeOptions),
    palette: palette as ThemeOptions["palette"],
    shape,
    typography: (typography ?? outer.typography) as ThemeOptions["typography"],
  };
}

/** The host's typography as inputs: base settings plus deliberate variant edits. */
function hostTypography(outer: Theme): Bag {
  const t = outer.typography as unknown as Bag;
  const bases = [
    "fontFamily",
    "fontSize",
    "htmlFontSize",
    "fontWeightLight",
    "fontWeightRegular",
    "fontWeightMedium",
    "fontWeightBold",
  ];
  const input: Bag = Object.fromEntries(bases.map((key) => [key, t[key]]));
  // What MUI would derive from those bases alone; anything else was chosen.
  const baseline = createTheme({ typography: input }).typography as unknown as Bag;

  for (const [key, value] of Object.entries(t)) {
    if (bases.includes(key)) continue;
    const derived = baseline[key];
    if (typeof value === "function") {
      const px = value as (n: number) => string;
      if (typeof derived !== "function" || px(16) !== (derived as typeof px)(16))
        input[key] = value;
    } else if (isBag(value) && isBag(derived)) {
      const edits = Object.entries(value).filter(([prop, v]) => derived[prop] !== v);
      if (edits.length) input[key] = Object.fromEntries(edits);
    } else if (value !== derived) {
      input[key] = value;
    }
  }
  return input;
}

function isBag(value: unknown): value is Bag {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

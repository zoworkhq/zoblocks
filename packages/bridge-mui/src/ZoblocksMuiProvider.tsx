"use client";

/**
 * Your Material UI application, in your Zoblocks brand.
 *
 *     <ZoblocksMuiProvider>
 *       <YourMuiApp />
 *     </ZoblocksMuiProvider>
 *
 * Deliberately the same API as `ZoblocksAntdProvider`, down to the prop names: a
 * customer moving between frameworks should change a provider and nothing else,
 * and two wrappers with different shapes would quietly make that false.
 */

import * as React from "react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { useZoblocksTokens, type ZoblocksTokens } from "@zoblocks/bridge-core";
import { toMuiTheme, type MuiThemeOptions } from "./inverse";

export interface ZoblocksMuiProviderProps {
  children: React.ReactNode;
  fallback?: ZoblocksTokens;
  /** Merged over the derived options, for a deliberate exception. */
  override?: MuiThemeOptions;
}

export function ZoblocksMuiProvider({ children, fallback, override }: ZoblocksMuiProviderProps) {
  const tokens = useZoblocksTokens({ fallback });

  // The host's existing theme, so this extends rather than replaces. A customer
  // who set `spacing` or a breakpoint keeps them; only the palette and shape
  // this derives are supplied.
  const outer = useTheme();

  const theme = React.useMemo(
    () => createTheme(outer, toMuiTheme(tokens), override ?? {}),
    [outer, tokens, override],
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

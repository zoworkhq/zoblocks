"use client";

/**
 * Your Material UI application, in your Oxygen brand.
 *
 *     <OxygenMuiProvider>
 *       <YourMuiApp />
 *     </OxygenMuiProvider>
 *
 * Deliberately the same API as `OxygenAntdProvider`, down to the prop names: a
 * customer moving between frameworks should change a provider and nothing else,
 * and two wrappers with different shapes would quietly make that false.
 */

import * as React from "react";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import { useOxygenTokens, type OxygenTokens } from "@oxygenui-design/bridge-core";
import { toMuiTheme, type MuiThemeOptions } from "./inverse";

export interface OxygenMuiProviderProps {
  children: React.ReactNode;
  fallback?: OxygenTokens;
  /** Merged over the derived options, for a deliberate exception. */
  override?: MuiThemeOptions;
}

export function OxygenMuiProvider({ children, fallback, override }: OxygenMuiProviderProps) {
  const tokens = useOxygenTokens({ fallback });

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

"use client";

/**
 * The React half of the Material UI bridge.
 *
 *     import { MuiBridge } from "@zoblocks/bridge-mui";
 *
 *     <ThemeProvider theme={muiTheme}>
 *       <MuiBridge>
 *         <Switch label="Contact precautions" … />
 *       </MuiBridge>
 *     </ThemeProvider>
 *
 * Deliberately the same shape as `AntdBridge`, down to the prop names: the
 * whole claim is that switching framework changes this wrapper and nothing
 * else, and two wrappers with different APIs would quietly make that false.
 */

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import { assertBridgeOutput, resolvePatch, type TokenPatch } from "@zoblocks/bridge-core";
import { muiBridge, type MuiTheme } from "./map";

/** The custom properties this host's MUI theme resolves to. */
export function useMuiTokens(): TokenPatch {
  const theme = useTheme();

  return React.useMemo(() => {
    const patch = resolvePatch(muiBridge, theme as MuiTheme);
    assertBridgeOutput(muiBridge.id, patch);
    return patch;
  }, [theme]);
}

export interface MuiBridgeProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "span";
}

export function MuiBridge({ children, className, as = "div" }: MuiBridgeProps) {
  const style = useMuiTokens();
  return React.createElement(as, { className, style, "data-zb-bridge": muiBridge.id }, children);
}

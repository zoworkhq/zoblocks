"use client";

/**
 * Your antd application, in your Zoblocks brand.
 *
 *     import { ZoblocksAntdProvider } from "@zoblocks/bridge-antd";
 *
 *     <ZoblocksAntdProvider>
 *       <YourAntdApp />       // your Button, your Table, your Modal
 *     </ZoblocksAntdProvider>
 *
 * A customer configures their brand once in the app and their whole
 * application follows — not only the Zoblocks components in it. That is the
 * difference between a component library with theming and a design system.
 *
 * It composes with an existing `ConfigProvider`: antd merges nested providers,
 * so a host that already sets `componentSize` or a locale keeps them, and only
 * the tokens named here are supplied. `override` is there for the case where
 * the customer's brand should not win — a marketing surface inside an
 * otherwise-branded application, say.
 */

import * as React from "react";
import { ConfigProvider } from "antd";
import { useZoblocksTokens, type ZoblocksTokens } from "@zoblocks/bridge-core";
import { toAntdTheme } from "./inverse";

export interface ZoblocksAntdProviderProps {
  children: React.ReactNode;
  /**
   * Values for the server render and the first client render.
   *
   * A server-rendered page already knows which brand it is serving, so seeding
   * the same values the browser is about to resolve is what avoids a flash of
   * the default palette.
   */
  fallback?: ZoblocksTokens;
  /** Merged over the derived tokens, so a host can keep a deliberate exception. */
  override?: Record<string, string | number>;
}

export function ZoblocksAntdProvider({ children, fallback, override }: ZoblocksAntdProviderProps) {
  const tokens = useZoblocksTokens({ fallback });

  const theme = React.useMemo(() => {
    const derived = toAntdTheme(tokens);
    return { token: { ...derived.token, ...override } };
  }, [tokens, override]);

  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}

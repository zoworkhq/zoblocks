"use client";

/**
 * Your antd application, in your Oxygen brand.
 *
 *     import { OxygenAntdProvider } from "@oxygenui-design/bridge-antd";
 *
 *     <OxygenAntdProvider>
 *       <YourAntdApp />       // your Button, your Table, your Modal
 *     </OxygenAntdProvider>
 *
 * A customer configures their brand once in the console and their whole
 * application follows — not only the Oxygen components in it. That is the
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
import { useOxygenTokens, type OxygenTokens } from "@oxygenui-design/bridge-core";
import { toAntdTheme } from "./inverse";

export interface OxygenAntdProviderProps {
  children: React.ReactNode;
  /**
   * Values for the server render and the first client render.
   *
   * A server-rendered page already knows which brand it is serving, so seeding
   * the same values the browser is about to resolve is what avoids a flash of
   * the default palette.
   */
  fallback?: OxygenTokens;
  /** Merged over the derived tokens, so a host can keep a deliberate exception. */
  override?: Record<string, string | number>;
}

export function OxygenAntdProvider({ children, fallback, override }: OxygenAntdProviderProps) {
  const tokens = useOxygenTokens({ fallback });

  const theme = React.useMemo(() => {
    const derived = toAntdTheme(tokens);
    return { token: { ...derived.token, ...override } };
  }, [tokens, override]);

  return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
}

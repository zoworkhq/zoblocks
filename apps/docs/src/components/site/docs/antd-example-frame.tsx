"use client";

/**
 * The antd theme an example of an antd-backed component renders inside.
 *
 * Example files are written to run on their own in StackBlitz, so they mount
 * no `ConfigProvider` — on this site that left antd on its light default
 * algorithm under the dark theme (near-black text on the dark stage) and on its
 * default blue under ZoBlocks, where the reader expects the selected language.
 * The frame supplies what the Signature demo and the Playground already do:
 * the site's colour mode and the language's brand tokens.
 *
 * Loaded lazily by `ExampleBlock`, so antd stays out of the shared chunk for
 * every page whose examples never touch it.
 */

import * as React from "react";
import { ConfigProvider, theme } from "antd";
import { useAntdBrandTokens } from "../language-antd-theme";
import { useSiteTheme } from "../use-site-theme";

export default function AntdExampleFrame({ children }: { children: React.ReactNode }) {
  const dark = useSiteTheme();
  const brand = useAntdBrandTokens(dark);
  return (
    <ConfigProvider
      theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm, token: brand }}
    >
      <TokenVariables dark={dark}>{children}</TokenVariables>
    </ConfigProvider>
  );
}

/**
 * The `--ant-*` variables `@zoblocks/signature`'s stylesheet reads.
 *
 * antd defines them only under the css-var class it puts on its own
 * components, so the Signature's markup outside a `Form` — a locked or revoked
 * record — fell back to the light defaults baked into each `var()`. Writing
 * them on the wrapper gives every descendant the themed values.
 */
function TokenVariables({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  const { token } = theme.useToken();
  const style = {
    colorScheme: dark ? "dark" : undefined,
    "--ant-border-radius": `${token.borderRadius}px`,
    "--ant-border-radius-lg": `${token.borderRadiusLG}px`,
    "--ant-color-bg-container": token.colorBgContainer,
    "--ant-color-border": token.colorBorder,
    "--ant-color-border-secondary": token.colorBorderSecondary,
    "--ant-color-error": token.colorError,
    "--ant-color-error-border": token.colorErrorBorder,
    "--ant-color-fill-quaternary": token.colorFillQuaternary,
    "--ant-color-fill-tertiary": token.colorFillTertiary,
    "--ant-color-primary": token.colorPrimary,
    "--ant-color-text": token.colorText,
    "--ant-color-text-description": token.colorTextDescription,
    "--ant-color-text-quaternary": token.colorTextQuaternary,
    "--ant-color-text-secondary": token.colorTextSecondary,
    "--ant-font-size": `${token.fontSize}px`,
  } as React.CSSProperties;
  return (
    <div className="w-full" style={style}>
      {children}
    </div>
  );
}

"use client";

/**
 * The Ant Design bridge — a separate entry point on purpose.
 *
 *     import { AntdTabsBridge } from "@oxygenui-design/tabs/antd";
 *
 * `styles.css` already falls back to `--ant-*` custom properties, so a host
 * running `ConfigProvider` with `cssVar` enabled gets a matching strip with no
 * JavaScript at all. This module is for the other case: a host on antd's
 * default (non-cssVar) theme, where the tokens exist only in JavaScript.
 *
 * It lives behind `./antd` rather than in the main entry so that a host with
 * no antd never pays for the import — `antd` is an optional peer, and the
 * package is fully usable without it.
 */

import * as React from "react";
import { theme } from "antd";

export interface AntdTabsTokens extends React.CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

/**
 * Maps antd's resolved token set onto the `--ox-tabs-*` override surface.
 *
 * Only the tokens whose meaning genuinely matches are mapped. `controlHeight`
 * becomes the hit target, `borderRadius` drives the concentric track/thumb
 * pair, `colorPrimary` becomes the indicator. Anything without an honest
 * counterpart is left alone so the stylesheet's own fallback chain wins.
 */
export function useAntdTabsTokens(): AntdTabsTokens {
  const { token } = theme.useToken();

  return React.useMemo<AntdTabsTokens>(() => {
    const radius = token.borderRadiusLG ?? token.borderRadius ?? 8;
    const pad = 4;
    return {
      "--ox-tabs-font": `${token.fontSize}px`,
      "--ox-tabs-min-h": `${token.controlHeight}px`,
      "--ox-tabs-fg": token.colorTextSecondary,
      "--ox-tabs-fg-hover": token.colorText,
      "--ox-tabs-fg-selected": token.colorText,
      "--ox-tabs-fg-disabled": token.colorTextDisabled,
      "--ox-tabs-track-bg": token.colorFillTertiary,
      // Concentric radii: the inner corner is the outer corner minus the
      // inset, which is why a thumb that simply reuses the track radius looks
      // subtly wrong at every size.
      "--ox-tabs-track-radius": `${radius + pad}px`,
      "--ox-tabs-thumb-radius": `${radius}px`,
      "--ox-tabs-track-pad": `${pad}px`,
      "--ox-tabs-thumb-bg": token.colorBgContainer,
      "--ox-tabs-accent": token.colorPrimary,
      "--ox-tabs-accent-fg": token.colorPrimaryHover,
      "--ox-tabs-accent-subtle": token.colorPrimaryBg,
      "--ox-tabs-accent-border": token.colorPrimaryBorder,
      "--ox-tabs-border": token.colorBorder,
      "--ox-tabs-rail": token.colorBorderSecondary,
      "--ox-tabs-surface": token.colorBgContainer,
      "--ox-tabs-surface-subtle": token.colorFillQuaternary,
      "--ox-tabs-badge-bg": token.colorFillTertiary,
      "--ox-tabs-badge-fg": token.colorTextSecondary,
      "--ox-tabs-critical": token.colorError,
      "--ox-tabs-critical-bg": token.colorErrorBg,
      "--ox-tabs-critical-border": token.colorErrorBorder,
      "--ox-tabs-high": token.colorWarning,
      "--ox-tabs-high-bg": token.colorWarningBg,
      "--ox-tabs-high-border": token.colorWarningBorder,
      "--ox-tabs-normal": token.colorSuccess,
      "--ox-tabs-focus": token.colorPrimary,
      "--ox-tabs-duration": token.motionDurationMid,
      "--ox-tabs-ease": token.motionEaseInOut,
    };
  }, [token]);
}

export interface AntdTabsBridgeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrap a subtree to give every Oxygen tab strip inside it the host's antd
 * theme. One element, no context, no re-render beyond the token change itself.
 */
export function AntdTabsBridge({ children, className }: AntdTabsBridgeProps) {
  const style = useAntdTabsTokens();
  return React.createElement("div", { className, style, "data-ox-antd-bridge": "" }, children);
}

"use client";

/**
 * Deprecated. Use `@oxygenui-design/bridge-antd`.
 *
 *     - import { AntdTabsBridge } from "@oxygenui-design/tabs/antd";
 *     + import { AntdBridge }     from "@oxygenui-design/bridge-antd";
 *
 * This subpath bridged one component. Doing it per package meant every
 * component wanting a host's theme grew its own copy of the same mapping, and
 * a host running three of them mounted three wrappers that each called
 * `theme.useToken()` and each decided separately what `colorTextSecondary`
 * meant. The bridge is now one package writing the *semantic* tier, so mapping
 * `colorPrimary` once reaches every Oxygen component rather than only tabs.
 *
 * **This file is frozen.** It is a compatibility shim, deliberately holding
 * its original behaviour rather than delegating to the new bridge: the two
 * write different token tiers and a different marker attribute, so delegating
 * would make a deprecation into a breaking change. Duplication in code
 * scheduled for deletion is the cheaper mistake.
 *
 * Kept for two minors, per the deprecation sequence in ADR 0006. The notice
 * is the `@deprecated` tag below — which every editor surfaces at the call
 * site — plus the changeset and the migration guide. Deliberately not a
 * runtime `console.warn`: writing to a customer's console from source they
 * copied is forbidden repo-wide, and `packages/tabs/src/internal.ts` records
 * why a warning is the wrong volume regardless. Removed in 0.3.0.
 *
 * One behaviour is *not* carried over: this shim still maps antd's
 * `colorError` and `colorWarning` onto the tab strip's clinical tokens, which
 * the new bridge refuses. That refusal is the point of ADR 0012, and changing
 * it here would alter what existing consumers already render.
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
/** @deprecated Use `useAntdTokens` from `@oxygenui-design/bridge-antd`. */
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
/** @deprecated Use `AntdBridge` from `@oxygenui-design/bridge-antd`. */
export function AntdTabsBridge({ children, className }: AntdTabsBridgeProps) {
  const style = useAntdTabsTokens();
  return React.createElement("div", { className, style, "data-ox-antd-bridge": "" }, children);
}

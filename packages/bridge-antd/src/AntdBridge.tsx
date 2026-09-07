"use client";

/**
 * The React half of the Ant Design bridge.
 *
 *     import { AntdBridge } from "@zoblocks/bridge-antd";
 *
 *     <ConfigProvider theme={{ token: brand }}>
 *       <AntdBridge>
 *         <Switch label="Contact precautions" … />
 *       </AntdBridge>
 *     </ConfigProvider>
 *
 * One element, no context, and no re-render beyond the token change itself.
 * Application code inside is byte-identical to what it would be under the MUI
 * bridge or under no bridge at all — which is the whole architectural claim,
 * and it is asserted in the cross-host E2E rather than left as a promise.
 *
 * **When you need this.** A host running `ConfigProvider` with `cssVar` enabled
 * already gets a matching result from the stylesheet's own fallback chain, with
 * no JavaScript. This is for the other case: antd's default theme, where the
 * tokens exist only in JavaScript. It is also *required* rather than optional
 * in an application running two UI frameworks, because a CSS `var()` chain is
 * ordered rather than conditional and cannot tell which framework owns a
 * subtree — only a mounted bridge is scoped to one.
 */

import * as React from "react";
import { theme } from "antd";
import { assertBridgeOutput, resolvePatch, type TokenPatch } from "@zoblocks/bridge-core";
import { antdBridge, type AntdTokens } from "./map";

/**
 * The custom properties this host's antd theme resolves to.
 *
 * For a host that owns its own wrapper element and wants to spread the result
 * itself rather than accept ours.
 */
export function useAntdTokens(): TokenPatch {
  const { token } = theme.useToken();

  return React.useMemo(() => {
    const patch = resolvePatch(antdBridge, token as AntdTokens);
    // Throws if this bridge ever writes a clinical token. Deterministic, so it
    // fires on the first render in development and in CI rather than reaching
    // a customer — and loudly, because the alternative is a host's brand red
    // silently standing in for `status.critical`.
    assertBridgeOutput(antdBridge.id, patch);
    return patch;
  }, [token]);
}

export interface AntdBridgeProps {
  children: React.ReactNode;
  className?: string;
  /**
   * The element to render. `div` by default; `span` when the bridge sits
   * inside a paragraph or a table cell where a block element would break the
   * layout it is wrapping.
   */
  as?: "div" | "span";
}

export function AntdBridge({ children, className, as = "div" }: AntdBridgeProps) {
  const style = useAntdTokens();
  return React.createElement(as, { className, style, "data-zb-bridge": antdBridge.id }, children);
}

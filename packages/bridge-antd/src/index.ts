/**
 * @zoblocks/bridge-antd — Zoblocks components in an Ant Design host's
 * design language.
 *
 *     pnpm add @zoblocks/bridge-antd
 *
 * antd is an optional peer and is imported only by this package, so a consumer
 * who does not install the bridge never resolves it. Switching to another
 * framework later means changing which bridge is mounted; no component import
 * and no call site changes.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

export { AntdBridge, useAntdTokens, type AntdBridgeProps } from "./AntdBridge";
export { antdBridge, type AntdTokens } from "./map";

export { ZoblocksAntdProvider, type ZoblocksAntdProviderProps } from "./ZoblocksAntdProvider";
export { NOT_PUSHED_TO_ANTD, toAntdTheme, type AntdThemeConfig } from "./inverse";

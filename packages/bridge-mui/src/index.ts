/**
 * @oxygenui-design/bridge-mui — Oxygen components in a Material UI host's
 * design language.
 *
 *     pnpm add @oxygenui-design/bridge-mui
 *
 * `@mui/material` is a peer imported only by this package. A consumer on antd
 * never resolves it, and moving between the two means changing which bridge is
 * mounted — no component import changes, no call site changes.
 *
 * See content/decisions/0012-token-surface-is-a-contract.md.
 */

export { MuiBridge, useMuiTokens, type MuiBridgeProps } from "./MuiBridge";
export { muiBridge, type MuiTheme } from "./map";

export { OxygenMuiProvider, type OxygenMuiProviderProps } from "./OxygenMuiProvider";
export { NOT_PUSHED_TO_MUI, toMuiTheme, type MuiThemeOptions } from "./inverse";

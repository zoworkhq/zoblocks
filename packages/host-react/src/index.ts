/**
 * @oxygenui-design/host-react — the chrome around a clinical component,
 * resolved from whichever UI framework the host application runs.
 *
 *     pnpm add @oxygenui-design/host-react
 *
 * The root entry carries the contract, the context and the Oxygen
 * implementation, and imports no UI framework. The two framework hosts are
 * behind subpath exports:
 *
 *     import { AntdHost } from "@oxygenui-design/host-react/antd";
 *     import { MuiHost }  from "@oxygenui-design/host-react/mui";
 *
 * so a consumer resolves antd or MUI only by mounting one — and, in an app
 * that code-splits, downloads it only then. Measured: antd's seven components
 * with `ConfigProvider` are 142 KB gzipped and MUI's are 76 KB, which is why
 * the split is structural rather than an optimisation.
 *
 * **This package must never be imported by a component.** ADR 0010 keeps
 * Oxygen's primitives free of any framework dependency, and that survives only
 * while `host-react` stays at the composition layer. A dependency-cruiser rule
 * enforces it; see `.dependency-cruiser.cjs`.
 */

export {
  HOST_IDS,
  HOST_LABEL,
  type HostButtonProps,
  type HostCheckboxProps,
  type HostId,
  type HostInputProps,
  type HostMode,
  type HostPrimitives,
  type HostProviderProps,
  type HostSelectOption,
  type HostSelectProps,
  type HostSwitchProps,
  type HostTabItem,
  type HostTabsProps,
} from "./contract";

export { HostPrimitivesProvider, useHost, useHostId } from "./context";
export { OxygenHost, oxygenPrimitives } from "./oxygen";

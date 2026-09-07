"use client";

/**
 * The Ant Design host.
 *
 *     import { AntdHost } from "@zoblocks/host-react/antd";
 *
 *     <AntdHost mode="light">
 *       <YourDemo />          // unchanged
 *     </AntdHost>
 *
 * Real antd components — `Button` with its wave animation, `Input`, `Switch`,
 * `Tabs` with its ink bar. Not reproductions: the point of the switch is to
 * show what the framework actually renders, and a hand-drawn copy would be
 * wrong in exactly the details a reader is looking for.
 *
 * Almost every adapter here is a pass-through, because the contract's prop
 * shapes are antd's — see `contract.ts`. The two that are not are `Input`,
 * which grows a label antd has no slot for, and `Select`, whose options this
 * contract types more narrowly than antd does.
 *
 * This module is the only place antd is imported. A consumer who never mounts
 * this host never resolves it, which is what `peerDependenciesMeta.optional`
 * in `package.json` is for.
 */

import * as React from "react";
import { Button, Checkbox, ConfigProvider, Input, Select, Switch, Tabs, theme } from "antd";
import { AntdBridge } from "@zoblocks/bridge-antd";
import type {
  HostButtonProps,
  HostCheckboxProps,
  HostInputProps,
  HostPrimitives,
  HostProviderProps,
  HostSelectProps,
  HostSwitchProps,
  HostTabsProps,
} from "./contract";
import { HostPrimitivesProvider } from "./context";

function AntdButton({ type = "default", htmlType = "button", children, ...rest }: HostButtonProps) {
  return (
    <Button type={type} htmlType={htmlType} {...rest}>
      {children}
    </Button>
  );
}

/**
 * antd has no notched label, so the label is rendered above the field.
 *
 * Stated rather than approximated. Material's floating label is cut into the
 * border and is the most recognisable thing about a Material text field;
 * drawing something similar here would misrepresent what antd looks like,
 * which is the one thing this component exists to show.
 */
function AntdInput({ label, size = "middle", className, ...rest }: HostInputProps) {
  const id = React.useId();
  const field = <Input id={label ? id : undefined} size={size} {...rest} />;
  if (!label) return <span className={className}>{field}</span>;
  return (
    <span className={className} style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor={id} style={{ fontSize: 12, color: "var(--zb-text-muted)", lineHeight: 1.2 }}>
        {label}
      </label>
      {field}
    </span>
  );
}

/**
 * The one antd handler that is not a pass-through.
 *
 * antd calls `onChange(checked, event)` — two arguments, with the event
 * second. The contract promises one, and a caller who wrote
 * `onChange={(checked) => …}` would never notice the difference; a caller who
 * spread the arguments, or passed a function whose second parameter means
 * something else, very much would. Normalised here rather than documented as
 * a quirk.
 */
function AntdSwitch({ onChange, "aria-label": ariaLabel, ...rest }: HostSwitchProps) {
  return <Switch aria-label={ariaLabel} onChange={(checked) => onChange?.(checked)} {...rest} />;
}

function AntdCheckbox({ onChange, children, ...rest }: HostCheckboxProps) {
  return (
    <Checkbox {...rest} onChange={(event) => onChange?.(event.target.checked)}>
      {children}
    </Checkbox>
  );
}

function AntdSelect({
  options,
  label,
  size = "middle",
  className,
  onChange,
  ...rest
}: HostSelectProps) {
  const control = (
    <Select
      size={size}
      onChange={(next: string) => onChange?.(next)}
      options={options.map((option) => ({ ...option }))}
      style={{ minWidth: 160 }}
      {...rest}
    />
  );
  if (!label) return <span className={className}>{control}</span>;
  return (
    <span className={className} style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "var(--zb-text-muted)", lineHeight: 1.2 }}>{label}</span>
      {control}
    </span>
  );
}

/** antd v6 takes `items` directly, which is the shape the contract borrowed. */
function AntdTabs({ items, className, ...rest }: HostTabsProps) {
  return <Tabs className={className} items={items.map((item) => ({ ...item }))} {...rest} />;
}

export const antdPrimitives: HostPrimitives = {
  id: "antd",
  Button: AntdButton,
  Input: AntdInput,
  Switch: AntdSwitch,
  Checkbox: AntdCheckbox,
  Select: AntdSelect,
  Tabs: AntdTabs,
};

/**
 * `ConfigProvider` for antd, `AntdBridge` for everything else.
 *
 * The order matters and is not interchangeable: the bridge reads the resolved
 * theme through `theme.useToken()`, so it has to be *inside* the provider that
 * sets it. Outside, it would read antd's defaults and write them over a page
 * that had been configured differently.
 *
 * The theme is antd's own untouched default. That is a decision rather than an
 * omission — a reader comparing frameworks should see what antd actually ships,
 * including that white-on-#1677ff is 4.10:1 and fails AA. Nudging
 * `colorPrimary` until it passed would make a prettier demo and a false one.
 */
export function AntdHost({ mode, children, className }: HostProviderProps) {
  // No `cssVar` here: v6 emits custom properties by default and narrowed the
  // option to `{ prefix?, key? }`, so passing `true` is now a type error
  // rather than the switch it was in v5.
  const config = React.useMemo(
    () => ({
      algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }),
    [mode],
  );

  return (
    <ConfigProvider theme={config}>
      <AntdBridge className={className}>
        <HostPrimitivesProvider value={antdPrimitives}>{children}</HostPrimitivesProvider>
      </AntdBridge>
    </ConfigProvider>
  );
}

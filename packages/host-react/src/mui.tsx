"use client";

/**
 * The Material UI host.
 *
 *     import { MuiHost } from "@zoblocks/host-react/mui";
 *
 *     <MuiHost mode="light">
 *       <YourDemo />          // byte-identical to the antd page
 *     </MuiHost>
 *
 * Real `@mui/material` components, which means the real `ButtonBase` — so the
 * ripple, the elevation transition and the focus ripple all come from MUI
 * itself rather than from anything written here. `disableRipple` is never set;
 * a Material button without its ripple is not what MUI renders and would
 * misrepresent the framework in the one place a reader is looking closely.
 *
 * **The translations, all of them.** Every one is a place the two frameworks
 * genuinely disagree, and the contract keeps antd's shape (ADR 0010), so this
 * file is where the difference gets paid:
 *
 *   antd                        MUI
 *   type="primary"           →  variant="contained"
 *   type="default"           →  variant="outlined"
 *   type="text"              →  variant="text"
 *   danger                   →  color="error"
 *   size="middle"            →  size="medium"   (antd's middle has no MUI name)
 *   htmlType                 →  type
 *   Switch onChange(checked) →  onChange(event, checked)
 *   Checkbox onChange(bool)  →  onChange(event, checked)
 *   Select options[]         →  <MenuItem> children
 *   Tabs items[]             →  <Tab> children + the active item's panel
 *
 * Anything MUI cannot express is not approximated silently: `status="warning"`
 * has no counterpart in MUI's `TextField` colour set, so it maps to `warning`
 * only where MUI has one and is otherwise dropped, and that is recorded here.
 */

import * as React from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MuiBridge } from "@zoblocks/bridge-mui";
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

const VARIANT = {
  primary: "contained",
  default: "outlined",
  text: "text",
} as const;

/** antd has three sizes and calls the middle one `middle`; MUI calls it `medium`. */
const SIZE = { small: "small", middle: "medium", large: "large" } as const;

function MuiButton({
  type = "default",
  danger,
  disabled,
  size = "middle",
  htmlType = "button",
  onClick,
  className,
  children,
}: HostButtonProps) {
  return (
    <Button
      variant={VARIANT[type]}
      color={danger ? "error" : "primary"}
      size={SIZE[size]}
      disabled={disabled}
      type={htmlType}
      onClick={onClick}
      className={className}
    >
      {children}
    </Button>
  );
}

/**
 * The outlined field, with its label in the notch.
 *
 * `variant="outlined"` is MUI's default and the notched label is the whole
 * visual signature — a Material text field drawn without it reads as a
 * generic input. With no `label` MUI leaves the notch closed, which is the
 * correct rendering rather than a degraded one.
 */
function MuiInput({
  value,
  defaultValue,
  placeholder,
  disabled,
  size = "middle",
  status,
  onChange,
  label,
  className,
  ...rest
}: HostInputProps) {
  return (
    <TextField
      variant="outlined"
      // MUI's TextField has no `large`; `medium` is its largest. Mapping
      // `large` to `medium` loses a step rather than inventing one.
      size={size === "small" ? "small" : "medium"}
      label={label}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
      error={status === "error"}
      color={status === "warning" ? "warning" : undefined}
      onChange={onChange}
      className={className}
      slotProps={{ htmlInput: { "aria-label": rest["aria-label"] } }}
    />
  );
}

function MuiSwitch({
  checked,
  defaultChecked,
  disabled,
  size = "default",
  onChange,
  className,
  ...rest
}: HostSwitchProps) {
  return (
    <Switch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      size={size === "small" ? "small" : "medium"}
      className={className}
      // The signature difference: MUI passes the event first.
      onChange={(_event, next) => onChange?.(next)}
      slotProps={{ input: { "aria-label": rest["aria-label"] } }}
    />
  );
}

function MuiCheckbox({
  checked,
  defaultChecked,
  indeterminate,
  disabled,
  onChange,
  className,
  children,
}: HostCheckboxProps) {
  const control = (
    <Checkbox
      checked={checked}
      defaultChecked={defaultChecked}
      indeterminate={indeterminate}
      disabled={disabled}
      onChange={(_event, next) => onChange?.(next)}
    />
  );
  // Without a label MUI renders a bare control; `FormControlLabel` is what
  // makes the text a real label rather than a span beside a box.
  if (!children) return <span className={className}>{control}</span>;
  return <FormControlLabel className={className} control={control} label={children} />;
}

function MuiSelect({
  value,
  defaultValue,
  options,
  disabled,
  size = "middle",
  onChange,
  label,
  className,
  ...rest
}: HostSelectProps) {
  const id = React.useId();
  return (
    <FormControl
      className={className}
      size={size === "small" ? "small" : "medium"}
      disabled={disabled}
      sx={{ minWidth: 160 }}
    >
      {label ? <InputLabel id={id}>{label}</InputLabel> : null}
      <Select
        labelId={label ? id : undefined}
        label={label}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(String(event.target.value))}
        inputProps={{ "aria-label": label ? undefined : rest["aria-label"] }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/**
 * MUI splits what antd unifies.
 *
 * `Tabs` renders the strip and nothing else — panels are the caller's problem,
 * which is why the contract's `items[].children` is rendered here rather than
 * handed to MUI. The panel carries the ARIA wiring MUI does not supply.
 */
function MuiTabs({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  className,
  ...rest
}: HostTabsProps) {
  const first = defaultActiveKey ?? items[0]?.key ?? "";
  const [internal, setInternal] = React.useState(first);
  const key = activeKey ?? internal;
  const active = items.find((item) => item.key === key) ?? items[0];
  const id = React.useId();

  return (
    <div className={className}>
      <Tabs
        value={active?.key ?? false}
        aria-label={rest["aria-label"]}
        onChange={(_event, next: string) => {
          if (activeKey === undefined) setInternal(next);
          onChange?.(next);
        }}
      >
        {items.map((item) => (
          <Tab
            key={item.key}
            value={item.key}
            label={item.label}
            disabled={item.disabled}
            id={`${id}-tab-${item.key}`}
            aria-controls={`${id}-panel-${item.key}`}
          />
        ))}
      </Tabs>
      {active?.children ? (
        <div
          role="tabpanel"
          id={`${id}-panel-${active.key}`}
          aria-labelledby={`${id}-tab-${active.key}`}
          style={{ paddingTop: 16 }}
        >
          {active.children}
        </div>
      ) : null}
    </div>
  );
}

export const muiPrimitives: HostPrimitives = {
  id: "mui",
  Button: MuiButton,
  Input: MuiInput,
  Switch: MuiSwitch,
  Checkbox: MuiCheckbox,
  Select: MuiSelect,
  Tabs: MuiTabs,
};

/**
 * `ThemeProvider` for MUI, `MuiBridge` for everything else.
 *
 * Same ordering rule as the antd host: the bridge reads the resolved theme
 * through `useTheme()`, so it must sit inside the provider that sets it.
 *
 * MUI's own default theme, unmodified. Its light palette clears three of the
 * four pairs the docs measure and fails `text.disabled` at 2.68:1 — shown
 * rather than corrected, for the same reason antd's blue is.
 */
export function MuiHost({ mode, children, className }: HostProviderProps) {
  const theme = React.useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <MuiBridge className={className}>
        <HostPrimitivesProvider value={muiPrimitives}>{children}</HostPrimitivesProvider>
      </MuiBridge>
    </ThemeProvider>
  );
}

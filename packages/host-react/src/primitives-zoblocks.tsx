"use client";

/**
 * The default host — ZoBlocks's own chrome.
 *
 * These are **reference primitives, not registry components.** Nothing here
 * ships through `zoblocks add`, nothing here appears in the catalog, and no
 * clinical component imports them. They exist so the framework switch has a
 * third state that is genuinely ours rather than "antd with the colours
 * changed", and so a page with no framework mounted still has a button.
 *
 * That distinction matters more than it looks. ADR 0010 says ZoBlocks's
 * primitives match Ant Design's API and take no dependency on it; the day
 * these become registry components is the day that ADR needs revisiting, and
 * the docs need to stop calling them chrome. Until then they live here, at the
 * composition layer, where a dependency-cruiser rule forbids the component
 * layer from reaching them.
 *
 * Structure only. Every colour, radius and duration comes from `--zb-*`, so
 * these restyle under a bridge exactly as a clinical component does — which
 * is the whole reason the ZoBlocks state is worth having in the switcher.
 * Styles are in `host.css`, imported by the consumer.
 *
 * Kept apart from `ZoBlocksHost` so this module imports nothing but the
 * contract. `context.tsx` seeds its default from `zoblocksPrimitives`, and if
 * that value lived beside the provider the two would import each other — a
 * cycle whose only symptom is `Cannot access 'zoblocksPrimitives' before
 * initialization` at runtime, long after the type checker has passed.
 */

import * as React from "react";
import type {
  HostButtonProps,
  HostCheckboxProps,
  HostInputProps,
  HostPrimitives,
  HostSelectProps,
  HostSwitchProps,
  HostTabsProps,
} from "./contract";

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(" ");

/**
 * Controlled or not, without two code paths.
 *
 * Both frameworks accept either, and a demo that only worked controlled would
 * force every call site to carry state it does not need.
 */
function useControllable<T>(value: T | undefined, fallback: T): [T, (next: T) => void, boolean] {
  const [internal, setInternal] = React.useState<T>(fallback);
  const controlled = value !== undefined;
  return [controlled ? (value as T) : internal, setInternal, controlled];
}

function Button({
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
    <button
      // `htmlType` is the contract's name for the DOM type, because antd
      // took `type` for the visual variant.
      type={htmlType}
      disabled={disabled}
      onClick={onClick}
      data-zb-host-variant={type}
      data-zb-host-size={size}
      data-zb-host-danger={danger ? "" : undefined}
      className={cx("zb-host-btn", className)}
    >
      {children}
    </button>
  );
}

function Input({
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
  const id = React.useId();
  return (
    <span className={cx("zb-host-field", className)} data-zb-host-size={size}>
      {label ? (
        <label className="zb-host-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="text"
        className="zb-host-field__input"
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        data-zb-host-status={status}
        aria-label={rest["aria-label"]}
      />
    </span>
  );
}

function Switch({
  checked,
  defaultChecked = false,
  disabled,
  size = "default",
  onChange,
  className,
  ...rest
}: HostSwitchProps) {
  const [on, setOn, controlled] = useControllable(checked, defaultChecked);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      data-zb-host-size={size}
      className={cx("zb-host-switch", className)}
      onClick={() => {
        if (!controlled) setOn(!on);
        onChange?.(!on);
      }}
    >
      <span className="zb-host-switch__thumb" />
    </button>
  );
}

function Checkbox({
  checked,
  defaultChecked = false,
  indeterminate,
  disabled,
  onChange,
  className,
  children,
}: HostCheckboxProps) {
  const [on, setOn, controlled] = useControllable(checked, defaultChecked);
  const ref = React.useRef<HTMLInputElement>(null);

  // `indeterminate` has no attribute; it exists only as a DOM property, which
  // is why every implementation of this control sets it in an effect.
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  return (
    <label className={cx("zb-host-check", className)}>
      <input
        ref={ref}
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(event) => {
          if (!controlled) setOn(event.target.checked);
          onChange?.(event.target.checked);
        }}
      />
      {children ? <span>{children}</span> : null}
    </label>
  );
}

function Select({
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
    <span className={cx("zb-host-field", className)} data-zb-host-size={size}>
      {label ? (
        <label className="zb-host-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        className="zb-host-field__input zb-host-select"
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-label={rest["aria-label"]}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function Tabs({ items, activeKey, defaultActiveKey, onChange, className, ...rest }: HostTabsProps) {
  const first = defaultActiveKey ?? items[0]?.key ?? "";
  const [key, setKey, controlled] = useControllable(activeKey, first);
  const active = items.find((item) => item.key === key) ?? items[0];
  const id = React.useId();

  /**
   * APG's tab keys, with manual activation: arrows move focus, Enter or Space
   * (the button's own click) selects. Manual because antd's rc-tabs and MUI's
   * default both are, and the switcher must not change how a strip is driven.
   * Disabled tabs are skipped, as both frameworks skip them.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    if (tabs.length === 0) return;
    const current = tabs.indexOf(event.target as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
        next = (current + 1) % tabs.length;
        break;
      case "ArrowLeft":
        // From outside the enabled set, -1 lands on the last tab.
        next = (Math.max(current, 0) - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    tabs[next]?.focus();
  };

  return (
    <div className={cx("zb-host-tabs", className)}>
      <div
        className="zb-host-tabs__strip"
        role="tablist"
        aria-label={rest["aria-label"]}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const selected = item.key === active?.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`${id}-tab-${item.key}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${item.key}`}
              // Roving tabindex, as APG's tab pattern requires: the strip is
              // one tab stop rather than one per tab.
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className="zb-host-tabs__tab"
              onClick={() => {
                if (!controlled) setKey(item.key);
                onChange?.(item.key);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active?.children ? (
        <div
          role="tabpanel"
          id={`${id}-panel-${active.key}`}
          aria-labelledby={`${id}-tab-${active.key}`}
          className="zb-host-tabs__panel"
        >
          {active.children}
        </div>
      ) : null}
    </div>
  );
}

export const zoblocksPrimitives: HostPrimitives = {
  id: "zoblocks",
  Button,
  Input,
  Switch,
  Checkbox,
  Select,
  Tabs,
};

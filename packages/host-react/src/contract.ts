/**
 * The host-primitive contract.
 *
 * Oxygen ships 28 components and none of them is a Button. That is deliberate
 * — ADR 0010 puts primitives at Ant Design's public API and takes no
 * dependency on it — but it leaves a real gap in a demo: the chrome around a
 * clinical component (the acknowledge button, the note field, the tab strip)
 * has to come from somewhere, and in a host application it comes from
 * whichever UI framework that application already runs.
 *
 * This module names that set and nothing else. It renders nothing, imports no
 * framework, and is safe for any consumer to depend on; the three
 * implementations live behind subpath exports so that importing the contract
 * never pulls antd or MUI into the graph.
 *
 * **Props are Ant Design's, per ADR 0010.** That is not a preference for antd:
 * it is the only choice that keeps one shape for the call site, because
 * Oxygen's own primitives already match antd exactly, so the antd adapter is a
 * pass-through and only MUI needs translation. Where the two frameworks
 * genuinely disagree the antd shape wins and the MUI adapter converts — each
 * conversion is named in `mui.tsx` rather than left for a reader to discover.
 *
 * **What is deliberately absent.** No Modal, no Tooltip, no DatePicker, no
 * Table. Each of those is either a clinical component Oxygen already owns
 * (DatePicker, DataGrid) or an overlay whose focus-management differences
 * between the two frameworks are large enough that a shared prop shape would
 * be a lie. Six primitives is the set that translates honestly.
 */

import type * as React from "react";

/** The three design languages a demo can render in. */
export type HostId = "oxygen" | "antd" | "mui";

/** In switcher order: the default first, then the two frameworks. */
export const HOST_IDS: readonly HostId[] = ["oxygen", "antd", "mui"];

export const HOST_LABEL: Record<HostId, string> = {
  oxygen: "Oxygen",
  antd: "Ant Design",
  mui: "Material UI",
};

/**
 * Light or dark, passed in rather than read.
 *
 * Neither framework can inherit a colour mode from CSS: antd resolves its
 * palette from an algorithm in React and MUI from a theme object, so a host
 * that does not tell them renders a light palette inside a dark page. The
 * docs site already learned this once — see `use-site-theme.ts`.
 */
export type HostMode = "light" | "dark";

/* ------------------------------------------------------------------ */
/* Prop shapes                                                         */
/* ------------------------------------------------------------------ */

export interface HostButtonProps {
  /** antd's vocabulary. MUI maps primary → contained, default → outlined, text → text. */
  type?: "primary" | "default" | "text";
  danger?: boolean;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  /** antd names the DOM type this way, because `type` is taken. */
  htmlType?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: React.ReactNode;
}

export interface HostInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  status?: "error" | "warning";
  /**
   * Both frameworks hand back a change event over an `<input>`, so this one
   * needs no translation — which is worth stating, because it is the only
   * event handler in the contract that does not.
   */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /**
   * MUI's outlined field puts its label in a notch cut out of the border, and
   * that notch is the single most recognisable thing about a Material text
   * field. antd has no equivalent and renders the label above the control.
   */
  label?: string;
  "aria-label"?: string;
  className?: string;
}

export interface HostSwitchProps {
  /** antd's shape: the handler receives the next value, not an event. */
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  size?: "small" | "default";
  onChange?: (checked: boolean) => void;
  "aria-label"?: string;
  className?: string;
}

export interface HostCheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface HostSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface HostSelectProps {
  value?: string;
  defaultValue?: string;
  options: readonly HostSelectOption[];
  disabled?: boolean;
  size?: "small" | "middle" | "large";
  onChange?: (value: string) => void;
  label?: string;
  "aria-label"?: string;
  className?: string;
}

export interface HostTabItem {
  key: string;
  label: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export interface HostTabsProps {
  /**
   * antd v6's `items` shape. MUI has no equivalent — it takes `Tab` children
   * and leaves panels to the caller — so the MUI adapter renders the strip
   * from this array and the active item's `children` beneath it.
   */
  items: readonly HostTabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
  "aria-label"?: string;
}

/* ------------------------------------------------------------------ */
/* The set                                                             */
/* ------------------------------------------------------------------ */

export interface HostPrimitives {
  /** Which implementation resolved. Read it to label a demo, never to branch on. */
  readonly id: HostId;
  readonly Button: React.ComponentType<HostButtonProps>;
  readonly Input: React.ComponentType<HostInputProps>;
  readonly Switch: React.ComponentType<HostSwitchProps>;
  readonly Checkbox: React.ComponentType<HostCheckboxProps>;
  readonly Select: React.ComponentType<HostSelectProps>;
  readonly Tabs: React.ComponentType<HostTabsProps>;
}

/**
 * Props every host wrapper takes.
 *
 * Identical across the three on purpose, exactly as `AntdBridge` and
 * `MuiBridge` are: the claim is that switching framework changes which
 * wrapper is mounted and nothing else, and two wrappers with different shapes
 * would quietly make that false.
 */
export interface HostProviderProps {
  mode: HostMode;
  children: React.ReactNode;
  className?: string;
}

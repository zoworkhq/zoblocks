"use client";

/**
 * The context every compound part reads.
 *
 * Deliberately one context rather than several: splitting selection from
 * geometry would let a `Tabs.Trigger` render outside a `Tabs.Root` and
 * silently do nothing, and "silently does nothing" is the failure mode this
 * whole component exists to avoid.
 */

import * as React from "react";
import type {
  Activation,
  Availability,
  ChangeSource,
  FillMode,
  IndicatorKind,
  MountStrategy,
  Orientation,
  OverflowStrategy,
  RoleSpec,
  SemanticMode,
  TabItem,
  TabSize,
  TabVariant,
  TabsLocale,
  Tone,
} from "@zoblocks/tabs-core";

export interface RegisteredTrigger {
  value: string;
  element: HTMLElement | null;
  item: TabItem;
}

export interface TabsContextValue {
  /** Stable id prefix, so trigger/panel wiring survives re-render. */
  baseId: string;
  mode: SemanticMode;
  roles: RoleSpec;
  variant: TabVariant;
  orientation: Orientation;
  activation: Activation;
  overflow: OverflowStrategy;
  indicator: IndicatorKind;
  size: TabSize | undefined;
  fill: FillMode;
  mount: MountStrategy;
  keepScroll: boolean;
  virtualise: boolean;
  locale: TabsLocale;

  value: string | undefined;
  /** True while an async `onBeforeChange` is unresolved: the strip is inert. */
  pending: boolean;
  select: (value: string, source: ChangeSource, item?: TabItem) => void;

  /** Registry in DOM order, so keyboard order matches what is on screen. */
  triggers: React.RefObject<RegisteredTrigger[]>;
  register: (entry: RegisteredTrigger) => () => void;
  /** Re-sorts the registry if keyed triggers moved; bumps the version if so. */
  orderRegistry: () => void;
  /** Bumped whenever registration changes, to re-run measurement. */
  registryVersion: number;

  /** Set of values whose panel has ever been mounted, for `lazy-once`. */
  visited: ReadonlySet<string>;

  /**
   * Values that currently have a panel in the DOM.
   *
   * `aria-controls` must point at an element that exists. A tab strip used
   * without panels — a stepper driving a form elsewhere, a radiogroup skin —
   * would otherwise emit a dangling reference, which is an outright ARIA
   * violation rather than a matter of taste.
   */
  panels: ReadonlySet<string>;
  registerPanel: (value: string) => () => void;

  closable: boolean;
  onCloseTab: ((value: string) => void) | undefined;
  onAddTab: (() => void) | undefined;
  onReorderTab: ((from: number, to: number) => void) | undefined;

  /** Panels report their scroll offsets here when `keepScroll` is on. */
  panelScroll: React.RefObject<Map<string, number>>;

  requestMeasure: () => void;
}

export const TabsContext = React.createContext<TabsContextValue | null>(null);

/**
 * Set by the declarative `Tabs`, read by `Tabs.Root`.
 *
 * When `Tabs` is driving, it has already validated the same items at render
 * time — more completely, and early enough to fail on a server. `Tabs.Root`
 * then skips its own late check, because two components reporting one problem
 * is how you get an `AggregateError` whose message is the empty string.
 */
export const ValidatedByParent = React.createContext(false);

/**
 * Values currently parked in the More menu, provided by `Tabs.List`.
 *
 * Their triggers hide from the strip, so no tab shows in both places.
 */
export const OverflowedValues = React.createContext<ReadonlySet<string>>(new Set());

export function useTabsContext(part: string): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(
      `<${part}> must be rendered inside <Tabs.Root>. Outside it there is no tablist to belong to, so the trigger would render as a button that announces nothing and controls nothing.`,
    );
  }
  return context;
}

/** Props shared by every trigger-shaped element. */
export interface TriggerVisuals {
  icon?: React.ReactNode;
  count?: number;
  tone?: Tone;
  dot?: boolean | "dirty" | "error";
  availability?: Availability;
}

export function idFor(baseId: string, value: string, part: "trigger" | "panel" | "reason"): string {
  // Values come from the host and may contain anything; a CSS-unsafe id would
  // break `aria-controls` lookups in some assistive technology.
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${baseId}-${part}-${safe}`;
}

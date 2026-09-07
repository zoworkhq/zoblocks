"use client";

/**
 * `useTabs` — the headless layer.
 *
 * Returns prop getters, so a team whose design bears no resemblance to any of
 * the eleven skins can still have Zoblocks's keyboard model and accessibility
 * tree rather than reinventing both badly. This is the escape hatch that stops
 * a customer forking the package.
 *
 *     const tabs = useTabs({ as: "radiogroup", items, value, onChange });
 *
 *     <div {...tabs.getListProps({ "aria-label": "Range" })}>
 *       {items.map((item, i) => <Chip key={item.value} {...tabs.getTriggerProps(i)} />)}
 *     </div>
 */

import * as React from "react";
import {
  ariaOrientation,
  createChangeGate,
  indexOfValue,
  initialValue,
  rolesFor,
  rovingTabIndex,
  tabStopIndex,
  type Activation,
  type BeforeChange,
  type ChangeSource,
  type Orientation,
  type SemanticMode,
  type TabItem,
} from "@zoblocks/tabs-core";
import { useControllableValue, useTabsKeyboard, useValidateConfig } from "./internal.js";

export interface UseTabsOptions {
  as: SemanticMode;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, meta: { via: ChangeSource }) => void;
  onBeforeChange?: BeforeChange;
  orientation?: Orientation;
  activation?: Activation;
  rtl?: boolean;
  loop?: boolean;
  idPrefix?: string;
}

export interface TriggerProps {
  id: string;
  role: "tab" | "radio" | undefined;
  tabIndex: 0 | -1;
  ref: (node: HTMLElement | null) => void;
  onClick: () => void;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean;
  "aria-current"?: "page" | undefined;
  "aria-controls"?: string | undefined;
  "aria-disabled"?: true | undefined;
  "data-zb-value": string;
  href?: string | undefined;
}

export interface UseTabsApi {
  value: string | undefined;
  selectedIndex: number;
  pending: boolean;
  select: (value: string, source?: ChangeSource) => void;
  getListProps: <T extends Record<string, unknown>>(
    extra?: T,
  ) => T & {
    role: "tablist" | "radiogroup" | undefined;
    "aria-orientation": Orientation | undefined;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  getTriggerProps: (index: number) => TriggerProps;
  getPanelProps: (index: number) => {
    id: string;
    role: "tabpanel";
    "aria-labelledby": string;
    hidden: boolean;
  };
  /** For a custom indicator: the element currently selected. */
  getSelectedElement: () => HTMLElement | null;
}

export function useTabs(options: UseTabsOptions): UseTabsApi {
  const {
    as: mode,
    items,
    value: controlledValue,
    defaultValue,
    onChange,
    onBeforeChange,
    orientation = "horizontal",
    activation = "automatic",
    rtl = false,
    loop = true,
    idPrefix,
  } = options;

  const generatedId = React.useId();
  const base = idPrefix ?? `zb-tabs-${generatedId.replace(/:/g, "")}`;
  const roles = rolesFor(mode);
  const elements = React.useRef<(HTMLElement | null)[]>([]);
  const [pending, setPending] = React.useState(false);

  useValidateConfig({
    mode,
    items,
    orientation,
    value: controlledValue,
    defaultValue,
  });

  const [value, setValue] = useControllableValue<string>({
    value: controlledValue,
    defaultValue: defaultValue ?? initialValue(items, defaultValue),
    onChange: onChange ? (next, via) => onChange(next, { via }) : undefined,
  });

  const gate = React.useMemo(
    () =>
      createChangeGate({
        onBeforeChange,
        onCommit: (next, source) => setValue(next, source),
        onPendingChange: setPending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setValue],
  );

  React.useEffect(() => gate.sync(value), [gate, value]);
  React.useEffect(() => {
    gate.activate();
    return () => gate.dispose();
  }, [gate]);

  const select = React.useCallback(
    (next: string, source: ChangeSource = "programmatic") => {
      const item = items.find((candidate) => candidate.value === next);
      void gate.request(next, source, item);
    },
    [gate, items],
  );

  const selectedIndex = indexOfValue(items, value);
  const stopIndex = tabStopIndex(items, selectedIndex);

  const focusIndex = React.useCallback((index: number) => {
    elements.current[index]?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = useTabsKeyboard({
    getItems: () => items,
    getFocusedIndex: () => {
      const active = typeof document === "undefined" ? null : document.activeElement;
      return elements.current.findIndex((element) => element === active);
    },
    focusIndex,
    select: (next, source, item) => {
      void gate.request(next, source, item);
    },
    activation,
    orientation,
    rtl,
    loop,
    enabled: roles.arrowKeys && !pending,
  });

  const idOf = (value: string, part: string) =>
    `${base}-${part}-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  return {
    value,
    selectedIndex,
    pending,
    select,

    getListProps: (extra) =>
      ({
        ...(extra ?? {}),
        role: roles.listRole ?? undefined,
        "aria-orientation": ariaOrientation(mode, orientation),
        onKeyDown,
      }) as never,

    getTriggerProps: (index) => {
      const item = items[index];
      if (!item) {
        throw new RangeError(
          `useTabs.getTriggerProps(${index}) — there is no item at that index. Prop getters are keyed by position, so this usually means the list rendered and the array did not.`,
        );
      }
      const selected = item.value === value;
      const base: TriggerProps = {
        id: idOf(item.value, "trigger"),
        role: roles.triggerRole ?? undefined,
        tabIndex: rovingTabIndex(index, stopIndex),
        ref: (node) => {
          elements.current[index] = node;
        },
        onClick: () => {
          void gate.request(item.value, "pointer", item);
        },
        "data-zb-value": item.value,
        ...(item.disabled ? { "aria-disabled": true as const } : {}),
      };

      if (roles.selectedAttr === "aria-checked") base["aria-checked"] = selected;
      else if (roles.selectedAttr === "aria-current") {
        base["aria-current"] = selected ? "page" : undefined;
        base.href = item.href;
      } else {
        base["aria-selected"] = selected;
        if (roles.ownsPanels) base["aria-controls"] = idOf(item.value, "panel");
      }

      return base;
    },

    getPanelProps: (index) => {
      const item = items[index];
      if (!item) {
        throw new RangeError(`useTabs.getPanelProps(${index}) — there is no item at that index.`);
      }
      return {
        id: idOf(item.value, "panel"),
        role: "tabpanel" as const,
        "aria-labelledby": idOf(item.value, "trigger"),
        hidden: item.value !== value,
      };
    },

    getSelectedElement: () => elements.current[selectedIndex] ?? null,
  };
}

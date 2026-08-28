"use client";

/**
 * `Tabs` — the declarative form, which is what nine hosts in ten should use.
 *
 *     <Tabs
 *       as="tabs"
 *       variant="segmented"
 *       defaultValue="personal"
 *       items={[
 *         { value: "personal", label: "Personal", children: <PersonalDocs /> },
 *         { value: "shared",   label: "Shared", count: 6, children: <SharedDocs /> },
 *       ]}
 *     />
 *
 * It is a thin composition over the compound parts, not a second
 * implementation — everything below is `Tabs.Root` + `Tabs.List` +
 * `Tabs.Trigger` + `Tabs.Panel`, so there is exactly one keyboard model and
 * one accessibility contract in the package.
 */

import * as React from "react";
import type { Availability, StepState, TabItem, Tone } from "@oxygenui-design/tabs-core";
import { TabsContext, ValidatedByParent } from "./context.js";
import { useValidateProps } from "./internal.js";
import { TabsRoot, type TabsRootProps } from "./TabsRoot.js";
import { TabsList } from "./TabsList.js";
import { TabsTrigger } from "./TabsTrigger.js";
import { TabsPanel, TabsPanels } from "./TabsPanel.js";

export interface TabsItemProps {
  value: string;
  label: React.ReactNode;
  /** Required when `label` is not a string. */
  textLabel?: string;
  icon?: React.ReactNode;
  count?: number;
  tone?: Tone;
  dot?: boolean | "dirty" | "error";
  availability?: Availability;
  disabled?: boolean;
  disabledReason?: string;
  closable?: boolean;
  href?: string;
  state?: StepState;
  /** Panel content. Ignored for `as="nav"` and `as="radiogroup"`. */
  children?: React.ReactNode;
  /** Per-panel mount override. */
  mount?: "eager" | "lazy" | "lazy-once";
}

export interface TabsProps extends Omit<TabsRootProps, "children"> {
  /**
   * The tabs, in order. Each carries its own trigger, panel and disabled state; the strip
   * derives its keyboard model from the enabled ones.
   */
  items: readonly TabsItemProps[];
  /** Required: the accessible name of the strip. */
  "aria-label": string;
  /** Rendered between the strip and the panels — a toolbar, a filter row. */
  toolbar?: React.ReactNode;
  /** Applied to the tablist element, for a host that needs to position the strip itself. */
  listClassName?: string;
  /** Applied to the panel container, not to each panel. */
  panelsClassName?: string;
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, "aria-label": label, toolbar, listClassName, panelsClassName, ...rootProps },
  ref,
) {
  const ownsPanels = rootProps.as === "tabs" || rootProps.as === "steps";

  /*
   * Validated here, at render, over the whole set.
   *
   * `items` is a prop, so nothing has to wait for the trigger registry — which
   * means this also runs on a server, where the registry never exists. That is
   * the difference between a tablist of links failing in CI and failing in
   * somebody's browser. `Tabs.Root` stands down (see `ValidatedByParent`) so
   * each problem has exactly one reporter.
   */
  useValidateProps({
    mode: rootProps.as,
    items: items as readonly TabItem[],
    overflow: rootProps.overflow,
    orientation: rootProps.orientation,
    value: rootProps.value,
    defaultValue: rootProps.defaultValue,
    hasPanels: items.some((item) => item.children !== undefined),
    hasCloseHandler: Boolean(rootProps.editable?.onClose),
  });

  return (
    <ValidatedByParent.Provider value={true}>
      <TabsRoot {...rootProps} ref={ref}>
        <TabsList
          aria-label={label}
          className={listClassName}
          extra={rootProps.editable?.onAdd ? <TabsAddButton /> : undefined}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              textLabel={item.textLabel}
              icon={item.icon}
              count={item.count}
              tone={item.tone}
              dot={item.dot}
              availability={item.availability}
              disabled={item.disabled}
              disabledReason={item.disabledReason}
              closable={item.closable}
              href={item.href}
              state={item.state}
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {toolbar}

        {ownsPanels && items.some((item) => item.children !== undefined) ? (
          <TabsPanels className={panelsClassName}>
            {items.map((item) => (
              <TabsPanel key={item.value} value={item.value} mount={item.mount}>
                {item.children}
              </TabsPanel>
            ))}
          </TabsPanels>
        ) : null}
      </TabsRoot>
    </ValidatedByParent.Provider>
  );
});

/**
 * The add-tab affordance.
 *
 * A real `<button>` outside the tab order's roving set — it is not a tab, and
 * giving it `role="tab"` would put an item in the "n of m" count that has no
 * panel.
 */
export function TabsAddButton({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(TabsContext);
  if (!context?.onAddTab) return null;
  return (
    <button
      {...rest}
      type="button"
      className={["ox-tabs__add", className].filter(Boolean).join(" ")}
      aria-label={context.locale.add}
      onClick={context.onAddTab}
    >
      <span aria-hidden="true">+</span>
    </button>
  );
}

"use client";

/**
 * `Tabs.List` — the strip.
 *
 * Owns the keyboard model, the indicator, and whichever overflow strategy is
 * in force. The five strategies are genuinely different trade-offs and none
 * dominates, so the component exposes the choice instead of picking. What it
 * will not do is the industry default: let the strip run off the viewport and
 * hope.
 */

import * as React from "react";
import {
  indexOfValue,
  interpolate,
  resolveIndicator,
  textOf,
  type TabItem,
} from "@oxygenui-design/tabs-core";
import { useTabsContext } from "./context.js";
import { useDirection, useIsoLayoutEffect, useTabsKeyboard } from "./internal.js";
import { useIndicator } from "./use-indicator.js";
import { useOverflow } from "./use-overflow.js";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Required: a tablist with no accessible name is announced as "tab list"
   *  and nothing else, which tells a screen-reader user nothing about which
   *  of the three strips on the page they have landed in. */
  "aria-label": string;
  /**
   * Controls that sit beside the tabs but are not tabs — an add button, a
   * filter, an overflow trigger.
   *
   * They must not be `children`: `role="tablist"` may only own `role="tab"`,
   * and a stray button inside it is an `aria-required-children` violation
   * that also corrupts the "n of m" position a screen reader announces.
   */
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { children, className, extra, ...rest },
  forwardedRef,
) {
  const ctx = useTabsContext("Tabs.List");
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const rtl = useDirection(listRef);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLUListElement | null>(null);

  React.useImperativeHandle(forwardedRef, () => listRef.current as HTMLDivElement);

  const items = React.useMemo(() => {
    // See TabsRoot: the registry is a ref, and the version is how a change to
    // it is announced.
    void ctx.registryVersion;
    return ctx.triggers.current.map((entry) => entry.item);
  }, [ctx.registryVersion, ctx.triggers]);
  const selectedIndex = indexOfValue(items, ctx.value);

  const elementAt = React.useCallback(
    (index: number) => ctx.triggers.current[index]?.element ?? null,
    [ctx.triggers],
  );

  const indicatorKind = resolveIndicator(ctx.indicator, ctx.variant);
  const indicator = useIndicator({
    listRef,
    getSelected: () => elementAt(selectedIndex),
    enabled: indicatorKind !== "none",
    deps: [selectedIndex, ctx.registryVersion, ctx.variant, ctx.orientation, ctx.size],
  });

  const overflow = useOverflow({
    listRef,
    strategy: ctx.overflow,
    count: items.length,
    selectedIndex,
    deps: [ctx.registryVersion, selectedIndex],
  });

  /* ---------------- keyboard ---------------------------------------- */
  const focusIndex = React.useCallback(
    (index: number) => {
      const element = elementAt(index);
      if (!element) return;
      element.focus({ preventScroll: true });
      // `nearest`, never `center`: centring re-centres the strip on every
      // arrow keypress, which makes a long list feel like it is fighting you.
      const list = listRef.current;
      if (list && list.scrollWidth > list.clientWidth) {
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    },
    [elementAt],
  );

  const onKeyDown = useTabsKeyboard({
    getItems: () => ctx.triggers.current.map((entry) => entry.item),
    getFocusedIndex: () => {
      const active = typeof document === "undefined" ? null : document.activeElement;
      return ctx.triggers.current.findIndex((entry) => entry.element === active);
    },
    focusIndex,
    select: ctx.select,
    close: ctx.onCloseTab,
    reorder: ctx.onReorderTab,
    activation: ctx.activation,
    orientation: ctx.orientation,
    rtl,
    enabled: ctx.roles.arrowKeys && !ctx.pending,
  });

  /* ---------------- overflow menu ------------------------------------ */
  const hidden = ctx.overflow === "menu" ? overflow.overflowIndices : [];
  const hiddenItems = hidden
    .map((index) => items[index])
    .filter((item): item is TabItem => item !== undefined);

  useIsoLayoutEffect(() => {
    if (hidden.length === 0 && menuOpen) setMenuOpen(false);
  }, [hidden.length, menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();
  }, [menuOpen]);

  /* ---------------- collapsed picker --------------------------------- */
  /*
   * Collapsing swaps which control is operable; it does not swap the tree.
   *
   * An earlier version returned a different element entirely, which remounted
   * every trigger, which churned the registry, which re-ran the measurement
   * that decides whether to collapse — an infinite loop reachable from an
   * ordinary narrow container. The tablist now stays mounted and is hidden;
   * `hidden` takes it out of the accessibility tree, so there is still exactly
   * one operable control.
   */
  const collapsed = ctx.overflow === "collapse" && overflow.collapsed && items.length > 0;

  const ListTag = (ctx.roles.listElement === "nav" ? "nav" : "div") as "div";
  const scrollable = ctx.overflow === "scroll";

  const list = (
    <ListTag
      {...rest}
      ref={listRef}
      className={["ox-tabs__list", className].filter(Boolean).join(" ")}
      hidden={collapsed || undefined}
      role={ctx.roles.listRole ?? undefined}
      aria-orientation={ctx.roles.arrowKeys ? ctx.orientation : undefined}
      aria-busy={ctx.pending || undefined}
      data-ox-measured={indicator.measured ? "" : undefined}
      data-ox-list=""
      style={indicator.style}
      onKeyDown={onKeyDown}
    >
      {indicatorKind !== "none" ? (
        <span
          className={indicatorKind === "thumb" ? "ox-tabs__thumb" : "ox-tabs__line"}
          aria-hidden="true"
          data-ox-indicator={indicatorKind}
        />
      ) : null}
      {children}
    </ListTag>
  );

  // Everything that is not a tab lives outside the tablist element.
  const beside =
    ctx.overflow === "menu" && hiddenItems.length > 0 ? (
      <div className="ox-tabs__more">
        <button
          ref={menuButtonRef}
          type="button"
          className="ox-tabs__more-button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-ox-has-selected={hidden.includes(selectedIndex) || undefined}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {ctx.locale.more}
          <span className="ox-tabs__count" aria-hidden="true">
            {hiddenItems.length}
          </span>
          <span className="ox-tabs__sr">
            {interpolate(ctx.locale.moreWithCount, { count: hiddenItems.length })}
          </span>
        </button>
        {/* A real menu, not a second tablist. A tablist split across two
              containers reports an incoherent "n of m". */}
        <ul ref={menuRef} className="ox-tabs__menu" role="menu" hidden={!menuOpen}>
          {hiddenItems.map((item) => (
            <li key={item.value} role="none">
              <button
                type="button"
                role="menuitem"
                className="ox-tabs__menu-item"
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  setMenuOpen(false);
                  ctx.select(item.value, "menu", item);
                }}
              >
                {textOf(item)}
                {typeof item.count === "number" ? (
                  <span className="ox-tabs__count">{item.count}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div
      className="ox-tabs__bar"
      data-ox-start={scrollable ? String(overflow.atStart) : undefined}
      data-ox-end={scrollable ? String(overflow.atEnd) : undefined}
      data-ox-scrollable={scrollable && !collapsed ? "" : undefined}
      data-ox-collapsed={collapsed || undefined}
    >
      {collapsed ? (
        /* A native select, deliberately. It is the only control that already
           has a platform picker on every phone, and re-implementing that in a
           listbox is how you lose the wheel on iOS. */
        <select
          className="ox-tabs__select"
          aria-label={rest["aria-label"]}
          value={ctx.value ?? ""}
          disabled={ctx.pending}
          onChange={(event) => ctx.select(event.target.value, "menu")}
        >
          {items.map((item) => (
            <option key={item.value} value={item.value} disabled={item.disabled}>
              {textOf(item)}
              {typeof item.count === "number" ? ` (${item.count})` : ""}
            </option>
          ))}
        </select>
      ) : null}
      {scrollable && !collapsed ? (
        /* tabIndex -1 on purpose: arrow keys already move selection and scroll
           follows, so putting these in the tab order adds two stops that do
           nothing for a keyboard user. They exist for pointer users who cannot
           see that the strip scrolls. */
        <button
          type="button"
          className="ox-tabs__nudge"
          tabIndex={-1}
          aria-hidden="true"
          disabled={overflow.atStart}
          onClick={() => overflow.scrollBy(-1)}
        >
          ‹
        </button>
      ) : null}
      {list}
      {scrollable && !collapsed ? (
        <button
          type="button"
          className="ox-tabs__nudge"
          tabIndex={-1}
          aria-hidden="true"
          disabled={overflow.atEnd}
          onClick={() => overflow.scrollBy(1)}
        >
          ›
        </button>
      ) : null}
      {collapsed ? null : beside}
      {collapsed ? null : extra}
    </div>
  );
});

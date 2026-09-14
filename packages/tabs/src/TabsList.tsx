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
  observationWindow,
  resolveIndicator,
  textOf,
  type TabItem,
} from "@zoblocks/tabs-core";
import { OverflowedValues, useTabsContext } from "./context.js";
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
  // A long strip pays for its per-trigger observers; past the threshold the
  // list resize carries the load instead.
  const { observeAll } = observationWindow(items.length, selectedIndex);
  const indicator = useIndicator({
    listRef,
    getSelected: () => elementAt(selectedIndex),
    enabled: indicatorKind !== "none",
    observeListOnly: ctx.virtualise || !observeAll,
    // `rtl` is in here because flipping direction mirrors every offset while
    // changing no element's size — so nothing else would ever tell the
    // indicator to move.
    deps: [selectedIndex, ctx.registryVersion, ctx.variant, ctx.orientation, ctx.size, rtl],
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

  /*
   * Focus follows a keyboard-moved tab, by value, once the host re-renders.
   *
   * Focusing at keydown lands on the neighbour still in the target slot, and
   * moving the focused node blurs it in a real browser — either way a second
   * Ctrl+Shift+Arrow moved the wrong tab.
   */
  const movedValue = React.useRef<string | undefined>(undefined);
  const onReorderTab = ctx.onReorderTab;
  const reorder = React.useMemo(
    () =>
      onReorderTab &&
      ((from: number, to: number) => {
        movedValue.current = ctx.triggers.current[from]?.value;
        onReorderTab(from, to);
      }),
    [onReorderTab, ctx.triggers],
  );

  useIsoLayoutEffect(() => {
    const value = movedValue.current;
    movedValue.current = undefined;
    if (value === undefined) return;
    // Only reclaim focus the move dropped; never steal it from elsewhere.
    const index = indexOfValue(items, value);
    const active = document.activeElement;
    if (active !== document.body && active !== elementAt(index)) return;
    focusIndex(index);
  }, [items, elementAt, focusIndex]);

  /* ---------------- overflow menu ------------------------------------ */
  const hidden = ctx.overflow === "menu" ? overflow.overflowIndices : [];
  const hiddenItems = hidden
    .map((index) => items[index])
    .filter((item): item is TabItem => item !== undefined);

  /*
   * A tab in the More menu leaves the strip.
   *
   * The menu used to be a copy: every overflowed tab showed twice, and the
   * arrow keys walked into it. Its trigger stays mounted and registered, only
   * hidden, so a re-fit never churns the registry. The selected tab is pinned
   * by the fitter, and excluded here as well.
   */
  const overflowedKey = JSON.stringify(
    hiddenItems.map((item) => item.value).filter((value) => value !== ctx.value),
  );
  const overflowed = React.useMemo(
    () => new Set(JSON.parse(overflowedKey) as string[]),
    [overflowedKey],
  );
  const inStrip = () => ctx.triggers.current.filter((entry) => !overflowed.has(entry.value));
  // The keyboard model counts strip tabs only; map its indices to the registry.
  const registryIndex = (stripIndex: number) => {
    const entry = inStrip()[stripIndex];
    return entry ? ctx.triggers.current.indexOf(entry) : -1;
  };

  const onKeyDown = useTabsKeyboard({
    getItems: () => {
      // Checked at lookup time too, for a memoised trigger that moved without
      // re-rendering.
      ctx.orderRegistry();
      return inStrip().map((entry) => entry.item);
    },
    getFocusedIndex: () => {
      const active = typeof document === "undefined" ? null : document.activeElement;
      return inStrip().findIndex((entry) => entry.element === active);
    },
    focusIndex: (index: number) => focusIndex(registryIndex(index)),
    select: ctx.select,
    close: ctx.onCloseTab,
    reorder:
      reorder && ((from: number, to: number) => reorder(registryIndex(from), registryIndex(to))),
    activation: ctx.activation,
    orientation: ctx.orientation,
    rtl,
    enabled: ctx.roles.arrowKeys && !ctx.pending,
  });

  // APG menu keys. Escape is handled at the document, below.
  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    // Focus moves on by itself; a menu left open behind it is the bug.
    if (event.key === "Tab") {
      setMenuOpen(false);
      return;
    }
    const entries = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("[role='menuitem']"),
    );
    const current = entries.indexOf(document.activeElement as HTMLElement);
    const last = entries.length - 1;
    const next =
      event.key === "ArrowDown"
        ? current >= last
          ? 0
          : current + 1
        : event.key === "ArrowUp"
          ? current <= 0
            ? last
            : current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    entries[next]?.focus();
  };

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
      className={["zb-tabs__list", className].filter(Boolean).join(" ")}
      hidden={collapsed || undefined}
      role={ctx.roles.listRole ?? undefined}
      aria-orientation={ctx.roles.arrowKeys ? ctx.orientation : undefined}
      aria-busy={ctx.pending || undefined}
      data-zb-measured={indicator.measured ? "" : undefined}
      data-zb-list=""
      style={indicator.style}
      onKeyDown={onKeyDown}
    >
      {indicatorKind !== "none" ? (
        <span
          className={indicatorKind === "thumb" ? "zb-tabs__thumb" : "zb-tabs__line"}
          aria-hidden="true"
          data-zb-indicator={indicatorKind}
        />
      ) : null}
      <OverflowedValues.Provider value={overflowed}>{children}</OverflowedValues.Provider>
    </ListTag>
  );

  // Everything that is not a tab lives outside the tablist element.
  const beside =
    ctx.overflow === "menu" && hiddenItems.length > 0 ? (
      <div className="zb-tabs__more">
        <button
          ref={menuButtonRef}
          type="button"
          className="zb-tabs__more-button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-zb-has-selected={hidden.includes(selectedIndex) || undefined}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {ctx.locale.more}
          <span className="zb-tabs__count" aria-hidden="true">
            {hiddenItems.length}
          </span>
          <span className="zb-tabs__sr">
            {interpolate(ctx.locale.moreWithCount, { count: hiddenItems.length })}
          </span>
        </button>
        {/* A real menu, not a second tablist. A tablist split across two
              containers reports an incoherent "n of m". */}
        <ul
          ref={menuRef}
          className="zb-tabs__menu"
          role="menu"
          hidden={!menuOpen}
          onKeyDown={onMenuKeyDown}
        >
          {hiddenItems.map((item) => (
            <li key={item.value} role="none">
              <button
                type="button"
                role="menuitem"
                // Arrow keys move within the menu; Tab leaves it.
                tabIndex={-1}
                className="zb-tabs__menu-item"
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  setMenuOpen(false);
                  ctx.select(item.value, "menu", item);
                }}
              >
                {textOf(item)}
                {typeof item.count === "number" ? (
                  <span className="zb-tabs__count">{item.count}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div
      className="zb-tabs__bar"
      data-zb-start={scrollable ? String(overflow.atStart) : undefined}
      data-zb-end={scrollable ? String(overflow.atEnd) : undefined}
      data-zb-scrollable={scrollable && !collapsed ? "" : undefined}
      data-zb-collapsed={collapsed || undefined}
    >
      {collapsed ? (
        /* A native select, deliberately. It is the only control that already
           has a platform picker on every phone, and re-implementing that in a
           listbox is how you lose the wheel on iOS. */
        <select
          className="zb-tabs__select"
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
          className="zb-tabs__nudge"
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
          className="zb-tabs__nudge"
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
